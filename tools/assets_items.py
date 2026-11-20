"""assets.xml から、アイテムと「資産の名前表(総称の中身つき)」を Planner の item_catalog.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の item_catalog.json を、ゲームの assets.xml に置き換える。

作る項目:
  load_item_catalog() -> {'items': [...], 'assets': Assets}
    items : アイテム(Item / ItemWithBoost テンプレートの資産。Planner と同じ541件)
            guid / name / loca / template / rarity / niche / tradePrice / effect{guid, scope, targets, buffs}
            targets は XML に書かれた対象のまま（総称のまま。展開しない）
    assets: GUID から資産の名前表を引く辞書風のもの。.get(guid) / [guid] / in が使える。
            {name, template, loca{english, japanese}, icon, members}。
            総称(AssetPool)の members は、入れ子の総称を平らに展開し、重複を除いて昇順に並べた GUID（Planner と同じ）
            Planner の assets と違い、アイテムから参照されるものに限らず、assets.xml の全資産を引ける（その場で作る）
作らない項目: 説明文・入手先(sources)・効果の説明行(buffs の lines)・強化の条件など

XML での探し方:
  - 名前 /Text/OasisId（研究 Tech は /Tech/TechName）。レア度 /Item[0]/Rarity（省略時 Common）、
    ニッチ /Item[0]/Niche（省略時 Finance）、取引価格 /Item[0]/TradePrice（省略時 1000）
  - 効果 /Effect/EffectScope（省略時 Local）・/Effect/Targets・/Effect/Buffs

使い方:
    from assets_items import load_item_catalog
    cat = load_item_catalog()
    cat['items'], cat['assets'].get(31659)
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

ITEM_TEMPLATES = ('Item', 'ItemWithBoost')
# 開発用のテストアイテムと偽のアイテム（Planner のカタログに無い）
EXCLUDED_NAME_PARTS = ('TestItem', 'Fake Item')


def _num(s, default: float = 0.0) -> float:
    try:
        return float(s)
    except (TypeError, ValueError):
        return default


def _ids(v: dict, base: str, key: str) -> list[int]:
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    found = []
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            found.append((int(m.group(1)), int(val)))
    return [g for _, g in sorted(found)]


class Assets:
    """資産の名前表。GUID を引いたときに、その場で作って覚える"""

    def __init__(self, resolver: Resolver, en: dict[int, str], ja: dict[int, str]) -> None:
        self._R = resolver
        self._en, self._ja = en, ja
        self._cache: dict[int, dict | None] = {}

    def _flat_members(self, guid: int, seen: tuple = ()) -> list[int]:
        r = self._R.get(guid)
        if r and r['template'] == 'AssetPool' and guid not in seen:
            out: list[int] = []
            for x in _ids(r['v'], '/AssetPool/AssetList', 'Asset'):
                out += self._flat_members(x, seen + (guid,))
            return out
        return [guid]

    def _make(self, guid: int) -> dict | None:
        r = self._R.get(guid)
        if r is None:
            return None
        v = r['v']
        line = v.get('/Tech/TechName') if r['template'] == 'Tech' else v.get('/Text/OasisId')
        out = {
            'name': r['name'],
            'template': r['template'],
            'loca': {'english': self._en.get(int(line), ''), 'japanese': self._ja.get(int(line), '')} if line else None,
            'icon': v.get('/Standard/IconFilename') or None,
        }
        if r['template'] == 'AssetPool':
            out['members'] = sorted(set(m for m in self._flat_members(guid) if m != guid and m in self._R.raw))
        return out

    def get(self, guid, default=None):
        try:
            g = int(guid)
        except (TypeError, ValueError):
            return default
        if g not in self._cache:
            self._cache[g] = self._make(g)
        return self._cache[g] if self._cache[g] is not None else default

    def __getitem__(self, guid):
        value = self.get(guid)
        if value is None:
            raise KeyError(guid)
        return value

    def __contains__(self, guid) -> bool:
        return self.get(guid) is not None


def load_item_catalog(resolver: Resolver | None = None) -> dict:
    R = resolver or Resolver()
    en, ja = load_texts('english'), load_texts('japanese')
    items = []
    for guid in R.raw:
        if R.template_of(guid) not in ITEM_TEMPLATES:
            continue
        r = R.get(guid)
        if any(part in (r['name'] or '') for part in EXCLUDED_NAME_PARTS):
            continue
        v = r['v']
        oasis = v.get('/Text/OasisId')
        items.append({
            'guid': guid,
            'name': r['name'],
            'loca': {'english': en.get(int(oasis), ''), 'japanese': ja.get(int(oasis), '')} if oasis else None,
            'template': r['template'],
            'rarity': v.get('/Item[0]/Rarity') or 'Common',
            'niche': v.get('/Item[0]/Niche') or 'Finance',
            'tradePrice': _num(v.get('/Item[0]/TradePrice'), 1000.0),
            'effect': {
                'guid': guid,
                'scope': v.get('/Effect/EffectScope') or 'Local',
                'targets': _ids(v, '/Effect/Targets', 'GUID'),
                'buffs': _ids(v, '/Effect/Buffs', 'GUID'),
            },
        })
    # 並びは Planner と同じ: templates.xml でのテンプレートの定義順にまとめ、同じテンプレート内は assets.xml の順
    rank = {name: i for i, name in enumerate(R.templates)}
    items.sort(key=lambda i: rank[i['template']])
    return {'items': items, 'assets': Assets(R, en, ja)}
