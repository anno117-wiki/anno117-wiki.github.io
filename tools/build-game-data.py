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

    needs.append({
        "guid":           g,
        "nameEn":         guid_to_en.get(g, name),
        "nameJa":         guid_to_ja.get(g, ""),
        "needProductGuid": product_guid,
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

    knowledge_cost = get_knowledge_cost(researchable_trigger) if researchable_trigger else None

    techs.append({
        "guid":           g,
        "nameEn":         guid_to_en.get(g, name),
        "nameJa":         guid_to_ja.get(g, ""),
        "iconKey":        icon_key_2d(icon_path),
        "isGate":         is_gate,
        "color":          color,
        "knowledgeCost":  knowledge_cost,
    })

print(f"  {len(techs)} techs", file=sys.stderr)


# ---- Step 7: 出力 ----
out = {
    "products":        products,
    "needs":           needs,
    "populationLevels": pop_levels,
    "techs":           techs,
}

summary = {k: len(v) for k, v in out.items()}
print(f"Summary: {summary}", file=sys.stderr)

if DRY_RUN:
    print("\n--- DRY RUN: game-data.json は書き込みません ---")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
else:
    OUTPUT_JSON.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_JSON}", file=sys.stderr)

print("Done.", file=sys.stderr)
