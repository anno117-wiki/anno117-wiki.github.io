# -*- coding: utf-8 -*-
"""
Anno 117 公式データ（assets.xml + official_master.csv）から
建物効果値を抽出し buildings-effects.json を再構築する。

出力1: _local/anno-official-data/buildings-data.json（軽量参照用・gitignore済み）
出力2: apps/wiki/docs/wiki/buildings-effects.json（tier/icon/idを現行JSONから維持し、効果値を上書き）

使い方:
  python tools/build-buildings-data.py [--dry-run]
  --dry-run: 出力2を書き込まず、差分をstdoutに表示するだけ
"""
import json, csv, re, sys
from pathlib import Path
from collections import defaultdict
import xml.etree.ElementTree as ET

BASE = Path(__file__).parent.parent
ASSETS_XML   = BASE / "_local/anno-official-data/config/export/assets.xml"
OFFICIAL_CSV = BASE / "_local/anno-official-data/official_master.csv"
CURRENT_JSON = BASE / "apps/wiki/docs/wiki/buildings-effects.json"
OUTPUT_JSON  = BASE / "apps/wiki/docs/wiki/buildings-effects.json"
OUTPUT_LIGHT = BASE / "_local/anno-official-data/buildings-data.json"

DRY_RUN = "--dry-run" in sys.argv

COIN_GUID = "1010017"

BUILDING_TEMPLATES = {
    "Production", "Production Field", "Production Marsh",
    "Production Marsh Pasture", "Production Marsh Area", "Production Area",
    "PublicServiceBuilding", "MiniInstitutionBuilding",
    "ResidenceBuilding", "Monument", "CityInstitutionBuilding",
    "CityInstitutionBuilding_Marsh",
    "RecruitmentBuilding", "SlotFactoryBuilding7",
    # 港湾・インフラ・特殊建物
    "HarborWarehouse", "HarborDepot", "TradeBuilding", "RepairCrane",
    "AqueductConnector", "VillaUrban", "GuestHouse",
    "Canal", "MonumentEventBuilding",
}

# BuildingBuff/AttributeProvider → JSON フィールドの対応
BUFF_ATTR = {
    "happiness": "Happiness",
    "health":    "Health",
    "fireSafety":"FireSafety",
    "knowledge": "Knowledge",
    "prestige":  "Prestige",
    "faith":     "Belief",
    "income":    "Money",
    "population":"Population",
}


def icon_key(path: str) -> str | None:
    m = re.search(r"icon_3d_(\w+)\.png$", path or "")
    return m.group(1) if m else None


# ---- Step 1: official_master.csv ----
print("Loading official_master.csv...", file=sys.stderr)
en_to_guid: dict[str, list[str]] = defaultdict(list)
guid_to_ja:  dict[str, str] = {}
guid_to_en:  dict[str, str] = {}
with open(OFFICIAL_CSV, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        g = row["guid"].strip()
        en = (row["officialEN"] or "").strip()
        ja = (row["officialJA"] or "").strip()
        guid_to_en[g] = en
        guid_to_ja[g] = ja
        if en:
            en_to_guid[en].append(g)
print(f"  {len(guid_to_en)} entries", file=sys.stderr)


# ---- Step 2: assets.xml パース ----
print("Parsing assets.xml (31 MB, may take ~10 sec)...", file=sys.stderr)
tree = ET.parse(str(ASSETS_XML))
root = tree.getroot()

guid_to_asset: dict[str, ET.Element] = {}
for asset in root.iter("Asset"):
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    if g:
        guid_to_asset[g] = asset
print(f"  {len(guid_to_asset)} assets indexed", file=sys.stderr)


# ---- Step 3: BuildingBuff 効果値ヘルパー ----
def buff_values(buff_guid: str) -> dict[str, int]:
    asset = guid_to_asset.get(buff_guid)
    if asset is None:
        return {}
    tmpl = (asset.findtext("Template") or "").strip()
    if tmpl != "BuildingBuff":
        return {}
    attrs = asset.find(".//BuildingUpgrade/AdditionalAttributes")
    if attrs is None:
        return {}
    out = {}
    for field, xml_tag in BUFF_ATTR.items():
        val = attrs.findtext(f"{xml_tag}/AmountOrPercent/Value")
        if val:
            try:
                out[field] = int(val.strip())
            except ValueError:
                pass
    return out


def effect_buff_values(effect_guid: str) -> dict[str, int]:
    """Effect GUID → Buffs → BuildingBuff 効果値を集約"""
    asset = guid_to_asset.get(effect_guid)
    if asset is None:
        return {}
    combined: dict[str, int] = defaultdict(int)
    for item in asset.findall(".//Effect/Buffs/Item/GUID"):
        g = (item.text or "").strip()
        for k, v in buff_values(g).items():
            combined[k] += v
    return dict(combined)


# ---- Step 4: AttributeProvider 直接効果値ヘルパー ----
def attr_provider_values(asset: ET.Element) -> dict[str, int]:
    attrs = asset.find(".//AttributeProvider/Attributes")
    if attrs is None:
        return {}
    out = {}
    for field, xml_tag in BUFF_ATTR.items():
        # AttributeProvider は <Tag><Value>N</Value></Tag> の構造
        val = attrs.findtext(f"{xml_tag}/Value")
        if val:
            try:
                out[field] = int(val.strip())
            except ValueError:
                pass
    return out


def get_maintenance(asset: ET.Element) -> int:
    for item in asset.findall(".//Maintenance/Maintenances/Item"):
        if (item.findtext("Product") or "").strip() == COIN_GUID:
            amt = item.findtext("Amount")
            if amt:
                try:
                    return -abs(int(amt.strip()))
                except ValueError:
                    pass
    return 0


# ---- Step 5: 対象テンプレートの建物を抽出 ----
print("Extracting building assets...", file=sys.stderr)
# GUID → 抽出データ
extracted: dict[str, dict] = {}

for asset in root.iter("Asset"):
    tmpl = (asset.findtext("Template") or "").strip()
    if tmpl not in BUILDING_TEMPLATES:
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    if not g:
        continue

    maint = get_maintenance(asset)
    direct = attr_provider_values(asset)

    combined: dict[str, int] = defaultdict(int)
    for eff_item in asset.findall(".//Building/FunctionalEffects/Item/FunctionalEffect"):
        eff_guid = (eff_item.text or "").strip()
        for k, v in effect_buff_values(eff_guid).items():
            combined[k] += v
    # 直接効果を上書き合算（直接効果は建物自体の負値が主）
    for k, v in direct.items():
        combined[k] = combined.get(k, 0) + v

    extracted[g] = {
        "guid":         g,
        "internalName": (asset.findtext(".//Standard/Name") or "").strip(),
        "template":     tmpl,
        "nameEn":       guid_to_en.get(g, ""),
        "nameJa":       guid_to_ja.get(g, ""),
        "iconKey":      icon_key(asset.findtext(".//Standard/IconFilename") or ""),
        "maintenance":  maint,
        "population":   combined.get("population", 0),
        "income":       combined.get("income", 0),
        "faith":        combined.get("faith", 0),
        "knowledge":    combined.get("knowledge", 0),
        "prestige":     combined.get("prestige", 0),
        "health":       combined.get("health", 0),
        "happiness":    combined.get("happiness", 0),
        "fireSafety":   combined.get("fireSafety", 0),
    }

print(f"  {len(extracted)} building assets extracted", file=sys.stderr)

# ---- Step 6: 軽量JSONを出力1 ----
OUTPUT_LIGHT.write_text(
    json.dumps(list(extracted.values()), ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Wrote {OUTPUT_LIGHT}", file=sys.stderr)


# ---- Step 7: 現行 buildings-effects.json にマージ ----
print("Loading current buildings-effects.json...", file=sys.stderr)
with open(CURRENT_JSON, encoding="utf-8") as f:
    current_data = json.load(f)

# id → GUID 手動マッピング（nameEnとofficialENが一致しない建物）
ID_TO_GUID: dict[str, str] = {
    # Roman建物: nameEnとofficialENのスペル違い・名称違い
    "resin_trapper":  "31752",  # "Resin Tapper" (tapper vs trapper)
    "gold_smelter":   "31755",  # "Goldsmith" (単複違い)
    "lyre_factory":   "4832",   # "Lythier" (スペル違い)
    "thermae":        "3620",   # "Baths" (名称違い)
    "residence":      "3087",   # "Libertus Residence" (libertus tier)
    # Albion建物: 公式名がゲーム内表示名と異なる
    "albion_bards_brazier":    "6727",   # Bardic Hearth
    "albion_dye_plant_field":  "2800",   # Weld Crop
    "albion_council":          "6726",   # Alder Council
    "albion_green_dye_house":  "5469",   # Greenhands
    "albion_cloak_maker":      "5614",   # Birrus Stitcher
    "albion_beaver_hunter":    "31759",  # Beaver Trapper
    "albion_beaver_hat":       "31770",  # Beaver Hatter
    "albion_saltwort_kiln":    "31772",  # Saltwort Burner
    "albion_chariot_body":     "5611",   # Chassis Builder
    "albion_sausage_factory":  "5959",   # Salsicium
    "albion_brooch_factory":   "5605",   # Fibularium
    "albion_tongue_extractor": "5477",   # Tongue Plucker
    "albion_headgear_factory": "31766",  # Headpiece Maker
    "albion_wig_factory":      "31769",  # Wig Maker
    "albion_mirror_factory":   "5615",   # Narcissium
    "albion_epicure_of_air":   "5604",   # Epicure of Air
    "albion_winery":           "23753",  # Vintner
    "albion_logging_camp":     "5976",   # Woodcutter
    "albion_cattle_farm":      "5847",   # Ochs Farm
    "albion_pants_maker":      "5608",   # Hosier
    "albion_torque_workshop":  "5606",   # Wire-Twister
    "albion_pony_farm":        "5975",   # Horsecatcher
    "albion_mud_hut":          "5848",   # Mud Drier
    "albion_shell_fishing":    "8431",   # Shell Gatherer
    "albion_eel_catcher":      "5299",   # Eel Grabber
    "albion_reed_gathering":   "5849",   # Reed Gatherer
    "albion_shoe_maker":       "5609",   # Shoe Weaver
    "albion_malt_house":       "5474",   # Malthouse
    "albion_horn_smithy":      "55963",  # Horner
    "albion_shield_factory":   "31773",  # Shieldbeater
    "albion_weapon_workshop":  "5954",   # Weaponsmith (Celtic)
    "albion_armor_workshop":   "55945",  # Armourer (Celtic)
    "albion_silver_mine":      "5980",   # Silver Mine (Celtic)
    "albion_silver_smithy":    "5472",   # Silver Forge
    "albion_donkey_mill":      "5967",   # Donkey Mill
    "albion_herb_garden":      "31764",  # Herb Garden
    "albion_tile_factory":     "5947",   # Tiler (Celtic)
    "albion_charcoal_factory": "5977",   # Charcoal Burner (Celtic)
    "albion_sail_factory":     "5955",   # Sailmaker (Celtic)
    "albion_rope_mill":        "5956",   # Ropemaker (Celtic)
    # nameEn と officialEN が一致しないため手動マッピング
    "warehouse":           "3402",   # officialEN="Trading Post" (HarborWarehouse Lv1)
    "aqueduct_source":     "19723",  # officialEN="Aqueduct" (AqueductConnector Roman)
    "albion_resin_trapper": "31761", # officialEN="Resin Tapper" (Celtic版)
    "albion_horse_farm":   "15514",  # officialEN="Horse Breeder" (Celtic版)
    # NOT FOUND in official_master.csv / no matching building template (keep current values):
    # military_camp, albion_water_gate, albion_panam, aqueduct_cistern
}

# GUID-lookup: 手動マッピング優先 → nameEn照合 → "(Albion)"除去照合
def find_guid(entry: dict) -> str | None:
    bid = entry.get("id", "")

    # 手動マッピング優先
    if bid in ID_TO_GUID:
        return ID_TO_GUID[bid]

    name_en = (entry.get("nameEn") or "").strip()
    is_albion = bid.startswith("albion_")

    # "(Albion)" サフィックスを除いて検索
    search_name = name_en
    if search_name.endswith(" (Albion)"):
        search_name = search_name[: -len(" (Albion)")]

    candidates = en_to_guid.get(name_en, []) or en_to_guid.get(search_name, [])
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    # 同名複数: AssociatedRegions で Celtic/Roman を判別
    for c in candidates:
        region = (guid_to_asset.get(c, ET.Element("x")).findtext(".//Building/AssociatedRegions") or "")
        if is_albion and region == "Celtic":
            return c
        if not is_albion and region == "Roman":
            return c

    return candidates[0]  # fallback

EFFECT_FIELDS = ["maintenance", "population", "income", "faith",
                 "knowledge", "prestige", "health", "happiness", "fireSafety"]

updated = 0
unmatched = []
new_buildings = list(current_data["buildings"])

for entry in new_buildings:
    guid = find_guid(entry)
    if guid is None or guid not in extracted:
        unmatched.append(entry["id"])
        continue
    src = extracted[guid]
    for field in EFFECT_FIELDS:
        entry[field] = src[field]
    updated += 1

print(f"  Matched: {updated} / {len(new_buildings)}", file=sys.stderr)
if unmatched:
    print(f"  Unmatched IDs ({len(unmatched)}): {unmatched}", file=sys.stderr)

# ---- Step 8: diff 表示 or 書き込み ----
out_data = {"buildings": new_buildings}

if DRY_RUN:
    print("\n--- DRY RUN: buildings-effects.json は変更しません ---")
    print(json.dumps(out_data, ensure_ascii=False, indent=2)[:3000], "...")
else:
    OUTPUT_JSON.write_text(
        json.dumps(out_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_JSON}", file=sys.stderr)

print("Done.", file=sys.stderr)
