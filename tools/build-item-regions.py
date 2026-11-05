#!/usr/bin/env python3
"""アイテムごとの「使える地域」を、ゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{item_catalog,buildings}.json
       packages/shared/public/data/items-full.json（アイテムの一覧。guid の突き合わせ先）
出力 : apps/wiki/docs/wiki/item-regions.json  {guid: ['latium', 'albion', 'aegyptus']}（items.data.ts が読む）

- アイテムの効果の対象(effect.targets)は、建物か「建物のまとまり(AssetPool。市場・住居・塔など)」
  まとまりは、メンバーを再帰的にたどって建物にする。建物の regions(Roman/Celtic/Egyptian)を集める
- Roman=latium、Celtic=albion、Egyptian=aegyptus
- 対象から地域が決まらないアイテム(船のアイテム75件、野営地を対象にする2件)は空の配列にする。画面では「地域の指定なし」
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
ITEMS = ROOT / 'packages' / 'shared' / 'public' / 'data' / 'items-full.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'item-regions.json'
REGION_KEY = {'Roman': 'latium', 'Celtic': 'albion', 'Egyptian': 'aegyptus'}
ORDER = ['latium', 'albion', 'aegyptus']
# 対象が商品で、建物から地域をたどれないもの。商品がその地域専用なので、手で決める（ユーザー確認 2026-11-05）
# 179649 セシェン、花摘み: 対象は青スイレン茶（アイギュプト専用の商品）
MANUAL = {'179649': ['aegyptus']}


def main() -> None:
    catalog = json.loads((SRC / 'item_catalog.json').read_text(encoding='utf-8'))
    buildings = json.loads((SRC / 'buildings.json').read_text(encoding='utf-8'))
    pools = catalog['assets']
    by_guid = {str(i['guid']): i for i in catalog['items']}

    def regions_of(guid: int | str, seen: tuple = ()) -> set[str]:
        g = str(guid)
        if g in buildings:
            return {REGION_KEY[r] for r in (buildings[g]['regions'] or []) if r in REGION_KEY}
        pool = pools.get(g)
        if pool and pool.get('members') and g not in seen:
            out: set[str] = set()
            for m in pool['members']:
                out |= regions_of(m, seen + (g,))
            return out
        return set()

    result: dict[str, list[str]] = {}
    for row in json.loads(ITEMS.read_text(encoding='utf-8')):
        item = by_guid.get(str(row['guid']))
        if item is None:
            raise SystemExit(f"アイテムがカタログに無い: {row['guid']} {row.get('nameJa')}")
        regs: set[str] = set()
        for t in (item.get('effect') or {}).get('targets') or []:
            regs |= regions_of(t)
        result[str(row['guid'])] = MANUAL.get(str(row['guid'])) or [k for k in ORDER if k in regs]

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    from collections import Counter
    print(f'{len(result)}件を出力 -> {OUT}')
    for k, v in Counter('/'.join(r) or '(なし)' for r in result.values()).most_common():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
