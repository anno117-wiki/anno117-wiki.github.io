#!/usr/bin/env python3
"""3.0 の「街の状況」データで city-status.json を更新する。

入力 : _local/anno-official-data/v3.0-planner/city_status.json (Anno 117 Planner v1.0.0, ゲーム3.0)
       apps/wiki/docs/wiki/city-status.json (既存。41〜45段階の引き継ぎに使う)
出力 : apps/wiki/docs/wiki/city-status.json

- ローマ系 1〜40段階: Planner の値に差し替える(3.0で段階3〜10の属性ペナルティが緩やかになった)
- ローマ系 41〜45段階: Planner に無い。既存の値(2.1のゲーム内データ、必要人口は未確認)を残す
- アイギュプト: 名前と必要人口だけ載せる。属性効果は Roman/Mixed/Regional の3種類が
  ほぼ全段階で違い、使い分けが不明なので載せない(ケルト系と同じ方針)
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner' / 'city_status.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'city-status.json'
ZW = '​'
ATTR_KEYS = ['Happiness', 'Health', 'FireSafety', 'Belief', 'Knowledge', 'Prestige']


def roman_numeral(n: int) -> str:
    out = ''
    for value, symbol in [(40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]:
        while n >= value:
            out += symbol
            n -= value
    return out


def number(v: float):
    """整数で表せる値は整数にする(-2.0 -> -2)"""
    return int(v) if float(v).is_integer() else v


def stage(level: int, s: dict, with_attrs: bool) -> dict:
    out = {
        'level': level,
        'roman': roman_numeral(level),
        'guid': str(s['guid']),
        'nameJa': s['loca']['japanese'].replace(ZW, ''),
        'nameEn': s['loca']['english'],
        'population': number(s['required'][0]['population']),
    }
    if with_attrs:
        attrs = s['attributes']['Roman']
        if not (s['attributes']['Roman'] == s['attributes']['Mixed'] == s['attributes']['Regional']):
            sys.exit(f'ローマ系の{level}段階で Roman/Mixed/Regional の値が違う。方針を見直すこと')
        out['attrs'] = {k: number(attrs[k]) for k in ATTR_KEYS if k in attrs}
    return out


def main() -> None:
    if not SRC.exists():
        sys.exit(f'入力が無い: {SRC}')
    src = json.loads(SRC.read_text(encoding='utf-8'))
    old = json.loads(OUT.read_text(encoding='utf-8'))
    roman = [stage(i + 1, s, True) for i, s in enumerate(src['Roman'])]
    kept = [s for s in old['stages'] if s['level'] > len(roman)]
    if [s['level'] for s in kept] != list(range(len(roman) + 1, 46)):
        sys.exit('既存の41〜45段階が想定と違う')
    aegyptus = [stage(i + 1, s, False) for i, s in enumerate(src['Egyptian'])]
    data = {
        'source': 'ゲーム内データ(アップデート3.0。41〜45段階のみ2.1)',
        'attrs': old['attrs'],
        'stages': roman + kept,
        'aegyptus': aegyptus,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'ローマ系 {len(roman)}+{len(kept)}段階、アイギュプト {len(aegyptus)}段階を書き出した')


if __name__ == '__main__':
    main()
