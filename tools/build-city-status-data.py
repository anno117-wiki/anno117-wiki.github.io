#!/usr/bin/env python3
"""公式データ(v2.1)から、ローマ系の「街の状況」(都市ステータス)の段階表を生成する。

入力 : _local/anno-official-data/v2.1/assets.xml, texts_japanese.xml, texts_english.xml
出力 : apps/wiki/docs/wiki/city-status.json

- 段階は Template=CityStatus のアセット(Name が "City Status Roman NN")。45段階
- 名前は CityStatusName の文字IDから、日本語・英語テキストを引く(単語間にゼロ幅スペースがあるので除く)
- 必要人口は EconomyFeature(GUID 1010000 "Feature Balancing Economy")の CityStatus 一覧から取る。
  ここに載っていない段階は null(Roman 41〜45)
- 属性効果は AttributeEffectsRoman。Mixed・Regional はローマ系では全段階で同じ値なので、
  違う値があれば異常として止まる(ケルト系は違うので対象外。使い分けが不明なため載せない方針)
- 公式データはゲームのバージョン 2.1 のもの。3.0 で値が変わりうる
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / '_local' / 'anno-official-data' / 'v2.1'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'city-status.json'

ECONOMY_FEATURE_GUID = '1010000'
ROMAN_POPULATION_GROUP = '1494'  # Population Group Roman (ローマ人)

ATTRS = [  # 公式データのタグ名 -> 表示名(表示順)
    ('Happiness', '幸福'),
    ('Health', '健康'),
    ('FireSafety', '火災安全度'),
    ('Belief', '信仰'),
    ('Knowledge', '知識'),
    ('Prestige', '名声'),
]


def roman_numeral(n: int) -> str:
    out = ''
    for value, symbol in [(40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]:
        while n >= value:
            out += symbol
            n -= value
    return out


def load_texts(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    return {i: t.replace('​', '') for i, t in re.findall(r'<LineId>(-?\d+)</LineId>\s*<Text>(.*?)</Text>', text, re.S)}


def parse_attrs(block: str, variant: str):
    m = re.search(r'<AttributeEffects%s>(.*?)</AttributeEffects%s>' % (variant, variant), block, re.S)
    if not m:
        return None
    out = {}
    for tag, _ in ATTRS:
        v = re.search(r'<%s>\s*<Value>(-?[\d.]+)</Value>' % tag, m.group(1))
        if v:
            num = float(v.group(1))
            out[tag] = int(num) if num == int(num) else num
    return out


def required_populations(xml: str) -> dict:
    i = xml.find('<GUID>%s</GUID>' % ECONOMY_FEATURE_GUID)
    start = xml.rfind('<Asset>', 0, i)
    end = xml.find('</Asset>', i)
    block = xml[start:end]
    pops = {}
    for guid, req in re.findall(r'<Item>\s*<CityStatus>(\d+)</CityStatus>\s*<RequiredPopulation>(.*?)</RequiredPopulation>', block, re.S):
        m = re.search(r'<PopulationTier>%s</PopulationTier>\s*<PopulationCount>(\d+)</PopulationCount>' % ROMAN_POPULATION_GROUP, req)
        pops[guid] = int(m.group(1)) if m else 0
    return pops


def main() -> int:
    xml = (V / 'assets.xml').read_text(encoding='utf-8')
    ja = load_texts(V / 'texts_japanese.xml')
    en = load_texts(V / 'texts_english.xml')
    pops = required_populations(xml)

    stages = []
    for block in re.findall(r'<Template>CityStatus</Template>\s*<Values>.*?</Values>\s*</Asset>', xml, re.S):
        name = re.search(r'<Name>([^<]*)</Name>', block).group(1)
        m = re.match(r'City Status Roman (\d+)$', name)
        if not m:
            continue
        level = int(m.group(1))
        guid = re.search(r'<GUID>(\d+)</GUID>', block).group(1)
        name_id = re.search(r'<CityStatusName>(-?\d+)</CityStatusName>', block).group(1)

        roman = parse_attrs(block, 'Roman')
        if parse_attrs(block, 'Mixed') != roman or parse_attrs(block, 'Regional') != roman:
            print(f'エラー: {name} の Roman/Mixed/Regional の属性効果が一致しない。表の前提が崩れている', file=sys.stderr)
            return 1

        stages.append({
            'level': level,
            'roman': roman_numeral(level),
            'guid': guid,
            'nameJa': ja.get(name_id),
            'nameEn': en.get(name_id),
            'population': pops.get(guid),  # 人口の表に無い段階は null
            'attrs': roman or {},
        })

    stages.sort(key=lambda s: s['level'])
    if [s['level'] for s in stages] != list(range(1, len(stages) + 1)):
        print('エラー: 段階の番号が連番でない', file=sys.stderr)
        return 1
    missing = [s['level'] for s in stages if not s['nameJa'] or not s['nameEn']]
    if missing:
        print(f'エラー: 名前を引けない段階: {missing}', file=sys.stderr)
        return 1

    data = {
        'source': 'ゲーム内データ(v2.1)',
        'attrs': {tag: label for tag, label in ATTRS},
        'stages': stages,
    }
    # 改行はLFで書く(Windowsの既定のCRLFにしない)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'{len(stages)}段階を {OUT.relative_to(ROOT)} に書き出した')
    return 0


if __name__ == '__main__':
    sys.exit(main())
