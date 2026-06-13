import type { Goods } from '@anno/shared';
import { GoodsRepository } from '@anno/shared';
import { ModifierRegistry } from '../ModifierRegistry';
import { I18nManager } from '@anno/shared';
import {
	AbstractProductionModifier,
	type ModifierDefinition,
	type ModifierToggleDefinition,
	type ProductionModifierType,
	type SettingsSnapshot,
} from '../ProductionModifier';

function normalizeGoodName(name: string): string {
	return name.trim().toLowerCase().replace(/[_-]/g, ' ');
}

class Item extends AbstractProductionModifier {
	static readonly KEYS = {
		enabled: 'item.enabled',
		chainPrefix: 'item.chain',
	} as const;

	private static activeChainId: string | null = null;

	private readonly repository: GoodsRepository;
	private readonly i18n: I18nManager;
	private latestSettings: SettingsSnapshot;

	constructor() {
		super('item');
		this.repository = GoodsRepository.getInstance();
		this.i18n = I18nManager.getInstance();
		this.latestSettings = {};
	}

	static setActiveChain(chainId: string | null): void {
		// 変更がなければ何もしない（無駄な再描画を防ぐ）
		if (Item.activeChainId === chainId) return;

		console.log('[Item] setActiveChain called with:', chainId);
		Item.activeChainId = chainId;

		// ModifierPanelに変更を通知してアイテムリストを更新
		try {
			ModifierRegistry.getInstance().notifyDefinitionsChanged();
		} catch (error) {
			console.error('[Item] Failed to notify definitions changed:', error);
		}
	}

	static getChainSettingKey(chainId: string): string {
		return `${Item.KEYS.chainPrefix}.${chainId}.enabled`;
	}

	static getItemSettingKey(chainId: string, guid: string): string {
		return `${Item.KEYS.chainPrefix}.${chainId}.item.${guid}`;
	}

	static getActiveGuidsForChain(settings: SettingsSnapshot, chainId: string): string[] {
		const prefix = `${Item.KEYS.chainPrefix}.${chainId}.item.`;
		const guids: string[] = [];
		for (const [key, value] of Object.entries(settings)) {
			if (!key.startsWith(prefix) || value !== true) continue;
			const guid = key.slice(prefix.length).trim();
			if (guid) {
				guids.push(guid);
			}
		}
		return guids;
	}

	override loadConfig(): void {
		// Item modifier state is persisted by SettingsManager.
	}

	override saveConfig(): void {
		// Item modifier state is persisted by SettingsManager.
	}

	override applySettings(config: SettingsSnapshot): void {
		this.latestSettings = { ...config };
	}

	override getType(): ProductionModifierType {
		return 'flat';
	}

	override getDefinition(): ModifierDefinition {
		const toggles: ModifierToggleDefinition[] = [];

		const activeChainId = Item.activeChainId;
		console.log('[Item] getDefinition called, activeChainId:', activeChainId);

		if (activeChainId) {
			const allChains = this.repository.getCompatibleItemChains();
			console.log('[Item] Available chain IDs:', allChains.map(c => c.id));

			const chain = allChains.find((c) => c.id === activeChainId);
			console.log('[Item] Found chain for activeChainId:', chain ? chain.id : 'NOT FOUND');

			if (chain) {
				console.log('[Item] Chain items count:', chain.items.length);
				for (const item of chain.items) {
					const pct = this.repository.getItemProductivity(item.guid);
					const icon = item.iconFilename ? `items/${item.iconFilename}` : 'infrastructure/coastal.png';
					const localizedName = this.i18n.t(`specialists.${item.guid}`);
					toggles.push({
						key: this.getItemKey(chain.id, item.guid),
						label: localizedName,
						description: `${chain.displayName}: +${this.formatPercent(pct)} productivity`,
						icon,
					});
				}
			} else {
				console.warn('[Item] No chain found for activeChainId:', activeChainId);
			}
		}

		console.log('[Item] Returning definition with toggles count:', toggles.length);
		return {
			id: 'item',
			label: 'Items',
			description: 'Apply per-item productivity boosts from compatible item sets.',
			icon: 'infrastructure/coastal.png',
			toggles,
		};
	}

	override getVisualModifier(): string | null {
		return null;
	}

	override getVisualModifierForNode(good: Goods): string | null {
		const activeChainId = Item.activeChainId;
		if (!activeChainId) return null;

		const goodName = normalizeGoodName(good.name ?? '');
		if (!goodName) return null;

		const chain = this.repository
			.getCompatibleItemChains()
			.find((c) => c.id === activeChainId);
		if (!chain) return null;

		for (const item of chain.items) {
			if (!this.readBool(this.getItemKey(activeChainId, item.guid))) continue;
			if (!item.iconFilename) continue;
			const targets = this.repository.getItemTargetGoodNames(item.guid);
			if (targets.has(goodName)) {
				return `items/${item.iconFilename}`;
			}
		}

		return null;
	}

	override getValue(good: Goods): number {
		const activeChainId = Item.activeChainId;
		if (!activeChainId) return 0;

		const goodName = normalizeGoodName(good.name ?? '');
		if (!goodName) return 0;

		const compatibleItems = this.repository.getCompatibleItems(activeChainId);
		let productivity = 0;

		for (const item of compatibleItems) {
			if (!this.readBool(this.getItemKey(activeChainId, item.guid))) continue;
			const targets = this.repository.getItemTargetGoodNames(item.guid);
			if (targets.has(goodName)) {
				productivity += this.repository.getItemProductivity(item.guid);
			}
		}

		return productivity;
	}

	private getItemKey(chainId: string, guid: string): string {
		return Item.getItemSettingKey(chainId, guid);
	}

	private readBool(key: string): boolean {
		return typeof this.latestSettings[key] === 'boolean' && Boolean(this.latestSettings[key]);
	}

	private formatPercent(value: number): string {
		const percent = value * 100;
		return Number.isInteger(percent) ? percent.toString() + '%' : percent.toFixed(2) + '%';
	}
}

function registerItemModifier(): void {
	ModifierRegistry.getInstance().register(new Item());
}

export { Item };
export { registerItemModifier };
