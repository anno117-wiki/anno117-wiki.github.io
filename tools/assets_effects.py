"""assets.xml から、効果(Effect)とバフ(Buff)のデータを Planner の effects.json / buffs.json と同じ形で作るモジュール。

目的: 生成スクリプトが読む Planner の effects.json / buffs.json を、ゲームの assets.xml に置き換える。

作る項目(Planner と同じ名前。キーは文字列の GUID):
  load_effects() -> {guid: {guid, name, scope, buffs, targetPools, targets, duration}}
      scope は省略時 Local。targetPools は XML に書かれた対象、targets はそのプール(入れ子あり)を建物などに展開し、
      ExcludeFromTargets を引いたもの。存在しない資産への参照は落とす。duration は秒
  load_buffs()   -> {guid: {guid, name, template, sourceCategory, calc}}
      calc は建物への加算の集計のうち attributes（属性への加算: Happiness・Prestige・Money など）と
      attributesPercent（割合で加算するもの）だけ。Planner の calc にある他の集計
      （productivity・areaAttributes・providedNeeds など）は、まだ作らない。

XML での探し方:
  - 効果 /Effect/EffectScope・/Effect/Buffs・/Effect/Targets・/Effect/ExcludeFromTargets・/Effect/TimedEffect/EffectDuration
  - バフの属性加算 /BuildingUpgrade/AdditionalAttributes/<属性>/AmountOrPercent/Value、Percental が 1 なら割合

使い方:
    from assets_effects import load_buffs, load_effects
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402


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


def load_effects(resolver: Resolver | None = None) -> dict[str, dict]:
    R = resolver or Resolver()
    cache: dict[int, dict | None] = {}

    def get(g: int):
        if g not in cache:
            cache[g] = R.get(g)
        return cache[g]

    def expand(guid: int, seen: tuple = ()) -> list[int]:
        """AssetPool(入れ子あり)を個々の GUID に展開する"""
        r = get(guid)
        if r and r['template'] == 'AssetPool' and guid not in seen:
            return [m for x in _ids(r['v'], '/AssetPool/AssetList', 'Asset') for m in expand(x, seen + (guid,))]
        return [guid]

    def real(guids: list[int]) -> set[int]:
        return {m for t in guids for m in expand(t) if m in R.raw}

    effect_templates = {n for n, p in R.templates.items() if p.find('Effect') is not None}
    out: dict[str, dict] = {}
    for guid in R.raw:
        if R.template_of(guid) not in effect_templates:
            continue
        r = get(guid)
        v = r['v']
        pools = _ids(v, '/Effect/Targets', 'GUID')
        out[str(guid)] = {
            'guid': guid,
            'name': r['name'],
            'scope': v.get('/Effect/EffectScope') or 'Local',
            'buffs': _ids(v, '/Effect/Buffs', 'GUID'),
            'targetPools': pools,
            'targets': sorted(real(pools) - real(_ids(v, '/Effect/ExcludeFromTargets', 'GUID'))),
            'duration': _num(v.get('/Effect/TimedEffect/EffectDuration')) / 1000,
        }
    return out


def load_buffs(resolver: Resolver | None = None) -> dict[str, dict]:
    R = resolver or Resolver()
    out: dict[str, dict] = {}
    for guid in R.raw:
        tpl = R.template_of(guid)
        if not tpl or 'Buff' not in tpl:
            continue
        r = R.get(guid)
        v = r['v']
        attributes: dict[str, float] = {}
        percent: dict[str, float] = {}
        for k, val in v.items():
            m = re.fullmatch(r'/BuildingUpgrade/AdditionalAttributes/(\w+)/AmountOrPercent/Value', k)
            if m:
                is_percent = v.get(k.replace('/Value', '/Percental')) == '1'
                (percent if is_percent else attributes)[m.group(1)] = _num(val)
        calc = {}
        if attributes:
            calc['attributes'] = attributes
        if percent:
            calc['attributesPercent'] = percent
        out[str(guid)] = {
            'guid': guid,
            'name': r['name'],
            'template': tpl,
            'sourceCategory': v.get('/Buff/SourceCategory'),
            'calc': calc or None,
        }
    return out
