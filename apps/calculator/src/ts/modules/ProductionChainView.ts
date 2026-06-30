import type { RecipeListItem } from '@anno/shared';
import type { Goods } from '@anno/shared';
import { GoodsRepository } from '@anno/shared';
import { ModifierRegistry } from './ModifierRegistry';
import { Item } from './modifier/Item';
import { SettingsManager } from './SettingsManager';
import { I18nManager } from '@anno/shared';
import { formatDuration, formatBuildingCount, attachCostTooltip, toTitleCase } from './Utils';
import type { BuildingsMap } from './ProductionCalculator';
import { ASSETS_ICONS_PATH } from '../constants';

interface ProductionChainViewConfig {
    container: HTMLElement;
    calculator: {
        cloneRecipe(recipe: Goods): Goods;
        collectBaseInputs(recipe: Goods): Map<string, Goods>;
        findRecommendedRate(recipe: Goods): number;
        getAdjustedTime(node: Goods): number;
        collectAllBuildings(recipe: Goods, rate: number, accum: BuildingsMap): BuildingsMap;
        calculateFuelBuildings(recipe: Goods, allBuildings: BuildingsMap): Array<{ id: string; count: number }>;
        calculateTotals(allBuildings: BuildingsMap): { buildingCost: Record<string, number>; maintenance: Record<string, number> };
    };
    graphRenderer: {
        attach(container: HTMLElement, selectedGoodId?: string): Promise<void>;
        render(productionData: Goods, allBuildings: BuildingsMap): void;
    };
}

interface FuelInfo {
    id: string;
    burning_time?: number;
}

interface BaseBuildingInfo {
    id: string;
}

class ProductionChainView {
    container: HTMLElement;
    goodsRepository: GoodsRepository;
    settingsManager: SettingsManager;
    modifierRegistry: ModifierRegistry;
    i18n: I18nManager;
    calculator: ProductionChainViewConfig['calculator'];
    graphRenderer: ProductionChainViewConfig['graphRenderer'];
    currentGood: RecipeListItem | null;
    sourceRecipe: Goods | null;
    currentRate: number;
    baseInputs: Map<string, Goods>;
    graphHost: HTMLElement | null;
    targetInput: HTMLInputElement | null;
    recommendButton: HTMLElement | null;
    buildingCostElement: HTMLElement | null;
    maintenanceElement: HTMLElement | null;
    onBack: (() => void) | null;

    constructor(config: ProductionChainViewConfig) {
        const { container, calculator, graphRenderer } = config;
        this.container = container;
        this.goodsRepository = GoodsRepository.getInstance()!;
        this.settingsManager = SettingsManager.getInstance();
        this.modifierRegistry = ModifierRegistry.getInstance();
        this.i18n = I18nManager.getInstance();
        this.calculator = calculator;
        this.graphRenderer = graphRenderer;
        this.currentGood = null;
        this.sourceRecipe = null;
        this.currentRate = 1;
        this.baseInputs = new Map();
        this.graphHost = null;
        this.targetInput = null;
        this.recommendButton = null;
        this.buildingCostElement = null;
        this.maintenanceElement = null;
        this.onBack = null;
    }

    setBackHandler(handler: () => void): void {
        this.onBack = () => {
            document.getElementById('app-topbar-slot')?.replaceChildren();
            handler();
        };
    }

    hasSelection(): boolean {
        return Boolean(this.currentGood && this.sourceRecipe);
    }

    showLoading(good: RecipeListItem): void {
        this.currentGood = good;
        this.container.classList.remove('hidden');
        const chainLabel = this.i18n.t('ui.dependencyGraph');
        const backLabel = this.i18n.t('ui.back');
        this.container.innerHTML = `
            <div class="calculator-header">
                <button type="button" class="back-button" data-action="back">${backLabel}</button>
                <h3>${chainLabel}: ${good.displayName}</h3>
            </div>
            <div class="calculator-content">
                <p>${this.i18n.t('ui.loadingProductionData')} <strong>${good.displayName}</strong>...</p>
            </div>
        `;
        this.bindBackButton();
    }

    async showChain(good: RecipeListItem, recipe: Goods, options: { preserveRate?: boolean } = {}): Promise<void> {
        this.currentGood = good;
        if (!options.preserveRate || !this.sourceRecipe) {
            this.sourceRecipe = this.calculator.cloneRecipe(recipe);
        }
        await this.renderFromSource({ preserveRate: Boolean(options.preserveRate) });
    }

    async refresh(): Promise<void> {
        if (!this.hasSelection()) return;
        await this.renderFromSource({ preserveRate: true });
    }

    async renderFromSource(options: { preserveRate: boolean }): Promise<void> {
        if (!this.sourceRecipe || !this.currentGood) return;
        if (!options.preserveRate) {
            this.currentRate = 1;
        }
        Item.setActiveChain(this.currentGood.id);
        const recipe = this.calculator.cloneRecipe(this.sourceRecipe);
        this.baseInputs = this.calculator.collectBaseInputs(recipe);
        this.container.classList.remove('hidden');
        // topbarを上段スロットに描画
        const topbarSlot = document.getElementById('app-topbar-slot');
        if (topbarSlot) topbarSlot.innerHTML = this.buildTopbarMarkup(this.currentGood);
        // center-panelにはgraph-panelのみ
        this.container.innerHTML = this.buildMarkup();
        this.graphHost = this.container.querySelector('[data-role="graph-host"]') as HTMLElement | null;
        // topbarの要素はdocumentレベルで取得
        this.targetInput = document.querySelector('#target-rate') as HTMLInputElement | null;
        this.recommendButton = document.querySelector('#recommend-ratio-btn') as HTMLElement | null;
        this.buildingCostElement = document.querySelector('#total-construction-cost') as HTMLElement | null;
        this.maintenanceElement = document.querySelector('#total-maintenance-cost') as HTMLElement | null;
        this.bindBackButton();
        this.bindControls(recipe);
        if (this.graphHost) {
            await this.graphRenderer.attach(this.graphHost, this.currentGood.id);
        }
        this.updateCalculations(recipe);
    }

    applySettingsToCurrentView(): void {
        if (!this.sourceRecipe || !this.currentGood) return;
        this.syncModifierControlState();
        const recipe = this.calculator.cloneRecipe(this.sourceRecipe);
        this.baseInputs = this.calculator.collectBaseInputs(recipe);
        this.updateCalculations(recipe);
        this.updateTimeBadges(recipe);
    }

    async refreshView(): Promise<void> {
        if (!this.sourceRecipe || !this.currentGood) return;
        // 言語変更時は完全に再描画
        await this.renderFromSource({ preserveRate: true });
    }

    bindBackButton(): void {
        const backButton = document.querySelector('[data-action="back"]') as HTMLElement;
        backButton?.addEventListener('click', () => this.onBack?.());
    }

    bindControls(recipe: Goods): void {
        if (this.targetInput) {
            this.targetInput.value = (this.currentRate ?? 1).toString();
            this.targetInput.addEventListener('input', () => {
                const value = parseFloat(this.targetInput!.value);
                this.currentRate = Number.isFinite(value) && value >= 0 ? value : 0;
                this.updateCalculations(recipe);
            });
        }
        this.recommendButton?.addEventListener('click', () => {

            const recommended = this.calculator.findRecommendedRate(recipe);

            this.currentRate = recommended;
            if (this.targetInput) {
                this.targetInput.value = recommended.toFixed(2);
            }

            this.updateCalculations(recipe);
        });

        this.container.querySelectorAll('[data-setting-key]').forEach((node) => {
            node.addEventListener('click', () => {
                const button = node as HTMLButtonElement;
                const key = button.dataset.settingKey;
                const requires = button.dataset.settingRequires;
                if (!key) return;
                if (requires && !this.settingsManager.getSetting(requires)) return;
                this.settingsManager.toggleSetting(key);
            });
        });

        this.container.querySelectorAll('[data-setting-num-key]').forEach((node) => {
            node.addEventListener('input', () => {
                const input = node as HTMLInputElement;
                const key = input.dataset.settingNumKey;
                const requires = input.dataset.settingRequires;
                if (!key) return;
                if (requires && !this.settingsManager.getSetting(requires)) return;
                const val = parseFloat(input.value);
                if (Number.isFinite(val)) this.settingsManager.setSettingValue(key, val);
            });
        });

        this.container.querySelectorAll('[data-setting-select-key]').forEach((node) => {
            node.addEventListener('change', () => {
                const select = node as HTMLSelectElement;
                const key = select.dataset.settingSelectKey;
                const requires = select.dataset.settingRequires;
                if (!key) return;
                if (requires && !this.settingsManager.getSetting(requires)) return;
                this.settingsManager.setSettingValue(key, select.value);
            });
        });
    }

    buildTopbarMarkup(good: RecipeListItem): string {
        const chainLabel = this.i18n.t('ui.dependencyGraph');
        const backLabel = this.i18n.t('ui.back');
        return `
            <div class="calculator-topbar">
                <button class="back-button" type="button" data-action="back" aria-label="${backLabel}">${backLabel}</button>
                <span class="topbar-separator">|</span>
                <span class="topbar-title">${chainLabel}: ${good.displayName}</span>
                <span class="topbar-separator">|</span>
                <label for="target-rate">${this.i18n.t('ui.outputPerMinute')}</label>
                <input id="target-rate" type="number" min="0" step="1" value="${this.currentRate ?? 1}" />
                <button id="recommend-ratio-btn" type="button" class="recommend-button" title="整数建物数になる最適レートを自動設定します">${this.i18n.t('ui.autoRatio')}</button>
            </div>
        `;
    }

    buildMarkup(): string {
        return `
            <div class="calculator-content">
                <div class="graph-panel">
                    <div class="production-graph">
                        <div class="graph-host" data-role="graph-host"></div>
                    </div>
                </div>
            </div>
        `;
    }

    buildBaseInputCards(baseInputs: Map<string, Goods> = new Map()): string {
        const cards: string[] = [];
        const goodsList = this.goodsRepository.getGoodsList();

        baseInputs.forEach((input, id) => {
            const goodsListEntry = goodsList.find((g: RecipeListItem) => g.id === id);
            const displayName = goodsListEntry?.displayName || input.name || id;
            const icon = goodsListEntry?.icon || input.id || id;
            const time = this.buildTimeBadge(input, id);
            cards.push(`
                <div class="production-card" data-input-id="${id}">
                    <div class="production-card-icon">
                        <img src="${ASSETS_ICONS_PATH}${icon}.png" alt="${displayName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="icon-placeholder" style="display:none;">${icon.substring(0, 2).toUpperCase()}</div>
                    </div>
                    <div class="production-card-name">${displayName}</div>
                    ${time}
                    <div class="production-card-count" data-building-count="${id}">0.00x</div>
                </div>
            `);
        });

        const content = cards.length
            ? cards.join('')
            : `<p class="production-empty-note">${this.i18n.t('ui.noDirectBaseInput')}</p>`;

        return `
            <div class="production-info production-info-compact">
                <h4>${this.i18n.t('ui.inputs')}</h4>
                <div class="production-grid compact-grid">
                    ${content}
                </div>
            </div>
        `;
    }

    buildFuelCards(fuelList: FuelInfo[] = []): string {
        const goodsList = this.goodsRepository.getGoodsList();

        const cards = fuelList.map((fuel) => {
            const goodsListEntry = goodsList.find((g: RecipeListItem) => g.id === fuel.id);
            const displayName = goodsListEntry?.displayName || fuel.id;
            const icon = goodsListEntry?.icon || fuel.id;
            const burnLabel = fuel.burning_time ? `<div class="production-card-time">${formatDuration(fuel.burning_time)}</div>` : '';
            return `
                <div class="production-card">
                    <div class="production-card-icon">
                        <img src="${ASSETS_ICONS_PATH}${icon}.png" alt="${displayName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="icon-placeholder" style="display:none;">${icon.substring(0, 2).toUpperCase()}</div>
                    </div>
                    <div class="production-card-name">${displayName}</div>
                    ${burnLabel}
                    <div class="production-card-count" data-fuel-building-count="${fuel.id}">0.00x</div>
                </div>
            `;
        });

        const content = cards.length
            ? cards.join('')
            : `<p class="production-empty-note">${this.i18n.t('ui.noFuelDependency')}</p>`;

        return `
            <div class="production-info production-info-compact">
                <h4>${this.i18n.t('ui.fuel')}</h4>
                <div class="production-grid compact-grid">
                    ${content}
                </div>
            </div>
        `;
    }

    buildTimeBadge(node: Goods | BaseBuildingInfo | { time?: number }, nodeId?: string): string {
        const time = (node as any).time;
        if (!time) {
            return '';
        }
        const baseTime = time;
        const adjusted = (node as Goods).time ? this.calculator.getAdjustedTime(node as Goods) : baseTime;
        const boosted = Math.abs(adjusted - baseTime) > 0.01;
        const dataNode = nodeId ? ` data-time-node-id="${nodeId}"` : '';
        return `
            <div class="production-card-time"${dataNode} title="${boosted ? `Base ${formatDuration(baseTime)}` : 'No active boost'}">
                ${formatDuration(adjusted)}
                ${boosted ? '<div class="boosted-indicator">Boosted</div>' : ''}
            </div>
        `;
    }

    // buildModifierToolbar()は削除
    // Modifier Settingsは右パネルのVue SettingsPanelに完全移行

    updateCalculations(recipe: Goods): void {
        if (!recipe) return;
        const rate = typeof this.currentRate === 'number' ? this.currentRate : 1;

        const workingRecipe = this.calculator.cloneRecipe(recipe);
        const allBuildings = this.calculator.collectAllBuildings(workingRecipe, rate, {});

        this.updateBuildingCounts(allBuildings);
        this.updateCostSummary(allBuildings);
        this.graphRenderer.render(recipe, allBuildings);
    }

    updateBuildingCounts(allBuildings: BuildingsMap = {}): void {
        Object.entries(allBuildings).forEach(([goodId, buildings]) => {
            if (goodId === '_metadata') return;
            const target = this.container.querySelector(`[data-building-count="${goodId}"]`) as HTMLElement | null;
            if (target && typeof buildings === 'number') {
                target.textContent = formatBuildingCount(buildings || 0, this.i18n.t('ui.buildingUnit'));
            }
        });
    }

    updateCostSummary(allBuildings: BuildingsMap): void {
        if (!this.buildingCostElement || !this.maintenanceElement) return;
        const totals = this.calculator.calculateTotals(allBuildings);

        // 建設コストコンテナを作成して追加
        const buildingCostContainer = this.buildCostElements(totals.buildingCost);
        this.buildingCostElement.replaceChildren(buildingCostContainer);

        // 維持費コンテナを作成
        const maintenanceContainer = this.buildCostElements(totals.maintenance);
        const metadata = allBuildings._metadata;
        const charcoalFuelBuildings = metadata
            ? Object.values(metadata).reduce((sum, node) => {
                if (!node?.id) return sum;
                const nodeCharcoal = this.calculator
                    .calculateFuelBuildings(node, allBuildings)
                    .filter((fuel) => fuel.id === 'charcoal')
                    .reduce((nodeSum, fuel) => nodeSum + fuel.count, 0);
                return sum + nodeCharcoal;
            }, 0)
            : 0;

        if (charcoalFuelBuildings > 0) {
            const charcoalLabel = this.i18n.t('goods.charcoal');
            maintenanceContainer.appendChild(this.buildCostElement('charcoal', formatBuildingCount(charcoalFuelBuildings, this.i18n.t('ui.buildingUnit')), charcoalLabel !== 'charcoal' ? charcoalLabel : 'Coal'));
        }

        this.maintenanceElement.replaceChildren(maintenanceContainer);
    }

    private syncModifierControlState(): void {
        this.container.querySelectorAll('[data-setting-key]').forEach((node) => {
            const button = node as HTMLButtonElement;
            const key = button.dataset.settingKey;
            const requires = button.dataset.settingRequires;
            if (!key) return;
            const active = this.settingsManager.getSetting(key);
            const unlocked = !requires || this.settingsManager.getSetting(requires);
            button.classList.toggle('active', active);
            button.classList.toggle('locked', !unlocked);
            button.setAttribute('aria-pressed', String(active));
        });

        this.container.querySelectorAll('[data-setting-num-key]').forEach((node) => {
            const input = node as HTMLInputElement;
            const key = input.dataset.settingNumKey;
            const requires = input.dataset.settingRequires;
            if (!key) return;

            const unlocked = !requires || this.settingsManager.getSetting(requires);
            const currentVal = this.settingsManager.getSettingRaw(key);
            if (typeof currentVal === 'number' || typeof currentVal === 'string') {
                input.value = String(currentVal);
            }
            input.disabled = !unlocked;
            input.closest('.modifier-num-input-label')?.classList.toggle('locked', !unlocked);
        });

        this.container.querySelectorAll('[data-setting-select-key]').forEach((node) => {
            const select = node as HTMLSelectElement;
            const key = select.dataset.settingSelectKey;
            const requires = select.dataset.settingRequires;
            if (!key) return;

            const unlocked = !requires || this.settingsManager.getSetting(requires);
            const currentVal = this.settingsManager.getSettingRaw(key);
            if (typeof currentVal === 'string') {
                select.value = currentVal;
            }
            select.disabled = !unlocked;
            select.closest('.modifier-select-label')?.classList.toggle('locked', !unlocked);
        });
    }

    private updateTimeBadges(recipe: Goods): void {
        this.container.querySelectorAll<HTMLElement>('.production-card-time[data-time-node-id]').forEach((badge) => {
            const nodeId = badge.dataset.timeNodeId;
            if (!nodeId) return;

            const node = (recipe.id === nodeId ? recipe : this.baseInputs.get(nodeId)) as Goods | undefined;
            if (!node?.time) return;

            const baseTime = node.time;
            const adjusted = this.calculator.getAdjustedTime(node);
            const boosted = Math.abs(adjusted - baseTime) > 0.01;

            badge.title = boosted ? `Base ${formatDuration(baseTime)}` : 'No active boost';
            badge.innerHTML = `
                ${formatDuration(adjusted)}
                ${boosted ? '<div class="boosted-indicator">Boosted</div>' : ''}
            `;
        });
    }

    buildCostElements(costs: Record<string, number> = {}): HTMLElement {
        const container = document.createElement('div');
        container.className = 'cost-list';

        const entries = Object.entries(costs).filter(([, amount]) => amount > 0);
        if (!entries.length) {
            const none = document.createElement('span');
            none.className = 'cost-none';
            none.textContent = this.i18n.t('ui.none');
            container.appendChild(none);
            return container;
        }

        entries.forEach(([resource, amount]) => {
            // I18nManagerから翻訳を取得、見つからない場合はTitle Case形式にフォールバック
            const translatedLabel = this.i18n.t(`goods.${resource}`);
            const label = (translatedLabel !== resource) ? translatedLabel : toTitleCase(resource);
            container.appendChild(this.buildCostElement(resource, String(amount), label));
        });

        return container;
    }

    private buildCostElement(resource: string, amountText: string, label: string): HTMLElement {
        const item = document.createElement('span');
        item.className = 'cost-resource';
        item.innerHTML = `<img src="${ASSETS_ICONS_PATH}${resource}.png" alt="${label}" class="cost-icon" onerror="this.style.display='none';"/><span class="cost-amount">${amountText}</span>`;

        attachCostTooltip(item, label);

        return item;
    }

    showBasicInfo(good: RecipeListItem): void {
        this.currentGood = good;
        this.sourceRecipe = null;
        this.container.classList.remove('hidden');
        const backLabel = this.i18n.t('ui.back');
        this.container.innerHTML = `
            <div class="calculator-header">
                <button class="back-button" type="button" data-action="back" aria-label="${backLabel}">${backLabel}</button>
                <h3>${good.displayName}</h3>
            </div>
            <div class="calculator-content">
                <div class="production-info">
                    <p><strong>ID:</strong> ${good.id}</p>
                    <p><strong>Icon:</strong> ${good.icon}</p>
                </div>
                <p class="info-note">${this.i18n.t('ui.noDetailedProductionData')}</p>
            </div>
        `;
        this.bindBackButton();
    }
}

export { ProductionChainView };