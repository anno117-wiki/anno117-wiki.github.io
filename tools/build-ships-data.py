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


def upkeep_list(pairs, named=False):
    """維持費。デナリウスと労働力。named=True なら労働力を種類の名前（リベルトゥスの労働力など）で出す。
    モジュールは地域をまたぐので、「労働力」とまとめる（種類は別の表）"""
    out = []
    for pid, amt in pairs:
        if pid == DENARII:
            name = "デナリウス"
        else:
            name = WORKFORCE.get(pid, str(pid)) if named else "労働力"
        out.append({"name": name, "amount": clean(amt)})
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
    "epholkion": {"money": 12, "sail": [6, 32], "river": [45, 90], "slots": 3},
    "aba-civil": {"money": 42, "sail": [5, 29], "river": [40, 81], "slots": 5},
    # 軍団 II は、設置済みのモジュール(クマトの弓兵)が1枠を使うので、積荷スロットが4
    "aba-military": {"money": 85, "sail": [5, 29], "river": [40, 81], "slots": 4, "fitted": ["クマトの弓兵"]},
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
    rec["upkeep"] = upkeep_list(items(v, "/Maintenance/Maintenances", "Product"), named=True)
    rec["workforce"] = {REGION_JA["aegyptus"]: workforce_of(v)}
    rec["regions"] = [REGION_JA["aegyptus"]]
    m = MEASURED[key]
    base_money = next(u["amount"] for u in rec["upkeep"] if u["name"] == "デナリウス")
    if int(base_money * 1.22) != m["money"]:
        sys.exit(f"維持費が合いません: {name} 基本 {base_money} x1.22 実機 {m['money']}")
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
def buff_value(buff_guid, path):
    return num(R.get(buff_guid)["v"].get(path))


def module_effect(key, v):
    """マスト・オール・船体装甲の効果の文。数値は、モジュールの効果（Effect/Buffs）の資産から読む。他のモジュールは効果なし(None)"""
    if key not in ("mast", "rows", "hull"):
        return None
    b = int(v["/Effect/Buffs/Item[0]/GUID"])
    m = "/MovementUpgrade/"
    if key == "mast":
        return f"追い風のときの速度の上乗せが{clean(-buff_value(b, m + 'BuffReducePositiveWindImpactUpgrade/Value'))}%増える（風の係数 1.4 が 1.7 になる）"
    if key == "rows":
        return f"向かい風の悪影響を{clean(buff_value(b, m + 'BuffReduceNegativeWindImpactUpgrade/Value'))}%なくす（風の係数 0.7 が 1.0 になる）。川の流れに逆らうときの悪影響も{clean(buff_value(b, m + 'BuffReduceNegativeRiverCurrentImpactUpgrade/Value'))}%減る"
    hp = clean(buff_value(b, "/HealthUpgrade/BaseHealthUpgrade/Value"))
    sp = clean(buff_value(b, m + "BuffBaseSpeedUpgrade/Value"))
    return f"ヒットポイントが{hp}%増える。航行速度は、風の係数から{abs(sp) / 100}を引いた分になる（約{abs(sp)}%遅くなる）"


# --- モジュールの戦闘値（ユニットの資産 ShipModuleElement から。実機の画面では未確認） ---
# 防御側の種別は、データ上の分類名。ゲーム内の表記が分からないので、こちらで日本語にした
DEFENDER_JA = {
    "InfantryTroop": "歩兵", "CavalryTroop": "騎兵", "ArtilleryTroop": "砲兵", "Ship": "船",
    "ReinforcedWall": "補強した壁", "Palisade": "柵", "DefenseBuilding": "防衛施設",
    "MilitaryBuilding": "軍事施設", "CivilianBuilding": "民間の建物",
}
PIERCE_HALF, PIERCE_IGNORE = "DefenseHalfed", "DefenseIgnored"


def attack_text(unit, mode):
    """ユニットの攻撃（Range=通常、Torch=松明）の値。無ければ None"""
    base = f"/BaseElement/AttackBehaviors/{mode}/AttackBehavior/"
    if unit.get(base + "Template") == "AttackBehaviorNone" or not unit.get(base + "Values/AttackBehavior/AttackType"):
        return None
    beh = base + "Values/AttackBehavior/"
    at = R.get(int(unit[beh + "AttackType"]))["v"]
    cooldown = num(unit.get(beh + "AttackCooldown")) / 1000
    rec = {
        "range": clean(num(unit.get(beh + "RangeAttack_BtB"))),
        "cooldown": clean(cooldown),
        "perMinute": clean(round(60 / cooldown, 1)),
        "damage": clean(num(at.get("/AttackType/BaseDamage"))),
        "crit": [clean(num(at.get("/AttackType/CriticalChance100"))), clean(num(at.get("/AttackType/CriticalDamage")))],
        "targets": [DEFENDER_JA.get(t, t) for t in (unit.get(beh + "DefenderTypes") or "").split(";") if t],
    }
    if mode == "Range":
        rv = base + "Values/AttackBehaviorRanged/"
        rec["attack"] = clean(num(unit.get(rv + "OffenseValue")))
        rec["accuracy"] = clean(num(unit.get(rv + "Accuracy")))
        mod = R.get(int(unit[beh + "AttackModifier"]))["v"] if unit.get(beh + "AttackModifier") else {}
        pierce = []
        if mod.get("/AttackModifier/ArmorPiercingType") == PIERCE_HALF:
            pierce.append("装甲・盾の防御を半減")
        if mod.get("/AttackModifier/BaseDefensePiercingType") == PIERCE_IGNORE:
            pierce.append("基本防御を無視")
        rec["pierce"] = pierce
    return rec


def combat_of(unit_guid):
    u = R.get(unit_guid)["v"]
    return {
        "angle": clean(num(u.get("/LinkedElement/AttackCone"))),
        "shot": attack_text(u, "Range"),
        "torch": attack_text(u, "Torch"),
    }


COMBAT_UNIT = {"archers": 32847, "scorpion": 31683, "catapult": 37463}
# モジュールの種類ごとの、船体ごとの最大搭載数（ラティウムの船体。他の地域の船体も同じ並び）
MODULE_TYPE = {"mast": "Mast", "rows": "Rows", "hull": "AdditionalHull", "archers": "Archers", "scorpion": "Scorpion", "catapult": "Catapult"}


def max_per_ship(key):
    out = []
    for _, lat, _, _, _ in SEA:
        n = R.get(lat)["v"].get(f"/ShipModuleOwner/ShipModulesConfig/{MODULE_TYPE[key]}/MaximumModuleCount")
        if n:
            out.append({"ship": name_of(lat), "count": int(num(n))})
    return out


modules = []
for key, lat, alb, aeg, unlock in MODULES:
    v = R.get(lat)["v"]
    name = name_of(lat)
    rec = {
        "id": key,
        "name": name,
        "desc": ja(v.get("/Standard/InfoDescription")),
        "effect": module_effect(key, v),
        "combat": combat_of(COMBAT_UNIT[key]) if key in COMBAT_UNIT else None,
        "maxPerShip": max_per_ship(key),
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

# --- 海の船の編成（造船所の建造メニューに並ぶ6つ: 民間 I〜III・軍団 I〜III。地域ごとに、付いているモジュールが違う） ---
# 編成 = 船体 + 設置済みのモジュール。費用・建設時間・維持費は足し算、積荷スロットは「船体の枠 - モジュールの数」
# 実機（PS5）の表示（2026-11-22）と、データからの計算を突き合わせる。航行速度・川の速度は [最小, 最大]（ペース/秒）の実機の値。
#   ラティウム: 建設費・建設時間・積荷スロットがデータの計算と一致
#   アイギュプト: 建設時間・積荷スロット・モジュールが一致。建設費は、データの計算のちょうど半分（端数は切り上げ）。
#     撮影した画面に、専門家「帝国の公使-ヘリウス・アシナ・レストイトゥトゥス」の覚醒効果(造船所の範囲内で船の建造費-50%。覚醒前は-25%)が掛かっていたため。
#     研究「統一単位」(船の建造速度+100%)も有効だったが、建設時間の表示には効かない。表は効果なしの基本値を載せる
#   アルビオン: 建設費・建設時間・積荷スロット・航行速度・維持費のデナリウスが、ラティウムと同じ値で一致（2026-11-23。建設費に効果は掛かっていない）
REGIONS_SEA = [
    # 地域, 造船所, モジュールの資産（種類 -> GUID）, 実機の表示
    ("ラティウム", 6054, {"Mast": 31647, "Rows": 31648, "AdditionalHull": 31649, "Archers": 31651, "Scorpion": 31652, "Catapult": 31653}, "lat"),
    ("アルビオン", 29340, {"Mast": 39574, "Rows": 39575, "AdditionalHull": 39576, "Archers": 39577, "Scorpion": 39578, "Catapult": 39579}, "alb"),
    ("アイギュプト", 153332, {"Mast": 157318, "Rows": 157319, "AdditionalHull": 157320, "Archers": 157321, "Scorpion": 157322, "Catapult": 157323}, "aeg"),
]
# 実機の表示: 編成 -> 積荷スロット・建設時間（分）・航行速度・川の速度（アイギュプトのみ表示）・建設費（アイギュプトは効果込み）
MEASURED_SEA = {
    "alb": {
        "民間 I": {"money": 18, "slots": 3, "min": 5, "sail": [45, 90], "cost": {1010017: 1500, 2174: 15, 2171: 10, 2172: 10}},
        "民間 II": {"money": 73, "slots": 4, "min": 9, "sail": [40, 98], "cost": {1010017: 4500, 2174: 30, 2171: 25, 2172: 25}},
        "民間 III": {"money": 134, "slots": 6, "min": 11, "sail": [36, 87], "cost": {1010017: 8500, 2174: 45, 2171: 30, 2172: 30}},
        "軍団 I": {"money": 67, "slots": 1, "min": 7, "sail": [45, 90], "cost": {1010017: 4000, 2174: 30, 2171: 15, 2172: 10, 2173: 11}},
        "軍団 II": {"money": 109, "slots": 2, "min": 11, "sail": [58, 81], "cost": {1010017: 6700, 2174: 55, 2171: 20, 2172: 15, 2173: 8}},
        "軍団 III": {"money": 195, "slots": 3, "min": 14, "sail": [51, 72], "cost": {1010017: 12000, 2174: 75, 2171: 25, 2172: 20, 2173: 14}},
    },
    "lat": {
        "民間 I": {"money": 18, "slots": 3, "min": 5, "sail": [45, 90], "cost": {1010017: 1500, 2174: 15, 2171: 10, 2172: 10}},
        "民間 II": {"money": 73, "slots": 4, "min": 9, "sail": [40, 98], "cost": {1010017: 4500, 2174: 30, 2171: 25, 2172: 25}},
        "民間 III": {"money": 134, "slots": 6, "min": 11, "sail": [36, 87], "cost": {1010017: 8500, 2174: 45, 2171: 30, 2172: 30}},
        "軍団 I": {"money": 67, "slots": 1, "min": 7, "sail": [45, 90], "cost": {1010017: 4000, 2174: 30, 2171: 15, 2172: 10, 2173: 11}},
        "軍団 II": {"money": 109, "slots": 2, "min": 11, "sail": [58, 81], "cost": {1010017: 6700, 2174: 55, 2171: 20, 2172: 15, 2173: 8}},
        "軍団 III": {"money": 195, "slots": 3, "min": 14, "sail": [51, 72], "cost": {1010017: 12000, 2174: 75, 2171: 25, 2172: 20, 2173: 14}},
    },
    "aeg": {
        "民間 I": {"money": 24, "slots": 2, "min": 6, "sail": [64, 90], "river": [38, 48], "cost": {1010017: 1000, 2174: 13, 2171: 5, 2172: 5}},
        "民間 II": {"money": 67, "slots": 4, "min": 9, "sail": [58, 81], "river": [34, 43], "cost": {1010017: 2250, 2174: 18, 2171: 8, 2172: 8}},
        "民間 III": {"money": 128, "slots": 6, "min": 11, "sail": [51, 72], "river": [30, 38], "cost": {1010017: 4250, 2174: 25, 2171: 10, 2172: 10}},
        "軍団 I": {"money": 42, "slots": 1, "min": 7, "sail": [64, 90], "river": [38, 48], "cost": {1010017: 1500, 2174: 18, 2171: 5, 2172: 5, 2173: 2}},
        "軍団 II": {"money": 109, "slots": 2, "min": 11, "sail": [58, 81], "river": [34, 43], "cost": {1010017: 3350, 2174: 28, 2171: 10, 2172: 8, 2173: 4}},
        "軍団 III": {"money": 195, "slots": 3, "min": 14, "sail": [51, 72], "river": [30, 38], "cost": {1010017: 6000, 2174: 38, 2171: 13, 2172: 10, 2173: 7}},
    },
}


# 川の速度の式（実機のアイギュプト12値と、ナイルの川船の値で確かめた）:
#   表示 = 切り捨て(基本速度 x SPEED_UNIT x 川の流れの係数)。最小は逆らうとき、最大は沿うとき。
#   オールは、逆らうときの悪影響（係数 1 との差）を42%減らす（効果 31681）。マスト・船体装甲は川の係数に関係しない（船体装甲を付けた川の速度は未確認）
SPEED_UNIT = 13.5
ROWS_BUFF = 31681


def river_speed(hv, rows):
    base = num(hv.get("/Movement/BaseSpeed")) * SPEED_UNIT
    against = num(hv.get("/Movement/RiverCurrent/SpeedFactorAgainstRiverCurrent_MovingStraight"))
    along = num(hv.get("/Movement/RiverCurrent/SpeedFactorAlongRiverCurrent_MovingStraight"))
    if rows:
        cut = buff_value(ROWS_BUFF, "/MovementUpgrade/BuffReduceNegativeRiverCurrentImpactUpgrade/Value") / 100
        against += (1 - against) * cut
    return [int(base * against), int(base * along)]


def sum_items(parts):
    total = {}
    for pairs in parts:
        for pid, amt in pairs:
            total[pid] = total.get(pid, 0) + amt
    return list(total.items())


def half_up(x):
    return int(x + 0.5)


configs = []
for region, yard, mod_ids, mkey in REGIONS_SEA:
    yv = R.get(yard)["v"]
    for opt in range(16):
        cfg_id = yv.get(f"/Recruitment/AssemblyOptions/Item[{opt}]/Vehicle")
        if not cfg_id:
            continue
        cv = R.get(int(cfg_id))["v"]
        label = ja(cv.get("/ShipConfiguration/DefaultConfigurationName"))
        hull_id = int(cv["/ShipConfiguration/ShipHullGUID"])
        counts = {k.split("/")[3]: int(val) for k, val in cv.items() if k.startswith("/ShipConfiguration/ShipModules/") and k.endswith("ModuleCount")}
        hv = R.get(hull_id)["v"]
        parts_cost = [items(hv, "/Cost/Costs", "Ingredient")]
        parts_upkeep = [items(hv, "/Maintenance/Maintenances", "Product")]
        minutes_total, mods = num(hv.get("/Craftable/CraftingTime")), []
        for mtype, cnt in counts.items():
            mv = R.get(mod_ids[mtype])["v"]
            for _ in range(cnt):
                parts_cost.append(items(mv, "/Cost/Costs", "Ingredient"))
                parts_upkeep.append(items(mv, "/Maintenance/Maintenances", "Product"))
                minutes_total += num(mv.get("/Craftable/CraftingTime"))
            mods.append({"name": name_of(mod_ids[mtype]), "count": cnt})
        cost = sum_items(parts_cost)
        slots = int(num(hv.get("/ItemContainer/SlotCount"))) - sum(counts.values())
        meas = MEASURED_SEA.get(mkey, {}).get(label) if mkey else None
        sail = river = None
        river_measured = False
        if meas:
            expect_cost = {p: clean(a) for p, a in cost} if mkey in ("lat", "alb") else {p: half_up(a * 0.5) for p, a in cost}
            if meas["slots"] != slots or meas["min"] != minutes(minutes_total) or expect_cost != meas["cost"]:
                sys.exit(f"実機と合いません: {region} {label} 計算 {slots} {minutes(minutes_total)} {expect_cost} 実機 {meas}")
            sail, river = meas["sail"], meas.get("river")
            calc_river = river_speed(hv, counts.get("Rows", 0) > 0)
            if river:
                river_measured = True
                if calc_river != river:
                    sys.exit(f"川の速度の式が実機と合いません: {region} {label} 計算 {calc_river} 実機 {river}")
            elif "AdditionalHull" not in counts:
                river = calc_river  # この地域の造船所の画面には出ないので、式からの値
        upkeep = upkeep_list(sum_items(parts_upkeep), named=True)
        # 維持費のデナリウスは、難易度の倍率（assets.xml の DifficultySettings。ノーマル100%・ハード122%・ベテラン140%）が掛かる。
        # 実機（ハード相当の122%）の値は、切り捨て(基本値 x 1.22)と一致する。労働力は難易度の影響を受けない
        if meas and "money" in meas:
            base_money = next(u["amount"] for u in upkeep if u["name"] == "デナリウス")
            if int(base_money * 1.22) != meas["money"]:
                sys.exit(f"維持費が合いません: {region} {label} 基本 {base_money} x1.22 実機 {meas['money']}")
        configs.append({
            "region": region,
            "label": label,
            "kind": "military" if label.startswith("軍団") else "civil",
            "ship": name_of(hull_id),
            "health": clean(num(hv.get("/Health/BaseHealth"))),
            "slots": slots,
            "sail": sail,
            "river": river,
            "riverMeasured": river_measured,
            "modules": mods,
            "buildMinutes": minutes(minutes_total),
            "cost": cost_list(cost),
            "upkeep": upkeep,
        })

# アイギュプト専用の弓兵（アイギュプトの軍団 II の編成に設置済み。費用は武器5だけ。実機で確認）
kv = R.get(166548)["v"]
modules.append({
    "id": "kumato-archers",
    "name": name_of(166548),
    "desc": ja(kv.get("/Standard/InfoDescription")),
    "effect": None,
    "combat": combat_of(166645),
    "maxPerShip": [],
    "buildMinutes": None,
    "cost": cost_list(items(kv, "/Cost/Costs", "Ingredient")),
    "upkeep": [],
    "war": clean(num(kv.get("/MilitaryScoreRating/MilitaryShipPoints"))),
    "sell": clean(num(kv.get("/Sellable/Baseprice/Item[0]/Amount"))),
    "unlock": None,
    "workforce": {REGION_JA["aegyptus"]: None},
    "regions": [REGION_JA["aegyptus"]],
})

OUT.write_text(json.dumps({"ships": ships, "configs": configs, "modules": modules}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"船 {len(ships)}種・モジュール {len(modules)}種 → {OUT}")
for s in ships:
    print(s["name"], s["health"], s["speed"], s["slots"], s["buildMinutes"], s["cost"], s["upkeep"], s["war"], s["trade"], s["unlock"], s["workforce"])
for m in modules:
    print(m["name"], m["cost"], m["upkeep"], m["war"], m["sell"], m["unlock"], m["workforce"])
