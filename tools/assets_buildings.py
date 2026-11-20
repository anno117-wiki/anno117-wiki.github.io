"""assets.xml から、建物のデータを Planner の buildings.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の buildings.json を、ゲームの assets.xml に置き換える。
      スクリプト側は読み先を load_buildings() に替えるだけで済むよう、使う項目は Planner と同じ名前・形にしてある。

作る項目(Planner の buildings と同じ名前):
  guid / name / template / loca{english, japanese} / category{english, japanese} / regions /
  constructionCosts / maintenanceCosts / functionalEffects / publicServiceEffect / populationLevel
作らない項目: width / height(占有マス。.ifo が必要で未対応)、radius(範囲の種類)など。
              これらを使うスクリプト(build-building-specs.py など)はまだ置き換えられない。

建物の選び方: assets.xml で建設できる(/Constructable/ConstructionMode を持つ)建物。
  Planner の buildings.json は約120件少なく(装飾・遺跡・クエスト用の灯台など)、選び方を XML から再現できないので、
  GUID で引く使い方(スクリプトが名前・地域を調べる)を前提にしている。
  地域は /Building/AssociatedRegions。書かれていなければ全地域(Planner は空にする建物がある)。

使い方:
    from assets_buildings import load_buildings
    buildings = load_buildings()      # {'2955': {...}, ...}  キーは文字列の GUID(Planner と同じ)
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

MONEY = 1010017
# Planner の buildings.json に無い種類。野営地を対象にするアイテムは「地域の指定なし」(build-item-regions.py の方針)なので、
# 建物として引けないようにする
EXCLUDED_TEMPLATES = {'UnitCamp'}
ALL_REGIONS = ['Roman', 'Celtic', 'Egyptian']  # 書かれていない建物の並び(Planner と同じ)


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _rows(v: dict, base: str, key: str, as_int: bool = False) -> list[dict]:
    """base/Item[i]/key と Amount を、書かれた順の [{'product', 'amount'}] にする(Amount が 0 の行は除く)"""
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    indexes = []
    for k in v:
        m = pattern.fullmatch(k)
        if m:
            indexes.append(int(m.group(1)))
    out = []
    for idx in sorted(indexes):
        amount = _num(v.get(f'{base}/Item[{idx}]/Amount'))
        if amount:
            out.append({'product': int(v[f'{base}/Item[{idx}]/{key}']), 'amount': int(amount) if as_int and amount.is_integer() else amount})
    return out


def _ids(v: dict, base: str, key: str) -> list[int]:
    """base/Item[i]/key の値を、書かれた順の GUID のリストにする"""
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    found = []
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            found.append((int(m.group(1)), int(val)))
    return [g for _, g in sorted(found)]


def _loca(en: dict[int, str], ja: dict[int, str], line_id) -> dict | None:
    if not line_id:
        return None
    return {'english': en.get(int(line_id), ''), 'japanese': ja.get(int(line_id), '')}


def load_buildings(resolver: Resolver | None = None) -> dict[str, dict]:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    building_templates = {n for n, p in R.templates.items() if p.find('Building') is not None}
    out: dict[str, dict] = {}
    for guid in R.raw:
        if R.template_of(guid) not in building_templates or R.template_of(guid) in EXCLUDED_TEMPLATES:
            continue
        r = R.get(guid)
        v = r['v']
        if '/Constructable/ConstructionMode' not in v:
            continue
        regions = v.get('/Building/AssociatedRegions')
        pse = v.get('/PublicService/PublicServiceEffect')
        pop = v.get('/AttributeProvider/Population')
        out[str(guid)] = {
            'guid': guid,
            'name': r['name'],
            'template': r['template'],
            'loca': _loca(en, ja, v.get('/Text/OasisId')),
            'category': _loca(en, ja, v.get('/Building/BuildingCategoryName')),
            'regions': regions.split(';') if regions else list(ALL_REGIONS),  # XML に書かれた順のまま
            'constructionCosts': _rows(v, '/Cost/Costs', 'Ingredient', as_int=True),
            'maintenanceCosts': _rows(v, '/Maintenance/Maintenances', 'Product'),
            'functionalEffects': _ids(v, '/Building/FunctionalEffects', 'FunctionalEffect'),
            'publicServiceEffect': int(pse) if pse else None,
            'populationLevel': int(pop) if pop else None,
        }
    return out
