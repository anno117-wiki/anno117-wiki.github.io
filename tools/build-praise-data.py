#!/usr/bin/env python3
"""称賛（ゲーム内の実績）のページ（wiki/praise）のデータ praise-list.json を、assets.xml から作る。

使い方: python tools/build-praise-data.py   （そのあと bun run build:site）
読み先: _local/anno-official-data/v3.0.1-steam/assets.xml（tools/assets_resolver.py）・texts_japanese.xml
出力  : apps/wiki/docs/wiki/praise-list.json

日本語版のゲームでは、実績は「称賛」メニューに出る。名前と条件の文は、ゲーム内の日本語の表記をそのまま使う（自分で訳さない）。
セット（AchievementSet）ごとに9件。セットを全部達成すると、称号（接頭語と接尾語）が解除される。
隠しの実績（名前と説明文がテキストに無いもの）は載せない。
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.stdout.reconfigure(encoding="utf-8")
from assets_resolver import Resolver  # noqa: E402
import assets_techs as techs_mod  # noqa: E402
import assets_texts as at  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/wiki/docs/wiki/praise-list.json"

R = Resolver()
JA = at.load_texts("japanese")

REGION_JA = {"Meta": "全地域", "Roman": "ラティウム", "Celtic": "アルビオン", "Egyptian": "アイギュプト"}
GRADE_JA = {"Bronze": "銅", "Silver": "銀", "Gold": "金"}


def research_note(ach_guid, tech_words):
    """条件に並ぶ研究（TechGuid）の名前から、内訳の文を作る。
    条件の研究が、そのスキルツリーのゲート以外の研究と過不足なく一致することを確かめる（違えば止まる）"""
    techs = {int(t["guid"]): t for t in techs_mod.load_techs()["techs"]}
    refs = [int(x) for k, x in R.get(ach_guid)["v"].items() if k.endswith("/TechGuid") and x.isdigit()]
    refs = sorted(set(refs))
    if not refs:
        sys.exit(f"条件に研究がありません: {ach_guid}")
    category = techs[refs[0]]["category"]
    expected = sorted(g for g, t in techs.items() if t["category"] == category and not t["gate"])
    if refs != expected:
        sys.exit(f"条件の研究が、ゲート以外の研究と一致しません: {ach_guid} 条件{len(refs)}件 ゲート以外{len(expected)}件")
    gates = [at.strip_zw(t["loca"]["japanese"]) for g, t in techs.items() if t["category"] == category and t["gate"]]
    names = [at.strip_zw(techs[g]["loca"]["japanese"]) for g in sorted(refs, key=lambda g: (-techs[g]["y"], techs[g]["x"]))]
    return (f"「{tech_words}」は、スキルツリーの研究のことです。{len(names)}件を全部研究します: {'・'.join(names)}。"
            f"次の段階への解放条件のゲート（{'・'.join(gates)}）は含みません")


# 条件の内訳を添える称賛（実績の資産の GUID → 内訳の文）。内訳はゲームのデータの条件から読んだ内容
NOTES = {
    145347: lambda: research_note(145347, "発見"),  # 自然哲学（火山の探鉱者 6番目）
}


def ja(text_id):
    """ゲーム内の日本語。無ければ None"""
    if not text_id:
        return None
    s = JA.get(int(text_id))
    return at.strip_zw(s).strip() if s else None


sets = sorted((g, el) for g, el in R.raw.items() if el.findtext("Template") == "AchievementSet")
out = []
total = 0
for guid, _ in sets:
    v = R.get(guid)["v"]
    name = ja(v.get("/Text/OasisId"))
    if not name:
        sys.exit(f"セットの名前がありません: {guid}")
    ids = [int(x) for k, x in v.items() if k.startswith("/AchievementSet/Achievements/") and k.endswith("/Asset")]
    rewards = []
    for k, x in v.items():
        if k.startswith("/AchievementSet/Rewards/") and k.endswith("/Reward"):
            rewards.append(ja(R.get(int(x))["v"].get("/Text/OasisId")))
    items, region = [], None
    for aid in ids:
        av = R.get(aid)["v"]
        title, desc = ja(av.get("/Achievement/AchievementTitle")), ja(av.get("/Achievement/AchievementDescription"))
        grade = GRADE_JA.get(av.get("/Achievement/AchievementDifficulty"))
        if not (title and desc and grade):
            sys.exit(f"実績の名前・条件・等級のどれかがありません: {aid} {title!r} {desc!r} {grade!r}")
        item = {"title": title, "desc": desc, "grade": grade}
        if aid in NOTES:
            item["note"] = NOTES[aid]()
        items.append(item)
        region = region or av.get("/Achievement/AchievementRegion")
    total += len(items)
    out.append({
        "name": name,
        "region": REGION_JA[region],
        "rewards": [r for r in rewards if r],
        "items": items,
    })

counts = {g: sum(1 for s in out for i in s["items"] if i["grade"] == g) for g in GRADE_JA.values()}
OUT.write_text(json.dumps({"sets": out}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"セット {len(out)}・実績 {total}件 {counts} → {OUT}")
