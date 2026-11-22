"""クエスト一覧ページ（wiki/quests）のデータ quests-list.json を作る。

使い方: python tools/build-quests-data.py   （そのあと bun run build:site）
元データ:
  - _local/anno-official-data/v3.0-annohead/anno.sqlite（annohead。クエスト・選択肢・報酬）
  - _local/anno-official-data/v3.0.1-planner/quests.json（Planner。依頼人）
値は全て作者が変換したデータで、実機では未確認。ゲームの内部の変数を見る条件は、読める形にならないので「条件あり」とだけ出す。
"""
import json
import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "_local/anno-official-data/v3.0-annohead/anno.sqlite"
PLANNER = ROOT / "_local/anno-official-data/v3.0.1-planner/quests.json"
PLANNER_JA = ROOT / "_local/anno-official-data/v3.0.1-planner/quest_texts_japanese.json"  # annohead に無いクエストの題名
OUT = ROOT / "apps/wiki/docs/wiki/quests-list.json"
OVERRIDES = ROOT / "tools/data/quests-ja-overrides.json"
SITE_ITEMS = ROOT / "packages/shared/public/data/items-full.json"  # サイトのアイテム一覧（札のリンク先があるかを見る）
JA = 6
DENARII = 1010017
TEXT_LIMIT = 160

if not DB.exists():
    sys.exit(f"元データがありません: {DB}")
c = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)


def q(sql, *a):
    return c.execute(sql, a).fetchall()


# 3.0.1 のクエストの日本語の文（キーは文の番号）
planner_ja = json.loads(PLANNER_JA.read_text(encoding="utf-8")) if PLANNER_JA.exists() else {}
JA_OVERRIDES = {k: v for k, v in json.loads(OVERRIDES.read_text(encoding="utf-8")).items() if not k.startswith("_")}
JP_CHAR = re.compile(r"[ぁ-んァ-ヶ一-龠]")
used_override = False  # 今のクエストで仮訳を使ったか（クエストごとに戻す）

# ゲームが実行時に埋め込む差し込み → 読める言葉（上から順に当てる）
PLACEHOLDERS = [
    (re.compile(r"<img[^>]*/?>"), ""),
    (re.compile(r"\{(?:Static\.Tags\.LocationName|GetLocationInfo)\([^{}]*\)(?:\.LocationName)?\}"), "（島の名前）"),
    (re.compile(r"\{GetCompanyNameForParticipant\(Participants\.ActiveEmperor\)\}"), "（皇帝の名前）"),
    (re.compile(r"\{GetCompanyNameForParticipant\([^{}]*(?:\([^{}]*\))?[^{}]*\)\}"), "（人物の名前）"),
    (re.compile(r"\{Conditions:QuestCondition\.CurrentAmount\}"), "（今の数）"),
    (re.compile(r"\{Conditions:QuestCondition\.Amount\}"), "（必要な数）"),
    (re.compile(r"\{Conditions:QuestCondition:GetAmount\([^{}]*\)\}"), "（必要な量）"),
    (re.compile(r"\{AssetData\(Conditions:QuestCondition\.ExecutionObject\)\.Text\}"), "（届け先）"),
    (re.compile(r"\{AssetData\([^{}]*\)\.Text\}"), "（品物）"),
    (re.compile(r"\{Variables:[^{}]*\}"), "（数）"),
    (re.compile(r"\{[^{}]*\}"), "（…）"),
]


def readable(s):
    for pat, rep in PLACEHOLDERS:
        s = pat.sub(rep, s)
    return s


def tr(line, limit=None):
    global used_override
    if line is None:
        return None
    r = q("select value from translation where line_id=? and lang_id=?", line, JA)
    if not r or r[0][0] is None:
        return None
    s = " ".join(r[0][0].replace("​", "").replace("\r", "").split())
    # 3.0 では英語のままでも、3.0.1 で公式の日本語が付いた文は、そちらを使う
    if not JP_CHAR.search(s):
        s301 = " ".join(planner_ja.get(str(line), "").replace("​", "").replace("\r", "").split())
        if JP_CHAR.search(s301):
            s = s301
    if not JP_CHAR.search(s) and s in JA_OVERRIDES:
        s = JA_OVERRIDES[s]
        used_override = True
    s = readable(s)
    for tag in ("<b>", "</b>", "<i>", "</i>", "<br>", "<br/>"):
        s = s.replace(tag, " ")
    s = " ".join(s.split())
    if limit and len(s) > limit:
        s = s[:limit] + "…"
    return s or None


NAME_TABLES = ["product", "item", "building", "effect", "participant", "population_level",
               "tech", "unit", "ornament", "patron", "festival", "asset_name", "asset_pool"]


def name(guid):
    if guid is None:
        return None
    for t in NAME_TABLES:
        r = q(f"select name_text from {t} where guid=?", guid)
        if r:
            return tr(r[0][0])
    r = q("select title_text from questline where guid=?", guid)
    return tr(r[0][0]) if r else None


def num(v):
    return f"{v:,.0f}" if float(v).is_integer() else f"{v:g}"


def gname(v):
    return name(int(v)) if v and v.lstrip("-").isdigit() else None


def cond_text(cid):
    """読める条件だけ文にする。内部の変数を見る条件は None（呼ぶ側で「条件あり」）。"""
    if cid is None:
        return None
    parts, hidden = [], False
    for i, tpl, neg in q("select id,template,negate from condition where id=? or parent_id=? order by sub_order", cid, cid):
        p = dict(q("select key,value from condition_param where condition_id=?", i))
        s = None
        if tpl == "ConditionPlayerCounter":
            ctr, amt, nm = p.get("PlayerCounter"), p.get("CounterAmount", ""), gname(p.get("Context"))
            if ctr == "PopulationByLevel" and nm:
                s = f"{nm}が{amt}人以上"
            elif ctr == "GoodsInStock" and nm:
                s = f"{nm}を{amt}t持っている"
            elif ctr == "ObjectCount" and nm:
                s = f"{nm}が{amt}以上"
        elif tpl == "ConditionIsParticipantInGame":
            nm = gname(p.get("InGameProfile.Value"))
            s = f"{nm}がゲームにいる" if nm else None
        elif tpl == "ConditionIsProducible":
            nm = gname(p.get("Good"))
            s = f"{nm}を生産できる" if nm else None
        elif tpl == "ConditionTechResearched":
            nm = next((gname(v) for k, v in p.items() if gname(v)), None)
            s = f"研究「{nm}」済み" if nm else None
        elif tpl == "ConditionIsMaleProtagonist":
            s = "主人公が男性"
        elif tpl in ("ConditionAlwaysTrue", "ConditionAlwaysFalse"):
            continue
        if s is None:
            hidden = True
            continue
        parts.append(("ではない: " if neg else "") + s)
    if not parts:
        return "条件あり" if hidden else None
    return "・".join(parts) + ("ほか" if hidden else "")


KIND_LABEL = {"goods": "品物", "item": "アイテム", "effect": "効果", "reputation": "評判", "power": "影響",
              "racer": "御者", "unlock": "解放", "storyline": "次のクエスト", "incident": "出来事",
              "lock": "封鎖", "message_reward": "報酬", "xp": "経験値"}


def reward(r):
    kind, asset, amount, var, name_line, attr = r
    nm = tr(name_line) or name(asset) or ""
    amt = f" {num(amount)}" if amount is not None else ""
    if kind in ("item", "goods") and asset == DENARII:
        return {"t": f"デナリウス{amt}", "k": "money"}
    if kind == "storyline":
        return {"t": f"次のクエスト: {quest_title(asset) or asset}", "k": "quest"}
    if kind in ("reputation", "xp"):
        if kind == "reputation" and amount is not None:
            amt = f" {amount:+,.0f}" if float(amount).is_integer() else f" {amount:+g}"  # 評判は増減が分かるよう符号を付ける
        return {"t": f"{KIND_LABEL[kind]}{amt}" + (f"（{nm}）" if nm else ""), "k": kind}
    rar = q("select rarity from item where guid=?", asset) if kind in ("item", "goods") else []
    if rar and rar[0][0] != "Quest":
        # 専門家などのアイテム（「品物」の扱いで渡されるものも含む）
        return {"t": f"{nm}{amt if amount not in (None, 1) else ''}", "k": "item", "rarity": rar[0][0]}
    if rar:
        # クエスト専用の品（証拠品など）。札には出さない
        return {"t": f"品物: {nm}{amt}", "k": "questitem"}
    if kind == "item":
        # アイテムの扱いで渡されるが、アイテムの表に無いもの: 商品（武器など）か、クエストの中で運ぶ品（届け物・ミイラなど）
        if q("select 1 from product where guid=?", asset):
            return {"t": f"品物: {nm}{amt}", "k": "goods"}
        return {"t": f"品物: {nm}{amt}" if nm else "クエストの品", "k": "questitem"}
    return {"t": f"{KIND_LABEL.get(kind, kind)}: {nm}{amt}", "k": kind}


def dedupe(rewards):
    """同じ報酬を1つにし、アイテムとしても出る専門家の「品物: 〇〇 1」は外す。
    ゲームの報酬メッセージ（「報酬: 評判 10」）と同じ値の「評判 +10」は、メッセージの方を残す。"""
    items = {x["t"] for x in rewards if x["k"] == "item"}
    msg_rep = {x["t"].removeprefix("報酬: 評判 ").replace(",", "") for x in rewards if x["t"].startswith("報酬: 評判 ")}
    seen, out = set(), []
    for x in rewards:
        if x["k"] == "reputation" and x["t"].startswith("評判 ") and x["t"][3:].lstrip("+").replace(",", "") in msg_rep:
            continue
        if x["k"] == "goods" and x["t"].removeprefix("品物: ").removesuffix(" 1") in items:
            continue
        if x["t"] not in seen:
            seen.add(x["t"])
            out.append(x)
    return out


# Planner の依頼人
givers = {}
planner_meta = {}
if PLANNER.exists():
    def walk(o):
        if isinstance(o, dict):
            if isinstance(o.get("guid"), int) and "giver" in o:
                givers[o["guid"]] = o.get("giver")
                planner_meta[o["guid"]] = o
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(json.loads(PLANNER.read_text(encoding="utf-8")))
else:
    print(f"注意: Planner のデータが無いので依頼人は空にします（{PLANNER}）")

REGION = {None: "", 1: "ラティウム", 2: "アルビオン", 3: "アイギュプト"}
PLANNER_REGION = {"Roman": "ラティウム", "Celtic": "アルビオン", "Egyptian": "アイギュプト"}

# 詳しい説明（選択肢の流れ図など）があるガイドの節。クエスト一覧からリンクする
GUIDE_LINKS = {
    154535: "/guide/dlc03-dawn-of-delta#ニュンパイオスの3部作",  # ニュンパイオスのミイラ化
    173095: "/guide/dlc03-dawn-of-delta#ニュンパイオスの3部作",  # 私的な捜査
    173096: "/guide/dlc03-dawn-of-delta#ニュンパイオスの3部作",  # ニュンパイオスに正義を？
    152807: "/guide/dlc03-dawn-of-delta#パンドラのアンフォラ",
}
DLC = {None: "基本ゲーム"}
for g, key, nt, icon in q("select * from dlc"):
    DLC[g] = tr(nt) or key


# 名前は Planner の題名（実機のクエストブックに出る名前。2026-11-18 に PS5 で確認）にする。
# annohead の questline の題名は、受けるかどうかを選ぶ画面の見出しなので、違うときは "alt" として添える。
# 題名が日本語になっていないもの（英語のまま）は、今までどおり見出しの名前を使う
# 1つのクエストの中で題名が変わるもの（後半の題名を足す）
TITLE_SUFFIX = {154655: "／VI：ルクス～薄光"}


def headline_title(g):
    """受けるかどうかを選ぶ画面の見出し（annohead の questline の題名）。"""
    r = q("select title_text from questline where guid=?", g)
    return (tr(r[0][0]) if r else None) or name(g)


def quest_title(g):
    """一覧に出すクエストの名前（実機のクエストブックの題名）。"""
    title = planner_meta.get(g, {}).get("title")
    text = " ".join((tr(title) or "").split()) if title is not None else ""
    if title is not None and not JP_CHAR.search(text):
        # annohead の文に無い題名は、Planner 3.0.1 の日本語（ゼロ幅スペースを除く）を使う
        text = " ".join(planner_ja.get(str(title), "").replace("​", "").split())
    if text and JP_CHAR.search(text):
        return text + TITLE_SUFFIX.get(g, "")
    return headline_title(g)


# 元データのつなぎ方がずれている所を直す（ストーリーライン → 節の名前 → 直す中身）
# 星の創世記: 受け入れるとレースに出し、断ると終わる（元データでは断る側にレースがつながっている）
STEP_FIXES = {
    154059: {
        "選択1": {"options": {0: {"next": ["目標1"]}, 2: {"next": []}}},
        "目標1": {"text": "レースに出す（達成＝勝ち／未達成＝負け）"},
    },
}


# 十分の一刑（3.0.1 で追加。annohead は3.0のままなので選択肢の報酬が空）。Planner 3.0.1 の報酬の節から足す。
# 選択肢との対応（返す・剣闘士・解放）は、決定の枝の順と節の名前からの推定で、実機では未確認
def _item_reward(guid):
    r = q("select name_text,rarity from item where guid=?", guid)[0]
    return {"t": tr(r[0]), "k": "item", "rarity": r[1]}


def _goods_reward(guid, amount):
    r = q("select name_text from product where guid=?", guid)[0]
    return {"t": f"品物: {tr(r[0])} {amount}", "k": "goods"}


STEP_FIXES[153669] = {"選択1": {"options": {
    0: {"rewards": [_item_reward(181024)]},
    1: {"rewards": [{"t": "デナリウス 15,000", "k": "money"}, _item_reward(181024)]},
    2: {"rewards": [{"t": "デナリウス 3,000", "k": "money"}, _goods_reward(2173, 25), _goods_reward(151691, 25)]},
}}}


def fix_steps(sl, steps):
    for st in steps:
        fix = STEP_FIXES.get(sl, {}).get(st["id"])
        if not fix:
            continue
        for i, part in fix.get("options", {}).items():
            st["options"][i].update(part)
        st.update({k: v for k, v in fix.items() if k != "options"})
    return steps


def replaced_items(sl):
    """Planner で、持っている御者などを別のアイテムに替える処理（ActionReplaceItem）の新しいアイテム。
    annohead の報酬には出ないので、札に足す。"""
    out = []
    for n in planner_meta.get(sl, {}).get("nodes", []):
        for a in n.get("actions", []):
            if a.get("type") == "ActionReplaceItem":
                for x in a["props"]["ActionReplaceItem"].get("ReplaceItemList", []):
                    ref = (x.get("NewItem") or {}).get("$ref")
                    if isinstance(ref, int):
                        out.append(ref)
    return out


# クエストから外す報酬（ストーリーライン → アイテムの GUID）。ゲームのデータでは同じストーリーラインに入っているが、
# 一覧の選択肢を選んでももらえないもの
EXCLUDED_REWARDS = {
    # ディアナのコレクション: ミウトは、パンドラのアンフォラで手に入るルキウスの印章指輪をディアナに届けたときの報酬で、
    # ディアナのクエストの中の別の届け物として作られている。選択肢の報酬ではないので外す（パンドラのアンフォラ側に載る）
    96954: {159507},
}


# annohead の報酬に出ないが、Planner 3.0.1 では専門家が報酬になるクエスト（ストーリーライン → アイテムの GUID）
EXTRA_REWARD_ITEMS = {
    154858: [155788],  # 純粋理論: 「専門家を追加」の節（Add specialist）
    50951: [44112],    # 行方不明の商品: ブドウ潰し（「商人を追加」の節。通知には出ない）
}


def order_by_flow(visible, kinds):
    """見せる節を、流れの順に並べ替える。前の節（その節に進む選択・目標）が先に来るようにし、
    それ以外は元の並び（annohead の position 順）をできるだけ保つ。
    例: 目標が元の並びで選択より前にあっても、その選択から進む先なら、選択の後ろに置く。
    ぐるぐる回る流れ（戻る選択肢）で、前の節がまだ置かれていないだけの節は、元の並びで先に置く"""
    guids = [n[0] for n in visible]
    index = {g: i for i, g in enumerate(guids)}
    vis = set(guids)

    def reach(start_targets):
        """見せない分かれ道・目標をたどって、先にある見せる節を集める"""
        found, seen, stack = [], set(), list(start_targets)
        while stack:
            g = stack.pop()
            if g in seen or g not in kinds:
                continue
            seen.add(g)
            if g in vis:
                found.append(g)
            else:
                stack += [t for (_, t) in q("select idx,node_guid from quest_choice_outcome where choice_guid=?", g)]
        return found

    preds = {g: set() for g in guids}
    for g in guids:
        for t in reach([t for (_, t) in q("select idx,node_guid from quest_choice_outcome where choice_guid=?", g)]):
            if t != g:
                preds[t].add(g)

    # 自分から先に進める節（循環）は、前の節とは数えない
    def descendants(g):
        out, stack = set(), [g]
        while stack:
            x = stack.pop()
            for t in reach([t for (_, t) in q("select idx,node_guid from quest_choice_outcome where choice_guid=?", x)]):
                if t not in out:
                    out.add(t)
                    stack.append(t)
        return out
    for g in guids:
        if preds[g]:
            desc = descendants(g)
            preds[g] = {p for p in preds[g] if p not in desc}

    placed, order, remaining = set(), [], list(guids)
    while remaining:
        ready = [g for g in remaining if preds[g] <= placed]
        pick = min(ready or remaining, key=lambda g: index[g])
        order.append(pick)
        placed.add(pick)
        remaining.remove(pick)
    by = {n[0]: n for n in visible}
    return [by[g] for g in order]


def build_story(sl):
    nodes = q("select node_guid,kind,position,headline_text,text_text,condition_id,speaker_guid "
              "from quest_choice where storyline_guid=? order by position", sl)
    kinds = {n[0]: n[1] for n in nodes}

    def rewards_of(node_list):
        out = []
        for g in node_list:
            out += [reward(r) for r in q("select kind,asset_guid,amount,amount_variable,name_text,attribute "
                                          "from quest_reward where node_guid=?", g)
                    if r[1] not in EXCLUDED_REWARDS.get(sl, ())]
        return out

    def outs(node, idx):
        return [g for (g,) in q("select node_guid from quest_choice_outcome where choice_guid=? and idx=?", node, idx)]

    # 見せる節: 選択・目標と、報酬が出る分かれ道
    def has_reward(g):
        return any(rewards_of([n for n in outs(g, i)]) for i in (0, 1))
    def shown(n):
        if n[1] == "decision":
            return True
        if n[1] == "objective" and (tr(n[3]) or tr(n[4])):
            return True
        return has_reward(n[0])
    visible = order_by_flow([n for n in nodes if shown(n)], kinds)
    labels, cnt = {}, {}
    for n in visible:
        k = {"decision": "選択", "objective": "目標", "check": "分かれ道", "then": "続き"}.get(n[1], n[1])
        cnt[k] = cnt.get(k, 0) + 1
        labels[n[0]] = f"{k}{cnt[k]}"

    def resolve_next(targets, seen):
        """見せない分かれ道は、その先の見せる節に置き換える。"""
        res = []
        for g in targets:
            if g in labels:
                res.append(labels[g])
            elif kinds.get(g) in ("check", "objective", "then") and g not in seen:
                seen.add(g)
                res += resolve_next([t for i in (0, 1) for t in outs(g, i) if t in kinds], seen)
        return list(dict.fromkeys(res))

    def result(node, idx):
        targets = outs(node, idx)
        return {"rewards": dedupe(rewards_of([g for g in targets if g not in kinds])),
                "next": resolve_next([g for g in targets if g in kinds], set())}

    steps = []
    for g, kind, pos, head, text, cid, spk in visible:
        st = {"id": labels[g], "kind": kind}
        if kind == "decision":
            st["speaker"] = name(spk) if spk else None
            st["title"] = tr(head)
            st["text"] = tr(text, TEXT_LIMIT)
            st["options"] = []
            for idx, otext, cost, camt, ocid, chal, chval, chvar in q(
                    "select idx,text_text,cost_guid,cost_amount,condition_id,challenge,challenge_value,challenge_variable "
                    "from quest_option where decision_guid=? order by idx", g):
                o = {"text": tr(otext) or "（文なし）", **result(g, idx)}
                if cost:
                    o["cost"] = f"{'デナリウス' if cost == DENARII else (name(cost) or cost)} {num(camt)}"
                if chal == "chance":
                    o["chance"] = f"{num(chval * 100)}%" if chval is not None else "確率あり"
                    o["fail"] = result(g, -(idx + 1))
                ct = cond_text(ocid)
                if ct:
                    o["cond"] = ct
                st["options"].append(o)
        elif kind == "objective":
            st["text"] = tr(head) or tr(text, TEXT_LIMIT) or "（目標）"
            st["met"] = result(g, 0)
            st["missed"] = result(g, 1)
        elif kind == "then":
            st["yes"] = result(g, 0)
        else:
            st["cond"] = cond_text(cid) or "条件あり"
            st["yes"] = result(g, 0)
            st["no"] = result(g, 1)
        steps.append(st)
    return steps


# 一覧に載せないクエスト（ユーザー判断）
EXCLUDED = {
    38363: "善意の運び手。Planner で unused、内部名に OLD（古い版が残っているもの）",
}

quests = []
untranslated = []
for g, title, icon, reg, dlc, slug, series, idx in q("select * from questline order by coalesce(dlc_guid,0),coalesce(region_id,0),series,idx"):
    if g in EXCLUDED:
        continue
    used_override = False
    qname = quest_title(g) or slug
    steps = fix_steps(g, build_story(g))
    all_rewards = []
    for st in steps:
        for part in [*(st.get("options") or []), st.get("met"), st.get("missed"), st.get("yes"), st.get("no")]:
            if part:
                all_rewards += [r for r in part.get("rewards", []) if r["k"] == "item"]
                if part.get("fail"):
                    all_rewards += [r for r in part["fail"].get("rewards", []) if r["k"] == "item"]
    # アイテムの入手先の表でこのクエストが入手先のもの（抽選で渡され、選択肢の報酬に出ないものを補う）
    for (ig,) in q("select distinct s.item_guid from item_source s left join quest qq on qq.guid=s.source_guid "
                   "where (s.kind='storyline' and s.source_guid=?) or (s.kind='quest' and qq.storyline_guid=?)", g, g):
        if ig in EXCLUDED_REWARDS.get(g, ()):
            continue
        it = q("select name_text,rarity from item where guid=?", ig)
        if it and it[0][1] != "Quest":
            all_rewards.append({"t": tr(it[0][0]) or str(ig), "k": "item", "rarity": it[0][1]})
    for ig in replaced_items(g) + EXTRA_REWARD_ITEMS.get(g, []):
        it = q("select name_text,rarity from item where guid=?", ig)
        if it and it[0][1] != "Quest":
            all_rewards.append({"t": tr(it[0][0]) or str(ig), "k": "item", "rarity": it[0][1]})
    giver = givers.get(g)
    quests.append({
        "guid": g,
        "name": qname,
        **({"alt": headline_title(g)} if headline_title(g) not in (None, qname) else {}),
        "dlc": DLC.get(dlc, str(dlc)),
        # annohead に地域が無いもの（DLC03 の決定の依頼など）は Planner の地域で埋める
        "region": REGION.get(reg) or PLANNER_REGION.get(planner_meta.get(g, {}).get("region"), ""),
        "giver": name(giver) if isinstance(giver, int) else None,
        "series": quest_title(series) if series != g else None,
        "items": dedupe(all_rewards),
        "steps": steps,
        # VitePress は見出しの id を NFD（濁点・半濁点を分けた形）で作るので、リンクの # 以降もそろえる
        **({"guide": unicodedata.normalize("NFD", GUIDE_LINKS[g])} if g in GUIDE_LINKS else {}),
        **({"provisional": True} if used_override else {}),
    })
    untranslated += [t for t in re.findall(r'"(?:text|title|name|t)": "([^"]*)"', json.dumps(quests[-1], ensure_ascii=False))
                     if re.search(r"[A-Za-z]{3,}", t) and not JP_CHAR.search(t)]

# 選択肢の無いクエストでも、アイテムがもらえるものは一覧に足す（選択肢なしとして）
PLANNER_DLC = {1: 67902, 2: 67903, 3: 67904}
listed = {x["guid"] for x in quests}
extra = {}
for kind, sg, ig in q("select s.kind,s.source_guid,s.item_guid from item_source s join item i on i.guid=s.item_guid "
                      "where s.kind in ('storyline','quest') and i.rarity<>'Quest'"):
    story = sg if kind == "storyline" else (q("select storyline_guid from quest where guid=?", sg) or [[None]])[0][0]
    if story is None or story in listed or story in EXCLUDED:
        continue
    extra.setdefault(story, []).append(ig)
for story, item_ids in extra.items():
    used_override = False
    title = q("select title_text from storyline where guid=?", story)
    qrow = q("select name_text from quest where storyline_guid=? limit 1", story)
    nm = quest_title(story) or (tr(title[0][0]) if title else None) or (tr(qrow[0][0]) if qrow else None) or name(story) or str(story)
    meta = planner_meta.get(story, {})
    items = []
    for ig in dict.fromkeys(item_ids):
        it = q("select name_text,rarity from item where guid=?", ig)
        items.append({"t": tr(it[0][0]) or str(ig), "k": "item", "rarity": it[0][1]})
    giver = meta.get("giver")
    quests.append({
        "guid": story,
        "name": nm,
        "dlc": DLC.get(PLANNER_DLC.get(meta.get("dlc")), "基本ゲーム"),
        "region": PLANNER_REGION.get(meta.get("region"), ""),
        "giver": name(giver) if isinstance(giver, int) else None,
        "series": None,
        "items": dedupe(items),
        "steps": [],
    })

# annohead に記録が無いクエスト（皇帝の依頼・住民の依頼・総督の決定など）。
# Planner 3.0.1 のノードから節（選択肢・目標・報酬）を作って足す（tools/planner_quest_steps.py）。
# 対象は、題名があり、使われていて（unused でない）、始まり方が読めるもの（orphan でない）。
# 節の中身は Planner のノードから機械的に読んだもので、報酬の割り当ては実機では未確認
PLANNER_GROUP = {"emperor": "皇帝の依頼", "residents": "住民の依頼", "decisions": "総督の決定", "tutorials": "チュートリアル",
                 "incidents": "出来事", "diplomacy": "外交", "traders": "商人", "dlcStory": "DLCの物語", "campaign": "キャンペーン",
                 "other": "その他"}
PLANNER_ONLY = {  # 一覧に載せる理由を残すもの（このほかは条件に合えば自動で載る）
    109521: "価値ある戦利品（エクィテスの依頼。商人の船を護衛すると周到な大工）",
    50951: "行方不明の商品（住民の依頼。annohead に無い。アイテムは報酬の通知から）",
    157316: "市場の氾濫（DLC03 の住民の依頼。葦切り。葦切りは実機のアイテム検索に出ない専門家）",
}
PLANNER_ASSETS = {}
if PLANNER.exists():
    PLANNER_ASSETS = json.loads(PLANNER.read_text(encoding="utf-8")).get("assets", {})


def planner_text(ref):
    """文の番号 -> 日本語。annohead に無い文は Planner 3.0.1 の日本語"""
    s = tr(ref)
    if s and JP_CHAR.search(s):
        return s
    return planner_ja.get(str(ref), "") or s or ""


def asset_name(guid):
    nm = name(guid)
    if nm:
        return nm
    loca = (PLANNER_ASSETS.get(str(guid)) or {}).get("loca") or {}
    return _clean_name(loca.get("japanese") or loca.get("english"))


def _clean_name(s):
    return " ".join((s or "").replace("​", "").split()) or None


def planner_reward(kind, asset, amount):
    """Planner の報酬 -> 札。annohead の表に名前が無いものは Planner の資産表の名前を使う。名前が全く無ければ None"""
    r = reward((kind, asset, amount, None, None, None))
    if asset is not None and name(asset) is None:
        nm = asset_name(asset)
        if not nm:
            return None
        amt = f" {num(amount)}" if amount is not None else ""
        r = {"t": f"{KIND_LABEL.get(kind, kind)}: {nm}{amt}", "k": "goods" if kind in ("item", "goods") else kind}
    return r


def _planner_result_items(steps):
    out = []
    def part(p):
        if p:
            out.extend(r for r in p.get("rewards", []) if r["k"] == "item")
    for st in steps:
        for o in st.get("options") or []:
            part(o)
        for k in ("met", "missed", "timeout", "result"):
            part(st.get(k))
    return out


from planner_quest_steps import PlannerSteps  # noqa: E402

for meta in (json.loads(PLANNER.read_text(encoding="utf-8"))["quests"] if PLANNER.exists() else []):
    story = int(meta["guid"])
    if story in {x["guid"] for x in quests} or story in EXCLUDED or meta.get("unused") or meta.get("orphan") or not meta.get("title"):
        continue
    if meta.get("system") not in ("Quests", "GovernorDecisions"):
        continue
    title = _clean_name(planner_ja.get(str(meta.get("title")), ""))
    if not title or not JP_CHAR.search(title):
        title = " ".join((tr(meta.get("title")) or "").split())
    if not JP_CHAR.search(title):
        continue  # 日本語の題名が無いものは、内部の追跡用のクエスト（ピラミッド事業の追跡など）
    used_override = False
    steps = PlannerSteps(meta, planner_text, asset_name, planner_reward, readable, TEXT_LIMIT).build()
    items = _planner_result_items(steps)
    for n in meta.get("nodes", []):
        for nt in n.get("notifications") or []:
            for r in nt.get("shownRewards") or []:
                if r.get("asset") and r.get("asset") != DENARII:
                    rr = planner_reward("goods", r["asset"], None)
                    if rr and rr["k"] == "item":
                        items.append(rr)
    for ig in EXTRA_REWARD_ITEMS.get(story, []):
        it = q("select name_text,rarity from item where guid=?", ig)
        if it and it[0][1] != "Quest":
            items.append({"t": tr(it[0][0]) or str(ig), "k": "item", "rarity": it[0][1]})
    giver = meta.get("giver")
    quests.append({
        "guid": story,
        "name": title,
        "dlc": DLC.get(PLANNER_DLC.get(meta.get("dlc")), "基本ゲーム"),
        "region": PLANNER_REGION.get(meta.get("region"), ""),
        "giver": asset_name(giver) if isinstance(giver, int) else None,
        "series": None,
        "cat": PLANNER_GROUP.get(meta.get("group")),
        "items": dedupe(items),
        "steps": steps,
        "auto": True,
    })

# 続き物の何番目か（questline の idx 順）と、前後のクエスト
series_of = {g: (sr, ix) for g, sr, ix in q("select guid,series,idx from questline")}
listed_guids = {x["guid"] for x in quests}
members = {}
for g, (sr, ix) in series_of.items():
    if sr is not None and g in listed_guids:
        members.setdefault(sr, []).append((ix, g))
for x in quests:
    sr = series_of.get(x["guid"], (None, None))[0]
    chain = [g for _, g in sorted(members.get(sr, []))]
    if len(chain) < 2:
        continue
    pos = chain.index(x["guid"])
    x["stage"] = f"{pos + 1}/{len(chain)}"
    if pos > 0:
        x["prev"] = chain[pos - 1]
    if pos < len(chain) - 1:
        x["nextQuest"] = chain[pos + 1]
    if x["series"] is None:
        x["series"] = quest_title(sr)

# 続き物は、先頭の段の場所にまとめて段の順に並べる（地域をまたぐもの（ルキウスの奇妙な要求）が割れないように）
ordered, placed = [], set()
for x in quests:
    if x["guid"] in placed:
        continue
    sr = series_of.get(x["guid"], (None, None))[0]
    group = [g for _, g in sorted(members.get(sr, []))] if sr is not None else []
    if len(group) < 2:
        group = [x["guid"]]
    for g in group:
        ordered.append(next(y for y in quests if y["guid"] == g))
        placed.add(g)
quests = ordered

# 3.0.1で名前が変わったアイテム（annohead は3.0のままなので旧名で来る。Planner v1.4.0・Item Inspector 3.0.1.0 の名前に置き換える）
ITEM_RENAMES = {
    "ハナ・レクター、視点の提唱者": "ハヌス・レクター、視点の提唱者",
}
def rename_items(node):
    """札（"k" が item のもの）の名前を、段や選択肢の中まで含めて置き換える"""
    if isinstance(node, dict):
        if node.get("k") == "item" and node.get("t") in ITEM_RENAMES:
            node["t"] = ITEM_RENAMES[node["t"]]
        for v in node.values():
            rename_items(v)
    elif isinstance(node, list):
        for v in node:
            rename_items(v)


rename_items(quests)

# 札のうち、サイトのアイテム一覧に同じ名前があるものにリンクの印を付ける
site_items = json.loads(SITE_ITEMS.read_text(encoding="utf-8"))
site_items = site_items if isinstance(site_items, list) else site_items.get("items", [])
site_names = {i.get("nameJa") for i in site_items if i.get("nameJa")}
unlinked = set()
for x in quests:
    for r in x["items"]:
        if r["t"] in site_names:
            r["link"] = True
        else:
            unlinked.add(r["t"])

OUT.write_text(json.dumps(quests, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(quests)}件 → {OUT}（{OUT.stat().st_size // 1024}KB）。仮訳を使ったクエスト {sum(1 for x in quests if x.get('provisional'))}件")
if unlinked:
    print(f"札のうち、サイトのアイテム一覧に無いもの（リンクなし）: {'、'.join(sorted(unlinked))}")
if untranslated:
    print(f"注意: 日本語になっていない文が {len(untranslated)}件（tools/data/quests-ja-overrides.json に足す）")
    for t in sorted(set(untranslated))[:20]:
        print("  ", t[:80])
