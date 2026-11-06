#!/usr/bin/env python3
"""DLC03(デルタの夜明け)のスキルツリーを、Anno 117 Planner のゲーム3.0データから techs.json に入れる。

入力 : _local/anno-official-data/v3.0-planner/techs.json
出力 : apps/wiki/docs/wiki/techs.json (DLC03の項目だけを入れ替える。他のブランチには触れない)

- DLC03 は category 151465 の41項目(ゲート7、スキル34)
- 配置は Planner の x, y。ゲートを基準(0)にそろえるため y に 1 を足す。
  ゲームの研究ツリーは「平らな頂点の六角形のマス。奇数列は半行下」(Planner の model/research.py の説明)。
  表示は行(annoR)で縦位置を決めるので、1行を2とし、奇数列は +1(半行下)にする
- つながり(connections)は、ゲームの規則「同じ分野の隣のマスの研究が済んでいると研究できる」から、
  六角形の隣のマス同士を結んで作る(Planner の neighbor_cells と同じ。奇数列と偶数列で隣の取り方が違う)
- 効果文は「対象 項目 値」を並べる。解放される建物などがあれば「解放: ○○」を付ける
- 日本語は単語間にゼロ幅スペース(U+200B)があるので除く
- techs.json は CRLF・インデント2で書かれているので、同じ書式で書き戻す
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner' / 'techs.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'techs.json'
DLC03_CATEGORY = 151465
ZW = '​'
# ゲームの日本語が崩れている・向きが他言語と逆の効果文の直し(スキルのGUID -> 日本語の効果文)。
# 「イテルの旅人」は、日本語・中国語だけ「金を売って小麦を得る」向きだが、他の10言語は「小麦を売って金を得る」。ユーザーが向きを確認(2026-11-05)
EFFECT_FIX_JA = {
    153952: 'NPCに小麦を50t売却するごとに、金を1t獲得する。',
    # 実機(2026-11-06)では対象が3つ。Plannerのデータは「兵舎」だけ
    153950: '兵舎、攻城兵器工房、騎兵養成所 幸福度 範囲効果 +2',
    # 実機(2026-11-06)では対象が2つ。Plannerのデータは「石灰岩レンガ」だけ
    154504: '石灰岩レンガの生産チェーン、コンクリートの生産チェーン 生産性 +25%',
}


def tx(d, lang: str) -> str:
    return (d or {}).get(lang, '').replace(ZW, '') if isinstance(d, dict) else ''


def effect_text(t: dict, lang: str) -> str:
    parts = [' '.join(p for p in (tx(e.get('target'), lang), tx(e.get('text'), lang), e.get('value', '')) if p) for e in t['effectLines']]
    unlocks = [tx(u, lang) for u in t['unlocks']]
    if unlocks:
        parts.append(('解放: ' if lang == 'japanese' else 'Unlocks: ') + '、'.join(unlocks))
    return ' / '.join(parts)


def main() -> None:
    src = json.loads(SRC.read_text(encoding='utf-8'))['techs']
    dlc03 = [t for t in src if t['category'] == DLC03_CATEGORY]
    if len(dlc03) != 41:
        sys.exit(f'DLC03の項目数が想定(41)と違う: {len(dlc03)}')

    # 六角形(平らな頂点・奇数列は半行下)の隣のマス
    def neighbor_cells(x: int, y: int):
        if x % 2:
            offsets = [(0, -1), (0, 1), (-1, 0), (1, 0), (-1, 1), (1, 1)]
        else:
            offsets = [(0, -1), (0, 1), (-1, -1), (1, -1), (-1, 0), (1, 0)]
        return [(x + dx, y + dy) for dx, dy in offsets]

    cells = {(t['x'], t['y']): str(t['guid']) for t in dlc03}
    if len(cells) != len(dlc03):
        sys.exit('同じマスに複数のスキルがある')
    connections = {str(t['guid']): [cells[c] for c in neighbor_cells(t['x'], t['y']) if c in cells] for t in dlc03}

    entries = []
    for t in dlc03:
        gate = t['gate']
        entries.append({
            'guid': str(t['guid']),
            'internalName': t['name'],
            'nameEn': tx(t['loca'], 'english'),
            'nameJa': tx(t['loca'], 'japanese'),
            'descEn': tx(t['description'], 'english'),
            'descJa': tx(t['description'], 'japanese'),
            'effectJa': EFFECT_FIX_JA.get(t['guid']) or effect_text(t, 'japanese'),
            'effectEn': effect_text(t, 'english'),
            'iconKey': None,
            'techIconPath': '',
            'isGate': gate,
            'color': 'Green',
            'knowledgeCost': None if gate else int(t['knowledge']),
            'gridX': t['x'],
            'gridY': t['y'] + 1,
            'annoR': 2 * (t['y'] + 1) + (1 if t['x'] % 2 else 0),
            'connections': connections[str(t['guid'])],
            'annoNodeId': str(t['guid']),
            'branchOverride': 'dlc03',
            '_source': 'Anno 117 Planner v1.0.0 (ゲーム3.0)。つながりは六角形の隣のマスから作成',
            **({'repeatable': True} if t['repeatable'] else {}),  # 繰り返し研究できるスキル(月桂冠風の飾り枠で表示)
        })

    raw = OUT.read_text(encoding='utf-8', newline='')
    data = json.loads(raw)
    others = [t for t in data['techs'] if t.get('branchOverride') != 'dlc03' and 'DLC03' not in t.get('internalName', '')]
    removed = len(data['techs']) - len(others)
    data['techs'] = others + entries
    text = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    OUT.write_text(text.replace('\n', '\r\n'), encoding='utf-8', newline='')
    print(f'DLC03の既存 {removed}件を入れ替え、{len(entries)}件を書き出した(合計 {len(data["techs"])}件)')


if __name__ == '__main__':
    main()
