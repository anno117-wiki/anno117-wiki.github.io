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
  研究の残り(分類・ゲート・繰り返し・報酬数・バッジ数・分野の位置と順・画面の升目)
  クエスト(ストーリーライン449・部品ノード16,911の種類・名前・接続先、ノード内の数値と参照、プール)
  生産建物モジュール(tools/assets_factories.py)が Planner の production.json と同じ値・並びか
  建物モジュール(tools/assets_buildings.py)が Planner の buildings.json と同じ値か(Planner にある建物のみ)
  商品・需要・人口層・住居のモジュール(tools/assets_economy.py)が Planner の products / needs / population と同じ値・並びか
  研究のモジュール(tools/assets_techs.py)が Planner の techs.json と同じ値・並びか(effectLines などの文は対象外)
  街の状況のモジュール(tools/assets_city_status.py)が Planner の city_status.json と同じ値・並びか
  効果・バフのモジュール(tools/assets_effects.py)が Planner の effects.json / buffs.json と同じ値か(バフは属性の加算のみ)
  信仰・祭りのモジュール(tools/assets_religion.py)が Planner の religion.json / festivals.json と同じ値・並びか
  アイテム・資産の名前表のモジュール(tools/assets_items.py)が Planner の item_catalog.json と同じ値か(説明文・入手先・効果の説明行は対象外)
  Planner全ファイルのGUIDがXMLにあるか
比較しない範囲(XMLに無い、または未調査): 建物の幅と高さ(.ifo由来)、貿易の受動取引・建設資材・艦隊、
  研究どうしの接続線(XMLに接続の情報が無い。画面の升目と TechConnectionLength だけある)
クエストの注意: Planner は参照先の資産(対話ウィンドウなど)の中身も埋め込むので、ノードごとに参照先1段の値も探す。
  XML で 0(未設定)と書かれた値を Planner が既定の資産で埋める例(移動目的の範囲表示 500886 など)が約50ノード残る。
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
    print(f'クエスト {len(q["quests"])}件 / ノード {len(seen_nodes)}件を比較')

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


def compare_tech_details(R: Resolver) -> None:
    """研究(スキルツリー)の、知識コスト・効果以外の項目: ゲート・繰り返し・分類・配置・報酬・バッジ・開放条件の有無"""
    T = pj('techs')
    lay, scene = T['layout'], R.get(24003)['v']
    for fld, path in (('tileWidth', '/TechTreeScene/GridTileWidth'), ('tileHeight', '/TechTreeScene/GridTileHeight')):
        if num(scene.get(path)) != lay[fld]:
            add('techLayout', 24003, 'layout', fld, lay[fld], scene.get(path))

    order = ids_in_order(R.get(21643)['v'], '/TechFeature/CategoryOrder', 'Category')
    membership: dict[int, int] = {}
    for c in T['techCategories']:
        v = R.get(c['guid'])['v']
        if (num(v.get('/TechCategory/Position/X')), num(v.get('/TechCategory/Position/Y'))) != (c['x'], c['y']):
            add('techCategories', c['guid'], c['guid'], 'position', (c['x'], c['y']), (v.get('/TechCategory/Position/X'), v.get('/TechCategory/Position/Y')))
        if order.index(c['guid']) != c['order']:
            add('techCategories', c['guid'], c['guid'], 'order', c['order'], order.index(c['guid']))
        for t in ids(v, '/TechCategory/Techs', 'Tech'):
            membership.setdefault(t, c['guid'])

    for t in T['techs']:
        g = t['guid']
        v = R.get(g)['v']
        name = t['name']
        # 各分野の最初のゲート(entry)は XML の分類リストに入っておらず、Planner が名前(Gate Economy Early など)から補う
        if membership.get(g) != t['category'] and not (t['entry'] and t['gate'] and g not in membership):
            add('techs', g, name, 'category', t['category'], membership.get(g))
        if (v.get('/Tech/IsGate') == '1') != bool(t['gate']):
            add('techs', g, name, 'gate', t['gate'], v.get('/Tech/IsGate'))
        if (v.get('/Tech/IsRepeatable') == '1') != bool(t['repeatable']):
            add('techs', g, name, 'repeatable', t['repeatable'], v.get('/Tech/IsRepeatable'))
        if abs(num(v.get('/Tech/RepeatableCostFactor'), 1.1) - t['repeatFactor']) > 1e-9:
            add('techs', g, name, 'repeatFactor', t['repeatFactor'], v.get('/Tech/RepeatableCostFactor'))
        if (v.get('/Tech/ShowConnectionToCategory') == '1') != bool(t['toCategory']):
            add('techs', g, name, 'toCategory', t['toCategory'], v.get('/Tech/ShowConnectionToCategory'))
        if (v.get('/Tech/Culture') or 'None') != (t['culture'] or 'None'):
            add('techs', g, name, 'culture', t['culture'], v.get('/Tech/Culture'))
        n_unlock = len(ids(v, '/Tech/Rewards/Unlocks', 'UnlockReward'))
        if n_unlock != len(t['unlocks']):
            add('techs', g, name, 'unlocks', len(t['unlocks']), n_unlock)
        n_reward = len(ids(v, '/Tech/Rewards/Resources', 'Resource')) + len(ids(v, '/Tech/Rewards/Items', 'ItemAsset'))
        if n_reward != len(t['rewards']):
            add('techs', g, name, 'rewards', len(t['rewards']), n_reward)
        n_badge = len([1 for k in v if re.fullmatch(r'/Tech/AdditionalBadges/Item\[\d+\]/Icon', k)])
        if n_badge != len(t['badges']):
            add('techs', g, name, 'badges', len(t['badges']), n_badge)
        if bool(v.get('/Tech/TechResearchableTrigger')) < bool(t['condition']):
            add('techs', g, name, 'condition', 'あり', '開放条件の資産が無い')


def ids_in_order(v: dict, base: str, key: str) -> list[int]:
    """Item の並びを書かれた順のまま GUID のリストにする"""
    found = []
    for k, val in v.items():
        m = re.fullmatch(re.escape(base) + r'/Item\[(\d+)\]/' + key, k)
        if m:
            found.append((int(m.group(1)), int(val)))
    return [g for _, g in sorted(found)]

def compare_factory_module(R: Resolver) -> None:
    """tools/assets_factories.py(assets.xml から作る生産建物データ)が、Planner の production.json と同じ値・同じ並びか"""
    from assets_factories import load_production

    prod = load_production(R)
    planner = pj('production')
    if prod['fuel'] != planner['fuel']:
        add('factoryModule', 0, 'fuel', 'fuel', planner['fuel'], prod['fuel'])
    if [f['guid'] for f in prod['factories']] != [f['guid'] for f in planner['factories']]:
        add('factoryModule', 0, 'factories', '並び・件数', len(planner['factories']), len(prod['factories']))
    mine = {f['guid']: f for f in prod['factories']}

    def rows(lst):
        return [(r['product'], float(r['amount'])) for r in lst]

    for p in planner['factories']:
        f = mine.get(p['guid'])
        if f is None:
            add('factoryModule', p['guid'], p['loca']['english'], 'XMLに無い', '', '')
            continue
        pairs = {
            'loca': (p['loca']['english'], f['loca']['english']), 'locaJa': (p['loca']['japanese'], f['loca']['japanese']),
            'category': (p['category']['english'], f['category']['english']), 'categoryJa': (p['category']['japanese'], f['category']['japanese']),
            'regions': (sorted(p['regions']), f['regions']), 'cycleTime': (p['cycleTime'], f['cycleTime']),
            'inputs': (rows(p['inputs']), rows(f['inputs'])), 'outputs': (rows(p['outputs']), rows(f['outputs'])),
            'maintenance': (rows(p['maintenance']), rows(f['maintenance'])), 'money': (p['money'], f['money']),
            'workforce': (p['workforce'], f['workforce']), 'workforceAmount': (p['workforceAmount'], f['workforceAmount']),
            'needsFuel': (p['needsFuel'], f['needsFuel']), 'template': (p['template'], f['template']),
            'constructionCosts': (rows(p['constructionCosts']), rows(f['constructionCosts'])),
            'inBuildMenu': (p['inBuildMenu'], f['inBuildMenu']),
        }
        for k, (a, b) in pairs.items():
            if a != b:
                add('factoryModule', p['guid'], p['loca']['english'], k, a, b)

def compare_building_module(R: Resolver) -> None:
    """tools/assets_buildings.py(assets.xml から作る建物データ)が、Planner の buildings.json と同じ値か。
    建物の選び方は再現できない(Planner に無い建物がXMLに約120件ある)ので、Planner にある建物だけを比べ、XMLだけの件数を数える"""
    from assets_buildings import EXCLUDED_TEMPLATES, load_buildings

    mine = load_buildings(R)
    planner = pj('buildings')

    def rows(lst):
        return [(r['product'], float(r['amount'])) for r in (lst or [])]

    for gs, p in planner.items():
        b = mine.get(gs)
        if b is None:
            add('buildingModule', int(gs), p['name'], 'XMLの建物に無い', p['template'], '')
            continue
        pl, bl = p.get('loca') or {}, b.get('loca') or {}
        pc, bc = p.get('category') or {}, b.get('category') or {}
        pairs = {
            'template': (p['template'], b['template']),
            'locaEn': (pl.get('english'), bl.get('english')), 'locaJa': (pl.get('japanese'), bl.get('japanese')),
            'categoryEn': (pc.get('english'), bc.get('english')),
            'regions': (p['regions'] or [], b['regions']),
            'constructionCosts': (rows(p['constructionCosts']), rows(b['constructionCosts'])),
            'maintenanceCosts': (rows(p['maintenanceCosts']), rows(b['maintenanceCosts'])),
            'functionalEffects': (sorted(p['functionalEffects'] or []), sorted(b['functionalEffects'])),
            'publicServiceEffect': (p['publicServiceEffect'], b['publicServiceEffect']),
            'populationLevel': (p['populationLevel'], b['populationLevel']),
        }
        for k, (x, y) in pairs.items():
            if x != y:
                add('buildingModule', int(gs), p['name'], k, x, y)
    extra = [g for g in mine if g not in planner]
    print(f'建物モジュール: Planner {len(planner)}件 / XML {len(mine)}件（XMLだけ {len(extra)}件。除外した種類: {sorted(EXCLUDED_TEMPLATES)}）')

def compare_economy_module(R: Resolver) -> None:
    """tools/assets_economy.py(商品・需要・人口層・住居)が、Planner の products / needs / population と同じ値・並びか"""
    from assets_economy import load_needs, load_population, load_products

    def check(cat: str, mine: list[dict], planner: list[dict], fields: dict) -> None:
        if [m['guid'] for m in mine] != [p['guid'] for p in planner]:
            add(cat, 0, cat, '並び・件数', len(planner), len(mine))
        by_guid = {m['guid']: m for m in mine}
        for p in planner:
            m = by_guid.get(p['guid'])
            if m is None:
                add(cat, p['guid'], p.get('name', ''), 'XMLに無い', '', '')
                continue
            for k, fn in fields.items():
                a, b = fn(p), fn(m)
                if a != b:
                    add(cat, p['guid'], p.get('name', ''), k, a, b)

    def loca(x, lang):
        return (x.get('loca') or {}).get(lang)

    base = {'name': lambda x: x.get('name'), 'locaEn': lambda x: loca(x, 'english'), 'locaJa': lambda x: loca(x, 'japanese'),
            'icon': lambda x: x.get('icon')}
    P = pj('products')
    check('products2', load_products(R)['products'], P['products'],
          {**base, 'regions': lambda x: x['regions'], 'productionRegions': lambda x: sorted(set(x['productionRegions'])),
           'category': lambda x: x['category'], 'basePrice': lambda x: x['basePrice'], 'storageLevel': lambda x: x['storageLevel']})
    N = pj('needs')
    check('needs2', load_needs(R)['needs'], N['needs'],
          {**base, 'product': lambda x: x['product'], 'category': lambda x: x['category'],
           'supplyWeight': lambda x: x['supplyWeight'], 'attributes': lambda x: x['attributes']})
    PP = pj('population')
    mine = load_population(R)
    check('populationLevels2', mine['populationLevels'], PP['populationLevels'],
          {**base, 'workforce': lambda x: x['workforce'], 'factor': lambda x: x['populationToWorkforceFactor'],
           'regions': lambda x: x['regions'], 'residence': lambda x: x['residence'], 'group': lambda x: x['group'], 'tier': lambda x: x['tier']})
    check('residences2', mine['residences'], PP['residences'],
          {'name': base['name'], 'locaEn': base['locaEn'], 'locaJa': base['locaJa'], 'populationLevel': lambda x: x['populationLevel'],
           'regions': lambda x: x['regions'], 'upgrades': lambda x: sorted(x['upgrades']),
           'needs': lambda x: [(n['need'], n['consumptionRate'], n['onlyThroughBuff']) for n in x['needs']]})
    check('populationGroups2', mine['populationGroups'], PP['populationGroups'],
          {'name': base['name'], 'region': lambda x: x['region'], 'populationLevels': lambda x: x['populationLevels']})
    check('workforce2', mine['workforce'], PP['workforce'], {**base, 'regions': lambda x: sorted(x['regions'])})

def compare_tech_module(R: Resolver) -> None:
    """tools/assets_techs.py(研究)が、Planner の techs.json と同じ値・並びか(effectLines などの文は対象外)"""
    from assets_techs import load_techs

    mine = load_techs(R)['techs']
    planner = pj('techs')['techs']
    if [t['guid'] for t in mine] != [t['guid'] for t in planner]:
        extra = [t['guid'] for t in mine if t['guid'] not in {p['guid'] for p in planner}]
        add('techModule', 0, 'techs', '並び・件数', len(planner), f'{len(mine)} (XMLだけ {extra})')
    by_guid = {t['guid']: t for t in mine}

    def loca(x, lang):
        return (x or {}).get(lang) if x else None

    for p in planner:
        m = by_guid.get(p['guid'])
        if m is None:
            add('techModule', p['guid'], p['name'], 'XMLに無い', '', '')
            continue
        pairs = {
            'name': (p['name'], m['name']),
            'locaEn': (loca(p['loca'], 'english'), loca(m['loca'], 'english')), 'locaJa': (loca(p['loca'], 'japanese'), loca(m['loca'], 'japanese')),
            'descEn': (loca(p['description'], 'english'), loca(m['description'], 'english')),
            'descJa': (loca(p['description'], 'japanese'), loca(m['description'], 'japanese')),
            'flavourEn': (loca(p['flavour'], 'english'), loca(m['flavour'], 'english')),
            'category': (p['category'], m['category']), 'x': (p['x'], m['x']), 'y': (p['y'], m['y']),
            'gate': (p['gate'], m['gate']), 'entry': (p['entry'], m['entry']), 'toCategory': (p['toCategory'], m['toCategory']),
            'knowledge': (p['knowledge'], m['knowledge']), 'repeatable': (p['repeatable'], m['repeatable']),
            'repeatFactor': (p['repeatFactor'], m['repeatFactor']), 'effects': (p['effects'], m['effects']),
            'unlocks': ([loca(u, 'english') for u in p['unlocks']], [loca(u, 'english') for u in m['unlocks']]),
            'culture': (p['culture'], m['culture']),
        }
        for k, (a, b) in pairs.items():
            if a != b:
                add('techModule', p['guid'], p['name'], k, a, b)

def compare_city_status_module(R: Resolver) -> None:
    """tools/assets_city_status.py(街の状況)が、Planner の city_status.json と同じ値・並びか"""
    from assets_city_status import load_city_status

    mine = load_city_status(R)
    for region, planner in pj('city_status').items():
        stages = mine.get(region, [])
        if [s['guid'] for s in stages] != [p['guid'] for p in planner]:
            add('cityStatusModule', 0, region, '並び・件数', len(planner), len(stages))
        by_guid = {s['guid']: s for s in stages}
        for p in planner:
            m = by_guid.get(p['guid'])
            if m is None:
                add('cityStatusModule', p['guid'], region, 'XMLに無い', '', '')
                continue
            pairs = {
                'locaEn': ((p.get('loca') or {}).get('english'), (m['loca'] or {}).get('english')),
                'locaJa': ((p.get('loca') or {}).get('japanese'), (m['loca'] or {}).get('japanese')),
                'icon': (p['icon'], m['icon']),
                'required': ([(r['populationGroup'], float(r['population'])) for r in p['required']],
                             [(r['populationGroup'], r['population']) for r in m['required']]),
                'attributes': ({k: {a: float(x) for a, x in d.items()} for k, d in p['attributes'].items()}, m['attributes']),
            }
            for k, (a, b) in pairs.items():
                if a != b:
                    add('cityStatusModule', p['guid'], region, k, a, b)

def compare_effects_module(R: Resolver) -> None:
    """tools/assets_effects.py(効果・バフ)が、Planner の effects.json / buffs.json と同じ値か。
    バフの calc は attributes / attributesPercent だけを比べる(他の集計は未対応)"""
    from assets_effects import load_buffs, load_effects

    mine_e, planner_e = load_effects(R), pj('effects')
    missing = [g for g in planner_e if g not in mine_e]
    print(f'効果モジュール: Planner {len(planner_e)}件 / XML {len(mine_e)}件（XMLだけ {len([g for g in mine_e if g not in planner_e])}件）')
    for g in missing:
        add('effectModule', int(g), planner_e[g]['name'], 'XMLに無い', '', '')
    for g, p in planner_e.items():
        m = mine_e.get(g)
        if m is None:
            continue
        pairs = {'scope': (p['scope'] or 'Local', m['scope']), 'buffs': (sorted(p['buffs'] or []), sorted(m['buffs'])),
                 'targetPools': (sorted(p['targetPools'] or []), sorted(m['targetPools'])),
                 'targets': (sorted(set(p['targets'] or [])), m['targets']), 'duration': (p['duration'] or 0.0, m['duration'])}
        for k, (a, b) in pairs.items():
            if a != b:
                add('effectModule', int(g), p['name'], k, a, b)

    mine_b, planner_b = load_buffs(R), pj('buffs')
    for g in planner_b:
        if g not in mine_b:
            add('buffModule', int(g), planner_b[g]['name'], 'XMLに無い', '', '')
    for g, p in planner_b.items():
        m = mine_b.get(g)
        if m is None:
            continue
        pc, mc = p.get('calc') or {}, m.get('calc') or {}
        for key in ('attributes', 'attributesPercent'):
            a, b = {k: float(x) for k, x in (pc.get(key) or {}).items()}, mc.get(key) or {}
            if a != b:
                add('buffModule', int(g), p['name'], key, a, b)

def compare_religion_module(R: Resolver) -> None:
    """tools/assets_religion.py(守護神と祭り)が、Planner の religion.json / festivals.json と同じ値・並びか(祭りの効果の説明行・報酬は対象外)"""
    from assets_religion import load_festivals, load_religion

    def loca(x, lang):
        return (x or {}).get(lang) if x else None

    mine = load_religion(R)['patrons']
    planner = pj('religion')['patrons']
    if [p['guid'] for p in mine] != [p['guid'] for p in planner]:
        add('religionModule', 0, 'patrons', '並び・件数', len(planner), len(mine))
    by_guid = {p['guid']: p for p in mine}
    for p in planner:
        m = by_guid.get(p['guid'])
        if m is None:
            add('religionModule', p['guid'], p['name'], 'XMLに無い', '', '')
            continue
        pairs = {
            'locaEn': (loca(p['loca'], 'english'), loca(m['loca'], 'english')), 'locaJa': (loca(p['loca'], 'japanese'), loca(m['loca'], 'japanese')),
            'descJa': (loca(p['description'], 'japanese'), loca(m['description'], 'japanese')),
            'order': (p['order'], m['order']), 'wonder': (p['wonder'], m['wonder']),
            'wonderNameJa': (loca(p['wonderName'], 'japanese'), loca(m['wonderName'], 'japanese')),
            'wonderDescJa': (loca(p['wonderDescription'], 'japanese'), loca(m['wonderDescription'], 'japanese')),
            'shrine': (p['shrine'], m['shrine']), 'romanization': (p['romanization'], m['romanization']),
            'romanizationPerDevotion': (p['romanizationPerDevotion'], m['romanizationPerDevotion']),
            'local': ([(e['effect'], loca(e['title'], 'japanese'), loca(e['description'], 'japanese'),
                        [(x['devotion'], x['buffScaling']) for x in e['milestones']]) for e in p['localEffects']],
                      [(e['effect'], loca(e['title'], 'japanese'), loca(e['description'], 'japanese'),
                        [(x['devotion'], x['buffScaling']) for x in e['milestones']]) for e in m['localEffects']]),
            'dominant': ([(e['effect'], loca(e['title'], 'japanese'), loca(e['description'], 'japanese')) for e in p['dominantEffects']],
                         [(e['effect'], loca(e['title'], 'japanese'), loca(e['description'], 'japanese')) for e in m['dominantEffects']]),
        }
        for k, (a, b) in pairs.items():
            if a != b:
                add('religionModule', p['guid'], p['name'], k, a, b)

    mine_list = load_festivals(R)['festivals']
    if [f['guid'] for f in mine_list] != [f['guid'] for f in pj('festivals')['festivals']]:
        add('festivalModule', 0, 'festivals', '並び・件数', len(pj('festivals')['festivals']), len(mine_list))
    mine_f = {f['guid']: f for f in mine_list}
    for p in pj('festivals')['festivals']:
        m = mine_f.get(p['guid'])
        if m is None:
            add('festivalModule', p['guid'], p['name'], 'XMLに無い', '', '')
            continue
        trig_keys = ('kind', 'deity', 'devotion', 'monument', 'attribute')
        pt = {k: p['trigger'].get(k) for k in trig_keys if k in p['trigger']}
        mt = {k: (m['trigger'] or {}).get(k) for k in trig_keys if k in p['trigger']}
        pairs = {
            'locaEn': (loca(p['loca'], 'english'), loca(m['loca'], 'english')), 'locaJa': (loca(p['loca'], 'japanese'), loca(m['loca'], 'japanese')),
            'descJa': (loca(p['description'], 'japanese'), loca(m['description'], 'japanese')),
            'seconds': (p['seconds'], m['seconds']), 'trigger': (pt, mt),
            'options': ([([(g['guid'], loca(g['loca'], 'japanese')) for g in o['goods']], o['amount'], o['scaling'], o['perPrice']) for o in p['options']],
                        [([(g['guid'], loca(g['loca'], 'japanese')) for g in o['goods']], o['amount'], o['scaling'], o['perPrice']) for o in m['options']]),
        }
        for k, (a, b) in pairs.items():
            if a != b:
                add('festivalModule', p['guid'], p['name'], k, a, b)

def compare_item_catalog_module(R: Resolver) -> None:
    """tools/assets_items.py(アイテムと資産の名前表)が、Planner の item_catalog.json と同じ値か。
    items は件数・並び・主な項目、assets は Planner の全キーについて 名前・種類・アイコン・総称の中身 を比べる
    （名前の末尾の空白は比べない）"""
    from assets_items import load_item_catalog

    cat = load_item_catalog(R)
    planner = pj('item_catalog')
    if [i['guid'] for i in cat['items']] != [i['guid'] for i in planner['items']]:
        add('itemCatalog', 0, 'items', '並び・件数', len(planner['items']), len(cat['items']))
    mine = {i['guid']: i for i in cat['items']}

    def loca(x, lang):
        return (x or {}).get(lang) if x else None

    for p in planner['items']:
        m = mine.get(p['guid'])
        if m is None:
            add('itemCatalog', p['guid'], p['name'], 'XMLに無い', '', '')
            continue
        e, me = p.get('effect') or {}, m['effect']
        pairs = {
            'locaEn': (loca(p['loca'], 'english'), loca(m['loca'], 'english')), 'locaJa': (loca(p['loca'], 'japanese'), loca(m['loca'], 'japanese')),
            'template': (p['template'], m['template']),
            'rarity': (p['rarity'], m['rarity']), 'niche': (p['niche'], m['niche']),
            'tradePrice': (float(p['tradePrice'] or 0), m['tradePrice']),
            'scope': (e.get('scope') or 'Local', me['scope']),
            'targets': (e.get('targets') or [], me['targets']),
        }
        for k, (a, b) in pairs.items():
            if a != b:
                add('itemCatalog', p['guid'], p['name'], k, a, b)

    for g, a in planner['assets'].items():
        m = cat['assets'].get(g)
        if m is None:
            add('itemAssets', int(g), a.get('name'), 'XMLに無い', '', '')
            continue
        pairs = {
            'name': ((a.get('name') or '').strip(), (m['name'] or '').strip()), 'template': (a.get('template'), m['template']),
            'locaEn': (loca(a.get('loca'), 'english'), loca(m['loca'], 'english')), 'locaJa': (loca(a.get('loca'), 'japanese'), loca(m['loca'], 'japanese')),
            'icon': (a.get('icon') or None, m['icon']),
        }
        if a.get('members') is not None and a.get('name') != 'AssetPool All Items':  # 全アイテムの総称は、カタログに無いアイテムを含むので比べない
            pairs['members'] = ([int(x) for x in a['members']], m.get('members', []))
        for k, (x, y) in pairs.items():
            if x != y:
                add('itemAssets', int(g), a.get('name'), k, x, y)


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
             compare_quests, compare_tech_details, compare_factory_module, compare_building_module,
             compare_economy_module, compare_tech_module, compare_city_status_module,
             compare_effects_module, compare_religion_module,
             compare_item_catalog_module, check_guid_coverage)
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
