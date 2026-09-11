# -*- coding: utf-8 -*-
"""
計算機（apps/calculator）のアイテム生産性ブースト機能を V2.0.0.1(DLC02) に対応させる。

出典: _local/anno-official-data/v2.0.0.1/items_export_with_effects.csv
    (GitHub Taludas/Anno-117-Item-Inspector 同梱データ)

生成物:
  - packages/shared/public/data/items/{guid}.json （ProductivityUpgrade を持つアイテムのみ、旧55件を置換）
  - packages/shared/public/i18n/locales/ja.json / en.json の specialists セクションを更新

対象は「生産性ブースト(ProductivityUpgrade)」を持ち、かつ Targets が商品(Goods)の
GUIDに解決できるアイテムのみ。解決できないものは計算機のブーストトグルとして機能しない
ため対象外とする（wiki側 items.md には引き続き掲載されるので情報が失われるわけではない）。
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "_local/anno-official-data/v2.0.0.1/items_export_with_effects.csv"
ITEMS_FULL = ROOT / "packages/shared/public/data/items-full.json"
PRODUCTIONS_DIR = ROOT / "packages/shared/public/productions"
ITEMS_OUT_DIR = ROOT / "packages/shared/public/data/items"
ICONS_DIR = ROOT / "packages/shared/public/icons/items"
JA_I18N = ROOT / "packages/shared/public/i18n/locales/ja.json"
EN_I18N = ROOT / "packages/shared/public/i18n/locales/en.json"


def build_guid_to_good_name() -> dict[str, str]:
    """生産チェーンJSONの guid -> 商品英語名（name）マップを構築する。"""
    mapping: dict[str, str] = {}
    for path in PRODUCTIONS_DIR.glob("*.json"):
        if path.name in ("list.json", "item-compatibility.json"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        guid = data.get("guid")
        name = data.get("name")
        if guid and name:
            mapping[str(guid)] = name
    return mapping


def resolve_target_good_names(targets_raw: str, guid_to_name: dict[str, str]) -> list[str]:
    names: list[str] = []
    for group in (targets_raw or "").split("|"):
        group = group.strip()
        if not group:
            continue
        member_str = group.split(":", 1)[1] if ":" in group else group
        for member in member_str.split(";"):
            member = member.strip()
            name = guid_to_name.get(member)
            if name and name not in names:
                names.append(name)
    return names


def load_items_full() -> dict[str, dict]:
    data = json.loads(ITEMS_FULL.read_text(encoding="utf-8"))
    return {str(item["guid"]): item for item in data}


def main() -> None:
    guid_to_name = build_guid_to_good_name()
    items_full = load_items_full()
    existing_icons = {p.stem for p in ICONS_DIR.glob("*.png")}

    with CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    generated: dict[str, dict] = {}
    skipped_unresolved: list[str] = []

    for row in rows:
        guid = (row.get("GUID") or "").strip()
        if not guid.isdigit():
            continue
        buff_effects = row.get("Buff Effects") or ""
        m = re.search(r"ProductivityUpgrade:\s*\+?(-?[\d.]+)%", buff_effects)
        if not m:
            continue
        value = float(m.group(1))

        target_names = resolve_target_good_names(row.get("Targets") or "", guid_to_name)
        if not target_names:
            skipped_unresolved.append(guid)
            continue

        full = items_full.get(guid, {})
        display_name = full.get("nameJa") or full.get("nameEn") or f"#{guid}"
        icon_filename = f"{guid}.png" if guid in existing_icons else ""

        generated[guid] = {
            "displayName": display_name,
            "guid": guid,
            "description": full.get("description", ""),
            "iconFilename": icon_filename,
            "rarity": full.get("rarity", ""),
            "niche": full.get("niche", ""),
            "targets": [
                {"producedGoods": [{"name": name} for name in target_names]}
            ],
            "buffs": [
                {"FactoryUpgrade": {"ProductivityUpgrade": value}}
            ],
        }

    # 旧データを新データで置換
    ITEMS_OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old_file in ITEMS_OUT_DIR.glob("*.json"):
        old_file.unlink()
    for guid, payload in generated.items():
        out_path = ITEMS_OUT_DIR / f"{guid}.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # i18n specialists セクション更新
    for i18n_path, name_key in ((JA_I18N, "nameJa"), (EN_I18N, "nameEn")):
        data = json.loads(i18n_path.read_text(encoding="utf-8"))
        specialists = data.setdefault("specialists", {})
        for guid in generated:
            full = items_full.get(guid, {})
            name = full.get(name_key)
            if name:
                specialists[guid] = name
        data["specialists"] = dict(sorted(specialists.items(), key=lambda kv: int(kv[0])))
        i18n_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"生成件数: {len(generated)}")
    print(f"商品名未解決でスキップ: {len(skipped_unresolved)} -> {skipped_unresolved}")
    icon_count = sum(1 for v in generated.values() if v["iconFilename"])
    print(f"アイコンあり: {icon_count} / アイコンなし: {len(generated) - icon_count}")


if __name__ == "__main__":
    main()
