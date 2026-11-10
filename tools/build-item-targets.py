#!/usr/bin/env python3
"""アイテムごとの「効果が掛かる建物の名前」を、ゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{item_catalog,buildings,production}.json
       packages/shared/public/data/items-full.json（アイテムの一覧。guid の突き合わせ先）
出力 : apps/wiki/docs/wiki/item-target-buildings.json  {アイテムguid: ['建物名', ...]}
       （items.data.ts と buildings.data.ts が読む。建物効果の「関連アイテム」と、アイテム一覧の対象の絞り込みに使う）

- アイテムの効果の対象(effect.targets)は、建物か「建物のまとまり(AssetPool。生産チェーン・市場・住居・塔など)」
  まとまりは、メンバーを再帰的にたどって建物にする（tools/build-item-regions.py と同じやり方）
- 建物名は、buildings.json の日本語名。氾濫原の農場は buildings.json に無いので production.json から取る
  どちらにも無いもの(水源など)は、カタログの名前を使う。例: 総称「貯水池」(42568)の中身は、実は「水源」とノリア
- アイギュプトの建物は、同じ名前の建物と区別できるよう「名前（アイギュプト）」の名前も足す
  （建物効果ページが、既存の建物と同じ名前のアイギュプトの建物に「（アイギュプト）」を付けるのに合わせる）
- 対象が商品で、建物にたどれないもの(生産チェーンの「商品」を指すもの)は、建物名にならない。そのまま出力しない
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
ITEMS = ROOT / 'packages' / 'shared' / 'public' / 'data' / 'items-full.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'item-target-buildings.json'
ZW = '​'
EGYPT_SUFFIX = '（アイギュプト）'


def ja(loca) -> str:
    text = loca.get('japanese', '') if isinstance(loca, dict) else (loca or '')
    return text.replace(ZW, '').strip()


def main() -> None:
    catalog = json.loads((SRC / 'item_catalog.json').read_text(encoding='utf-8'))
    buildings = json.loads((SRC / 'buildings.json').read_text(encoding='utf-8'))
    factories = json.loads((SRC / 'production.json').read_text(encoding='utf-8'))['factories']
    pools = catalog['assets']
    by_guid = {str(i['guid']): i for i in catalog['items']}

    # 建物のguid -> (名前, アイギュプトの建物か)
    info: dict[str, tuple[str, bool]] = {}
    for g, b in buildings.items():
        name = ja(b.get('loca'))
        if name:
            info[str(g)] = (name, 'Egyptian' in (b.get('regions') or []))
    for f in factories:
        name = ja(f.get('loca'))
        if name and str(f['guid']) not in info:
            info[str(f['guid'])] = (name, 'Egyptian' in (f.get('regions') or []))

    def buildings_of(guid: int | str, seen: tuple = ()) -> set[str]:
        g = str(guid)
        if g in info:
            return {g}
        pool = pools.get(g)
        if pool and pool.get('members') and g not in seen:
            out: set[str] = set()
            for m in pool['members']:
                out |= buildings_of(m, seen + (g,))
            return out
        # buildings.json・production.json に無い建物(水源など)は、カタログの名前を使う
        if pool and not pool.get('members') and ja(pool.get('loca')) and seen:
            info[g] = (ja(pool.get('loca')), False)
            return {g}
        return set()

    result: dict[str, list[str]] = {}
    unresolved: Counter = Counter()
    for row in json.loads(ITEMS.read_text(encoding='utf-8')):
        item = by_guid.get(str(row['guid']))
        if item is None:
            raise SystemExit(f"アイテムがカタログに無い: {row['guid']} {row.get('nameJa')}")
        names: set[str] = set()
        for t in (item.get('effect') or {}).get('targets') or []:
            found = buildings_of(t)
            if not found:
                unresolved[(str(t), ja((pools.get(str(t)) or {}).get('loca')))] += 1
            for g in found:
                name, egypt = info[g]
                names.add(name)
                if egypt:
                    names.add(name + EGYPT_SUFFIX)
        result[str(row['guid'])] = sorted(names)

    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    size = OUT.stat().st_size
    print(f'{len(result)}件を出力 -> {OUT} ({size // 1024}KB)')
    print(f'建物に展開できなかった対象: {len(unresolved)}種')
    for (g, n), c in unresolved.most_common(15):
        print(f'  {g} {n or "(名前なし)"}: {c}件')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as e:
        print(f'失敗: {e}', file=sys.stderr)
        sys.exit(1)
