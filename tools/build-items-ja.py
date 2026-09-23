# -*- coding: utf-8 -*-
"""
Anno 117 Item Inspector の抽出データ（CSV + 公式日本語XML + assets.xml）から
wiki用の日本語アイテムデータ items-full.json を生成する。
出典: Anno 117 公式ゲームデータ（GitHub Taludas/Anno-117-Item-Inspector 同梱データ）
"""
import csv, json, re, sys, io
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT = ROOT / "_local/anno-official-data/v2.1"
CSV = EXT / "items_export_with_effects.csv"
JA_XML = EXT / "texts_japanese.xml"
EN_XML = EXT / "texts_english.xml"
ASSETS = EXT / "assets.xml"
OUT = ROOT / "packages/shared/public/data/items-full.json"

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

def resolve_target_group(group):
    """Targets列の1グループを解決し、対象建物名のリストを返す。
    'AssetPoolGUID:member1;member2' 形式のうち「〇〇の生産チェーン」プールは
    実際にはチェーンを構成する複数建物（例: パン屋・粉ひき所・小麦農場）を指すため
    メンバーを展開する。それ以外の総称プール（「生産施設」「公共サービス」等、
    数十件規模）はプール名のまま返す（展開すると選択肢が爆発するため）。"""
    group = group.strip()
    if ":" not in group:
        name = resolve_guid_ja(group)
        return [] if name.startswith("#") else [name]
    pool_guid, members_str = group.split(":", 1)
    pool_name = resolve_guid_ja(pool_guid)
    if pool_name.startswith("#"):
        return []
    if pool_name.endswith("の生産チェーン"):
        names = []
        for m in members_str.split(";"):
            m = m.strip()
            if not m:
                continue
            name = resolve_guid_ja(m)
            if not name.startswith("#") and name not in names:
                names.append(name)
        if names:
            return names
    return [pool_name]

def format_targets(target_raw):
    """効果の適用対象（建物・住民層など）を日本語で組み立てる。
    Villa配置（全体の9割弱）は常に「範囲内」効果なので接尾辞は付けない。"""
    target_raw = (target_raw or "").strip()
    if not target_raw or target_raw == "None":
        return ""
    names = []
    for group in target_raw.split("|"):
        for name in resolve_target_group(group):
            if name not in names:
                names.append(name)
    return "、".join(names)

# 公式ローカライズID対照表（GitHub Taludas/Anno-117-Item-Inspector の BUFF_EFFECT_MAPPING より、
# 単一LineIdを持つキーのみ抽出。複数LineId/条件分岐が必要なキーは対象外＝下記フォールバック辞書を使う）
BUFF_EFFECT_LOCA = {
    "AccuracyArcherModuleUpgrade": "-6911855274850644762", "AccuracyBallistaModuleUpgrage": "-6907865508483901738",
    "AccuracyCatapultModuleUpgrage": "-6903547229044160126", "AccuracyUpgrade": "-6914510932562426253",
    "ActiveTradePriceInPercent": "-6904910338903030922", "AddedFertility": "-6911374437279007671",
    "AdditionalLoadingSpeedInPercent": "-6913245221430448853", "AdditionalMoneyIncome": "-6907832455942731395",
    "AdditionalOutput": "-6899820196143793484", "AdditionalPercentage": "-6907497495990126878",
    "AdditionalWorkforces": "-6902792103058113405", "AqueductConsumedWaterUpgrade": "-6900173698993465429",
    "AqueductWaterSupplyUpgrade": "-6901410119100201615", "DistributorConsumedWaterUpgrade": "-6900173698993465429",
    "GoodConsumptionUpgrade": "-6916926126237868583", "GenerateLimitedLode": "-6910834639284735326",
    "ArmorUpgrade": "-6916173326961563427",
    "AttackSpeedArcherModulePercentualUpgrade": "-6907471390180921660",
    "AttackSpeedBallistaModulePercentualUpgrade": "-6900615996648907081",
    "AttackSpeedCatapultModulePercentualUpgrade": "-6914364061449956903",
    "AttackSpeedRangedPercentualUpgrade": "-6916798165698611871",
    "AttackSpeedTorchPercentualUpgrade": "-6904582095030413595",
    "AttributeModifierInPercent": "-6905501351022478370", "BaseHealthUpgrade": "-6908494598081338492",
    "Belief": "-6917117282888968611", "BuffBaseSpeedUpgrade": "-6899782450596141269",
    "BuffFavorableWindAngle": "-6917509324150509842", "BuffReduceCargoImpactUpgrade": "-6917314961146315631",
    "BuffReduceDamageImpactUpgrade": "-6915299435512831228", "BuffReduceNegativeWindImpactUpgrade": "-6904284175891437012",
    "BuffTransferSpeedUpgrade": "-6914547372679383539", "CanUseForest": "-6906268553696161885",
    "CanUseMarsh": "-6914826481896353728", "CanUseMeadow": "-6908731335818162955",
    "ConstructionCostInPercent": "-6905220259948887554", "ConstructionSpeedInPercent": "-6916588842784089099",
    "ConsumptionModifierInPercent": "-6902845924876156586", "DefenseUpgrade": "-6916234667073216072",
    "DiscoveryRadiusUpgrade": "-6912851074397281398",
    "DistanceAttackRangeArcherModulePercentualUpgrade": "-6913771487903800801",
    "DistanceAttackRangeBallistaModulePercentualUpgrade": "-6900440828800548713",
    "DistanceAttackRangeCatapultModulePercentualUpgrade": "-6908752606907018381",
    "DistanceAttackRangePercentualUpgrade": "-6900632430001524951",
    "EncampedUnitScalingFactorUpgrade": "-6916806603637230261", "EncampedUnitSelfHealMultiplierUpgrade": "-6905174277262380495",
    "FactoryRangePercentageUpgrade": "-6905430209589419363", "FireSafety": "-6913876283495722297",
    "FuelDurationPercent": "-6901428646395682482", "Happiness": "-6915056271707822368",
    "HealBuildingsPerMinuteUpgrade": "-6904744989082029193", "HealPerMinuteUpgrade": "-6909031806713637632",
    "HealRadiusUpgrade": "-6902642577827438950", "Health": "-6912510107473053226",
    "IncidentImmunity": "-6905739525374090419", "InputAmountUpgrade": "-6900576451581047741",
    "Knowledge": "-6908049578864304337", "LandTax": "-6905885150396558664",
    "LoadingSpeedUpgrade": "-6911162818502702769", "MaintenanceFactorUpgrade": "-6903385320568856769",
    "MaximumMoraleUpgrade": "-6917319967366727198", "MaximumRepairTargetsUpgrade": "-6904878606025953416",
    "MeshGraphUpkeep": "-6903385320568856769", "MinDistanceBetweenTowersBuff": "-6917486192068866197",
    "ModuleLimitPercent": "-6913343185575431361", "Money": "-6910799479763478465",
    "NeededAreaUpgrade": "-6915963651705874185", "OffenseArcherModuleRangedUpgrade": "-6902617017467231785",
    "OffenseBallistaModuleRangedUpgrade": "-6909984235779738348", "OffenseCatapultModuleRangedUpgrade": "-6906754297935564907",
    "OffenseChargeUpgrade": "-6907642198169893607", "OffenseMeleeUpgrade": "-6914624354330523363",
    "OffenseRangedUpgrade": "-6901124448895689147", "PassiveRuinRepairSpeedUpgrade": "-6902214522674861072",
    "PassiveTradeReward": "-6909300745746637117", "PipeCapacityUpgrade": "-6908505536770437697",
    "Population": "-6916310552575698080", "Prestige": "-6911554866663245776",
    "ProductivityUpgrade": "-6901457306120429160", "ProvidedNeedUpgrade": "-6906821818431502107",
    "RadiusEffectRangeUpgrade": "-6906345630532600075", "RadiusEffectRangeTarget": "-6906345630532600075",
    "FestivalEffectDurationPercentageUpgrade": "-6917495746025386252", "AdditionalNeedsDemand": "-6913499004383754082",
    "RecruitmentCostInPercent": "-6900175465122901010", "RecruitmentSpeedInPercent": "-6912203919785395737",
    "ReplaceInputs": "-6909767605057018144", "SelfSupplyInput": "-6902431379744152273",
    "ReplaceWorkforce": "-6900271494650358300", "ResolverRangeUpgrade": "-6899682999703418604",
    "ResolverRepairDurationUpgrade": "-6908683155652934058", "ResolverResolveDurationUpgrade": "-6901804608838418377",
    "ResolverUnitCountUpgrade": "-6911863755390981443", "RewardMoneyPerDestroyedBuildingUpgrade": "-6914993701769861740",
    "RewardMoneyPerDestroyedShipUpgrade": "-6905414924283098115", "SelfHealUpgrade": "-6906905232291239015",
    "SellPriceFactorUpgrade": "-6912306538068974009", "ShieldUpgrade": "-6915348409801369648",
    "SlotCountUpgrade": "-6901072862113090986", "SocketCountUpgrade": "-6908073095614905585",
    "StorageCapacityModifier": "-6910269557488986844", "WorkforceModifierInPercent": "-6902123928322850502",
}

def label_for(key):
    """効果タイプキーの日本語ラベルを返す。公式ローカライズ優先、フォールバックで独自訳。"""
    lid = BUFF_EFFECT_LOCA.get(key)
    if lid:
        v = JP.get(lid) or EN.get(lid)
        if v:
            return clean(v)
    return ATTR.get(key) or ETYPE.get(key) or key

def format_effect(key, value, sep=": "):
    """キーと値から効果テキストの断片を組み立てる。
    公式ラベルが{}テンプレートを持てばそこへ値を埋め込み、
    そうでなければ「ラベル<sep>値」の形にする（範囲効果などの接頭辞に続く場合は sep=" " を渡す）。
    公式ラベル自体が既に「：」等で終わる場合はsepを重ねず直接連結する。"""
    label = label_for(key)
    if "{}" in label:
        return label.replace("{}", value)
    if label.endswith(("：", ":")):
        return f"{label}{value}"
    return f"{label}{sep}{value}"

# ATTR/ETYPE: BUFF_EFFECT_LOCA に無いキー、または解決失敗時のフォールバック訳
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
    "ProvidedNeedUpgrade": "提供ニーズ", "AdditionalNeedsDemand": "追加需要",
    "GoodConsumptionUpgrade": "消費量", "SelfSupplyInput": "自給",
    "PassiveTradeReward": "受動交易報酬", "ReplaceInputs": "素材置換",
    "StorageCapacityModifier": "保管容量", "DistributorConsumedWaterUpgrade": "分配水道消費量",
    "RadiusEffectRangeUpgrade": "範囲効果射程", "FestivalEffectDurationPercentageUpgrade": "祭り効果時間",
    "GenerateLimitedLode": "限定鉱脈生成",
}

# 災害・疫病名（公式ローカライズ, Item Inspector INCIDENT_MAPPING より）
INCIDENT_JA = {
    "Disease": "病気", "Plague": "疫病", "Fire": "火災",
    "Inferno": "猛火", "Unrest": "騒乱", "Rebellion": "反乱",
}

# GUID解決を試みる際に除外する語（Disease/Plague等の状態異常名はGUIDではない）
_NON_GUID_TOKENS = set(INCIDENT_JA)

def try_resolve_guid(token):
    """3桁以上の数字トークンだけGUID解決を試みる。解決できなければ元の値を返す。"""
    token = token.strip()
    if token in _NON_GUID_TOKENS or not re.fullmatch(r"-?\d{3,}", token):
        return token
    resolved = resolve_guid_ja(token)
    return token if resolved.startswith("#") else resolved

def tr_effect_segment(seg):
    seg = seg.strip()
    if not seg:
        return None
    # ChangeNeedAttributesOf <guid>: <Attr> <val>
    m = re.match(r"^ChangeNeedAttributesOf (-?\d+):\s*(\w+)\s*([+-][\d.]+%?)$", seg)
    if m:
        name = resolve_guid_ja(m.group(1))
        return f"{name}: {format_effect(m.group(2), m.group(3), sep=' ')}"
    # <big-guid> <Attr>: <val>   (範囲効果など。値が符号付き数値の場合)
    m = re.match(r"^(-?\d{6,})\s+(\w+):\s*([+-][\d.]+%?)$", seg)
    if m:
        name = resolve_guid_ja(m.group(1))
        return f"{name}: {format_effect(m.group(2), m.group(3), sep=' ')}"
    # <big-guid> <Attr>: <guid>   (範囲効果など。値がGUID参照の場合。例: 範囲効果 ProvidedNeedUpgrade: <need-guid>)
    m = re.match(r"^(-?\d{6,})\s+(\w+):\s*(-?\d{3,})$", seg)
    if m:
        name = resolve_guid_ja(m.group(1))
        return f"{name}: {format_effect(m.group(2), try_resolve_guid(m.group(3)), sep=' ')}"
    # AdditionalOutput/AddedFertility/AdditionalWorkforces/ReplaceWorkforce: [<guid>] <分数>
    m = re.match(r"^(AdditionalOutput|AddedFertility|AdditionalWorkforces|ReplaceWorkforce):\s*(?:(-?\d{3,})\s+)?(\d+/\d+)$", seg)
    if m:
        if m.group(2):
            return format_effect(m.group(1), f"{resolve_guid_ja(m.group(2))} {m.group(3)}")
        return format_effect(m.group(1), m.group(3))
    # <type>: <guid>   (GUID参照型)
    m = re.match(r"^(\w+):\s*(-?\d{3,})$", seg)
    if m and m.group(1) in ("AddedFertility", "AdditionalWorkforces", "AdditionalOutput", "ReplaceWorkforce", "AdditionalNeedsDemand", "SelfSupplyInput"):
        return format_effect(m.group(1), resolve_guid_ja(m.group(2)))
    # ReplaceInputs: <guid1> -> <guid2>
    m = re.match(r"^ReplaceInputs:\s*(-?\d+)\s*->\s*(-?\d+)$", seg)
    if m:
        return format_effect("ReplaceInputs", f"{resolve_guid_ja(m.group(1))} → {resolve_guid_ja(m.group(2))}")
    # IncidentImmunity: Disease;Plague のような災害名の列挙
    m = re.match(r"^IncidentImmunity:\s*(.+)$", seg)
    if m:
        names = [INCIDENT_JA.get(x.strip(), x.strip()) for x in m.group(1).split(";")]
        return format_effect("IncidentImmunity", "・".join(names))
    # <type-or-attr>: <val>（値は数値/割合/比率など何でも。値中の3桁以上の数字はGUIDならその都度解決）
    m = re.match(r"^([\w_]+):\s*(.+)$", seg)
    if m:
        key = m.group(1)
        val = re.sub(r"(?<![+\-\d.])\d{3,}(?!\.\d|%)", lambda mm: try_resolve_guid(mm.group(0)), m.group(2))
        return format_effect(key, val)
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

# --- 覚醒条件（Boost Condition）ローカライズ ---
# 出典: Anno-117-Item-Inspector本体 anno117_item_inspector.py の
# CONDITION_TYPES/CONDITION_ATTRIBUTES等の定数と resolve_boost_condition() のロジックを移植。
# 独自の意訳ではなく、公式ツールが実際に組み立てる表示ロジックをそのまま再現する。
COMPARE_OPS_JA = {"AtLeast": "以上", "AtMost": "以下", "LessThan": "未満", "MoreThan": "超"}

def apply_compare_ops(text):
    """'AtLeast 25'のような比較演算子+数値を、日本語として自然な'25以上'の語順に変換する。"""
    def repl(m):
        comp, num = m.group(1), m.group(2)
        if comp == "Equals":
            return f"ちょうど{num}"
        return f"{num}{COMPARE_OPS_JA[comp]}"
    return re.sub(r"\b(AtLeast|AtMost|Equals|LessThan|MoreThan)\s+(-?[\d.]+)", repl, text)

CONDITION_TYPES = {
    "ConditionNeedAttributeCounter": ["-6907409456541782824", "-6914796270700478523"],
    "ConditionObjectCount": "-6909050664680798634",
    "ConditionItemUsed": "-6914628682709519748",
    "ConditionActiveEmperor": ["-6909286393160361264", "-6910778800790301118"],
    "ConditionReligion": "-6914126446077893143",
    "ConditionMonumentEventActive": "-6912188219464097135",
    "ConditionEmperorRelation": ["-6900988673237471031", "-6909286393160361264"],
    "ConditionDiplomacyState": "-6901372654787949026",
    "ConditionWarState": "-6916305455916138439",
    "ConditionDominantPatron": "-6917281781830473807",
    "ConditionInStorage": ["-6904656400857447148", "-6916792298682888435"],
    "ConditionTradeRouteCount": "-6915569607474692589",
    "ConditionFestivalActive": ["-6911236995181305030", "-6908773579491322283"],
    "ConditionRaceOutcome": "-6899894517186160753",
}
FESTIVAL_ANY_ID = "-6915762395677959303"
RELIGION_ZERO_ID = "-6899884938127726030"
STORAGE_LOCA_ID = ["-6904656400857447148", "-6916792298682888435"]
CONDITION_ATTRIBUTES = {
    "Belief": "-6917117282888968611", "FireSafety": "-6913876283495722297",
    "Happiness": "-6915056271707822368", "Health": "-6912510107473053226",
    "Knowledge": "-6908049578864304337", "Money": "-6910799479763478465",
    "Prestige": "-6911554866663245776", "Population": "-6916310552575698080",
    "NavalStrength": "-6903178156203890847", "ArmyStrength": "-6916030253858215742",
    "MoneyBalance": "-6910768626546451500",
    "ActiveEmperorReputation": ["-6900988673237471031", "-6909286393160361264"],
    "ContractsCompleted": "-6915965511056834686", "ShipsSoldToParticipant": "-6915345810045190210",
    "IslandsDiscovered": "-6917195644310704229",
    "ItemsInStock": ["-6914097598100160370", "-6916792298682888435"],
}
CONDITION_LOCATIONS = {
    "Area": "-6902656537549924720",
    "Session": ["-6914487889124229090", "-6907135442311038421"],
}
EMPEROR_RELATION_VALUES = {
    "HostileZone": "-6917403091401205128", "UnrulyZone": "-6915583492848202370",
    "CasualZone": "-6914671557303069450", "EffortZone": "-6917351903766265206",
    "ChallengeZone": "-6901978489714054004",
    # "Rebellion"より前に置く必要がある（下の置換ループは単純な文字列replaceなので、
    # 先に短い"Rebellion"がマッチすると"RebellionPending"の"Pending"部分だけが残ってしまう）
    "RebellionPending": "-6912437379731661339",  # 「反乱寸前」（texts_japanese.xmlより）
    "Rebellion": "-6912555987231726209",
    "ProConsul": "-6904131997685258147", "Consul": "-6916032052665441306",
}
# ConditionWarStateの戦況値。公式ローカライズの直接対応が確認できないため、
# BUFF_EFFECT_LOCAのATTR/ETYPE辞書と同様にフォールバックの独自訳とする。
WAR_STATE_VALUES_JA = {"Dominating": "優勢", "Struggling": "苦戦", "CloseToWin": "勝利間近"}
# ConditionCompareVariableで使われる変数名。用例が少なく汎用マッピングを作れないため、
# 既知のものだけ個別に訳語を用意する。
COMPARE_VARIABLE_JA = {"PopularityMax": "人気度の上限"}
DIPLOMACY_STATE_VALUES = {
    "Undiscovered": "-6910984867916216313", "Alliance": "-6909792988828917153",
    "DefensivePact": "-6913251946263130178", "Peace": "-6913646454384213306",
    "War": "-6903421091051165993",
}
MODULE_MAPPING = {
    "RequiredModuleCount": "-6903948808470486709",
    "RequiredMilitaryModuleCount": ["-6903948808470486709", "-6905451000995360298"],
    "ShipConfiguration": "-6910601933138024387",
}
# 継承チェーンでは解決できないGUID（Inspector本体のMANUAL_GUID_MAPをそのまま踏襲）
MANUAL_GUID_MAP = {
    "52097": ["-6914984016984180941", "-6912105848696448949"],
    "113059": "-6907933155664049947",
}

def resolve_loca(oid_or_list):
    """LineId（単一 or 複数）から日本語テキストを取得し、{}や{Conditions:...}等の
    未解決テンプレート変数を除去してスペース結合する。"""
    ids = oid_or_list if isinstance(oid_or_list, list) else [oid_or_list]
    parts = []
    for o in ids:
        t = re.sub(r"\{[^}]*\}", "", clean(JP.get(o) or EN.get(o) or o))
        t = re.sub(r"[（(]\s*/?\s*[）)]", "", t)  # テンプレート除去後に残る空カッコを除去
        parts.append(t.strip())
    return " ".join(p for p in parts if p)

# CONDITION_LOCATIONSの解決済みテキスト（「現在の島」「現在 属州」等）。
# これらは対象の"スコープ"を示す修飾語であって"対象物"ではないため、
# 数値断片との並べ替え結合（下記tr_condition内）の対象から除外する。
LOCATION_TEXTS = {resolve_loca(v) for v in CONDITION_LOCATIONS.values()}

# AssetPool GUID -> メンバーGUIDリスト。OasisId(=固有名)を持たないAssetPool
# （例: 特定の専門家アイテム群をまとめたプール）を、直引きで解決できないGUIDの
# フォールバックとしてメンバー名列挙に展開するために使う。
print("building asset pool map...", file=sys.stderr)
_asset_pool_re = re.compile(
    r"<Template>AssetPool</Template>\s*<Values>\s*<Standard>\s*<GUID>(-?\d+)</GUID>.*?</Standard>\s*<AssetPool>\s*<AssetList>(.*?)</AssetList>",
    re.S,
)
asset_pool_members = {}
for pool_guid, list_body in _asset_pool_re.findall(ASSETS.read_text(encoding="utf-8")):
    members = re.findall(r"<Asset>(-?\d+)</Asset>", list_body)
    if members:
        asset_pool_members[pool_guid] = members
print(f"  asset pools: {len(asset_pool_members)}", file=sys.stderr)

def resolve_condition_guid(token):
    """Condition内の数値トークンをGUID解決。ManualMap優先、次いでresolve_guid_ja、
    それでも解決できなければAssetPoolのメンバー名列挙にフォールバックする
    （公式ツールresolve_all_guids()と同じ優先順位）。最後まで解決できなければ元の値を返す。"""
    token = token.strip()
    if len(token.replace("-", "")) < 4:
        return token
    if token in MANUAL_GUID_MAP:
        return resolve_loca(MANUAL_GUID_MAP[token])
    resolved = resolve_guid_ja(token)
    if not resolved.startswith("#"):
        return resolved
    members = asset_pool_members.get(token)
    if members:
        names = [resolve_guid_ja(m) for m in members]
        names = [n for n in names if not n.startswith("#")]
        if names:
            return "、".join(names)
    return token

def resolve_all_condition_guids(text):
    """文字列内の4桁以上の数値トークンをすべてGUID解決する。"""
    return re.sub(r"(?<![+\d\-.])-?\d{4,20}\b(?!%)", lambda m: resolve_condition_guid(m.group(0)), str(text))

def tr_condition(raw):
    """Boost Condition列の生データを日本語テキストに変換する。
    Anno-117-Item-Inspector本体 resolve_boost_condition() のロジックを移植。"""
    raw = (raw or "").strip()
    if not raw or raw == "None":
        return ""

    parts = [p.strip() for p in raw.split("|") if p.strip()]
    resolved_parts = []

    for part in parts:
        if ":" in part:
            left, right = (x.strip() for x in part.split(":", 1))

            # ConditionPlayerCounterは属性名(NavalStrength等)がrightの先頭に埋め込まれる形式。
            # 埋め込まれたままだと「属性名 N以上」のようにコロンのない断片になり他の条件と
            # 表記が揃わないため、属性名を先に抜き出してloc_label（コロン付きラベル）にする。
            if left == "ConditionPlayerCounter":
                loc_label = ""
                for attr_key, attr_oid in CONDITION_ATTRIBUTES.items():
                    if re.search(r"\b" + re.escape(attr_key) + r"\b", right):
                        loc_label = resolve_loca(attr_oid)
                        right = re.sub(r"\b" + re.escape(attr_key) + r"\b", "", right).strip()
                        break
                else:
                    if "GoodsInStock" in right:
                        loc_label = resolve_loca(STORAGE_LOCA_ID)
                        right = right.replace("GoodsInStock", "").strip()
            elif left == "ConditionCompareVariable":
                loc_label = ""
            elif left in CONDITION_TYPES:
                loc_label = resolve_loca(CONDITION_TYPES[left])
            elif left in MODULE_MAPPING:
                loc_label = resolve_loca(MODULE_MAPPING[left])
            else:
                loc_label = resolve_all_condition_guids(left)
            loc_label = loc_label.replace("{}", "").rstrip(":").strip() if loc_label else ""

            right = apply_compare_ops(right)

            if "ConditionEmperorRelation" in left:
                for k, v in EMPEROR_RELATION_VALUES.items():
                    if k in right:
                        right = right.replace(k, resolve_loca(v))
            elif "ConditionDiplomacyState" in left:
                for k, v in DIPLOMACY_STATE_VALUES.items():
                    if k in right:
                        right = right.replace(k, resolve_loca(v))
            elif "ConditionWarState" in left:
                for k, v in WAR_STATE_VALUES_JA.items():
                    if k in right:
                        right = right.replace(k, v)

            if left == "ConditionReligion" and right.strip() == "0":
                right = resolve_loca(RELIGION_ZERO_ID)
            if left == "ConditionFestivalActive" and not right.strip():
                right = resolve_loca(FESTIVAL_ANY_ID)
            if left == "ConditionCompareVariable":
                var_name, _, bool_val = right.strip().partition(" ")
                var_name = COMPARE_VARIABLE_JA.get(
                    var_name.strip(),
                    re.sub(r"(?<!^)(?=[A-Z])", " ", var_name.strip()).strip(),
                )
                check = "○" if bool_val.strip() == "1" else "×"
                right = f"{var_name} {check}"
            if left == "ConditionRaceOutcome":
                position, _, event_guid = right.strip().partition(" ")
                right = f"{resolve_all_condition_guids(event_guid)} {position}位".strip()

            if "PopulationByGroup" in right:
                right = right.replace("PopulationByGroup", "").strip()

            for attr_key, attr_oid in CONDITION_ATTRIBUTES.items():
                if attr_key in right:
                    loc_attr = resolve_loca(attr_oid)
                    right = re.sub(r"\b" + re.escape(attr_key) + r"\b", loc_attr, right)

            right = resolve_all_condition_guids(right)
            resolved_parts.append(f"{loc_label}: {right}" if loc_label else right)
        else:
            sub_parts = [sp.strip() for sp in part.split(",")]
            res_sub = []
            for sp in sub_parts:
                if sp in CONDITION_LOCATIONS:
                    res_sub.append(resolve_loca(CONDITION_LOCATIONS[sp]))
                elif sp in MODULE_MAPPING:
                    res_sub.append(resolve_loca(MODULE_MAPPING[sp]))
                else:
                    res_sub.append(resolve_all_condition_guids(sp))
            resolved_parts.append(" ".join(res_sub))

    # 「(ラベル: )N以上」のような数値断片の直後に対象名（GUID解決結果）だけの断片が
    # 続く場合、「(ラベル: )対象名 N以上」の順に並べ替えて自然な日本語にする
    # （例: "10以上"+"交易所" → "交易所 10以上"、"建設: 600以上"+"住居" → "建設: 住居 600以上"）。
    merged_parts = []
    i = 0
    while i < len(resolved_parts):
        p = resolved_parts[i]
        m = re.fullmatch(r"(?P<prefix>.*: )?(?P<num>-?[\d.]+(?:以上|以下|未満|超))", p)
        nxt = resolved_parts[i + 1] if i + 1 < len(resolved_parts) else None
        if m and nxt is not None and ":" not in nxt and nxt not in LOCATION_TEXTS:
            prefix = m.group("prefix") or ""
            merged_parts.append(f"{prefix}{nxt} {m.group('num')}")
            i += 2
            continue
        merged_parts.append(p)
        i += 1

    return "、".join(p for p in merged_parts if p)

# --- Source（取得先）ローカライズ ---
# ライバル専門家・商人・皇帝・海賊のRewardPool内部名（英語・未ローカライズ）を日本語化する。
# 対応表はゲーム内テキスト（撃破報酬 ItemGainedWhenDefeated のGUID解決結果、および
# portrait画像ファイル名 portrait_{rival,trader,pirate,emperor}_<name>.png）から確認したもの。
# Zarai(ゲーム内表記はZara Nitu)・Nefeneru(ゲーム内表記はNeferneru)・Procurator(実名はCorvinus)・
# Julia(単発イベント名経由でしか確認できず用途不明)は内部名とゲーム内表記が完全一致しないため要検証扱いとする。
NPC_NAME_JA = {
    "Dorian": "ドリアン", "Tarragon": "タラゴン", "Licia": "リシア・マー", "Athr": "アサール",
    "Zarai": "ザラ・ニトゥ", "Concordia": "コンコルディア", "Nefeneru": "ネフェルネル",
    "Diana": "ディアナ", "Valeria": "ウァレリア", "Procurator": "コルヴィヌス",
    "Manx": "マンクス", "Caeso": "カエソ", "Voada": "ウォアダ", "Caecilia": "カエシリア",
    "Calidus": "カリドゥス", "Julia": "ユリア",
}
NPC_NAME_UNVERIFIED = {"Zarai", "Nefeneru", "Procurator", "Julia"}

FESTIVAL_ATTR_JA = {
    "Happiness": "幸福度", "Health": "健康", "Fire Safety": "防火", "Belief": "信仰",
    "Knowledge": "知識", "Prestige": "名声", "War Victory": "戦勝", "Monument Event": "モニュメント",
    "Mars": "マルス", "Ceres": "ケレス", "Neptune": "ネプトゥヌス", "Mercury Lugus": "メルクリウス・ルグス",
    "Epona": "エポナ", "Cernunnos": "ケルヌンノス", "Minerva": "ミネルウァ", "Vulcan": "ウルカヌス",
}
REWARD_KIND_JA = {
    "Trades": "取引", "Contracts Base": "契約（並）", "Contracts Good": "契約（良）",
    "Contracts Best": "契約（最高）", "Drops": "撃破ドロップ",
}
ENDGAME_TECH_JA = {"EconomyTech": "経済", "CivicTech": "市民", "MilitaryTech": "軍事", "RacerTech": "レース"}
VISITOR_RARITY_JA = {
    "Common": "コモン", "Rare": "レア", "Epic": "エピック", "Legendary": "レジェンダリー", "Mythic": "ヒロイック",
}

print("building RewardPool map...", file=sys.stderr)
_reward_pool_re = re.compile(
    r"<Template>Reward(?:Pool|List)</Template>\s*<Values>\s*<Standard>\s*<GUID>(-?\d+)</GUID>\s*<Name>(.*?)</Name>",
    re.S,
)
reward_pools = dict(_reward_pool_re.findall(ASSETS.read_text(encoding="utf-8")))

print("building QuestEntry map...", file=sys.stderr)
# 正規表現の非貪欲マッチ(.*?)はAsset境界を越えて誤マッチすることがあるため、
# asset_oasis構築と同じ逐次パース方式（<Standard>でGUID確定→直後の最初の
# 対象タグに紐付け）で確実に対応付ける。
quest_entry_name_guid = {}
_qe_cur_guid = None
_qe_in_standard = False
_qe_got_for = set()
for _line in ASSETS.read_text(encoding="utf-8").splitlines():
    _s = _line.strip()
    if _s == "<Standard>":
        _qe_in_standard = True
        _qe_cur_guid = None
        continue
    if _qe_in_standard:
        _mg = re.match(r"<GUID>(-?\d+)</GUID>", _s)
        if _mg and _qe_cur_guid is None:
            _qe_cur_guid = _mg.group(1)
        if _s == "</Standard>":
            _qe_in_standard = False
        continue
    if _qe_cur_guid is not None and _qe_cur_guid not in _qe_got_for:
        _mq = re.match(r"<QuestName>(-?\d+)</QuestName>", _s)
        if _mq:
            quest_entry_name_guid[_qe_cur_guid] = _mq.group(1)
            _qe_got_for.add(_qe_cur_guid)
            _qe_cur_guid = None

def resolve_quest_name(guid):
    """クエストGUID→クエスト名。直引き失敗時はQuestEntryテンプレート経由で二次解決する。"""
    name = resolve_guid_ja(guid)
    if not name.startswith("#"):
        return name
    qn_guid = quest_entry_name_guid.get(guid)
    if qn_guid:
        name2 = resolve_guid_ja(qn_guid)
        if not name2.startswith("#"):
            return name2
    return None

def translate_reward_pool_name(name):
    """RewardPool/RewardList内部名（英語・未ローカライズ）を日本語化する。
    戻り値: (日本語文字列, 要検証フラグ)"""
    m = re.match(r"^RewardPool Festival (.+)$", name)
    if m:
        attr = FESTIVAL_ATTR_JA.get(m.group(1))
        if attr:
            return f"{attr}祭りの報酬", False
        return name, True
    m = re.match(r"^RewardList Endgame (\w+)$", name)
    if m:
        tech = ENDGAME_TECH_JA.get(m.group(1))
        if tech:
            return f"エンドゲーム技術報酬（{tech}）", False
        return name, True
    m = re.match(r"^RewardPool All Visitor Items (\w+)$", name)
    if m:
        rarity_ja = VISITOR_RARITY_JA.get(m.group(1))
        if rarity_ja:
            return f"来訪者イベントの報酬（{rarity_ja}）", False
        return name, True
    m = re.match(r"^Reward(?:Pool|List) (\w+) (.+)$", name)
    if m:
        npc, kind = m.groups()
        npc_ja = NPC_NAME_JA.get(npc)
        kind_ja = REWARD_KIND_JA.get(kind)
        if npc_ja and kind_ja:
            return f"{npc_ja}との{kind_ja}", npc in NPC_NAME_UNVERIFIED
    return name, True

def resolve_source(raw):
    """Source列の生データを日本語テキストに変換する。
    戻り値: (日本語文字列, 要検証フラグ)"""
    raw = (raw or "").strip()
    if not raw:
        return "", False
    caution = False
    # fixed: Quest/HallofFame/撃破報酬など、確実な入手経路（そのまま列挙する）。
    # pool: NPC交易/契約/撃破ドロップ・祭り報酬など、確率つきのランダム抽選プール。
    # 候補数が閾値を超える場合は実質「共通ドロッププール」なので1行に集約する
    # （例: 421件中286件が11件以上の候補を持ち、個別列挙するとポップオーバーが
    # 最大74行になり情報過多になるため）。
    fixed = []
    pool = []
    for part in raw.split("|"):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^(\w+):\s*(-?\d+)$", part)
        if m:
            kind, g = m.groups()
            if kind == "Quest":
                name = resolve_quest_name(g)
                if name:
                    fixed.append(f"クエスト「{name}」")
                else:
                    fixed.append("クエスト報酬")
                    caution = True
            elif kind == "HallofFame":
                fixed.append("栄誉の殿堂")
            elif kind == "ItemGainedWhenDefeated":
                name = resolve_guid_ja(g)
                if not name.startswith("#"):
                    fixed.append(f"{name}を撃破")
                else:
                    fixed.append("ライバル撃破報酬")
                    caution = True
            else:
                fixed.append(part)
                caution = True
            continue
        m2 = re.match(r"^(-?\d+)\s*\[([\d.]+)%\]$", part)
        if m2:
            g, pct = m2.groups()
            pool_name = reward_pools.get(g)
            if pool_name:
                ja, cau = translate_reward_pool_name(pool_name)
                pool.append((f"{ja}（{pct}%）", cau))
            else:
                pool.append(("不明な報酬プール", True))
            continue
        fixed.append(part)
        caution = True

    POOL_THRESHOLD = 11
    if len(pool) >= POOL_THRESHOLD:
        results = fixed + ["多数の交易商・祭りからランダム入手（低確率）"]
    else:
        results = fixed + [p for p, _ in pool]
        caution = caution or any(cau for _, cau in pool)

    seen = set()
    uniq = []
    for r in results:
        if r not in seen:
            seen.add(r)
            uniq.append(r)
    return "、".join(uniq), caution

ALLOCATION_JA = {"Villa": "住居", "Ship": "船"}

items = []
with CSV.open(encoding="utf-8") as f:
    for r in csv.DictReader(f):
        guid = r["GUID"]
        effects = tr_effects(r.get("Buff Effects", ""))
        needed_prestige = (r.get("NeededPrestige") or "").strip()
        if needed_prestige:
            effects.append(f"必要名声: {needed_prestige}")
        effects.extend(tr_effects(r.get("MythicEffect Effects", "")))
        source_ja, source_caution = resolve_source(r.get("Source", ""))
        items.append({
            "guid": guid,
            "nameJa": clean(JP.get(r["Name"], "")) or clean(EN.get(r["Name"], "")) or "",
            "nameEn": clean(EN.get(r["Name"], "")),
            "rarity": r.get("Rarity", "") or "",
            "niche": r.get("Niche", "") or "",
            "price": (r.get("Price") or "").strip(),
            "description": clean(JP.get(r["InfoDescription"], "")),
            "effects": effects,
            "boostHint": clean(JP.get(r.get("Boost Hint", ""), "")),
            "boostEffects": tr_effects(r.get("BoostBuff Effects", "")),
            "boostCondition": tr_condition(r.get("Boost Condition", "")),
            "targets": format_targets(r.get("Targets", "")),
            "source": source_ja,
            "sourceCaution": source_caution,
            "allocation": ALLOCATION_JA.get((r.get("Allocation") or "").strip(), ""),
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
source_empty = sum(1 for i in items if not i["source"])
source_caution = sum(1 for i in items if i["sourceCaution"])
print(f"取得先(source) 空: {source_empty} / 要検証: {source_caution}", file=sys.stderr)
