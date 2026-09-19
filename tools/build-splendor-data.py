#!/usr/bin/env python3
"""公式データ(v2.1)から競馬場・円形闘技場の「輝き」ランク表を生成する。

入力 : _local/anno-official-data/v2.1/assets.xml
出力 : apps/wiki/docs/wiki/splendor.json

- BuildingRank.Ranks から、ランクごとの必要輝き・自然減少・色・属性効果を取り出す
- 属性効果は2種類。対象プールで見分ける
    main: Asset Pool Public Attribute Buff Tier 4 (モニュメントの効果範囲内の建物)
    need: Asset Pool Public Service Need Tier 4  (効果範囲内のパトリキの住居。公式データ上の定義)
- ランクごとの「特別な効果」は公式データから機械的に説明文を作れないため、
  SPECIALS に実機確認済みの文言を手書きする(2026-09-19確認)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / '_local' / 'anno-official-data' / 'v2.1'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'splendor.json'

MONUMENTS = {'hippodrome': '152714', 'colosseum': '3621'}
MAIN_POOL = '68474'  # Asset Pool Public Attribute Buff Tier 4
NEED_POOL = '68480'  # Asset Pool Public Service Need Tier 4

ATTRS = {  # 公式データのタグ名 -> 表示名(表示順)
    'Population': '人口',
    'Money': '収入',
    'Happiness': '幸福',
    'Belief': '信仰',
    'Prestige': '名声',
    'Knowledge': '知識',
}
ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

# ランクごとの特別な効果(実機確認済みの文言。公式データの値と食い違う場合は実機を優先)
SPECIALS = {
    'hippodrome': {
        4: {'name': 'チャンピオンの血統', 'text': '騎兵の攻撃 +1、防御 +2。'},
        7: {'name': '公有馬の特権', 'text': 'エクィテス・パトリキの住居で「馬」の需要が追加される。'},
        10: {'name': '戦車と乗員', 'text': '島全体の馬ブリーダーが、8サイクルごとに戦車を1個追加で生産する。'
             '公式データ上は、周辺の生産施設の生産性 +20% も付く（要検証）。'},
    },
    'colosseum': {
        4: {'name': '', 'text': 'リベルトゥスの住居で「パン」の需要が追加される。'},
        7: {'name': '', 'text': '全部隊の攻撃 +1（要検証）。'},
        10: {'name': '', 'text': '公式データ上は「反乱の阻止」「祭りの効果 +25%」が付く。'
             'ゲーム内では明言されていない（要検証）。'},
    },
}


class Assets:
    def __init__(self, xml: str):
        self.xml = xml
        self.pos = {m.group(2): m.start() for m in re.finditer(
            r'<Asset>\n<Template>([^<]*)</Template>\n<Values>\n<Standard>\n<GUID>(\d+)</GUID>', xml)}

    def block(self, guid: str) -> str:
        i = self.pos.get(guid)
        return '' if i is None else self.xml[i:self.xml.find('\n</Asset>', i)]


def effect_attrs(assets: Assets, effect_guid: str):
    """効果の (対象プールGUID, {属性名: 値}) を返す。属性が無ければ None。"""
    eb = assets.block(effect_guid)
    tg = re.search(r'<Targets>\s*<Item>\s*<GUID>(\d+)', eb)
    bf = re.search(r'<Buffs>\s*<Item>\s*<GUID>(\d+)', eb)
    if not tg or not bf:
        return None
    bb = assets.block(bf.group(1))
    attrs = {}
    for tag, val, pct in re.findall(
            r'<(\w+)>\s*<AmountOrPercent>\s*<Value>(-?[\d.]+)</Value>\s*<Percental>(\d)</Percental>', bb):
        if tag in ATTRS:
            if pct != '0':
                raise ValueError('%%指定の属性は想定外: %s %s' % (effect_guid, tag))
            attrs[tag] = int(float(val))
    return tg.group(1), attrs


def parse_monument(assets: Assets, guid: str, key: str) -> list:
    block = assets.block(guid)
    br = re.search(r'<BuildingRank>(.*?)</BuildingRank>', block, re.S)
    if not br:
        raise ValueError('BuildingRank がありません: %s' % guid)
    ranks = []
    for it in re.split(r'(?=<Item>\s*(?:<RequiredXp>|<XpDecayPerMinute>))', br.group(1)):
        if not re.match(r'<Item>\s*(?:<RequiredXp>|<XpDecayPerMinute>)', it):
            continue
        xp = re.search(r'<RequiredXp>(\d+)', it)
        decay = re.search(r'<XpDecayPerMinute>(\d+)', it)
        color = re.search(r'<Coloring>(\w+)', it)
        rank_effects = re.search(r'<RankEffects>(.*?)</RankEffects>', it, re.S)
        row = {'xp': int(xp.group(1)) if xp else 0, 'decay': int(decay.group(1)) if decay else 0,
               'color': color.group(1) if color else '', 'main': {}, 'need': {}}
        for eg in re.findall(r'<Effect>(\d+)</Effect>', rank_effects.group(1) if rank_effects else ''):
            parsed = effect_attrs(assets, eg)
            if not parsed:
                continue
            pool, attrs = parsed
            if pool == MAIN_POOL:
                row['main'] = attrs
            elif pool == NEED_POOL:
                row['need'] = attrs
        ranks.append(row)
    if len(ranks) != 10:
        raise ValueError('ランク数が10ではありません: %s = %d' % (key, len(ranks)))
    for i, row in enumerate(ranks, start=1):
        row['rank'] = i
        row['roman'] = ROMAN[i - 1]
        row['special'] = SPECIALS.get(key, {}).get(i)
    return ranks


def main() -> int:
    if not (V / 'assets.xml').exists():
        print('assets.xml が見つかりません: %s' % V, file=sys.stderr)
        return 1
    assets = Assets((V / 'assets.xml').read_text(encoding='utf-8'))
    monuments = {key: parse_monument(assets, guid, key) for key, guid in MONUMENTS.items()}

    # 必要輝き・自然減少・色は両施設で同じはず(食い違えば止める)
    common = [(r['xp'], r['decay'], r['color']) for r in monuments['hippodrome']]
    if common != [(r['xp'], r['decay'], r['color']) for r in monuments['colosseum']]:
        print('競馬場と円形闘技場でランクのしきい値が異なります', file=sys.stderr)
        return 1

    data = {
        'source': 'assets.xml v2.1',
        'attrs': ATTRS,
        'ranks': [{'rank': r['rank'], 'roman': r['roman'], 'xp': r['xp'], 'decay': r['decay'], 'color': r['color']}
                  for r in monuments['hippodrome']],
        'hippodrome': [{k: r[k] for k in ('rank', 'roman', 'main', 'need', 'special')} for r in monuments['hippodrome']],
        'colosseum': [{k: r[k] for k in ('rank', 'roman', 'main', 'need', 'special')} for r in monuments['colosseum']],
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('wrote %s' % OUT.relative_to(ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
