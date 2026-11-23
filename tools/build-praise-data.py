#!/usr/bin/env python3
"""称賛（ゲーム内の実績）のページ（wiki/praise）のデータ praise-list.json を、assets.xml から作る。

使い方: python tools/build-praise-data.py   （そのあと bun run build:site）
読み先: _local/anno-official-data/v3.0.1-steam/assets.xml（tools/assets_resolver.py）・texts_japanese.xml
出力  : apps/wiki/docs/wiki/praise-list.json

日本語版のゲームでは、実績は「称賛」メニューに出る。名前と条件の文は、ゲーム内の日本語の表記をそのまま使う（自分で訳さない）。
セット（AchievementSet）ごとに9件。セットを全部達成すると、称号（接頭語と接尾語）が解除される。
隠しの実績（名前と説明文がテキストに無いもの）は載せない。

条件の内訳（item["note"]）は、実績の資産の条件が指す資産（研究・建物・祭神など）の名前から作る。NOTES に、内訳を添える称賛を並べる。
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
TREE_JA = {"Economy": "経済", "Civic": "市民", "Military": "軍事"}
INSPIRATION = "「インスピレーション」は、スキルツリーのゲート（「〜研究」）のことと読めます。"


def ja(text_id):
    """ゲーム内の日本語。無ければ None"""
    if not text_id:
        return None
    s = JA.get(int(text_id))
    return at.strip_zw(s).strip() if s else None


def label(guid):
    """資産の表示名（ゲーム内の日本語）。無ければ資産の名前"""
    a = R.get(int(guid))
    return ja(a["v"].get("/Text/OasisId")) or a["name"]


def refs_of(ach_guid):
    """実績の条件が指す資産を、(キー名, GUID, テンプレート名) の並びで返す（重複は除く）"""
    seen, out = set(), []
    for k, x in R.get(ach_guid)["v"].items():
        if k.startswith(("/Standard", "/Achievement/")) or not x.isdigit() or int(x) not in R.raw:
            continue
        item = (k.split("/")[-1], int(x))
        if item in seen:
            continue
        seen.add(item)
        out.append((item[0], item[1], R.template_of(item[1])))
    return out


def pool_members(guid):
    """資産プールの中身（入れ子のプールも展開）"""
    a = R.get(int(guid))
    if a["template"] != "AssetPool":
        return [int(guid)]
    out = []
    for k, x in a["v"].items():
        if k.startswith("/AssetPool/AssetList/") and k.endswith("/Asset"):
            out += pool_members(int(x))
    return out


def uniq(names):
    return list(dict.fromkeys(names))


def names_of(ach_guid, key=None, template=None):
    """条件が指す資産の名前（key や template で絞る）"""
    return uniq(label(g) for k, g, t in refs_of(ach_guid) if (not key or k == key) and (not template or t == template))


def pool_members_of(ach_guid, key="Context"):
    out = []
    for k, g, t in refs_of(ach_guid):
        if k == key and t == "AssetPool":
            out += pool_members(g)
    return out


TECHS = {int(t["guid"]): t for t in techs_mod.load_techs()["techs"]}


def tech_name(guid):
    return at.strip_zw(TECHS[guid]["loca"]["japanese"])


def tech_refs(ach_guid):
    """条件が指す研究（TechGuid）のGUID。プールがあれば中身も含める"""
    out = []
    for k, g, t in refs_of(ach_guid):
        if k == "TechGuid":
            out += [m for m in pool_members(g) if m in TECHS]
    return sorted(set(out))


def tree_order(guid):
    return (TECHS[guid]["category"], -TECHS[guid]["y"], TECHS[guid]["x"])


def tech_names(guids):
    return "・".join(tech_name(g) for g in sorted(guids, key=tree_order))


def gates_by_tree(guids):
    """ゲートを、経済・市民・軍事ごとに「経済（8件）: …」の形でまとめる"""
    groups = {}
    for g in sorted(guids, key=tree_order):
        name = TECHS[g]["name"]  # 例: Gate Economy Mid-L to Late
        tree = TREE_JA.get(name.split()[1], name.split()[1]) if name.startswith("Gate ") else "その他"
        groups.setdefault(tree, []).append(tech_name(g))
    return "。".join(f"{t}（{len(v)}件）: {'・'.join(v)}" for t, v in groups.items())


def research_note(ach_guid):
    """条件に並ぶ研究が、そのスキルツリーのゲート以外の研究と過不足なく一致することを確かめて、内訳の文を作る（違えば止まる）"""
    refs = tech_refs(ach_guid)
    if not refs:
        sys.exit(f"条件に研究がありません: {ach_guid}")
    category = TECHS[refs[0]]["category"]
    expected = sorted(g for g, t in TECHS.items() if t["category"] == category and not t["gate"])
    if refs != expected:
        sys.exit(f"条件の研究が、ゲート以外の研究と一致しません: {ach_guid} 条件{len(refs)}件 ゲート以外{len(expected)}件")
    gates = [tech_name(g) for g, t in TECHS.items() if t["category"] == category and t["gate"]]
    return (f"「発見」は、スキルツリーの研究のことです。{len(refs)}件を全部研究します: {tech_names(refs)}。"
            f"次の段階への解放条件のゲート（{'・'.join(gates)}）は含みません")


def public_services(ach_guid):
    latium, albion = [], []
    for k, g, t in refs_of(ach_guid):
        if t in ("PublicServiceBuilding", "PublicServiceRitualBuilding"):
            (albion if "Celtic" in R.get(g)["name"] else latium).append(label(g))
    latium, albion = uniq(latium), uniq(albion)
    return (f"次の公共サービスの建物が、全種類です。ラティウム（{len(latium)}種）: {'・'.join(latium)}。"
            f"アルビオン（{len(albion)}種）: {'・'.join(albion)}")


def oyster_note(ach_guid):
    needs = names_of(ach_guid, "Needs")
    oyster = "牡蠣のキャビア添え"
    if oyster not in needs:
        sys.exit(f"条件に「{oyster}」がありません: {ach_guid}")
    others = [n for n in needs if n != oyster]
    return (f"「牡蠣とキャビア」は、品物の「{oyster}」のことです。条件に並ぶパトリキの需要品は、{oyster}のほかに、"
            f"{'・'.join(others)}です（{oyster}以外を与えないこと、と読めます）")


def villa_specialists(ach_guid):
    pool = [m for k, g, t in refs_of(ach_guid) if k == "TargetItem" for m in pool_members(g)]
    return f"同じ総督のヴィラに、専門家の{'と'.join('「' + label(m) + '」' for m in pool)}を同時に置きます"


def crook_and_flail(ach_guid):
    soldiers = names_of(ach_guid, template="LandUnit")
    ships = names_of(ach_guid, template="NavalUnit")
    n_aba = sum(1 for k, g, t in refs_of(ach_guid) if t == "NavalUnit" and label(g).startswith("アバ"))
    return (f"条件に並ぶ兵士は、{'・'.join(soldiers)}です。船は、{'・'.join(ships)}です。"
            f"データには、アバが{n_aba}つの型（民間・軍団・襲撃型）に分かれて並んでいます。どの型が必要かは、データから分かりません")


def patrons(ach_guid, key):
    return names_of(ach_guid, key, "Patron")


def pool_names(ach_guid, key, index):
    """条件の資産プール（key で絞った index 番目）の中身の名前"""
    pools = [g for k, g, t in refs_of(ach_guid) if k == key and t == "AssetPool"]
    return uniq(label(m) for m in pool_members(pools[index]))


def high_gods(g):
    p = patrons(g, "PatronGUID")
    return f"条件に並ぶ高位祭神は{len(p)}柱です: {'、'.join(p)}"


def pantheist(g):
    p = patrons(g, "Context")
    return f"同じ祭神に、9つの島を捧げます。条件に並ぶ祭神は{len(p)}柱です: {'、'.join(p)}"


# 条件の内訳を添える称賛（称賛の名前 → 内訳の文を作る関数。引数は実績の資産の GUID）。内訳はゲームのデータの条件から読んだ内容
NOTES = {
    "公共の利益のために": public_services,
    "服装は人を表す": lambda g: f"条件に並ぶ、ラティウムの建物{len(names_of(g, 'Context'))}種です: {'・'.join(names_of(g, 'Context'))}",
    "警備される都市": lambda g: f"アメニティ施設（小さな公共施設）の3種です: {'・'.join(names_of(g, template='MiniInstitutionBuilding'))}",
    "基盤の再開": villa_specialists,
    "貝のように口をつぐむ": oyster_note,
    "ノーナの数秘術": lambda g: f"{INSPIRATION}次の{len(tech_refs(g))}件です: {tech_names(tech_refs(g))}",
    "博識者": lambda g: f"{INSPIRATION}全部で{len(tech_refs(g))}件です。{gates_by_tree(tech_refs(g))}",
    "知識は力なり": lambda g: f"{INSPIRATION}条件のゲートは{len(tech_refs(g))}件（DLCのものを含む）で、その中のどれか9件を解除します",
    "無限に向かって": lambda g: f"条件に並ぶ、繰り返し研究できる研究{len(tech_refs(g))}件です: {tech_names(tech_refs(g))}",
    "自然哲学": research_note,
    "王笏と鞭": crook_and_flail,
    "森を守ろう": lambda g: "条件の資産は、森の炭を作る炭焼き師（炭焼き小屋）と、山の炭を掘る炭鉱です",
    "唯一汎神論者": pantheist,
    "汝よりも聖なり": high_gods,
    "神々の一族": lambda g: f"ケルトの神は、{'と'.join(patrons(g, 'ReligionAsset'))}です",
    "ケルト式解釈": lambda g: f"条件の神は、{'、'.join(patrons(g, 'ReligionAsset'))}です",
    "真実は酒の中に": lambda g: f"住民層は{'・'.join(names_of(g, template='PopulationLevel'))}で、品物は{'と'.join(names_of(g, template='Need'))}です",
    "ローマ人よ、家に帰れ": lambda g: f"条件に並ぶ住民層は、ケルト系の{'・'.join(pool_names(g, 'Context', 0))}と、ローマとケルト共通の{'・'.join(pool_names(g, 'Context', 1))}です",
    "シビュラの研究": lambda g: f"雇う専門家は、DLC01のアイテム（専門家）{len(pool_members_of(g))}件のどれかです",
    "フルハウス": lambda g: f"専門家を置く場所は、{'・'.join(uniq(label(m) for m in pool_members_of(g, 'ObjectGUID')))}です",
}


sets = sorted((g, el) for g, el in R.raw.items() if el.findtext("Template") == "AchievementSet")
out = []
total = 0
used_notes = set()
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
        if title in NOTES:
            item["note"] = NOTES[title](aid)
            used_notes.add(title)
        items.append(item)
        region = region or av.get("/Achievement/AchievementRegion")
    total += len(items)
    out.append({
        "name": name,
        "region": REGION_JA[region],
        "rewards": [r for r in rewards if r],
        "items": items,
    })

if used_notes != set(NOTES):
    sys.exit(f"内訳を作る称賛が見つかりません: {set(NOTES) - used_notes}")
counts = {g: sum(1 for s in out for i in s["items"] if i["grade"] == g) for g in GRADE_JA.values()}
OUT.write_text(json.dumps({"sets": out}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"セット {len(out)}・実績 {total}件 {counts}・内訳 {len(used_notes)}件 → {OUT}")
