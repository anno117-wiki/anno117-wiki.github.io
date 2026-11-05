#!/usr/bin/env python3
"""アイギュプト専用の建物の効果を、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{buildings,effects,buffs,population,needs}.json
出力 : apps/wiki/docs/wiki/buildings-aegyptus.json (buildings.data.ts が buildings-effects.json に足して読む)

- 対象は、アイギュプトだけにある建物(regions が ['Egyptian'])のうち、tools/build-buildings-data.py と同じ種類(template)のもの
- 維持費 = 維持費のうちコイン(1010017)の量にマイナスを付けた値
- 効果 = 建物の functionalEffects の各効果が持つバフの属性値の合計(既存と同じく FunctionalEffects だけを数える)。
  属性: 人口(Population)・収入(Money)・信仰(Belief)・知識(Knowledge)・名声(Prestige)・健康(Health)・幸福(Happiness)・火災安全度(FireSafety)
- 層(tier): その建物を必要とする層。住居の建物はその住居の層。それ以外は、同じアイコンの需要(公共サービス・商品)を最初に持つ層。
  住民が直接必要としない建物(中間品の生産施設・軍事・港湾など)は層なし('none')にする。労働力の層は使わない
- icon は Planner の建物アイコン名(生産施設は生産品の絵)。画像は tools/build-aegyptus-building-icons.py が用意する
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'buildings-aegyptus.json'
ZW = '​'
COIN = 1010017
TEMPLATES = {
    'Production', 'Production Field', 'Production Marsh', 'Production Marsh Pasture', 'Production Marsh Area', 'Production Area',
    'PublicServiceBuilding', 'MiniInstitutionBuilding', 'ResidenceBuilding', 'Monument', 'CityInstitutionBuilding',
    'CityInstitutionBuilding_Marsh', 'RecruitmentBuilding', 'SlotFactoryBuilding7',
    'HarborWarehouse', 'HarborDepot', 'TradeBuilding', 'RepairCrane', 'AqueductConnector', 'VillaUrban', 'GuestHouse',
    'Canal', 'MonumentEventBuilding',
}
ATTR = {'Population': 'population', 'Money': 'income', 'Belief': 'faith', 'Knowledge': 'knowledge',
        'Prestige': 'prestige', 'Health': 'health', 'Happiness': 'happiness', 'FireSafety': 'fireSafety'}
TIER_KEY = {149681: 'thresher', 150510: 'potter', 150511: 'priestess', 150534: 'scribe', 150542: 'gymnasiarch'}


def ja(x: dict) -> str:
    return (x.get('loca') or {}).get('japanese', '').replace(ZW, '')


def icon_key(b: dict) -> str | None:
    """建物一覧(wiki)の icon の値。ゲームの建物アイコンのファイル名から icon_3d_ と .png を除いたもの。

    生産施設は、そのゲームのアイコンが生産品の絵なので、既存の建物と同じく生産品のアイコンになる。
    """
    name = (b.get('icon') or '').split('/')[-1]
    if name.startswith('icon_3d_') and name.endswith('.png'):
        return name[len('icon_3d_'):-len('.png')]
    return None


def main() -> None:
    buildings = json.loads((SRC / 'buildings.json').read_text(encoding='utf-8'))
    effects = json.loads((SRC / 'effects.json').read_text(encoding='utf-8'))
    buffs = json.loads((SRC / 'buffs.json').read_text(encoding='utf-8'))
    pop = json.loads((SRC / 'population.json').read_text(encoding='utf-8'))
    needs = {n['guid']: n for n in json.loads((SRC / 'needs.json').read_text(encoding='utf-8'))['needs']}

    levels = {x['guid']: x for x in pop['populationLevels']}
    workforce_tier = {levels[g]['workforce']: TIER_KEY[g] for g in TIER_KEY}
    # 公共サービスの建物のアイコン -> その建物を最初に必要とする層(需要と建物は同じアイコンを使う。需要には日本語名が無いものがある)
    order = [TIER_KEY[g] for g in sorted(TIER_KEY, key=lambda g: levels[g]['tier'])]
    first_need: dict[str, str] = {}
    for r in sorted((r for r in pop['residences'] if 'Egyptian' in r['regions']),
                    key=lambda r: order.index(TIER_KEY[r['populationLevel']])):
        for q in r['needs']:
            n = needs[q['need']]
            if n.get('icon'):
                first_need.setdefault(n['icon'], TIER_KEY[r['populationLevel']])

    # 住居の建物 -> その住居に住む層
    residence_tier = {r['guid']: TIER_KEY[r['populationLevel']] for r in pop['residences'] if r['populationLevel'] in TIER_KEY}

    rows = []
    for b in buildings.values():
        if b['regions'] != ['Egyptian'] or b['template'] not in TEMPLATES or not b.get('loca'):
            continue
        maint = {m['product']: m['amount'] for m in (b['maintenanceCosts'] or [])}
        attrs = {v: 0.0 for v in ATTR.values()}
        for e in b['functionalEffects'] or []:
            for buff in effects.get(str(e), {}).get('buffs', []):
                for k, v in (buffs.get(str(buff), {}).get('calc') or {}).get('attributes', {}).items():
                    if k in ATTR:
                        attrs[ATTR[k]] += v
        tier = residence_tier.get(b['guid']) or first_need.get(b.get('icon')) or 'none'
        rows.append({
            'id': f"aegyptus_{b['guid']}",
            'nameEn': b['loca']['english'],
            'nameJa': ja(b),
            'tier': tier,
            'maintenance': -int(maint.get(COIN, 0)),
            **{k: (int(v) if float(v).is_integer() else round(v, 2)) for k, v in attrs.items()},
            'template': b['template'],
            **({'icon': icon} if (icon := icon_key(b)) else {}),
        })
    rows.sort(key=lambda r: (order.index(r['tier']) if r['tier'] in order else 99, r['nameJa']))
    OUT.write_text(json.dumps({'source': 'ゲーム内データ(アップデート3.0)', 'buildings': rows},
                              ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    none = [r['nameJa'] for r in rows if r['tier'] == 'none']
    print(f'{len(rows)}件を出力 -> {OUT}')
    print(f'層なし {len(none)}件: {none}')


if __name__ == '__main__':
    main()
