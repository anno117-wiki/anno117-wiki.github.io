# -*- coding: utf-8 -*-
"""
Anno 117 公式データ（assets.xml + official_master.csv）から
商品・住民ニーズ・住民層・技術ツリーを一括抽出する。

出力: _local/anno-official-data/game-data.json（gitignore済み）

使い方:
  python tools/build-game-data.py [--dry-run]
"""
import json, csv, re, sys
from pathlib import Path
from collections import defaultdict
import xml.etree.ElementTree as ET

BASE = Path(__file__).parent.parent
ASSETS_XML   = BASE / "_local/anno-official-data/config/export/assets.xml"
OFFICIAL_CSV = BASE / "_local/anno-official-data/official_master.csv"
OUTPUT_JSON  = BASE / "_local/anno-official-data/game-data.json"
TECHS_JSON         = BASE / "apps/wiki/docs/wiki/techs.json"
PROD_CHAINS_JSON   = BASE / "apps/wiki/docs/wiki/production-chains-official.json"
NEEDS_INDEX_JSON   = BASE / "apps/wiki/docs/wiki/needs-index.json"

DRY_RUN = "--dry-run" in sys.argv


def icon_key_3d(path: str) -> str | None:
    m = re.search(r"icon_3d_(\w+)\.png$", path or "")
    return m.group(1) if m else None


def icon_key_2d(path: str) -> str | None:
    m = re.search(r"icon_2d_(\w+)\.png$", path or "")
    return m.group(1) if m else None


# ---- Step 1: official_master.csv ----
print("Loading official_master.csv...", file=sys.stderr)
guid_to_en: dict[str, str] = {}
guid_to_ja: dict[str, str] = {}
with open(OFFICIAL_CSV, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        g = row["guid"].strip()
        guid_to_en[g] = (row["officialEN"] or "").strip()
        guid_to_ja[g] = (row["officialJA"] or "").strip()
print(f"  {len(guid_to_en)} entries", file=sys.stderr)

TEXTS_DIR = BASE / "_local/anno-official-data/config/gui"


def load_texts(path: Path) -> dict[str, str]:
    """texts_*.xml から LineId→Text の辞書を返す。outer <Text> のみ対象。"""
    store: dict[str, str] = {}
    for _, el in ET.iterparse(str(path), events=("end",)):
        if el.tag == "Text" and el.find("LineId") is not None:
            lid = (el.findtext("LineId") or "").strip()
            txt = (el.findtext("Text") or "").strip()
            if lid:
                store[lid] = txt
            el.clear()
        elif el.tag == "Texts":
            el.clear()
    return store


print("Loading texts_japanese.xml / texts_english.xml...", file=sys.stderr)
line_to_ja: dict[str, str] = load_texts(TEXTS_DIR / "texts_japanese.xml")
line_to_en: dict[str, str] = load_texts(TEXTS_DIR / "texts_english.xml")
print(f"  JA: {len(line_to_ja)}, EN: {len(line_to_en)}", file=sys.stderr)


def clean_text(t: str) -> str:
    return re.sub(r"​", "", t)


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


# ---- Step 3: Products（商品） ----
print("Extracting products...", file=sys.stderr)
products: list[dict] = []

for asset in root.iter("Asset"):
    if (asset.findtext("Template") or "").strip() != "Product":
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    name = (asset.findtext(".//Standard/Name") or "").strip()
    icon_path = (asset.findtext(".//Standard/IconFilename") or "").strip()

    name_en = guid_to_en.get(g, name)
    name_ja = guid_to_ja.get(g, "")

    # 内部的・システム用商品を除外（名前が空 or 日英名両方空）
    if not name_en and not name_ja and not name:
        continue

    products.append({
        "guid":    g,
        "nameEn":  name_en or name,
        "nameJa":  name_ja,
        "iconKey": icon_key_3d(icon_path) or icon_key_2d(icon_path),
        "iconPath": icon_path,
    })

print(f"  {len(products)} products", file=sys.stderr)


# ---- Step 4: Needs（住民ニーズ） ----
print("Extracting needs...", file=sys.stderr)
needs: list[dict] = []

NEED_ATTRS = {
    "population": "Population",
    "income":     "Money",
    "happiness":  "Happiness",
    "faith":      "Belief",
    "knowledge":  "Knowledge",
    "prestige":   "Prestige",
    "health":     "Health",
    "fireSafety": "FireSafety",
}

for asset in root.iter("Asset"):
    if (asset.findtext("Template") or "").strip() != "Need":
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    name = (asset.findtext(".//Standard/Name") or "").strip()
    product_guid = (asset.findtext(".//Need/NeedProduct") or "").strip()

    bonuses: dict[str, int] = {}
    attrs_el = asset.find(".//Need/NeedAttributes")
    if attrs_el is not None:
        for field, xml_tag in NEED_ATTRS.items():
            val = attrs_el.findtext(f"{xml_tag}/Value")
            if val:
                try:
                    bonuses[field] = int(val.strip())
                except ValueError:
                    pass

    # Need名パターン "Need {region} {category} ..." から region/category を抽出
    _REGIONS = ["Roman Celtic", "Roman", "Celtic"]
    _CATS    = ["Public", "Food", "Fashion", "Household", "Wonder", "Wonders",
                "Culture", "Boardgames"]
    need_region = need_category = ""
    tail = name.removeprefix("Tech ").removeprefix("Need ").strip()
    for r in _REGIONS:
        if tail.startswith(r):
            need_region = r
            tail = tail[len(r):].strip()
            break
    for c in _CATS:
        if tail.startswith(c):
            need_category = "Wonder" if c == "Wonders" else c
            break

    needs.append({
        "guid":           g,
        "nameEn":         guid_to_en.get(g, name),
        "nameJa":         guid_to_ja.get(g, ""),
        "needProductGuid": product_guid,
        "region":         need_region,
        "category":       need_category,
        **bonuses,
    })

print(f"  {len(needs)} needs", file=sys.stderr)


# ---- Step 5: PopulationLevels（住民層） ----
print("Extracting population levels...", file=sys.stderr)
TIER_NAME_MAP = {
    "Level1": "libertus",
    "Level2": "plebeian",
    "Level3": "equites",
    "Level4": "patrician",
}

pop_levels: list[dict] = []

for asset in root.iter("Asset"):
    if (asset.findtext("Template") or "").strip() != "PopulationLevel":
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    name = (asset.findtext(".//Standard/Name") or "").strip()
    icon_path = (asset.findtext(".//Standard/IconFilename") or "").strip()
    workforce_guid = (asset.findtext(".//PopulationLevel/ConnectedWorkforce") or "").strip()
    tier_key = (asset.findtext(".//PopulationLevel/PopulationTier") or "Level1").strip()
    factor = (asset.findtext(".//PopulationLevel/PopulationToWorkforceFactor") or "").strip()

    # Roman/Celtic 判定（internalName から）
    region = "Roman" if "Roman" in name and "Celtic" not in name else "Celtic"

    pop_levels.append({
        "guid":           g,
        "nameEn":         guid_to_en.get(g, name),
        "nameJa":         guid_to_ja.get(g, ""),
        "tier":           TIER_NAME_MAP.get(tier_key, tier_key.lower()),
        "region":         region,
        "iconKey":        re.search(r"([^/]+)\.png$", icon_path).group(1) if icon_path else None,
        "workforceGuid":  workforce_guid,
        "workforceFactor": float(factor) if factor else None,
    })

print(f"  {len(pop_levels)} population levels", file=sys.stderr)


# ---- Step 6: Techs（技術ツリー） ----
print("Extracting techs...", file=sys.stderr)

# 既存 techs.json の保護フィールドを読み込む（再実行で上書きしない）
existing_tech_name_ja: dict[str, str] = {}
existing_tech_protected: dict[str, dict] = {}
_PROTECTED_FIELDS = ["connections", "gridX", "gridY", "annoS", "annoR"]
if TECHS_JSON.exists():
    try:
        _existing = json.loads(TECHS_JSON.read_text(encoding="utf-8"))
        for _t in _existing.get("techs", []):
            g = _t.get("guid")
            if not g:
                continue
            if _t.get("nameJa"):
                existing_tech_name_ja[g] = _t["nameJa"]
            saved = {f: _t[f] for f in _PROTECTED_FIELDS if f in _t}
            if saved:
                existing_tech_protected[g] = saved
    except Exception:
        pass

# Trigger → 解禁コスト取得ヘルパー
def get_knowledge_cost(trigger_guid: str) -> int | None:
    a = guid_to_asset.get(trigger_guid)
    if a is None:
        return None
    # ConditionNeedAttributeCounter/NeedAttributeAmount
    for cond in a.findall(".//TriggerCondition"):
        ktype = cond.findtext(".//ConditionNeedAttributeCounter/NeedAttributeType") or ""
        if ktype == "Knowledge":
            amt = cond.findtext(".//ConditionNeedAttributeCounter/NeedAttributeAmount")
            if amt:
                try:
                    return int(amt.strip())
                except ValueError:
                    pass
    return None


techs: list[dict] = []

for asset in root.iter("Asset"):
    if (asset.findtext("Template") or "").strip() != "Tech":
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    name = (asset.findtext(".//Standard/Name") or "").strip()
    icon_path = (asset.findtext(".//Standard/IconFilename") or "").strip()
    is_gate = (asset.findtext(".//Tech/IsGate") or "0").strip() == "1"
    color = (asset.findtext(".//Tech/Color") or "").strip()
    researchable_trigger = (asset.findtext(".//Tech/TechResearchableTrigger") or "").strip()
    desc_line_id = (asset.findtext(".//Tech/TechDescription") or "").strip()
    tech_icon_guid = (asset.findtext(".//Tech/TechIcon") or "").strip()

    knowledge_needed = (asset.findtext(".//Tech/KnowledgeNeeded") or "").strip()
    if knowledge_needed:
        try:
            knowledge_cost = int(knowledge_needed)
        except ValueError:
            knowledge_cost = None
    else:
        knowledge_cost = get_knowledge_cost(researchable_trigger) if researchable_trigger else None

    # TechIcon GUID → IconFilename
    tech_icon_asset = guid_to_asset.get(tech_icon_guid)
    tech_icon_path = (tech_icon_asset.findtext(".//Standard/IconFilename") or "").strip() if tech_icon_asset is not None else ""

    # Rewards（Unlocks / Effects）の InfoDescription → 効果説明
    reward_guids = (
        [(i.findtext("UnlockReward") or "").strip() for i in asset.findall(".//Rewards/Unlocks/Item")]
        + [(i.findtext("EffectAsset") or "").strip() for i in asset.findall(".//Rewards/Effects/Item")]
    )
    effect_ja_parts: list[str] = []
    effect_en_parts: list[str] = []
    for rg in reward_guids:
        if not rg:
            continue
        ra = guid_to_asset.get(rg)
        if ra is None:
            continue
        info_id = (ra.findtext(".//Standard/InfoDescription") or "").strip()
        if info_id:
            t_ja = clean_text(line_to_ja.get(info_id, ""))
            t_en = clean_text(line_to_en.get(info_id, ""))
            if t_ja:
                effect_ja_parts.append(t_ja)
            if t_en:
                effect_en_parts.append(t_en)

    _entry: dict = {
        "guid":           g,
        "internalName":   name,
        "nameEn":         guid_to_en.get(g, name),
        "nameJa":         existing_tech_name_ja.get(g) or guid_to_ja.get(g, ""),
        "descEn":         clean_text(line_to_en.get(desc_line_id, "")),
        "descJa":         clean_text(line_to_ja.get(desc_line_id, "")),
        "effectJa":       " / ".join(effect_ja_parts),
        "effectEn":       " / ".join(effect_en_parts),
        "iconKey":        icon_key_2d(icon_path),
        "techIconPath":   tech_icon_path,
        "isGate":         is_gate,
        "color":          color,
        "knowledgeCost":  knowledge_cost,
        "gridX":          int(asset.findtext(".//Tech/GridPosition/X") or 0),
        "gridY":          int(asset.findtext(".//Tech/GridPosition/Y") or 0),
    }
    # -UNUSED タグを持つノードはスキップ（殿裁定: 存在しないノードとして扱う）
    if "-UNUSED" in name:
        continue
    # 保護フィールドを上書きしない（connections/gridX/gridY/annoS/annoR）
    for _f, _v in existing_tech_protected.get(g, {}).items():
        _entry[_f] = _v
    techs.append(_entry)

print(f"  {len(techs)} techs", file=sys.stderr)


# ---- Step 7: ProductionChains（生産チェーン） ----
print("Extracting production chains...", file=sys.stderr)
chains: list[dict] = []

for asset in root.iter("Asset"):
    if (asset.findtext("Template") or "").strip() != "ProductionChain":
        continue
    g = (asset.findtext(".//Standard/GUID") or "").strip()
    name = (asset.findtext(".//Standard/Name") or "").strip()
    pcn = asset.find(".//ProductionChain")
    if pcn is None:
        continue

    building_guid = (pcn.findtext("Building") or "").strip()
    input_guids = [
        (item.findtext("Building") or "").strip()
        for item in pcn.findall("Tier1/Item")
        if (item.findtext("Building") or "").strip()
    ]

    # Roman/Celtic 判定（internalName から。"Roman Celtic"=共通はCelticに寄せる前にRoman優先）
    if "Celtic" in name:
        region = "Roman Celtic" if "Roman" in name else "Celtic"
    else:
        region = "Roman"

    chains.append({
        "guid":               g,
        "nameEn":             guid_to_en.get(g, name),
        "nameJa":             guid_to_ja.get(g, ""),
        "region":             region,
        "buildingGuid":       building_guid,
        "buildingNameEn":     guid_to_en.get(building_guid, ""),
        "buildingNameJa":     guid_to_ja.get(building_guid, ""),
        "inputBuildingGuids": input_guids,
    })

print(f"  {len(chains)} production chains", file=sys.stderr)


# ---- Step 8: 出力 ----
out = {
    "products":         products,
    "needs":            needs,
    "populationLevels": pop_levels,
    "techs":            techs,
    "productionChains": chains,
}

summary = {k: len(v) for k, v in out.items()}
print(f"Summary: {summary}", file=sys.stderr)

if DRY_RUN:
    print("\n--- DRY RUN: game-data.json / techs.json は書き込みません ---")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
else:
    OUTPUT_JSON.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_JSON}", file=sys.stderr)
    TECHS_JSON.write_text(
        json.dumps({"techs": techs}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {TECHS_JSON}", file=sys.stderr)
    PROD_CHAINS_JSON.write_text(
        json.dumps({"chains": chains}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {PROD_CHAINS_JSON}", file=sys.stderr)

    # ResidenceBuilding から need GUID → [(tier, region)] のマッピングを構築
    _TIER_NUM_MAP = {"01": "libertus", "02": "plebeian", "03": "equites", "04": "patrician"}
    need_guid_to_tiers: dict[str, list[dict]] = defaultdict(list)
    for asset in root.iter("Asset"):
        if (asset.findtext("Template") or "").strip() != "ResidenceBuilding":
            continue
        name = (asset.findtext(".//Standard/Name") or "").strip()
        if not name.startswith("Residence "):
            continue
        if "Roman Celtic" in name:
            res_region = "RomanCeltic"
        elif "Celtic" in name:
            res_region = "Celtic"
        else:
            res_region = "Roman"
        m = re.search(r"\b(0[1-4])\b", name)
        if not m:
            continue
        tier_key = _TIER_NUM_MAP.get(m.group(1), "")
        if not tier_key:
            continue
        for el in asset.iter("Need"):
            guid = (el.text or "").strip()
            if guid and guid.isdigit():
                entry = {"tier": tier_key, "region": res_region}
                if entry not in need_guid_to_tiers[guid]:
                    need_guid_to_tiers[guid].append(entry)

    # needs 逆引き: product_guid → 商品名 + [{region, category}] + [tiers]
    guid_to_product = {p["guid"]: p for p in products}
    needs_by_guid: dict[str, dict] = {}
    for need in needs:
        pg = need["needProductGuid"]
        if not pg:
            continue
        if pg not in needs_by_guid:
            prod = guid_to_product.get(pg, {})
            needs_by_guid[pg] = {
                "productGuid":   pg,
                "productNameEn": prod.get("nameEn", ""),
                "productNameJa": prod.get("nameJa", ""),
                "demands": [],
                "tiers": [],
            }
        r, c = need.get("region", ""), need.get("category", "")
        if r and c:
            entry = {"region": r, "category": c}
            if entry not in needs_by_guid[pg]["demands"]:
                needs_by_guid[pg]["demands"].append(entry)
        for tier_entry in need_guid_to_tiers.get(need["guid"], []):
            if tier_entry not in needs_by_guid[pg]["tiers"]:
                needs_by_guid[pg]["tiers"].append(tier_entry)

    CAT_ORDER = ["Food", "Fashion", "Household", "Public", "Culture", "Boardgames", "Wonder"]
    needs_index = sorted(
        needs_by_guid.values(),
        key=lambda x: (CAT_ORDER.index(x["demands"][0]["category"]) if x["demands"] and x["demands"][0]["category"] in CAT_ORDER else 99,
                       x["productNameJa"] or x["productNameEn"]),
    )
    NEEDS_INDEX_JSON.write_text(
        json.dumps({"needsByProduct": needs_index}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {NEEDS_INDEX_JSON}", file=sys.stderr)

print("Done.", file=sys.stderr)
