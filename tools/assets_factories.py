"""assets.xml から、生産建物(工場)のデータを Planner の production.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の production.json を、ゲームの assets.xml に置き換える。
      スクリプト側は読み先を load_production() に替えるだけで済むよう、使う項目は Planner と同じ名前・形にしてある。

作る項目(Planner の factories と同じ名前):
  guid / name / template / loca{english, japanese} / category{english, japanese} / regions /
  cycleTime / inputs / outputs / maintenance / money / workforce / workforceAmount / needsFuel /
  constructionCosts / inBuildMenu
別に fuel{product, duration}(燃料1個が燃える秒数)を返す。

XML での探し方:
  - 工場 = FactoryBase に出力(FactoryOutputs)があり、建設できる(Constructable)資産
  - cycleTime は /FactoryBase/CycleTime(無ければ30秒)、燃料の要否は /FactoryBase/NeedsFuelInput
  - 維持費の金は商品 1010017、それ以外の維持費が労働力(商品)
  - 名前は /Text/OasisId、分類は /Building/BuildingCategoryName を texts_*.xml で引く
  - inBuildMenu は、氾濫原の農場(地形が Embankment で、通常の農場への置き換え先 /Building/EmbankmentReplacement を持つもの)を除いて True とみなす。
    建設メニューに無い建物の建設費は、Planner に合わせて空にする。
    ※ エジプト用の金鉱 152249 は Planner では False(建設費も空)だが、XML からは導けない
      (tools/compare-assets-vs-planner.py が差異として出す)

使い方:
    from assets_factories import load_production
    prod = load_production()      # {'factories': [...], 'fuel': {'product': 2085, 'duration': 120.0}}
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

MONEY = 1010017
ALL_REGIONS = ['Celtic', 'Egyptian', 'Roman']


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _rows(v: dict, base: str, key: str, as_int: bool = False) -> list[dict]:
    """base/Item[i]/key と Amount を、書かれた順の [{'product', 'amount'}] にする(Amount が 0 の行は除く)"""
    out = []
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    for idx in sorted(int(m.group(1)) for k in v if (m := pattern.fullmatch(k))):
        amount = _num(v.get(f'{base}/Item[{idx}]/Amount'))
        if amount:
            out.append({'product': int(v[f'{base}/Item[{idx}]/{key}']), 'amount': int(amount) if as_int and amount.is_integer() else amount})
    return out


def _name(texts: dict[int, str], line_id) -> str:
    return texts.get(int(line_id), '') if line_id else ''


def load_production(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    # FactoryBase を持つテンプレートの資産だけを解決する(全資産の解決は遅い)
    factory_templates = {n for n, p in R.templates.items() if p.find('FactoryBase') is not None}
    fuel = None
    for a in R.raw.values():
        node = a.find('Values/EconomyFeature7/Fuel/Products/Item/FuelProduct')
        if node is not None:
            fuel = {'product': int(node.text), 'duration': _num(a.findtext('Values/EconomyFeature7/Fuel/Products/Item/ProductionTime')) / 1000}
            break
    if fuel is None:
        raise ValueError('燃料の設定(EconomyFeature7/Fuel/Products)が assets.xml に見つからない')

    factories = []
    for guid in R.raw:
        if R.template_of(guid) not in factory_templates:
            continue
        r = R.get(guid)
        v = r['v']
        outputs = _rows(v, '/FactoryBase/FactoryOutputs', 'Product')
        if not outputs or '/Constructable/ConstructionMode' not in v:
            continue
        maintenance = _rows(v, '/Maintenance/Maintenances', 'Product')
        workforce = next((m for m in maintenance if m['product'] != MONEY), None)
        in_menu = not (v.get('/Building/TerrainType2') == 'Embankment' and v.get('/Building/EmbankmentReplacement'))
        regions = v.get('/Building/AssociatedRegions')
        oasis, cat = v.get('/Text/OasisId'), v.get('/Building/BuildingCategoryName')
        factories.append({
            'guid': guid,
            'name': r['name'],
            'template': r['template'],
            'loca': {'english': _name(en, oasis), 'japanese': _name(ja, oasis)},
            'category': {'english': _name(en, cat), 'japanese': _name(ja, cat)},
            'regions': sorted(regions.split(';')) if regions else list(ALL_REGIONS),
            'cycleTime': _num(v.get('/FactoryBase/CycleTime'), 30.0),
            'inputs': _rows(v, '/FactoryBase/FactoryInputs', 'Product'),
            'outputs': outputs,
            'maintenance': maintenance,
            'money': next((m['amount'] for m in maintenance if m['product'] == MONEY), 0.0),
            'workforce': workforce['product'] if workforce else None,
            'workforceAmount': workforce['amount'] if workforce else 0.0,
            'needsFuel': v.get('/FactoryBase/NeedsFuelInput') == '1',
            'constructionCosts': _rows(v, '/Cost/Costs', 'Ingredient', as_int=True) if in_menu else [],
            'inBuildMenu': in_menu,
        })
    # 並びは Planner と同じに揃える: templates.xml でのテンプレートの定義順にまとめ、同じテンプレート内は assets.xml の順
    rank = {name: i for i, name in enumerate(R.templates)}
    factories.sort(key=lambda f: rank[f['template']])
    return {'factories': factories, 'fuel': fuel}
