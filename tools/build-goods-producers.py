#!/usr/bin/env python3
"""商品一覧に載せる「生産元ごとの違い」データを生成する（石炭・金鉱石）。

入力 : _local/anno-official-data/buildings-data.json （build-buildings-data.py の出力）
出力 : apps/wiki/docs/wiki/goods-producers.json

- 建物効果(維持費・健康度など)は公式データから取る。同じ生産元の地域違い(GUID違い)で
  値が食い違う場合は止める。
- 設置場所・解放条件・サイクルタイムは PRODUCERS に手書きする。
    サイクルタイム: 金鉱150秒・炭鉱30秒・炭焼き師30秒は実機確認済み(2026-09-19)。金選鉱240秒は
                    公式データのCycleTimeと一致。未確認の値は cycleUnverified を True にする。
    解放条件      : 炭鉱=ウルカヌス、金鉱=メルクリウス・ルグスの奇跡(世界の信仰4,000)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'buildings-data.json'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'goods-producers.json'

# 建物効果ページと同じ表記・並び
EFFECT_LABELS = [
    ('maintenance', '維持費'),
    ('population', '人口'),
    ('income', '収入'),
    ('faith', '信仰'),
    ('knowledge', '知識'),
    ('prestige', '名声'),
    ('health', '健康度'),
    ('happiness', '幸福'),
    ('fireSafety', '防火'),
]

PRODUCERS = {
    'charcoal': [
        {'name': '炭焼き師', 'guids': ['2880', '5977'], 'place': '森林エリア',
         'unlock': None, 'cycle': 30, 'cycleUnverified': False},
        {'name': '炭鉱', 'guids': ['144810', '144811'], 'place': '山スロット',
         'unlock': 'ウルカヌスの奇跡（世界の信仰4,000）', 'cycle': 30, 'cycleUnverified': False},
    ],
    'gold_ore': [
        {'name': '金選鉱', 'guids': ['31753'], 'place': '川スロット',
         'unlock': None, 'cycle': 240, 'cycleUnverified': False},
        {'name': '金鉱', 'guids': ['50280'], 'place': '山スロット',
         'unlock': 'メルクリウス・ルグスの奇跡（世界の信仰4,000）', 'cycle': 150, 'cycleUnverified': False},
    ],
}


def effects_of(buildings: dict, producer: dict) -> list:
    """生産元の建物効果を [{label, value}] にする（0でない項目と維持費）。"""
    rows = []
    for guid in producer['guids']:
        b = buildings.get(guid)
        if b is None:
            raise ValueError('buildings-data.json に GUID %s がありません（%s）' % (guid, producer['name']))
        rows.append({key: b[key] for key, _ in EFFECT_LABELS})
    if any(r != rows[0] for r in rows[1:]):
        raise ValueError('%s の地域違いで建物効果が食い違っています: %s' % (producer['name'], rows))
    return [{'label': label, 'value': rows[0][key]}
            for key, label in EFFECT_LABELS if rows[0][key] != 0 or key == 'maintenance']


def main() -> int:
    if not SRC.exists():
        print('buildings-data.json が見つかりません: %s' % SRC, file=sys.stderr)
        return 1
    buildings = {b['guid']: b for b in json.loads(SRC.read_text(encoding='utf-8'))}
    goods = {}
    for good_id, producers in PRODUCERS.items():
        goods[good_id] = [{
            'name': p['name'],
            'place': p['place'],
            'unlock': p['unlock'],
            'cycle': p['cycle'],
            'cycleUnverified': p['cycleUnverified'],
            'effects': effects_of(buildings, p),
        } for p in producers]
    OUT.write_text(json.dumps({'goods': goods}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('wrote %s' % OUT.relative_to(ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
