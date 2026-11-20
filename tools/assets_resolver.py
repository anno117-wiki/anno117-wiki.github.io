"""assets.xml の資産を、既定値と継承を解決した形で読むモジュール。

assets.xml の資産は「既定値からの差分」だけを書く。値を得るには次の4層を下から重ねる。
  1. properties.xml  の DefaultContainerValues(コンテナごとの最下層の既定値)
  2. templates.xml   のテンプレート(資産の Template 名で選ぶ)
  3. BaseAssetGUID   で指す別の資産(あれば、その解決結果をテンプレートの代わりに使う)
  4. 資産自身の Values
重ね方の決まり:
  - 空要素 (<Cost />) は「基底をそのまま継承」。中身は消さない
  - Item の並びは、VectorElement/InheritedIndex があれば「基底のその番号の要素を上書き」。
    1つも無ければ「基底の並びを丸ごと置き換え」
  - 建物の Cost の枠(1番目=金 + 建材5枠)だけは GlobalConfig の DefaultValues にある

入力: _local/anno-official-data/v3.0.1-steam/ の assets.xml / templates.xml / properties.xml
      (Steam版の config.rda から RdaConsole で展開したもの)

使い方:
    from assets_resolver import Resolver
    R = Resolver()
    r = R.get(2955)   # {'template': 'Production', 'name': '...', 'v': {'/Cost/Costs/Item[1]/Amount': '2', ...}}
    R.raw             # {GUID: Asset要素} 未解決の生データ
"""
import copy
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / '_local' / 'anno-official-data' / 'v3.0.1-steam'


def flat(el: ET.Element, prefix: str = '', out: dict | None = None) -> dict:
    """要素を {パス: 値} に平坦化する。Item は Item[番号] で区別する"""
    if out is None:
        out = {}
    kids = list(el)
    if not kids:
        out[prefix] = (el.text or '').strip()
        return out
    counts: dict[str, int] = {}
    for k in kids:
        i = counts.get(k.tag, 0)
        counts[k.tag] = i + 1
        flat(k, f'{prefix}/{k.tag}' + (f'[{i}]' if k.tag == 'Item' else ''), out)
    return out


def _inherited_index(item: ET.Element) -> int | None:
    idx = item.findtext('VectorElement/InheritedIndex')
    return int(idx) if idx is not None else None


def merge(base: ET.Element, own: ET.Element) -> ET.Element:
    """base に own を上書きマージする(base を直接書き換える)"""
    items_done = False
    for child in own:
        if child.tag == 'Item':
            if items_done:
                continue
            items_done = True
            own_items = [c for c in own if c.tag == 'Item']
            base_items = [c for c in base if c.tag == 'Item']
            if any(_inherited_index(i) is not None for i in own_items):
                for it in own_items:
                    idx = _inherited_index(it)
                    if idx is not None and idx < len(base_items):
                        merge(base_items[idx], it)
                    else:
                        base.append(copy.deepcopy(it))
            else:
                for b in base_items:
                    base.remove(b)
                for it in own_items:
                    base.append(copy.deepcopy(it))
            continue
        target = base.find(child.tag)
        if target is None:
            base.append(copy.deepcopy(child))
        elif len(child) == 0:
            if len(target) > 0 and not (child.text or '').strip():
                continue  # 空要素は基底をそのまま継承
            target.text = child.text
        else:
            merge(target, child)
    return base


class Resolver:
    def __init__(self, data_dir: Path = DATA_DIR) -> None:
        for name in ('assets.xml', 'templates.xml', 'properties.xml'):
            if not (data_dir / name).exists():
                raise FileNotFoundError(f'{data_dir / name} が無い(Steam版の config.rda から展開して置く)')
        self.templates: dict[str, ET.Element] = {}
        for t in ET.parse(data_dir / 'templates.xml').getroot().iter('Template'):
            name, props = t.findtext('Name'), t.find('Properties')
            if name and props is not None:
                self.templates[name] = props
        props_root = ET.parse(data_dir / 'properties.xml').getroot()
        self.defaults: dict[str, ET.Element] = {}
        for d in props_root.iter('DefaultContainerValues'):
            for c in d:
                self.defaults[c.tag] = c
        for dv in props_root.iter('DefaultValues'):
            for c in dv:
                if c.tag == 'Cost' and c.find('Costs') is not None:
                    self.defaults['Cost'] = c
        self.raw: dict[int, ET.Element] = {}
        for _, el in ET.iterparse(data_dir / 'assets.xml', events=('end',)):
            if el.tag == 'Asset':
                g = el.findtext('Values/Standard/GUID')
                if g:
                    self.raw[int(g)] = el
        self._cache: dict[int, ET.Element] = {}

    def _with_defaults(self, el: ET.Element) -> ET.Element:
        """テンプレートの各コンテナに、properties.xml の既定値を下敷きとして重ねる"""
        for i, c in enumerate(list(el)):
            if c.tag in self.defaults:
                d = copy.deepcopy(self.defaults[c.tag])
                merge(d, c)
                el.remove(c)
                el.insert(i, d)
        return el

    def _values(self, guid: int) -> ET.Element:
        if guid in self._cache:
            return self._cache[guid]
        a = self.raw[guid]
        tpl = a.findtext('Template')
        base_guid = a.findtext('BaseAssetGUID')
        if base_guid and int(base_guid) in self.raw:
            el = copy.deepcopy(self._values(int(base_guid)))
        elif tpl in self.templates:
            el = self._with_defaults(copy.deepcopy(self.templates[tpl]))
        else:
            el = ET.Element('Values')
        own = a.find('Values')
        if own is not None:
            for c in own:
                if el.find(c.tag) is None and c.tag in self.defaults:
                    el.append(copy.deepcopy(self.defaults[c.tag]))
            merge(el, own)
        self._cache[guid] = el
        return el

    def template_of(self, guid: int) -> str | None:
        """Template 名。BaseAssetGUID で継承する資産は基底をたどる"""
        a = self.raw[guid]
        t = a.findtext('Template')
        if t:
            return t
        b = a.findtext('BaseAssetGUID')
        return self.template_of(int(b)) if b and int(b) in self.raw else None

    def get(self, guid: int) -> dict | None:
        """解決済みの資産 {'template', 'name', 'v'}。GUID が無ければ None"""
        if guid not in self.raw:
            return None
        v = flat(self._values(guid))
        return {
            'template': self.template_of(guid),
            'name': v.get('/Standard/Name') or None,  # BaseAssetGUID から継承した名前も含む
            'v': v,
        }
