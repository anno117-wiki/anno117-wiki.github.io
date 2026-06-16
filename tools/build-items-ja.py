# -*- coding: utf-8 -*-
"""
Anno 117 Item Inspector の抽出データ（CSV + 公式日本語XML + assets.xml）から
wiki用の日本語アイテムデータ items-full.json を生成する。
出典: Anno 117 公式ゲームデータ（Item Inspector 同梱）
"""
import csv, json, re, sys, io
from pathlib import Path

EXT = Path(r"C:\Users\kojif\Desktop\claude_TEMP\item_extract\Anno.117.Item.Inspector.exe_extracted")
CSV = EXT / "items_export_with_effects.csv"
JA_XML = EXT / "data/base/config/gui/texts_japanese.xml"
EN_XML = EXT / "data/base/config/gui/texts_english.xml"
ASSETS = EXT / "data/base/config/export/assets.xml"
OUT = Path(r"C:\Users\kojif\Desktop\claude_TEMP\items-full-ja.json")

ZW = "​"
def clean(s):
    return (s or "").replace(ZW, "").strip()

def load_texts(path):
    m = {}
    text = path.read_text(encoding="utf-8")
    for lid, t in re.findall(r"<LineId>(-?\d+)</LineId>\s*<Text>(.*?)</Text>", text, re.S):
        m[lid] = clean(t)
    # 空テキスト <Text /> も拾う（無視可）
    return m

print("loading JP texts...", file=sys.stderr)
JP = load_texts(JA_XML)
print(f"  JP lines: {len(JP)}", file=sys.stderr)
print("loading EN texts...", file=sys.stderr)
EN = load_texts(EN_XML)

# asset GUID -> OasisId（<Standard>内のGUID と 直後の<Text><OasisId>）
print("building asset map...", file=sys.stderr)
asset_oasis = {}
cur_guid = None
in_standard = False
got_oasis_for = set()
for line in ASSETS.read_text(encoding="utf-8").splitlines():
    s = line.strip()
    if s == "<Standard>":
        in_standard = True
        cur_guid = None
        continue
    if in_standard:
        mg = re.match(r"<GUID>(-?\d+)</GUID>", s)
        if mg and cur_guid is None:
            cur_guid = mg.group(1)
        if s == "</Standard>":
            in_standard = False
        continue
    if cur_guid is not None and cur_guid not in got_oasis_for:
        mo = re.match(r"<OasisId>(-?\d+)</OasisId>", s)
        if mo:
            asset_oasis[cur_guid] = mo.group(1)
            got_oasis_for.add(cur_guid)
            cur_guid = None
print(f"  assets: {len(asset_oasis)}", file=sys.stderr)

def resolve_guid_ja(guid):
    """効果内GUID -> 日本語名。texts直引き or asset経由。"""
    if guid in JP and JP[guid]:
        return JP[guid]
    oid = asset_oasis.get(guid)
    if oid and JP.get(oid):
        return JP[oid]
    return f"#{guid}"

ATTR = {
    "Health": "健康度", "FireSafety": "防火", "Happiness": "幸福",
    "Knowledge": "知識", "Prestige": "名声", "Belief": "信仰",
    "Money": "収入", "Population": "人口",
}
ETYPE = {
    "ProductivityUpgrade": "生産性", "MaintenanceFactorUpgrade": "維持費",
    "WorkforceMaintenanceFactorUpgrade": "労働力維持費", "FertilityPercent": "肥沃度",
    "AddedFertility": "肥沃度追加", "BaseHealthUpgrade": "基礎耐久", "SelfHealUpgrade": "自己回復",
    "BuffBaseSpeedUpgrade": "基礎速度", "BuffTransferSpeedUpgrade": "輸送速度",
    "ResolverUnitCountUpgrade": "ユニット数", "ReplaceWorkforce": "労働力置換",
    "WorkforceModifierInPercent": "労働力", "BuffReduceCargoImpactUpgrade": "積荷被害軽減",
    "AdditionalOutput": "追加生産物", "AdditionalWorkforces": "追加労働力",
    "LoadingSpeedUpgrade": "積込速度", "BuffReduceDamageImpactUpgrade": "被害軽減",
    "OffenseRangedUpgrade": "遠隔攻撃力", "BuffReduceNegativeWindImpactUpgrade": "逆風影響軽減",
    "ActiveTradePriceInPercent": "取引価格", "BuffFavorableWindAngle": "順風角度",
    "RecruitmentSpeedInPercent": "徴兵速度", "RecruitmentCostInPercent": "徴兵コスト",
    "AqueductConsumedWaterUpgrade": "水道消費水量", "AqueductWaterSupplyUpgrade": "水道供給水量",
    "FuelDurationPercent": "燃料持続", "DiscoveryRadiusUpgrade": "発見範囲",
    "RewardMoneyPerDestroyedShipUpgrade": "撃沈報酬", "HealPerMinuteUpgrade": "毎分回復",
    "ResolverResolveDurationUpgrade": "解決時間", "AccuracyUpgrade": "命中率",
    "MaximumRepairTargetsUpgrade": "最大修理対象数", "HealBuildingsPerMinuteUpgrade": "建物毎分修復",
    "ConstructionSpeedInPercent": "建設速度", "ConstructionCostInPercent": "建設コスト",
    "NeededAreaUpgrade": "必要面積", "HealRadiusUpgrade": "回復範囲",
    "IncidentImmunity": "災害免疫", "ConsumptionModifierInPercent": "消費量",
    "OffenseArcherModuleRangedUpgrade": "射手モジュール遠隔攻撃力",
    "OffenseCatapultModuleRangedUpgrade": "カタパルトモジュール遠隔攻撃力",
    "OffenseBallistaModuleRangedUpgrade": "バリスタモジュール遠隔攻撃力",
    "AccuracyArcherModuleUpgrade": "射手モジュール命中率",
    "AccuracyBallistaModuleUpgrage": "バリスタモジュール命中率",
    "AccuracyCatapultModuleUpgrage": "カタパルトモジュール命中率",
    "AttackSpeedArcherModulePercentualUpgrade": "射手モジュール攻撃速度",
    "AttackSpeedBallistaModulePercentualUpgrade": "バリスタモジュール攻撃速度",
    "AttackSpeedCatapultModulePercentualUpgrade": "カタパルトモジュール攻撃速度",
    "AttackSpeedTorchPercentualUpgrade": "火炎攻撃速度",
    "AttackSpeedRangedPercentualUpgrade": "遠隔攻撃速度",
    "DistanceAttackRangeArcherModulePercentualUpgrade": "射手モジュール射程",
    "DistanceAttackRangeBallistaModulePercentualUpgrade": "バリスタモジュール射程",
    "DistanceAttackRangeCatapultModulePercentualUpgrade": "カタパルトモジュール射程",
    "DistanceAttackRangePercentualUpgrade": "射程",
    "AttackCone_BallistaModule": "バリスタ攻撃範囲角", "AttackCone_CatapultModule": "カタパルト攻撃範囲角",
    "AttackCone": "攻撃範囲角", "HealBuildingsPerMinuteUpgrade": "建物毎分修復",
    "ResolverRepairDurationUpgrade": "修理時間",
}

def tr_effect_segment(seg):
    seg = seg.strip()
    if not seg:
        return None
    # ChangeNeedAttributesOf <guid>: <Attr> <val>
    m = re.match(r"^ChangeNeedAttributesOf (-?\d+):\s*(\w+)\s*([+-][\d.]+%?)$", seg)
    if m:
        name = resolve_guid_ja(m.group(1)); attr = ATTR.get(m.group(2), m.group(2))
        return f"{name}: {attr} {m.group(3)}"
    # <big-guid> <Attr>: <val>   (範囲効果など)
    m = re.match(r"^(-?\d{6,})\s+(\w+):\s*([+-][\d.]+%?)$", seg)
    if m:
        name = resolve_guid_ja(m.group(1)); attr = ATTR.get(m.group(2), m.group(2))
        return f"{name}: {attr} {m.group(3)}"
    # <type>: <guid>   (GUID参照型)
    m = re.match(r"^(\w+):\s*(-?\d{3,})$", seg)
    if m and m.group(1) in ("AddedFertility", "AdditionalWorkforces", "AdditionalOutput", "ReplaceWorkforce"):
        t = ETYPE.get(m.group(1), m.group(1)); name = resolve_guid_ja(m.group(2))
        return f"{t}: {name}"
    # <type-or-attr>: <val>（値は数値/割合/比率など何でも）
    m = re.match(r"^([\w_]+):\s*(.+)$", seg)
    if m:
        key = m.group(1)
        label = ATTR.get(key) or ETYPE.get(key) or key
        return f"{label}: {m.group(2)}"
    # fallback: ベストエフォート（原文のまま）
    return seg

def tr_effects(text):
    if not text:
        return []
    out = []
    for seg in text.split("|"):
        r = tr_effect_segment(seg)
        if r:
            out.append(r)
    return out

items = []
with CSV.open(encoding="utf-8") as f:
    for r in csv.DictReader(f):
        guid = r["GUID"]
        items.append({
            "guid": guid,
            "nameJa": clean(JP.get(r["Name"], "")) or clean(EN.get(r["Name"], "")) or "",
            "nameEn": clean(EN.get(r["Name"], "")),
            "rarity": r.get("Rarity", "") or "",
            "niche": r.get("Niche", "") or "",
            "price": (r.get("Price") or "").strip(),
            "description": clean(JP.get(r["InfoDescription"], "")),
            "effects": tr_effects(r.get("Buff Effects", "")),
            "boostHint": clean(JP.get(r.get("Boost Hint", ""), "")),
            "boostEffects": tr_effects(r.get("BoostBuff Effects", "")),
        })

OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {len(items)} items -> {OUT}", file=sys.stderr)
# 集計
from collections import Counter
print("rarity:", dict(Counter(i["rarity"] for i in items)), file=sys.stderr)
print("niche:", dict(Counter(i["niche"] for i in items)), file=sys.stderr)
miss = sum(1 for i in items if not i["nameJa"])
print(f"nameJa空: {miss}", file=sys.stderr)
unresolved = sum(1 for i in items for e in i["effects"] if "#" in e)
print(f"効果内 未解決GUID(#)を含む行数: {unresolved}", file=sys.stderr)
