#!/usr/bin/env python3
"""船のページ（wiki/ships）のデータ ships-list.json を、assets.xml から作る。

使い方: python tools/build-ships-data.py   （そのあと bun run build:site）
読み先: _local/anno-official-data/v3.0.1-steam/assets.xml（tools/assets_resolver.py）・texts_japanese.xml・商品名（tools/assets_economy.py）
出力  : apps/wiki/docs/wiki/ships-list.json

載せる船は、造船所の建造メニュー（Recruitment/AssemblyOptions）に出るものだけ。
  - ラティウム・アルビオン・アイギュプトの海の船（ペンテコンター・トライリーメ・クィンクェレメ。構成は民間と軍団）
  - アイギュプトのナイルの造船所の川船（エポルキオン・アバ）
イベントやクエスト専用の船は、建造費の資産があっても載せない。

資産の読み方の約束:
  - 費用・維持費は番号つきの枠(Item[n])。数量が書かれていない枠は 0（使わない品物）として扱う
  - 海の船は地域が違っても数値が同じで、維持費の労働力の種類だけが違う（ラティウム=リベルトゥス・アルビオン=ウェーダー・アイギュプト=麦打ち人）
  - 川船はモジュール改造ができない（ゲーム内の文言）
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.stdout.reconfigure(encoding="utf-8")
from assets_resolver import Resolver  # noqa: E402
import assets_economy as eco  # noqa: E402
import assets_techs as techs_mod  # noqa: E402
import assets_texts as at  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/wiki/docs/wiki/ships-list.json"
DENARII = 1010017

R = Resolver()
JA = at.load_texts("japanese")

PRODUCT = {int(p["guid"]): at.strip_zw(p["loca"]["japanese"]) for p in eco.load_products()["products"]}
WORKFORCE = {int(w["guid"]): at.strip_zw(w["loca"]["japanese"]) for w in eco.load_population()["workforce"]}


def ja(text_id):
    return at.strip_zw(JA.get(int(text_id), "")) if text_id else ""


def name_of(guid):
    """資産の表示名（ゲーム内の日本語。/Text/OasisId）。名前を自分で付けず、ゲームの表記をそのまま使う"""
    return ja(R.get(guid)["v"].get("/Text/OasisId"))


def shipyard_configs(yard_guid):
    """造船所の建造メニューにある編成を {船体GUID: [編成名(民間 I など)]} で返す"""
    out = {}
    v = R.get(yard_guid)["v"]
    for i in range(16):
        cfg = v.get(f"/Recruitment/AssemblyOptions/Item[{i}]/Vehicle")
        if not cfg:
            continue
        cv = R.get(int(cfg))["v"]
        hull = int(cv["/ShipConfiguration/ShipHullGUID"])
        out.setdefault(hull, []).append(ja(cv.get("/ShipConfiguration/DefaultConfigurationName")))
    return out


def num(s, default=0.0):
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def clean(x):
    return int(x) if float(x).is_integer() else x


def items(v, base, key):
    """番号つきの枠から (ID, 数量) を返す。数量が無い枠は使わない品物なので除く"""
    out = []
    for i in range(16):
        ident, amt = v.get(f"{base}/Item[{i}]/{key}"), v.get(f"{base}/Item[{i}]/Amount")
        if ident and amt and num(amt) > 0:
            out.append((int(ident), num(amt)))
    return out


def cost_list(pairs):
    return [{"name": PRODUCT.get(pid, str(pid)), "amount": clean(amt)} for pid, amt in pairs]


def upkeep_list(pairs):
    """維持費。デナリウスと労働力（種類は地域で違うので「労働力」とまとめる）"""
    out = []
    for pid, amt in pairs:
        out.append({"name": "デナリウス" if pid == DENARII else "労働力", "amount": clean(amt)})
    return out


def workforce_of(v):
    for pid, _ in items(v, "/Maintenance/Maintenances", "Product"):
        if pid != DENARII:
            return WORKFORCE.get(pid, str(pid))
    return None


def tech_unlocking(name_en):
    """英語名で、解放する研究の日本語名を返す"""
    for t in techs_mod.load_techs()["techs"]:
        for u in t.get("unlocks") or []:
            if u.get("english") == name_en:
                return at.strip_zw(t["loca"]["japanese"])
    return None


def minutes(ms):
    return clean(round(num(ms) / 60000, 2))


def common(v):
    return {
        "health": clean(num(v.get("/Health/BaseHealth"))),
        "speed": clean(num(v.get("/Movement/BaseSpeed"))),
        "slots": clean(num(v.get("/ItemContainer/SlotCount"))),
        "stack": clean(num(v.get("/ItemContainer/StackLimit"))),
        "buildMinutes": minutes(v.get("/Craftable/CraftingTime")),
        "cost": cost_list(items(v, "/Cost/Costs", "Ingredient")),
        "upkeep": upkeep_list(items(v, "/Maintenance/Maintenances", "Product")),
        "war": clean(num(v.get("/MilitaryScoreRating/MilitaryShipPoints"))),
        "trade": clean(num(v.get("/MilitaryScoreRating/TradeShipPoints"))),
    }


# 実機（PS5）で確かめた表示（2026-11-22。ナイルの造船所のメニュー）。換算式がデータに無く、速度は実機の表示をそのまま載せる。
# 航行速度は [最小, 最大]（ペース/秒）。条件（風・積荷・損傷）で幅が出る。川の速度も同じ。
# 参考: 海の航行速度は 最大 = 基本速度 x 4.8 x 1.4(追い風)、最小 = 基本速度 x 4.8 x 0.7 x 0.7 x 0.5(向かい風・満載・大破) で、
#       エポルキオン(4.77)・アバ(4.3)の実機の4つの値と一致した（海の船3種の実機確認はまだ）。川の速度の式は分からない
MEASURED = {
    "epholkion": {"sail": [6, 32], "river": [45, 90], "slots": 3},
    "aba-civil": {"sail": [5, 29], "river": [40, 81], "slots": 5},
    # 軍団 II は、設置済みのモジュール(クマトの弓兵)が1枠を使うので、積荷スロットが4
    "aba-military": {"sail": [5, 29], "river": [40, 81], "slots": 4, "fitted": ["クマトの弓兵"]},
}

REGION_JA = {"latium": "ラティウム", "albion": "アルビオン", "aegyptus": "アイギュプト"}

# --- 海の船（地域ごとの船体。数値は共通で、労働力の種類だけが違う） ---
SEA = [
    # key, ラティウム, アルビオン, アイギュプト, 解放する研究の英語名
    ("penteconter", 37222, 39572, 150441, None),
    ("trireme", 37223, 39571, 150442, "Trireme"),
    ("quinquireme", 37224, 39570, 150443, "Quinquireme"),
]
YARD_LATIUM = 6054  # ラティウムの造船所（アルビオン・アイギュプトの造船所も、編成の名前は同じ並び）
sea_configs = shipyard_configs(YARD_LATIUM)
ships = []
for key, lat, alb, aeg, unlock in SEA:
    base = R.get(lat)["v"]
    name = name_of(lat)
    rec = {"id": key, "name": name, "kind": "sea", "configs": sea_configs[lat], "desc": ja(base.get("/Standard/InfoDescription")), **common(base)}
    rec["modSlots"] = clean(num(base.get("/ShipModuleOwner/MaximumModificationCount")))
    rec["unlock"] = tech_unlocking(unlock) if unlock else None
    wf = {REGION_JA["latium"]: workforce_of(base), REGION_JA["albion"]: workforce_of(R.get(alb)["v"]), REGION_JA["aegyptus"]: workforce_of(R.get(aeg)["v"])}
    rec["workforce"] = wf
    rec["sail"], rec["river"], rec["fitted"] = None, None, []  # 海の船の速度は、実機の確認がまだ
    # 地域間で、数値が本当に同じかを確かめる（違えば、このスクリプトの前提が崩れている）
    for other in (alb, aeg):
        o = common(R.get(other)["v"])
        same = {k: o[k] for k in ("health", "speed", "slots", "buildMinutes", "cost", "war", "trade")}
        mine = {k: rec[k] for k in same}
        if same != mine:
            sys.exit(f"地域で数値が違います: {name} {other}\n{mine}\n{same}")
    rec["regions"] = list(REGION_JA.values())
    ships.append(rec)

# --- ナイルの川船（アイギュプトのナイルの造船所の建造メニュー） ---
RIVER = [
    # key, 船体GUID, 解放する研究の英語名。編成名（民間 I・民間 II・軍団 II）は、造船所の建造メニューの順に対応させる
    ("epholkion", 154038, None),
    ("aba-civil", 178644, "Aba (Nile Galley)"),
    ("aba-military", 157051, "Aba (Nile Galley)"),
]
YARD_NILE = 154720
river_configs = shipyard_configs(YARD_NILE)
# 建造メニューの編成の船体: 小型=154038、中型民間=178644、中型軍用=157051
RIVER_CFG = {"epholkion": river_configs[154038][0], "aba-civil": river_configs[178644][0], "aba-military": river_configs[157051][0]}
for key, guid, unlock in RIVER:
    v = R.get(guid)["v"]
    name = f"{name_of(guid)} {RIVER_CFG[key]}"
    rec = {"id": key, "name": name, "kind": "river", "configs": [RIVER_CFG[key]], "desc": ja(v.get("/Standard/InfoDescription")), **common(v)}
    rec["modSlots"] = 0  # ナイルの船にはモジュール改造を行えない（ゲーム内の文言）
    rec["unlock"] = tech_unlocking(unlock) if unlock else None
    rec["workforce"] = {REGION_JA["aegyptus"]: workforce_of(v)}
    rec["regions"] = [REGION_JA["aegyptus"]]
    m = MEASURED[key]
    rec["sail"], rec["river"], rec["slots"], rec["fitted"] = m["sail"], m["river"], m["slots"], m.get("fitted", [])
    ships.append(rec)

# --- 海の船のモジュール ---
MODULES = [
    # key, ラティウム, アルビオン, アイギュプト, 解放する研究の英語名
    ("mast", 31647, 39574, 157318, None),
    ("rows", 31648, 39575, 157319, None),
    ("hull", 31649, 39576, 157320, "Plated Hulls"),
    ("archers", 31651, 39577, 157321, None),
    ("scorpion", 31652, 39578, 157322, "Shipboard Scorpiones"),
    ("catapult", 31653, 39579, 157323, "Ship Catapults"),
]
modules = []
for key, lat, alb, aeg, unlock in MODULES:
    v = R.get(lat)["v"]
    name = name_of(lat)
    rec = {
        "id": key,
        "name": name,
        "desc": ja(v.get("/Standard/InfoDescription")),
        "buildMinutes": minutes(v.get("/Craftable/CraftingTime")),
        "cost": cost_list(items(v, "/Cost/Costs", "Ingredient")),
        "upkeep": upkeep_list(items(v, "/Maintenance/Maintenances", "Product")),
        "war": clean(num(v.get("/MilitaryScoreRating/MilitaryShipPoints"))),
        "sell": clean(num(v.get("/Sellable/Baseprice/Item[0]/Amount"))),
        "unlock": tech_unlocking(unlock) if unlock else None,
        "workforce": {REGION_JA["latium"]: workforce_of(v), REGION_JA["albion"]: workforce_of(R.get(alb)["v"]), REGION_JA["aegyptus"]: workforce_of(R.get(aeg)["v"])},
    }
    for other in (alb, aeg):
        o = R.get(other)["v"]
        if items(o, "/Cost/Costs", "Ingredient") != items(v, "/Cost/Costs", "Ingredient") or num(o.get("/MilitaryScoreRating/MilitaryShipPoints")) != num(v.get("/MilitaryScoreRating/MilitaryShipPoints")):
            sys.exit(f"地域でモジュールの数値が違います: {name} {other}")
    modules.append(rec)

# アイギュプト専用の弓兵（アイギュプトの軍団 II の編成に設置済み。費用は武器5だけ。実機で確認）
kv = R.get(166548)["v"]
modules.append({
    "id": "kumato-archers",
    "name": name_of(166548),
    "desc": ja(kv.get("/Standard/InfoDescription")),
    "buildMinutes": None,
    "cost": cost_list(items(kv, "/Cost/Costs", "Ingredient")),
    "upkeep": [],
    "war": clean(num(kv.get("/MilitaryScoreRating/MilitaryShipPoints"))),
    "sell": clean(num(kv.get("/Sellable/Baseprice/Item[0]/Amount"))),
    "unlock": None,
    "workforce": {REGION_JA["aegyptus"]: None},
    "regions": [REGION_JA["aegyptus"]],
})

OUT.write_text(json.dumps({"ships": ships, "modules": modules}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"船 {len(ships)}種・モジュール {len(modules)}種 → {OUT}")
for s in ships:
    print(s["name"], s["health"], s["speed"], s["slots"], s["buildMinutes"], s["cost"], s["upkeep"], s["war"], s["trade"], s["unlock"], s["workforce"])
for m in modules:
    print(m["name"], m["cost"], m["upkeep"], m["war"], m["sell"], m["unlock"], m["workforce"])
