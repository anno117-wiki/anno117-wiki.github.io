#!/usr/bin/env python3
"""計算機用のアイギュプト(DLC03)生産チェーンを、Anno 117 Planner のゲーム3.0データから生成する。

入力 : _local/anno-official-data/v3.0-planner/{production,products,population}.json
       apps/wiki/docs/wiki/regions-aegyptus.json (商品id・日本語名。tools/build-regions-aegyptus.py が生成)
出力 : packages/shared/public/productions/aegyptus_*.json (チェーンJSON、各ファイルは入れ子を全て展開済み)
       packages/shared/public/productions/list.json (アイギュプト分を追加。既存の行は変えない)
       packages/shared/public/i18n/locales/{ja,en}.json (商品名・労働力名)
       packages/shared/public/icons/<id>.png (商品128px・労働力60px。元はゲームのアイコン、(c) Ubisoft)

- 対象は、wiki の生産チェーン一覧(production-chains-aegyptus.json)と同じ18商品
- 同じ商品を作る建物が複数あるとき(石炭=炭焼き師/炭鉱、金鉱石=金選鉱/金鉱)は、建物ごとに別チェーンへ分割する。
  農場の「氾濫原」版(建設メニューに無い重複)は、建設メニューにある方を使う
- 計算機は入出力の個数を1個前提で計算する。Planner の全建物で個数が1であることを実行時に確認する
- 何度実行しても同じ結果になる(アイギュプトの行は毎回作り直す)

実行: python tools/build-calc-aegyptus.py
依存: Pillow
"""
import json
import sys
from itertools import product as cartesian
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
ARCHIVE = ROOT / '_local' / 'anno-official-data' / 'icons-archive' / 'layout-tool-data-ui' / 'fhd' / 'dlc03' / 'icon_content'
SHARED = ROOT / 'packages' / 'shared' / 'public'
PRODUCTIONS = SHARED / 'productions'
ICONS = SHARED / 'icons'
LOCALES = SHARED / 'i18n' / 'locales'
WIKI = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki'
ZW = '​'
REGION = 'Egyptian'
MONEY_GUID = 1010017  # デナリウス(建設費のお金)
FILE_PREFIX = 'aegyptus_'
ENGLISH_ALIAS = {'Coal': 'Charcoal'}  # Planner の英語名 -> 計算機の displayName
# 計算機のカテゴリは food/fashion/culture/construction の4つ。wiki の「家庭」は計算機では「文化」
CALC_CATEGORY = {'food': 'food', 'fashion': 'fashion', 'household': 'culture', 'construction': 'construction'}
# 労働力のguid -> 計算機の維持費キー
WORKFORCE_KEY = {
    2181: 'libertus', 2184: 'plebeian', 2185: 'equites', 2186: 'patrician',
    149685: 'thresher', 150543: 'potter', 150544: 'chanter', 150545: 'scribe', 150546: 'gymnasiarch',
}
WORKFORCE_ICON = {  # キー -> アーカイブ内のファイル(workforce/)
    'thresher': 'icon_2d_thresher_workforce.png', 'potter': 'icon_2d_potter_workforce.png',
    'chanter': 'icon_2d_priestress_workforce.png', 'scribe': 'icon_2d_scribe_workforce.png',
    'gymnasiarch': 'icon_2d_gymnasiarch_workforce.png',
}
WORKFORCE_NAME = {  # キー -> (日本語, 英語)。日本語は住民層名(wiki/population.md と同じ)
    'thresher': ('麦打ち人', 'Thresher'), 'potter': ('陶工', 'Potter'), 'chanter': ('奉唱巫女', 'Chanter'),
    'scribe': ('書記', 'Scribe'), 'gymnasiarch': ('ギムナシアリコス', 'Gymnasiarch'),
}
GOODS_ICON_SIZE = 128
WORKFORCE_ICON_SIZE = 60

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aegyptus_icons import icon_name  # noqa: E402


def ja(x: dict) -> str:
    return x['loca']['japanese'].replace(ZW, '')


def slug(english: str) -> str:
    return english.lower().replace(' ', '_')


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data, indent: int, trailing_newline: bool = False) -> None:
    text = json.dumps(data, ensure_ascii=False, indent=indent) + ('\n' if trailing_newline else '')
    path.write_text(text, encoding='utf-8', newline='\n')


class Planner:
    """Planner のデータと、商品guid -> 計算機の商品id の対応。"""

    def __init__(self) -> None:
        prod = read_json(SRC / 'production.json')
        self.fuel_seconds = prod['fuel']['duration']
        self.products = {x['guid']: x for x in read_json(SRC / 'products.json')['products']}
        self.makers: dict[int, list[dict]] = {}
        self.variant_names: dict[str, tuple[str, str]] = {}  # name_key -> (日本語, 英語)
        for f in prod['factories']:
            if REGION not in f['regions']:
                continue
            for o in f['outputs']:
                lst = self.makers.setdefault(o['product'], [])
                # 同名の建物は、建設メニューにある方だけ使う(農場の氾濫原版を除く)
                same = next((m for m in lst if m['loca']['english'] == f['loca']['english']), None)
                if same is None:
                    lst.append(f)
                elif f['inBuildMenu'] and not same['inBuildMenu']:
                    lst[lst.index(same)] = f
        for f in prod['factories']:
            if any(o['amount'] != 1 for o in f['outputs']) or any(i['amount'] != 1 for i in f['inputs']) or len(f['outputs']) != 1:
                if REGION in f['regions']:
                    sys.exit(f"入出力の個数が1でない建物があり、計算機の前提に合わない: {f['loca']['english']}")

        wiki = read_json(WIKI / 'regions-aegyptus.json')
        self.exclusive = {e['nameEn']: e for e in wiki['exclusive']}
        self.list_goods = {g['displayName']: g for g in read_json(PRODUCTIONS / 'list.json')['goods'] if FILE_PREFIX not in g['id']}
        self.id_of: dict[int, str] = {}
        for guid, p in self.products.items():
            en = p['loca']['english']
            if en in self.exclusive:
                self.id_of[guid] = self.exclusive[en]['id']
            else:
                g = self.list_goods.get(ENGLISH_ALIAS.get(en, en))
                if g:
                    self.id_of[guid] = g['id']

    def good_id(self, guid: int) -> str:
        if guid not in self.id_of:
            sys.exit(f"商品 {guid} ({self.products[guid]['loca']['english']}) の計算機idが決まらない")
        return self.id_of[guid]


def build_node(pl: Planner, f: dict, product: int, children: list[dict]) -> dict:
    cost: dict[str, int] = {'money': 0}
    for c in f['constructionCosts']:
        cost['money' if c['product'] == MONEY_GUID else pl.good_id(c['product'])] = c['amount']
    wf = WORKFORCE_KEY.get(f['workforce'])
    if wf is None:
        sys.exit(f"労働力 {f['workforce']} のキーが未定義: {f['loca']['english']}")
    node = {
        'id': pl.good_id(product),
        'name': pl.products[product]['loca']['english'],
        'type': building_type(f),
        'guid': str(f['guid']),
        'time': int(f['cycleTime']) if float(f['cycleTime']).is_integer() else f['cycleTime'],
        'needs_fuel': f['needsFuel'],
        'building_cost': cost,
        'maintanance_cost': {'money': int(f['money']), wf: int(f['workforceAmount'])},
        'input': children,
    }
    if not children:
        node['start_of_chain'] = True
    if len(pl.makers[product]) > 1:
        # 同じ商品を作る建物が複数ある(石炭・金鉱石)。図には建物名つきの名前を出す
        node['name_key'] = f"{node['id']}_{slug(f['loca']['english'])}"
        pl.variant_names[node['name_key']] = (
            f"{ja(pl.products[product])}（{ja(f)}）",
            f"{pl.products[product]['loca']['english']} ({f['loca']['english']})",
        )
    return node


def building_type(f: dict) -> str:
    if f['loca']['english'] == 'Charcoal Burner':
        return 'charcoal_burner'
    t = slug(f['category']['english'])
    return 'arable_farm' if t == 'floodplain_farm' else t


def variants(pl: Planner, product: int, trail: tuple = ()) -> list[tuple[dict, list[str]]]:
    """商品を作るチェーンの全パターン。戻り値は (ノード, 選んだ分岐の建物名の一覧)。"""
    if product in trail:
        sys.exit(f"循環: {pl.products[product]['loca']['english']}")
    if product not in pl.makers:
        sys.exit(f"商品 {pl.products[product]['loca']['english']} を作る建物が無い")
    result = []
    makers = pl.makers[product]
    for f in makers:
        child_options = [variants(pl, i['product'], trail + (product,)) for i in f['inputs']]
        for combo in cartesian(*child_options):
            children = [c[0] for c in combo]
            choices = [name for c in combo for name in c[1]]
            if len(makers) > 1:
                choices = [f['loca']['english']] + choices
            result.append((build_node(pl, f, product, children), choices))
    return result


def build_chains(pl: Planner) -> list[dict]:
    """生産チェーン一覧(wiki)の18商品について、チェーンのパターンごとに1件作る。"""
    wiki_entries = read_json(WIKI / 'production-chains-aegyptus.json')['entries']
    by_english = {e['nameEn']: e for e in wiki_entries}
    goals = [g for g, p in pl.products.items() if p['loca']['english'] in by_english]
    out = []
    for goal in sorted(goals):
        en = pl.products[goal]['loca']['english']
        entry = by_english[en]
        vs = variants(pl, goal)
        for node, choices in vs:
            node['region'] = [REGION]
            if node['input']:
                node.pop('start_of_chain', None)
            suffix = ''.join('_' + slug(c) for c in choices) if len(vs) > 1 else ''
            ja_suffix = '（' + '・'.join(ja_building(pl, c) for c in choices) + '）' if len(vs) > 1 else ''
            out.append({
                'file': f"{pl.good_id(goal)}{suffix}",
                'node': node,
                'displayName': en + (' (' + ' / '.join(choices) + ')' if len(vs) > 1 else ''),
                'nameJa': entry['nameJa'] + ja_suffix,
                'category': CALC_CATEGORY[entry['category']],
                'icon': pl.good_id(goal),  # icons/<商品id>.png (変種も同じ絵)
            })
    return out


def ja_building(pl: Planner, english: str) -> str:
    for lst in pl.makers.values():
        for f in lst:
            if f['loca']['english'] == english:
                return ja(f)
    return english


def warn_fuel_ingredient(chains: list[dict]) -> None:
    """石炭を材料にしつつ自分も燃料が要る建物は、計算機の石炭の扱い(燃料として数える)と衝突しうるので知らせる。"""
    def walk(n: dict, file: str) -> None:
        if n['needs_fuel'] and any(c['id'] == 'charcoal' for c in n['input']):
            print(f"注意: {file}: {n['name']} は石炭を材料にし、かつ燃料も要る(計算機は材料の石炭を燃料として数える)")
        for c in n['input']:
            walk(c, file)
    for c in chains:
        walk(c['node'], c['file'])


def update_list(chains: list[dict]) -> None:
    path = PRODUCTIONS / 'list.json'
    data = read_json(path)
    data['goods'] = [g for g in data['goods'] if not g['id'].startswith(FILE_PREFIX)]
    for c in chains:
        data['goods'].append({
            'displayName': c['displayName'],
            'id': c['file'],
            'icon': c['icon'],
            'regions': [REGION],
            'files': {REGION.lower(): c['file']},
            'category': c['category'],
            # 一覧の startOfChain は「全地域に出す」の意味になるので、アイギュプト専用の商品は常に false
            'startOfChain': False,
        })
    data['goods'].sort(key=lambda g: g['displayName'])
    data['count'] = len(data['goods'])
    write_json(path, data, 2)


def update_i18n(pl: Planner, chains: list[dict]) -> None:
    names: dict[str, tuple[str, str]] = {}  # id -> (ja, en)
    for e in pl.exclusive.values():
        names[e['id']] = (e['nameJa'], e['nameEn'])
    for c in chains:
        names[c['file']] = (c['nameJa'], c['displayName'])
    for key, (j, e) in WORKFORCE_NAME.items():
        names[key] = (j, e)
    names.update(pl.variant_names)
    for lang, idx in (('ja', 0), ('en', 1)):
        path = LOCALES / f'{lang}.json'
        data = read_json(path)
        for k, v in names.items():
            data['goods'][k] = v[idx]
        write_json(path, data, 2, trailing_newline=path.read_text(encoding='utf-8').endswith('\n'))


def save_icon(src: Path, dest: Path, size: int) -> None:
    with Image.open(src) as img:
        img = img.convert('RGBA')
        img.thumbnail((size, size), Image.LANCZOS)
        img.save(dest, 'PNG', optimize=True)


def build_icons(pl: Planner) -> None:
    for e in pl.exclusive.values():
        name = icon_name(e['id'])
        save_icon(ARCHIVE / 'production_goods' / f'{name}.png', ICONS / f"{e['id']}.png", GOODS_ICON_SIZE)
    for key, fn in WORKFORCE_ICON.items():
        save_icon(ARCHIVE / 'workforce' / fn, ICONS / f'{key}.png', WORKFORCE_ICON_SIZE)


def main() -> None:
    pl = Planner()
    chains = build_chains(pl)
    for old in PRODUCTIONS.glob(f'{FILE_PREFIX}*.json'):
        old.unlink()
    for c in chains:
        write_json(PRODUCTIONS / f"{c['file']}.json", c['node'], 4)
    warn_fuel_ingredient(chains)
    update_list(chains)
    update_i18n(pl, chains)
    build_icons(pl)
    print(f'チェーン {len(chains)}件、アイコン {len(pl.exclusive) + len(WORKFORCE_ICON)}点を出力')
    for c in chains:
        print(' ', c['file'], '|', c['nameJa'], '|', c['category'])


if __name__ == '__main__':
    main()
