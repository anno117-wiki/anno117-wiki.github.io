"""研究(スキル)の効果を、「対象 効果名 値」の行にするモジュール(Planner の techs.json の effectLines と同じ形)。

行の形: {'target': {english, japanese} または None, 'text': {english, japanese}, 'value': '+10%' または None}

規則(Planner の出力と照合して決めたもの):
  - 行は、研究の効果(/Tech/Rewards/Effects)の順に、効果ごとのバフの項目を、_for_buff の順で並べる
  - target は、効果の対象(/Effect/Targets)の最初の資産の名前。対象を文に入れる項目や、対象が無い項目は None
  - text は、対応表 ItemInfotipTextFeature(GUID 142928)の BuffUpgradeTextAndIcons の文言(日英とも XML から)。
    文言の {} には、属性名・建物名・商品名を日英それぞれの言葉で差し込む
  - value は、符号つきの数。単位は項目ごとに決める(%・なし)。向きが「減る」意味の項目は符号を逆にする

使い方:
    from assets_effect_lines import EffectLines
    lines = EffectLines(resolver).for_tech(153950)
"""
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import Resolver  # noqa: E402
from assets_texts import load_texts  # noqa: E402

INFOTIP = 142928
ATTRIBUTES = ('Population', 'Money', 'Happiness', 'Health', 'FireSafety', 'Belief', 'Knowledge', 'Prestige')


class UnsupportedProperty(Exception):
    """まだ文にできないバフの項目（黙って落とさず、エラーにする）"""


@dataclass(frozen=True)
class Spec:
    path: str          # バフの中の項目（例 'FactoryUpgrade/ProductivityUpgrade'）
    buff_type: str     # 対応表の効果の種類（例 'BuffProductivity'）
    unit: str = ''     # 値の単位（'%' か ''）
    flip: bool = False  # 符号を逆にする（「影響を減らす」項目）


# 数値だけで決まる項目（Value をそのまま符号つきで出す）。上から順に行になる
PRODUCTIVITY = Spec('FactoryUpgrade/ProductivityUpgrade', 'BuffProductivity', '%')
AFTER_AREA_SPECS: tuple[Spec, ...] = (
    Spec('MaintenanceUpgrade/MaintenanceFactorUpgrade', 'BuffMaintenance', '%'),
    Spec('MaintenanceUpgrade/WorkforceMaintenanceFactorUpgrade', 'BuffWorkforceAmount', '%'),
    Spec('AqueductUpgrade/AqueductConsumedWaterUpgrade', 'BuffAqueductConsumption', '%'),
    Spec('AqueductUpgrade/AqueductWaterSupplyUpgrade', 'BuffAqueductProduction', '%'),
    Spec('IrrigationUpgrade/PipeCapacityUpgrade', 'BuffIrrigationCapacity', ''),
    Spec('HealthUpgrade/BaseHealthUpgrade', 'BuffHitpoints', '%'),
    Spec('MovementUpgrade/BuffReduceCargoImpactUpgrade', 'BuffReduceSpeedImpactOfWeight', '%', flip=True),
    Spec('MovementUpgrade/BuffReduceNegativeRiverCurrentImpactUpgrade', 'BuffReduceNegativeSpeedImpactOfRiverCurrent', '%', flip=True),
)


# 文を作るときに読む（消費する）バフの項目。ここに無い項目が値を持っていると UnsupportedProperty
HANDLED = {
    '/FactoryUpgrade/ProductivityUpgrade', '/BuildingUpgrade/AdditionalAttributes', '/BuildingUpgrade/AdditionalFunctionalEffect',
    '/MaintenanceUpgrade/MaintenanceFactorUpgrade', '/MaintenanceUpgrade/WorkforceMaintenanceFactorUpgrade',
    '/AqueductUpgrade/AqueductConsumedWaterUpgrade', '/AqueductUpgrade/AqueductWaterSupplyUpgrade',
    '/IrrigationUpgrade/PipeCapacityUpgrade', '/HealthUpgrade/BaseHealthUpgrade',
    '/MovementUpgrade/BuffReduceCargoImpactUpgrade', '/MovementUpgrade/BuffReduceNegativeRiverCurrentImpactUpgrade',
    '/WarehouseUpgrade/OverflowStorageRiskMultiplierUpgrade', '/FactoryUpgrade/CanUseForest', '/FactoryUpgrade/CanUseMeadow',
    '/FactoryUpgrade/CanUseMarsh', '/DistributionUpgrade/AddDeltas', '/ResidenceUpgrade/NeedProvidedNeedAttributes',
    '/FactoryUpgrade/AddedFertility', '/FactoryUpgrade/FertilityPercent', '/AreaBuff/AddedAreaFertility', '/AreaBuff/AreaFertilityPercent',
    '/AreaBuff/RadiusEffectRangeUpgrade', '/AreaBuff/RadiusEffectRangeTarget', '/AreaPassiveTradeUpgrade/PassiveTradeReward',
}
# 値が0や、意味のない既定値のときは無視してよい項目
NOISE = {'/FactoryUpgrade/AdditionalOutput', '/TradeShipUpgrade/ActiveTradePriceInPercent', '/FactoryUpgrade/FertilityPercent', '/AreaBuff/AreaFertilityPercent'}


class EffectLines:
    def __init__(self, resolver: Resolver | None = None) -> None:
        self.R = resolver or Resolver()
        self.en, self.ja = load_texts('english'), load_texts('japanese')
        self.infotip = self.R.get(INFOTIP)['v']

    # --- 文言 ---
    def _loca(self, line_id) -> dict | None:
        if not line_id:
            return None
        return {'english': self.en.get(int(line_id), ''), 'japanese': self.ja.get(int(line_id), '')}

    def _table(self, path: str) -> dict | None:
        """対応表 BuffUpgradeTextAndIcons の文言。例 'BuffProductivity/Text'"""
        return self._loca(self.infotip.get(f'/ItemInfotipTextFeature/BuffUpgradeTextAndIcons/{path}'))

    def _name_of(self, guid: int) -> dict | None:
        r = self.R.get(guid)
        if r is None:
            return None
        v = r['v']
        return self._loca(v.get('/Tech/TechName') if r['template'] == 'Tech' else v.get('/Text/OasisId'))

    @staticmethod
    def _plain(text: str) -> dict:
        return {'english': text, 'japanese': text}

    @staticmethod
    def _fill(template: dict | None, *args: dict | None) -> dict | None:
        """文言の {} を順に差し込む（日英それぞれ）"""
        if template is None:
            return None
        out = {}
        for lang in ('english', 'japanese'):
            text = template[lang]
            for a in args:
                text = text.replace('{}', (a or {}).get(lang, ''), 1)
            out[lang] = text
        return out

    # --- 値 ---
    @staticmethod
    def _number(x: float) -> str:
        return str(int(x)) if float(x).is_integer() else f'{x:g}'

    def _value(self, raw: float, unit: str = '', flip: bool = False, signed: bool = True) -> str:
        v = -raw if flip else raw
        sign = ('+' if v > 0 else ('-' if v < 0 else '')) if signed else ''
        return f'{sign}{self._number(abs(v))}{unit}'

    # --- 研究の行 ---
    def for_tech(self, guid: int) -> list[dict]:
        v = self.R.get(guid)['v']
        out: list[dict] = []
        for _, effect in sorted(_items(v, '/Tech/Rewards/Effects', 'EffectAsset')):
            out += self._for_effect(int(effect))
        return out

    def _for_effect(self, effect: int) -> list[dict]:
        ev = self.R.get(effect)['v']
        targets = [int(x) for _, x in sorted(_items(ev, '/Effect/Targets', 'GUID'))]
        target = self._name_of(targets[0]) if targets else None
        lines: list[dict] = []
        for _, buff in sorted(_items(ev, '/Effect/Buffs', 'GUID')):
            bv = self.R.get(int(buff))['v']
            for has_target, text, value in self._for_buff(bv):
                lines.append({'target': target if has_target else None, 'text': text, 'value': value})
        if not lines and ev.get('/Standard/InfoDescription'):
            # バフに数値の変化が無い効果は、効果自身の説明文が行になる（例: 見張りが崩壊した建物を修理できる）
            lines.append({'target': target, 'text': self._loca(ev['/Standard/InfoDescription']), 'value': None})
        return lines

    def _spec_line(self, bv: dict, spec: Spec):
        raw = bv.get(f'/{spec.path}/Value')
        if raw is not None:
            return True, self._table(f'{spec.buff_type}/Text'), self._value(float(raw), spec.unit, spec.flip)
        return None

    @staticmethod
    def _check_supported(bv: dict) -> None:
        for key, value in bv.items():
            if key.startswith(('/Standard', '/Text', '/Buff/', '/Locked')) or value in ('', '0', '[NONE]'):
                continue
            prop = '/' + '/'.join(key.split('/')[1:3])
            if prop in HANDLED or prop in NOISE or key.startswith('/FactoryUpgrade/AdditionalOutput/'):
                continue
            raise UnsupportedProperty(f'{key} = {value}')

    def _for_buff(self, bv: dict):
        """バフ1つの行 (対象を付けるか, 文言, 値)。並びは Planner と同じ"""
        self._check_supported(bv)
        line = self._spec_line(bv, PRODUCTIVITY)
        if line:
            yield line
        # 建物への属性の加算（収入・名声など）
        for attr in ATTRIBUTES:
            raw = bv.get(f'/BuildingUpgrade/AdditionalAttributes/{attr}/AmountOrPercent/Value')
            if raw is not None:
                percent = bv.get(f'/BuildingUpgrade/AdditionalAttributes/{attr}/AmountOrPercent/Percental') == '1'
                yield True, self._table(f'BuffAdditionalNeedAttributes/Attributes/{attr}/Text'), self._value(float(raw), '%' if percent else '')
        # 範囲効果（機能効果のバフの属性）
        fe = bv.get('/BuildingUpgrade/AdditionalFunctionalEffect')
        if fe:
            for text, value in self._area_effect(int(fe)):
                yield True, text, value
        # 維持費・労働力・水・水路など
        for spec in AFTER_AREA_SPECS:
            line = self._spec_line(bv, spec)
            if line:
                yield line
        # 倉庫のネズミのリスク
        raw = bv.get('/WarehouseUpgrade/OverflowStorageRiskMultiplierUpgrade/Value')
        if raw is not None:
            yield True, self._table('BuffOverflowStorageRiskMultiplier/TextThresholds/Item[0]/Text'), self._value(float(raw), '%')
        # 土地の使い方（森・農地・湿地）
        for key, label in (('CanUseForest', 'ForestText'), ('CanUseMeadow', 'MeadowText'), ('CanUseMarsh', 'MarshText')):
            if bv.get(f'/FactoryUpgrade/{key}') == '1':
                yield True, self._table(f'BuffCanUseTerrain/{label}'), '+1'
        # 総督のヴィラなどの労働力の増加
        for i, product in sorted(_items(bv, '/DistributionUpgrade/AddDeltas', 'Product')):
            amount = float(bv.get(f'/DistributionUpgrade/AddDeltas/Item[{i}]/Amount', 0))
            yield True, self._name_of(int(product)), self._value(amount)
        # 範囲内の需要の属性（「市場から人口、供給されていれば」）
        provided = bv.get('/ResidenceUpgrade/NeedProvidedNeedAttributes/ChangeNeedAttributesOf/Item[0]/ProvidedProduct')
        if provided:
            for attr in ATTRIBUTES:
                raw = bv.get(f'/ResidenceUpgrade/NeedProvidedNeedAttributes/AdditionalNeedAttributes/{attr}/AmountOrPercent/Value')
                if raw is not None:
                    text = self._fill(self._table('BuffAdditionalNeedAttributes/AttributeFromProvidedNeed'),
                                      self._table(f'BuffAdditionalNeedAttributes/Attributes/{attr}/Text'), self._name_of(int(provided)))
                    yield True, text, self._value(float(raw))
        # 追加の肥沃度（工場）
        added = bv.get('/FactoryUpgrade/AddedFertility')
        if added:
            pct = float(bv.get('/FactoryUpgrade/FertilityPercent', 0))
            yield True, self._fill(self._table('BuffFertility/Text'), self._name_of(int(added))), self._value(pct, '%', signed=False)
        # 範囲の肥沃度（鉱山など）
        added = bv.get('/AreaBuff/AddedAreaFertility')
        if added:
            pct = float(bv.get('/AreaBuff/AreaFertilityPercent', 0))
            yield True, self._name_of(int(added)), self._value(pct, '%', signed=False)
        # 効果範囲の拡大（建物名を文に入れる。対象は付けない）
        raw = bv.get('/AreaBuff/RadiusEffectRangeUpgrade/Value')
        if raw is not None:
            target = bv.get('/AreaBuff/RadiusEffectRangeTarget/Item[0]/Target')
            yield False, self._fill(self._table('BuffEffectRadius/Text'), self._name_of(int(target)) if target else None), self._value(float(raw), '%')
        # NPCへの売却で得るもの
        base = '/AreaPassiveTradeUpgrade/PassiveTradeReward/Item[0]'
        if bv.get(f'{base}/RewardProduct'):
            reward = self._plain(self._number(float(bv[f'{base}/RewardAmount'])))
            sold = self._plain(self._number(float(bv[f'{base}/SoldAmount'])))
            text = self._fill(self._table('BuffPassiveTradeBonus/RewardText'), reward, self._name_of(int(bv[f'{base}/RewardProduct'])),
                              sold, self._name_of(int(bv[f'{base}/SoldProduct'])))
            yield False, text, None

    def _area_effect(self, functional_effect: int):
        """範囲効果: 機能効果のバフの属性ごとに「<属性> エリア効果」(文, 値)"""
        ev = self.R.get(functional_effect)['v']
        for _, buff in sorted(_items(ev, '/Effect/Buffs', 'GUID')):
            bv = self.R.get(int(buff))['v']
            for attr in ATTRIBUTES:
                raw = bv.get(f'/BuildingUpgrade/AdditionalAttributes/{attr}/AmountOrPercent/Value')
                if raw is not None:
                    attr_text = self._table(f'BuffAdditionalNeedAttributes/Attributes/{attr}/Text')
                    yield self._fill(self._table('BuffAdditionalNeedAttributes/AttributeInRange'), attr_text), self._value(float(raw))


def _items(v: dict, base: str, key: str):
    """base/Item[i]/key の (i, 値) を返す"""
    pattern = re.compile(re.escape(base) + r'/Item\[(\d+)\]/' + key)
    for k, val in v.items():
        m = pattern.fullmatch(k)
        if m:
            yield int(m.group(1)), val
