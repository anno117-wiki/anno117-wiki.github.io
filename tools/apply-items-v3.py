#!/usr/bin/env python3
"""アイテムの items-full.json に、ゲーム3.0の変更を当てる。

入力 : _local/anno-official-data/v3.0-planner/item_catalog.json (Anno 117 Planner v1.0.0。効果文・取得先つき)
出力 : packages/shared/public/data/items-full.json (既存の項目は直接直し、新しい項目を足す)

注意: tools/build-items-ja.py は2.1のゲームデータ(assets.xml)から全件を作り直すスクリプトで、3.0のデータでは動かない。
      build-items-ja.py を実行したあとは、必ずこのスクリプトも実行して3.0の変更を当て直すこと。

やること:
1. 3.0で値が変わった既存の項目を直す(水道スペシャリスト2件。他の既存項目は、カタログの数値と突き合わせて差が無いことを確認済み)
2. 3.0で消えた項目(90573 花形の潜り手)と、専門家ではない項目(157067 厄介な監査)を取り除く
3. 2.1に無かった項目(DLC03の専門家・船長)を足す(あれば作り直す)
   - 効果文: カタログの効果行から「項目: 値」「対象: 項目 値」を作る
   - 取得先: build-items-ja.py と同じ書式にする(「NPC名との取引・契約・撃破ドロップ」「祭りの報酬」「来訪者イベントの報酬」など)。
     取引・祭りなどの確率つきの取得先が11件以上ある項目は「多数の交易商・祭りからランダム入手（低確率）」にまとめる
   - 強化条件: 名声などの数値条件だけ文章にする。それ以外の種類は「未確認です」と書く
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLANNER = ROOT / '_local' / 'anno-official-data' / 'v3.0-planner'
CATALOG = PLANNER / 'item_catalog.json'
# クエストの名前: 取得先のクエスト(GUID) -> 題名の文字ID(quests.json) -> 日本語(quest_texts_japanese.json)
QUESTS = PLANNER / 'quests.json'
QUEST_TEXTS = PLANNER / 'quest_texts_japanese.json'
# 日本語の題名が空のクエストは、英語の題名を出す(Item Inspector の英語テキストに入っている)
EN_TEXTS = ROOT / '_local' / 'anno-official-data' / 'v3.0-item-inspector' / 'loca' / 'english.json'
# 2.1にあった項目(これ以外が3.0の新しい項目で、毎回作り直す)
ITEMS_V21 = ROOT / '_local' / 'anno-official-data' / 'v3.0-item-inspector' / 'items-2.1.csv'
ITEMS = ROOT / 'packages' / 'shared' / 'public' / 'data' / 'items-full.json'
ZW = '​'
# 90573: 3.0で消えた「花形の潜り手」。157067: 「厄介な監査」はクエストで付く負の効果で、専門家ではない(分類なし・Quest)
REMOVED = {'90573', '157067'}
VALUE_FIX = {  # guid -> [(旧, 新)] 効果文の差し替え(3.0のパッチノートと、Planner のカタログの値)
    '42054': [('水の供給: +200%', '水の供給: +100%')],
    '106397': [('水の供給: +50%', '水の供給: +25%')],
}
ALLOCATION_JA = {'Villa': '住居', 'Ship': '船'}
CONTRACT_TIER_JA = {0: '並', 1: '良', 2: '最高'}
COMPARE_JA = {'AtLeast': '以上', 'AtMost': '以下', 'LessThan': '未満', 'MoreThan': '超'}
ATTR_JA = {'Prestige': '名声', 'Happiness': '幸福', 'Health': '健康', 'Knowledge': '知識', 'Belief': '信仰',
           'Money': '収入', 'FireSafety': '火災安全度'}
POOL_THRESHOLD = 11


def tx(t) -> str:
    return (t.get('japanese', '') if isinstance(t, dict) else str(t or '')).replace(ZW, '')


def plain(s: str) -> str:
    import re
    return re.sub(r'<[^>]+>', '', s).strip()


def main() -> None:
    cat = json.loads(CATALOG.read_text(encoding='utf-8'))
    assets = cat['assets']
    known = {r['GUID'] for r in csv.DictReader(ITEMS_V21.open(encoding='utf-8'))}
    items = json.loads(ITEMS.read_text(encoding='utf-8'))
    quest_texts = json.loads(QUEST_TEXTS.read_text(encoding='utf-8'))
    en_texts = json.loads(EN_TEXTS.read_text(encoding='utf-8'))
    quest_name = {}
    for q in json.loads(QUESTS.read_text(encoding='utf-8'))['quests']:
        title = str(q.get('title'))
        ja_name = quest_texts.get(title, '').replace(ZW, '')
        en_name = en_texts.get(title, '').replace(ZW, '')
        if ja_name:
            quest_name[str(q['guid'])] = f'クエスト「{ja_name}」'
        elif en_name:
            quest_name[str(q['guid'])] = f'クエスト「{en_name}」（日本語名は未確認です）'

    def name(guid) -> str:
        a = assets.get(str(guid))
        return tx(a['loca']) if a and a.get('loca') else ''

    def pool_names(guids) -> str:
        return '、'.join(n for n in (name(g) for g in guids) if n)

    def lines(buffs) -> list[str]:
        out = []
        for b in buffs or []:
            for l in b.get('lines', []):
                out.append(f"{tx(l['text'])}: {l['value']}")
            f = b.get('functional')
            if f:
                target = pool_names(f.get('targets', []))
                for fb in f['buffs']:
                    for l in fb.get('lines', []):
                        out.append(f"{target}: {tx(l['text'])} {l['value']}" if target else f"{tx(l['text'])}: {l['value']}")
        return out

    def condition(boost) -> str:
        c = ((boost or {}).get('condition') or {}).get('Condition') or {}
        if c.get('$type') == 'ConditionNeedAttributeCounter':
            v = c['ConditionNeedAttributeCounter']
            attr = ATTR_JA.get(v['NeedAttributeType'])
            op = COMPARE_JA.get(v['ComparisonOpType'])
            if attr and op:
                return f"特性 島の上: {attr} {int(v['NeedAttributeAmount'])}{op}"
        return '未確認です'

    def sources(item) -> tuple[list[str], bool]:
        fixed, pool, caution = [], [], False
        for s in item['sources']:
            kind, pct = s['kind'], f"{s['chance'] * 100:.3f}%" if 'chance' in s else ''
            owner = name(s['owner']) if 'owner' in s else ''
            if kind == 'trader' and owner:
                pool.append(f'{owner}との取引（{pct}）')
            elif kind == 'contract' and owner:
                pool.append(f"{owner}との契約（{CONTRACT_TIER_JA.get(s.get('tier'), '？')}）（{pct}）")
            elif kind == 'shipDrop' and owner:
                pool.append(f'{owner}との撃破ドロップ（{pct}）')
            elif kind == 'festival' and owner:
                pool.append(f'{owner}の報酬（{pct}）')
            elif kind == 'visitors':
                pool.append(f'来訪者イベントの報酬（{pct}）')
            elif kind == 'quest' and quest_name.get(str(s.get('owner'))):
                fixed.append(quest_name[str(s['owner'])])
            elif kind == 'hallOfFame':
                fixed.append('栄誉の殿堂')
            elif kind == 'rival' and owner:
                fixed.append(f'{owner}を撃破')
            else:
                fixed.append('未確認です')
                caution = True
        results = fixed + (['多数の交易商・祭りからランダム入手（低確率）'] if len(pool) >= POOL_THRESHOLD else pool)
        return list(dict.fromkeys(results)), caution

    # 1. 値の修正と 2. 削除
    for it in items:
        for old, new in VALUE_FIX.get(str(it['guid']), []):
            if new in it['effects']:
                continue
            if old not in it['effects']:
                sys.exit(f"{it['nameJa']}: 直す文が見つからない: {old} / {it['effects']}")
            it['effects'] = [new if e == old else e for e in it['effects']]
    before = len(items)
    items = [i for i in items if str(i['guid']) not in REMOVED]
    removed = before - len(items)

    # 3. 追加
    added = []
    for q in cat['items']:
        guid = str(q['guid'])
        if guid in known or guid in REMOVED:
            continue
        src, caution = sources(q)
        boost = q.get('boost')
        entry = {
            'guid': guid,
            'nameJa': tx(q['loca']),
            'nameEn': q['loca']['english'],
            'rarity': q['rarity'],
            'niche': q['niche'],
            'price': str(int(q['tradePrice'])) if q.get('tradePrice') else '',
            'description': plain(tx(q.get('description'))),
            'effects': lines(q['effect'].get('buffs')),
        }
        if boost:
            entry['boostHint'] = tx(boost.get('hint'))
            entry['boostEffects'] = lines(boost.get('buffs'))
            entry['boostCondition'] = condition(boost)
        entry['targets'] = pool_names(q['effect'].get('targets', []))
        entry['source'] = src
        entry['sourceCaution'] = caution
        entry['allocation'] = ALLOCATION_JA.get(q['allocation'], q['allocation'])
        index = next((n for n, i in enumerate(items) if str(i['guid']) == guid), None)
        if index is None:
            items.append(entry)
        else:
            items[index] = entry
        added.append(entry['nameJa'])

    ITEMS.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    print(f'削除 {removed}件、追加 {len(added)}件、合計 {len(items)}件')


if __name__ == '__main__':
    main()
