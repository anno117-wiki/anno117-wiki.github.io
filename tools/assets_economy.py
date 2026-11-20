"""assets.xml から、商品・需要・人口層・住居のデータを Planner の products.json / needs.json / population.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner のこれらのファイルを、ゲームの assets.xml に置き換える。
      スクリプト側は読み先を替えるだけで済むよう、使う項目は Planner と同じ名前・形にしてある。

作る項目(Planner と同じ名前):
  load_products()   -> {'products': [...]}
      guid / name / loca / icon / regions / productionRegions / category / basePrice / storageLevel
      ※ 労働力の商品(IsWorkforce)は Planner と同じく products に入れず、load_population() の workforce に入れる
  load_needs()      -> {'needs': [...]}
      guid / name / loca / icon / product / category / supplyWeight / attributes
  load_population() -> {'populationGroups', 'populationLevels', 'residences', 'workforce'}
      層: guid / name / loca / icon / workforce / populationToWorkforceFactor / regions / residence / group / tier
      住居: guid / name / loca / icon / populationLevel / regions / needs[{need, consumptionRate, onlyThroughBuff}] / upgrades

XML での探し方:
  - 分類は /Product/ProductCategory と /Building/BuildingCategoryName の文言(texts_english.xml)、需要の分類は /Need/NeedCategoryType
  - 層の tier は、人口グループ(PopulationGroup7)に並ぶ層の順番(0から)
  - 住居の需要率が書かれていないものは None(Planner と同じ。0 ではない)

使い方:
    from assets_economy import load_products, load_needs, load_population
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

ALL_REGIONS = ['Roman', 'Celtic', 'Egyptian']


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _indexed(v: dict, base: str) -> list[dict[str, str]]:
    """base/Item[i]/名前 の値を、i 順の辞書のリストにする"""
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/(\w+)')
    rows: dict[int, dict[str, str]] = {}
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            rows.setdefault(int(m.group(1)), {})[m.group(2)] = val
    return [rows[i] for i in sorted(rows)]


def _loca(texts: dict, line_id) -> dict | None:
    if not line_id:
        return None
    return {'english': texts['english'].get(int(line_id), ''), 'japanese': texts['japanese'].get(int(line_id), '')}


def _all_texts() -> dict[str, dict[int, str]]:
    return {'english': load_texts('english'), 'japanese': load_texts('japanese')}


def _assets(R: Resolver, template: str) -> list[int]:
    return [g for g in R.raw if R.template_of(g) == template]


def load_products(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    texts = _all_texts()
    out = []
    for guid in _assets(R, 'Product'):
        v = R.get(guid)['v']
        if v.get('/Product/IsWorkforce') == '1':
            continue
        cat = v.get('/Product/ProductCategory')
        associated = v.get('/Product/AssociatedRegion')
        out.append({
            'guid': guid,
            'name': R.get(guid)['name'],
            'loca': _loca(texts, v.get('/Text/OasisId')),
            'icon': v.get('/Standard/IconFilename') or None,
            'regions': associated.split(';') if associated else [],  # XML に書かれた順のまま
            'productionRegions': [r['RegionType'] for r in _indexed(v, '/Product/ProductionRegions') if 'RegionType' in r],
            'category': texts['english'].get(int(cat)) if cat else None,
            'basePrice': _num(v.get('/Product/BasePrice')),
            'storageLevel': v.get('/Product/StorageLevel') or 'Meta',
        })
    return {'products': out}


def load_needs(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    texts = _all_texts()
    out = []
    for guid in _assets(R, 'Need'):
        v = R.get(guid)['v']
        product = v.get('/Need/NeedProduct')
        out.append({
            'guid': guid,
            'name': R.get(guid)['name'],
            'loca': _loca(texts, v.get('/Text/OasisId')),
            'icon': v.get('/Standard/IconFilename') or None,
            'product': int(product) if product else None,
            'category': v.get('/Need/NeedCategoryType'),
            'supplyWeight': _num(v.get('/Need/SupplyWeight')),
            'attributes': {k.split('/')[3]: _num(x) for k, x in v.items()
                           if k.startswith('/Need/NeedAttributes/') and k.endswith('/Value')},
        })
    return {'needs': out}


def load_population(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    texts = _all_texts()

    groups = []
    level_group: dict[int, tuple[int, int, str]] = {}  # 層 -> (グループ, tier, 地域)
    for guid in _assets(R, 'PopulationGroup7'):
        v = R.get(guid)['v']
        region = v.get('/PopulationGroup7/Regional')
        levels = [int(x['Level']) for x in _indexed(v, '/PopulationGroup7/PopulationLevels')]
        groups.append({'guid': guid, 'name': R.get(guid)['name'], 'icon': v.get('/Standard/IconFilename') or None,
                       'region': region, 'populationLevels': levels})
        for tier, lv in enumerate(levels):
            level_group[lv] = (guid, tier, region)

    residences = []
    level_residence: dict[int, int] = {}
    for guid in _assets(R, 'ResidenceBuilding'):
        v = R.get(guid)['v']
        level = v.get('/Residence7/PopulationLevel')
        regions = v.get('/Building/AssociatedRegions')
        needs = []
        for item in _indexed(v, '/Residence7/NeedsList'):
            if 'Need' in item:
                rate = item.get('NeedConsumptionRate')
                needs.append({'need': int(item['Need']), 'consumptionRate': float(rate) if rate else None,
                              'onlyThroughBuff': item.get('IsOnlyAvailableThroughBuff') == '1'})
        residences.append({
            'guid': guid,
            'name': R.get(guid)['name'],
            'loca': _loca(texts, v.get('/Text/OasisId')),
            'icon': v.get('/Standard/IconFilename') or None,
            'populationLevel': int(level) if level else None,
            'regions': regions.split(';') if regions else list(ALL_REGIONS),
            'needs': needs,
            'upgrades': [int(x['UpgradeGUID']) for x in _indexed(v, '/Upgradable/PossibleUpgrades') if 'UpgradeGUID' in x],
        })
        if level:
            level_residence.setdefault(int(level), guid)

    levels = []
    workforce_regions: dict[int, list[str]] = {}
    for guid in _assets(R, 'PopulationLevel'):
        v = R.get(guid)['v']
        group, tier, region = level_group.get(guid, (None, None, None))
        wf = v.get('/PopulationLevel/ConnectedWorkforce')
        levels.append({
            'guid': guid,
            'name': R.get(guid)['name'],
            'loca': _loca(texts, v.get('/Text/OasisId')),
            'icon': v.get('/Standard/IconFilename') or None,
            'workforce': int(wf) if wf else None,
            'populationToWorkforceFactor': _num(v.get('/PopulationLevel/PopulationToWorkforceFactor')),
            'regions': [region] if region else [],
            'residence': level_residence.get(guid),
            'group': group,
            'tier': tier,
        })
        if wf and region:
            workforce_regions.setdefault(int(wf), []).append(region)

    # 並びは Planner と同じ: 人口グループの順に、グループ内の層を連ねた順
    order = {lv: i for i, lv in enumerate(lv for g in groups for lv in g['populationLevels'])}
    levels.sort(key=lambda lv: order.get(lv['guid'], len(order)))

    workforce = []
    for guid in _assets(R, 'Product'):
        v = R.get(guid)['v']
        if v.get('/Product/IsWorkforce') == '1':
            workforce.append({'guid': guid, 'name': R.get(guid)['name'], 'loca': _loca(texts, v.get('/Text/OasisId')),
                              'icon': v.get('/Standard/IconFilename') or None, 'regions': workforce_regions.get(guid, [])})
    return {'populationGroups': groups, 'populationLevels': levels, 'residences': residences, 'workforce': workforce}
