#!/usr/bin/env python3
"""Steam版の assets.xml(解決済み)と Planner の JSON を突き合わせ、差異を表示する。

目的: 「データを assets.xml から直接作る」ための前段。Planner と同じ値が assets.xml から取れるかを確かめる。
入力 : _local/anno-official-data/v3.0.1-steam/  (assets.xml / templates.xml / properties.xml。tools/assets_resolver.py 参照)
       _local/anno-official-data/v3.0.1-planner/ (比較先。*.json)
出力 : 画面に種別ごとの差異件数と例。何も書き換えない
実行: python tools/compare-assets-vs-planner.py

比較する範囲(数値と参照関係のみ。名前などの文言は texts_*.xml 側の話なので見ない):
  工場 / 商品 / 需要 / 人口層 / 住居 / 建物(コスト・維持費・効果・地形ほか) / 研究 / 都市ステータス
  効果 / バフ / アイテム / 信仰(守護神・信仰度) / 祭り(長さ・開始条件・費用) / 貿易(商人の品物と予算・総督の予算)
  クエスト(ストーリーライン449・部品ノード16,911の種類・名前・接続先、ノード内の数値と参照、プール)
  Planner全ファイルのGUIDがXMLにあるか
比較しない範囲(XMLに無い、または未調査): 建物の幅と高さ(.ifo由来)、貿易の受動取引・建設資材・艦隊
クエストの注意: Planner は省略値(properties.xml の既定値。HP100%・保留120秒など)や参照先の資産の中身を埋め込む。
  ノードごとに XML の値と、参照先1段の値を探し、20ノード以上で欠ける値は『共通の省略値』として別集計にする
既知の「差異に見えるだけ」: Planner が null や空にしている値を XML は省略(=既定値)している。
効果の対象は ExcludeFromTargets を引き、存在しない資産への参照は落とす。バフの事故の種類は XML では 'A;B' の1値。
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

    def real(guids: list[int]) -> set[int]:
        # 参照先の資産が無いもの(消えた資産への参照)は Planner も落とす
        return {m for t in guids for m in expand(t) if m in R.raw}

    for gs, e in pj('effects').items():
        g = int(gs)
        r = R.get(g)
        if r is None:
            add('effects', g, e['name'], 'XMLに無い', '', '')
            continue
        v = r['v']
        if (v.get('/Effect/EffectScope') or 'Local') != (e['scope'] or 'Local'):  # スコープ省略 = Local
            add('effects', g, e['name'], 'scope', e['scope'], v.get('/Effect/EffectScope'))
        if sorted(e['buffs'] or []) != ids(v, '/Effect/Buffs', 'GUID'):
            add('effects', g, e['name'], 'buffs', e['buffs'], ids(v, '/Effect/Buffs', 'GUID'))
        pools = ids(v, '/Effect/Targets', 'GUID')
        # ExcludeFromTargets(除外プール)を引いたものが Planner の targets
        targets = sorted(real(pools) - real(ids(v, '/Effect/ExcludeFromTargets', 'GUID')))
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
            m = re.fullmatch(r'(.*)/item\[\d+\]', pl)  # 事故の種類などは XML では 'A;B' の1値
            if m and m.group(1) in lower and str(pv) in lower[m.group(1)].split(';'):
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


def indexed(v: dict, base: str) -> dict[int, dict[str, str]]:
    """base/Item[i]/残りのパス の値を {i: {残りのパス: 値}} に分ける"""
    out: dict[int, dict[str, str]] = collections.defaultdict(dict)
    for k, val in v.items():
        m = re.fullmatch(re.escape(base) + r'/Item\[(\d+)\](/.*)?', k)
        if m:
            out[int(m.group(1))][m.group(2) or ''] = val
    return out


def sub_items(it: dict, base: str) -> list[dict[str, str]]:
    """indexed() の1要素の中の base/Item[j]/名前 を、j順の辞書のリストにする"""
    sub: dict[int, dict[str, str]] = collections.defaultdict(dict)
    for k, val in it.items():
        m = re.fullmatch(re.escape(base) + r'/Item\[(\d+)\]/(\w+)', k)
        if m:
            sub[int(m.group(1))][m.group(2)] = val
    return [x for _, x in sorted(sub.items())]


def compare_religion(R: Resolver) -> None:
    rel = pj('religion')
    b, bal = rel['balancing'], R.get(30743)['v']
    # 注意: 祠のしきい値は XML 側の綴りが Treshold
    for fld, path in (('dominantPatronThreshold', '/ReligionBalancing/DominantPatronThreshold'),
                      ('wonderThreshold', '/ReligionBalancing/WonderThreshold'),
                      ('shrineThreshold', '/ReligionBalancing/ShrineTreshold')):
        if num(bal.get(path)) != b[fld]:
            add('religion', 30743, 'balancing', fld, b[fld], bal.get(path))
    xr = [(num(r.get('/StartDevotion')), num(r.get('/RatePerSecond')))
          for _, r in sorted(indexed(bal, '/ReligionBalancing/DevotionRateScaling').items())]
    pr = [(float(d['devotion']), float(d['ratePerSecond'])) for d in b['devotionRates']]
    if xr != pr:
        add('religion', 30743, 'balancing', 'devotionRates', pr[:3], xr[:3])

    for p in rel['patrons']:
        g = p['guid']
        v = R.get(g)['v']
        local = []
        for _, it in sorted(indexed(v, '/Patron/LocalEffects').items()):
            ms = sub_items(it, '/Milestones')
            local.append((int(it['/GUID']), [(num(x.get('Devotion')), num(x.get('BuffScaling'))) for x in ms]))
        plocal = [(e['effect'], [(float(m['devotion']), float(m['buffScaling'])) for m in e['milestones']]) for e in p['localEffects']]
        if local != plocal:
            add('religion', g, p['name'], 'localEffects', plocal[:1], local[:1])
        pdom = sorted(e['effect'] for e in p['dominantEffects'])
        if ids(v, '/Patron/DominantEffects', 'GUID') != pdom:
            add('religion', g, p['name'], 'dominantEffects', pdom, ids(v, '/Patron/DominantEffects', 'GUID'))
        for fld, path in (('wonder', '/Patron/Wonder'), ('shrine', '/Patron/Shrine')):
            if int_or_none(v.get(path)) != p[fld]:
                add('religion', g, p['name'], fld, p[fld], v.get(path))
        if (v.get('/Patron/RomanizationType') or 'None') != (p['romanization'] or 'None'):
            add('religion', g, p['name'], 'romanization', p['romanization'], v.get('/Patron/RomanizationType'))
        if num(v.get('/Patron/RomanizationValuePerDevotion')) != (p['romanizationPerDevotion'] or 0):
            add('religion', g, p['name'], 'romanizationPerDevotion', p['romanizationPerDevotion'], v.get('/Patron/RomanizationValuePerDevotion'))


def compare_festivals(R: Resolver) -> None:
    cfg = R.get(98210)['v']
    for f in pj('festivals')['festivals']:
        g = f['guid']
        v = R.get(g)['v']
        if num(v.get('/Festival/FestivalDuration')) / 1000 != f['seconds']:
            add('festivals', g, f['name'], 'seconds', f['seconds'], v.get('/Festival/FestivalDuration'))
        pe = sorted(e['guid'] for e in f['effects'])
        if ids(v, '/Festival/FestivalEffects', 'Effect') != pe:
            add('festivals', g, f['name'], 'effects', pe, ids(v, '/Festival/FestivalEffects', 'Effect'))
        # 開始条件(地域ごとのしきい値)
        tr = f['trigger']
        if tr and tr.get('kind') == 'attribute':
            for region, thresholds in tr['thresholds'].items():
                xs = []
                pattern = rf'/FestivalFeature/Region/{region}/Attributes/{tr["attribute"]}/Festivals/Item\[\d+\]/Festival'
                for k, val in cfg.items():
                    if re.fullmatch(pattern, k) and int(val) == g:
                        xs.append(num(cfg.get(k[: -len('/Festival')] + '/FestivalTriggerAttributeValue')))
                if sorted(xs) != sorted(float(t) for t in thresholds):
                    add('festivals', g, f['name'], 'trigger:' + region, thresholds, xs)
        # 選択肢の費用: 決定アセットの DecisionOptions を順に見る
        dv = R.get(int_or_none(v.get('/Festival/FestivalDecision')) or 0)
        if dv is None:
            add('festivals', g, f['name'], 'decision', '', 'XMLに無い')
            continue
        xo = []
        for _, it in sorted(indexed(dv['v'], '/Decision/DecisionOptions').items()):
            if it.get('/HasCost') == '1':
                prods = sorted(int(x) for k, x in it.items() if re.fullmatch(r'/CostData/Products/Item\[\d+\]/GUID', k))
                xo.append((prods, num(it.get('/CostData/Amount/Value')), num(it.get('/CostData/AdditionalAmountScaling')),
                           it.get('/CostData/DivideAmountByProductPrice') == '1'))
        po = [(sorted(x['guid'] for x in o['goods']), float(o['amount']), float(o['scaling']), bool(o['perPrice']))
              for o in f['options'] if o['goods'] or o['amount']]
        if xo != po:
            add('festivals', g, f['name'], 'options', po, xo)


def compare_trade(R: Resolver) -> None:
    tr = pj('trade')
    for t in tr['traders']:
        g = t['guid']
        v = R.get(g)['v']
        if (v.get('/Trader/GoodsTrader') == '1') != bool(t['goodsTrader']):
            add('trade', g, t['name'], 'goodsTrader', t['goodsTrader'], v.get('/Trader/GoodsTrader'))
        xg = []
        for _, it in sorted(indexed(v, '/Trader/OfferedGoods').items()):
            goods = [(int(x['Good']), num(x.get('ProductionPerMinute')), num(x.get('Limit')))
                     for x in sub_items(it, '/Goods') if 'Good' in x]
            xg.append((int_or_none(it.get('/UnlockCondition')), goods))
        pg = [((o['unlock'] or {}).get('guid'), [(x['product'], float(x['perMinute']), float(x['limit'])) for x in o['goods']])
              for o in t['offeredGoods']]
        if xg != pg:
            add('trade', g, t['name'], 'offeredGoods', pg[:2], xg[:2])
        for diff, rows in t['budgets'].items():
            xb = [(int_or_none(it.get('/UnlockCondition')), num(it.get('/BuyBudget')), num(it.get('/SellBudget')))
                  for _, it in sorted(indexed(v, f'/Trader/TradeBudgetsPerDifficulty/{diff}/TradeBudgets').items())]
            pb = [((r['unlock'] or {}).get('guid'), float(r['buy']), float(r['sell'])) for r in rows]
            if xb != pb:
                add('trade', g, t['name'], 'budgets:' + diff, pb[:2], xb[:2])

    for gv in tr['governors']:
        g = gv['guid']
        v = R.get(g)['v']
        if int_or_none(v.get('/Diplomacy/AllianceEffect')) != gv['allianceEffect']:
            add('trade', g, gv['name'], 'allianceEffect', gv['allianceEffect'], v.get('/Diplomacy/AllianceEffect'))
        for phase, by_diff in gv['activeTradeBudgets'].items():
            for diff, bs in by_diff.items():
                base = f'/ConstructionAI/EconomyRules/TradeRules/ActiveTrade/{phase}/Difficulty/{diff}'
                xb = (num(v.get(base + '/BuyBudget')), num(v.get(base + '/SellBudget')))
                if xb != (bs['buy'], bs['sell']):
                    add('trade', g, gv['name'], f'activeTrade:{phase}/{diff}', bs, xb)


def leaves(o, out: set) -> None:
    """Planner のダンプから葉の値を集める(数値は文字列に揃える)。$ref は GUID として集める"""
    if isinstance(o, dict):
        for k, v in o.items():
            if k == '$ref':
                out.add(str(int(v)))
            else:
                leaves(v, out)
    elif isinstance(o, list):
        for v in o:
            leaves(v, out)
    elif isinstance(o, bool):
        pass
    elif isinstance(o, (int, float)):
        if abs(o) >= 2 or not float(o).is_integer():
            out.add(str(int(o)) if float(o).is_integer() else str(o))


def xml_values(v: dict) -> set[str]:
    """XML の値を比較用に集める(数値は 2.0 -> 2 のように揃える)"""
    out = set()
    for val in v.values():
        out.add(val)
        f = num(val, None)
        if f is not None:
            out.add(str(int(f)) if f.is_integer() else str(f))
    return out


QUEST_PAYLOAD_KEYS = ('actions', 'objective', 'rewards', 'condition', 'decision', 'request', 'special', 'input',
                      'states', 'links', 'immediate', 'starter', 'dialogue', 'ui')


def compare_quests(R: Resolver) -> None:
    q = pj('quests')
    seen_nodes: set[int] = set()
    for quest in q['quests']:
        qg = int(quest['guid'])
        qr = R.get(qg)
        if qr is None:
            add('quests', qg, quest['name'], 'XMLに無い', '', '')
            continue
        if qr['template'] != 'StoryLine':
            add('quests', qg, quest['name'], 'template', 'StoryLine', qr['template'])
        for n in quest['nodes']:
            nid = int(n['id'])
            if nid in seen_nodes:
                continue
            seen_nodes.add(nid)
            r = R.get(nid)
            if r is None:
                add('questNodes', nid, n['name'], 'XMLに無い', '', '')
                continue
            if r['template'] != n['kind']:
                add('questNodes', nid, n['name'], 'kind', n['kind'], r['template'])
            if (r['name'] or '').strip() != (n['name'] or '').strip():
                add('questNodes', nid, n['name'], 'name', n['name'], r['name'])
            xv = r['v']
            vals = xml_values(xv)
            # Planner は参照先の資産(対話ウィンドウなど)の中身も埋め込むので、1段先の値も使う
            for val in list(xv.values()):
                if val.isdigit() and int(val) in R.raw and int(val) != nid:
                    vals |= xml_values(R.get(int(val))['v'])
            # 接続先: Planner の辺の行き先が、XML の値に全部あるか
            missing = [e['to'] for e in n.get('edges', []) if str(e['to']) not in vals]
            if missing:
                add('questNodes', nid, n['name'], 'edges', [e['to'] for e in n['edges']][:6], missing[:6])
            # 中身: Planner の各葉の値が、XML のどこかに同じ値であるか
            for key in QUEST_PAYLOAD_KEYS:
                if n.get(key) in (None, [], {}):
                    continue
                pl: set = set()
                leaves(n[key], pl)
                # 秒はXMLではミリ秒。41 は組み込みのプレイヤー参照(XMLに資産が無い)
                absent = sorted(x for x in pl if x not in vals and x != '41' and not (num(x, None) and str(int(num(x) * 1000)) in vals))
                if absent:
                    add('questNodes', nid, n['name'], 'payload:' + key, len(absent), absent[:5])
    # 多数のノードで同じ値が欠けるものは、省略値(properties.xml の既定値)とみなして別集計にする
    cnt = collections.Counter(v for d in diffs['questNodes'] if d[2].startswith('payload:') for v in d[4])
    common = {v for v, c in cnt.items() if c >= 20}
    kept = []
    for d in diffs['questNodes']:
        if d[2].startswith('payload:'):
            rest = [v for v in d[4] if v not in common]
            if not rest:
                continue
            d = (d[0], d[1], d[2], d[3], rest)
        kept.append(d)
    diffs['questNodes'] = kept
    print(f'クエスト {len(q["quests"])}件 / ノード {len(seen_nodes)}件を比較。共通の省略値とみなした値: {sorted(common)[:12]} ほか計{len(common)}種')

    for g, e in q['entries'].items():
        r = R.get(int(g))
        if r is None:
            add('questEntries', int(g), e['name'], 'XMLに無い', '', '')
            continue
        vals = xml_values(r['v'])
        for fld in ('title', 'summary'):
            if e.get(fld) is not None and str(e[fld]) not in vals:
                add('questEntries', int(g), e['name'], fld, e[fld], None)

    for p in q['pools']:
        r = R.get(int(p['guid']))
        if r is None:
            add('questPools', int(p['guid']), p['name'], 'XMLに無い', '', '')
            continue
        vals = xml_values(r['v'])
        for fld in ('questLimit', 'cooldown', 'resetThreshold'):
            pv = p.get(fld)
            ms = str(int(pv * 1000)) if pv else None
            if pv and str(int(pv) if float(pv).is_integer() else pv) not in vals and ms not in vals:
                add('questPools', int(p['guid']), p['name'], fld, pv, None)
        for s in p['storylines']:
            if str(s['storyline']) not in vals:
                add('questPools', int(p['guid']), p['name'], 'storyline', s, None)


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
             compare_effects_buffs_items, compare_religion, compare_festivals, compare_trade,
             compare_quests, check_guid_coverage)
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
