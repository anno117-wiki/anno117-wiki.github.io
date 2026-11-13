#!/usr/bin/env python3
"""デルタの夜明け(DLC03)のスキルが、建物に追加で付ける効果を、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/techs.json (スキルの effectLines)
出力 : apps/wiki/docs/wiki/skill-bonuses-dlc03.json (buildings.data.ts が、建物名で既存の行に足す)

- 対象は、対象の建物が1つに決まる3スキル(下の SKILLS)。「すべての施設」が対象のスキル
  (遊牧商人・文献一覧)は、対象の建物が決まらないので含めない
- 値は effectLines の value (例 '+2')。効果の種類は ATTR で建物の列に対応づける
- 5件(兵舎・攻城兵器工房・騎兵養成所・ラクダ牧場・総督のヴィラ)は実機で確認済み(2026-11-06・11-13)なので、unverified は付けない
実行: python tools/build-skill-bonuses-dlc03.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner' / 'techs.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'skill-bonuses-dlc03.json'
ZW = '​'
# スキルの日本語名 -> 効果を付ける建物の日本語名のリスト(サイトの建物効果の表の名前)
SKILLS = {
    '平和の砂漠': ['兵舎', '攻城兵器工房', '騎兵養成所'],  # 実機(2026-11-06)で3つ。Plannerは兵舎のみ
    'カメル・ワザール': ['ラクダ牧場'],
    'ギムナシウムのスポンサーシップ': ['総督のヴィラ'],
}
ATTR = {'Income': 'income', 'Income Area Effect': 'income', 'Population Area Effect': 'population',
        'Prestige': 'prestige', 'Prestige Area Effect': 'prestige', 'Happiness Area Effect': 'happiness',
        'Gymnasiarch Workforce': 'gymnasiarchWorkforce'}


def main() -> None:
    techs = json.loads(SRC.read_text(encoding='utf-8'))['techs']
    by_name = {t['loca']['japanese'].replace(ZW, ''): t for t in techs if t.get('loca') and t['name'].startswith('Tech DLC03')}
    rows = []
    for skill, buildings in SKILLS.items():
        tech = by_name.get(skill)
        if tech is None:
            sys.exit(f'スキルがPlannerに無い: {skill}')
        effects: dict[str, int] = {}
        for line in tech['effectLines']:
            key = ATTR.get(line['text']['english'])
            if key is None:
                sys.exit(f"{skill}: 対応づけの無い効果 {line['text']['english']}")
            effects[key] = int(line['value'].replace('+', ''))
        for building in buildings:
            rows.append({'building': building, 'skill': skill, 'effects': effects})
    OUT.write_text(json.dumps({'source': 'ゲーム内データ(アップデート3.0)', 'bonuses': rows}, ensure_ascii=False, indent=2) + '\n',
                   encoding='utf-8', newline='\n')
    for r in rows:
        print(r['building'], r['skill'], r['effects'])


if __name__ == '__main__':
    main()
