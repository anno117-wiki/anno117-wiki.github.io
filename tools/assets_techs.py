"""assets.xml から、研究(スキルツリー)のデータを Planner の techs.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の techs.json を、ゲームの assets.xml に置き換える。

作る項目(Planner の techs と同じ名前):
  guid / name / loca / description / flavour / category / x / y / gate / entry / toCategory /
  knowledge / repeatable / repeatFactor / effects / unlocks / culture
effectLines（効果の説明文。対象名・効果名・値の行）は tools/assets_effect_lines.py で作る。対応している効果の種類だけで、
  対応していない種類を含む研究は effectLines が None（DLC03 の全研究と、経済・都民の多くは対応済み。軍事の研究などは未対応）。
作らない項目: relevantEffects、rewards、badges、condition

XML での探し方:
  - 名前 /Tech/TechName、説明 /Tech/ResearchableTechDescription、フレーバー文 /Tech/TechDescription(texts_*.xml で引く)
  - 位置 /Tech/GridPosition/X,Y(書かれていなければ 0)、知識コスト /Tech/KnowledgeNeeded
  - ゲート /Tech/IsGate、繰り返し /Tech/IsRepeatable、倍率 /Tech/RepeatableCostFactor(既定 1.1)、分野への線 /Tech/ShowConnectionToCategory
  - 効果 /Tech/Rewards/Effects、解放物 /Tech/Rewards/Unlocks(名前は解放物の資産の /Text/OasisId)
  - 分野は TechCategory の /TechCategory/Techs の並び（どの分野にも載っていない研究は未使用なので除く）。各分野の最初のゲート(entry)はどの分野の一覧にも無く、
    名前(Gate Economy Early など)の分野名から分野を決める(Planner と同じ)

使い方:
    from assets_techs import load_techs
    techs = load_techs()['techs']
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_effect_lines import EffectLines, UnsupportedProperty  # noqa: E402
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _ids(v: dict, base: str, key: str) -> list[int]:
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    found = []
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            found.append((int(m.group(1)), int(val)))
    return [g for _, g in sorted(found)]


def _loca(en: dict, ja: dict, line_id) -> dict | None:
    if not line_id:
        return None
    return {'english': en.get(int(line_id), ''), 'japanese': ja.get(int(line_id), '')}


def load_techs(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')

    # 分野の順は TechFeature の CategoryOrder、分野に属する研究は各分野の Techs の並び
    order = _ids(R.get(21643)['v'], '/TechFeature/CategoryOrder', 'Category')
    membership: dict[int, int] = {}
    category_of_type: dict[str, int] = {}
    for c in order:
        v = R.get(c)['v']
        category_of_type[v.get('/TechCategory/CategoryType', '')] = c
        for t in _ids(v, '/TechCategory/Techs', 'Tech'):
            membership.setdefault(t, c)

    lines = EffectLines(R)
    techs = []
    for guid in R.raw:
        if R.template_of(guid) != 'Tech':
            continue
        r = R.get(guid)
        v = r['v']
        gate = v.get('/Tech/IsGate') == '1'
        category = membership.get(guid)
        entry = gate and category is None
        if entry:
            m = re.fullmatch(r'Gate (\w+) Early', r['name'] or '')
            category = category_of_type.get(m.group(1)) if m else None
        if category is None:
            continue  # どの分野にも載っていない研究は未使用・削除予定（'UNUSED' 'CUT' など）
        unlocks = []
        for u in _ids(v, '/Tech/Rewards/Unlocks', 'UnlockReward'):
            unlocks.append(_loca(en, ja, R.get(u)['v'].get('/Text/OasisId')))
        try:
            effect_lines = lines.for_tech(guid)
        except UnsupportedProperty:
            effect_lines = None  # まだ文にできない効果の種類を含む
        techs.append({
            'guid': guid,
            'name': r['name'],
            'loca': _loca(en, ja, v.get('/Tech/TechName')),
            'description': _loca(en, ja, v.get('/Tech/ResearchableTechDescription')),
            'flavour': _loca(en, ja, v.get('/Tech/TechDescription')),
            'category': category,
            'x': int(_num(v.get('/Tech/GridPosition/X'))),
            'y': int(_num(v.get('/Tech/GridPosition/Y'))),
            'gate': gate,
            'entry': entry,
            'toCategory': v.get('/Tech/ShowConnectionToCategory') == '1',
            'knowledge': _num(v.get('/Tech/KnowledgeNeeded')),
            'repeatable': v.get('/Tech/IsRepeatable') == '1',
            'repeatFactor': _num(v.get('/Tech/RepeatableCostFactor'), 1.1),
            'effects': _ids(v, '/Tech/Rewards/Effects', 'EffectAsset'),
            'effectLines': effect_lines,
            'unlocks': unlocks,
            'culture': v.get('/Tech/Culture') or 'None',
        })
    return {'techs': techs}
