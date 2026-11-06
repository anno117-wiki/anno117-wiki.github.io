#!/usr/bin/env python3
"""配信後の実機(PS5)照合シートを、サイトが今出している値から生成する。

入力 : apps/wiki/docs/wiki/{population-aegyptus,production-chains-aegyptus,patrons,techs,skill-bonuses-dlc03}.json
出力 : docs-notes/dlc03-verify-sheet.md

- 「サイトの値」はゲーム内データ(アップデート3.0、Planner)。「実機」列は空欄で、実機で見た分だけ書く
- 食い違いだけ書けばよい（一致したら「○」）。サイトの値が変わったら、このスクリプトで作り直す（実機列の記入は消えるので、作り直す前に写す）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki'
OUT = ROOT / 'docs-notes' / 'dlc03-verify-sheet.md'


EFFECT_JA = {'population': '人口', 'income': '収入', 'faith': '信仰', 'knowledge': '知識', 'prestige': '名声',
             'health': '健康度', 'happiness': '幸福', 'fireSafety': '防火', 'gymnasiarchWorkforce': 'ギムナシアリコスの労働力'}


def load(name: str):
    return json.loads((WIKI / name).read_text(encoding='utf-8'))


def cell(x) -> str:
    """表のセル用。タグを除き、縦線と改行を潰す"""
    s = re.sub(r'<[^>]+>', '', str(x if x is not None else ''))
    return s.replace('|', '／').replace('\n', ' ').strip()


def table(head: list[str], rows: list[list]) -> list[str]:
    out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    out += ['| ' + ' | '.join(cell(c) for c in r) + ' |' for r in rows]
    return out + ['']


def main() -> None:
    pop = load('population-aegyptus.json')
    chains = load('production-chains-aegyptus.json')['entries']
    patrons = load('patrons.json')['patrons']
    techs = [t for t in load('techs.json')['techs'] if t.get('branchOverride') == 'dlc03']
    skill_bonuses = load('skill-bonuses-dlc03.json')['bonuses']
    tier_name = {t['key']: t['nameJa'] for t in pop['tiers']}

    L: list[str] = []
    L += ['# DLC03・アップデート3.0 実機照合シート', '',
          '生成: `tools/build-dlc03-verify-sheet.py`（サイトの値から作る）。配信（2026-11-05 19:00 JST）後に、実機（PS5）で見ながら使う。', '',
          '## 使い方', '',
          '- 「サイトの値」は、ゲーム内データ（アップデート3.0、Planner）から入れた値。**実機では未確認**。',
          '- 「実機」列には、**食い違いだけ**を書く。一致したら「○」。見ていない行は空欄のまま（推測で埋めない）。',
          '- 数値は、信仰神・アイテム・スキル・隣接効果などのバフが乗っていない状態で見る。乗っていたら、その旨を書く。',
          '- 文字で書き写す代わりに、スクリーンショットを渡してもよい。こちらで読み取る。',
          '- 食い違ったら、**実機を優先**する。サイトのデータと、`docs-notes/unverified-items.md` を直す。',
          '- 古い記入用シート（空欄の表）は `dlc03-ingame-checklist.md`。11〜14節は、確認の記録として残してある。', '']

    L += ['## 優先順位', '',
          '1. 名前（層・祭神・属州・DLC名）… 画面に出る表記が違うと、検索にも影響する',
          '2. 住民層の需要と分岐',
          '3. 生産建物のサイクルタイム・入力（計算機に直結）',
          '4. 新祭神・スキルツリー',
          '5. 3.0で変わった既存の値', '']

    L += ['## 1. 名前', '']
    L += table(['項目', 'サイトの値', '実機（日本語表示）'], [
        ['属州', 'アイギュプト', ''], ['DLC名', 'デルタの夜明け', ''],
        *[[f'住民層 {i + 1}', t['nameJa'], ''] for i, t in enumerate(pop['tiers'])],
        *[[f'祭神（新）', p['nameJa'], ''] for p in patrons if p['id'] in ('isis_bastet', 'sobek', 'thoth')],
        ['土地の区分', '氾濫原・農地（ゲーム内表記で確認済み）／砂漠エリアはWikiでの呼び名（正式表記は未確認）', ''],
    ])

    L += ['## 2. 住民層の分岐と需要', '',
          '昇格元は、データ上の「親」の層。需要は、その層が持つ全ての需要（下の層の分を含む）。', '']
    for t in pop['tiers']:
        parent = tier_name.get(t['parent'], '（最初の層）') if t['parent'] else '（最初の層）'
        L += [f"### {t['nameJa']}（昇格元: {parent}）", '']
        L += table(['カテゴリ', 'サイトの需要', '実機'], [[g['category'], '、'.join(g['names']), ''] for g in t['all']])
        L += ['- 昇格に必要な条件（実機）: ', '']

    L += ['## 3. 生産建物（新商品18点）', '',
          '計算機とwikiの生産チェーンの元。サイクルは秒。「建物」は、その商品を作る建物。', '']
    L += table(['商品', '建物', 'サイクル（秒）', '入力', '燃料', '実機（食い違い）'],
               [[c['nameJa'], c['buildingJa'], c['timeSeconds'], '、'.join(c['inputs']) or '—',
                 '要' if c['needsFuel'] else '不要', ''] for c in chains])

    L += ['## 4. 新祭神（3柱）', '', '局所効果2の「1段階あたりの値」は、特に未確認。信仰値ごとの増加率の表は、サイトの `/wiki/patrons` にある（ここには載せない）。', '']
    rows = []
    for p in patrons:
        if p['id'] not in ('isis_bastet', 'sobek', 'thoth'):
            continue
        rows.append([p['nameJa'], '驚異: ' + cell(p['wonder']['descJa']) if p.get('wonder') else '', ''])
        for loc in p.get('local', []):
            rows.append(['　' + loc['titleJa'], cell(loc['descJa']) + (' ※' + loc['note'] if loc.get('note') else ''), ''])
    L += table(['神・効果', 'サイトの値', '実機'], rows)

    L += ['## 5. スキルツリー「デルタの夜明け」（41件）', '',
          '名前・効果文・知識コストを見る。**つながり（線）はルール（六角形の隣）から作ったもので、ゲーム内の見た目との照合は未確認**。縦位置は目安。', '']
    rows = [[t['nameJa'], t.get('effectJa') or t.get('descJa'), t.get('knowledgeCost') or '', ''] for t in techs]
    L += table(['スキル', 'サイトの効果文', '知識コスト', '実機（食い違い・線の有無）'], rows)

    L += ['## 6. スキルが建物に付ける追加効果（建物効果ページ）', '']
    L += table(['建物', 'スキル', 'サイトの値', '実機'],
               [[b['building'], b['skill'], '、'.join(f'{EFFECT_JA.get(k, k)}{v:+}' for k, v in b['effects'].items()), ''] for b in skill_bonuses])

    L += ['## 7. 3.0で変わった既存の値', '']
    L += table(['項目', 'サイトの値', '実機'], [
        ['粉ひき所', '20秒・維持費12・労働力4（パッチノートと一致）。貯蔵量8→12・6→9はデータに無く未確認', ''],
        ['サンダラック苗木場', '農園扱い・水道灌漑は任意・労働力3・90秒', ''],
        ['街の状況（段階3〜10）', '属性ペナルティがゆるやかに（例: 段階4 幸福 -2→-1、火災安全度 -2→-1）。41〜45段階は2.1値のまま', ''],
        ['水道スペシャリスト', 'アクイラ・ドゥルシス +100%、ドゥクトゥアリウス +25%。強化後は +250% のまま（データ上変更なし）', ''],
        ['アイテムの条件', '79947・144878 は「商品在庫100万以上」。ティリアナ(160513) の追加産出が 2124', ''],
        ['リベルトゥスのパン消費', '3.0の値は未取得', ''],
    ])

    L += ['## 8. 数が多いので、気になるものから見るもの', '',
          '- **建物効果（アイギュプト専用110件）**: 維持費・各効果値。需要Tier（「その建物を必要とする最初の住民層」）は、同じアイコンの需要の一致だけで決めている → `unverified-items.md` 第6節',
          '- **アイテム（DLC03の61件）と、全540件の「地域」**: 地域は対象の建物から決めた。船のアイテムなどは「指定なし」→ `unverified-items.md` 第6節',
          '- **商品（新30点）・生産チェーン・計算機のアイギュプト版**: 計算機の画面に「実機との照合は未確認」の注記がある。照合できたら注記を外す（`App.ts` の `REGIONS` の `unverified`、`ja.json`/`en.json` の `ui.regionNotice.egyptian`）', '']

    OUT.write_text('\n'.join(L), encoding='utf-8', newline='\n')
    print(f'出力 -> {OUT}（{len(L)}行）')


if __name__ == '__main__':
    main()
