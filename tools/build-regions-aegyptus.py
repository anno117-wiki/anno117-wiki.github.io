#!/usr/bin/env python3
"""アイギュプト(DLC03)で作れる商品の一覧を、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{production,products,needs}.json
       packages/shared/public/productions/list.json と各チェーンJSON(既存の商品の対応づけに使う)
出力 : apps/wiki/docs/wiki/regions-aegyptus.json (regions.data.ts 他が読む)

- shared   : 既存の商品(計算機のデータ)のうち、アイギュプトでも作れるもののid。
             チェーンJSONの根の建物(GUID) -> 産出商品を、アイギュプトの建物が作るかで判定する
             (商品の productionRegions は小麦など既存の原材料で当てにならないので使わない)
             原材料・中間品は、チェーンJSONが無いため英語名(無ければ日本語名)でPlannerの商品に対応づける
- exclusive: アイギュプト専用の新商品(GUID 151000以上でアイギュプトだけで作る商品)。
             分類は 食料・ファッション・家庭(需要品)/建設/中間品/原材料
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aegyptus_icons import icon_name  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
PRODUCTIONS = ROOT / 'packages' / 'shared' / 'public' / 'productions'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'regions-aegyptus.json'
ZW = '​'
# 計算機のデータの英語名がPlannerと違う商品
ENGLISH_ALIAS = {'Charcoal': 'Coal'}
NEED_CATEGORY = {'Food': 'food', 'Fashion': 'fashion', 'Household': 'household'}
PRODUCT_CATEGORY = {
    'Construction Material': 'construction',
    'Intermediate Product': 'intermediate',
    'Agricultural Good': 'resource',
    'Raw Material': 'resource',
}


def main() -> None:
    prod = json.loads((SRC / 'production.json').read_text(encoding='utf-8'))
    products = {x['guid']: x for x in json.loads((SRC / 'products.json').read_text(encoding='utf-8'))['products']}
    needs = json.loads((SRC / 'needs.json').read_text(encoding='utf-8'))['needs']
    factories = {str(f['guid']): f for f in prod['factories']}
    makes = {o['product'] for f in prod['factories'] if 'Egyptian' in f['regions'] for o in f['outputs']}

    by_english: dict[str, list[dict]] = {}
    by_japanese: dict[str, list[dict]] = {}
    for p in products.values():
        by_english.setdefault(p['loca']['english'].lower(), []).append(p)
        by_japanese.setdefault(p['loca']['japanese'].replace(ZW, ''), []).append(p)
    ja_goods = json.loads((ROOT / 'packages' / 'shared' / 'public' / 'i18n' / 'locales' / 'ja.json').read_text(encoding='utf-8'))['goods']

    shared = []
    for g in json.loads((PRODUCTIONS / 'list.json').read_text(encoding='utf-8'))['goods']:
        if not g.get('files'):
            # 原材料・中間品(チェーンJSONが無い)は、英語名(無ければ日本語名)でPlannerの商品に対応づける
            cands = by_english.get(ENGLISH_ALIAS.get(g['displayName'], g['displayName']).lower()) or by_japanese.get(ja_goods.get(g['id'], ''))
            if not cands:
                print(f"対応する商品が見つからず除外: {g['id']} ({g['displayName']})")
                continue
            if any(p['guid'] in makes for p in cands) and 'Egyptian' not in g['regions']:
                shared.append(g['id'])
            continue
        root = json.loads((PRODUCTIONS / f"{next(iter(g['files'].values()))}.json").read_text(encoding='utf-8'))
        f = factories.get(str(root['guid']))
        if f is None:
            sys.exit(f"{g['id']}: 根の建物 {root['guid']} がPlannerに無い")
        if f['outputs'][0]['product'] in makes and 'Egyptian' not in g['regions']:
            shared.append(g['id'])

    need_cat = {}
    for n in needs:
        if n.get('product') and n['category'] in NEED_CATEGORY:
            need_cat.setdefault(n['product'], NEED_CATEGORY[n['category']])

    exclusive = []
    for guid, p in sorted(products.items()):
        if guid < 151000 or guid not in makes or p['productionRegions'] != ['Egyptian']:
            continue
        cat = need_cat.get(guid) or PRODUCT_CATEGORY.get(p['category'])
        if cat is None:
            sys.exit(f"分類が決められない: {guid} {p['loca']['english']} ({p['category']})")
        exclusive.append({
            'id': f"aegyptus_{p['loca']['english'].lower().replace(' ', '_')}",
            'nameJa': p['loca']['japanese'].replace(ZW, ''),
            'nameEn': p['loca']['english'],
            'category': cat,
            'icon': icon_name(f"aegyptus_{p['loca']['english'].lower().replace(' ', '_')}"),
        })

    OUT.write_text(json.dumps({'source': 'ゲーム内データ(アップデート3.0)', 'shared': shared, 'exclusive': exclusive},
                              ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'共通 {len(shared)}件、アイギュプト専用 {len(exclusive)}件を出力 -> {OUT}')


if __name__ == '__main__':
    main()
