"""assets.xml から、信仰(守護神)と祭りのデータを Planner の religion.json / festivals.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner のこれらのファイルを、ゲームの assets.xml に置き換える。

作る項目(Planner と同じ名前):
  load_religion() -> {'patrons': [...]}
      守護神: guid / name / loca / description / order / wonder / wonderName / wonderDescription /
              localEffects[{effect, title, description, milestones[{devotion, buffScaling}]}] /
              dominantEffects[{effect, title, description}] / shrine / romanization / romanizationPerDevotion
  load_festivals() -> {'festivals': [...]}
      祭り: guid / name / loca / description / seconds /
            trigger{kind: deity|attribute|war|monument, ...} /
            options[{goods[{guid, loca}], amount, scaling, perPrice}]
作らない項目: 祭りの効果の説明行(effects の lines)・報酬・選択肢の文言(text / outcome)、信仰の balancing など

XML での探し方:
  - 守護神の並びは ReligionBalancing(GUID 30743)の Patrons。名前 /Patron/PatronName、説明 /Patron/PatronDescription、
    不思議の説明 /Patron/WonderDescription、不思議の名前は不思議の建物の /Text/OasisId
    局所効果・支配効果の題名と説明は /Patron/LocalEffects|DominantEffects/Item[i]/Title|Description
  - 祭りの開始条件は FestivalFeature(GUID 98210): 神型 DeityFestivals(信仰値は共通の DevotionThreshold)、
    属性型 Region/<地域>/Attributes/<属性>/Festivals、戦争 SuccessfulWarFestival、記念碑 MonumentEventStartedFestival
  - 祭りの長さ /Festival/FestivalDuration、選択肢の費用は決定の資産(/Festival/FestivalDecision)の DecisionOptions

使い方:
    from assets_religion import load_festivals, load_religion
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

RELIGION_BALANCING = 30743
FESTIVAL_FEATURE = 98210


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _indexed(v: dict, base: str) -> list[dict[str, str]]:
    """base/Item[i]/残りのパス の値を、i 順の {残りのパス: 値} のリストにする"""
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\](/.*)?')
    rows: dict[int, dict[str, str]] = {}
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            rows.setdefault(int(m.group(1)), {})[m.group(2) or ''] = val
    return [rows[i] for i in sorted(rows)]


def _loca(en: dict, ja: dict, line_id) -> dict | None:
    if not line_id:
        return None
    return {'english': en.get(int(line_id), ''), 'japanese': ja.get(int(line_id), '')}


def load_religion(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    bal = R.get(RELIGION_BALANCING)['v']
    order = [int(x['/PatronAsset']) for x in _indexed(bal, '/ReligionBalancing/Patrons') if '/PatronAsset' in x]
    patrons = []
    for i, guid in enumerate(order):
        r = R.get(guid)
        v = r['v']
        wonder = v.get('/Patron/Wonder')
        wonder_oasis = R.get(int(wonder))['v'].get('/Text/OasisId') if wonder else None
        local = []
        for item in _indexed(v, '/Patron/LocalEffects'):
            ms = {}
            for k, val in item.items():
                m = re.fullmatch(r'/Milestones/Item\[(\d+)\]/(\w+)', k)
                if m:
                    ms.setdefault(int(m.group(1)), {})[m.group(2)] = val
            local.append({'effect': int(item['/GUID']), 'title': _loca(en, ja, item.get('/Title')),
                          'description': _loca(en, ja, item.get('/Description')),
                          'milestones': [{'devotion': _num(ms[j].get('Devotion')), 'buffScaling': _num(ms[j].get('BuffScaling'))}
                                         for j in sorted(ms)]})
        dominant = [{'effect': int(item['/GUID']), 'title': _loca(en, ja, item.get('/Title')),
                     'description': _loca(en, ja, item.get('/Description'))}
                    for item in _indexed(v, '/Patron/DominantEffects')]
        shrine = v.get('/Patron/Shrine')
        patrons.append({
            'guid': guid,
            'name': r['name'],
            'loca': _loca(en, ja, v.get('/Patron/PatronName')),
            'description': _loca(en, ja, v.get('/Patron/PatronDescription')),
            'order': i,
            'localEffects': local,
            'dominantEffects': dominant,
            'wonder': int(wonder) if wonder else None,
            'wonderName': _loca(en, ja, wonder_oasis),
            'wonderDescription': _loca(en, ja, v.get('/Patron/WonderDescription')),
            'shrine': int(shrine) if shrine else None,
            'romanization': v.get('/Patron/RomanizationType') or 'None',
            'romanizationPerDevotion': _num(v.get('/Patron/RomanizationValuePerDevotion')),
        })
    return {'patrons': patrons}


def load_festivals(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    cfg = R.get(FESTIVAL_FEATURE)['v']

    # 祭り -> 開始条件
    triggers: dict[int, dict] = {}
    threshold = _num(cfg.get('/FestivalFeature/DevotionThreshold'))
    for item in _indexed(cfg, '/FestivalFeature/DeityFestivals'):
        triggers[int(item['/Festival'])] = {'kind': 'deity', 'deity': int(item['/Deity']), 'devotion': threshold}
    if cfg.get('/FestivalFeature/SuccessfulWarFestival'):
        triggers[int(cfg['/FestivalFeature/SuccessfulWarFestival'])] = {'kind': 'war'}
    for k, val in cfg.items():
        m = re.fullmatch(r'/FestivalFeature/MonumentEventStartedFestival/(\w+)/Festival', k)
        if m:
            triggers[int(val)] = {'kind': 'monument', 'monument': m.group(1)}
    attr: dict[int, dict] = {}
    for k, val in cfg.items():
        m = re.fullmatch(r'/FestivalFeature/Region/(\w+)/Attributes/(\w+)/Festivals/Item\[(\d+)\]/Festival', k)
        if m:
            region, attribute, _ = m.groups()
            t = attr.setdefault(int(val), {'kind': 'attribute', 'attribute': attribute, 'thresholds': {}})
            t['thresholds'].setdefault(region, []).append(_num(cfg.get(k[: -len('/Festival')] + '/FestivalTriggerAttributeValue')))
    triggers.update(attr)

    festivals = []
    for guid in R.raw:
        if R.template_of(guid) != 'Festival':
            continue
        if guid not in triggers:
            continue  # 開始条件が無い(どこからも始まらない)祭りは使われていない
        r = R.get(guid)
        v = r['v']
        decision = v.get('/Festival/FestivalDecision')
        options = []
        if decision:
            for item in _indexed(R.get(int(decision))['v'], '/Decision/DecisionOptions'):
                if '/OptionText' not in item:
                    continue  # 選択肢の文言が無い行は選択肢ではない
                goods = []
                for k, val in sorted(item.items()):
                    m = re.fullmatch(r'/CostData/Products/Item\[(\d+)\]/GUID', k)
                    if m:
                        goods.append((int(m.group(1)), int(val)))
                goods = [g for _, g in sorted(goods)]
                options.append({
                    'goods': [{'guid': g, 'loca': _loca(en, ja, R.get(g)['v'].get('/Text/OasisId'))} for g in goods],
                    'amount': _num(item.get('/CostData/Amount/Value')),
                    'scaling': _num(item.get('/CostData/AdditionalAmountScaling')),
                    'perPrice': item.get('/CostData/DivideAmountByProductPrice') == '1',
                })
        festivals.append({
            'guid': guid,
            'name': r['name'],
            'loca': _loca(en, ja, v.get('/Text/OasisId')),
            'description': _loca(en, ja, v.get('/Standard/InfoDescription')),
            'seconds': _num(v.get('/Festival/FestivalDuration')) / 1000,
            'trigger': triggers.get(guid),
            'options': options,
        })
    # 並びは Planner と同じ: 開始条件の種類の順（属性・神・戦争・記念碑）にまとめ、同じ種類の中は assets.xml の順
    kind_order = {'attribute': 0, 'deity': 1, 'war': 2, 'monument': 3}
    festivals.sort(key=lambda f: kind_order.get(f['trigger']['kind'], 9))
    return {'festivals': festivals}
