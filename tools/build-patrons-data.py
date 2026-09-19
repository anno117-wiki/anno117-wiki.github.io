#!/usr/bin/env python3
"""公式データ(v2.1)から信仰神(Patron)の wiki 用データを生成する。

入力 : _local/anno-official-data/v2.1/assets.xml, texts_japanese.xml, official_master.csv
出力 : apps/wiki/docs/wiki/patrons.json

- 全神共通のしきい値は ReligionBalancing(GUID30743) から取得する
- 神ごとの奇跡(Wonder)・局所効果2つ・支配効果1つと、効果対象の施設名を展開する
- 数値の意味(基準値 x 段階値が実効%か)は公式データから確定できないため、
  本スクリプトは「内部値」として出力し、解釈はページ側で注記する
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'patrons.json'
BALANCING_GUID = '30743'

# 神の表示順(ゲーム内の並び)と wiki 用 id
PATRON_IDS = {
    'PatronMars': 'mars',
    'PatronCeres': 'ceres',
    'PatronNeptun': 'neptune',
    'PatronMercury': 'mercury',
    'PatronEpona': 'epona',
    'PatronCernunnos': 'cernunnos',
    'PatronMinerva': 'minerva',
    'PatronVulcanus': 'vulcan',
}

# 巨大な汎用プールは施設名を列挙せず総称で表示する
GENERIC_POOLS = {
    'Asset Pool All Troops': '全部隊',
    'Asset Pool All Ships': '全船舶',
    'Asset Pool All Residences': '全住居',
    'Asset Pool All Production Buildings': '全生産施設',
    'Asset Pool Production All Smelters': '全製錬所',
}

JA_CHAR = re.compile('[ぁ-んァ-ヶ一-龠]')  # ひらがな・カタカナ・漢字を含む名称のみ採用(英語の内部名を除外)


def load_texts(path: Path) -> dict:
    xml = path.read_text(encoding='utf-8')
    return {
        m.group(1): m.group(2).replace('\u200b', '').strip()
        for m in re.finditer(r'<LineId>(-?\d+)</LineId>\s*<Text>(.*?)</Text>', xml, re.S)
    }


def load_master(path: Path) -> dict:
    info = {}
    with path.open(encoding='utf-8-sig') as f:
        for r in csv.reader(f):
            if len(r) >= 6:
                info[r[0]] = {'type': r[1], 'internal': r[2], 'en': r[4].replace('\n', ' '), 'ja': r[5].replace('\n', ' ')}
    return info


class Assets:
    def __init__(self, xml: str):
        self.xml = xml
        self.pos = {}
        for m in re.finditer(r'<Asset>\n<Template>([^<]*)</Template>\n<Values>\n<Standard>\n<GUID>(\d+)</GUID>', xml):
            self.pos[m.group(2)] = m.start()

    def block(self, guid: str) -> str:
        i = self.pos.get(guid)
        return '' if i is None else self.xml[i:self.xml.find('\n</Asset>', i)]

    def template(self, guid: str) -> str:
        m = re.match(r'<Asset>\n<Template>([^<]*)', self.block(guid))
        return m.group(1) if m else ''

    def expand_pool(self, guid: str, seen=None, depth=0) -> list:
        seen = seen if seen is not None else set()
        if guid in seen or depth > 4:
            return []
        seen.add(guid)
        if self.template(guid) != 'AssetPool':
            return [guid]
        out = []
        for a in re.findall(r'<Asset>(\d+)</Asset>', self.block(guid)):
            out += self.expand_pool(a, seen, depth + 1)
        return out


def effect_targets(assets: Assets, master: dict, effect_guid: str) -> list:
    """効果の対象を日本語の施設名リストにする(重複除去・日本語名のみ)。"""
    b = assets.block(effect_guid)
    tg = re.search(r'<Targets>(.*?)</Targets>', b, re.S)
    names = []
    for g in (re.findall(r'<GUID>(\d+)', tg.group(1)) if tg else []):
        pool_name = master.get(g, {}).get('internal', '')
        if pool_name in GENERIC_POOLS:
            names.append(GENERIC_POOLS[pool_name])
            continue
        for x in assets.expand_pool(g):
            ja = master.get(x, {}).get('ja', '')
            if JA_CHAR.search(ja):
                names.append(ja)
    seen, uniq = set(), []
    for n in names:
        if n not in seen:
            seen.add(n)
            uniq.append(n)
    return uniq


def buff_base(assets: Assets, effect_guid: str) -> dict:
    """効果のバフから基準値(内部値)を抜き出す。意味は解釈せず生値で返す。"""
    b = assets.block(effect_guid)
    bf = re.search(r'<Buffs>\s*<Item>\s*<GUID>(\d+)', b)
    if not bf:
        return {}
    bb = assets.block(bf.group(1))
    out = {}
    for tag, val in re.findall(r'<(\w+)>\s*<Value>(-?[\d.]+)</Value>', bb):
        out[tag] = float(val)
    for tag, val in re.findall(r'<(WorkforceModifierInPercent|PassiveTradeProfitModifier)>(-?[\d.]+)<', bb):
        out[tag] = float(val)
    for tag, val in re.findall(r'<(AmountOrPercent)>(-?[\d.]+)<', bb):
        out.setdefault(tag, float(val))
    return out


def parse_patron(assets, master, ja, en, block) -> dict:
    def text(tag, table=ja):
        m = re.search(r'<%s>(-?\d+)' % tag, block)
        return table.get(m.group(1), '') if m else ''

    local = []
    loc = re.search(r'<LocalEffects>(.*?)</LocalEffects>', block, re.S).group(1)
    for it in re.split(r'(?=<Item>\s*<GUID>\d+</GUID>\s*<Milestones>)', loc):
        g = re.match(r'<Item>\s*<GUID>(\d+)</GUID>\s*<Milestones>(.*?)</Milestones>', it, re.S)
        if not g:
            continue
        title = re.search(r'<Title>(-?\d+)', it)
        desc = re.search(r'<Description>(-?\d+)', it)
        local.append({
            'guid': g.group(1),
            'titleJa': ja.get(title.group(1), '') if title else '',
            'titleEn': en.get(title.group(1), '') if title else '',
            'descJa': ja.get(desc.group(1), '') if desc else '',
            'targets': effect_targets(assets, master, g.group(1)),
            'base': buff_base(assets, g.group(1)),
            'milestones': [[int(d), int(s)] for d, s in re.findall(r'<Devotion>(\d+)</Devotion>\s*<BuffScaling>(\d+)', g.group(2))],
        })

    dom = re.search(r'<DominantEffects>(.*?)</DominantEffects>', block, re.S).group(1)
    dt, dd = re.search(r'<Title>(-?\d+)', dom), re.search(r'<Description>(-?\d+)', dom)

    wonder_guid = re.search(r'<Wonder>(\d+)', block).group(1)
    return {
        'guid': re.search(r'<GUID>(\d+)', block).group(1),
        'nameJa': text('PatronName'),
        'nameEn': text('PatronName', en),
        'descJa': text('PatronDescription'),
        'wonder': {
            'guid': wonder_guid,
            'descJa': text('WonderDescription'),
        },
        'local': local,
        'dominant': {
            'titleJa': ja.get(dt.group(1), '') if dt else '',
            'titleEn': en.get(dt.group(1), '') if dt else '',
            'descJa': ja.get(dd.group(1), '') if dd else '',
        },
    }


def main() -> int:
    v = SRC / 'v2.1'
    if not (v / 'assets.xml').exists():
        print('assets.xml が見つかりません: %s' % v, file=sys.stderr)
        return 1
    xml = (v / 'assets.xml').read_text(encoding='utf-8')
    assets = Assets(xml)
    master = load_master(SRC / 'official_master.csv')
    ja, en = load_texts(v / 'texts_japanese.xml'), load_texts(v / 'texts_english.xml')

    bal = assets.block(BALANCING_GUID)

    def num(tag):
        m = re.search(r'<%s>(\d+)' % tag, bal)
        if not m:
            raise ValueError('ReligionBalancing に %s がありません' % tag)
        return int(m.group(1))

    thresholds = {
        'wonder': num('WonderThreshold'),
        'wonderHysteresis': num('WonderHysteresis'),
        'shrine': num('ShrineTreshold'),  # 公式データ側の綴りのまま
        'shrineHysteresis': num('ShrineHysteresis'),
        'dominant': num('DominantPatronThreshold'),
    }

    patrons = {}
    for m in re.finditer(r'<Asset>\n<Template>Patron</Template>', xml):
        block = xml[m.start():xml.find('\n</Asset>', m.start())]
        key = re.search(r'<Name>([^<]*)', block).group(1)
        if key in PATRON_IDS:
            patrons[PATRON_IDS[key]] = parse_patron(assets, master, ja, en, block)

    missing = set(PATRON_IDS.values()) - set(patrons)
    if missing:
        print('神の定義が見つかりません: %s' % sorted(missing), file=sys.stderr)
        return 1

    ordered = [dict(id=i, **patrons[i]) for i in PATRON_IDS.values()]
    OUT.write_text(json.dumps({'source': 'assets.xml v2.1', 'thresholds': thresholds, 'patrons': ordered},
                              ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('wrote %s (%d patrons)' % (OUT.relative_to(ROOT), len(ordered)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
