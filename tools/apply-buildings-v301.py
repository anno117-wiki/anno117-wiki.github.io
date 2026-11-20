#!/usr/bin/env python3
"""建物効果ページの buildings-effects.json を、ゲーム3.0.1のデータ(Anno 117 Planner)に合わせて直す。

buildings-effects.json は tools/build-buildings-data.py が v2.1 の assets.xml から作ったもの。
3.0 以降は完全な assets.xml が無いので、3.0.1 で変わった行・足りない行だけをここで直す。
build-buildings-data.py を走らせたあとは、必ずこのスクリプトも走らせる(走らせないと下の直しが消える)。

入力 : assets.xml から作った建物・効果・バフ(tools/assets_buildings.py・assets_effects.py)
出力 : apps/wiki/docs/wiki/buildings-effects.json (上書き。何度走らせても同じ結果になる)

- 値の出し方は tools/build-buildings-aegyptus.py と同じ(維持費はコインの量、効果は functionalEffects のバフの属性の合計)
- FIX    : 既にある行を、GUID の建物の値で直す(名前も直すものは RENAME に入れる)
- ADD    : 足りない行を足す(同じ id があれば作り直す)。after の行の直後に置く
アイギュプトだけにある建物はここでなく tools/build-buildings-aegyptus.py が扱う。

実行: python tools/apply-buildings-v301.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_buildings import load_buildings  # noqa: E402
from assets_effects import load_buffs, load_effects  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0.1-planner'
TARGET = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'buildings-effects.json'
ZW = '​'
COIN = 1010017
ATTR = {'Population': 'population', 'Money': 'income', 'Belief': 'faith', 'Knowledge': 'knowledge',
        'Prestige': 'prestige', 'Health': 'health', 'Happiness': 'happiness', 'FireSafety': 'fireSafety'}

# 行の id -> 値を取る建物の GUID
FIX = {
    'albion_brewery': 5570,          # 収入 +2 -> +1(3.0で変更)
    'warehouse': 3310,               # 交易所(3402)の値になっていた
    'aqueduct_source': 19691,        # 別の建物(19723)の値になっていた
    'horse_breeder': 2794,
    'albion_cattle_farm': 5847,
    'albion_green_dye_house': 5469,
}
# 名前をゲームの名前に直す行(英名・日本語名とも GUID の建物の名前にする)
RENAME = {'horse_breeder', 'albion_cattle_farm', 'albion_green_dye_house'}

# 足す行。ラティウムと同じ名前のアルビオン版は、地域ごとに値が違うので行を分ける
ADD = [
    {'id': 'albion_vigiles', 'guid': 30769, 'tier': 'none', 'icon': 'institution_roman_vigiles', 'after': 'vigiles'},
    {'id': 'albion_custodes', 'guid': 30770, 'tier': 'none', 'icon': 'institution_roman_cohortes', 'after': 'albion_vigiles'},
    {'id': 'albion_medici', 'guid': 30771, 'tier': 'none', 'icon': 'institution_roman_medici', 'after': 'medici'},
    {'id': 'albion_well', 'guid': 71267, 'tier': 'none', 'icon': 'institution_well', 'after': 'well'},
    {'id': 'albion_latrine', 'guid': 71269, 'tier': 'none', 'icon': 'institution_latrine', 'after': 'latrine'},
    # アルビオンで神殿を求めるのはノビレス(Planner の需要)
    {'id': 'albion_temple', 'guid': 6729, 'tier': 'nobles', 'icon': 'public_roman_temple', 'after': 'temple'},
    # DLC03 の祭壇(3地域で建てられる)
    {'id': 'shrine_of_isis_bastet', 'guid': 153591, 'tier': 'none', 'icon': 'shrine_isis', 'after': 'shrine_of_vulcan'},
    {'id': 'shrine_of_sobek', 'guid': 153776, 'tier': 'none', 'icon': 'shrine_sobek', 'after': 'shrine_of_isis_bastet'},
    {'id': 'shrine_of_thoth', 'guid': 153777, 'tier': 'none', 'icon': 'shrine_thoth', 'after': 'shrine_of_sobek'},
    {'id': 'shrine_of_replica_sphinx', 'guid': 153592, 'tier': 'none', 'icon': 'shrine_sphinx', 'after': 'shrine_of_thoth'},
]


def load(name: str) -> dict:
    return json.loads((SRC / name).read_text(encoding='utf-8'))


def values(b: dict, effects: dict, buffs: dict) -> dict:
    """建物の維持費と効果(build-buildings-aegyptus.py と同じ数え方)"""
    maint = {m['product']: m['amount'] for m in (b.get('maintenanceCosts') or [])}
    attrs = {v: 0.0 for v in ATTR.values()}
    for e in b.get('functionalEffects') or []:
        for buff in effects.get(str(e), {}).get('buffs', []):
            for k, v in (buffs.get(str(buff), {}).get('calc') or {}).get('attributes', {}).items():
                if k in ATTR:
                    attrs[ATTR[k]] += v
    return {'maintenance': -int(maint.get(COIN, 0)),
            **{k: (int(v) if float(v).is_integer() else round(v, 2)) for k, v in attrs.items()}}


def main() -> None:
    buildings = load_buildings()  # assets.xml から作る(Planner の buildings.json と同じ形)
    effects = load_effects()
    buffs = load_buffs()
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    rows: list[dict] = data['buildings']

    def building(guid: int) -> dict:
        b = buildings.get(str(guid))
        if not b:
            sys.exit(f'assets.xml に GUID {guid} の建物が無い')
        return b

    def index_of(row_id: str) -> int:
        for i, r in enumerate(rows):
            if r['id'] == row_id:
                return i
        sys.exit(f'buildings-effects.json に行 {row_id} が無い')

    for row_id, guid in FIX.items():
        b = building(guid)
        row = rows[index_of(row_id)]
        row.update(values(b, effects, buffs))
        if row_id in RENAME:
            row['nameEn'] = b['loca']['english']
            row['nameJa'] = b['loca']['japanese'].replace(ZW, '')

    for add in ADD:
        b = building(add['guid'])
        row = {'id': add['id'], 'nameEn': b['loca']['english'], 'nameJa': b['loca']['japanese'].replace(ZW, ''),
               'tier': add['tier'], **values(b, effects, buffs), 'icon': add['icon']}
        if any(r['id'] == add['id'] for r in rows):
            rows[index_of(add['id'])] = row
        else:
            rows.insert(index_of(add['after']) + 1, row)

    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(FIX)}行を直し、{len(ADD)}行を足しました -> {TARGET}')


if __name__ == '__main__':
    main()
