"""assets.xml から、街の状況(都市ステータス)のデータを Planner の city_status.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の city_status.json を、ゲームの assets.xml に置き換える。

作る形: {地域名('Roman' / 'Celtic' / 'Egyptian'): [段階, ...]}。段階は
  guid / loca{english, japanese} / icon / required[{populationGroup, population}] / attributes{Roman, Mixed, Regional -> {属性名: 値}}

XML での探し方:
  - 地域ごとの段階の並びと必要人口は、経済の設定資産 EconomyFeature(GUID 1010000)の
    /EconomyFeature7/CityStatusFeature/Region/<地域>/CityStatusList の Item(CityStatus と RequiredPopulation)
  - 名前は各段階の資産の /CityStatus/CityStatusName、属性効果は /CityStatus/AttributeEffects<Roman|Mixed|Regional>/<属性>/Value
  - 必要人口(PopulationCount)が書かれていない段階は 0

使い方:
    from assets_city_status import load_city_status
    cs = load_city_status()['Roman']
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

ECONOMY_FEATURE = 1010000
ATTRIBUTE_SETS = ('Roman', 'Mixed', 'Regional')


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def load_city_status(resolver: Resolver | None = None) -> dict[str, list[dict]]:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    feature = R.get(ECONOMY_FEATURE)['v']
    out: dict[str, list[dict]] = {}
    for region in ('Roman', 'Celtic', 'Egyptian'):
        base = f'/EconomyFeature7/CityStatusFeature/Region/{region}/CityStatusList'
        indexes = sorted(_indexes(feature, base))
        stages = []
        for i in indexes:
            guid = int(feature[f'{base}/Item[{i}]/CityStatus'])
            required = []
            for j in range(0, 20):
                tier = feature.get(f'{base}/Item[{i}]/RequiredPopulation/Item[{j}]/PopulationTier')
                if tier is None:
                    break
                required.append({'populationGroup': int(tier),
                                 'population': _num(feature.get(f'{base}/Item[{i}]/RequiredPopulation/Item[{j}]/PopulationCount'))})
            v = R.get(guid)['v']
            name = v.get('/CityStatus/CityStatusName')
            attributes = {}
            for key in ATTRIBUTE_SETS:
                attributes[key] = {k.split('/')[3]: _num(x) for k, x in v.items()
                                   if k.startswith(f'/CityStatus/AttributeEffects{key}/') and k.endswith('/Value')}
            stages.append({
                'guid': guid,
                'loca': {'english': en.get(int(name), ''), 'japanese': ja.get(int(name), '')} if name else None,
                'icon': v.get('/Standard/IconFilename') or None,
                'required': required,
                'attributes': attributes,
            })
        out[region] = stages
    return out


def _indexes(v: dict, base: str) -> set[int]:
    found = set()
    for k in v:
        m = re.match(re.escape(base) + r'/Item\[(\d+)\]/CityStatus$', k)
        if m:
            found.add(int(m.group(1)))
    return found
