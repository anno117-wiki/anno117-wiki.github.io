#!/usr/bin/env python3
"""信仰神(Patron)と祭りのデータを、Anno 117 Planner のゲーム3.0データで更新する。

入力 : _local/anno-official-data/v3.0-planner/{religion,effects,buildings,festivals}.json
出力 : apps/wiki/docs/wiki/patrons.json (既存の8柱は手で確認した表示定義を残して更新し、新祭神3柱と祭りを足す)

既存の8柱:
- 効果の対象施設は、Planner にある名前のうちサイトに無いものだけ「足す」(減らさない)。
  総称('全住居'など)や、Planner に効果が無いもの(部隊・船)は触らない
- 説明文は3.0の文言に更新する(全角数字が半角になる等。<b>タグは除く)
- 「牛牧場」は「オーロックス牧場」に統一する(ユーザー決定 2026-11-05。3.0の建物名)。既存の対象の「牛牧場」は直す
新祭神3柱(イシス・バステト、セベク、トト・トリスメギストス):
- 局所効果2の表示行は、Planner の効果文の「1段階あたりの値」から作る。実機での照合は未確認
祭り: 神に結びついた祭りだけを載せる
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'patrons.json'
ZW = '​'
RENAME = {'牛牧場': 'オーロックス牧場'}
NEW_IDS = {153578: 'isis_bastet', 153802: 'sobek', 153803: 'thoth'}
# 新祭神の局所効果2(行の見出し, 1段階あたりに掛ける倍率, 符号, 単位)。Planner の効果文(1段階あたりの値)から
NEW_LOCAL2_DISPLAY = {
    'isis_bastet': [('住居の消費', 1, '-', '%')],
    'sobek': [('追加の人口（範囲効果）', 1, '+', ''), ('水の供給', 20, '+', ''), ('水路の容量', 20, '+', '')],
    'thoth': [('収入に応じて得る知識', 1, '+', '%'), ('名声に応じて得る知識', 1, '+', '%')],
}


def ja(d) -> str:
    return (d or {}).get('japanese', '').replace(ZW, '') if isinstance(d, dict) else ''


def en(d) -> str:
    return (d or {}).get('english', '') if isinstance(d, dict) else ''


def plain(s: str) -> str:
    return re.sub(r'<[^>]+>', '', s).strip()


def num(v: float):
    return int(v) if float(v).is_integer() else v


def main() -> None:
    religion = json.loads((SRC / 'religion.json').read_text(encoding='utf-8'))
    effects = json.loads((SRC / 'effects.json').read_text(encoding='utf-8'))
    buildings = json.loads((SRC / 'buildings.json').read_text(encoding='utf-8'))
    festivals = json.loads((SRC / 'festivals.json').read_text(encoding='utf-8'))
    data = json.loads(OUT.read_text(encoding='utf-8'))
    site = {p['guid']: p for p in data['patrons']}
    residences = {ja(b['loca']) for b in buildings.values() if b.get('template') == 'ResidenceBuilding'}

    def target_names(effect_guid):
        x = effects.get(str(effect_guid))
        if not x:
            return None
        names = sorted({ja(buildings[str(g)]['loca']) for g in (x.get('targets') or []) if str(g) in buildings})
        return ['全住居'] if residences and residences <= set(names) else names

    log = []
    for p in religion['patrons']:
        guid = str(p['guid'])
        s = site.get(guid)
        new = s is None
        if new:
            if p['guid'] not in NEW_IDS:
                sys.exit(f"想定外の神: {guid} {ja(p['loca'])}")
            s = {'id': NEW_IDS[p['guid']], 'guid': guid, 'nameJa': ja(p['loca']), 'nameEn': en(p['loca']),
                 'descJa': plain(ja(p['description'])), 'wonder': {'guid': str(p['wonder']), 'descJa': ''},
                 'local': [], 'dominant': {}}
            data['patrons'].append(s)
        wonder_text = plain(ja(p['wonderDescription']))
        wonder_name = ja(p['wonderName'])
        s['wonder']['descJa'] = f"{wonder_name}。{wonder_text}" if new and not wonder_text.startswith(wonder_name) else wonder_text
        dom = p['dominantEffects'][0]
        s['dominant'] = {'titleJa': ja(dom['title']), 'titleEn': en(dom['title']), 'descJa': plain(ja(dom['description']))}
        for i, e in enumerate(p['localEffects']):
            ms = [[num(m['devotion']), num(m['buffScaling'])] for m in e['milestones']]
            names = target_names(e['effect'])
            if new:
                shown = list(names or [])
                loc = {'guid': str(e['effect']), 'titleJa': ja(e['title']), 'titleEn': en(e['title']),
                       'descJa': plain(ja(e['description'])), 'targets': shown, 'milestones': ms}
                if i == 0:
                    loc['showMilestones'] = True
                    loc['note'] = '（信仰値ごとの増加率は下の表のとおり。他の神と段階が違う）'
                else:
                    loc['display'] = {'rows': [{'label': a, 'multiplier': b, 'sign': c, 'unit': d}
                                               for a, b, c, d in NEW_LOCAL2_DISPLAY[s['id']]]}
                s['local'].append(loc)
                continue
            loc = s['local'][i]
            loc['targets'] = [RENAME.get(t, t) for t in loc['targets']]
            loc['descJa'] = plain(ja(e['description'])) or loc['descJa']
            if loc['milestones'] != ms:
                log.append(f"{s['nameJa']} 局所効果{i + 1}: 段階表が変わった(サイトは更新しない。要確認)")
            if names is not None and not any(t.startswith('全') for t in loc['targets']):
                have = set(loc['targets'])
                add = [n for n in names if n not in have]
                if add:
                    loc['targets'] = loc['targets'] + add
                    log.append(f"{s['nameJa']} 局所効果{i + 1}: 対象に追加 {add}")

    # 祭り: 神に結びついたものだけ
    by_patron = {p['guid']: p for p in religion['patrons']}
    order = {p['guid']: i for i, p in enumerate(religion['patrons'])}
    fests = []
    for f in festivals['festivals']:
        t = f['trigger']
        if t.get('kind') != 'deity':
            continue
        goods = []
        for o in f['options']:
            for g in o.get('goods') or []:
                name = ja(g['loca'])
                if g['guid'] != 1010017 and name not in goods:
                    goods.append(name)
        fests.append({
            'guid': str(f['guid']),
            'nameJa': ja(f['loca']),
            'nameEn': en(f['loca']),
            'patron': ja(by_patron[t['deity']]['loca']),
            'devotion': num(t['devotion']),
            'hours': num(f['seconds'] / 3600),
            'descJa': plain(ja(f['description'])),
            'goods': goods,
            '_order': order[t['deity']],
        })
    fests.sort(key=lambda x: x['_order'])
    for f in fests:
        del f['_order']
    data['festivals'] = fests
    data['source'] = 'ゲーム内データ(アップデート3.0)'
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f"神 {len(data['patrons'])}柱、祭り {len(fests)}件を書き出した")
    for line in log:
        print(' ', line)


if __name__ == '__main__':
    main()
