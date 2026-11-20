#!/usr/bin/env python3
"""Steam版の assets.xml(解決済み)と Planner の JSON を突き合わせ、差異を表示する。

目的: 「データを assets.xml から直接作る」ための前段。Planner と同じ値が assets.xml から取れるかを確かめる。
入力 : _local/anno-official-data/v3.0.1-steam/  (assets.xml / templates.xml / properties.xml。tools/assets_resolver.py 参照)
       _local/anno-official-data/v3.0.1-planner/ (比較先。*.json)
出力 : 画面に種別ごとの差異件数と例。何も書き換えない
実行: python tools/compare-assets-vs-planner.py

比較する範囲(数値と参照関係のみ。名前などの文言は texts_*.xml 側の話なので見ない):
  工場 / 商品 / 需要 / 人口層 / 住居 / 建物(コスト・維持費・効果・地形ほか) / 研究 / 都市ステータス
  効果 / バフ / アイテム / Planner全ファイルのGUIDがXMLにあるか
比較しない範囲(XMLに無い、または未調査): 建物の幅と高さ(.ifo由来)、祭り・信仰・貿易・クエストの数値
既知の「差異に見えるだけ」: Planner が null や空にしている値を XML は省略(=既定値)している。
"""
import collections
import glob
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import ROOT, Resolver  # noqa: E402

PLANNER = ROOT / '_local' / 'anno-official-data' / 'v3.0.1-planner'
ALL_REGIONS = ['Celtic', 'Egyptian', 'Roman']  # AssociatedRegions が無い建物は全地域

diffs: dict[str, list] = collections.defaultdict(list)


def add(cat: str, guid: int, name: str, field: str, planner, xml) -> None:
    diffs[cat].append((guid, name, field, planner, xml))


def pj(name: str):
    return json.loads((PLANNER / f'{name}.json').read_text(encoding='utf-8'))


def num(s, default: float | None = 0.0):
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def int_or_none(s):
    return int(s) if s else None


def amounts(v: dict, base: str, key: str) -> dict[int, float]:
    """Item の並びから {key値: 合計Amount}。Amount 0 は Planner が省くので数えない"""
    out: dict[int, float] = {}
    for k, val in v.items():
        m = re.fullmatch(re.escape(base) + r'/Item\[(\d+)\]/' + key, k)
        if m:
            a = num(v.get(f'{base}/Item[{m.group(1)}]/Amount'))
            if a:
                out[int(val)] = out.get(int(val), 0) + a
    return out


def ids(v: dict, base: str, key: str) -> list[int]:
    return sorted(int(val) for k, val in v.items() if k.startswith(base + '/Item[') and k.endswith('/' + key))


def to_map(rows) -> dict[int, float]:
    return {int(x['product']): float(x['amount']) for x in (rows or [])}


def pflat(d, prefix: str = '') -> dict:
    """Planner の properties 辞書を {パス: 値} に平坦化(リストは /Item[i])"""
    out: dict = {}
    if isinstance(d, dict):
        for k, v in d.items():
            out.update(pflat(v, f'{prefix}/{k}'))
    elif isinstance(d, list):
        for i, v in enumerate(d):
            out.update(pflat(v, f'{prefix}/Item[{i}]'))
    else:
        out[prefix] = d
    return out


def same(pv, xv) -> bool:
    if isinstance(pv, bool):
        return str(int(pv)) == str(xv) or str(pv).lower() == str(xv).lower()
    if isinstance(pv, (int, float)):
        return num(xv, None) == float(pv)
    return str(pv) == str(xv)


def compare_factories(R: Resolver) -> None:
    for f in pj('production')['factories']:
        v = R.get(f['guid'])['v']
        name = f['loca']['english']
        rows = {
            'cycleTime': (f['cycleTime'], num(v.get('/FactoryBase/CycleTime'), 30.0)),
            'outputs': (to_map(f['outputs']), amounts(v, '/FactoryBase/FactoryOutputs', 'Product')),
            'inputs': (to_map(f['inputs']), amounts(v, '/FactoryBase/FactoryInputs', 'Product')),
            'maintenance': (to_map(f['maintenance']), amounts(v, '/Maintenance/Maintenances', 'Product')),
        }
        for k, (a, b) in rows.items():
            if a != b:
                add('factories', f['guid'], name, k, a, b)


def compare_economy(R: Resolver) -> None:
    for p in pj('products')['products']:
        r = R.get(p['guid'])
        if r is None:
            add('products', p['guid'], p['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if num(v.get('/Product/BasePrice')) != p['basePrice']:
            add('products', p['guid'], p['name'], 'basePrice', p['basePrice'], v.get('/Product/BasePrice'))
        if (v.get('/Product/StorageLevel') or 'Meta') != (p['storageLevel'] or 'Meta'):
            add('products', p['guid'], p['name'], 'storageLevel', p['storageLevel'], v.get('/Product/StorageLevel'))
        if len(p['regions']) <= 1 and (v.get('/Product/AssociatedRegion') or None) != (p['regions'][0] if p['regions'] else None):
            add('products', p['guid'], p['name'], 'region', p['regions'], v.get('/Product/AssociatedRegion'))

    for n in pj('needs')['needs']:
        r = R.get(n['guid'])
        if r is None:
            add('needs', n['guid'], n['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if int_or_none(v.get('/Need/NeedProduct')) != n['product']:
            add('needs', n['guid'], n['name'], 'product', n['product'], v.get('/Need/NeedProduct'))
        if num(v.get('/Need/SupplyWeight')) != n['supplyWeight']:
            add('needs', n['guid'], n['name'], 'supplyWeight', n['supplyWeight'], v.get('/Need/SupplyWeight'))
        xa = {k.split('/')[3]: num(x) for k, x in v.items() if k.startswith('/Need/NeedAttributes/') and k.endswith('/Value')}
        if xa != {k: float(x) for k, x in n['attributes'].items()}:
            add('needs', n['guid'], n['name'], 'attributes', n['attributes'], xa)

    pop = pj('population')
    for lv in pop['populationLevels']:
        r = R.get(lv['guid'])
        if r is None:
            add('populationLevels', lv['guid'], lv['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if int_or_none(v.get('/PopulationLevel/ConnectedWorkforce')) != lv['workforce']:
            add('populationLevels', lv['guid'], lv['name'], 'workforce', lv['workforce'], v.get('/PopulationLevel/ConnectedWorkforce'))
        if num(v.get('/PopulationLevel/PopulationToWorkforceFactor')) != lv['populationToWorkforceFactor']:
            add('populationLevels', lv['guid'], lv['name'], 'factor', lv['populationToWorkforceFactor'], v.get('/PopulationLevel/PopulationToWorkforceFactor'))

    for res in pop['residences']:
        r = R.get(res['guid'])
        if r is None:
            add('residences', res['guid'], res['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        xn = {}
        for k in v:
            if k.startswith('/Residence7/NeedsList/Item[') and k.endswith('/Need'):
                base = k[: -len('/Need')]
                xn[int(v[k])] = (num(v.get(base + '/NeedConsumptionRate')), v.get(base + '/IsOnlyAvailableThroughBuff') == '1')
        pn = {n['need']: (n['consumptionRate'] or 0.0, n['onlyThroughBuff']) for n in res['needs']}
        if xn != pn:
            add('residences', res['guid'], res['name'], 'needs', sorted(set(pn) - set(xn)), sorted(set(xn) - set(pn)))
        xt = {k.split('/')[3]: num(x) for k, x in v.items() if k.startswith('/Residence7/UpgradeThreshold/') and k.endswith('/Value') and num(x)}
        if xt != {k: float(x) for k, x in res['upgradeThresholds'].items() if x}:
            add('residences', res['guid'], res['name'], 'thresholds', res['upgradeThresholds'], xt)
        xu = ids(v, '/Upgradable/PossibleUpgrades', 'UpgradeGUID')
        if xu != sorted(res['upgrades']):
            add('residences', res['guid'], res['name'], 'upgrades', res['upgrades'], xu)


def compare_buildings(R: Resolver) -> None:
    for gs, b in pj('buildings').items():
        g = int(gs)
        r = R.get(g)
        if r is None:
            add('buildings', g, b['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        name = b['name']
        if r['template'] != b['template']:
            add('buildings', g, name, 'template', b['template'], r['template'])
        if to_map(b['constructionCosts']) != amounts(v, '/Cost/Costs', 'Ingredient'):
            add('buildings', g, name, 'cost', to_map(b['constructionCosts']), amounts(v, '/Cost/Costs', 'Ingredient'))
        if to_map(b['maintenanceCosts']) != amounts(v, '/Maintenance/Maintenances', 'Product'):
            add('buildings', g, name, 'maintenance', to_map(b['maintenanceCosts']), amounts(v, '/Maintenance/Maintenances', 'Product'))
        for fld, path in (('effectRadius', '/EffectSource/RadiusDistance'), ('effectStreet', '/EffectSource/StreetDistance')):
            if b[fld] is not None and path in v and num(v[path]) != b[fld]:
                add('buildings', g, name, fld, b[fld], v[path])
        fe = ids(v, '/Building/FunctionalEffects', 'FunctionalEffect')
        if sorted(b['functionalEffects'] or []) != fe:
            add('buildings', g, name, 'functionalEffects', b['functionalEffects'], fe)
        if int_or_none(v.get('/PublicService/PublicServiceEffect')) != b['publicServiceEffect']:
            add('buildings', g, name, 'publicServiceEffect', b['publicServiceEffect'], v.get('/PublicService/PublicServiceEffect'))
        if int_or_none(v.get('/AttributeProvider/Population')) != b['populationLevel']:
            add('buildings', g, name, 'populationLevel', b['populationLevel'], v.get('/AttributeProvider/Population'))
        xr = v.get('/Building/AssociatedRegions')
        xr = sorted(xr.split(';')) if xr else ALL_REGIONS
        if sorted(b['regions'] or []) != xr:
            add('buildings', g, name, 'regions', b['regions'], xr)
        xt = v.get('/Building/TerrainType2')
        if b['terrain'] and xt and sorted(b['terrain']) != sorted(xt.split(';')):
            add('buildings', g, name, 'terrain', b['terrain'], xt)


def compare_techs_and_status(R: Resolver) -> None:
    for t in pj('techs')['techs']:
        r = R.get(t['guid'])
        if r is None:
            add('techs', t['guid'], t['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if num(v.get('/Tech/KnowledgeNeeded')) != t['knowledge']:
            add('techs', t['guid'], t['name'], 'knowledge', t['knowledge'], v.get('/Tech/KnowledgeNeeded'))
        xy = (num(v.get('/Tech/GridPosition/X')), num(v.get('/Tech/GridPosition/Y')))
        if xy != (t['x'], t['y']):
            add('techs', t['guid'], t['name'], 'xy', (t['x'], t['y']), xy)
        xe = ids(v, '/Tech/Rewards/Effects', 'EffectAsset')
        if sorted(t['effects']) != xe:
            add('techs', t['guid'], t['name'], 'effects', t['effects'], xe)

    for region, rows in pj('city_status').items():
        for s in rows:
            r = R.get(s['guid'])
            if r is None:
                add('cityStatus', s['guid'], region, 'XMLに無い', '', '')
                continue
            for key in ('Roman', 'Mixed', 'Regional'):
                px = {k: float(x) for k, x in s['attributes'].get(key, {}).items()}
                xx = {k.split('/')[3]: num(x) for k, x in r['v'].items() if k.startswith(f'/CityStatus/AttributeEffects{key}/') and k.endswith('/Value')}
                if px != xx:
                    add('cityStatus', s['guid'], region, 'attr:' + key, px, xx)


def compare_effects_buffs_items(R: Resolver) -> None:
    def expand(guid: int, seen: tuple = ()) -> list[int]:
        """AssetPool(入れ子あり)を個々の GUID に展開する"""
        r = R.get(guid)
        if r and r['template'] == 'AssetPool' and guid not in seen:
            return [m for x in ids(r['v'], '/AssetPool/AssetList', 'Asset') for m in expand(x, seen + (guid,))]
        return [guid]

    for gs, e in pj('effects').items():
        g = int(gs)
        r = R.get(g)
        if r is None:
            add('effects', g, e['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if (v.get('/Effect/EffectScope') or None) != (e['scope'] or None):
            add('effects', g, e['name'], 'scope', e['scope'], v.get('/Effect/EffectScope'))
        if sorted(e['buffs'] or []) != ids(v, '/Effect/Buffs', 'GUID'):
            add('effects', g, e['name'], 'buffs', e['buffs'], ids(v, '/Effect/Buffs', 'GUID'))
        pools = ids(v, '/Effect/Targets', 'GUID')
        targets = sorted({m for t in pools for m in expand(t)})
        if sorted(set(e['targets'] or [])) != targets:
            add('effects', g, e['name'], 'targets', e['targets'], targets)
        if sorted(e['targetPools'] or []) != pools:
            add('effects', g, e['name'], 'targetPools', e['targetPools'], pools)
        seconds = num(v.get('/Effect/TimedEffect/EffectDuration')) / 1000
        if abs(seconds - (e['duration'] or 0)) > 1e-6:
            add('effects', g, e['name'], 'duration', e['duration'], seconds)

    for gs, b in pj('buffs').items():
        g = int(gs)
        r = R.get(g)
        if r is None:
            add('buffs', g, b['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if r['template'] != b['template']:
            add('buffs', g, b['name'], 'template', b['template'], r['template'])
        if v.get('/Buff/SourceCategory') != b['sourceCategory']:
            add('buffs', g, b['name'], 'sourceCategory', b['sourceCategory'], v.get('/Buff/SourceCategory'))
        lower = {k.lower(): x for k, x in v.items()}
        bad = []
        for path, pv in pflat(b['properties']).items():
            pl = path.lower()
            if pl in lower and same(pv, lower[pl]):
                continue
            if pl + '/value' in lower and same(pv, lower[pl + '/value']):
                continue
            if pl.endswith('/percental') and pv is False and pl not in lower:
                continue
            bad.append((path, pv, lower.get(pl, lower.get(pl + '/value'))))
        if bad:
            add('buffs', g, b['name'], 'properties', len(bad), bad[:2])

    defaults = {'rarity': 'Common', 'niche': 'Finance'}  # XML は既定値を省略する
    for it in pj('item_catalog')['items']:
        g = it['guid']
        r = R.get(g)
        if r is None:
            add('items', g, it['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        for fld, path in (('rarity', '/Item[0]/Rarity'), ('niche', '/Item[0]/Niche')):
            planner = it[fld] if it[fld] not in ('None', '') else None
            xml = v.get(path) or defaults[fld]
            if xml != planner and not (planner is None and xml == 'None'):
                add('items', g, it['name'], fld, it[fld], v.get(path))
        if num(v.get('/Item[0]/TradePrice'), 1000.0) != float(it['tradePrice'] or 0):
            add('items', g, it['name'], 'tradePrice', it['tradePrice'], v.get('/Item[0]/TradePrice'))


def check_guid_coverage(R: Resolver) -> None:
    """Planner の各ファイルに出てくる guid が、XML に全部あるか"""
    def collect(o, out: set) -> None:
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('guid', 'GUID') and isinstance(v, int):
                    out.add(v)
                collect(v, out)
        elif isinstance(o, list):
            for v in o:
                collect(v, out)

    for fp in sorted(glob.glob(str(PLANNER / '*.json'))):
        name = os.path.basename(fp)
        if name == 'manifest.json' or 'quest_texts' in name:
            continue
        data = json.loads(Path(fp).read_text(encoding='utf-8'))
        gs: set = set()
        collect(data, gs)
        if isinstance(data, dict):
            gs |= {int(k) for k in data if k.isdigit()}
        for g in sorted(g for g in gs if g not in R.raw):
            add('guid網羅', g, name, 'XMLに無い', '', '')


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    R = Resolver()
    steps = (compare_factories, compare_economy, compare_buildings, compare_techs_and_status,
             compare_effects_buffs_items, check_guid_coverage)
    for step in steps:
        step(R)
    print('=== 差異 ===')
    if not diffs:
        print('差異なし')
    for cat, rows in diffs.items():
        print(f'[{cat}] {len(rows)}件 内訳 {dict(collections.Counter(r[2] for r in rows))}')
        shown = set()
        for r in rows:
            if r[2] not in shown:
                shown.add(r[2])
                print('   例:', str(r)[:300])
    print('(上に出ない種別は差異0件)')


if __name__ == '__main__':
    main()
