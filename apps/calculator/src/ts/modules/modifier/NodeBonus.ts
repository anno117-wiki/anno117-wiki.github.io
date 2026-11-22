import type { Goods } from '@anno/shared';
import { ModifierRegistry } from '../ModifierRegistry';
import {
    AbstractProductionModifier,
    type ModifierDefinition,
    type ProductionModifierType,
    type SettingsSnapshot,
} from '../ProductionModifier';

/**
 * ノードごとに選ぶ補正（ノードを押すポップアップで設定する）。パネルには並べない。
 *  - 穀物庫（アイギュプトの農場など）: 範囲内にある穀物庫の段階で、生産性が上がる
 *  - 手入力: 一覧に無い補正や、実機で見た値を、生産性の足し算(%)として入れる
 */

/**
 * 穀物庫の効果の対象（assets.xml の効果 158334・158336・158337 の対象。プール「Asset Pool Egyptian All Agriculture」157680 の建物）。
 * 計算機のノードの guid（建物の GUID）と照らす
 */
const GRANARY_TARGET_GUIDS: ReadonlySet<string> = new Set([
    '151993', '151994', '151997', '152141', '152142', '152143', '152144', '152145', '152151',
    '152152', '152153', '152272', '155404', '155405', '155406', '155407', '155408', '155409',
]);

interface GranaryLevel {
    /** 設定の値（0 = 置かない） */
    level: number;
    /** 生産性の増え方（assets.xml のバフ 158335・158338・158339 の値 15・25・35） */
    value: number;
    icon: string | null;
    /** 表示名の翻訳キー */
    labelKey: string;
}

const GRANARY_LEVELS: readonly GranaryLevel[] = [
    { level: 0, value: 0, icon: null, labelKey: 'ui.nodeBonusGranaryNone' },
    { level: 1, value: 0.15, icon: 'granary.png', labelKey: 'ui.nodeBonusGranary1' },
    { level: 2, value: 0.25, icon: 'granary-large.png', labelKey: 'ui.nodeBonusGranary2' },
    { level: 3, value: 0.35, icon: 'granary-capacious.png', labelKey: 'ui.nodeBonusGranary3' },
];

/** 手入力の範囲（%）。入力ミスで極端な値にならないように */
const MANUAL_MIN = -100;
const MANUAL_MAX = 1000;

class NodeBonus extends AbstractProductionModifier {
    private settings: SettingsSnapshot = {};

    constructor() {
        super('nodeBonus');
    }

    static granaryKey(guid: string): string {
        return `node.${guid}.granary`;
    }

    static manualKey(guid: string): string {
        return `node.${guid}.manual`;
    }

    static isGranaryTarget(good: Pick<Goods, 'guid'>): boolean {
        return GRANARY_TARGET_GUIDS.has(String(good.guid));
    }

    static get granaryLevels(): readonly GranaryLevel[] {
        return GRANARY_LEVELS;
    }

    static clampManual(value: number): number {
        return Math.min(MANUAL_MAX, Math.max(MANUAL_MIN, value));
    }

    override loadConfig(): void {
        // 設定は SettingsManager が保存する
    }

    override saveConfig(): void {
        // 設定は SettingsManager が保存する
    }

    override applySettings(config: SettingsSnapshot): void {
        this.settings = { ...config };
    }

    override getType(): ProductionModifierType {
        return 'flat';
    }

    override getDefinition(): ModifierDefinition {
        return {
            id: 'nodeBonus',
            label: 'Node bonus',
            description: 'Per-node bonuses (granary, manual productivity) set from the node popup.',
            icon: 'granary.png',
            toggles: [],
            hidden: true,
        };
    }

    override getVisualModifier(): string | null {
        return null;
    }

    private granaryOf(good: Goods): GranaryLevel | null {
        if (!NodeBonus.isGranaryTarget(good)) return null;
        const raw = this.settings[NodeBonus.granaryKey(String(good.guid))];
        const found = GRANARY_LEVELS.find((l) => l.level === raw);
        return found && found.level > 0 ? found : null;
    }

    private manualOf(good: Goods): number {
        const raw = this.settings[NodeBonus.manualKey(String(good.guid))];
        return typeof raw === 'number' && Number.isFinite(raw) ? NodeBonus.clampManual(raw) : 0;
    }

    override getVisualModifiersForNode(good: Goods): string[] {
        const granary = this.granaryOf(good);
        return granary?.icon ? [granary.icon] : [];
    }

    override getValue(good: Goods): number {
        return (this.granaryOf(good)?.value ?? 0) + this.manualOf(good) / 100;
    }
}

function registerNodeBonusModifier(): void {
    ModifierRegistry.getInstance().register(new NodeBonus());
}

export { NodeBonus, registerNodeBonusModifier };
