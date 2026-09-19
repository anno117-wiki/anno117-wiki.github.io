#!/usr/bin/env python3
"""生産チェーンごとの「100%効率の建物数の比率」を生成する。

- 建物の構成(どの建物がどの建物へ供給するか)は packages/shared/public/productions/*.json の木構造を使う
- 数値(サイクルタイム・入出力の数量・燃料)は公式 assets.xml(v2.1)から取り、JSONの値と突き合わせる
- 出力: apps/wiki/docs/wiki/chain-ratios.json (表示は ProductionChainSvg.vue)
- 実行には _local/anno-official-data/v2.1/assets.xml が必要

比率の考え方:
  親の建物 kP 軒が使う原料 q は kP * (入力量 / サイクル秒) 。子の建物1軒の産出は (産出量 / サイクル秒)。
  よって子の必要数 kC = kP * (入力量 / 親サイクル) / (産出量 / 子サイクル)。
  根(最終商品の建物)を1として計算し、全ての建物数が整数になる最小の倍率で掛ける。
  燃料: 燃料が要る建物1軒あたり、炭焼き師 = (炭焼き師のサイクル秒 / 燃料の燃焼秒) 軒。
  建物ごとの炭焼き師の数を "fuel" として出力する(燃料が要る建物のみ)。
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
ASSETS = BASE / "_local/anno-official-data/v2.1/assets.xml"
PRODUCTIONS = BASE / "packages/shared/public/productions"
OUT = BASE / "apps/wiki/docs/wiki/chain-ratios.json"

# 炭焼き師のサイクル(秒)。assets.xml に記載が無い(山系施設の標準値)ため、実機確認値を使う。
CHARCOAL_BURNER_CYCLE = 30
MAX_SCALE = 60  # 整数化のために掛ける倍率の上限


def load_assets():
    """GUID -> {cycle, inputs{product:amount}, outputs{product:amount}, needs_fuel} と、燃料の燃焼秒。"""
    if not ASSETS.exists():
        sys.exit(f"assets.xml が見つかりません: {ASSETS}")
    root = ET.parse(ASSETS).getroot()
    buildings = {}
    fuel_seconds = None
    for asset in root.iter("Asset"):
        values = asset.find("Values")
        if values is None:
            continue
        guid = values.findtext("Standard/GUID")
        fuel = values.find(".//Fuel/Products/Item")
        if fuel is not None and fuel_seconds is None:
            fuel_seconds = int(fuel.findtext("ProductionTime")) / 1000
        fb = values.find("FactoryBase")
        if fb is None or not guid:
            continue

        def items(tag):
            out = {}
            for it in fb.findall(f"{tag}/Item"):
                out[it.findtext("Product")] = int(it.findtext("Amount") or 1)
            return out

        cycle = fb.findtext("CycleTime")
        buildings[guid] = {
            "cycle": int(cycle) if cycle else None,
            "inputs": items("FactoryInputs"),
            "outputs": items("FactoryOutputs"),
            "needs_fuel": fb.findtext("NeedsFuelInput") == "1",
        }
    if fuel_seconds is None:
        sys.exit("assets.xml から燃料の燃焼時間が取得できません")
    return buildings, fuel_seconds


def node_id(raw):
    return re.sub(r"[^a-zA-Z0-9_]", "_", raw)


def compute(tree, assets, warnings):
    """木を辿り {nodeId: Fraction 軒数, ...} と、燃料が要る建物の {nodeId: Fraction 軒数, ...} を返す(根=1)。"""
    counts = {}
    fuel_nodes = {}

    def visit(node, k, parent_asset, parent_node):
        nid = node_id(node["id"])
        asset = assets.get(str(node.get("guid")))
        if asset is None:
            warnings.append(f"{node['id']}: guid {node.get('guid')} が assets.xml に無い(FactoryBaseなし)")
            counts[nid] = counts.get(nid, Fraction(0)) + k
            return
        cycle = asset["cycle"]
        if cycle is None:
            cycle = node.get("time")
            warnings.append(f"{node['id']}: assets.xml にサイクル記載なし、JSONの{cycle}秒を使用")
        elif node.get("time") not in (None, cycle):
            warnings.append(f"{node['id']}: サイクル不一致 JSON={node.get('time')} assets={cycle}")
        counts[nid] = counts.get(nid, Fraction(0)) + k
        if asset["needs_fuel"]:
            fuel_nodes[nid] = fuel_nodes.get(nid, Fraction(0)) + k
        if asset["needs_fuel"] != bool(node.get("needs_fuel")):
            warnings.append(f"{node['id']}: 燃料要否が不一致 JSON={node.get('needs_fuel')} assets={asset['needs_fuel']}")

        for child in node.get("input", []):
            casset = assets.get(str(child.get("guid")))
            if casset is None:
                visit(child, Fraction(0), asset, node)
                continue
            # 子の産出のうち、親の入力にある原料を特定する
            shared = [p for p in casset["outputs"] if p in asset["inputs"]]
            if not shared:
                warnings.append(f"{node['id']} <- {child['id']}: 親の入力と子の産出が一致する原料が無い")
                visit(child, Fraction(0), asset, node)
                continue
            p = shared[0]
            ccycle = casset["cycle"] or child.get("time") or 30
            need_per_sec = k * Fraction(asset["inputs"][p], cycle)
            supply_per_sec = Fraction(casset["outputs"][p], ccycle)
            visit(child, need_per_sec / supply_per_sec, asset, node)

    visit(tree, Fraction(1), None, None)
    return counts, fuel_nodes


def scale_to_integers(counts):
    for m in range(1, MAX_SCALE + 1):
        if all((v * m).denominator == 1 for v in counts.values()):
            return m
    return None


def fmt(fr):
    v = float(fr)
    return int(v) if v == int(v) else round(v, 2)


def main():
    assets, fuel_seconds = load_assets()
    result = {}
    for path in sorted(PRODUCTIONS.glob("*.json")):
        if path.name == "list.json":
            continue
        tree = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(tree, dict) or "id" not in tree:
            continue
        warnings = []
        counts, fuel_nodes = compute(tree, assets, warnings)
        m = scale_to_integers(counts)
        entry = {"warnings": warnings}
        if m is None:
            entry["ok"] = False
            warnings.append(f"倍率{MAX_SCALE}以内で整数比にならない")
            m = 1
        else:
            entry["ok"] = True
        entry["scale"] = m
        entry["counts"] = {k: fmt(v * m) for k, v in counts.items()}
        burners_per_building = Fraction(CHARCOAL_BURNER_CYCLE) / Fraction(int(fuel_seconds))
        entry["fuel"] = {k: fmt(v * m * burners_per_building) for k, v in fuel_nodes.items()}
        result[path.stem] = entry

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    bad = [k for k, v in result.items() if not v["ok"]]
    warned = {k: v["warnings"] for k, v in result.items() if v["warnings"]}
    print(f"{len(result)}件を出力 -> {OUT}")
    print(f"燃料の燃焼時間: {fuel_seconds}秒(assets.xml)")
    print(f"整数比にならない: {bad}")
    print(f"警告あり: {len(warned)}件")
    for k, w in list(warned.items())[:15]:
        print(f"  {k}:")
        for line in w[:4]:
            print(f"    - {line}")


if __name__ == "__main__":
    main()
