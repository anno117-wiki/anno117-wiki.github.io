#!/usr/bin/env python3
"""建物効果(buildings-effects.json)の tier を、「その建物を必要とする最初の住民層」に書き換える。

入力 : _local/anno-official-data/v3.0-planner/{population,needs}.json
出力 : apps/wiki/docs/wiki/buildings-effects.json の tier（他の項目は変えない）

- 同じアイコンの需要(公共サービス・商品)を持つ住民層のうち、いちばん低い層を入れる。
  ラティウムの建物(今の層がリベルトゥス〜パトリキ)はラティウムの住民、アルビオンの建物(それ以外)はアルビオンの住民から探す
- 住居の建物は今の層のまま。住民が直接必要としない建物(中間品の生産施設・軍事・港湾など)は 'none'
- 何度実行しても同じ結果になる（今の層は地域の判定にしか使わない）
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'buildings-effects.json'
LEVEL_KEY = {1499: 'libertus', 1496: 'plebeian', 1497: 'equites', 1498: 'patrician',
             1500: 'wader', 1501: 'smith', 1502: 'alderman', 1503: 'mercators', 1504: 'nobles'}
LATIUM = {'libertus', 'plebeian', 'equites', 'patrician'}


def main() -> None:
    pop = json.loads((SRC / 'population.json').read_text(encoding='utf-8'))
    needs = {n['guid']: n for n in json.loads((SRC / 'needs.json').read_text(encoding='utf-8'))['needs']}
    tier_no = {x['guid']: x['tier'] for x in pop['populationLevels']}
    # 地域(latium/albion) -> アイコン -> 最初の層
    first: dict[str, dict[str, str]] = {'latium': {}, 'albion': {}}
    for r in sorted(pop['residences'], key=lambda r: tier_no[r['populationLevel']]):
        key = LEVEL_KEY.get(r['populationLevel'])
        if not key:
            continue
        area = 'latium' if key in LATIUM else 'albion'
        for q in r['needs']:
            icon = (needs[q['need']].get('icon') or '').split('/')[-1]
            if icon:
                first[area].setdefault(icon, key)

    data = json.loads(OUT.read_text(encoding='utf-8'))
    changed = 0
    for b in data['buildings']:
        if (b.get('icon') or '').startswith('base_residence'):
            continue
        area = 'latium' if b['tier'] in LATIUM else 'albion'
        if b['tier'] == 'none':
            continue  # 以前に 'none' にした建物の地域は分からないので、そのまま
        icon = f"icon_3d_{b.get('icon')}.png"
        # アルビオンの市場は、需要側のアイコンがローマ版の名前のまま
        new = first[area].get(icon) or first[area].get(icon.replace('celtic', 'roman'), 'none')
        if new != b['tier']:
            print(f"{b['nameJa']}: {b['tier']} -> {new}")
            changed += 1
        b['tier'] = new
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'{changed}件を書き換え')


if __name__ == '__main__':
    main()
