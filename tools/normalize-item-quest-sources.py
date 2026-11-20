"""アイテムの入手先（items-full.json の source）のクエスト名を、クエスト一覧の名前（実機のクエストブックの題名）にそろえる。

使い方: python tools/normalize-item-quest-sources.py   （そのあと bun run build:site）
        build-items-ja.py・apply-items-v3.py・build-quests-data.py を実行したあとに、必ずこれも実行する。

元の入手先には、クエストの題名・受ける画面の見出し・クエストの中の場面の見出し（「勝利の甘い味」など）が混ざっていて、
同じクエストが名前を変えて何度も並ぶ。クエスト一覧（apps/wiki/docs/wiki/quests-list.json）の名前に置き換え、重なりを除く。
クエスト一覧に無いクエストの名前は、そのまま残す。
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "packages/shared/public/data/items-full.json"
QUESTS = ROOT / "apps/wiki/docs/wiki/quests-list.json"

# クエスト一覧の名前・見出しから引けない名前（一覧の guid を直接指す）
ALIASES = {
    "星の創世記 V：ファルス～燈台": 154655,  # 一覧では VI の題名を足して1件にしている
}


# アイテム側の入手先にクエストが載っていないものを足す（アイテムの GUID → クエスト一覧の guid）。
# クエスト一覧の札には出るのに、元の入手先データが交易・祭りだけ（または空）のもの（2026-11-20 確認）
EXTRA_QUEST_SOURCES = {
    "51332": [41830],    # 人気の組み立て職人-エクスペラタ ← アルビオンの成果
    "51829": [154859],   # 魚捌き ← 追放者
    "51885": [106858],   # 内省の知性-メレサムン ← 運動シンポジウム
    "166421": [153567],  # 泥ふるい ← 平和を切り開く
    "179657": [153150],  # スイレン採集者 ← 騒乱の声
    "184794": [152807, 153567],  # マルクス・トライウス・ベローナ ← パンドラのアンフォラ・平和を切り開く
}


def norm(text):
    """全角・半角の違い（「第２部」と「第2部」）を無視して比べる。"""
    return unicodedata.normalize("NFKC", text)


QUEST_SOURCE = re.compile(r"^クエスト「(.+)」(?:（日本語名は未確認です）)?$")

for path in (ITEMS, QUESTS):
    if not path.exists():
        sys.exit(f"元データがありません: {path}")

quests = json.loads(QUESTS.read_text(encoding="utf-8"))
title_of = {x["guid"]: x["name"] for x in quests}


def lookup_table():
    """名前 → クエスト一覧の名前。題名 > 受ける画面の見出し > 場面の見出しの順で優先し、決まらないものは入れない。"""
    table = {}
    layers = [
        [(x["name"], x["guid"]) for x in quests],
        [(x["alt"], x["guid"]) for x in quests if x.get("alt")],
        [(s["title"], x["guid"]) for x in quests for s in x["steps"] if s.get("title")],
    ]
    for layer in layers:
        found = {}
        for key, guid in layer:
            found.setdefault(norm(key), set()).add(guid)
        for key, guids in found.items():
            if key not in table and len(guids) == 1:
                table[key] = title_of[next(iter(guids))]
    for key, guid in ALIASES.items():
        if guid not in title_of:
            sys.exit(f"ALIASES の guid がクエスト一覧にありません: {key} → {guid}")
        table[norm(key)] = title_of[guid]
    return table


table = lookup_table()
items = json.loads(ITEMS.read_text(encoding="utf-8"))
changed, kept = 0, set()
for item in items:
    sources = item.get("source") or []
    for guid in EXTRA_QUEST_SOURCES.get(str(item["guid"]), []):
        if guid not in title_of:
            sys.exit(f"EXTRA_QUEST_SOURCES の guid がクエスト一覧にありません: {item['nameJa']} → {guid}")
        sources = [f"クエスト「{title_of[guid]}」"] + [x for x in sources if x != f"クエスト「{title_of[guid]}」"]
        item["source"] = sources
    if not sources:
        continue
    out = []
    for s in sources:
        m = QUEST_SOURCE.match(s)
        if m and norm(m.group(1)) in table:
            s = f"クエスト「{table[norm(m.group(1))]}」"
        elif m:
            kept.add(m.group(1))
        if s not in out:
            out.append(s)
    if out != sources:
        item["source"] = out
        changed += 1

ITEMS.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"入手先を直したアイテム {changed}件 → {ITEMS}")
if kept:
    print(f"クエスト一覧に無いのでそのままの名前: {'、'.join(sorted(kept))}")
