"""クエスト一覧ページ（wiki/quests）のデータ quests-list.json を作る。

使い方: python tools/build-quests-data.py   （そのあと bun run build:site）
元データ:
  - _local/anno-official-data/v3.0-annohead/anno.sqlite（annohead。クエスト・選択肢・報酬）
  - _local/anno-official-data/v3.0-planner/quests.json（Planner。依頼人）
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
PLANNER = ROOT / "_local/anno-official-data/v3.0-planner/quests.json"
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
    """同じ報酬を1つにし、アイテムとしても出る専門家の「品物: 〇〇 1」は外す。"""
    items = {x["t"] for x in rewards if x["k"] == "item"}
    seen, out = set(), []
    for x in rewards:
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


# 題名を Planner の題名（「星の創世記 II：フランマ～烈火」など）に置き換える続き物（ユーザー判断 2026-11-18）。
# アイテム一覧の入手先はこの題名で載っている
PLANNER_TITLE_SERIES = {154059}
# 1つのクエストの中で題名が変わるもの（後半の題名を足す）
TITLE_SUFFIX = {154655: "／VI：ルクス～薄光"}


def quest_title(g):
    """一覧に出すクエストの名前。"""
    r = q("select title_text,series from questline where guid=?", g)
    if r and r[0][1] in PLANNER_TITLE_SERIES:
        title = planner_meta.get(g, {}).get("title")
        if title is not None and tr(title):
            return tr(title) + TITLE_SUFFIX.get(g, "")
    return (tr(r[0][0]) if r else None) or name(g)


# 元データのつなぎ方がずれている所を直す（ストーリーライン → 節の名前 → 直す中身）
# 星の創世記: 受け入れるとレースに出し、断ると終わる（元データでは断る側にレースがつながっている）
STEP_FIXES = {
    154059: {
        "選択1": {"options": {0: {"next": ["目標1"]}, 2: {"next": []}}},
        "目標1": {"text": "レースに出す（達成＝勝ち／未達成＝負け）"},
    },
}


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
    visible = [n for n in nodes if shown(n)]
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
    for ig in replaced_items(g):
        it = q("select name_text,rarity from item where guid=?", ig)
        if it and it[0][1] != "Quest":
            all_rewards.append({"t": tr(it[0][0]) or str(ig), "k": "item", "rarity": it[0][1]})
    giver = givers.get(g)
    quests.append({
        "guid": g,
        "name": qname,
        "dlc": DLC.get(dlc, str(dlc)),
        # annohead に地域が無いもの（DLC03 の決定の依頼など）は Planner の地域で埋める
        "region": REGION.get(reg) or PLANNER_REGION.get(planner_meta.get(g, {}).get("region"), ""),
        "giver": name(giver) if isinstance(giver, int) else None,
        "series": name(series) if series != g else None,
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
    nm = (tr(title[0][0]) if title else None) or (tr(qrow[0][0]) if qrow else None) or name(story) or str(story)
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
        x["series"] = name(sr)

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
