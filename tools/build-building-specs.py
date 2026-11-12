"""建物データページ(wiki/building-specs)用のJSONを作る。

元データ: _local/anno-official-data/v3.0-planner/buildings.json と products.json (Planner 3.0)、
労働力の名前だけ official_master.csv と population.json
出力: apps/wiki/docs/wiki/building-specs-list.json

対象は「案A」: 装飾品・防衛施設・地面の模様・景観の模様・道を除いた建物。
日本語文字列は単語間にゼロ幅スペース(U+200B)が入っているので除去する。
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_local" / "anno-official-data" / "v3.0-planner"
MASTER_CSV = ROOT / "_local" / "anno-official-data" / "official_master.csv"
OUT = ROOT / "apps" / "wiki" / "docs" / "wiki" / "building-specs-list.json"

# 除外する分類(Planner の英語分類名)
EXCLUDED_CATEGORIES = {
    "Ornament",
    "Defensive Building",
    "Ground Patterns",
    "Landscaping Patterns",
    "Road",
}
# システム側(NPC)の港とピラミッドの波止場。プレイヤーが建てるものではないので載せない(ユーザー指示 2026-11-10)
EXCLUDED_GUIDS = {
    33048,  # ウァレリアのマリーナ
    155936,  # クロコピス
    37204,  # マンクスの港
    145104,  # カエシリアの港
    33047,  # ディアナの港
    37203,  # 行政官の港
    153121,  # ナウクラティス港
    154552,  # ピラミッドの波止場
    # 円形闘技場・競馬場の建設途中の段階(完成した建物の行に建設費の合計がある)
    97847, 97848, 97849,  # キャンペーン用の闘技場: 基礎・外壁・闘技場
    36908, 36911, 36912,  # 円形闘技場(闘技場の名前の段階): 基礎・外壁・闘技場
    153790, 153791, 153792, 153793,  # 競馬場: 基礎・追跡する・ファサードとアーチ・観客席とロッジ
}
REGION_JA = {"Roman": "ラティウム", "Celtic": "アルビオン", "Egyptian": "アイギュプト"}
REGION_ORDER = ["Roman", "Celtic", "Egyptian"]


def clean(text):
    return text.replace("​", "").strip() if isinstance(text, str) else ""


def ja(loca):
    return clean((loca or {}).get("japanese", ""))


def load(name):
    with open(SRC / name, encoding="utf-8") as f:
        return json.load(f)


def product_names(products_json, population_json):
    names = {p["guid"]: ja(p["loca"]) for p in products_json["products"]}
    # 労働力(住民層ごとの商品)は products.json に無いので、公式の一覧表(guid,種別,内部名,アイコン,英名,日本語名)から補う
    with open(MASTER_CSV, encoding="utf-8", newline="") as f:
        for row in csv.reader(f):
            if len(row) >= 6 and row[0].isdigit() and row[1] == "Product":
                names.setdefault(int(row[0]), row[5].strip())
    # アイギュプトの労働力は上にも無いので、住民層の名前から「○○の労働力」と作る(既存の命名に合わせる)
    for level in population_json["populationLevels"]:
        workforce = level.get("workforce")
        if workforce and ja(level.get("loca")):
            names.setdefault(workforce, f"{ja(level['loca'])}の労働力")
    return names


def costs(entries, names):
    result = []
    for e in entries or []:
        name = names.get(e["product"])
        if not name:
            raise ValueError(f"商品名が見つかりません: {e['product']}")
        result.append({"name": name, "amount": e["amount"]})
    return result


def generalize_workforce(entries):
    """住民層ごとの労働力(リベルトゥスの労働力など)を「労働力」にそろえる。地域をまたいで同じ行にまとめるため"""
    return [
        {"name": "労働力" if e["name"].endswith("労働力") else e["name"], "amount": e["amount"]}
        for e in entries
    ]


def placement(b):
    # 水上(waterBuilding)は、Planner 3.0 では723件すべて未設定
    labels = []
    # 氾濫原限定は印が無いので、内部名の「Riverbank」で判別する(ユーザー確認 2026-11-10: 川岸の建物は全て氾濫原限定)
    if "Riverbank" in (b.get("name") or ""):
        labels.append("氾濫原限定")
    if b.get("riverBuilding"):
        labels.append("川スロット")
    if b.get("mountainBuilding"):
        labels.append("山スロット")
    return labels


# 実機(PS5)で測った基本距離(砂利道でつないだときのタイル数)。元データと違うときは実機を優先する
MEASURED_STREET_DISTANCE = {
    153592: 25,  # レプリカのスフィンクスの祭壇(元データ27。2026-11-12 ユーザー実測)
    144812: 19,  # ウルカヌスの祭壇・全地域の行(元データ20。2026-11-12 ユーザーがアイギュプトの砂利道で実測。アルビオン専用の 144813 は未測定)
}


def radius_text(b):
    if b["guid"] in MEASURED_STREET_DISTANCE:
        return f"基本距離{MEASURED_STREET_DISTANCE[b['guid']]}タイル（実機）"
    r = b.get("radius")
    if not r:
        return ""
    if r["type"] == "Radius":
        return f"半径{r['value']:g}タイル"
    if r["type"] == "StreetDistance":
        # 基本距離: 砂利道でつないだときの距離(元データの値)。舗装道・大理石の道では、これより遠くまで届く
        return f"基本距離{r['value']:g}タイル"
    raise ValueError(f"未知の範囲の種類: {r['type']} (guid {b['guid']})")


def build_row(b, names):
    category = b.get("category")
    regions = [r for r in REGION_ORDER if r in (b.get("regions") or [])]
    return {
        "guid": str(b["guid"]),
        "name": ja(b.get("loca")),
        "nameEn": (b.get("loca") or {}).get("english", ""),
        "category": ja(category),
        "regions": [REGION_JA[r] for r in regions],
        "width": b["width"],
        "height": b["height"],
        "radius": radius_text(b),
        "placement": placement(b),
        "construction": costs(b.get("constructionCosts"), names),
        "maintenance": generalize_workforce(costs(b.get("maintenanceCosts"), names)),
    }


def merge_same_rows(rows):
    """地域以外の内容が全て同じ行を1つにまとめ、地域を並べる(ラティウム・アルビオン等)"""
    merged = {}
    for row in rows:
        key = json.dumps({k: v for k, v in row.items() if k not in ("guid", "regions", "nameEn")}, ensure_ascii=False, sort_keys=True)
        if key in merged:
            first = merged[key]
            first["regions"] = [r for r in REGION_JA.values() if r in first["regions"] or r in row["regions"]]
        else:
            merged[key] = row
    return list(merged.values())


def main():
    buildings = load("buildings.json")
    names = product_names(load("products.json"), load("population.json"))
    rows = []  # 名前・分類・地域のどれかが無いもの(スタンプ等、建物でないもの)は載せない
    for b in buildings.values():
        category = (b.get("category") or {}).get("english")
        if category in EXCLUDED_CATEGORIES or b["guid"] in EXCLUDED_GUIDS:
            continue
        row = build_row(b, names)
        if not row["name"] or not row["category"] or not row["regions"]:
            continue
        rows.append(row)
    rows = merge_same_rows(rows)
    rows.sort(key=lambda r: (r["category"], r["name"], r["guid"]))
    categories = sorted({r["category"] for r in rows if r["category"]})
    OUT.write_text(
        json.dumps({"categories": categories, "buildings": rows}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"建物 {len(rows)} 件 / 分類 {len(categories)} 種 -> {OUT}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as e:
        print(f"失敗: {e}", file=sys.stderr)
        sys.exit(1)
