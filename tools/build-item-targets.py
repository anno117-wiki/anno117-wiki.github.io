#!/usr/bin/env python3
"""アイテムごとの「効果が掛かる建物の名前」を、ゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{item_catalog,buildings,production}.json
       packages/shared/public/data/items-full.json（アイテムの一覧。guid の突き合わせ先）
出力 : apps/wiki/docs/wiki/item-target-buildings.json  {アイテムguid: ['建物名', ...]}
       （items.data.ts と buildings.data.ts が読む。建物効果の「関連アイテム」と、アイテム一覧の対象の絞り込みに使う）
       apps/wiki/docs/wiki/item-target-pools.json  [{'name': '総称', 'buildings': ['建物名', ...]}, ...]
       （items.data.ts が読む。アイテム一覧の「対象の総称と内訳」の表。ユーザー指示 2026-11-10 の範囲:
         アイテムの対象に出てくる総称のうち、建物が2つ以上のもの。生産チェーン・住居・生産施設・船は除く）

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
OUT_POOLS = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'item-target-pools.json'
# 内訳の表に載せない総称。生産チェーンは名前から中身が分かり、住居(全住居層)と生産施設(ほぼ全ての生産施設142件)は名前どおりなので省く
# 生産施設はユーザー決定 2026-11-10(対象にするアイテムは1件だけで、表が長くなるため)
POOL_EXCLUDE_SUFFIX = 'の生産チェーン'
POOL_EXCLUDE_NAMES = {'住居', '生産施設'}
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
            catalog_only.add(g)
            return {g}
        return set()

    def ordered_members(guid: int | str, seen: tuple = ()) -> list[str]:
        """総称の中身の建物guidを、データの並び順で返す(内訳の表用)"""
        g = str(guid)
        pool = pools.get(g)
        if g not in info and pool and pool.get('members') and g not in seen:
            out: list[str] = []
            for m in pool['members']:
                out += ordered_members(m, seen + (g,))
            return out
        return [g] if buildings_of(g, seen or ('-',)) else []

    catalog_only: set[str] = set()  # 建物データに無く、カタログの名前で補ったもの(水源・船など)
    result: dict[str, list[str]] = {}
    unresolved: Counter = Counter()
    pool_guids: dict[str, list[str]] = {}  # 総称の名前 -> その名前の総称のguid(同じ名前で複数ある)
    for row in json.loads(ITEMS.read_text(encoding='utf-8')):
        item = by_guid.get(str(row['guid']))
        if item is None:
            raise SystemExit(f"アイテムがカタログに無い: {row['guid']} {row.get('nameJa')}")
        names: set[str] = set()
        for t in (item.get('effect') or {}).get('targets') or []:
            pool = pools.get(str(t))
            if str(t) not in info and pool and pool.get('members'):
                guids = pool_guids.setdefault(ja(pool.get('loca')), [])
                if str(t) not in guids:
                    guids.append(str(t))
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

    # 対象の総称と内訳
    table = []
    for pool_name, guids in pool_guids.items():
        if not pool_name or pool_name.endswith(POOL_EXCLUDE_SUFFIX) or pool_name in POOL_EXCLUDE_NAMES:
            continue
        members = [m for g in guids for m in ordered_members(g)]
        if members and all(m in catalog_only for m in members):
            continue  # 船など、建物でないものだけの総称
        names: list[str] = []
        for m in members:
            name = info[m][0]
            if name and name not in names:
                names.append(name)
        if len(names) >= 2:
            table.append({'name': pool_name, 'buildings': names})
    OUT_POOLS.write_text(json.dumps(table, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'総称の内訳 {len(table)}件 -> {OUT_POOLS}')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as e:
        print(f'失敗: {e}', file=sys.stderr)
        sys.exit(1)
