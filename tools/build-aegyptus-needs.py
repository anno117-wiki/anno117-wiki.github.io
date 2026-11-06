#!/usr/bin/env python3
"""アイギュプトの住民層ごとの需要を、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{population,needs,products}.json
出力 : apps/wiki/docs/wiki/population-aegyptus.json
         tiers      : 層ごとの全需要と、1つ下の層から増える需要(住民層ページ用)
         needsIndex : 商品ごとの需要住民層(商品需要逆引き用。needs-index.json と同じ形)

- 層の順序は residences の upgrades(昇格先)から作る(麦打ち人 -> 陶工 -> 奉唱巫女、麦打ち人 -> 書記 -> ギムナシアリコス)
- 上位の層は下位の層の需要も消費する(住民層ページの「上位互換消費」)。逆引きの tiers にも上位層を含める
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'population-aegyptus.json'
ZW = '​'
CATEGORY_JA = {'Food': '食料', 'Fashion': 'ファッション', 'Household': '家庭', 'Public': '公共サービス', 'Culture': '文化', 'Wonders': '驚異'}
CATEGORY_ORDER = list(CATEGORY_JA)
# 逆引きのカテゴリ名は既存(needs-index.json)に合わせる
INDEX_CATEGORY = {'Wonders': 'Wonder'}
TIER_KEY = {149681: 'thresher', 150510: 'potter', 150511: 'priestess', 150534: 'scribe', 150542: 'gymnasiarch'}
# 3.0で、ラティウムとアルビオンの住居の需要に、アイギュプトの商品が加わった
# 実機で確認したもの(ユーザー 2026-11-06): ラティウムのエクィテスのナツメヤシ(一覧もユーザー確認)、アルビオンのアルダーの青スイレン茶・魔除けのお守り。残りはゲーム内データのみ
# 住居のGUID -> (層, 逆引きの地域)。逆引きの demands の地域名は 'Roman Celtic'(空白あり)、tiers の地域名は 'RomanCeltic'
EXTRA_RESIDENCES = {
    3142: ('equites', 'Roman'), 3145: ('patrician', 'Roman'),
    6471: ('plebeian', 'Celtic'), 6472: ('equites', 'Celtic'),
    6475: ('plebeian', 'RomanCeltic'), 6514: ('equites', 'RomanCeltic'),
}
DEMAND_REGION = {'Roman': 'Roman', 'Celtic': 'Celtic', 'RomanCeltic': 'Roman Celtic'}
# ラティウム: ナツメヤシ・コール・書記道具一式・カフク・ポッパエアのミルク・象牙の小箱・シストラム
# アルビオン(ケルト): コール・魔除けのお守り・青スイレン茶 / (ローマ文化): 書記道具一式・香油・希少な肉の盛り合わせ
EXTRA_NEEDS = {157040, 157041, 157042, 157043, 157044, 157045, 157046, 157047, 157048, 157049, 157050, 157052, 157053}


def ja(x: dict) -> str:
    return x['loca']['japanese'].replace(ZW, '')


def main() -> None:
    pop = json.loads((SRC / 'population.json').read_text(encoding='utf-8'))
    needs = {n['guid']: n for n in json.loads((SRC / 'needs.json').read_text(encoding='utf-8'))['needs']}
    products = {p['guid']: p for p in json.loads((SRC / 'products.json').read_text(encoding='utf-8'))['products']}
    levels = {x['guid']: x for x in pop['populationLevels']}
    residences = {r['guid']: r for r in pop['residences'] if 'Egyptian' in r['regions']}
    by_level = {r['populationLevel']: r for r in residences.values()}
    if set(by_level) != set(TIER_KEY):
        sys.exit(f'想定外の層: {sorted(by_level)}')

    def need_name(n: dict) -> str:
        return ja(products[n['product']]) if n.get('product') in products else ja(n)

    def need_set(r: dict) -> list[int]:
        return [q['need'] for q in r['needs']]

    # 昇格の元(1つ下の層)を求める
    parent = {}
    for r in residences.values():
        for up in r['upgrades']:
            parent[residences[up]['populationLevel']] = r['populationLevel']

    tiers = []
    for lv_guid, r in sorted(by_level.items(), key=lambda kv: levels[kv[0]]['tier']):
        below = set(need_set(by_level[parent[lv_guid]])) if lv_guid in parent else set()
        def group(ids):
            out: dict[str, list[str]] = {}
            for i in ids:
                n = needs[i]
                out.setdefault(n['category'], []).append(need_name(n))
            return [{'category': CATEGORY_JA[c], 'names': out[c]} for c in CATEGORY_ORDER if c in out]
        tiers.append({
            'key': TIER_KEY[lv_guid],
            'nameJa': ja(levels[lv_guid]),
            'parent': TIER_KEY[parent[lv_guid]] if lv_guid in parent else None,
            'all': group(need_set(r)),
            'added': group([i for i in need_set(r) if i not in below]),
        })

    # 商品ごとの需要住民層(その商品を消費する層)
    index: dict[int, dict] = {}
    for lv_guid, r in by_level.items():
        for i in need_set(r):
            n = needs[i]
            key = n.get('product') or n['guid']
            e = index.setdefault(key, {
                'productGuid': str(key),
                'productNameEn': (products[key]['loca']['english'] if key in products else n['loca']['english']),
                'productNameJa': need_name(n),
                'demands': [{'region': 'Egyptian', 'category': INDEX_CATEGORY.get(n['category'], n['category'])}],
                'tiers': [],
            })
            e['tiers'].append({'tier': TIER_KEY[lv_guid], 'region': 'Egyptian'})
    order = list(TIER_KEY.values())
    needs_index = sorted(index.values(), key=lambda e: e['productNameJa'])
    for e in needs_index:
        e['tiers'].sort(key=lambda t: order.index(t['tier']))
    # ラティウム・アルビオンの追加需要を、同じ商品の行に足す
    by_product = {e['productGuid']: e for e in needs_index}
    extra_residences = {r['guid']: r for r in pop['residences'] if r['guid'] in EXTRA_RESIDENCES}
    if set(extra_residences) != set(EXTRA_RESIDENCES):
        sys.exit(f'住居が見つからない: {sorted(set(EXTRA_RESIDENCES) - set(extra_residences))}')
    found_extra = set()
    for rg, (tier, region) in EXTRA_RESIDENCES.items():
        for q in extra_residences[rg]['needs']:
            if q['need'] not in EXTRA_NEEDS:
                continue
            n = needs[q['need']]
            key = str(n.get('product') or n['guid'])
            e = by_product.get(key)
            if e is None:
                sys.exit(f'アイギュプトの逆引きに無い商品: {need_name(n)}')
            cat = INDEX_CATEGORY.get(n['category'], n['category'])
            if not any(d['region'] == DEMAND_REGION[region] for d in e['demands']):
                e['demands'].append({'region': DEMAND_REGION[region], 'category': cat})
            e['tiers'].append({'tier': tier, 'region': region})
            found_extra.add(q['need'])
    if found_extra != EXTRA_NEEDS:
        sys.exit(f'追加需要が足りない: {sorted(EXTRA_NEEDS - found_extra)}')
    OUT.write_text(json.dumps({'source': 'ゲーム内データ(アップデート3.0)', 'tiers': tiers, 'needsIndex': needs_index},
                              ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(tiers)}層、逆引き {len(needs_index)}商品を出力 -> {OUT}')


if __name__ == '__main__':
    main()
