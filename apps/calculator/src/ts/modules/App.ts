import { GoodsRepository } from '@anno/shared';
import { SettingsManager } from './SettingsManager';
import { ProductionCalculator } from './ProductionCalculator';
import { GraphRenderer } from './GraphRenderer';
import { ProductionChainView } from './ProductionChainView';
import { Item } from './modifier/Item';
import { I18nManager, type Locale } from '@anno/shared';
import { TreeApp } from '../tree-app';
import type { RecipeListItem } from '@anno/shared';
import type { Goods } from '@anno/shared';
import { initModifierPanel } from '../vue-app';
import { ASSETS_ICONS_PATH } from '../constants';

// ---------------------------------------------------------------------------
// ParameterParser — owns all URL state serialisation / deserialisation
// ---------------------------------------------------------------------------

interface AppUrlState {
    good?: string;
    region?: string;
    items?: string[];
    lang?: Locale;
}

class ParameterParser {
    static readonly PARAMS = {
        GOOD: 'good',
        REGION: 'region',
        ITEMS: 'items',
        LANG: 'lang',
    } as const;

    private static readonly RESERVED = Object.values(ParameterParser.PARAMS);

    /** Extract app state from the current URL. */
    static parse(url: URL): AppUrlState {
        const itemsRaw = url.searchParams.get(ParameterParser.PARAMS.ITEMS) ?? '';
        const items = itemsRaw
            .split('~')
            .map((entry) => entry.trim())
            .filter(Boolean);
        const langParam = url.searchParams.get(ParameterParser.PARAMS.LANG);
        const lang: Locale | undefined = (langParam === 'ja' || langParam === 'en') ? langParam : undefined;
        return {
            good:   url.searchParams.get(ParameterParser.PARAMS.GOOD)   ?? undefined,
            region: url.searchParams.get(ParameterParser.PARAMS.REGION) ?? undefined,
            items,
            lang,
        };
    }

    /** Build a URL that reflects the given app state, preserving unrelated params. */
    static create(state: AppUrlState, base: URL = new URL(window.location.href)): URL {
        const url = new URL(base.href);

        if (state.region) {
            url.searchParams.set(ParameterParser.PARAMS.REGION, state.region);
        } else {
            url.searchParams.delete(ParameterParser.PARAMS.REGION);
        }

        if (state.good) {
            url.searchParams.set(ParameterParser.PARAMS.GOOD, state.good);
        } else {
            url.searchParams.delete(ParameterParser.PARAMS.GOOD);
        }

        if (state.items && state.items.length) {
            url.searchParams.set(ParameterParser.PARAMS.ITEMS, state.items.join('~'));
        } else {
            url.searchParams.delete(ParameterParser.PARAMS.ITEMS);
        }

        if (state.lang) {
            url.searchParams.set(ParameterParser.PARAMS.LANG, state.lang);
        } else {
            url.searchParams.delete(ParameterParser.PARAMS.LANG);
        }

        return url;
    }

    /** Any query params not managed by this parser (pass-through preservation). */
    static parseExtras(url: URL): Record<string, string> {
        const extras: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
            if (!ParameterParser.RESERVED.includes(key as typeof ParameterParser.RESERVED[number])) {
                extras[key] = value;
            }
        });
        return extras;
    }
}

// ---------------------------------------------------------------------------
// App — singleton application root
// ---------------------------------------------------------------------------

export class App {
    private static _instance: App | null = null;

    public static getInstance(): App {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }

    private readonly goodsRepository: GoodsRepository;
    private readonly settingsManager: SettingsManager;
    private readonly i18nManager: I18nManager;
    private readonly selectionContainer: HTMLElement;
    private readonly calculatorContainer: HTMLElement;
    private readonly productionView: ProductionChainView;
    private readonly treeApp: TreeApp;

    private currentGood: RecipeListItem | null = null;
    private currentRegion = 'Roman';
    private allGoods: RecipeListItem[] = [];

    private constructor() {
        this.goodsRepository   = GoodsRepository.getInstance();
        this.settingsManager   = SettingsManager.getInstance();
        this.i18nManager       = I18nManager.getInstance();

        this.selectionContainer  = document.getElementById('selection-container')  as HTMLElement;
        this.calculatorContainer = document.getElementById('calculator-container') as HTMLElement;

        this.productionView = new ProductionChainView({
            container: this.calculatorContainer,
            calculator: ProductionCalculator.getInstance(),
            graphRenderer: GraphRenderer.getInstance(),
        });

        this.productionView.setBackHandler(() => this.showSelectionView());

        // ツリービューを初期化
        // 既存のコンテンツをクリア
        this.selectionContainer.innerHTML = '';

        this.treeApp = new TreeApp({
            container: this.selectionContainer,
            goods: [],
            selectedId: undefined,
            onSelect: (good) => this.handleGoodSelection(good),
        });
        // mount()はloadGoodsList()完了後に呼び出す

        // 右パネルにModifierPanelをマウント
        initModifierPanel();
    }

    public async initialize(): Promise<void> {
        this.registerServiceWorker();

        // URL から言語を取得し、設定マネージャーと i18n を初期化
        const url = new URL(window.location.href);
        const state = ParameterParser.parse(url);
        const storedLang = this.settingsManager.getSettingRaw('language') as Locale | undefined;
        const initialLang: Locale = state.lang || storedLang || 'ja';

        await this.i18nManager.init(initialLang);
        this.applyStaticTranslations();
        this.settingsManager.init();

        // 言語設定を永続化
        if (initialLang !== storedLang) {
            this.settingsManager.setSettingValue('language', initialLang);
        }

        this.settingsManager.onChange(() => this.handleSettingsChange());
        this.i18nManager.onChange(() => this.handleLanguageChange());
        this.bindRegionToggle();
        await this.loadGoodsList();
        this.restoreFromUrl();
    }

    // -----------------------------------------------------------------------
    // Language change handler
    // -----------------------------------------------------------------------

    private async handleLanguageChange(): Promise<void> {
        this.applyStaticTranslations();
        // 言語変更時にUIを再描画
        // GoodsRepositoryから最新のローカライズされたリストを取得
        this.allGoods = this.goodsRepository.getGoodsList();

        this.updateGoodsList();

        // 現在選択中の商品がある場合、強制的に再選択して完全再描画
        if (this.currentGood) {
            const updatedGood = this.allGoods.find((g) => g.id === this.currentGood!.id);
            if (updatedGood) {
                await this.handleGoodSelection(updatedGood);
            }
        } else {
            this.showSelectionView();
        }
    }

    // -----------------------------------------------------------------------
    // Region toggle
    // -----------------------------------------------------------------------

    private bindRegionToggle(): void {
        const toggleBtn = document.getElementById('region-toggle-btn');
        const icon = toggleBtn?.querySelector<HTMLImageElement>('.region-icon');
        const text = toggleBtn?.querySelector<HTMLElement>('.region-text');

        const updateButtonState = (region: string) => {
            if (icon) icon.src = region === 'Roman' ? `${ASSETS_ICONS_PATH}latium.webp` : `${ASSETS_ICONS_PATH}albion.webp`;
            if (text) text.textContent = region === 'Roman' ? 'Latium' : 'Albion';
        };

        const setRegion = (region: string) => {
            if (this.currentRegion === region) return;
            this.currentRegion = region;
            updateButtonState(region);
            this.pushUrl();
            this.updateGoodsList();
            if (this.currentGood) {
                this.handleGoodSelection(this.currentGood, { preserveRate: true });
            }
        };

        toggleBtn?.addEventListener('click', () => {
            setRegion(this.currentRegion === 'Roman' ? 'Celtic' : 'Roman');
        });

        updateButtonState(this.currentRegion);
    }

    // -----------------------------------------------------------------------
    // Service worker
    // -----------------------------------------------------------------------

    private registerServiceWorker(): void {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((registration) => setInterval(() => registration.update(), 60_000))
                .catch((error) => console.error('[SW] Registration failed:', error));
        });
    }

    // -----------------------------------------------------------------------
    // Goods list
    // -----------------------------------------------------------------------

    private async loadGoodsList(): Promise<void> {
        try {
            this.allGoods = await this.goodsRepository.loadGoodsList();
            try {
                await this.goodsRepository.loadItemCompatibility();
                await this.goodsRepository.preloadItemProductivity();
            } catch (error) {
                console.warn('[App] Failed to preload item modifier data', error);
            }

            // ツリービューの初回マウント（データ取得完了後）
            const filtered = this.allGoods.filter((good) => {
                if (good.startOfChain) return true;
                if (!good.regions?.length) return false;
                return good.regions.includes(this.currentRegion);
            });

            // 先にマウント（goods=[]の状態で）
            this.treeApp.mount();
            // その後データを更新（rootInstanceが存在するのでリアクティブに更新）
            this.treeApp.updateGoods(filtered);

        } catch (error) {
            console.error('Error loading goods list:', error);
            // ツリービュー用のエラー表示
            this.selectionContainer.innerHTML = '<div class="error-message" style="padding: 2rem; text-align: center; color: #721c24;">Error loading goods list. Please try again later.</div>';
        }
    }

    private updateGoodsList(): void {
        const filtered = this.allGoods.filter((good) => {
            if (good.startOfChain) return true;
            if (!good.regions?.length) return false;
            return good.regions.includes(this.currentRegion);
        });

        // ツリービューを更新
        this.treeApp.updateGoods(filtered);
    }

    // -----------------------------------------------------------------------
    // Good selection
    // -----------------------------------------------------------------------

    private async handleGoodSelection(good: RecipeListItem, options: { preserveRate?: boolean } = {}): Promise<void> {
        this.currentGood = good;
        Item.setActiveChain(good.id);
        this.pushUrl();
        // モバイルボトムシートを閉じる
        (window as { __closeMobileSheets?: () => void }).__closeMobileSheets?.();
        // 2カラムレイアウトのため、両方を常に表示
        // this.selectionContainer.classList.add('hidden');
        // this.calculatorContainer.classList.remove('hidden');
        this.productionView.showLoading(good);
        try {
            const recipe: Goods | null = await this.goodsRepository.loadProductionChain(good.id, this.currentRegion);
            if (recipe) {
                await this.productionView.showChain(good, recipe, { preserveRate: Boolean(options.preserveRate) });
            } else {
                this.productionView.showBasicInfo(good);
            }
        } catch (error) {
            console.error(`Failed to load production data for ${good.id}`, error);
            this.productionView.showBasicInfo(good);
        }
    }

    private showSelectionView(): void {
        this.currentGood = null;
        Item.setActiveChain(null);
        this.pushUrl();
        // 2カラムレイアウトのため、両方を常に表示
        // this.calculatorContainer.classList.add('hidden');
        // this.selectionContainer.classList.remove('hidden');

        // 右側パネルを初期状態に戻す
        this.calculatorContainer.innerHTML = `<p class="info-note">${this.i18nManager.t('ui.selectGoodPrompt')}</p>`;
    }

    // -----------------------------------------------------------------------
    // Settings
    // -----------------------------------------------------------------------

    private handleSettingsChange(): void {
        if (this.productionView.hasSelection()) {
            this.productionView.applySettingsToCurrentView();
        }
        this.pushUrl();
    }

    // -----------------------------------------------------------------------
    // URL state — delegated to ParameterParser
    // -----------------------------------------------------------------------

    private restoreFromUrl(): void {
        const url = new URL(window.location.href);
        const state = ParameterParser.parse(url);

        if (state.region) {
            const region = state.region.charAt(0).toUpperCase() + state.region.slice(1).toLowerCase();
            if (region === 'Roman' || region === 'Celtic') {
                this.currentRegion = region;
                const toggleBtn = document.getElementById('region-toggle-btn');
                const icon = toggleBtn?.querySelector<HTMLImageElement>('.region-icon');
                const text = toggleBtn?.querySelector<HTMLElement>('.region-text');
                if (icon) icon.src = region === 'Roman' ? `${ASSETS_ICONS_PATH}latium.webp` : `${ASSETS_ICONS_PATH}albion.webp`;
                if (text) text.textContent = region === 'Roman' ? 'Latium' : 'Albion';
            }
        }

        if (state.good) {
            const good = this.goodsRepository.getGoodsList().find((item) => item.id === state.good);
            if (good) {
                this.applyItemsFromUrl(good.id, state.items ?? []);
                this.handleGoodSelection(good);
            } else {
                this.showSelectionView();
            }
        } else {
            this.showSelectionView();
        }
    }

    private pushUrl(): void {
        const activeItems = this.getActiveItemsForCurrentChain();
        const url = ParameterParser.create({
            good:   this.currentGood?.id,
            region: this.currentRegion.toLowerCase(),
            items: activeItems,
            lang:   this.i18nManager.getLocale(),
        });
        window.history.pushState(
            { good: this.currentGood?.id, region: this.currentRegion, lang: this.i18nManager.getLocale() },
            '',
            url,
        );
    }

    private applyItemsFromUrl(chainId: string, guids: string[]): void {
        if (!guids.length) return;

        const urlGuids = new Set(guids);
        const compatibleItems = this.goodsRepository.getCompatibleItems(chainId);

        for (const item of compatibleItems) {
            const key = Item.getItemSettingKey(chainId, item.guid);
            this.settingsManager.setSettingValue(key, urlGuids.has(item.guid));
        }
    }

    private getActiveItemsForCurrentChain(): string[] {
        if (!this.currentGood) return [];
        const settings = this.settingsManager.getConfig();
        return Item.getActiveGuidsForChain(settings, this.currentGood.id);
    }

    private applyStaticTranslations(): void {
        document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
            const key = el.dataset.i18n;
            if (key) el.textContent = this.i18nManager.t(key);
        });
    }

    // -----------------------------------------------------------------------
    // Public API for Vue components
    // -----------------------------------------------------------------------
}
