#!/usr/bin/env python3
"""アイギュプト専用の新商品の生産チェーンを、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{production,products,needs}.json
出力 : apps/wiki/docs/wiki/production-chains-aegyptus.json (production-chains.data.ts が読む)

- 対象は、アイギュプトで作る商品のうち番号(GUID)が151000以上の最終商品(需要品と建材)
- 同じ商品を作る建物が複数あるとき(石炭=炭焼き師/炭鉱、金鉱石=金選鉱/金鉱)は、両方を図に並べる。
  並べた建物の数は「その建物だけで全量を賄う場合」の数
- 建物数の比率の考え方は tools/build-chain-ratios.py と同じ(根=1軒、全て整数になる最小の倍率)
- 燃料が要る建物は、炭焼き師の数 = 建物数 x 炭焼き師のサイクル秒 / 燃料の燃焼秒
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
"""
import json
import re
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'production-chains-aegyptus.json'
ZW = '​'
MAX_SCALE = 60
CHARCOAL_BURNER_CYCLE = 30  # 炭焼き師(Charcoal Burner)のサイクル秒。Plannerの生産データの値
NEED_CATEGORY = {'Food': 'food', 'Fashion': 'fashion', 'Household': 'household'}


def ja(x: dict) -> str:
    return x['loca']['japanese'].replace(ZW, '')


def fmt_count(fr: Fraction):
    v = float(fr)
    return int(v) if v == int(v) else round(v, 2)


def main() -> None:
    prod = json.loads((SRC / 'production.json').read_text(encoding='utf-8'))
    products = {x['guid']: x for x in json.loads((SRC / 'products.json').read_text(encoding='utf-8'))['products']}
    needs = json.loads((SRC / 'needs.json').read_text(encoding='utf-8'))['needs']
    fuel_seconds = Fraction(int(prod['fuel']['duration']))

    # 商品 -> アイギュプトでその商品を作る建物(建物名で重複を除く。農場の水位違いなど)
    makers: dict[int, list[dict]] = {}
    for f in prod['factories']:
        if 'Egyptian' not in f['regions']:
            continue
        for o in f['outputs']:
            lst = makers.setdefault(o['product'], [])
            if all(m['loca']['english'] != f['loca']['english'] for m in lst):
                lst.append(f)

    # 最終商品: 需要品(食料・ファッション・家庭)と建材
    category: dict[int, str] = {}
    for n in needs:
        g = n.get('product')
        if g and g >= 151000 and n['category'] in NEED_CATEGORY and g in makers:
            category.setdefault(g, NEED_CATEGORY[n['category']])
    for g, p in products.items():
        if g >= 151000 and p['category'] == 'Construction Material' and g in makers:
            category[g] = 'construction'

    entries = []
    for goal, cat in sorted(category.items()):
        counts: dict[str, Fraction] = {}
        fuel_counts: dict[str, Fraction] = {}
        nodes: dict[str, dict] = {}
        edges: set[tuple[str, str]] = set()

        def visit(product: int, k: Fraction, parent_id: str | None, parent: dict | None, alt: bool) -> None:
            for f in makers[product]:
                multi = len(makers[product]) > 1
                nid = f"p{product}" + (f"_{f['guid']}" if multi else '')
                label = ja(products[product]) + (f"（{ja(f)}）" if multi else '')
                if parent is None:
                    kk = k
                else:
                    cycle_p = Fraction(str(parent['cycleTime']))
                    need = Fraction(str(next(i['amount'] for i in parent['inputs'] if i['product'] == product)))
                    make = next(o['amount'] for o in f['outputs'] if o['product'] == product)
                    kk = k * need / cycle_p / (Fraction(str(make)) / Fraction(str(f['cycleTime'])))
                counts[nid] = counts.get(nid, Fraction(0)) + kk
                if f['needsFuel']:
                    fuel_counts[nid] = fuel_counts.get(nid, Fraction(0)) + kk
                nodes.setdefault(nid, {'id': nid, 'label': label, 'time': f['cycleTime']})
                if parent_id:
                    edges.add((nid, parent_id))
                for inp in f['inputs']:
                    if inp['product'] not in makers:
                        sys.exit(f"{label}: 材料 {inp['product']} を作る建物が無い")
                    visit(inp['product'], kk, nid, f, multi)

        visit(goal, Fraction(1), None, None, False)
        scale = next((m for m in range(1, MAX_SCALE + 1) if all((v * m).denominator == 1 for v in counts.values())), None)
        warn = scale is None
        m = scale or 1
        burners = Fraction(CHARCOAL_BURNER_CYCLE) / fuel_seconds
        graph_nodes = []
        for nid, n in nodes.items():
            g = {'id': nid, 'label': n['label'], 'time': n['time'], 'count': fmt_count(counts[nid] * m)}
            if nid in fuel_counts:
                g['fuel'] = fmt_count(fuel_counts[nid] * m * burners)
            graph_nodes.append(g)
        root = makers[goal][0]
        entries.append({
            'id': f"aegyptus_{products[goal]['loca']['english'].lower().replace(' ', '_')}",
            'nameJa': ja(products[goal]),
            'nameEn': products[goal]['loca']['english'],
            'category': cat,
            'buildingJa': ja(root),
            'timeSeconds': root['cycleTime'],
            'needsFuel': root['needsFuel'],
            'inputs': [ja(products[i['product']]) for i in root['inputs']],
            'graph': {'nodes': graph_nodes, 'edges': [{'from': a, 'to': b} for a, b in sorted(edges)]} if len(graph_nodes) > 1 else None,
            'ratioOk': not warn,
        })
    OUT.write_text(json.dumps({'source': 'ゲーム内データ(アップデート3.0)', 'entries': entries}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f"{len(entries)}商品を出力 -> {OUT}")
    print('整数比にならない:', [e['nameJa'] for e in entries if not e['ratioOk']])


if __name__ == '__main__':
    main()
