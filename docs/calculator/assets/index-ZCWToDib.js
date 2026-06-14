//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region packages/shared/src/i18n/I18nManager.ts
var I18nManager = class I18nManager {
	static _instance = null;
	static getInstance() {
		if (!I18nManager._instance) I18nManager._instance = new I18nManager();
		return I18nManager._instance;
	}
	currentLocale;
	translations;
	listeners;
	loadPromises;
	constructor() {
		this.currentLocale = "en";
		this.translations = /* @__PURE__ */ new Map();
		this.listeners = /* @__PURE__ */ new Set();
		this.loadPromises = /* @__PURE__ */ new Map();
	}
	/**
	* 初期化 - 指定された言語の翻訳データを読み込む
	*/
	async init(locale = "en") {
		await this.loadLocale(locale);
		this.currentLocale = locale;
	}
	/**
	* 現在の言語を取得
	*/
	getLocale() {
		return this.currentLocale;
	}
	/**
	* 言語を設定（翻訳データを読み込み、リスナーに通知）
	*/
	async setLocale(locale) {
		if (this.currentLocale === locale) return;
		await this.loadLocale(locale);
		this.currentLocale = locale;
		this.notify();
	}
	/**
	* 言語変更時のコールバックを登録
	*/
	onChange(callback) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
	/**
	* 翻訳キーからテキストを取得
	* @param key - ドット記法のキー（例: "ui.selectGood", "goods.amphorae", "modifiers.aqueduct.enabled"）
	* @returns 翻訳されたテキスト（キーが見つからない場合は英語フォールバック）
	*/
	t(key) {
		const parts = key.split(".");
		if (parts.length < 2) {
			console.warn(`[I18n] Invalid key format: ${key}`);
			return key;
		}
		const category = parts[0];
		const subKeys = parts.slice(1);
		const data = this.translations.get(this.currentLocale);
		if (!data) {
			console.warn(`[I18n] No translations loaded for locale: ${this.currentLocale}`);
			return this.fallbackTranslation(category, subKeys);
		}
		const categoryData = data[category];
		if (!categoryData) {
			console.warn(`[I18n] Unknown category: ${category}`);
			return this.fallbackTranslation(category, subKeys);
		}
		const translation = categoryData[subKeys.join(".")];
		if (!translation) {
			console.warn(`[I18n] Missing translation: ${key}`);
			return this.fallbackTranslation(category, subKeys);
		}
		return translation;
	}
	/**
	* 英語フォールバック（翻訳が見つからない場合）
	*/
	fallbackTranslation(category, subKeys) {
		const fullSubKey = subKeys.join(".");
		if (this.currentLocale === "en") return fullSubKey;
		const enData = this.translations.get("en");
		if (!enData) return fullSubKey;
		const categoryData = enData[category];
		if (!categoryData) return fullSubKey;
		return categoryData[fullSubKey] || fullSubKey;
	}
	/**
	* 翻訳データの読み込み（キャッシュあり）
	*/
	async loadLocale(locale) {
		if (this.translations.has(locale)) return;
		const existingPromise = this.loadPromises.get(locale);
		if (existingPromise) return existingPromise;
		const loadPromise = this.fetchTranslationData(locale);
		this.loadPromises.set(locale, loadPromise);
		try {
			await loadPromise;
		} finally {
			this.loadPromises.delete(locale);
		}
	}
	/**
	* JSONファイルから翻訳データを取得
	*/
	async fetchTranslationData(locale) {
		try {
			const response = await fetch(`/calculator/i18n/locales/${locale}.json`);
			if (!response.ok) throw new Error(`Failed to load locale: ${locale} (${response.status})`);
			const data = await response.json();
			this.translations.set(locale, data);
		} catch (error) {
			console.error(`[I18n] Error loading locale ${locale}:`, error);
			this.translations.set(locale, {
				goods: {},
				ui: {},
				regions: {},
				populationTiers: {},
				modifiers: {},
				specialists: {}
			});
		}
	}
	/**
	* リスナーに変更を通知
	*/
	notify() {
		this.listeners.forEach((listener) => listener(this.currentLocale));
	}
};
//#endregion
//#region packages/shared/src/repository/GoodsRepository.ts
/**
* Singleton repository for goods and production data.
*/
var GoodsRepository = class GoodsRepository {
	static _instance = null;
	goodsUrl;
	productionBaseUrl;
	goods = [];
	goodsMap = /* @__PURE__ */ new Map();
	productionCache = /* @__PURE__ */ new Map();
	compatibilityByChain = /* @__PURE__ */ new Map();
	itemProductivityByGuid = /* @__PURE__ */ new Map();
	itemTargetsByGuid = /* @__PURE__ */ new Map();
	i18n;
	constructor(goodsUrl = `/calculator/productions/list.json`, productionBaseUrl = `/calculator/productions`) {
		this.goodsUrl = goodsUrl;
		this.productionBaseUrl = productionBaseUrl;
		this.i18n = I18nManager.getInstance();
	}
	static getInstance() {
		if (!GoodsRepository._instance) GoodsRepository._instance = new GoodsRepository();
		return GoodsRepository._instance;
	}
	/**
	* Loads the goods list from the server and caches it.
	*/
	async loadGoodsList() {
		if (this.goods.length > 0) return this.getLocalizedGoodsList();
		const response = await fetch(this.goodsUrl);
		if (!response.ok) throw new Error(`Failed to load goods list (${response.status})`);
		const payload = await response.json();
		this.goods = payload.goods || [];
		this.goodsMap = new Map(this.goods.map((g) => [g.id, g]));
		return this.getLocalizedGoodsList();
	}
	/**
	* 現在の言語設定に基づいてローカライズされた商品リストを返す
	*/
	getLocalizedGoodsList() {
		return this.goods.map((good) => ({
			...good,
			displayName: this.getLocalizedGoodName(good.id, good.displayName)
		}));
	}
	/**
	* 商品名を翻訳（翻訳が見つからない場合は元の displayName を返す）
	*/
	getLocalizedGoodName(goodId, fallback) {
		const translationKey = `goods.${goodId}`;
		const translated = this.i18n.t(translationKey);
		if (translated === goodId || translated === fallback) return fallback;
		return translated;
	}
	getGoodsList() {
		return this.getLocalizedGoodsList();
	}
	getGoodById(id) {
		return this.goodsMap.get(id) ?? this.goods.find((g) => g.id === id);
	}
	/**
	* Loads generated compatibility data for production chains and items.
	*/
	async loadItemCompatibility() {
		if (this.compatibilityByChain.size > 0) return;
		const response = await fetch(`${this.productionBaseUrl}/item-compatibility.json`);
		if (!response.ok) throw new Error(`Failed to load item compatibility (${response.status})`);
		const chains = (await response.json()).chains ?? [];
		this.compatibilityByChain = new Map(chains.map((chain) => [chain.id, chain]));
	}
	getCompatibleItemChains() {
		return Array.from(this.compatibilityByChain.values());
	}
	getCompatibleItems(chainId) {
		return this.compatibilityByChain.get(chainId)?.items ?? [];
	}
	/**
	* Preloads productivity percentages for all known compatible items.
	*/
	async preloadItemProductivity() {
		await this.loadItemCompatibility();
		const guids = /* @__PURE__ */ new Set();
		this.compatibilityByChain.forEach((chain) => {
			chain.items.forEach((item) => {
				guids.add(item.guid);
			});
		});
		await Promise.all(Array.from(guids).map((guid) => this.loadItemProductivity(guid)));
	}
	getItemProductivity(guid) {
		return this.itemProductivityByGuid.get(guid) ?? 0;
	}
	getItemTargetGoodNames(guid) {
		return this.itemTargetsByGuid.get(guid) ?? /* @__PURE__ */ new Set();
	}
	/**
	* Recursively loads and expands the full production chain for a good.
	* @param goodId The ID of the good to load.
	* @param region The region to fetch data for (e.g. "Roman" or "Celtic").
	* @param visited Set used to detect circular references.
	*/
	async loadProductionChain(goodId, region, visited = /* @__PURE__ */ new Set()) {
		if (!goodId || visited.has(goodId)) return null;
		visited.add(goodId);
		const baseRecipe = await this.fetchProduction(goodId, region);
		if (!baseRecipe) {
			visited.delete(goodId);
			return null;
		}
		const recipe = this.cloneRecipe(baseRecipe);
		await this.expandRecipe(recipe, region, visited);
		visited.delete(goodId);
		return recipe;
	}
	async expandRecipe(node, region, visited) {
		if (!Array.isArray(node.input)) return;
		for (const input of node.input) if (Array.isArray(input.input)) await this.expandRecipe(input, region, visited);
		else if (!input.start_of_chain && input.id) {
			const nested = await this.loadProductionChain(input.id, region, visited);
			if (nested) Object.assign(input, nested);
		}
	}
	async fetchProduction(goodId, region) {
		const cacheKey = `${goodId}:${region.toLowerCase()}`;
		if (this.productionCache.has(cacheKey)) return this.productionCache.get(cacheKey);
		const filename = this.resolveFilename(goodId, region);
		try {
			const response = await fetch(`${this.productionBaseUrl}/${filename}.json`);
			if (!response.ok) return null;
			const data = await response.json();
			this.productionCache.set(cacheKey, data);
			return data;
		} catch (error) {
			console.error(`[GoodsRepository] Failed to fetch production data for ${goodId}`, error);
			return null;
		}
	}
	async loadItemProductivity(guid) {
		const cached = this.itemProductivityByGuid.get(guid);
		if (cached !== void 0) return cached;
		try {
			const response = await fetch(`/calculator/data/items/${guid}.json`);
			if (!response.ok) {
				this.itemProductivityByGuid.set(guid, 0);
				return 0;
			}
			const payload = await response.json();
			const value = this.extractProductivity(payload);
			this.itemProductivityByGuid.set(guid, value);
			this.itemTargetsByGuid.set(guid, this.extractTargetGoodNames(payload));
			return value;
		} catch (error) {
			console.warn(`[GoodsRepository] Failed to load item details for ${guid}`, error);
			this.itemProductivityByGuid.set(guid, 0);
			return 0;
		}
	}
	extractTargetGoodNames(item) {
		const names = /* @__PURE__ */ new Set();
		for (const target of item.targets ?? []) for (const pg of target.producedGoods ?? []) if (typeof pg.name === "string" && pg.name) names.add(pg.name.trim().toLowerCase().replace(/[_-]/g, " "));
		return names;
	}
	extractProductivity(item) {
		return (item.buffs ?? []).reduce((sum, buff) => {
			const value = buff.FactoryUpgrade?.ProductivityUpgrade;
			if (typeof value !== "number" || !Number.isFinite(value)) return sum;
			return sum + value / 100;
		}, 0);
	}
	/**
	* Resolves the filename to use for a good/region combination.
	* Uses case-insensitive matching on file keys.
	*/
	resolveFilename(goodId, region) {
		const good = this.getGoodById(goodId);
		if (!good?.files) return goodId;
		const entries = Object.entries(good.files);
		const regionLower = region.toLowerCase();
		const regionMatch = entries.find(([key]) => key.toLowerCase() === regionLower);
		if (regionMatch) return regionMatch[1];
		const first = entries[0];
		if (first) return first[1];
		return goodId;
	}
	cloneRecipe(recipe) {
		return structuredClone(recipe);
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/ModifierRegistry.ts
/**
* Central registry for all production modifiers.
* New modifiers only need to register once at bootstrap.
*/
var ModifierRegistry = class ModifierRegistry {
	static _instance = null;
	modifiers = /* @__PURE__ */ new Map();
	definitionChangeListeners = /* @__PURE__ */ new Set();
	static getInstance() {
		if (!ModifierRegistry._instance) ModifierRegistry._instance = new ModifierRegistry();
		return ModifierRegistry._instance;
	}
	register(modifier) {
		const id = modifier.getDefinition().id;
		this.modifiers.set(id, modifier);
	}
	getModifiers() {
		return Array.from(this.modifiers.values());
	}
	getDefinitions() {
		return this.getModifiers().map((modifier) => modifier.getDefinition());
	}
	/**
	* Subscribe to definition changes (e.g., when Item activeChainId changes).
	* @param callback Function to call when definitions change
	* @returns Unsubscribe function
	*/
	onDefinitionsChanged(callback) {
		this.definitionChangeListeners.add(callback);
		return () => this.definitionChangeListeners.delete(callback);
	}
	/**
	* Notify all listeners that modifier definitions have changed.
	* Called when Item.setActiveChain() changes the active chain.
	*/
	notifyDefinitionsChanged() {
		this.definitionChangeListeners.forEach((listener) => {
			try {
				listener();
			} catch (error) {
				console.error("[ModifierRegistry] Error in definition change listener:", error);
			}
		});
	}
};
//#endregion
//#region apps/calculator/src/ts/constants.ts
/**
* アプリケーション全体で使用する定数
*/
var ASSETS_ICONS_PATH = `/calculator/icons/`;
var SVG_NS = "http://www.w3.org/2000/svg";
var XLINK_NS = "http://www.w3.org/1999/xlink";
//#endregion
//#region apps/calculator/src/ts/modules/SettingsManager.ts
/**
* Handles persistence and UI wiring for calculator settings and storage presets.
* Singleton — always access via SettingsManager.getInstance().
*/
var SettingsManager = class SettingsManager {
	static _instance = null;
	static getInstance() {
		if (!SettingsManager._instance) SettingsManager._instance = new SettingsManager();
		return SettingsManager._instance;
	}
	storageKey;
	presetsKey;
	config;
	presets;
	listeners;
	overlay;
	settingsPanel;
	settingsToggle;
	settingsClose;
	settingsContent;
	infoModal;
	infoToggle;
	infoClose;
	helpModal;
	helpToggle;
	helpClose;
	constructor(storageKey = "anno117_calculator_settings") {
		this.storageKey = storageKey;
		this.presetsKey = `${storageKey}_presets`;
		this.config = {};
		this.presets = [];
		this.listeners = /* @__PURE__ */ new Set();
		this.overlay = null;
		this.settingsPanel = null;
		this.settingsToggle = null;
		this.settingsClose = null;
		this.settingsContent = null;
		this.infoModal = null;
		this.infoToggle = null;
		this.infoClose = null;
		this.helpModal = null;
		this.helpToggle = null;
		this.helpClose = null;
	}
	init() {
		this.loadFromStorage();
		this.loadPresets();
		this.cacheDom();
		this.ensureOverlay();
		this.bindShellButtons();
		this.bindInfoModal();
		this.bindHelpModal();
		this.renderStoragePanel();
		this.notify();
	}
	onChange(callback) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
	getConfig() {
		return { ...this.config };
	}
	getSetting(key) {
		return Boolean(this.config[key]);
	}
	getSettingRaw(key) {
		return this.config[key] ?? false;
	}
	setSetting(key, value) {
		this.setSettingValue(key, value);
	}
	setSettingValue(key, value) {
		if (this.config[key] === value) return;
		this.config[key] = value;
		this.persist();
		this.notify();
		this.renderStoragePanel();
	}
	toggleSetting(key) {
		this.setSetting(key, !this.getSetting(key));
	}
	saveCurrentAsPreset(name) {
		const normalized = name.trim();
		if (!normalized) return;
		const preset = {
			id: `preset-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
			name: normalized,
			createdAt: Date.now(),
			config: { ...this.config }
		};
		this.presets.unshift(preset);
		this.persistPresets();
		this.renderStoragePanel();
	}
	loadPreset(id) {
		const preset = this.presets.find((entry) => entry.id === id);
		if (!preset) return;
		this.config = { ...preset.config };
		this.persist();
		this.notify();
		this.renderStoragePanel();
	}
	deletePreset(id) {
		this.presets = this.presets.filter((entry) => entry.id !== id);
		this.persistPresets();
		this.renderStoragePanel();
	}
	/**
	* 保存されたプリセット一覧を取得
	* @returns プリセットの配列（コピー）
	*/
	getPresets() {
		return [...this.presets];
	}
	openSettings() {
		this.settingsPanel?.classList.remove("hidden");
		this.overlay?.classList.add("active");
	}
	closeSettings() {
		this.settingsPanel?.classList.add("hidden");
		if (!this.infoModal || this.infoModal.classList.contains("hidden")) this.overlay?.classList.remove("active");
	}
	openInfo() {
		this.infoModal?.classList.remove("hidden");
		this.overlay?.classList.add("active");
	}
	closeInfo() {
		this.infoModal?.classList.add("hidden");
		if (!this.settingsPanel || this.settingsPanel.classList.contains("hidden")) this.overlay?.classList.remove("active");
	}
	openHelp() {
		this.helpModal?.classList.remove("hidden");
		this.overlay?.classList.add("active");
	}
	closeHelp() {
		this.helpModal?.classList.add("hidden");
		if (!this.settingsPanel || this.settingsPanel.classList.contains("hidden")) this.overlay?.classList.remove("active");
	}
	cacheDom() {
		this.settingsPanel = document.getElementById("saved-store-panel");
		this.settingsToggle = document.getElementById("saved-store-toggle");
		this.settingsClose = document.getElementById("saved-store-close");
		this.settingsContent = document.getElementById("saved-store-content");
		this.infoToggle = document.getElementById("info-toggle");
		this.infoClose = document.getElementById("info-close");
		this.infoModal = document.getElementById("info-modal");
		this.helpToggle = document.getElementById("help-toggle");
		this.helpClose = document.getElementById("help-close");
		this.helpModal = document.getElementById("help-modal");
	}
	ensureOverlay() {
		let overlay = document.getElementById("settings-overlay");
		if (!overlay) {
			overlay = document.createElement("div");
			overlay.id = "settings-overlay";
			overlay.className = "settings-overlay";
			document.body.appendChild(overlay);
		}
		this.overlay = overlay;
	}
	bindShellButtons() {
		this.settingsToggle?.addEventListener("click", () => this.openSettings());
		this.settingsClose?.addEventListener("click", () => this.closeSettings());
		this.overlay?.addEventListener("click", () => {
			if (this.settingsPanel && !this.settingsPanel.classList.contains("hidden")) this.closeSettings();
			else if (this.infoModal && !this.infoModal.classList.contains("hidden")) this.closeInfo();
			else if (this.helpModal && !this.helpModal.classList.contains("hidden")) this.closeHelp();
		});
	}
	bindInfoModal() {
		if (!this.infoModal) return;
		this.infoToggle?.addEventListener("click", () => this.openInfo());
		this.infoClose?.addEventListener("click", () => this.closeInfo());
	}
	bindHelpModal() {
		if (!this.helpModal) return;
		this.helpToggle?.addEventListener("click", () => this.openHelp());
		this.helpClose?.addEventListener("click", () => this.closeHelp());
	}
	renderStoragePanel() {
		if (!this.settingsContent) return;
		const presetItems = this.presets.length ? this.presets.map((preset) => {
			const date = new Date(preset.createdAt);
			const dateLabel = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit"
			})}`;
			return `
                    <li class="preset-item" data-preset-id="${preset.id}">
                        <div class="preset-meta">
                            <strong>${preset.name}</strong>
                            <span>${dateLabel}</span>
                        </div>
                        <div class="preset-actions">
                            <button type="button" class="preset-load-btn" data-load-preset="${preset.id}">Load</button>
                            <button type="button" class="preset-delete-btn" data-delete-preset="${preset.id}">Delete</button>
                        </div>
                    </li>
                `;
		}).join("") : "<li class=\"preset-empty\">No saved configurations yet.</li>";
		const activeToggles = ModifierRegistry.getInstance().getDefinitions().flatMap((modifier) => modifier.toggles ?? []).filter((toggle) => this.getSetting(toggle.key));
		const activeMarkup = activeToggles.length ? activeToggles.map((toggle) => `
                <li>
                    <img src="${ASSETS_ICONS_PATH}${toggle.icon}" alt="${toggle.label}">
                    <span>${toggle.label}</span>
                </li>
            `).join("") : "<li class=\"preset-empty\">No active modifier toggles.</li>";
		this.settingsContent.innerHTML = `
            <section class="saved-store-section">
                <h3>Saved Configurations</h3>
                <p class="setting-description">Save your current modifier setup and load it later with one click.</p>
                <div class="preset-save-row">
                    <input id="preset-name-input" type="text" placeholder="Preset name" maxlength="40" />
                    <button id="save-current-preset-btn" type="button">Save Current</button>
                </div>
                <ul class="preset-list">
                    ${presetItems}
                </ul>
            </section>
            <section class="saved-store-section">
                <h3>Current Modifier Setup</h3>
                <ul class="active-toggle-list">
                    ${activeMarkup}
                </ul>
            </section>
        `;
		this.bindStorageContentEvents();
	}
	bindStorageContentEvents() {
		if (!this.settingsContent) return;
		const saveButton = this.settingsContent.querySelector("#save-current-preset-btn");
		const nameInput = this.settingsContent.querySelector("#preset-name-input");
		saveButton?.addEventListener("click", () => {
			const name = nameInput?.value || "";
			this.saveCurrentAsPreset(name);
			if (nameInput) nameInput.value = "";
		});
		this.settingsContent.querySelectorAll("[data-load-preset]").forEach((button) => {
			button.addEventListener("click", () => {
				const id = button.dataset.loadPreset;
				if (id) this.loadPreset(id);
			});
		});
		this.settingsContent.querySelectorAll("[data-delete-preset]").forEach((button) => {
			button.addEventListener("click", () => {
				const id = button.dataset.deletePreset;
				if (id) this.deletePreset(id);
			});
		});
	}
	loadFromStorage() {
		try {
			const saved = localStorage.getItem(this.storageKey);
			if (!saved) return;
			const parsed = JSON.parse(saved);
			this.config = this.migrateLegacyConfig(parsed);
		} catch (error) {
			console.error("[Settings] Failed to parse stored settings", error);
			this.config = {};
		}
	}
	migrateLegacyConfig(raw) {
		const normalized = {};
		for (const [key, value] of Object.entries(raw)) if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") normalized[key] = value;
		const enabled = this.readBoolean(raw, "aqueduct.enabled", "aqueductsEnabled");
		const field = this.readBoolean(raw, "aqueduct.fieldIrrigation", "fieldIrrigation");
		const arborica = this.readBoolean(raw, "aqueduct.aquaArborica", "aquaArborica");
		const hushing = this.readBoolean(raw, "aqueduct.hushing", "hushing");
		normalized["aqueduct.enabled"] = enabled;
		normalized["aqueduct.fieldIrrigation"] = field;
		normalized["aqueduct.aquaArborica"] = arborica;
		normalized["aqueduct.hushing"] = hushing;
		return normalized;
	}
	readBoolean(source, key, fallbackKey) {
		if (typeof source[key] === "boolean") return Boolean(source[key]);
		if (fallbackKey && typeof source[fallbackKey] === "boolean") return Boolean(source[fallbackKey]);
		return false;
	}
	loadPresets() {
		try {
			const saved = localStorage.getItem(this.presetsKey);
			if (!saved) return;
			const parsed = JSON.parse(saved);
			this.presets = Array.isArray(parsed) ? parsed : [];
		} catch (error) {
			console.error("[Settings] Failed to parse saved presets", error);
			this.presets = [];
		}
	}
	persist() {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.config));
		} catch (error) {
			console.error("[Settings] Failed to persist settings", error);
		}
	}
	persistPresets() {
		try {
			localStorage.setItem(this.presetsKey, JSON.stringify(this.presets));
		} catch (error) {
			console.error("[Settings] Failed to persist presets", error);
		}
	}
	notify() {
		const snapshot = this.getConfig();
		this.listeners.forEach((listener) => listener(snapshot));
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/ProductionCalculator.ts
var SECONDS_PER_MINUTE = 60;
var RECOMMENDED_RATE_STEP = .1;
var MAX_RECOMMENDED_RATE = 25;
/**
* Pure calculation utilities for production chains.
* Singleton — always access via ProductionCalculator.getInstance().
*/
var ProductionCalculator = class ProductionCalculator {
	static _instance = null;
	productionModifiers = [];
	static getInstance() {
		if (!ProductionCalculator._instance) ProductionCalculator._instance = new ProductionCalculator();
		return ProductionCalculator._instance;
	}
	constructor() {
		this.productionModifiers = ModifierRegistry.getInstance().getModifiers();
		this.productionModifiers.forEach((modifier) => modifier.loadConfig());
		SettingsManager.getInstance().onChange((config) => {
			this.productionModifiers.forEach((modifier) => modifier.applySettings(config));
		});
	}
	/** Returns icon filenames for all modifiers that are boosting the given node. */
	getActiveVisualModifiers(buildingType) {
		const goodsLike = { type: buildingType };
		return this.productionModifiers.flatMap((m) => {
			const icon = m.getVisualModifier();
			if (!icon) return [];
			return m.getProductivity(goodsLike).isAffected ? [icon] : [];
		});
	}
	/** Returns icon filenames for all modifiers that visually affect a specific production node. */
	getActiveVisualModifiersForNode(node) {
		return this.productionModifiers.flatMap((m) => {
			const icon = m.getVisualModifierForNode(node);
			if (!icon) return [];
			return m.getProductivity(node).isAffected ? [icon] : [];
		});
	}
	getProductivity(node) {
		if (!node) return 1;
		let productivity = 1;
		for (const modifier of this.productionModifiers) {
			const modType = modifier.getType();
			if (modType === "flat") productivity += modifier.getValue(node);
			else if (modType === "percentage") productivity += 100 * modifier.getValue(node);
		}
		console.debug(`[ProductionCalculator] Productivity for ${node.name || node.id}: ${productivity.toFixed(2)}x`);
		return productivity;
	}
	getAdjustedTime(node) {
		if (!node) return 60;
		const time = node.time || 60;
		const productivity = this.getProductivity(node);
		return productivity ? time / productivity : time;
	}
	collectAllBuildings(productionData, requiredPerMinute, result = {}, depth = 0) {
		if (!productionData || depth > 10) return result;
		const adjustedDuration = this.getAdjustedTime(productionData);
		const key = productionData.id || "unknown";
		const buildings = adjustedDuration > 0 ? requiredPerMinute * adjustedDuration / SECONDS_PER_MINUTE : 0;
		result[key] = (result[key] || 0) + buildings;
		if (!result["_metadata"]) result["_metadata"] = {};
		if (!result["_metadata"][key]) result["_metadata"][key] = productionData;
		const outputCyclesPerMinute = adjustedDuration > 0 ? buildings * SECONDS_PER_MINUTE / adjustedDuration : 0;
		if (Array.isArray(productionData.input)) for (const input of productionData.input) {
			if (!input.id) continue;
			const requiredInputPerMinute = outputCyclesPerMinute;
			if (input.start_of_chain) {
				const inputBuildings = this.calculateStartOfChainBuildings(input, requiredInputPerMinute, buildings, productionData);
				result[input.id] = (result[input.id] || 0) + inputBuildings;
				if (!result["_metadata"][input.id]) result["_metadata"][input.id] = input;
				continue;
			}
			if (Array.isArray(input.input)) this.collectAllBuildings(input, requiredInputPerMinute, result, depth + 1);
		}
		return result;
	}
	calculateStartOfChainBuildings(input, requiredInputPerMinute, consumingBuildings, parentProduction) {
		const parentNeedsCharcoal = parentProduction.fuel?.some((fuel) => fuel.id === "charcoal") || parentProduction.needs_fuel;
		if (input.id === "charcoal" && parentNeedsCharcoal) return consumingBuildings * (SECONDS_PER_MINUTE / 120) / (SECONDS_PER_MINUTE / 30);
		const adjustedInputDuration = this.getAdjustedTime(input);
		const inputRatePerBuilding = adjustedInputDuration > 0 ? SECONDS_PER_MINUTE / adjustedInputDuration : 0;
		return inputRatePerBuilding > 0 ? requiredInputPerMinute / inputRatePerBuilding : 0;
	}
	collectBaseInputs(productionData, baseInputs = /* @__PURE__ */ new Map()) {
		if (!productionData || !Array.isArray(productionData.input)) return baseInputs;
		for (const input of productionData.input) {
			if (!input.id) continue;
			if (input.start_of_chain) {
				if (!baseInputs.has(input.id)) baseInputs.set(input.id, input);
				continue;
			}
			if (Array.isArray(input.input)) this.collectBaseInputs(input, baseInputs);
		}
		return baseInputs;
	}
	calculateFuelBuildings(productionData, allBuildings) {
		const fuelList = productionData.fuel?.length ? productionData.fuel : productionData.needs_fuel ? [{
			id: "charcoal",
			burning_time: 120
		}] : [];
		if (!fuelList.length) return [];
		const consumingBuildings = productionData.id ? allBuildings[productionData.id] || 0 : 0;
		return fuelList.map((fuel) => {
			const burningTime = fuel.burning_time || 120;
			const fuelBuildingsNeeded = consumingBuildings * (burningTime > 0 ? SECONDS_PER_MINUTE / burningTime : 0) / (SECONDS_PER_MINUTE / 30);
			return {
				id: fuel.id,
				count: fuelBuildingsNeeded
			};
		});
	}
	findRecommendedRate(productionData) {
		console.debug("[findRecommendedRate] Starting for good:", productionData.id);
		const minRateForMainBuilding = this.getMinimumRateForMainBuilding(productionData);
		console.debug("[findRecommendedRate] Minimum rate for main building:", minRateForMainBuilding);
		if (minRateForMainBuilding > MAX_RECOMMENDED_RATE) {
			console.debug("[findRecommendedRate] Min rate exceeds MAX, returning:", this.roundRate(minRateForMainBuilding));
			return this.roundRate(minRateForMainBuilding);
		}
		let bestCandidateRate = minRateForMainBuilding;
		let bestCandidateError = Number.POSITIVE_INFINITY;
		let bestCandidateTotalError = Number.POSITIVE_INFINITY;
		let firstIntegerRate = null;
		const minStep = Math.max(1, Math.ceil(minRateForMainBuilding / RECOMMENDED_RATE_STEP));
		const maxSteps = Math.round(MAX_RECOMMENDED_RATE / RECOMMENDED_RATE_STEP);
		for (let step = minStep; step <= maxSteps; step++) {
			const candidateRate = this.roundRate(step * RECOMMENDED_RATE_STEP);
			const { maxError, totalError } = this.measureBuildingError(productionData, candidateRate);
			if (this.measureBuildingErrorExcludingFuel(productionData, candidateRate) <= .01 && firstIntegerRate === null) firstIntegerRate = candidateRate;
			if (maxError < bestCandidateError - 1e-4 || Math.abs(maxError - bestCandidateError) <= 1e-4 && totalError < bestCandidateTotalError - 1e-4 || Math.abs(maxError - bestCandidateError) <= 1e-4 && Math.abs(totalError - bestCandidateTotalError) <= 1e-4 && candidateRate < bestCandidateRate) {
				bestCandidateRate = candidateRate;
				bestCandidateError = maxError;
				bestCandidateTotalError = totalError;
			}
		}
		if (firstIntegerRate !== null) {
			console.debug(`[findRecommendedRate] ✅ Perfect integer rate found (excluding fuel): ${firstIntegerRate}`);
			console.debug("[findRecommendedRate] Returning firstIntegerRate (priority: high)");
			return firstIntegerRate;
		}
		console.debug(`[findRecommendedRate] ⚠️ No perfect integer rate. Best candidate: ${bestCandidateRate}`);
		console.debug(`[findRecommendedRate] Max error: ${bestCandidateError.toFixed(4)}, Total error: ${bestCandidateTotalError.toFixed(4)}`);
		return this.roundRate(bestCandidateRate);
	}
	getMinimumRateForMainBuilding(productionData) {
		const adjustedDuration = this.getAdjustedTime(productionData);
		if (adjustedDuration <= 0) return 1;
		const minRate = SECONDS_PER_MINUTE / adjustedDuration;
		return Math.max(this.roundRate(minRate), RECOMMENDED_RATE_STEP);
	}
	collectCycleTimes(productionData, bucket = []) {
		if (!productionData) return bucket;
		bucket.push(productionData.time || 60);
		if (Array.isArray(productionData.input)) {
			for (const input of productionData.input) if (Array.isArray(input.input)) this.collectCycleTimes(input, bucket);
			else if (input.time) bucket.push(input.time);
		}
		return bucket;
	}
	allBuildingsAreWholeNumbers(productionData, rate) {
		const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
		for (const [key, value] of Object.entries(allBuildings)) {
			if (key === "_metadata") continue;
			const num = value;
			const fraction = Math.abs(num - Math.round(num));
			if (fraction > .05 && fraction < .95) return false;
		}
		return true;
	}
	measureBuildingError(productionData, rate) {
		const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
		let maxError = 0;
		let totalError = 0;
		for (const [key, value] of Object.entries(allBuildings)) {
			if (key === "_metadata") continue;
			const num = value;
			const error = Math.abs(num - Math.round(num));
			if (error > maxError) maxError = error;
			totalError += error;
		}
		for (const fuel of this.calculateFuelBuildings(productionData, allBuildings)) {
			const error = Math.abs(fuel.count - Math.round(fuel.count));
			if (error > maxError) maxError = error;
			totalError += error;
		}
		return {
			maxError,
			totalError
		};
	}
	/** 燃料建物を除外した誤差測定（Auto Ratio用） */
	measureBuildingErrorExcludingFuel(productionData, rate) {
		const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
		let maxError = 0;
		for (const [key, value] of Object.entries(allBuildings)) {
			if (key === "_metadata") continue;
			const num = value;
			const error = Math.abs(num - Math.round(num));
			if (error > maxError) maxError = error;
		}
		return maxError;
	}
	calculateTotals(allBuildings) {
		const totals = {
			buildingCost: {},
			maintenance: {}
		};
		if (!allBuildings || !allBuildings["_metadata"]) return totals;
		for (const [goodId, count] of Object.entries(allBuildings)) {
			if (goodId === "_metadata") continue;
			const metadata = allBuildings["_metadata"][goodId];
			if (!metadata) continue;
			const ceiled = Math.ceil(count);
			if (metadata.building_cost) this.accumulateCosts(totals.buildingCost, metadata.building_cost, ceiled);
			if (metadata.maintanance_cost) this.accumulateCosts(totals.maintenance, metadata.maintanance_cost, ceiled);
		}
		return totals;
	}
	accumulateCosts(target, costs, multiplier) {
		for (const [resource, amount] of Object.entries(costs)) {
			const total = amount * multiplier;
			if (total <= 0) continue;
			target[resource] = (target[resource] || 0) + total;
		}
	}
	lcm(a, b) {
		return a * b / this.gcd(a, b);
	}
	gcd(a, b) {
		if (!b) return a;
		return this.gcd(b, a % b);
	}
	roundRate(rate) {
		return Math.ceil(rate * 10) / 10;
	}
	cloneRecipe(recipe) {
		return structuredClone(recipe);
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/GraphRenderer.ts
var CENTER_X = 360;
var CENTER_Y = 150;
/**
* Renders dependency graphs inside an external SVG template.
* Singleton — always access via GraphRenderer.getInstance().
*/
var GraphRenderer = class GraphRenderer {
	static _instance = null;
	static getInstance() {
		if (!GraphRenderer._instance) GraphRenderer._instance = new GraphRenderer();
		return GraphRenderer._instance;
	}
	templatePath;
	svgMarkup;
	svgElement;
	interactionsBound;
	viewBoxes = /* @__PURE__ */ new Map();
	currentGoodId = null;
	i18n;
	goodsRepository;
	nodeDataMap = /* @__PURE__ */ new WeakMap();
	constructor(config = {}) {
		const { templatePath = "svg/dependency-graph.svg" } = config;
		this.templatePath = templatePath;
		this.i18n = I18nManager.getInstance();
		this.goodsRepository = GoodsRepository.getInstance();
		this.svgMarkup = null;
		this.svgElement = null;
		this.interactionsBound = false;
		this.displayInfoMenue = this.displayInfoMenue.bind(this);
	}
	async attach(container, goodId) {
		if (!container) return;
		if (this.svgElement && this.currentGoodId) this.viewBoxes.set(this.currentGoodId, this.parseViewBox());
		this.currentGoodId = goodId ?? null;
		const savedViewBox = goodId ? this.viewBoxes.get(goodId) : void 0;
		const viewBoxAttr = savedViewBox ? `${savedViewBox.x} ${savedViewBox.y} ${savedViewBox.width} ${savedViewBox.height}` : "0 0 400 400";
		const svgElement = document.createElement("svg");
		svgElement.setAttribute("xmlns", SVG_NS);
		svgElement.setAttribute("id", "dependency-graph");
		svgElement.setAttribute("class", "dependency-graph");
		svgElement.setAttribute("viewBox", viewBoxAttr);
		this.svgMarkup = svgElement.outerHTML;
		container.innerHTML = this.svgMarkup;
		this.svgElement = container.querySelector("#dependency-graph");
		this.interactionsBound = false;
		this.setupInteractions();
	}
	render(productionData, allBuildings) {
		if (!this.svgElement || !productionData) return;
		this.clearSvg();
		if (!allBuildings || Object.keys(allBuildings).length === 0) return;
		const maxDepth = this.calculateMaxDepth(productionData);
		this.renderRecursiveGraph(productionData, CENTER_X, CENTER_Y, 0, allBuildings, null, null, maxDepth);
		this.fitToView();
	}
	clearSvg() {
		if (!this.svgElement) return;
		while (this.svgElement.firstChild) this.svgElement.removeChild(this.svgElement.firstChild);
	}
	renderRecursiveGraph(prodData, x, y, depth, allBuildings, parentX, parentY, maxDepth) {
		if (!prodData || depth > 5) return;
		const good = this.findGood(prodData.id, prodData);
		const hasFuel = prodData.needs_fuel === true;
		const buildingCount = allBuildings[prodData.id];
		const buildings = typeof buildingCount === "number" ? buildingCount : 0;
		const buildingType = prodData.type || "";
		let textAlign = "right";
		const inputs = Array.isArray(prodData.input) ? prodData.input : [];
		const isLeaf = inputs.length === 0 || inputs.every((input) => input.start_of_chain);
		this.addNode({
			x,
			y,
			good,
			buildings,
			textAlign,
			hasFuel,
			buildingType,
			prodNode: prodData,
			depth,
			maxDepth,
			isLeaf,
			startOfChain: prodData.start_of_chain === true,
			buildingCost: prodData.building_cost,
			maintenanceCost: prodData.maintanance_cost,
			productivity: this.calculateProductivity(prodData)
		});
		if (typeof parentX === "number" && typeof parentY === "number") this.drawLink(parentX - 32, parentY, x + 32, y, depth === 0);
		if (!inputs.length) return;
		const nextX = x - 180;
		const inputHeights = inputs.map((input) => {
			if (Array.isArray(input.input)) return this.calculateTreeWidth(input);
			return 1;
		});
		const totalHeight = inputHeights.reduce((sum, height) => sum + height, 0);
		const nodeSpacing = 120;
		let currentOffset = y - totalHeight * nodeSpacing / 2;
		inputs.forEach((input, index) => {
			if (!input.id) return;
			const heightUnits = inputHeights[index] ?? 1;
			const inputY = currentOffset + heightUnits * nodeSpacing / 2;
			currentOffset += heightUnits * nodeSpacing;
			if (Array.isArray(input.input)) {
				this.renderRecursiveGraph(input, nextX, inputY, depth + 1, allBuildings, x, y, maxDepth);
				return;
			}
			if (input.start_of_chain) {
				const inputGood = this.findGood(input.id, input);
				const inputBuildings = allBuildings[input.id] || 0;
				this.addNode({
					x: nextX,
					y: inputY,
					good: inputGood,
					buildings: inputBuildings,
					textAlign: "right",
					hasFuel: false,
					buildingType: input.type || "",
					prodNode: input,
					depth: depth + 1,
					maxDepth,
					isLeaf: true,
					startOfChain: true,
					buildingCost: input.building_cost,
					maintenanceCost: input.maintanance_cost,
					productivity: this.calculateProductivity(input)
				});
				this.drawLink(x - 32, y, nextX + 32, inputY, false);
			}
		});
	}
	addNode(nodeData) {
		if (!this.svgElement) return;
		const { x, y, good, buildings, textAlign, hasFuel, buildingType, prodNode, depth, maxDepth, isLeaf, startOfChain, buildingCost, maintenanceCost, productivity } = nodeData;
		const group = document.createElementNS(SVG_NS, "g");
		group.setAttribute("class", "node");
		const rect = document.createElementNS(SVG_NS, "rect");
		const size = 64;
		rect.setAttribute("x", String(x - size / 2));
		rect.setAttribute("y", String(y - size / 2));
		rect.setAttribute("width", String(size));
		rect.setAttribute("height", String(size));
		rect.setAttribute("rx", "12");
		rect.setAttribute("ry", "12");
		rect.setAttribute("class", "graph-node");
		group.appendChild(rect);
		const img = document.createElementNS(SVG_NS, "image");
		img.setAttributeNS(XLINK_NS, "href", `${ASSETS_ICONS_PATH}${good.icon || good.id}.png`);
		img.setAttribute("x", String(x - size / 2));
		img.setAttribute("y", String(y - size / 2));
		img.setAttribute("width", String(size));
		img.setAttribute("height", String(size));
		img.dataset.goodId = good.id;
		this.nodeDataMap.set(img, {
			x,
			y,
			good,
			buildings,
			textAlign,
			hasFuel,
			buildingType,
			prodNode,
			depth,
			maxDepth,
			isLeaf,
			startOfChain,
			buildingCost,
			maintenanceCost,
			productivity
		});
		img.addEventListener("mousedown", this.displayInfoMenue);
		group.appendChild(img);
		if (hasFuel) this.addCornerImage(group, x, y, size, `${ASSETS_ICONS_PATH}charcoal.png`);
		else for (const icon of ProductionCalculator.getInstance().getActiveVisualModifiersForNode(prodNode)) this.addCornerImage(group, x, y, size, `${ASSETS_ICONS_PATH}${icon}`, true);
		const { labelX, labelAnchor, labelY, buildingsY } = this.resolveLabelGeometry({
			x,
			y,
			textAlign,
			label: good.displayName || good.id,
			buildings: buildings.toFixed(2),
			depth,
			maxDepth,
			isLeaf,
			startOfChain
		});
		const labelText = document.createElementNS(SVG_NS, "text");
		labelText.setAttribute("x", String(labelX));
		labelText.setAttribute("y", String(labelY));
		labelText.setAttribute("text-anchor", labelAnchor);
		labelText.setAttribute("class", "graph-text");
		labelText.setAttribute("data-role", "label");
		labelText.setAttribute("data-good-id", good.id || "");
		labelText.textContent = good.displayName || good.id || "good";
		group.appendChild(labelText);
		const buildingText = document.createElementNS(SVG_NS, "text");
		buildingText.setAttribute("x", String(labelX));
		buildingText.setAttribute("y", String(buildingsY));
		buildingText.setAttribute("text-anchor", labelAnchor);
		buildingText.setAttribute("class", "graph-subtext");
		buildingText.setAttribute("data-role", "buildings");
		buildingText.setAttribute("data-good-id", good.id || "");
		buildingText.textContent = `${buildings.toFixed(2)}x`;
		group.appendChild(buildingText);
		this.svgElement.appendChild(group);
	}
	drawLink(x1, y1, x2, y2, primary) {
		if (!this.svgElement) return;
		let edgeGroup = this.svgElement.querySelector("g.edges");
		if (!edgeGroup) {
			edgeGroup = document.createElementNS(SVG_NS, "g");
			edgeGroup.setAttribute("class", "edges");
			this.svgElement.insertBefore(edgeGroup, this.svgElement.firstChild);
		}
		const line = document.createElementNS(SVG_NS, "line");
		line.setAttribute("x1", String(x1));
		line.setAttribute("y1", String(y1));
		line.setAttribute("x2", String(x2));
		line.setAttribute("y2", String(y2));
		line.setAttribute("class", primary ? "graph-link" : "graph-link-secondary");
		edgeGroup.appendChild(line);
	}
	resolveLabelGeometry(params) {
		const { x, y, textAlign, depth, startOfChain } = params;
		const offset = 45;
		if (depth >= 2 && startOfChain) return {
			labelX: x,
			labelY: y + 50,
			buildingsY: y + 67,
			labelAnchor: "middle"
		};
		return {
			labelX: x - offset,
			labelY: y - 5,
			buildingsY: y + 12,
			labelAnchor: "end"
		};
	}
	addCornerImage(group, x, y, size, href, filled = false) {
		const icon = document.createElementNS(SVG_NS, "image");
		const iconSize = Math.round(size * .56);
		const cornerX = x + size / 2 - iconSize + 6;
		const cornerY = y + size / 2 - iconSize + 6;
		icon.setAttributeNS(XLINK_NS, "href", href);
		icon.setAttribute("x", String(cornerX));
		icon.setAttribute("y", String(cornerY));
		icon.setAttribute("width", String(iconSize));
		icon.setAttribute("height", String(iconSize));
		if (filled) {
			const bg = document.createElementNS(SVG_NS, "rect");
			bg.setAttribute("x", String(cornerX));
			bg.setAttribute("y", String(cornerY));
			bg.setAttribute("width", String(iconSize));
			bg.setAttribute("height", String(iconSize));
			bg.setAttribute("rx", "5");
			bg.setAttribute("ry", "5");
			bg.setAttribute("fill", "#5f032e");
			group.appendChild(bg);
		}
		group.appendChild(icon);
	}
	calculateProductivity(node) {
		return ProductionCalculator.getInstance().getProductivity(node);
	}
	calculateTreeWidth(prodData) {
		if (!prodData || !Array.isArray(prodData.input) || !prodData.input.length) return 1;
		return prodData.input.reduce((sum, input) => {
			if (Array.isArray(input.input)) return sum + this.calculateTreeWidth(input);
			return sum + 1;
		}, 0);
	}
	calculateMaxDepth(prodData, depth = 0) {
		if (!prodData || !Array.isArray(prodData.input) || !prodData.input.length) return depth;
		return prodData.input.reduce((max, input) => {
			if (Array.isArray(input.input)) return Math.max(max, this.calculateMaxDepth(input, depth + 1));
			return Math.max(max, depth + 1);
		}, depth);
	}
	findGood(id, node) {
		const found = this.goodsRepository.getGoodsList().find((good) => good.id === id);
		if (found) return {
			id: found.id,
			displayName: found.displayName,
			icon: found.icon
		};
		const translatedName = this.i18n.t(`goods.${id}`);
		const fallbackName = node?.name || id;
		if (translatedName !== id && translatedName !== fallbackName) return {
			id,
			displayName: translatedName,
			icon: id
		};
		return {
			id,
			displayName: fallbackName,
			icon: id
		};
	}
	setupInteractions() {
		if (!this.svgElement || this.interactionsBound) return;
		this.interactionsBound = true;
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let viewBox = this.parseViewBox();
		const activeTouches = /* @__PURE__ */ new Map();
		let initialPinchDistance = null;
		let initialViewBox = null;
		this.svgElement.addEventListener("contextmenu", (e) => e.preventDefault());
		this.svgElement.addEventListener("mousedown", (e) => {
			if (e.button === 0 && e.target.tagName !== "image") {
				isDragging = true;
				startX = e.clientX;
				startY = e.clientY;
				this.svgElement.style.cursor = "grabbing";
				e.preventDefault();
			}
		});
		this.svgElement.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			const viewBox = this.parseViewBox();
			const clientRect = this.svgElement.getBoundingClientRect();
			const dx = (e.clientX - startX) * (viewBox.width / clientRect.width);
			const dy = (e.clientY - startY) * (viewBox.height / clientRect.height);
			viewBox.x -= dx;
			viewBox.y -= dy;
			this.updateViewBox(viewBox);
			startX = e.clientX;
			startY = e.clientY;
		});
		this.svgElement.addEventListener("mouseup", (e) => {
			if (e.button === 0) {
				isDragging = false;
				this.svgElement.style.cursor = "default";
			}
		});
		this.svgElement.addEventListener("mouseleave", () => {
			isDragging = false;
			this.svgElement.style.cursor = "default";
		});
		this.svgElement.addEventListener("wheel", (e) => {
			e.preventDefault();
			const viewBox = this.parseViewBox();
			const rect = this.svgElement.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const svgX = viewBox.x + mouseX / rect.width * viewBox.width;
			const svgY = viewBox.y + mouseY / rect.height * viewBox.height;
			const zoomFactor = e.deltaY > 0 ? 1.1 : .9;
			const newWidth = viewBox.width * zoomFactor;
			const newHeight = viewBox.height * zoomFactor;
			viewBox.x = svgX - mouseX / rect.width * newWidth;
			viewBox.y = svgY - mouseY / rect.height * newHeight;
			viewBox.width = newWidth;
			viewBox.height = newHeight;
			this.updateViewBox(viewBox);
		});
		this.svgElement.addEventListener("touchstart", (e) => {
			if (e.touches.length > 0) e.preventDefault();
			for (let i = 0; i < e.changedTouches.length; i++) {
				const touch = e.changedTouches.item(i);
				if (!touch) continue;
				activeTouches.set(touch.identifier, this.clientToSvgPoint(touch));
			}
			if (activeTouches.size === 1) {
				const point = Array.from(activeTouches.values())[0];
				isDragging = true;
				startX = point.x;
				startY = point.y;
				this.svgElement.style.cursor = "grabbing";
			} else if (activeTouches.size === 2) {
				const points = Array.from(activeTouches.values());
				const p1 = points[0];
				const p2 = points[1];
				initialPinchDistance = this.distance(p1, p2);
				initialViewBox = { ...viewBox };
				isDragging = false;
			}
		}, { passive: false });
		this.svgElement.addEventListener("touchmove", (e) => {
			if (e.touches.length > 0) e.preventDefault();
			for (let i = 0; i < e.changedTouches.length; i++) {
				const touch = e.changedTouches.item(i);
				if (!touch) continue;
				activeTouches.set(touch.identifier, this.clientToSvgPoint(touch));
			}
			if (activeTouches.size === 1 && isDragging) {
				const point = Array.from(activeTouches.values())[0];
				const viewBox = this.parseViewBox();
				const clientRect = this.svgElement.getBoundingClientRect();
				const dx = (point.x - startX) * (viewBox.width / clientRect.width);
				const dy = (point.y - startY) * (viewBox.height / clientRect.height);
				viewBox.x -= dx;
				viewBox.y -= dy;
				this.updateViewBox(viewBox);
				startX = point.x;
				startY = point.y;
			} else if (activeTouches.size === 2 && initialPinchDistance && initialViewBox) {
				const points = Array.from(activeTouches.values());
				const p1 = points[0];
				const p2 = points[1];
				const currentDistance = this.distance(p1, p2);
				if (currentDistance <= 0) return;
				const scale = initialPinchDistance / currentDistance;
				const mid = {
					x: (p1.x + p2.x) / 2,
					y: (p1.y + p2.y) / 2
				};
				const clientRect = this.svgElement.getBoundingClientRect();
				const focusX = initialViewBox.x + mid.x / clientRect.width * initialViewBox.width;
				const focusY = initialViewBox.y + mid.y / clientRect.height * initialViewBox.height;
				const newWidth = initialViewBox.width * scale;
				const newHeight = initialViewBox.height * scale;
				const viewBox = this.parseViewBox();
				viewBox.x = focusX - mid.x / clientRect.width * newWidth;
				viewBox.y = focusY - mid.y / clientRect.height * newHeight;
				viewBox.width = newWidth;
				viewBox.height = newHeight;
				this.updateViewBox(viewBox);
			}
		}, { passive: false });
		const resetTouches = () => {
			activeTouches.clear();
			initialPinchDistance = null;
			initialViewBox = null;
			isDragging = false;
			this.svgElement.style.cursor = "default";
		};
		this.svgElement.addEventListener("touchend", (e) => {
			for (let i = 0; i < e.changedTouches.length; i++) {
				const touch = e.changedTouches.item(i);
				if (!touch) continue;
				activeTouches.delete(touch.identifier);
			}
			if (activeTouches.size < 2) {
				initialPinchDistance = null;
				initialViewBox = null;
			}
			if (activeTouches.size === 0) resetTouches();
			else if (activeTouches.size === 1) {
				const point = Array.from(activeTouches.values())[0];
				isDragging = true;
				startX = point.x;
				startY = point.y;
			}
		});
		this.svgElement.addEventListener("touchcancel", resetTouches);
	}
	parseViewBox() {
		if (!this.svgElement) return {
			x: 0,
			y: 0,
			width: 400,
			height: 400
		};
		const viewBoxStr = this.svgElement.getAttribute("viewBox");
		if (!viewBoxStr) return {
			x: 0,
			y: 0,
			width: 400,
			height: 400
		};
		const vb = viewBoxStr.split(" ").map(Number).filter((v) => !Number.isNaN(v));
		if (vb.length !== 4) return {
			x: 0,
			y: 0,
			width: 400,
			height: 400
		};
		return {
			x: vb[0],
			y: vb[1],
			width: vb[2],
			height: vb[3]
		};
	}
	updateViewBox(viewBox) {
		this.svgElement?.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
		if (this.currentGoodId) this.viewBoxes.set(this.currentGoodId, { ...viewBox });
	}
	/**
	* グラフ全体が見渡せるようviewBoxを自動調整
	*/
	fitToView() {
		if (!this.svgElement) return;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				try {
					const bbox = this.svgElement.getBBox();
					if (bbox.width === 0 || bbox.height === 0) return;
					const padding = 100;
					const newViewBox = {
						x: bbox.x - padding,
						y: bbox.y - padding + 80,
						width: bbox.width + padding * 2,
						height: bbox.height + padding * 2
					};
					this.updateViewBox(newViewBox);
				} catch (error) {
					console.warn("[fitToView] getBBox failed:", error);
				}
			});
		});
	}
	clientToSvgPoint(touch) {
		const rect = this.svgElement.getBoundingClientRect();
		return {
			x: touch.clientX - rect.left,
			y: touch.clientY - rect.top
		};
	}
	distance(p1, p2) {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		return Math.hypot(dx, dy);
	}
	/**
	* Click Event on the icon
	*/
	displayInfoMenue(event) {
		if (event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		const currentTarget = event.currentTarget;
		const nodeData = this.nodeDataMap.get(currentTarget);
		if (!nodeData) return;
		const { buildingCost, maintenanceCost, buildings, good, productivity } = nodeData;
		let infoContainer = document.createElement("div");
		infoContainer.classList.add("metadata-container");
		infoContainer.style.position = "absolute";
		infoContainer.style.left = `${event.clientX}px`;
		infoContainer.style.top = `${event.clientY}px`;
		infoContainer.tabIndex = -1;
		infoContainer.style.zIndex = "1000";
		const content = document.createElement("div");
		content.className = "metadata-content";
		const header = document.createElement("div");
		header.className = "metadata-header";
		header.innerHTML = `
            <img src="${ASSETS_ICONS_PATH}${good.icon || good.id}.png" alt="${good.displayName}" class="metadata-icon" onerror="this.style.display='none';"/>
            <h4>${good.displayName || good.id}</h4>
        `;
		content.appendChild(header);
		const countInfo = document.createElement("div");
		countInfo.className = "metadata-row";
		if (productivity) {
			const productivityInfo = document.createElement("div");
			productivityInfo.className = "metadata-row";
			productivityInfo.innerHTML = `<strong>${this.i18n.t("ui.productivity")}:</strong> ${(productivity * 100 * Math.min(buildings, 1)).toFixed(0)}%`;
			content.appendChild(productivityInfo);
		}
		countInfo.innerHTML = `<strong>${this.i18n.t("ui.required")}:</strong> ${buildings ? buildings.toFixed(2) : "0.00"}x`;
		content.appendChild(countInfo);
		const renderCostList = (titleKey, costs) => {
			if (!costs || Object.keys(costs).length === 0) return null;
			const validCosts = Object.entries(costs).filter(([, amount]) => amount > 0);
			if (validCosts.length === 0) return null;
			const container = document.createElement("div");
			container.className = "metadata-section";
			container.innerHTML = `<h5>${this.i18n.t(titleKey)}</h5>`;
			const list = document.createElement("div");
			list.className = "cost-list";
			list.style.display = "flex";
			list.style.flexDirection = "row";
			list.style.flexWrap = "wrap";
			list.style.gap = "0.5rem";
			list.style.alignItems = "center";
			validCosts.forEach(([resource, amount]) => {
				const item = document.createElement("div");
				item.className = "cost-resource";
				const translatedName = this.i18n.t(`goods.${resource}`);
				const label = translatedName !== resource ? translatedName : resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
				item.innerHTML = `<img src="${ASSETS_ICONS_PATH}${resource}.png" alt="${label}" class="cost-icon-small" onerror="this.style.display='none';"/><span>${amount}</span>`;
				item.addEventListener("mouseenter", () => {
					const tip = document.createElement("div");
					tip.className = "cost-tooltip";
					tip.textContent = label;
					document.body.appendChild(tip);
					const rect = item.getBoundingClientRect();
					const tipRect = tip.getBoundingClientRect();
					tip.style.left = `${rect.left + rect.width / 2 - tipRect.width / 2}px`;
					tip.style.top = `${rect.top - tipRect.height - 4}px`;
				});
				item.addEventListener("mouseleave", () => {
					document.querySelectorAll(".cost-tooltip").forEach((el) => el.remove());
				});
				list.appendChild(item);
			});
			container.appendChild(list);
			return container;
		};
		const buildingCostEl = renderCostList("ui.constructionCost", buildingCost);
		if (buildingCostEl) content.appendChild(buildingCostEl);
		const maintenanceCostEl = renderCostList("ui.maintenance", maintenanceCost);
		if (maintenanceCostEl) content.appendChild(maintenanceCostEl);
		infoContainer.appendChild(content);
		document.body.appendChild(infoContainer);
		setTimeout(() => {
			infoContainer.focus();
		}, 10);
		let closed = false;
		const closeMenu = () => {
			if (closed) return;
			closed = true;
			infoContainer.remove();
			document.removeEventListener("mousedown", outsideClickListener);
		};
		const outsideClickListener = (e) => {
			if (!infoContainer.contains(e.target)) closeMenu();
		};
		setTimeout(() => {
			document.addEventListener("mousedown", outsideClickListener);
		}, 0);
		infoContainer.addEventListener("focusout", (e) => {
			if (infoContainer.contains(e.relatedTarget)) return;
			closeMenu();
		});
		infoContainer.addEventListener("keydown", (e) => {
			if (e.key === "Escape") closeMenu();
		});
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/ProductionModifier.ts
var AbstractProductionModifier = class {
	configKey;
	constructor(key) {
		this.configKey = key;
	}
	/**
	* Returns the icon path to display on a specific graph node, or null if this modifier
	* does not visually affect the given good. Default delegates to getVisualModifier().
	*/
	getVisualModifierForNode(good) {
		return this.getVisualModifier();
	}
	getProductivity(good) {
		const value = this.getValue(good);
		return {
			type: this.getType(),
			value,
			isAffected: this.getType() === "percentage" ? value !== 1 : value > 0
		};
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/modifier/Item.ts
function normalizeGoodName(name) {
	return name.trim().toLowerCase().replace(/[_-]/g, " ");
}
var Item = class Item extends AbstractProductionModifier {
	static KEYS = {
		enabled: "item.enabled",
		chainPrefix: "item.chain"
	};
	static activeChainId = null;
	repository;
	i18n;
	latestSettings;
	constructor() {
		super("item");
		this.repository = GoodsRepository.getInstance();
		this.i18n = I18nManager.getInstance();
		this.latestSettings = {};
	}
	static setActiveChain(chainId) {
		if (Item.activeChainId === chainId) return;
		console.log("[Item] setActiveChain called with:", chainId);
		Item.activeChainId = chainId;
		try {
			ModifierRegistry.getInstance().notifyDefinitionsChanged();
		} catch (error) {
			console.error("[Item] Failed to notify definitions changed:", error);
		}
	}
	static getChainSettingKey(chainId) {
		return `${Item.KEYS.chainPrefix}.${chainId}.enabled`;
	}
	static getItemSettingKey(chainId, guid) {
		return `${Item.KEYS.chainPrefix}.${chainId}.item.${guid}`;
	}
	static getActiveGuidsForChain(settings, chainId) {
		const prefix = `${Item.KEYS.chainPrefix}.${chainId}.item.`;
		const guids = [];
		for (const [key, value] of Object.entries(settings)) {
			if (!key.startsWith(prefix) || value !== true) continue;
			const guid = key.slice(prefix.length).trim();
			if (guid) guids.push(guid);
		}
		return guids;
	}
	loadConfig() {}
	saveConfig() {}
	applySettings(config) {
		this.latestSettings = { ...config };
	}
	getType() {
		return "flat";
	}
	getDefinition() {
		const toggles = [];
		const activeChainId = Item.activeChainId;
		console.log("[Item] getDefinition called, activeChainId:", activeChainId);
		if (activeChainId) {
			const allChains = this.repository.getCompatibleItemChains();
			console.log("[Item] Available chain IDs:", allChains.map((c) => c.id));
			const chain = allChains.find((c) => c.id === activeChainId);
			console.log("[Item] Found chain for activeChainId:", chain ? chain.id : "NOT FOUND");
			if (chain) {
				console.log("[Item] Chain items count:", chain.items.length);
				for (const item of chain.items) {
					const pct = this.repository.getItemProductivity(item.guid);
					const icon = item.iconFilename ? `items/${item.iconFilename}` : "infrastructure/coastal.png";
					const localizedName = this.i18n.t(`specialists.${item.guid}`);
					toggles.push({
						key: this.getItemKey(chain.id, item.guid),
						label: localizedName,
						description: `${chain.displayName}: +${this.formatPercent(pct)} productivity`,
						icon
					});
				}
			} else console.warn("[Item] No chain found for activeChainId:", activeChainId);
		}
		console.log("[Item] Returning definition with toggles count:", toggles.length);
		return {
			id: "item",
			label: "Items",
			description: "Apply per-item productivity boosts from compatible item sets.",
			icon: "infrastructure/coastal.png",
			toggles
		};
	}
	getVisualModifier() {
		return null;
	}
	getVisualModifierForNode(good) {
		const activeChainId = Item.activeChainId;
		if (!activeChainId) return null;
		const goodName = normalizeGoodName(good.name ?? "");
		if (!goodName) return null;
		const chain = this.repository.getCompatibleItemChains().find((c) => c.id === activeChainId);
		if (!chain) return null;
		for (const item of chain.items) {
			if (!this.readBool(this.getItemKey(activeChainId, item.guid))) continue;
			if (!item.iconFilename) continue;
			if (this.repository.getItemTargetGoodNames(item.guid).has(goodName)) return `items/${item.iconFilename}`;
		}
		return null;
	}
	getValue(good) {
		const activeChainId = Item.activeChainId;
		if (!activeChainId) return 0;
		const goodName = normalizeGoodName(good.name ?? "");
		if (!goodName) return 0;
		const compatibleItems = this.repository.getCompatibleItems(activeChainId);
		let productivity = 0;
		for (const item of compatibleItems) {
			if (!this.readBool(this.getItemKey(activeChainId, item.guid))) continue;
			if (this.repository.getItemTargetGoodNames(item.guid).has(goodName)) productivity += this.repository.getItemProductivity(item.guid);
		}
		return productivity;
	}
	getItemKey(chainId, guid) {
		return Item.getItemSettingKey(chainId, guid);
	}
	readBool(key) {
		return typeof this.latestSettings[key] === "boolean" && Boolean(this.latestSettings[key]);
	}
	formatPercent(value) {
		const percent = value * 100;
		return Number.isInteger(percent) ? percent.toString() + "%" : percent.toFixed(2) + "%";
	}
};
function registerItemModifier() {
	ModifierRegistry.getInstance().register(new Item());
}
//#endregion
//#region apps/calculator/src/ts/modules/Utils.ts
function formatDuration(seconds = 0) {
	const safeSeconds = Math.max(0, Number(seconds) || 0);
	const minutes = Math.floor(safeSeconds / 60);
	const secs = Math.round(safeSeconds % 60);
	return `${minutes}:${String(secs).padStart(2, "0")}`;
}
var URLTools = {
	/**
	* Converts a object of boolean values into a single query URL parameters.
	* If key is true, the keys are merged into a comma separated list under the "key" parameter.
	* 
	*/
	toGetParam(values) {
		let list = [];
		for (const [k, v] of Object.entries(values)) if (v) list.push(k);
		return `${list.join("~")}`;
	},
	fromGetParam(key, paramString, defaults) {
		const value = new URLSearchParams(paramString).get(key);
		if (!value) return defaults;
		const enabled = new Set(value.split("~").map((s) => s.trim()));
		const result = { ...defaults };
		for (const key of Object.keys(result)) result[key] = enabled.has(key);
		return result;
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/ProductionChainView.ts
var ProductionChainView = class {
	container;
	goodsRepository;
	settingsManager;
	modifierRegistry;
	i18n;
	calculator;
	graphRenderer;
	currentGood;
	sourceRecipe;
	currentRate;
	baseInputs;
	graphHost;
	targetInput;
	recommendButton;
	buildingCostElement;
	maintenanceElement;
	onBack;
	constructor(config) {
		const { container, calculator, graphRenderer } = config;
		this.container = container;
		this.goodsRepository = GoodsRepository.getInstance();
		this.settingsManager = SettingsManager.getInstance();
		this.modifierRegistry = ModifierRegistry.getInstance();
		this.i18n = I18nManager.getInstance();
		this.calculator = calculator;
		this.graphRenderer = graphRenderer;
		this.currentGood = null;
		this.sourceRecipe = null;
		this.currentRate = 1;
		this.baseInputs = /* @__PURE__ */ new Map();
		this.graphHost = null;
		this.targetInput = null;
		this.recommendButton = null;
		this.buildingCostElement = null;
		this.maintenanceElement = null;
		this.onBack = null;
	}
	setBackHandler(handler) {
		this.onBack = handler;
	}
	hasSelection() {
		return Boolean(this.currentGood && this.sourceRecipe);
	}
	showLoading(good) {
		this.currentGood = good;
		this.container.classList.remove("hidden");
		const chainLabel = this.i18n.t("ui.dependencyGraph");
		const backLabel = this.i18n.t("ui.back");
		this.container.innerHTML = `
            <div class="calculator-header">
                <button type="button" class="back-button" data-action="back">${backLabel}</button>
                <h3>${chainLabel}: ${good.displayName}</h3>
            </div>
            <div class="calculator-content">
                <p>${this.i18n.t("ui.loadingProductionData")} <strong>${good.displayName}</strong>...</p>
            </div>
        `;
		this.bindBackButton();
	}
	async showChain(good, recipe, options = {}) {
		this.currentGood = good;
		if (!options.preserveRate || !this.sourceRecipe) this.sourceRecipe = this.calculator.cloneRecipe(recipe);
		await this.renderFromSource({ preserveRate: Boolean(options.preserveRate) });
	}
	async refresh() {
		if (!this.hasSelection()) return;
		await this.renderFromSource({ preserveRate: true });
	}
	async renderFromSource(options) {
		if (!this.sourceRecipe || !this.currentGood) return;
		if (!options.preserveRate) this.currentRate = 1;
		Item.setActiveChain(this.currentGood.id);
		const recipe = this.calculator.cloneRecipe(this.sourceRecipe);
		this.baseInputs = this.calculator.collectBaseInputs(recipe);
		this.container.classList.remove("hidden");
		this.container.innerHTML = this.buildMarkup(this.currentGood);
		this.graphHost = this.container.querySelector("[data-role=\"graph-host\"]");
		this.targetInput = this.container.querySelector("#target-rate");
		this.recommendButton = this.container.querySelector("#recommend-ratio-btn");
		this.buildingCostElement = document.querySelector("#total-construction-cost");
		this.maintenanceElement = document.querySelector("#total-maintenance-cost");
		this.bindBackButton();
		this.bindControls(recipe);
		if (this.graphHost) await this.graphRenderer.attach(this.graphHost, this.currentGood.id);
		this.updateCalculations(recipe);
	}
	applySettingsToCurrentView() {
		if (!this.sourceRecipe || !this.currentGood) return;
		this.syncModifierControlState();
		const recipe = this.calculator.cloneRecipe(this.sourceRecipe);
		this.baseInputs = this.calculator.collectBaseInputs(recipe);
		this.updateCalculations(recipe);
		this.updateTimeBadges(recipe);
	}
	async refreshView() {
		if (!this.sourceRecipe || !this.currentGood) return;
		await this.renderFromSource({ preserveRate: true });
	}
	bindBackButton() {
		this.container.querySelector("[data-action=\"back\"]")?.addEventListener("click", () => this.onBack?.());
	}
	bindControls(recipe) {
		if (this.targetInput) {
			this.targetInput.value = (this.currentRate ?? 1).toString();
			this.targetInput.addEventListener("input", () => {
				const value = parseFloat(this.targetInput.value);
				this.currentRate = Number.isFinite(value) && value >= 0 ? value : 0;
				this.updateCalculations(recipe);
			});
		}
		this.recommendButton?.addEventListener("click", () => {
			console.debug("[Auto Ratio] Button clicked");
			console.debug("[Auto Ratio] Current rate before:", this.currentRate);
			const recommended = this.calculator.findRecommendedRate(recipe);
			console.debug("[Auto Ratio] Recommended rate:", recommended);
			this.currentRate = recommended;
			if (this.targetInput) {
				this.targetInput.value = recommended.toFixed(2);
				console.debug("[Auto Ratio] Input field updated to:", this.targetInput.value);
			}
			this.updateCalculations(recipe);
		});
		this.container.querySelectorAll("[data-setting-key]").forEach((node) => {
			node.addEventListener("click", () => {
				const button = node;
				const key = button.dataset.settingKey;
				const requires = button.dataset.settingRequires;
				if (!key) return;
				if (requires && !this.settingsManager.getSetting(requires)) return;
				this.settingsManager.toggleSetting(key);
			});
		});
		this.container.querySelectorAll("[data-setting-num-key]").forEach((node) => {
			node.addEventListener("input", () => {
				const input = node;
				const key = input.dataset.settingNumKey;
				const requires = input.dataset.settingRequires;
				if (!key) return;
				if (requires && !this.settingsManager.getSetting(requires)) return;
				const val = parseFloat(input.value);
				if (Number.isFinite(val)) this.settingsManager.setSettingValue(key, val);
			});
		});
		this.container.querySelectorAll("[data-setting-select-key]").forEach((node) => {
			node.addEventListener("change", () => {
				const select = node;
				const key = select.dataset.settingSelectKey;
				const requires = select.dataset.settingRequires;
				if (!key) return;
				if (requires && !this.settingsManager.getSetting(requires)) return;
				this.settingsManager.setSettingValue(key, select.value);
			});
		});
	}
	buildMarkup(good) {
		const chainLabel = this.i18n.t("ui.dependencyGraph");
		this.i18n.t("ui.buildingCost");
		this.i18n.t("ui.maintenance");
		const backLabel = this.i18n.t("ui.back");
		return `
            <div class="calculator-content">
                <div class="production-details-top single-column">
                    <div class="production-header-left">
                        <div class="calculator-header">
                            <button class="back-button" type="button" data-action="back" aria-label="${backLabel}">${backLabel}</button>
                            <h3>${chainLabel}: ${good.displayName}</h3>
                        </div>
                        <div class="production-rate-inline">
                            <label for="target-rate">${this.i18n.t("ui.outputPerMinute")}</label>
                            <input id="target-rate" type="number" min="0" step="1" value="${this.currentRate ?? 1}" />
                            <button id="recommend-ratio-btn" type="button" class="recommend-button" title="整数建物数になる最適レートを自動設定します">${this.i18n.t("ui.autoRatio")}</button>
                        </div>
                    </div>
                </div>
                <div class="graph-panel">
                    <div class="production-graph">
                        <h4>${chainLabel}</h4>
                        <div class="graph-host" data-role="graph-host"></div>
                    </div>
                </div>
            </div>
        `;
	}
	buildBaseInputCards(baseInputs = /* @__PURE__ */ new Map()) {
		const cards = [];
		const goodsList = this.goodsRepository.getGoodsList();
		baseInputs.forEach((input, id) => {
			const goodsListEntry = goodsList.find((g) => g.id === id);
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
		const content = cards.length ? cards.join("") : `<p class="production-empty-note">${this.i18n.t("ui.noDirectBaseInput")}</p>`;
		return `
            <div class="production-info production-info-compact">
                <h4>${this.i18n.t("ui.inputs")}</h4>
                <div class="production-grid compact-grid">
                    ${content}
                </div>
            </div>
        `;
	}
	buildFuelCards(fuelList = []) {
		const goodsList = this.goodsRepository.getGoodsList();
		const cards = fuelList.map((fuel) => {
			const goodsListEntry = goodsList.find((g) => g.id === fuel.id);
			const displayName = goodsListEntry?.displayName || fuel.id;
			const icon = goodsListEntry?.icon || fuel.id;
			const burnLabel = fuel.burning_time ? `<div class="production-card-time">${formatDuration(fuel.burning_time)}</div>` : "";
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
		const content = cards.length ? cards.join("") : `<p class="production-empty-note">${this.i18n.t("ui.noFuelDependency")}</p>`;
		return `
            <div class="production-info production-info-compact">
                <h4>${this.i18n.t("ui.fuel")}</h4>
                <div class="production-grid compact-grid">
                    ${content}
                </div>
            </div>
        `;
	}
	buildTimeBadge(node, nodeId) {
		const time = node.time;
		if (!time) return "";
		const baseTime = time;
		const adjusted = node.time ? this.calculator.getAdjustedTime(node) : baseTime;
		const boosted = Math.abs(adjusted - baseTime) > .01;
		return `
            <div class="production-card-time"${nodeId ? ` data-time-node-id="${nodeId}"` : ""} title="${boosted ? `Base ${formatDuration(baseTime)}` : "No active boost"}">
                ${formatDuration(adjusted)}
                ${boosted ? "<div class=\"boosted-indicator\">Boosted</div>" : ""}
            </div>
        `;
	}
	updateCalculations(recipe) {
		if (!recipe) return;
		const rate = typeof this.currentRate === "number" ? this.currentRate : 1;
		console.debug("[updateCalculations] Using rate:", rate, "for good:", recipe.id);
		const workingRecipe = this.calculator.cloneRecipe(recipe);
		const allBuildings = this.calculator.collectAllBuildings(workingRecipe, rate, {});
		console.debug("[updateCalculations] Buildings calculated:", allBuildings);
		this.updateBuildingCounts(allBuildings);
		this.updateCostSummary(allBuildings);
		this.graphRenderer.render(recipe, allBuildings);
	}
	updateBuildingCounts(allBuildings = {}) {
		Object.entries(allBuildings).forEach(([goodId, buildings]) => {
			if (goodId === "_metadata") return;
			const target = this.container.querySelector(`[data-building-count="${goodId}"]`);
			if (target && typeof buildings === "number") target.textContent = `${(buildings || 0).toFixed(2)}x`;
		});
	}
	updateCostSummary(allBuildings) {
		if (!this.buildingCostElement || !this.maintenanceElement) return;
		const totals = this.calculator.calculateTotals(allBuildings);
		const buildingCostContainer = this.buildCostElements(totals.buildingCost);
		this.buildingCostElement.replaceChildren(buildingCostContainer);
		const maintenanceContainer = this.buildCostElements(totals.maintenance);
		const metadata = allBuildings._metadata;
		const charcoalFuelBuildings = metadata ? Object.values(metadata).reduce((sum, node) => {
			if (!node?.id) return sum;
			return sum + this.calculator.calculateFuelBuildings(node, allBuildings).filter((fuel) => fuel.id === "charcoal").reduce((nodeSum, fuel) => nodeSum + fuel.count, 0);
		}, 0) : 0;
		if (charcoalFuelBuildings > 0) {
			const charcoalLabel = this.i18n.t("goods.charcoal");
			maintenanceContainer.appendChild(this.buildCostElement("charcoal", `${charcoalFuelBuildings.toFixed(2)}x`, charcoalLabel !== "charcoal" ? charcoalLabel : "Coal"));
		}
		this.maintenanceElement.replaceChildren(maintenanceContainer);
	}
	syncModifierControlState() {
		this.container.querySelectorAll("[data-setting-key]").forEach((node) => {
			const button = node;
			const key = button.dataset.settingKey;
			const requires = button.dataset.settingRequires;
			if (!key) return;
			const active = this.settingsManager.getSetting(key);
			const unlocked = !requires || this.settingsManager.getSetting(requires);
			button.classList.toggle("active", active);
			button.classList.toggle("locked", !unlocked);
			button.setAttribute("aria-pressed", String(active));
		});
		this.container.querySelectorAll("[data-setting-num-key]").forEach((node) => {
			const input = node;
			const key = input.dataset.settingNumKey;
			const requires = input.dataset.settingRequires;
			if (!key) return;
			const unlocked = !requires || this.settingsManager.getSetting(requires);
			const currentVal = this.settingsManager.getSettingRaw(key);
			if (typeof currentVal === "number" || typeof currentVal === "string") input.value = String(currentVal);
			input.disabled = !unlocked;
			input.closest(".modifier-num-input-label")?.classList.toggle("locked", !unlocked);
		});
		this.container.querySelectorAll("[data-setting-select-key]").forEach((node) => {
			const select = node;
			const key = select.dataset.settingSelectKey;
			const requires = select.dataset.settingRequires;
			if (!key) return;
			const unlocked = !requires || this.settingsManager.getSetting(requires);
			const currentVal = this.settingsManager.getSettingRaw(key);
			if (typeof currentVal === "string") select.value = currentVal;
			select.disabled = !unlocked;
			select.closest(".modifier-select-label")?.classList.toggle("locked", !unlocked);
		});
	}
	updateTimeBadges(recipe) {
		this.container.querySelectorAll(".production-card-time[data-time-node-id]").forEach((badge) => {
			const nodeId = badge.dataset.timeNodeId;
			if (!nodeId) return;
			const node = recipe.id === nodeId ? recipe : this.baseInputs.get(nodeId);
			if (!node?.time) return;
			const baseTime = node.time;
			const adjusted = this.calculator.getAdjustedTime(node);
			const boosted = Math.abs(adjusted - baseTime) > .01;
			badge.title = boosted ? `Base ${formatDuration(baseTime)}` : "No active boost";
			badge.innerHTML = `
                ${formatDuration(adjusted)}
                ${boosted ? "<div class=\"boosted-indicator\">Boosted</div>" : ""}
            `;
		});
	}
	buildCostElements(costs = {}) {
		const container = document.createElement("div");
		container.className = "cost-list";
		container.style.display = "flex";
		container.style.flexDirection = "row";
		container.style.flexWrap = "wrap";
		container.style.gap = "0.5rem";
		container.style.alignItems = "center";
		const entries = Object.entries(costs).filter(([, amount]) => amount > 0);
		if (!entries.length) {
			const none = document.createElement("span");
			none.className = "cost-none";
			none.textContent = this.i18n.t("ui.none");
			container.appendChild(none);
			return container;
		}
		entries.forEach(([resource, amount]) => {
			const translatedLabel = this.i18n.t(`goods.${resource}`);
			const fallbackLabel = resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
			const label = translatedLabel !== resource ? translatedLabel : fallbackLabel;
			container.appendChild(this.buildCostElement(resource, String(amount), label));
		});
		return container;
	}
	buildCostElement(resource, amountText, label) {
		const item = document.createElement("span");
		item.className = "cost-resource";
		item.innerHTML = `<img src="${ASSETS_ICONS_PATH}${resource}.png" alt="${label}" class="cost-icon" onerror="this.style.display='none';"/><span class="cost-amount">${amountText}</span>`;
		item.addEventListener("mouseenter", () => {
			const tip = document.createElement("div");
			tip.className = "cost-tooltip";
			tip.textContent = label;
			document.body.appendChild(tip);
			const rect = item.getBoundingClientRect();
			const tipRect = tip.getBoundingClientRect();
			tip.style.left = `${rect.left + rect.width / 2 - tipRect.width / 2}px`;
			tip.style.top = `${rect.top - tipRect.height - 4}px`;
		});
		item.addEventListener("mouseleave", () => {
			document.querySelectorAll(".cost-tooltip").forEach((el) => el.remove());
		});
		return item;
	}
	showBasicInfo(good) {
		this.currentGood = good;
		this.sourceRecipe = null;
		this.container.classList.remove("hidden");
		const backLabel = this.i18n.t("ui.back");
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
                <p class="info-note">${this.i18n.t("ui.noDetailedProductionData")}</p>
            </div>
        `;
		this.bindBackButton();
	}
};
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.35/node_modules/@vue/shared/dist/shared.esm-bundler.js
/**
* @vue/shared v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
	const map = /* @__PURE__ */ Object.create(null);
	for (const key of str.split(",")) map[key] = 1;
	return (val) => val in map;
}
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var NOOP = () => {};
var NO = () => false;
var isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
var isModelListener = (key) => key.startsWith("onUpdate:");
var extend = Object.assign;
var remove = (arr, el) => {
	const i = arr.indexOf(el);
	if (i > -1) arr.splice(i, 1);
};
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
var isArray = Array.isArray;
var isMap = (val) => toTypeString(val) === "[object Map]";
var isSet = (val) => toTypeString(val) === "[object Set]";
var isDate = (val) => toTypeString(val) === "[object Date]";
var isFunction = (val) => typeof val === "function";
var isString = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isObject = (val) => val !== null && typeof val === "object";
var isPromise = (val) => {
	return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
var objectToString = Object.prototype.toString;
var toTypeString = (value) => objectToString.call(value);
var toRawType = (value) => {
	return toTypeString(value).slice(8, -1);
};
var isPlainObject = (val) => toTypeString(val) === "[object Object]";
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
var cacheStringFunction = (fn) => {
	const cache = /* @__PURE__ */ Object.create(null);
	return ((str) => {
		return cache[str] || (cache[str] = fn(str));
	});
};
var camelizeRE = /-\w/g;
var camelize = cacheStringFunction((str) => {
	return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
var capitalize = cacheStringFunction((str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
});
var toHandlerKey = cacheStringFunction((str) => {
	return str ? `on${capitalize(str)}` : ``;
});
var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
var invokeArrayFns = (fns, ...arg) => {
	for (let i = 0; i < fns.length; i++) fns[i](...arg);
};
var def = (obj, key, value, writable = false) => {
	Object.defineProperty(obj, key, {
		configurable: true,
		enumerable: false,
		writable,
		value
	});
};
var looseToNumber = (val) => {
	const n = parseFloat(val);
	return isNaN(n) ? val : n;
};
var _globalThis;
var getGlobalThis = () => {
	return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
	if (isArray(value)) {
		const res = {};
		for (let i = 0; i < value.length; i++) {
			const item = value[i];
			const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
			if (normalized) for (const key in normalized) res[key] = normalized[key];
		}
		return res;
	} else if (isString(value) || isObject(value)) return value;
}
var listDelimiterRE = /;(?![^(]*\))/g;
var propertyDelimiterRE = /:([^]+)/;
var styleCommentRE = /\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
	const ret = {};
	cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
		if (item) {
			const tmp = item.split(propertyDelimiterRE);
			tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
		}
	});
	return ret;
}
function normalizeClass(value) {
	let res = "";
	if (isString(value)) res = value;
	else if (isArray(value)) for (let i = 0; i < value.length; i++) {
		const normalized = normalizeClass(value[i]);
		if (normalized) res += normalized + " ";
	}
	else if (isObject(value)) {
		for (const name in value) if (value[name]) res += name + " ";
	}
	return res.trim();
}
var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
var isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
specialBooleanAttrs + "";
function includeBooleanAttr(value) {
	return !!value || value === "";
}
function looseCompareArrays(a, b) {
	if (a.length !== b.length) return false;
	let equal = true;
	for (let i = 0; equal && i < a.length; i++) equal = looseEqual(a[i], b[i]);
	return equal;
}
function looseEqual(a, b) {
	if (a === b) return true;
	let aValidType = isDate(a);
	let bValidType = isDate(b);
	if (aValidType || bValidType) return aValidType && bValidType ? a.getTime() === b.getTime() : false;
	aValidType = isSymbol(a);
	bValidType = isSymbol(b);
	if (aValidType || bValidType) return a === b;
	aValidType = isArray(a);
	bValidType = isArray(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareArrays(a, b) : false;
	aValidType = isObject(a);
	bValidType = isObject(b);
	if (aValidType || bValidType) {
		if (!aValidType || !bValidType) return false;
		if (Object.keys(a).length !== Object.keys(b).length) return false;
		for (const key in a) {
			const aHasKey = a.hasOwnProperty(key);
			const bHasKey = b.hasOwnProperty(key);
			if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) return false;
		}
	}
	return String(a) === String(b);
}
var isRef$1 = (val) => {
	return !!(val && val["__v_isRef"] === true);
};
var toDisplayString = (val) => {
	return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
var replacer = (_key, val) => {
	if (isRef$1(val)) return replacer(_key, val.value);
	else if (isMap(val)) return { [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2], i) => {
		entries[stringifySymbol(key, i) + " =>"] = val2;
		return entries;
	}, {}) };
	else if (isSet(val)) return { [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v)) };
	else if (isSymbol(val)) return stringifySymbol(val);
	else if (isObject(val) && !isArray(val) && !isPlainObject(val)) return String(val);
	return val;
};
var stringifySymbol = (v, i = "") => {
	var _a;
	return isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v;
};
//#endregion
//#region node_modules/.bun/@vue+reactivity@3.5.35/node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
/**
* @vue/reactivity v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var activeEffectScope;
var EffectScope = class {
	constructor(detached = false) {
		this.detached = detached;
		/**
		* @internal
		*/
		this._active = true;
		/**
		* @internal track `on` calls, allow `on` call multiple times
		*/
		this._on = 0;
		/**
		* @internal
		*/
		this.effects = [];
		/**
		* @internal
		*/
		this.cleanups = [];
		this._isPaused = false;
		this._warnOnRun = true;
		this.__v_skip = true;
		if (!detached && activeEffectScope) if (activeEffectScope.active) {
			this.parent = activeEffectScope;
			this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
		} else {
			this._active = false;
			this._warnOnRun = false;
		}
	}
	get active() {
		return this._active;
	}
	pause() {
		if (this._active) {
			this._isPaused = true;
			let i, l;
			if (this.scopes) for (i = 0, l = this.scopes.length; i < l; i++) this.scopes[i].pause();
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].pause();
		}
	}
	/**
	* Resumes the effect scope, including all child scopes and effects.
	*/
	resume() {
		if (this._active) {
			if (this._isPaused) {
				this._isPaused = false;
				let i, l;
				if (this.scopes) for (i = 0, l = this.scopes.length; i < l; i++) this.scopes[i].resume();
				for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].resume();
			}
		}
	}
	run(fn) {
		if (this._active) {
			const currentEffectScope = activeEffectScope;
			try {
				activeEffectScope = this;
				return fn();
			} finally {
				activeEffectScope = currentEffectScope;
			}
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	on() {
		if (++this._on === 1) {
			this.prevScope = activeEffectScope;
			activeEffectScope = this;
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (activeEffectScope === this) activeEffectScope = this.prevScope;
			else {
				let current = activeEffectScope;
				while (current) {
					if (current.prevScope === this) {
						current.prevScope = this.prevScope;
						break;
					}
					current = current.prevScope;
				}
			}
			this.prevScope = void 0;
		}
	}
	stop(fromParent) {
		if (this._active) {
			this._active = false;
			let i, l;
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].stop();
			this.effects.length = 0;
			for (i = 0, l = this.cleanups.length; i < l; i++) this.cleanups[i]();
			this.cleanups.length = 0;
			if (this.scopes) {
				for (i = 0, l = this.scopes.length; i < l; i++) this.scopes[i].stop(true);
				this.scopes.length = 0;
			}
			if (!this.detached && this.parent && !fromParent) {
				const last = this.parent.scopes.pop();
				if (last && last !== this) {
					this.parent.scopes[this.index] = last;
					last.index = this.index;
				}
			}
			this.parent = void 0;
		}
	}
};
function getCurrentScope() {
	return activeEffectScope;
}
var activeSub;
var pausedQueueEffects = /* @__PURE__ */ new WeakSet();
var ReactiveEffect = class {
	constructor(fn) {
		this.fn = fn;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 5;
		/**
		* @internal
		*/
		this.next = void 0;
		/**
		* @internal
		*/
		this.cleanup = void 0;
		this.scheduler = void 0;
		if (activeEffectScope) if (activeEffectScope.active) activeEffectScope.effects.push(this);
		else this.flags &= -2;
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		if (this.flags & 64) {
			this.flags &= -65;
			if (pausedQueueEffects.has(this)) {
				pausedQueueEffects.delete(this);
				this.trigger();
			}
		}
	}
	/**
	* @internal
	*/
	notify() {
		if (this.flags & 2 && !(this.flags & 32)) return;
		if (!(this.flags & 8)) batch(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2;
		cleanupEffect(this);
		prepareDeps(this);
		const prevEffect = activeSub;
		const prevShouldTrack = shouldTrack;
		activeSub = this;
		shouldTrack = true;
		try {
			return this.fn();
		} finally {
			cleanupDeps(this);
			activeSub = prevEffect;
			shouldTrack = prevShouldTrack;
			this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let link = this.deps; link; link = link.nextDep) removeSub(link);
			this.deps = this.depsTail = void 0;
			cleanupEffect(this);
			this.onStop && this.onStop();
			this.flags &= -2;
		}
	}
	trigger() {
		if (this.flags & 64) pausedQueueEffects.add(this);
		else if (this.scheduler) this.scheduler();
		else this.runIfDirty();
	}
	/**
	* @internal
	*/
	runIfDirty() {
		if (isDirty(this)) this.run();
	}
	get dirty() {
		return isDirty(this);
	}
};
var batchDepth = 0;
var batchedSub;
var batchedComputed;
function batch(sub, isComputed = false) {
	sub.flags |= 8;
	if (isComputed) {
		sub.next = batchedComputed;
		batchedComputed = sub;
		return;
	}
	sub.next = batchedSub;
	batchedSub = sub;
}
function startBatch() {
	batchDepth++;
}
function endBatch() {
	if (--batchDepth > 0) return;
	if (batchedComputed) {
		let e = batchedComputed;
		batchedComputed = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			e = next;
		}
	}
	let error;
	while (batchedSub) {
		let e = batchedSub;
		batchedSub = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			if (e.flags & 1) try {
				e.trigger();
			} catch (err) {
				if (!error) error = err;
			}
			e = next;
		}
	}
	if (error) throw error;
}
function prepareDeps(sub) {
	for (let link = sub.deps; link; link = link.nextDep) {
		link.version = -1;
		link.prevActiveLink = link.dep.activeLink;
		link.dep.activeLink = link;
	}
}
function cleanupDeps(sub) {
	let head;
	let tail = sub.depsTail;
	let link = tail;
	while (link) {
		const prev = link.prevDep;
		if (link.version === -1) {
			if (link === tail) tail = prev;
			removeSub(link);
			removeDep(link);
		} else head = link;
		link.dep.activeLink = link.prevActiveLink;
		link.prevActiveLink = void 0;
		link = prev;
	}
	sub.deps = head;
	sub.depsTail = tail;
}
function isDirty(sub) {
	for (let link = sub.deps; link; link = link.nextDep) if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) return true;
	if (sub._dirty) return true;
	return false;
}
function refreshComputed(computed) {
	if (computed.flags & 4 && !(computed.flags & 16)) return;
	computed.flags &= -17;
	if (computed.globalVersion === globalVersion) return;
	computed.globalVersion = globalVersion;
	if (!computed.isSSR && computed.flags & 128 && (!computed.deps && !computed._dirty || !isDirty(computed))) return;
	computed.flags |= 2;
	const dep = computed.dep;
	const prevSub = activeSub;
	const prevShouldTrack = shouldTrack;
	activeSub = computed;
	shouldTrack = true;
	try {
		prepareDeps(computed);
		const value = computed.fn(computed._value);
		if (dep.version === 0 || hasChanged(value, computed._value)) {
			computed.flags |= 128;
			computed._value = value;
			dep.version++;
		}
	} catch (err) {
		dep.version++;
		throw err;
	} finally {
		activeSub = prevSub;
		shouldTrack = prevShouldTrack;
		cleanupDeps(computed);
		computed.flags &= -3;
	}
}
function removeSub(link, soft = false) {
	const { dep, prevSub, nextSub } = link;
	if (prevSub) {
		prevSub.nextSub = nextSub;
		link.prevSub = void 0;
	}
	if (nextSub) {
		nextSub.prevSub = prevSub;
		link.nextSub = void 0;
	}
	if (dep.subs === link) {
		dep.subs = prevSub;
		if (!prevSub && dep.computed) {
			dep.computed.flags &= -5;
			for (let l = dep.computed.deps; l; l = l.nextDep) removeSub(l, true);
		}
	}
	if (!soft && !--dep.sc && dep.map) dep.map.delete(dep.key);
}
function removeDep(link) {
	const { prevDep, nextDep } = link;
	if (prevDep) {
		prevDep.nextDep = nextDep;
		link.prevDep = void 0;
	}
	if (nextDep) {
		nextDep.prevDep = prevDep;
		link.nextDep = void 0;
	}
}
var shouldTrack = true;
var trackStack = [];
function pauseTracking() {
	trackStack.push(shouldTrack);
	shouldTrack = false;
}
function resetTracking() {
	const last = trackStack.pop();
	shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
	const { cleanup } = e;
	e.cleanup = void 0;
	if (cleanup) {
		const prevSub = activeSub;
		activeSub = void 0;
		try {
			cleanup();
		} finally {
			activeSub = prevSub;
		}
	}
}
var globalVersion = 0;
var Link = class {
	constructor(sub, dep) {
		this.sub = sub;
		this.dep = dep;
		this.version = dep.version;
		this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
};
var Dep = class {
	constructor(computed) {
		this.computed = computed;
		this.version = 0;
		/**
		* Link between this dep and the current active effect
		*/
		this.activeLink = void 0;
		/**
		* Doubly linked list representing the subscribing effects (tail)
		*/
		this.subs = void 0;
		/**
		* For object property deps cleanup
		*/
		this.map = void 0;
		this.key = void 0;
		/**
		* Subscriber counter
		*/
		this.sc = 0;
		/**
		* @internal
		*/
		this.__v_skip = true;
	}
	track(debugInfo) {
		if (!activeSub || !shouldTrack || activeSub === this.computed) return;
		let link = this.activeLink;
		if (link === void 0 || link.sub !== activeSub) {
			link = this.activeLink = new Link(activeSub, this);
			if (!activeSub.deps) activeSub.deps = activeSub.depsTail = link;
			else {
				link.prevDep = activeSub.depsTail;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
			}
			addSub(link);
		} else if (link.version === -1) {
			link.version = this.version;
			if (link.nextDep) {
				const next = link.nextDep;
				next.prevDep = link.prevDep;
				if (link.prevDep) link.prevDep.nextDep = next;
				link.prevDep = activeSub.depsTail;
				link.nextDep = void 0;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
				if (activeSub.deps === link) activeSub.deps = next;
			}
		}
		return link;
	}
	trigger(debugInfo) {
		this.version++;
		globalVersion++;
		this.notify(debugInfo);
	}
	notify(debugInfo) {
		startBatch();
		try {
			for (let link = this.subs; link; link = link.prevSub) if (link.sub.notify()) link.sub.dep.notify();
		} finally {
			endBatch();
		}
	}
};
function addSub(link) {
	link.dep.sc++;
	if (link.sub.flags & 4) {
		const computed = link.dep.computed;
		if (computed && !link.dep.subs) {
			computed.flags |= 20;
			for (let l = computed.deps; l; l = l.nextDep) addSub(l);
		}
		const currentTail = link.dep.subs;
		if (currentTail !== link) {
			link.prevSub = currentTail;
			if (currentTail) currentTail.nextSub = link;
		}
		link.dep.subs = link;
	}
}
var targetMap = /* @__PURE__ */ new WeakMap();
var ITERATE_KEY = /* @__PURE__ */ Symbol("");
var MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
var ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
function track(target, type, key) {
	if (shouldTrack && activeSub) {
		let depsMap = targetMap.get(target);
		if (!depsMap) targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
		let dep = depsMap.get(key);
		if (!dep) {
			depsMap.set(key, dep = new Dep());
			dep.map = depsMap;
			dep.key = key;
		}
		dep.track();
	}
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
	const depsMap = targetMap.get(target);
	if (!depsMap) {
		globalVersion++;
		return;
	}
	const run = (dep) => {
		if (dep) dep.trigger();
	};
	startBatch();
	if (type === "clear") depsMap.forEach(run);
	else {
		const targetIsArray = isArray(target);
		const isArrayIndex = targetIsArray && isIntegerKey(key);
		if (targetIsArray && key === "length") {
			const newLength = Number(newValue);
			depsMap.forEach((dep, key2) => {
				if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) run(dep);
			});
		} else {
			if (key !== void 0 || depsMap.has(void 0)) run(depsMap.get(key));
			if (isArrayIndex) run(depsMap.get(ARRAY_ITERATE_KEY));
			switch (type) {
				case "add":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					} else if (isArrayIndex) run(depsMap.get("length"));
					break;
				case "delete":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					}
					break;
				case "set":
					if (isMap(target)) run(depsMap.get(ITERATE_KEY));
					break;
			}
		}
	}
	endBatch();
}
function reactiveReadArray(array) {
	const raw = /* @__PURE__ */ toRaw(array);
	if (raw === array) return raw;
	track(raw, "iterate", ARRAY_ITERATE_KEY);
	return /* @__PURE__ */ isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
	track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
	return arr;
}
function toWrapped(target, item) {
	if (/* @__PURE__ */ isReadonly(target)) return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
	return toReactive(item);
}
var arrayInstrumentations = {
	__proto__: null,
	[Symbol.iterator]() {
		return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
	},
	concat(...args) {
		return reactiveReadArray(this).concat(...args.map((x) => isArray(x) ? reactiveReadArray(x) : x));
	},
	entries() {
		return iterator(this, "entries", (value) => {
			value[1] = toWrapped(this, value[1]);
			return value;
		});
	},
	every(fn, thisArg) {
		return apply(this, "every", fn, thisArg, void 0, arguments);
	},
	filter(fn, thisArg) {
		return apply(this, "filter", fn, thisArg, (v) => v.map((item) => toWrapped(this, item)), arguments);
	},
	find(fn, thisArg) {
		return apply(this, "find", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findIndex(fn, thisArg) {
		return apply(this, "findIndex", fn, thisArg, void 0, arguments);
	},
	findLast(fn, thisArg) {
		return apply(this, "findLast", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findLastIndex(fn, thisArg) {
		return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
	},
	forEach(fn, thisArg) {
		return apply(this, "forEach", fn, thisArg, void 0, arguments);
	},
	includes(...args) {
		return searchProxy(this, "includes", args);
	},
	indexOf(...args) {
		return searchProxy(this, "indexOf", args);
	},
	join(separator) {
		return reactiveReadArray(this).join(separator);
	},
	lastIndexOf(...args) {
		return searchProxy(this, "lastIndexOf", args);
	},
	map(fn, thisArg) {
		return apply(this, "map", fn, thisArg, void 0, arguments);
	},
	pop() {
		return noTracking(this, "pop");
	},
	push(...args) {
		return noTracking(this, "push", args);
	},
	reduce(fn, ...args) {
		return reduce(this, "reduce", fn, args);
	},
	reduceRight(fn, ...args) {
		return reduce(this, "reduceRight", fn, args);
	},
	shift() {
		return noTracking(this, "shift");
	},
	some(fn, thisArg) {
		return apply(this, "some", fn, thisArg, void 0, arguments);
	},
	splice(...args) {
		return noTracking(this, "splice", args);
	},
	toReversed() {
		return reactiveReadArray(this).toReversed();
	},
	toSorted(comparer) {
		return reactiveReadArray(this).toSorted(comparer);
	},
	toSpliced(...args) {
		return reactiveReadArray(this).toSpliced(...args);
	},
	unshift(...args) {
		return noTracking(this, "unshift", args);
	},
	values() {
		return iterator(this, "values", (item) => toWrapped(this, item));
	}
};
function iterator(self, method, wrapValue) {
	const arr = shallowReadArray(self);
	const iter = arr[method]();
	if (arr !== self && !/* @__PURE__ */ isShallow(self)) {
		iter._next = iter.next;
		iter.next = () => {
			const result = iter._next();
			if (!result.done) result.value = wrapValue(result.value);
			return result;
		};
	}
	return iter;
}
var arrayProto = Array.prototype;
function apply(self, method, fn, thisArg, wrappedRetFn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	const methodFn = arr[method];
	if (methodFn !== arrayProto[method]) {
		const result2 = methodFn.apply(self, args);
		return needsWrap ? toReactive(result2) : result2;
	}
	let wrappedFn = fn;
	if (arr !== self) {
		if (needsWrap) wrappedFn = function(item, index) {
			return fn.call(this, toWrapped(self, item), index, self);
		};
		else if (fn.length > 2) wrappedFn = function(item, index) {
			return fn.call(this, item, index, self);
		};
	}
	const result = methodFn.call(arr, wrappedFn, thisArg);
	return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self, method, fn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	let wrappedFn = fn;
	let wrapInitialAccumulator = false;
	if (arr !== self) {
		if (needsWrap) {
			wrapInitialAccumulator = args.length === 0;
			wrappedFn = function(acc, item, index) {
				if (wrapInitialAccumulator) {
					wrapInitialAccumulator = false;
					acc = toWrapped(self, acc);
				}
				return fn.call(this, acc, toWrapped(self, item), index, self);
			};
		} else if (fn.length > 3) wrappedFn = function(acc, item, index) {
			return fn.call(this, acc, item, index, self);
		};
	}
	const result = arr[method](wrappedFn, ...args);
	return wrapInitialAccumulator ? toWrapped(self, result) : result;
}
function searchProxy(self, method, args) {
	const arr = /* @__PURE__ */ toRaw(self);
	track(arr, "iterate", ARRAY_ITERATE_KEY);
	const res = arr[method](...args);
	if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
		args[0] = /* @__PURE__ */ toRaw(args[0]);
		return arr[method](...args);
	}
	return res;
}
function noTracking(self, method, args = []) {
	pauseTracking();
	startBatch();
	const res = (/* @__PURE__ */ toRaw(self))[method].apply(self, args);
	endBatch();
	resetTracking();
	return res;
}
var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
var builtInSymbols = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol));
function hasOwnProperty(key) {
	if (!isSymbol(key)) key = String(key);
	const obj = /* @__PURE__ */ toRaw(this);
	track(obj, "has", key);
	return obj.hasOwnProperty(key);
}
var BaseReactiveHandler = class {
	constructor(_isReadonly = false, _isShallow = false) {
		this._isReadonly = _isReadonly;
		this._isShallow = _isShallow;
	}
	get(target, key, receiver) {
		if (key === "__v_skip") return target["__v_skip"];
		const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_isShallow") return isShallow2;
		else if (key === "__v_raw") {
			if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) return target;
			return;
		}
		const targetIsArray = isArray(target);
		if (!isReadonly2) {
			let fn;
			if (targetIsArray && (fn = arrayInstrumentations[key])) return fn;
			if (key === "hasOwnProperty") return hasOwnProperty;
		}
		const res = Reflect.get(target, key, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) return res;
		if (!isReadonly2) track(target, "get", key);
		if (isShallow2) return res;
		if (/* @__PURE__ */ isRef(res)) {
			const value = targetIsArray && isIntegerKey(key) ? res : res.value;
			return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
		}
		if (isObject(res)) return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
		return res;
	}
};
var MutableReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(false, isShallow2);
	}
	set(target, key, value, receiver) {
		let oldValue = target[key];
		const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
		if (!this._isShallow) {
			const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
			if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
				oldValue = /* @__PURE__ */ toRaw(oldValue);
				value = /* @__PURE__ */ toRaw(value);
			}
			if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) if (isOldValueReadonly) return true;
			else {
				oldValue.value = value;
				return true;
			}
		}
		const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
		const result = Reflect.set(target, key, value, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (target === /* @__PURE__ */ toRaw(receiver)) {
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
		}
		return result;
	}
	deleteProperty(target, key) {
		const hadKey = hasOwn(target, key);
		const oldValue = target[key];
		const result = Reflect.deleteProperty(target, key);
		if (result && hadKey) trigger(target, "delete", key, void 0, oldValue);
		return result;
	}
	has(target, key) {
		const result = Reflect.has(target, key);
		if (!isSymbol(key) || !builtInSymbols.has(key)) track(target, "has", key);
		return result;
	}
	ownKeys(target) {
		track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
		return Reflect.ownKeys(target);
	}
};
var ReadonlyReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(true, isShallow2);
	}
	set(target, key) {
		return true;
	}
	deleteProperty(target, key) {
		return true;
	}
};
var mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
var readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
var shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
var toShallow = (value) => value;
var getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
	return function(...args) {
		const target = this["__v_raw"];
		const rawTarget = /* @__PURE__ */ toRaw(target);
		const targetIsMap = isMap(rawTarget);
		const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
		const isKeyOnly = method === "keys" && targetIsMap;
		const innerIterator = target[method](...args);
		const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
		!isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
		return extend(Object.create(innerIterator), { next() {
			const { value, done } = innerIterator.next();
			return done ? {
				value,
				done
			} : {
				value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
				done
			};
		} });
	};
}
function createReadonlyMethod(type) {
	return function(...args) {
		return type === "delete" ? false : type === "clear" ? void 0 : this;
	};
}
function createInstrumentations(readonly, shallow) {
	const instrumentations = {
		get(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "get", key);
				track(rawTarget, "get", rawKey);
			}
			const { has } = getProto(rawTarget);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			if (has.call(rawTarget, key)) return wrap(target.get(key));
			else if (has.call(rawTarget, rawKey)) return wrap(target.get(rawKey));
			else if (target !== rawTarget) target.get(key);
		},
		get size() {
			const target = this["__v_raw"];
			!readonly && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
			return target.size;
		},
		has(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "has", key);
				track(rawTarget, "has", rawKey);
			}
			return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
		},
		forEach(callback, thisArg) {
			const observed = this;
			const target = observed["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			!readonly && track(rawTarget, "iterate", ITERATE_KEY);
			return target.forEach((value, key) => {
				return callback.call(thisArg, wrap(value), wrap(key), observed);
			});
		}
	};
	extend(instrumentations, readonly ? {
		add: createReadonlyMethod("add"),
		set: createReadonlyMethod("set"),
		delete: createReadonlyMethod("delete"),
		clear: createReadonlyMethod("clear")
	} : {
		add(value) {
			const target = /* @__PURE__ */ toRaw(this);
			const proto = getProto(target);
			const rawValue = /* @__PURE__ */ toRaw(value);
			const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
			if (!(proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue))) {
				target.add(valueToAdd);
				trigger(target, "add", valueToAdd, valueToAdd);
			}
			return this;
		},
		set(key, value) {
			if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) value = /* @__PURE__ */ toRaw(value);
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get.call(target, key);
			target.set(key, value);
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
			return this;
		},
		delete(key) {
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get ? get.call(target, key) : void 0;
			const result = target.delete(key);
			if (hadKey) trigger(target, "delete", key, void 0, oldValue);
			return result;
		},
		clear() {
			const target = /* @__PURE__ */ toRaw(this);
			const hadItems = target.size !== 0;
			const oldTarget = void 0;
			const result = target.clear();
			if (hadItems) trigger(target, "clear", void 0, void 0, oldTarget);
			return result;
		}
	});
	[
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((method) => {
		instrumentations[method] = createIterableMethod(method, readonly, shallow);
	});
	return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
	const instrumentations = createInstrumentations(isReadonly2, shallow);
	return (target, key, receiver) => {
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_raw") return target;
		return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
	};
}
var mutableCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, false) };
var shallowCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, true) };
var readonlyCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(true, false) };
var reactiveMap = /* @__PURE__ */ new WeakMap();
var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
var readonlyMap = /* @__PURE__ */ new WeakMap();
var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
	switch (rawType) {
		case "Object":
		case "Array": return 1;
		case "Map":
		case "Set":
		case "WeakMap":
		case "WeakSet": return 2;
		default: return 0;
	}
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
	if (/* @__PURE__ */ isReadonly(target)) return target;
	return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
	return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
	return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
	if (!isObject(target)) return target;
	if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) return target;
	if (target["__v_skip"] || !Object.isExtensible(target)) return target;
	const existingProxy = proxyMap.get(target);
	if (existingProxy) return existingProxy;
	const targetType = targetTypeMap(toRawType(target));
	if (targetType === 0) return target;
	const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
	proxyMap.set(target, proxy);
	return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
	if (/* @__PURE__ */ isReadonly(value)) return /* @__PURE__ */ isReactive(value["__v_raw"]);
	return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
	return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
	return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
	return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
	const raw = observed && observed["__v_raw"];
	return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
	if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) def(value, "__v_skip", true);
	return value;
}
var toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value;
var toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
	return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
	return createRef(value, false);
}
function createRef(rawValue, shallow) {
	if (/* @__PURE__ */ isRef(rawValue)) return rawValue;
	return new RefImpl(rawValue, shallow);
}
var RefImpl = class {
	constructor(value, isShallow2) {
		this.dep = new Dep();
		this["__v_isRef"] = true;
		this["__v_isShallow"] = false;
		this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value);
		this._value = isShallow2 ? value : toReactive(value);
		this["__v_isShallow"] = isShallow2;
	}
	get value() {
		this.dep.track();
		return this._value;
	}
	set value(newValue) {
		const oldValue = this._rawValue;
		const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
		newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue);
		if (hasChanged(newValue, oldValue)) {
			this._rawValue = newValue;
			this._value = useDirectValue ? newValue : toReactive(newValue);
			this.dep.trigger();
		}
	}
};
function unref(ref2) {
	return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
var shallowUnwrapHandlers = {
	get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
	set: (target, key, value, receiver) => {
		const oldValue = target[key];
		if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
			oldValue.value = value;
			return true;
		} else return Reflect.set(target, key, value, receiver);
	}
};
function proxyRefs(objectWithRefs) {
	return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
var ComputedRefImpl = class {
	constructor(fn, setter, isSSR) {
		this.fn = fn;
		this.setter = setter;
		/**
		* @internal
		*/
		this._value = void 0;
		/**
		* @internal
		*/
		this.dep = new Dep(this);
		/**
		* @internal
		*/
		this.__v_isRef = true;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 16;
		/**
		* @internal
		*/
		this.globalVersion = globalVersion - 1;
		/**
		* @internal
		*/
		this.next = void 0;
		this.effect = this;
		this["__v_isReadonly"] = !setter;
		this.isSSR = isSSR;
	}
	/**
	* @internal
	*/
	notify() {
		this.flags |= 16;
		if (!(this.flags & 8) && activeSub !== this) {
			batch(this, true);
			return true;
		}
	}
	get value() {
		const link = this.dep.track();
		refreshComputed(this);
		if (link) link.version = this.dep.version;
		return this._value;
	}
	set value(newValue) {
		if (this.setter) this.setter(newValue);
	}
};
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
	let getter;
	let setter;
	if (isFunction(getterOrOptions)) getter = getterOrOptions;
	else {
		getter = getterOrOptions.get;
		setter = getterOrOptions.set;
	}
	return new ComputedRefImpl(getter, setter, isSSR);
}
var INITIAL_WATCHER_VALUE = {};
var cleanupMap = /* @__PURE__ */ new WeakMap();
var activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
	if (owner) {
		let cleanups = cleanupMap.get(owner);
		if (!cleanups) cleanupMap.set(owner, cleanups = []);
		cleanups.push(cleanupFn);
	}
}
function watch$1(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, once, scheduler, augmentJob, call } = options;
	const reactiveGetter = (source2) => {
		if (deep) return source2;
		if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0) return traverse(source2, 1);
		return traverse(source2);
	};
	let effect;
	let getter;
	let cleanup;
	let boundCleanup;
	let forceTrigger = false;
	let isMultiSource = false;
	if (/* @__PURE__ */ isRef(source)) {
		getter = () => source.value;
		forceTrigger = /* @__PURE__ */ isShallow(source);
	} else if (/* @__PURE__ */ isReactive(source)) {
		getter = () => reactiveGetter(source);
		forceTrigger = true;
	} else if (isArray(source)) {
		isMultiSource = true;
		forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
		getter = () => source.map((s) => {
			if (/* @__PURE__ */ isRef(s)) return s.value;
			else if (/* @__PURE__ */ isReactive(s)) return reactiveGetter(s);
			else if (isFunction(s)) return call ? call(s, 2) : s();
		});
	} else if (isFunction(source)) if (cb) getter = call ? () => call(source, 2) : source;
	else getter = () => {
		if (cleanup) {
			pauseTracking();
			try {
				cleanup();
			} finally {
				resetTracking();
			}
		}
		const currentEffect = activeWatcher;
		activeWatcher = effect;
		try {
			return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
		} finally {
			activeWatcher = currentEffect;
		}
	};
	else getter = NOOP;
	if (cb && deep) {
		const baseGetter = getter;
		const depth = deep === true ? Infinity : deep;
		getter = () => traverse(baseGetter(), depth);
	}
	const scope = getCurrentScope();
	const watchHandle = () => {
		effect.stop();
		if (scope && scope.active) remove(scope.effects, effect);
	};
	if (once && cb) {
		const _cb = cb;
		cb = (...args) => {
			_cb(...args);
			watchHandle();
		};
	}
	let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
	const job = (immediateFirstRun) => {
		if (!(effect.flags & 1) || !effect.dirty && !immediateFirstRun) return;
		if (cb) {
			const newValue = effect.run();
			if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
				if (cleanup) cleanup();
				const currentWatcher = activeWatcher;
				activeWatcher = effect;
				try {
					const args = [
						newValue,
						oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
						boundCleanup
					];
					oldValue = newValue;
					call ? call(cb, 3, args) : cb(...args);
				} finally {
					activeWatcher = currentWatcher;
				}
			}
		} else effect.run();
	};
	if (augmentJob) augmentJob(job);
	effect = new ReactiveEffect(getter);
	effect.scheduler = scheduler ? () => scheduler(job, false) : job;
	boundCleanup = (fn) => onWatcherCleanup(fn, false, effect);
	cleanup = effect.onStop = () => {
		const cleanups = cleanupMap.get(effect);
		if (cleanups) {
			if (call) call(cleanups, 4);
			else for (const cleanup2 of cleanups) cleanup2();
			cleanupMap.delete(effect);
		}
	};
	if (cb) if (immediate) job(true);
	else oldValue = effect.run();
	else if (scheduler) scheduler(job.bind(null, true), true);
	else effect.run();
	watchHandle.pause = effect.pause.bind(effect);
	watchHandle.resume = effect.resume.bind(effect);
	watchHandle.stop = watchHandle;
	return watchHandle;
}
function traverse(value, depth = Infinity, seen) {
	if (depth <= 0 || !isObject(value) || value["__v_skip"]) return value;
	seen = seen || /* @__PURE__ */ new Map();
	if ((seen.get(value) || 0) >= depth) return value;
	seen.set(value, depth);
	depth--;
	if (/* @__PURE__ */ isRef(value)) traverse(value.value, depth, seen);
	else if (isArray(value)) for (let i = 0; i < value.length; i++) traverse(value[i], depth, seen);
	else if (isSet(value) || isMap(value)) value.forEach((v) => {
		traverse(v, depth, seen);
	});
	else if (isPlainObject(value)) {
		for (const key in value) traverse(value[key], depth, seen);
		for (const key of Object.getOwnPropertySymbols(value)) if (Object.prototype.propertyIsEnumerable.call(value, key)) traverse(value[key], depth, seen);
	}
	return value;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.35/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
/**
* @vue/runtime-core v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function callWithErrorHandling(fn, instance, type, args) {
	try {
		return args ? fn(...args) : fn();
	} catch (err) {
		handleError(err, instance, type);
	}
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
	if (isFunction(fn)) {
		const res = callWithErrorHandling(fn, instance, type, args);
		if (res && isPromise(res)) res.catch((err) => {
			handleError(err, instance, type);
		});
		return res;
	}
	if (isArray(fn)) {
		const values = [];
		for (let i = 0; i < fn.length; i++) values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
		return values;
	}
}
function handleError(err, instance, type, throwInDev = true) {
	const contextVNode = instance ? instance.vnode : null;
	const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
	if (instance) {
		let cur = instance.parent;
		const exposedInstance = instance.proxy;
		const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
		while (cur) {
			const errorCapturedHooks = cur.ec;
			if (errorCapturedHooks) {
				for (let i = 0; i < errorCapturedHooks.length; i++) if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) return;
			}
			cur = cur.parent;
		}
		if (errorHandler) {
			pauseTracking();
			callWithErrorHandling(errorHandler, null, 10, [
				err,
				exposedInstance,
				errorInfo
			]);
			resetTracking();
			return;
		}
	}
	logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
	if (throwInProd) throw err;
	else console.error(err);
}
var queue = [];
var flushIndex = -1;
var pendingPostFlushCbs = [];
var activePostFlushCbs = null;
var postFlushIndex = 0;
var resolvedPromise = /* @__PURE__ */ Promise.resolve();
var currentFlushPromise = null;
function nextTick(fn) {
	const p = currentFlushPromise || resolvedPromise;
	return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
function findInsertionIndex(id) {
	let start = flushIndex + 1;
	let end = queue.length;
	while (start < end) {
		const middle = start + end >>> 1;
		const middleJob = queue[middle];
		const middleJobId = getId(middleJob);
		if (middleJobId < id || middleJobId === id && middleJob.flags & 2) start = middle + 1;
		else end = middle;
	}
	return start;
}
function queueJob(job) {
	if (!(job.flags & 1)) {
		const jobId = getId(job);
		const lastJob = queue[queue.length - 1];
		if (!lastJob || !(job.flags & 2) && jobId >= getId(lastJob)) queue.push(job);
		else queue.splice(findInsertionIndex(jobId), 0, job);
		job.flags |= 1;
		queueFlush();
	}
}
function queueFlush() {
	if (!currentFlushPromise) currentFlushPromise = resolvedPromise.then(flushJobs);
}
function queuePostFlushCb(cb) {
	if (!isArray(cb)) {
		if (activePostFlushCbs && cb.id === -1) activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
		else if (!(cb.flags & 1)) {
			pendingPostFlushCbs.push(cb);
			cb.flags |= 1;
		}
	} else pendingPostFlushCbs.push(...cb);
	queueFlush();
}
function flushPreFlushCbs(instance, seen, i = flushIndex + 1) {
	for (; i < queue.length; i++) {
		const cb = queue[i];
		if (cb && cb.flags & 2) {
			if (instance && cb.id !== instance.uid) continue;
			queue.splice(i, 1);
			i--;
			if (cb.flags & 4) cb.flags &= -2;
			cb();
			if (!(cb.flags & 4)) cb.flags &= -2;
		}
	}
}
function flushPostFlushCbs(seen) {
	if (pendingPostFlushCbs.length) {
		const deduped = [...new Set(pendingPostFlushCbs)].sort((a, b) => getId(a) - getId(b));
		pendingPostFlushCbs.length = 0;
		if (activePostFlushCbs) {
			activePostFlushCbs.push(...deduped);
			return;
		}
		activePostFlushCbs = deduped;
		for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
			const cb = activePostFlushCbs[postFlushIndex];
			if (cb.flags & 4) cb.flags &= -2;
			if (!(cb.flags & 8)) cb();
			cb.flags &= -2;
		}
		activePostFlushCbs = null;
		postFlushIndex = 0;
	}
}
var getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
	try {
		for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job && !(job.flags & 8)) {
				if (job.flags & 4) job.flags &= -2;
				callWithErrorHandling(job, job.i, job.i ? 15 : 14);
				if (!(job.flags & 4)) job.flags &= -2;
			}
		}
	} finally {
		for (; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job) job.flags &= -2;
		}
		flushIndex = -1;
		queue.length = 0;
		flushPostFlushCbs(seen);
		currentFlushPromise = null;
		if (queue.length || pendingPostFlushCbs.length) flushJobs(seen);
	}
}
var currentRenderingInstance = null;
var currentScopeId = null;
function setCurrentRenderingInstance(instance) {
	const prev = currentRenderingInstance;
	currentRenderingInstance = instance;
	currentScopeId = instance && instance.type.__scopeId || null;
	return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
	if (!ctx) return fn;
	if (fn._n) return fn;
	const renderFnWithContext = (...args) => {
		if (renderFnWithContext._d) setBlockTracking(-1);
		const prevInstance = setCurrentRenderingInstance(ctx);
		let res;
		try {
			res = fn(...args);
		} finally {
			setCurrentRenderingInstance(prevInstance);
			if (renderFnWithContext._d) setBlockTracking(1);
		}
		return res;
	};
	renderFnWithContext._n = true;
	renderFnWithContext._c = true;
	renderFnWithContext._d = true;
	return renderFnWithContext;
}
function withDirectives(vnode, directives) {
	if (currentRenderingInstance === null) return vnode;
	const instance = getComponentPublicInstance(currentRenderingInstance);
	const bindings = vnode.dirs || (vnode.dirs = []);
	for (let i = 0; i < directives.length; i++) {
		let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
		if (dir) {
			if (isFunction(dir)) dir = {
				mounted: dir,
				updated: dir
			};
			if (dir.deep) traverse(value);
			bindings.push({
				dir,
				instance,
				value,
				oldValue: void 0,
				arg,
				modifiers
			});
		}
	}
	return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
	const bindings = vnode.dirs;
	const oldBindings = prevVNode && prevVNode.dirs;
	for (let i = 0; i < bindings.length; i++) {
		const binding = bindings[i];
		if (oldBindings) binding.oldValue = oldBindings[i].value;
		let hook = binding.dir[name];
		if (hook) {
			pauseTracking();
			callWithAsyncErrorHandling(hook, instance, 8, [
				vnode.el,
				binding,
				vnode,
				prevVNode
			]);
			resetTracking();
		}
	}
}
function provide(key, value) {
	if (currentInstance) {
		let provides = currentInstance.provides;
		const parentProvides = currentInstance.parent && currentInstance.parent.provides;
		if (parentProvides === provides) provides = currentInstance.provides = Object.create(parentProvides);
		provides[key] = value;
	}
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
	const instance = getCurrentInstance();
	if (instance || currentApp) {
		let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
		if (provides && key in provides) return provides[key];
		else if (arguments.length > 1) return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
	}
}
var ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
var useSSRContext = () => {
	{
		const ctx = inject(ssrContextKey);
		if (!ctx) {}
		return ctx;
	}
};
function watch(source, cb, options) {
	return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, flush, once } = options;
	const baseWatchOptions = extend({}, options);
	const runsImmediately = cb && immediate || !cb && flush !== "post";
	let ssrCleanup;
	if (isInSSRComponentSetup) {
		if (flush === "sync") {
			const ctx = useSSRContext();
			ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
		} else if (!runsImmediately) {
			const watchStopHandle = () => {};
			watchStopHandle.stop = NOOP;
			watchStopHandle.resume = NOOP;
			watchStopHandle.pause = NOOP;
			return watchStopHandle;
		}
	}
	const instance = currentInstance;
	baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
	let isPre = false;
	if (flush === "post") baseWatchOptions.scheduler = (job) => {
		queuePostRenderEffect(job, instance && instance.suspense);
	};
	else if (flush !== "sync") {
		isPre = true;
		baseWatchOptions.scheduler = (job, isFirstRun) => {
			if (isFirstRun) job();
			else queueJob(job);
		};
	}
	baseWatchOptions.augmentJob = (job) => {
		if (cb) job.flags |= 4;
		if (isPre) {
			job.flags |= 2;
			if (instance) {
				job.id = instance.uid;
				job.i = instance;
			}
		}
	};
	const watchHandle = watch$1(source, cb, baseWatchOptions);
	if (isInSSRComponentSetup) {
		if (ssrCleanup) ssrCleanup.push(watchHandle);
		else if (runsImmediately) watchHandle();
	}
	return watchHandle;
}
function instanceWatch(source, value, options) {
	const publicThis = this.proxy;
	const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
	let cb;
	if (isFunction(value)) cb = value;
	else {
		cb = value.handler;
		options = value;
	}
	const reset = setCurrentInstance(this);
	const res = doWatch(getter, cb.bind(publicThis), options);
	reset();
	return res;
}
function createPathGetter(ctx, path) {
	const segments = path.split(".");
	return () => {
		let cur = ctx;
		for (let i = 0; i < segments.length && cur; i++) cur = cur[segments[i]];
		return cur;
	};
}
var TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
var isTeleport = (type) => type.__isTeleport;
var leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
function setTransitionHooks(vnode, hooks) {
	if (vnode.shapeFlag & 6 && vnode.component) {
		vnode.transition = hooks;
		setTransitionHooks(vnode.component.subTree, hooks);
	} else if (vnode.shapeFlag & 128) {
		vnode.ssContent.transition = hooks.clone(vnode.ssContent);
		vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
	} else vnode.transition = hooks;
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
	return isFunction(options) ? /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))() : options;
}
function markAsyncBoundary(instance) {
	instance.ids = [
		instance.ids[0] + instance.ids[2]++ + "-",
		0,
		0
	];
}
function isTemplateRefKey(refs, key) {
	let desc;
	return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
var pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
	if (isArray(rawRef)) {
		rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
		return;
	}
	if (isAsyncWrapper(vnode) && !isUnmount) {
		if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
		return;
	}
	const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
	const value = isUnmount ? null : refValue;
	const { i: owner, r: ref } = rawRef;
	const oldRef = oldRawRef && oldRawRef.r;
	const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
	const setupState = owner.setupState;
	const rawSetupState = /* @__PURE__ */ toRaw(setupState);
	const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
		if (isTemplateRefKey(refs, key)) return false;
		return hasOwn(rawSetupState, key);
	};
	const canSetRef = (ref2, key) => {
		if (key && isTemplateRefKey(refs, key)) return false;
		return true;
	};
	if (oldRef != null && oldRef !== ref) {
		invalidatePendingSetRef(oldRawRef);
		if (isString(oldRef)) {
			refs[oldRef] = null;
			if (canSetSetupRef(oldRef)) setupState[oldRef] = null;
		} else if (/* @__PURE__ */ isRef(oldRef)) {
			const oldRawRefAtom = oldRawRef;
			if (canSetRef(oldRef, oldRawRefAtom.k)) oldRef.value = null;
			if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
		}
	}
	if (isFunction(ref)) callWithErrorHandling(ref, owner, 12, [value, refs]);
	else {
		const _isString = isString(ref);
		const _isRef = /* @__PURE__ */ isRef(ref);
		if (_isString || _isRef) {
			const doSet = () => {
				if (rawRef.f) {
					const existing = _isString ? canSetSetupRef(ref) ? setupState[ref] : refs[ref] : canSetRef(ref) || !rawRef.k ? ref.value : refs[rawRef.k];
					if (isUnmount) isArray(existing) && remove(existing, refValue);
					else if (!isArray(existing)) if (_isString) {
						refs[ref] = [refValue];
						if (canSetSetupRef(ref)) setupState[ref] = refs[ref];
					} else {
						const newVal = [refValue];
						if (canSetRef(ref, rawRef.k)) ref.value = newVal;
						if (rawRef.k) refs[rawRef.k] = newVal;
					}
					else if (!existing.includes(refValue)) existing.push(refValue);
				} else if (_isString) {
					refs[ref] = value;
					if (canSetSetupRef(ref)) setupState[ref] = value;
				} else if (_isRef) {
					if (canSetRef(ref, rawRef.k)) ref.value = value;
					if (rawRef.k) refs[rawRef.k] = value;
				}
			};
			if (value) {
				const job = () => {
					doSet();
					pendingSetRefMap.delete(rawRef);
				};
				job.id = -1;
				pendingSetRefMap.set(rawRef, job);
				queuePostRenderEffect(job, parentSuspense);
			} else {
				invalidatePendingSetRef(rawRef);
				doSet();
			}
		}
	}
}
function invalidatePendingSetRef(rawRef) {
	const pendingSetRef = pendingSetRefMap.get(rawRef);
	if (pendingSetRef) {
		pendingSetRef.flags |= 8;
		pendingSetRefMap.delete(rawRef);
	}
}
getGlobalThis().requestIdleCallback;
getGlobalThis().cancelIdleCallback;
var isAsyncWrapper = (i) => !!i.type.__asyncLoader;
var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
	registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
	registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
	const wrappedHook = hook.__wdc || (hook.__wdc = () => {
		let current = target;
		while (current) {
			if (current.isDeactivated) return;
			current = current.parent;
		}
		return hook();
	});
	injectHook(type, wrappedHook, target);
	if (target) {
		let current = target.parent;
		while (current && current.parent) {
			if (isKeepAlive(current.parent.vnode)) injectToKeepAliveRoot(wrappedHook, type, target, current);
			current = current.parent;
		}
	}
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
	const injected = injectHook(type, hook, keepAliveRoot, true);
	onUnmounted(() => {
		remove(keepAliveRoot[type], injected);
	}, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
	if (target) {
		const hooks = target[type] || (target[type] = []);
		const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
			pauseTracking();
			const reset = setCurrentInstance(target);
			const res = callWithAsyncErrorHandling(hook, target, type, args);
			reset();
			resetTracking();
			return res;
		});
		if (prepend) hooks.unshift(wrappedHook);
		else hooks.push(wrappedHook);
		return wrappedHook;
	}
}
var createHook = (lifecycle) => (hook, target = currentInstance) => {
	if (!isInSSRComponentSetup || lifecycle === "sp") injectHook(lifecycle, (...args) => hook(...args), target);
};
var onBeforeMount = createHook("bm");
var onMounted = createHook("m");
var onBeforeUpdate = createHook("bu");
var onUpdated = createHook("u");
var onBeforeUnmount = createHook("bum");
var onUnmounted = createHook("um");
var onServerPrefetch = createHook("sp");
var onRenderTriggered = createHook("rtg");
var onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
	injectHook("ec", hook, target);
}
var NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function renderList(source, renderItem, cache, index) {
	let ret;
	const cached = cache && cache[index];
	const sourceIsArray = isArray(source);
	if (sourceIsArray || isString(source)) {
		const sourceIsReactiveArray = sourceIsArray && /* @__PURE__ */ isReactive(source);
		let needsWrap = false;
		let isReadonlySource = false;
		if (sourceIsReactiveArray) {
			needsWrap = !/* @__PURE__ */ isShallow(source);
			isReadonlySource = /* @__PURE__ */ isReadonly(source);
			source = shallowReadArray(source);
		}
		ret = new Array(source.length);
		for (let i = 0, l = source.length; i < l; i++) ret[i] = renderItem(needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i], i, void 0, cached && cached[i]);
	} else if (typeof source === "number") {
		ret = new Array(source);
		for (let i = 0; i < source; i++) ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
	} else if (isObject(source)) if (source[Symbol.iterator]) ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
	else {
		const keys = Object.keys(source);
		ret = new Array(keys.length);
		for (let i = 0, l = keys.length; i < l; i++) {
			const key = keys[i];
			ret[i] = renderItem(source[key], key, i, cached && cached[i]);
		}
	}
	else ret = [];
	if (cache) cache[index] = ret;
	return ret;
}
var getPublicInstance = (i) => {
	if (!i) return null;
	if (isStatefulComponent(i)) return getComponentPublicInstance(i);
	return getPublicInstance(i.parent);
};
var publicPropertiesMap = /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
	$: (i) => i,
	$el: (i) => i.vnode.el,
	$data: (i) => i.data,
	$props: (i) => i.props,
	$attrs: (i) => i.attrs,
	$slots: (i) => i.slots,
	$refs: (i) => i.refs,
	$parent: (i) => getPublicInstance(i.parent),
	$root: (i) => getPublicInstance(i.root),
	$host: (i) => i.ce,
	$emit: (i) => i.emit,
	$options: (i) => resolveMergedOptions(i),
	$forceUpdate: (i) => i.f || (i.f = () => {
		queueJob(i.update);
	}),
	$nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
	$watch: (i) => instanceWatch.bind(i)
});
var hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
var PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		if (key === "__v_skip") return true;
		const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
		if (key[0] !== "$") {
			const n = accessCache[key];
			if (n !== void 0) switch (n) {
				case 1: return setupState[key];
				case 2: return data[key];
				case 4: return ctx[key];
				case 3: return props[key];
			}
			else if (hasSetupBinding(setupState, key)) {
				accessCache[key] = 1;
				return setupState[key];
			} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
				accessCache[key] = 2;
				return data[key];
			} else if (hasOwn(props, key)) {
				accessCache[key] = 3;
				return props[key];
			} else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
				accessCache[key] = 4;
				return ctx[key];
			} else if (shouldCacheAccess) accessCache[key] = 0;
		}
		const publicGetter = publicPropertiesMap[key];
		let cssModule, globalProperties;
		if (publicGetter) {
			if (key === "$attrs") track(instance.attrs, "get", "");
			return publicGetter(instance);
		} else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) return cssModule;
		else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
			accessCache[key] = 4;
			return ctx[key];
		} else if (globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)) return globalProperties[key];
	},
	set({ _: instance }, key, value) {
		const { data, setupState, ctx } = instance;
		if (hasSetupBinding(setupState, key)) {
			setupState[key] = value;
			return true;
		} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
			data[key] = value;
			return true;
		} else if (hasOwn(instance.props, key)) return false;
		if (key[0] === "$" && key.slice(1) in instance) return false;
		else ctx[key] = value;
		return true;
	},
	has({ _: { data, setupState, accessCache, ctx, appContext, props, type } }, key) {
		let cssModules;
		return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
	},
	defineProperty(target, key, descriptor) {
		if (descriptor.get != null) target._.accessCache[key] = 0;
		else if (hasOwn(descriptor, "value")) this.set(target, key, descriptor.value, null);
		return Reflect.defineProperty(target, key, descriptor);
	}
};
function normalizePropsOrEmits(props) {
	return isArray(props) ? props.reduce((normalized, p) => (normalized[p] = null, normalized), {}) : props;
}
var shouldCacheAccess = true;
function applyOptions(instance) {
	const options = resolveMergedOptions(instance);
	const publicThis = instance.proxy;
	const ctx = instance.ctx;
	shouldCacheAccess = false;
	if (options.beforeCreate) callHook(options.beforeCreate, instance, "bc");
	const { data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, expose, inheritAttrs, components, directives, filters } = options;
	const checkDuplicateProperties = null;
	if (injectOptions) resolveInjections(injectOptions, ctx, checkDuplicateProperties);
	if (methods) for (const key in methods) {
		const methodHandler = methods[key];
		if (isFunction(methodHandler)) ctx[key] = methodHandler.bind(publicThis);
	}
	if (dataOptions) {
		const data = dataOptions.call(publicThis, publicThis);
		if (!isObject(data)) {} else instance.data = /* @__PURE__ */ reactive(data);
	}
	shouldCacheAccess = true;
	if (computedOptions) for (const key in computedOptions) {
		const opt = computedOptions[key];
		const c = computed({
			get: isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP,
			set: !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP
		});
		Object.defineProperty(ctx, key, {
			enumerable: true,
			configurable: true,
			get: () => c.value,
			set: (v) => c.value = v
		});
	}
	if (watchOptions) for (const key in watchOptions) createWatcher(watchOptions[key], ctx, publicThis, key);
	if (provideOptions) {
		const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
		Reflect.ownKeys(provides).forEach((key) => {
			provide(key, provides[key]);
		});
	}
	if (created) callHook(created, instance, "c");
	function registerLifecycleHook(register, hook) {
		if (isArray(hook)) hook.forEach((_hook) => register(_hook.bind(publicThis)));
		else if (hook) register(hook.bind(publicThis));
	}
	registerLifecycleHook(onBeforeMount, beforeMount);
	registerLifecycleHook(onMounted, mounted);
	registerLifecycleHook(onBeforeUpdate, beforeUpdate);
	registerLifecycleHook(onUpdated, updated);
	registerLifecycleHook(onActivated, activated);
	registerLifecycleHook(onDeactivated, deactivated);
	registerLifecycleHook(onErrorCaptured, errorCaptured);
	registerLifecycleHook(onRenderTracked, renderTracked);
	registerLifecycleHook(onRenderTriggered, renderTriggered);
	registerLifecycleHook(onBeforeUnmount, beforeUnmount);
	registerLifecycleHook(onUnmounted, unmounted);
	registerLifecycleHook(onServerPrefetch, serverPrefetch);
	if (isArray(expose)) {
		if (expose.length) {
			const exposed = instance.exposed || (instance.exposed = {});
			expose.forEach((key) => {
				Object.defineProperty(exposed, key, {
					get: () => publicThis[key],
					set: (val) => publicThis[key] = val,
					enumerable: true
				});
			});
		} else if (!instance.exposed) instance.exposed = {};
	}
	if (render && instance.render === NOOP) instance.render = render;
	if (inheritAttrs != null) instance.inheritAttrs = inheritAttrs;
	if (components) instance.components = components;
	if (directives) instance.directives = directives;
	if (serverPrefetch) markAsyncBoundary(instance);
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
	if (isArray(injectOptions)) injectOptions = normalizeInject(injectOptions);
	for (const key in injectOptions) {
		const opt = injectOptions[key];
		let injected;
		if (isObject(opt)) if ("default" in opt) injected = inject(opt.from || key, opt.default, true);
		else injected = inject(opt.from || key);
		else injected = inject(opt);
		if (/* @__PURE__ */ isRef(injected)) Object.defineProperty(ctx, key, {
			enumerable: true,
			configurable: true,
			get: () => injected.value,
			set: (v) => injected.value = v
		});
		else ctx[key] = injected;
	}
}
function callHook(hook, instance, type) {
	callWithAsyncErrorHandling(isArray(hook) ? hook.map((h) => h.bind(instance.proxy)) : hook.bind(instance.proxy), instance, type);
}
function createWatcher(raw, ctx, publicThis, key) {
	let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
	if (isString(raw)) {
		const handler = ctx[raw];
		if (isFunction(handler)) watch(getter, handler);
	} else if (isFunction(raw)) watch(getter, raw.bind(publicThis));
	else if (isObject(raw)) if (isArray(raw)) raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
	else {
		const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
		if (isFunction(handler)) watch(getter, handler, raw);
	}
}
function resolveMergedOptions(instance) {
	const base = instance.type;
	const { mixins, extends: extendsOptions } = base;
	const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
	const cached = cache.get(base);
	let resolved;
	if (cached) resolved = cached;
	else if (!globalMixins.length && !mixins && !extendsOptions) resolved = base;
	else {
		resolved = {};
		if (globalMixins.length) globalMixins.forEach((m) => mergeOptions(resolved, m, optionMergeStrategies, true));
		mergeOptions(resolved, base, optionMergeStrategies);
	}
	if (isObject(base)) cache.set(base, resolved);
	return resolved;
}
function mergeOptions(to, from, strats, asMixin = false) {
	const { mixins, extends: extendsOptions } = from;
	if (extendsOptions) mergeOptions(to, extendsOptions, strats, true);
	if (mixins) mixins.forEach((m) => mergeOptions(to, m, strats, true));
	for (const key in from) if (asMixin && key === "expose") {} else {
		const strat = internalOptionMergeStrats[key] || strats && strats[key];
		to[key] = strat ? strat(to[key], from[key]) : from[key];
	}
	return to;
}
var internalOptionMergeStrats = {
	data: mergeDataFn,
	props: mergeEmitsOrPropsOptions,
	emits: mergeEmitsOrPropsOptions,
	methods: mergeObjectOptions,
	computed: mergeObjectOptions,
	beforeCreate: mergeAsArray,
	created: mergeAsArray,
	beforeMount: mergeAsArray,
	mounted: mergeAsArray,
	beforeUpdate: mergeAsArray,
	updated: mergeAsArray,
	beforeDestroy: mergeAsArray,
	beforeUnmount: mergeAsArray,
	destroyed: mergeAsArray,
	unmounted: mergeAsArray,
	activated: mergeAsArray,
	deactivated: mergeAsArray,
	errorCaptured: mergeAsArray,
	serverPrefetch: mergeAsArray,
	components: mergeObjectOptions,
	directives: mergeObjectOptions,
	watch: mergeWatchOptions,
	provide: mergeDataFn,
	inject: mergeInject
};
function mergeDataFn(to, from) {
	if (!from) return to;
	if (!to) return from;
	return function mergedDataFn() {
		return extend(isFunction(to) ? to.call(this, this) : to, isFunction(from) ? from.call(this, this) : from);
	};
}
function mergeInject(to, from) {
	return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
	if (isArray(raw)) {
		const res = {};
		for (let i = 0; i < raw.length; i++) res[raw[i]] = raw[i];
		return res;
	}
	return raw;
}
function mergeAsArray(to, from) {
	return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
	return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
	if (to) {
		if (isArray(to) && isArray(from)) return [.../* @__PURE__ */ new Set([...to, ...from])];
		return extend(/* @__PURE__ */ Object.create(null), normalizePropsOrEmits(to), normalizePropsOrEmits(from != null ? from : {}));
	} else return from;
}
function mergeWatchOptions(to, from) {
	if (!to) return from;
	if (!from) return to;
	const merged = extend(/* @__PURE__ */ Object.create(null), to);
	for (const key in from) merged[key] = mergeAsArray(to[key], from[key]);
	return merged;
}
function createAppContext() {
	return {
		app: null,
		config: {
			isNativeTag: NO,
			performance: false,
			globalProperties: {},
			optionMergeStrategies: {},
			errorHandler: void 0,
			warnHandler: void 0,
			compilerOptions: {}
		},
		mixins: [],
		components: {},
		directives: {},
		provides: /* @__PURE__ */ Object.create(null),
		optionsCache: /* @__PURE__ */ new WeakMap(),
		propsCache: /* @__PURE__ */ new WeakMap(),
		emitsCache: /* @__PURE__ */ new WeakMap()
	};
}
var uid$1 = 0;
function createAppAPI(render, hydrate) {
	return function createApp(rootComponent, rootProps = null) {
		if (!isFunction(rootComponent)) rootComponent = extend({}, rootComponent);
		if (rootProps != null && !isObject(rootProps)) rootProps = null;
		const context = createAppContext();
		const installedPlugins = /* @__PURE__ */ new WeakSet();
		const pluginCleanupFns = [];
		let isMounted = false;
		const app = context.app = {
			_uid: uid$1++,
			_component: rootComponent,
			_props: rootProps,
			_container: null,
			_context: context,
			_instance: null,
			version,
			get config() {
				return context.config;
			},
			set config(v) {},
			use(plugin, ...options) {
				if (installedPlugins.has(plugin)) {} else if (plugin && isFunction(plugin.install)) {
					installedPlugins.add(plugin);
					plugin.install(app, ...options);
				} else if (isFunction(plugin)) {
					installedPlugins.add(plugin);
					plugin(app, ...options);
				}
				return app;
			},
			mixin(mixin) {
				if (!context.mixins.includes(mixin)) context.mixins.push(mixin);
				return app;
			},
			component(name, component) {
				if (!component) return context.components[name];
				context.components[name] = component;
				return app;
			},
			directive(name, directive) {
				if (!directive) return context.directives[name];
				context.directives[name] = directive;
				return app;
			},
			mount(rootContainer, isHydrate, namespace) {
				if (!isMounted) {
					const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
					vnode.appContext = context;
					if (namespace === true) namespace = "svg";
					else if (namespace === false) namespace = void 0;
					if (isHydrate && hydrate) hydrate(vnode, rootContainer);
					else render(vnode, rootContainer, namespace);
					isMounted = true;
					app._container = rootContainer;
					rootContainer.__vue_app__ = app;
					return getComponentPublicInstance(vnode.component);
				}
			},
			onUnmount(cleanupFn) {
				pluginCleanupFns.push(cleanupFn);
			},
			unmount() {
				if (isMounted) {
					callWithAsyncErrorHandling(pluginCleanupFns, app._instance, 16);
					render(null, app._container);
					delete app._container.__vue_app__;
				}
			},
			provide(key, value) {
				context.provides[key] = value;
				return app;
			},
			runWithContext(fn) {
				const lastApp = currentApp;
				currentApp = app;
				try {
					return fn();
				} finally {
					currentApp = lastApp;
				}
			}
		};
		return app;
	};
}
var currentApp = null;
var getModelModifiers = (props, modelName) => {
	return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
	if (instance.isUnmounted) return;
	const props = instance.vnode.props || EMPTY_OBJ;
	let args = rawArgs;
	const isModelListener = event.startsWith("update:");
	const modifiers = isModelListener && getModelModifiers(props, event.slice(7));
	if (modifiers) {
		if (modifiers.trim) args = rawArgs.map((a) => isString(a) ? a.trim() : a);
		if (modifiers.number) args = rawArgs.map(looseToNumber);
	}
	let handlerName;
	let handler = props[handlerName = toHandlerKey(event)] || props[handlerName = toHandlerKey(camelize(event))];
	if (!handler && isModelListener) handler = props[handlerName = toHandlerKey(hyphenate(event))];
	if (handler) callWithAsyncErrorHandling(handler, instance, 6, args);
	const onceHandler = props[handlerName + `Once`];
	if (onceHandler) {
		if (!instance.emitted) instance.emitted = {};
		else if (instance.emitted[handlerName]) return;
		instance.emitted[handlerName] = true;
		callWithAsyncErrorHandling(onceHandler, instance, 6, args);
	}
}
var mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
	const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
	const cached = cache.get(comp);
	if (cached !== void 0) return cached;
	const raw = comp.emits;
	let normalized = {};
	let hasExtends = false;
	if (!isFunction(comp)) {
		const extendEmits = (raw2) => {
			const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
			if (normalizedFromExtend) {
				hasExtends = true;
				extend(normalized, normalizedFromExtend);
			}
		};
		if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendEmits);
		if (comp.extends) extendEmits(comp.extends);
		if (comp.mixins) comp.mixins.forEach(extendEmits);
	}
	if (!raw && !hasExtends) {
		if (isObject(comp)) cache.set(comp, null);
		return null;
	}
	if (isArray(raw)) raw.forEach((key) => normalized[key] = null);
	else extend(normalized, raw);
	if (isObject(comp)) cache.set(comp, normalized);
	return normalized;
}
function isEmitListener(options, key) {
	if (!options || !isOn(key)) return false;
	key = key.slice(2).replace(/Once$/, "");
	return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function renderComponentRoot(instance) {
	const { type: Component, vnode, proxy, withProxy, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, props, data, setupState, ctx, inheritAttrs } = instance;
	const prev = setCurrentRenderingInstance(instance);
	let result;
	let fallthroughAttrs;
	try {
		if (vnode.shapeFlag & 4) {
			const proxyToUse = withProxy || proxy;
			const thisProxy = proxyToUse;
			result = normalizeVNode(render.call(thisProxy, proxyToUse, renderCache, props, setupState, data, ctx));
			fallthroughAttrs = attrs;
		} else {
			const render2 = Component;
			result = normalizeVNode(render2.length > 1 ? render2(props, {
				attrs,
				slots,
				emit
			}) : render2(props, null));
			fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
		}
	} catch (err) {
		blockStack.length = 0;
		handleError(err, instance, 1);
		result = createVNode(Comment);
	}
	let root = result;
	if (fallthroughAttrs && inheritAttrs !== false) {
		const keys = Object.keys(fallthroughAttrs);
		const { shapeFlag } = root;
		if (keys.length) {
			if (shapeFlag & 7) {
				if (propsOptions && keys.some(isModelListener)) fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
				root = cloneVNode(root, fallthroughAttrs, false, true);
			}
		}
	}
	if (vnode.dirs) {
		root = cloneVNode(root, null, false, true);
		root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
	}
	if (vnode.transition) setTransitionHooks(root, vnode.transition);
	result = root;
	setCurrentRenderingInstance(prev);
	return result;
}
var getFunctionalFallthrough = (attrs) => {
	let res;
	for (const key in attrs) if (key === "class" || key === "style" || isOn(key)) (res || (res = {}))[key] = attrs[key];
	return res;
};
var filterModelListeners = (attrs, props) => {
	const res = {};
	for (const key in attrs) if (!isModelListener(key) || !(key.slice(9) in props)) res[key] = attrs[key];
	return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
	const { props: prevProps, children: prevChildren, component } = prevVNode;
	const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
	const emits = component.emitsOptions;
	if (nextVNode.dirs || nextVNode.transition) return true;
	if (optimized && patchFlag >= 0) {
		if (patchFlag & 1024) return true;
		if (patchFlag & 16) {
			if (!prevProps) return !!nextProps;
			return hasPropsChanged(prevProps, nextProps, emits);
		} else if (patchFlag & 8) {
			const dynamicProps = nextVNode.dynamicProps;
			for (let i = 0; i < dynamicProps.length; i++) {
				const key = dynamicProps[i];
				if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) return true;
			}
		}
	} else {
		if (prevChildren || nextChildren) {
			if (!nextChildren || !nextChildren.$stable) return true;
		}
		if (prevProps === nextProps) return false;
		if (!prevProps) return !!nextProps;
		if (!nextProps) return true;
		return hasPropsChanged(prevProps, nextProps, emits);
	}
	return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
	const nextKeys = Object.keys(nextProps);
	if (nextKeys.length !== Object.keys(prevProps).length) return true;
	for (let i = 0; i < nextKeys.length; i++) {
		const key = nextKeys[i];
		if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) return true;
	}
	return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
	const nextProp = nextProps[key];
	const prevProp = prevProps[key];
	if (key === "style" && isObject(nextProp) && isObject(prevProp)) return !looseEqual(nextProp, prevProp);
	return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
	while (parent) {
		const root = parent.subTree;
		if (root.suspense && root.suspense.activeBranch === vnode) {
			root.suspense.vnode.el = root.el = el;
			vnode = root;
		}
		if (root === vnode) {
			(vnode = parent.vnode).el = el;
			parent = parent.parent;
		} else break;
	}
	if (suspense && suspense.activeBranch === vnode) suspense.vnode.el = el;
}
var internalObjectProto = {};
var createInternalObject = () => Object.create(internalObjectProto);
var isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
	const props = {};
	const attrs = createInternalObject();
	instance.propsDefaults = /* @__PURE__ */ Object.create(null);
	setFullProps(instance, rawProps, props, attrs);
	for (const key in instance.propsOptions[0]) if (!(key in props)) props[key] = void 0;
	if (isStateful) instance.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
	else if (!instance.type.props) instance.props = attrs;
	else instance.props = props;
	instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
	const { props, attrs, vnode: { patchFlag } } = instance;
	const rawCurrentProps = /* @__PURE__ */ toRaw(props);
	const [options] = instance.propsOptions;
	let hasAttrsChanged = false;
	if ((optimized || patchFlag > 0) && !(patchFlag & 16)) {
		if (patchFlag & 8) {
			const propsToUpdate = instance.vnode.dynamicProps;
			for (let i = 0; i < propsToUpdate.length; i++) {
				let key = propsToUpdate[i];
				if (isEmitListener(instance.emitsOptions, key)) continue;
				const value = rawProps[key];
				if (options) if (hasOwn(attrs, key)) {
					if (value !== attrs[key]) {
						attrs[key] = value;
						hasAttrsChanged = true;
					}
				} else {
					const camelizedKey = camelize(key);
					props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
				}
				else if (value !== attrs[key]) {
					attrs[key] = value;
					hasAttrsChanged = true;
				}
			}
		}
	} else {
		if (setFullProps(instance, rawProps, props, attrs)) hasAttrsChanged = true;
		let kebabKey;
		for (const key in rawCurrentProps) if (!rawProps || !hasOwn(rawProps, key) && ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) if (options) {
			if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
		} else delete props[key];
		if (attrs !== rawCurrentProps) {
			for (const key in attrs) if (!rawProps || !hasOwn(rawProps, key) && true) {
				delete attrs[key];
				hasAttrsChanged = true;
			}
		}
	}
	if (hasAttrsChanged) trigger(instance.attrs, "set", "");
}
function setFullProps(instance, rawProps, props, attrs) {
	const [options, needCastKeys] = instance.propsOptions;
	let hasAttrsChanged = false;
	let rawCastValues;
	if (rawProps) for (let key in rawProps) {
		if (isReservedProp(key)) continue;
		const value = rawProps[key];
		let camelKey;
		if (options && hasOwn(options, camelKey = camelize(key))) if (!needCastKeys || !needCastKeys.includes(camelKey)) props[camelKey] = value;
		else (rawCastValues || (rawCastValues = {}))[camelKey] = value;
		else if (!isEmitListener(instance.emitsOptions, key)) {
			if (!(key in attrs) || value !== attrs[key]) {
				attrs[key] = value;
				hasAttrsChanged = true;
			}
		}
	}
	if (needCastKeys) {
		const rawCurrentProps = /* @__PURE__ */ toRaw(props);
		const castValues = rawCastValues || EMPTY_OBJ;
		for (let i = 0; i < needCastKeys.length; i++) {
			const key = needCastKeys[i];
			props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
		}
	}
	return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
	const opt = options[key];
	if (opt != null) {
		const hasDefault = hasOwn(opt, "default");
		if (hasDefault && value === void 0) {
			const defaultValue = opt.default;
			if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
				const { propsDefaults } = instance;
				if (key in propsDefaults) value = propsDefaults[key];
				else {
					const reset = setCurrentInstance(instance);
					value = propsDefaults[key] = defaultValue.call(null, props);
					reset();
				}
			} else value = defaultValue;
			if (instance.ce) instance.ce._setProp(key, value);
		}
		if (opt[0]) {
			if (isAbsent && !hasDefault) value = false;
			else if (opt[1] && (value === "" || value === hyphenate(key))) value = true;
		}
	}
	return value;
}
var mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
	const cache = asMixin ? mixinPropsCache : appContext.propsCache;
	const cached = cache.get(comp);
	if (cached) return cached;
	const raw = comp.props;
	const normalized = {};
	const needCastKeys = [];
	let hasExtends = false;
	if (!isFunction(comp)) {
		const extendProps = (raw2) => {
			hasExtends = true;
			const [props, keys] = normalizePropsOptions(raw2, appContext, true);
			extend(normalized, props);
			if (keys) needCastKeys.push(...keys);
		};
		if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendProps);
		if (comp.extends) extendProps(comp.extends);
		if (comp.mixins) comp.mixins.forEach(extendProps);
	}
	if (!raw && !hasExtends) {
		if (isObject(comp)) cache.set(comp, EMPTY_ARR);
		return EMPTY_ARR;
	}
	if (isArray(raw)) for (let i = 0; i < raw.length; i++) {
		const normalizedKey = camelize(raw[i]);
		if (validatePropName(normalizedKey)) normalized[normalizedKey] = EMPTY_OBJ;
	}
	else if (raw) for (const key in raw) {
		const normalizedKey = camelize(key);
		if (validatePropName(normalizedKey)) {
			const opt = raw[key];
			const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
			const propType = prop.type;
			let shouldCast = false;
			let shouldCastTrue = true;
			if (isArray(propType)) for (let index = 0; index < propType.length; ++index) {
				const type = propType[index];
				const typeName = isFunction(type) && type.name;
				if (typeName === "Boolean") {
					shouldCast = true;
					break;
				} else if (typeName === "String") shouldCastTrue = false;
			}
			else shouldCast = isFunction(propType) && propType.name === "Boolean";
			prop[0] = shouldCast;
			prop[1] = shouldCastTrue;
			if (shouldCast || hasOwn(prop, "default")) needCastKeys.push(normalizedKey);
		}
	}
	const res = [normalized, needCastKeys];
	if (isObject(comp)) cache.set(comp, res);
	return res;
}
function validatePropName(key) {
	if (key[0] !== "$" && !isReservedProp(key)) return true;
	return false;
}
var isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
var normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
var normalizeSlot = (key, rawSlot, ctx) => {
	if (rawSlot._n) return rawSlot;
	const normalized = withCtx((...args) => {
		return normalizeSlotValue(rawSlot(...args));
	}, ctx);
	normalized._c = false;
	return normalized;
};
var normalizeObjectSlots = (rawSlots, slots, instance) => {
	const ctx = rawSlots._ctx;
	for (const key in rawSlots) {
		if (isInternalKey(key)) continue;
		const value = rawSlots[key];
		if (isFunction(value)) slots[key] = normalizeSlot(key, value, ctx);
		else if (value != null) {
			const normalized = normalizeSlotValue(value);
			slots[key] = () => normalized;
		}
	}
};
var normalizeVNodeSlots = (instance, children) => {
	const normalized = normalizeSlotValue(children);
	instance.slots.default = () => normalized;
};
var assignSlots = (slots, children, optimized) => {
	for (const key in children) if (optimized || !isInternalKey(key)) slots[key] = children[key];
};
var initSlots = (instance, children, optimized) => {
	const slots = instance.slots = createInternalObject();
	if (instance.vnode.shapeFlag & 32) {
		const type = children._;
		if (type) {
			assignSlots(slots, children, optimized);
			if (optimized) def(slots, "_", type, true);
		} else normalizeObjectSlots(children, slots);
	} else if (children) normalizeVNodeSlots(instance, children);
};
var updateSlots = (instance, children, optimized) => {
	const { vnode, slots } = instance;
	let needDeletionCheck = true;
	let deletionComparisonTarget = EMPTY_OBJ;
	if (vnode.shapeFlag & 32) {
		const type = children._;
		if (type) if (optimized && type === 1) needDeletionCheck = false;
		else assignSlots(slots, children, optimized);
		else {
			needDeletionCheck = !children.$stable;
			normalizeObjectSlots(children, slots);
		}
		deletionComparisonTarget = children;
	} else if (children) {
		normalizeVNodeSlots(instance, children);
		deletionComparisonTarget = { default: 1 };
	}
	if (needDeletionCheck) {
		for (const key in slots) if (!isInternalKey(key) && deletionComparisonTarget[key] == null) delete slots[key];
	}
};
var queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
	return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
	const target = getGlobalThis();
	target.__VUE__ = true;
	const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, insertStaticContent: hostInsertStaticContent } = options;
	const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
		if (n1 === n2) return;
		if (n1 && !isSameVNodeType(n1, n2)) {
			anchor = getNextHostNode(n1);
			unmount(n1, parentComponent, parentSuspense, true);
			n1 = null;
		}
		if (n2.patchFlag === -2) {
			optimized = false;
			n2.dynamicChildren = null;
		}
		const { type, ref, shapeFlag } = n2;
		switch (type) {
			case Text:
				processText(n1, n2, container, anchor);
				break;
			case Comment:
				processCommentNode(n1, n2, container, anchor);
				break;
			case Static:
				if (n1 == null) mountStaticNode(n2, container, anchor, namespace);
				break;
			case Fragment:
				processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				break;
			default: if (shapeFlag & 1) processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 6) processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 64) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
			else if (shapeFlag & 128) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
		}
		if (ref != null && parentComponent) setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
		else if (ref == null && n1 && n1.ref != null) setRef(n1.ref, null, parentSuspense, n1, true);
	};
	const processText = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
		else {
			const el = n2.el = n1.el;
			if (n2.children !== n1.children) hostSetText(el, n2.children);
		}
	};
	const processCommentNode = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
		else n2.el = n1.el;
	};
	const mountStaticNode = (n2, container, anchor, namespace) => {
		[n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace, n2.el, n2.anchor);
	};
	const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostInsert(el, container, nextSibling);
			el = next;
		}
		hostInsert(anchor, container, nextSibling);
	};
	const removeStaticNode = ({ el, anchor }) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostRemove(el);
			el = next;
		}
		hostRemove(anchor);
	};
	const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		if (n2.type === "svg") namespace = "svg";
		else if (n2.type === "math") namespace = "mathml";
		if (n1 == null) mountElement(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		else {
			const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
			try {
				if (customElement) customElement._beginPatch();
				patchElement(n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			} finally {
				if (customElement) customElement._endPatch();
			}
		}
	};
	const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let el;
		let vnodeHook;
		const { props, shapeFlag, transition, dirs } = vnode;
		el = vnode.el = hostCreateElement(vnode.type, namespace, props && props.is, props);
		if (shapeFlag & 8) hostSetElementText(el, vnode.children);
		else if (shapeFlag & 16) mountChildren(vnode.children, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(vnode, namespace), slotScopeIds, optimized);
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "created");
		setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
		if (props) {
			for (const key in props) if (key !== "value" && !isReservedProp(key)) hostPatchProp(el, key, null, props[key], namespace, parentComponent);
			if ("value" in props) hostPatchProp(el, "value", null, props.value, namespace);
			if (vnodeHook = props.onVnodeBeforeMount) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		}
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
		const needCallTransitionHooks = needTransition(parentSuspense, transition);
		if (needCallTransitionHooks) transition.beforeEnter(el);
		hostInsert(el, container, anchor);
		if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) queuePostRenderEffect(() => {
			try {
				vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
				needCallTransitionHooks && transition.enter(el);
				dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
			} finally {}
		}, parentSuspense);
	};
	const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
		if (scopeId) hostSetScopeId(el, scopeId);
		if (slotScopeIds) for (let i = 0; i < slotScopeIds.length; i++) hostSetScopeId(el, slotScopeIds[i]);
		if (parentComponent) {
			let subTree = parentComponent.subTree;
			if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
				const parentVNode = parentComponent.vnode;
				setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
			}
		}
	};
	const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
		for (let i = start; i < children.length; i++) patch(null, children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
	};
	const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const el = n2.el = n1.el;
		let { patchFlag, dynamicChildren, dirs } = n2;
		patchFlag |= n1.patchFlag & 16;
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		let vnodeHook;
		parentComponent && toggleRecurse(parentComponent, false);
		if (vnodeHook = newProps.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
		if (dirs) invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
		parentComponent && toggleRecurse(parentComponent, true);
		if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) hostSetElementText(el, "");
		if (dynamicChildren) patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds);
		else if (!optimized) patchChildren(n1, n2, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds, false);
		if (patchFlag > 0) {
			if (patchFlag & 16) patchProps(el, oldProps, newProps, parentComponent, namespace);
			else {
				if (patchFlag & 2) {
					if (oldProps.class !== newProps.class) hostPatchProp(el, "class", null, newProps.class, namespace);
				}
				if (patchFlag & 4) hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
				if (patchFlag & 8) {
					const propsToUpdate = n2.dynamicProps;
					for (let i = 0; i < propsToUpdate.length; i++) {
						const key = propsToUpdate[i];
						const prev = oldProps[key];
						const next = newProps[key];
						if (next !== prev || key === "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
					}
				}
			}
			if (patchFlag & 1) {
				if (n1.children !== n2.children) hostSetElementText(el, n2.children);
			}
		} else if (!optimized && dynamicChildren == null) patchProps(el, oldProps, newProps, parentComponent, namespace);
		if ((vnodeHook = newProps.onVnodeUpdated) || dirs) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
			dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
		}, parentSuspense);
	};
	const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
		for (let i = 0; i < newChildren.length; i++) {
			const oldVNode = oldChildren[i];
			const newVNode = newChildren[i];
			patch(oldVNode, newVNode, oldVNode.el && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & 198) ? hostParentNode(oldVNode.el) : fallbackContainer, null, parentComponent, parentSuspense, namespace, slotScopeIds, true);
		}
	};
	const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
		if (oldProps !== newProps) {
			if (oldProps !== EMPTY_OBJ) {
				for (const key in oldProps) if (!isReservedProp(key) && !(key in newProps)) hostPatchProp(el, key, oldProps[key], null, namespace, parentComponent);
			}
			for (const key in newProps) {
				if (isReservedProp(key)) continue;
				const next = newProps[key];
				const prev = oldProps[key];
				if (next !== prev && key !== "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
			}
			if ("value" in newProps) hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
		}
	};
	const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
		const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
		let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
		if (fragmentSlotScopeIds) slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
		if (n1 == null) {
			hostInsert(fragmentStartAnchor, container, anchor);
			hostInsert(fragmentEndAnchor, container, anchor);
			mountChildren(n2.children || [], container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		} else if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
			patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, namespace, slotScopeIds);
			if (n2.key != null || parentComponent && n2 === parentComponent.subTree) traverseStaticChildren(n1, n2, true);
		} else patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
	};
	const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		n2.slotScopeIds = slotScopeIds;
		if (n1 == null) if (n2.shapeFlag & 512) parentComponent.ctx.activate(n2, container, anchor, namespace, optimized);
		else mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized);
		else updateComponent(n1, n2, optimized);
	};
	const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
		const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
		if (isKeepAlive(initialVNode)) instance.ctx.renderer = internals;
		setupComponent(instance, false, optimized);
		if (instance.asyncDep) {
			parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
			if (!initialVNode.el) {
				const placeholder = instance.subTree = createVNode(Comment);
				processCommentNode(null, placeholder, container, anchor);
				initialVNode.placeholder = placeholder.el;
			}
		} else setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, namespace, optimized);
	};
	const updateComponent = (n1, n2, optimized) => {
		const instance = n2.component = n1.component;
		if (shouldUpdateComponent(n1, n2, optimized)) if (instance.asyncDep && !instance.asyncResolved) {
			updateComponentPreRender(instance, n2, optimized);
			return;
		} else {
			instance.next = n2;
			instance.update();
		}
		else {
			n2.el = n1.el;
			instance.vnode = n2;
		}
	};
	const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
		const componentUpdateFn = () => {
			if (!instance.isMounted) {
				let vnodeHook;
				const { el, props } = initialVNode;
				const { bm, m, parent, root, type } = instance;
				const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
				toggleRecurse(instance, false);
				if (bm) invokeArrayFns(bm);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) invokeVNodeHook(vnodeHook, parent, initialVNode);
				toggleRecurse(instance, true);
				if (el && hydrateNode) {
					const hydrateSubTree = () => {
						instance.subTree = renderComponentRoot(instance);
						hydrateNode(el, instance.subTree, instance, parentSuspense, null);
					};
					if (isAsyncWrapperVNode && type.__asyncHydrate) type.__asyncHydrate(el, instance, hydrateSubTree);
					else hydrateSubTree();
				} else {
					if (root.ce && root.ce._hasShadowRoot()) root.ce._injectChildStyle(type, instance.parent ? instance.parent.type : void 0);
					const subTree = instance.subTree = renderComponentRoot(instance);
					patch(null, subTree, container, anchor, instance, parentSuspense, namespace);
					initialVNode.el = subTree.el;
				}
				if (m) queuePostRenderEffect(m, parentSuspense);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
					const scopedInitialVNode = initialVNode;
					queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
				}
				if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) instance.a && queuePostRenderEffect(instance.a, parentSuspense);
				instance.isMounted = true;
				initialVNode = container = anchor = null;
			} else {
				let { next, bu, u, parent, vnode } = instance;
				{
					const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
					if (nonHydratedAsyncRoot) {
						if (next) {
							next.el = vnode.el;
							updateComponentPreRender(instance, next, optimized);
						}
						nonHydratedAsyncRoot.asyncDep.then(() => {
							queuePostRenderEffect(() => {
								if (!instance.isUnmounted) update();
							}, parentSuspense);
						});
						return;
					}
				}
				let originNext = next;
				let vnodeHook;
				toggleRecurse(instance, false);
				if (next) {
					next.el = vnode.el;
					updateComponentPreRender(instance, next, optimized);
				} else next = vnode;
				if (bu) invokeArrayFns(bu);
				if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parent, next, vnode);
				toggleRecurse(instance, true);
				const nextTree = renderComponentRoot(instance);
				const prevTree = instance.subTree;
				instance.subTree = nextTree;
				patch(prevTree, nextTree, hostParentNode(prevTree.el), getNextHostNode(prevTree), instance, parentSuspense, namespace);
				next.el = nextTree.el;
				if (originNext === null) updateHOCHostEl(instance, nextTree.el);
				if (u) queuePostRenderEffect(u, parentSuspense);
				if (vnodeHook = next.props && next.props.onVnodeUpdated) queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
			}
		};
		instance.scope.on();
		const effect = instance.effect = new ReactiveEffect(componentUpdateFn);
		instance.scope.off();
		const update = instance.update = effect.run.bind(effect);
		const job = instance.job = effect.runIfDirty.bind(effect);
		job.i = instance;
		job.id = instance.uid;
		effect.scheduler = () => queueJob(job);
		toggleRecurse(instance, true);
		update();
	};
	const updateComponentPreRender = (instance, nextVNode, optimized) => {
		nextVNode.component = instance;
		const prevProps = instance.vnode.props;
		instance.vnode = nextVNode;
		instance.next = null;
		updateProps(instance, nextVNode.props, prevProps, optimized);
		updateSlots(instance, nextVNode.children, optimized);
		pauseTracking();
		flushPreFlushCbs(instance);
		resetTracking();
	};
	const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
		const c1 = n1 && n1.children;
		const prevShapeFlag = n1 ? n1.shapeFlag : 0;
		const c2 = n2.children;
		const { patchFlag, shapeFlag } = n2;
		if (patchFlag > 0) {
			if (patchFlag & 128) {
				patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			} else if (patchFlag & 256) {
				patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			}
		}
		if (shapeFlag & 8) {
			if (prevShapeFlag & 16) unmountChildren(c1, parentComponent, parentSuspense);
			if (c2 !== c1) hostSetElementText(container, c2);
		} else if (prevShapeFlag & 16) if (shapeFlag & 16) patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		else unmountChildren(c1, parentComponent, parentSuspense, true);
		else {
			if (prevShapeFlag & 8) hostSetElementText(container, "");
			if (shapeFlag & 16) mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
	};
	const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		c1 = c1 || EMPTY_ARR;
		c2 = c2 || EMPTY_ARR;
		const oldLength = c1.length;
		const newLength = c2.length;
		const commonLength = Math.min(oldLength, newLength);
		let i;
		for (i = 0; i < commonLength; i++) {
			const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
		if (oldLength > newLength) unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
		else mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, commonLength);
	};
	const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let i = 0;
		const l2 = c2.length;
		let e1 = c1.length - 1;
		let e2 = l2 - 1;
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			i++;
		}
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			e1--;
			e2--;
		}
		if (i > e1) {
			if (i <= e2) {
				const nextPos = e2 + 1;
				const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
				while (i <= e2) {
					patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					i++;
				}
			}
		} else if (i > e2) while (i <= e1) {
			unmount(c1[i], parentComponent, parentSuspense, true);
			i++;
		}
		else {
			const s1 = i;
			const s2 = i;
			const keyToNewIndexMap = /* @__PURE__ */ new Map();
			for (i = s2; i <= e2; i++) {
				const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
				if (nextChild.key != null) keyToNewIndexMap.set(nextChild.key, i);
			}
			let j;
			let patched = 0;
			const toBePatched = e2 - s2 + 1;
			let moved = false;
			let maxNewIndexSoFar = 0;
			const newIndexToOldIndexMap = new Array(toBePatched);
			for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
			for (i = s1; i <= e1; i++) {
				const prevChild = c1[i];
				if (patched >= toBePatched) {
					unmount(prevChild, parentComponent, parentSuspense, true);
					continue;
				}
				let newIndex;
				if (prevChild.key != null) newIndex = keyToNewIndexMap.get(prevChild.key);
				else for (j = s2; j <= e2; j++) if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
					newIndex = j;
					break;
				}
				if (newIndex === void 0) unmount(prevChild, parentComponent, parentSuspense, true);
				else {
					newIndexToOldIndexMap[newIndex - s2] = i + 1;
					if (newIndex >= maxNewIndexSoFar) maxNewIndexSoFar = newIndex;
					else moved = true;
					patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					patched++;
				}
			}
			const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
			j = increasingNewIndexSequence.length - 1;
			for (i = toBePatched - 1; i >= 0; i--) {
				const nextIndex = s2 + i;
				const nextChild = c2[nextIndex];
				const anchorVNode = c2[nextIndex + 1];
				const anchor = nextIndex + 1 < l2 ? anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode) : parentAnchor;
				if (newIndexToOldIndexMap[i] === 0) patch(null, nextChild, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else if (moved) if (j < 0 || i !== increasingNewIndexSequence[j]) move(nextChild, container, anchor, 2);
				else j--;
			}
		}
	};
	const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
		const { el, type, transition, children, shapeFlag } = vnode;
		if (shapeFlag & 6) {
			move(vnode.component.subTree, container, anchor, moveType);
			return;
		}
		if (shapeFlag & 128) {
			vnode.suspense.move(container, anchor, moveType);
			return;
		}
		if (shapeFlag & 64) {
			type.move(vnode, container, anchor, internals);
			return;
		}
		if (type === Fragment) {
			hostInsert(el, container, anchor);
			for (let i = 0; i < children.length; i++) move(children[i], container, anchor, moveType);
			hostInsert(vnode.anchor, container, anchor);
			return;
		}
		if (type === Static) {
			moveStaticNode(vnode, container, anchor);
			return;
		}
		if (moveType !== 2 && shapeFlag & 1 && transition) if (moveType === 0) if (transition.persisted && !el[leaveCbKey]) hostInsert(el, container, anchor);
		else {
			transition.beforeEnter(el);
			hostInsert(el, container, anchor);
			queuePostRenderEffect(() => transition.enter(el), parentSuspense);
		}
		else {
			const { leave, delayLeave, afterLeave } = transition;
			const remove2 = () => {
				if (vnode.ctx.isUnmounted) hostRemove(el);
				else hostInsert(el, container, anchor);
			};
			const performLeave = () => {
				const wasLeaving = el._isLeaving || !!el[leaveCbKey];
				if (el._isLeaving) el[leaveCbKey](true);
				if (transition.persisted && !wasLeaving) remove2();
				else leave(el, () => {
					remove2();
					afterLeave && afterLeave();
				});
			};
			if (delayLeave) delayLeave(el, remove2, performLeave);
			else performLeave();
		}
		else hostInsert(el, container, anchor);
	};
	const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
		const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs, cacheIndex, memo } = vnode;
		if (patchFlag === -2) optimized = false;
		if (ref != null) {
			pauseTracking();
			setRef(ref, null, parentSuspense, vnode, true);
			resetTracking();
		}
		if (cacheIndex != null) parentComponent.renderCache[cacheIndex] = void 0;
		if (shapeFlag & 256) {
			parentComponent.ctx.deactivate(vnode);
			return;
		}
		const shouldInvokeDirs = shapeFlag & 1 && dirs;
		const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
		let vnodeHook;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		if (shapeFlag & 6) unmountComponent(vnode.component, parentSuspense, doRemove);
		else {
			if (shapeFlag & 128) {
				vnode.suspense.unmount(parentSuspense, doRemove);
				return;
			}
			if (shouldInvokeDirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
			if (shapeFlag & 64) vnode.type.remove(vnode, parentComponent, parentSuspense, internals, doRemove);
			else if (dynamicChildren && !dynamicChildren.hasOnce && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
			else if (type === Fragment && patchFlag & 384 || !optimized && shapeFlag & 16) unmountChildren(children, parentComponent, parentSuspense);
			if (doRemove) remove(vnode);
		}
		const shouldInvalidateMemo = memo != null && cacheIndex == null;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
			shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
			if (shouldInvalidateMemo) vnode.el = null;
		}, parentSuspense);
	};
	const remove = (vnode) => {
		const { type, el, anchor, transition } = vnode;
		if (type === Fragment) {
			removeFragment(el, anchor);
			return;
		}
		if (type === Static) {
			removeStaticNode(vnode);
			return;
		}
		const performRemove = () => {
			hostRemove(el);
			if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
		};
		if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
			const { leave, delayLeave } = transition;
			const performLeave = () => leave(el, performRemove);
			if (delayLeave) delayLeave(vnode.el, performRemove, performLeave);
			else performLeave();
		} else performRemove();
	};
	const removeFragment = (cur, end) => {
		let next;
		while (cur !== end) {
			next = hostNextSibling(cur);
			hostRemove(cur);
			cur = next;
		}
		hostRemove(end);
	};
	const unmountComponent = (instance, parentSuspense, doRemove) => {
		const { bum, scope, job, subTree, um, m, a } = instance;
		invalidateMount(m);
		invalidateMount(a);
		if (bum) invokeArrayFns(bum);
		scope.stop();
		if (job) {
			job.flags |= 8;
			unmount(subTree, instance, parentSuspense, doRemove);
		}
		if (um) queuePostRenderEffect(um, parentSuspense);
		queuePostRenderEffect(() => {
			instance.isUnmounted = true;
		}, parentSuspense);
	};
	const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
		for (let i = start; i < children.length; i++) unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
	};
	const getNextHostNode = (vnode) => {
		if (vnode.shapeFlag & 6) return getNextHostNode(vnode.component.subTree);
		if (vnode.shapeFlag & 128) return vnode.suspense.next();
		const el = hostNextSibling(vnode.anchor || vnode.el);
		const teleportEnd = el && el[TeleportEndKey];
		return teleportEnd ? hostNextSibling(teleportEnd) : el;
	};
	let isFlushing = false;
	const render = (vnode, container, namespace) => {
		let instance;
		if (vnode == null) {
			if (container._vnode) {
				unmount(container._vnode, null, null, true);
				instance = container._vnode.component;
			}
		} else patch(container._vnode || null, vnode, container, null, null, null, namespace);
		container._vnode = vnode;
		if (!isFlushing) {
			isFlushing = true;
			flushPreFlushCbs(instance);
			flushPostFlushCbs();
			isFlushing = false;
		}
	};
	const internals = {
		p: patch,
		um: unmount,
		m: move,
		r: remove,
		mt: mountComponent,
		mc: mountChildren,
		pc: patchChildren,
		pbc: patchBlockChildren,
		n: getNextHostNode,
		o: options
	};
	let hydrate;
	let hydrateNode;
	if (createHydrationFns) [hydrate, hydrateNode] = createHydrationFns(internals);
	return {
		render,
		hydrate,
		createApp: createAppAPI(render, hydrate)
	};
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
	return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect, job }, allowed) {
	if (allowed) {
		effect.flags |= 32;
		job.flags |= 4;
	} else {
		effect.flags &= -33;
		job.flags &= -5;
	}
}
function needTransition(parentSuspense, transition) {
	return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
	const ch1 = n1.children;
	const ch2 = n2.children;
	if (isArray(ch1) && isArray(ch2)) for (let i = 0; i < ch1.length; i++) {
		const c1 = ch1[i];
		let c2 = ch2[i];
		if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
			if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
				c2 = ch2[i] = cloneIfMounted(ch2[i]);
				c2.el = c1.el;
			}
			if (!shallow && c2.patchFlag !== -2) traverseStaticChildren(c1, c2);
		}
		if (c2.type === Text) {
			if (c2.patchFlag === -1) c2 = ch2[i] = cloneIfMounted(c2);
			c2.el = c1.el;
		}
		if (c2.type === Comment && !c2.el) c2.el = c1.el;
	}
}
function getSequence(arr) {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = u + v >> 1;
				if (arr[result[c]] < arrI) u = c + 1;
				else v = c;
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) p[i] = result[u - 1];
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}
function locateNonHydratedAsyncRoot(instance) {
	const subComponent = instance.subTree.component;
	if (subComponent) if (subComponent.asyncDep && !subComponent.asyncResolved) return subComponent;
	else return locateNonHydratedAsyncRoot(subComponent);
}
function invalidateMount(hooks) {
	if (hooks) for (let i = 0; i < hooks.length; i++) hooks[i].flags |= 8;
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
	if (anchorVnode.placeholder) return anchorVnode.placeholder;
	const instance = anchorVnode.component;
	if (instance) return resolveAsyncComponentPlaceholder(instance.subTree);
	return null;
}
var isSuspense = (type) => type.__isSuspense;
function queueEffectWithSuspense(fn, suspense) {
	if (suspense && suspense.pendingBranch) if (isArray(fn)) suspense.effects.push(...fn);
	else suspense.effects.push(fn);
	else queuePostFlushCb(fn);
}
var Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
var Text = /* @__PURE__ */ Symbol.for("v-txt");
var Comment = /* @__PURE__ */ Symbol.for("v-cmt");
var Static = /* @__PURE__ */ Symbol.for("v-stc");
var blockStack = [];
var currentBlock = null;
function openBlock(disableTracking = false) {
	blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
	blockStack.pop();
	currentBlock = blockStack[blockStack.length - 1] || null;
}
var isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
	isBlockTreeEnabled += value;
	if (value < 0 && currentBlock && inVOnce) currentBlock.hasOnce = true;
}
function setupBlock(vnode) {
	vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
	closeBlock();
	if (isBlockTreeEnabled > 0 && currentBlock) currentBlock.push(vnode);
	return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
	return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
	return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
}
function isVNode(value) {
	return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
	return n1.type === n2.type && n1.key === n2.key;
}
var normalizeKey = ({ key }) => key != null ? key : null;
var normalizeRef = ({ ref, ref_key, ref_for }) => {
	if (typeof ref === "number") ref = "" + ref;
	return ref != null ? isString(ref) || /* @__PURE__ */ isRef(ref) || isFunction(ref) ? {
		i: currentRenderingInstance,
		r: ref,
		k: ref_key,
		f: !!ref_for
	} : ref : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
	const vnode = {
		__v_isVNode: true,
		__v_skip: true,
		type,
		props,
		key: props && normalizeKey(props),
		ref: props && normalizeRef(props),
		scopeId: currentScopeId,
		slotScopeIds: null,
		children,
		component: null,
		suspense: null,
		ssContent: null,
		ssFallback: null,
		dirs: null,
		transition: null,
		el: null,
		anchor: null,
		target: null,
		targetStart: null,
		targetAnchor: null,
		staticCount: 0,
		shapeFlag,
		patchFlag,
		dynamicProps,
		dynamicChildren: null,
		appContext: null,
		ctx: currentRenderingInstance
	};
	if (needFullChildrenNormalization) {
		normalizeChildren(vnode, children);
		if (shapeFlag & 128) type.normalize(vnode);
	} else if (children) vnode.shapeFlag |= isString(children) ? 8 : 16;
	if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) currentBlock.push(vnode);
	return vnode;
}
var createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
	if (!type || type === NULL_DYNAMIC_COMPONENT) type = Comment;
	if (isVNode(type)) {
		const cloned = cloneVNode(type, props, true);
		if (children) normalizeChildren(cloned, children);
		if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) if (cloned.shapeFlag & 6) currentBlock[currentBlock.indexOf(type)] = cloned;
		else currentBlock.push(cloned);
		cloned.patchFlag = -2;
		return cloned;
	}
	if (isClassComponent(type)) type = type.__vccOpts;
	if (props) {
		props = guardReactiveProps(props);
		let { class: klass, style } = props;
		if (klass && !isString(klass)) props.class = normalizeClass(klass);
		if (isObject(style)) {
			if (/* @__PURE__ */ isProxy(style) && !isArray(style)) style = extend({}, style);
			props.style = normalizeStyle(style);
		}
	}
	const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
	return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
}
function guardReactiveProps(props) {
	if (!props) return null;
	return /* @__PURE__ */ isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
	const { props, ref, patchFlag, children, transition } = vnode;
	const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
	const cloned = {
		__v_isVNode: true,
		__v_skip: true,
		type: vnode.type,
		props: mergedProps,
		key: mergedProps && normalizeKey(mergedProps),
		ref: extraProps && extraProps.ref ? mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps) : ref,
		scopeId: vnode.scopeId,
		slotScopeIds: vnode.slotScopeIds,
		children,
		target: vnode.target,
		targetStart: vnode.targetStart,
		targetAnchor: vnode.targetAnchor,
		staticCount: vnode.staticCount,
		shapeFlag: vnode.shapeFlag,
		patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
		dynamicProps: vnode.dynamicProps,
		dynamicChildren: vnode.dynamicChildren,
		appContext: vnode.appContext,
		dirs: vnode.dirs,
		transition,
		component: vnode.component,
		suspense: vnode.suspense,
		ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
		ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
		placeholder: vnode.placeholder,
		el: vnode.el,
		anchor: vnode.anchor,
		ctx: vnode.ctx,
		ce: vnode.ce
	};
	if (transition && cloneTransition) setTransitionHooks(cloned, transition.clone(cloned));
	return cloned;
}
function createTextVNode(text = " ", flag = 0) {
	return createVNode(Text, null, text, flag);
}
function createCommentVNode(text = "", asBlock = false) {
	return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
	if (child == null || typeof child === "boolean") return createVNode(Comment);
	else if (isArray(child)) return createVNode(Fragment, null, child.slice());
	else if (isVNode(child)) return cloneIfMounted(child);
	else return createVNode(Text, null, String(child));
}
function cloneIfMounted(child) {
	return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
	let type = 0;
	const { shapeFlag } = vnode;
	if (children == null) children = null;
	else if (isArray(children)) type = 16;
	else if (typeof children === "object") if (shapeFlag & 65) {
		const slot = children.default;
		if (slot) {
			slot._c && (slot._d = false);
			normalizeChildren(vnode, slot());
			slot._c && (slot._d = true);
		}
		return;
	} else {
		type = 32;
		const slotFlag = children._;
		if (!slotFlag && !isInternalObject(children)) children._ctx = currentRenderingInstance;
		else if (slotFlag === 3 && currentRenderingInstance) if (currentRenderingInstance.slots._ === 1) children._ = 1;
		else {
			children._ = 2;
			vnode.patchFlag |= 1024;
		}
	}
	else if (isFunction(children)) {
		children = {
			default: children,
			_ctx: currentRenderingInstance
		};
		type = 32;
	} else {
		children = String(children);
		if (shapeFlag & 64) {
			type = 16;
			children = [createTextVNode(children)];
		} else type = 8;
	}
	vnode.children = children;
	vnode.shapeFlag |= type;
}
function mergeProps(...args) {
	const ret = {};
	for (let i = 0; i < args.length; i++) {
		const toMerge = args[i];
		for (const key in toMerge) if (key === "class") {
			if (ret.class !== toMerge.class) ret.class = normalizeClass([ret.class, toMerge.class]);
		} else if (key === "style") ret.style = normalizeStyle([ret.style, toMerge.style]);
		else if (isOn(key)) {
			const existing = ret[key];
			const incoming = toMerge[key];
			if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) ret[key] = existing ? [].concat(existing, incoming) : incoming;
			else if (incoming == null && existing == null && !isModelListener(key)) ret[key] = incoming;
		} else if (key !== "") ret[key] = toMerge[key];
	}
	return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
	callWithAsyncErrorHandling(hook, instance, 7, [vnode, prevVNode]);
}
var emptyAppContext = createAppContext();
var uid = 0;
function createComponentInstance(vnode, parent, suspense) {
	const type = vnode.type;
	const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
	const instance = {
		uid: uid++,
		vnode,
		type,
		parent,
		appContext,
		root: null,
		next: null,
		subTree: null,
		effect: null,
		update: null,
		job: null,
		scope: new EffectScope(true),
		render: null,
		proxy: null,
		exposed: null,
		exposeProxy: null,
		withProxy: null,
		provides: parent ? parent.provides : Object.create(appContext.provides),
		ids: parent ? parent.ids : [
			"",
			0,
			0
		],
		accessCache: null,
		renderCache: [],
		components: null,
		directives: null,
		propsOptions: normalizePropsOptions(type, appContext),
		emitsOptions: normalizeEmitsOptions(type, appContext),
		emit: null,
		emitted: null,
		propsDefaults: EMPTY_OBJ,
		inheritAttrs: type.inheritAttrs,
		ctx: EMPTY_OBJ,
		data: EMPTY_OBJ,
		props: EMPTY_OBJ,
		attrs: EMPTY_OBJ,
		slots: EMPTY_OBJ,
		refs: EMPTY_OBJ,
		setupState: EMPTY_OBJ,
		setupContext: null,
		suspense,
		suspenseId: suspense ? suspense.pendingId : 0,
		asyncDep: null,
		asyncResolved: false,
		isMounted: false,
		isUnmounted: false,
		isDeactivated: false,
		bc: null,
		c: null,
		bm: null,
		m: null,
		bu: null,
		u: null,
		um: null,
		bum: null,
		da: null,
		a: null,
		rtg: null,
		rtc: null,
		ec: null,
		sp: null
	};
	instance.ctx = { _: instance };
	instance.root = parent ? parent.root : instance;
	instance.emit = emit.bind(null, instance);
	if (vnode.ce) vnode.ce(instance);
	return instance;
}
var currentInstance = null;
var getCurrentInstance = () => currentInstance || currentRenderingInstance;
var internalSetCurrentInstance;
var setInSSRSetupState;
{
	const g = getGlobalThis();
	const registerGlobalSetter = (key, setter) => {
		let setters;
		if (!(setters = g[key])) setters = g[key] = [];
		setters.push(setter);
		return (v) => {
			if (setters.length > 1) setters.forEach((set) => set(v));
			else setters[0](v);
		};
	};
	internalSetCurrentInstance = registerGlobalSetter(`__VUE_INSTANCE_SETTERS__`, (v) => currentInstance = v);
	setInSSRSetupState = registerGlobalSetter(`__VUE_SSR_SETTERS__`, (v) => isInSSRComponentSetup = v);
}
var setCurrentInstance = (instance) => {
	const prev = currentInstance;
	internalSetCurrentInstance(instance);
	instance.scope.on();
	return () => {
		instance.scope.off();
		internalSetCurrentInstance(prev);
	};
};
var unsetCurrentInstance = () => {
	currentInstance && currentInstance.scope.off();
	internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
	return instance.vnode.shapeFlag & 4;
}
var isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
	isSSR && setInSSRSetupState(isSSR);
	const { props, children } = instance.vnode;
	const isStateful = isStatefulComponent(instance);
	initProps(instance, props, isStateful, isSSR);
	initSlots(instance, children, optimized || isSSR);
	const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
	isSSR && setInSSRSetupState(false);
	return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
	const Component = instance.type;
	instance.accessCache = /* @__PURE__ */ Object.create(null);
	instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
	const { setup } = Component;
	if (setup) {
		pauseTracking();
		const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
		const reset = setCurrentInstance(instance);
		const setupResult = callWithErrorHandling(setup, instance, 0, [instance.props, setupContext]);
		const isAsyncSetup = isPromise(setupResult);
		resetTracking();
		reset();
		if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) markAsyncBoundary(instance);
		if (isAsyncSetup) {
			setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
			if (isSSR) return setupResult.then((resolvedResult) => {
				handleSetupResult(instance, resolvedResult, isSSR);
			}).catch((e) => {
				handleError(e, instance, 0);
			});
			else instance.asyncDep = setupResult;
		} else handleSetupResult(instance, setupResult, isSSR);
	} else finishComponentSetup(instance, isSSR);
}
function handleSetupResult(instance, setupResult, isSSR) {
	if (isFunction(setupResult)) if (instance.type.__ssrInlineRender) instance.ssrRender = setupResult;
	else instance.render = setupResult;
	else if (isObject(setupResult)) instance.setupState = proxyRefs(setupResult);
	finishComponentSetup(instance, isSSR);
}
var compile;
var installWithProxy;
function finishComponentSetup(instance, isSSR, skipOptions) {
	const Component = instance.type;
	if (!instance.render) {
		if (!isSSR && compile && !Component.render) {
			const template = Component.template || resolveMergedOptions(instance).template;
			if (template) {
				const { isCustomElement, compilerOptions } = instance.appContext.config;
				const { delimiters, compilerOptions: componentCompilerOptions } = Component;
				Component.render = compile(template, extend(extend({
					isCustomElement,
					delimiters
				}, compilerOptions), componentCompilerOptions));
			}
		}
		instance.render = Component.render || NOOP;
		if (installWithProxy) installWithProxy(instance);
	}
	{
		const reset = setCurrentInstance(instance);
		pauseTracking();
		try {
			applyOptions(instance);
		} finally {
			resetTracking();
			reset();
		}
	}
}
var attrsProxyHandlers = { get(target, key) {
	track(target, "get", "");
	return target[key];
} };
function createSetupContext(instance) {
	const expose = (exposed) => {
		instance.exposed = exposed || {};
	};
	return {
		attrs: new Proxy(instance.attrs, attrsProxyHandlers),
		slots: instance.slots,
		emit: instance.emit,
		expose
	};
}
function getComponentPublicInstance(instance) {
	if (instance.exposed) return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
		get(target, key) {
			if (key in target) return target[key];
			else if (key in publicPropertiesMap) return publicPropertiesMap[key](instance);
		},
		has(target, key) {
			return key in target || key in publicPropertiesMap;
		}
	}));
	else return instance.proxy;
}
function isClassComponent(value) {
	return isFunction(value) && "__vccOpts" in value;
}
var computed = (getterOrOptions, debugOptions) => {
	return /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
};
var version = "3.5.35";
//#endregion
//#region node_modules/.bun/@vue+runtime-dom@3.5.35/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
/**
* @vue/runtime-dom v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var policy = void 0;
var tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) try {
	policy = /* @__PURE__ */ tt.createPolicy("vue", { createHTML: (val) => val });
} catch (e) {}
var unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
var svgNS = "http://www.w3.org/2000/svg";
var mathmlNS = "http://www.w3.org/1998/Math/MathML";
var doc = typeof document !== "undefined" ? document : null;
var templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
var nodeOps = {
	insert: (child, parent, anchor) => {
		parent.insertBefore(child, anchor || null);
	},
	remove: (child) => {
		const parent = child.parentNode;
		if (parent) parent.removeChild(child);
	},
	createElement: (tag, namespace, is, props) => {
		const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
		if (tag === "select" && props && props.multiple != null) el.setAttribute("multiple", props.multiple);
		return el;
	},
	createText: (text) => doc.createTextNode(text),
	createComment: (text) => doc.createComment(text),
	setText: (node, text) => {
		node.nodeValue = text;
	},
	setElementText: (el, text) => {
		el.textContent = text;
	},
	parentNode: (node) => node.parentNode,
	nextSibling: (node) => node.nextSibling,
	querySelector: (selector) => doc.querySelector(selector),
	setScopeId(el, id) {
		el.setAttribute(id, "");
	},
	insertStaticContent(content, parent, anchor, namespace, start, end) {
		const before = anchor ? anchor.previousSibling : parent.lastChild;
		if (start && (start === end || start.nextSibling)) while (true) {
			parent.insertBefore(start.cloneNode(true), anchor);
			if (start === end || !(start = start.nextSibling)) break;
		}
		else {
			templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);
			const template = templateContainer.content;
			if (namespace === "svg" || namespace === "mathml") {
				const wrapper = template.firstChild;
				while (wrapper.firstChild) template.appendChild(wrapper.firstChild);
				template.removeChild(wrapper);
			}
			parent.insertBefore(template, anchor);
		}
		return [before ? before.nextSibling : parent.firstChild, anchor ? anchor.previousSibling : parent.lastChild];
	}
};
var vtcKey = /* @__PURE__ */ Symbol("_vtc");
function patchClass(el, value, isSVG) {
	const transitionClasses = el[vtcKey];
	if (transitionClasses) value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
	if (value == null) el.removeAttribute("class");
	else if (isSVG) el.setAttribute("class", value);
	else el.className = value;
}
var vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
var vShowHidden = /* @__PURE__ */ Symbol("_vsh");
var CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
var displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
	const style = el.style;
	const isCssString = isString(next);
	let hasControlledDisplay = false;
	if (next && !isCssString) {
		if (prev) if (!isString(prev)) {
			for (const key in prev) if (next[key] == null) setStyle(style, key, "");
		} else for (const prevStyle of prev.split(";")) {
			const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
			if (next[key] == null) setStyle(style, key, "");
		}
		for (const key in next) {
			if (key === "display") hasControlledDisplay = true;
			const value = next[key];
			if (value != null) {
				if (!shouldPreserveTextareaResizeStyle(el, key, !isString(prev) && prev ? prev[key] : void 0, value)) setStyle(style, key, value);
			} else setStyle(style, key, "");
		}
	} else if (isCssString) {
		if (prev !== next) {
			const cssVarText = style[CSS_VAR_TEXT];
			if (cssVarText) next += ";" + cssVarText;
			style.cssText = next;
			hasControlledDisplay = displayRE.test(next);
		}
	} else if (prev) el.removeAttribute("style");
	if (vShowOriginalDisplay in el) {
		el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
		if (el[vShowHidden]) style.display = "none";
	}
}
var importantRE = /\s*!important$/;
function setStyle(style, name, val) {
	if (isArray(val)) val.forEach((v) => setStyle(style, name, v));
	else {
		if (val == null) val = "";
		if (name.startsWith("--")) style.setProperty(name, val);
		else {
			const prefixed = autoPrefix(style, name);
			if (importantRE.test(val)) style.setProperty(hyphenate(prefixed), val.replace(importantRE, ""), "important");
			else style[prefixed] = val;
		}
	}
}
var prefixes = [
	"Webkit",
	"Moz",
	"ms"
];
var prefixCache = {};
function autoPrefix(style, rawName) {
	const cached = prefixCache[rawName];
	if (cached) return cached;
	let name = camelize(rawName);
	if (name !== "filter" && name in style) return prefixCache[rawName] = name;
	name = capitalize(name);
	for (let i = 0; i < prefixes.length; i++) {
		const prefixed = prefixes[i] + name;
		if (prefixed in style) return prefixCache[rawName] = prefixed;
	}
	return rawName;
}
function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
	return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString(next) && prev === next;
}
var xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
	if (isSVG && key.startsWith("xlink:")) if (value == null) el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
	else el.setAttributeNS(xlinkNS, key, value);
	else if (value == null || isBoolean && !includeBooleanAttr(value)) el.removeAttribute(key);
	else el.setAttribute(key, isBoolean ? "" : isSymbol(value) ? String(value) : value);
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
	if (key === "innerHTML" || key === "textContent") {
		if (value != null) el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
		return;
	}
	const tag = el.tagName;
	if (key === "value" && tag !== "PROGRESS" && !tag.includes("-")) {
		const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
		const newValue = value == null ? el.type === "checkbox" ? "on" : "" : String(value);
		if (oldValue !== newValue || !("_value" in el)) el.value = newValue;
		if (value == null) el.removeAttribute(key);
		el._value = value;
		return;
	}
	let needRemove = false;
	if (value === "" || value == null) {
		const type = typeof el[key];
		if (type === "boolean") value = includeBooleanAttr(value);
		else if (value == null && type === "string") {
			value = "";
			needRemove = true;
		} else if (type === "number") {
			value = 0;
			needRemove = true;
		}
	}
	try {
		el[key] = value;
	} catch (e) {}
	needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
	el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
	el.removeEventListener(event, handler, options);
}
var veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
	const invokers = el[veiKey] || (el[veiKey] = {});
	const existingInvoker = invokers[rawName];
	if (nextValue && existingInvoker) existingInvoker.value = nextValue;
	else {
		const [name, options] = parseName(rawName);
		if (nextValue) addEventListener(el, name, invokers[rawName] = createInvoker(nextValue, instance), options);
		else if (existingInvoker) {
			removeEventListener(el, name, existingInvoker, options);
			invokers[rawName] = void 0;
		}
	}
}
var optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
	let options;
	if (optionsModifierRE.test(name)) {
		options = {};
		let m;
		while (m = name.match(optionsModifierRE)) {
			name = name.slice(0, name.length - m[0].length);
			options[m[0].toLowerCase()] = true;
		}
	}
	return [name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2)), options];
}
var cachedNow = 0;
var p = /* @__PURE__ */ Promise.resolve();
var getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
	const invoker = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= invoker.attached) return;
		const value = invoker.value;
		if (isArray(value)) {
			const originalStop = e.stopImmediatePropagation;
			e.stopImmediatePropagation = () => {
				originalStop.call(e);
				e._stopped = true;
			};
			const handlers = value.slice();
			const args = [e];
			for (let i = 0; i < handlers.length; i++) {
				if (e._stopped) break;
				const handler = handlers[i];
				if (handler) callWithAsyncErrorHandling(handler, instance, 5, args);
			}
		} else callWithAsyncErrorHandling(value, instance, 5, [e]);
	};
	invoker.value = initialValue;
	invoker.attached = getNow();
	return invoker;
}
var isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
var patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
	const isSVG = namespace === "svg";
	if (key === "class") patchClass(el, nextValue, isSVG);
	else if (key === "style") patchStyle(el, prevValue, nextValue);
	else if (isOn(key)) {
		if (!isModelListener(key)) patchEvent(el, key, prevValue, nextValue, parentComponent);
	} else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
		patchDOMProp(el, key, nextValue);
		if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
	} else if (el._isVueCE && (shouldSetAsPropForVueCE(el, key) || el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString(nextValue)))) patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
	else {
		if (key === "true-value") el._trueValue = nextValue;
		else if (key === "false-value") el._falseValue = nextValue;
		patchAttr(el, key, nextValue, isSVG);
	}
};
function shouldSetAsProp(el, key, value, isSVG) {
	if (isSVG) {
		if (key === "innerHTML" || key === "textContent") return true;
		if (key in el && isNativeOn(key) && isFunction(value)) return true;
		return false;
	}
	if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") return false;
	if (key === "sandbox" && el.tagName === "IFRAME") return false;
	if (key === "form") return false;
	if (key === "list" && el.tagName === "INPUT") return false;
	if (key === "type" && el.tagName === "TEXTAREA") return false;
	if (key === "width" || key === "height") {
		const tag = el.tagName;
		if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") return false;
	}
	if (isNativeOn(key) && isString(value)) return false;
	return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
	const props = el._def.props;
	if (!props) return false;
	const camelKey = camelize(key);
	return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
}
var getModelAssigner = (vnode) => {
	const fn = vnode.props["onUpdate:modelValue"] || false;
	return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
	e.target.composing = true;
}
function onCompositionEnd(e) {
	const target = e.target;
	if (target.composing) {
		target.composing = false;
		target.dispatchEvent(new Event("input"));
	}
}
var assignKey = /* @__PURE__ */ Symbol("_assign");
function castValue(value, trim, number) {
	if (trim) value = value.trim();
	if (number) value = looseToNumber(value);
	return value;
}
var vModelText = {
	created(el, { modifiers: { lazy, trim, number } }, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		const castToNumber = number || vnode.props && vnode.props.type === "number";
		addEventListener(el, lazy ? "change" : "input", (e) => {
			if (e.target.composing) return;
			el[assignKey](castValue(el.value, trim, castToNumber));
		});
		if (trim || castToNumber) addEventListener(el, "change", () => {
			el.value = castValue(el.value, trim, castToNumber);
		});
		if (!lazy) {
			addEventListener(el, "compositionstart", onCompositionStart);
			addEventListener(el, "compositionend", onCompositionEnd);
			addEventListener(el, "change", onCompositionEnd);
		}
	},
	mounted(el, { value }) {
		el.value = value == null ? "" : value;
	},
	beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim, number } }, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		if (el.composing) return;
		const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
		const newValue = value == null ? "" : value;
		if (elValue === newValue) return;
		const rootNode = el.getRootNode();
		if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
			if (lazy && value === oldValue) return;
			if (trim && el.value.trim() === newValue) return;
		}
		el.value = newValue;
	}
};
var systemModifiers = [
	"ctrl",
	"shift",
	"alt",
	"meta"
];
var modifierGuards = {
	stop: (e) => e.stopPropagation(),
	prevent: (e) => e.preventDefault(),
	self: (e) => e.target !== e.currentTarget,
	ctrl: (e) => !e.ctrlKey,
	shift: (e) => !e.shiftKey,
	alt: (e) => !e.altKey,
	meta: (e) => !e.metaKey,
	left: (e) => "button" in e && e.button !== 0,
	middle: (e) => "button" in e && e.button !== 1,
	right: (e) => "button" in e && e.button !== 2,
	exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
var withModifiers = (fn, modifiers) => {
	if (!fn) return fn;
	const cache = fn._withMods || (fn._withMods = {});
	const cacheKey = modifiers.join(".");
	return cache[cacheKey] || (cache[cacheKey] = ((event, ...args) => {
		for (let i = 0; i < modifiers.length; i++) {
			const guard = modifierGuards[modifiers[i]];
			if (guard && guard(event, modifiers)) return;
		}
		return fn(event, ...args);
	}));
};
var keyNames = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
};
var withKeys = (fn, modifiers) => {
	const cache = fn._withKeys || (fn._withKeys = {});
	const cacheKey = modifiers.join(".");
	return cache[cacheKey] || (cache[cacheKey] = ((event) => {
		if (!("key" in event)) return;
		const eventKey = hyphenate(event.key);
		if (modifiers.some((k) => k === eventKey || keyNames[k] === eventKey)) return fn(event);
	}));
};
var rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
var renderer;
function ensureRenderer() {
	return renderer || (renderer = createRenderer(rendererOptions));
}
var createApp = ((...args) => {
	const app = ensureRenderer().createApp(...args);
	const { mount } = app;
	app.mount = (containerOrSelector) => {
		const container = normalizeContainer(containerOrSelector);
		if (!container) return;
		const component = app._component;
		if (!isFunction(component) && !component.render && !component.template) component.template = container.innerHTML;
		if (container.nodeType === 1) container.textContent = "";
		const proxy = mount(container, false, resolveRootNamespace(container));
		if (container instanceof Element) {
			container.removeAttribute("v-cloak");
			container.setAttribute("data-v-app", "");
		}
		return proxy;
	};
	return app;
});
function resolveRootNamespace(container) {
	if (container instanceof SVGElement) return "svg";
	if (typeof MathMLElement === "function" && container instanceof MathMLElement) return "mathml";
}
function normalizeContainer(container) {
	if (isString(container)) return document.querySelector(container);
	return container;
}
//#endregion
//#region apps/calculator/src/components/TreeSearch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "tree-search" };
var _hoisted_2$5 = { class: "search-input-container" };
var _hoisted_3$5 = ["placeholder", "aria-label"];
var TreeSearch_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "TreeSearch",
	props: { modelValue: { default: "" } },
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const i18n = I18nManager.getInstance();
		const searchQuery = /* @__PURE__ */ ref(props.modelValue);
		const placeholder = computed(() => {
			return i18n.t("ui.searchGoods") || "Search products...";
		});
		function handleInput() {
			emit("update:modelValue", searchQuery.value);
		}
		function clearSearch() {
			searchQuery.value = "";
			emit("update:modelValue", "");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$5, [createBaseVNode("div", _hoisted_2$5, [
				_cache[1] || (_cache[1] = createBaseVNode("span", { class: "search-icon" }, "🔍", -1)),
				withDirectives(createBaseVNode("input", {
					id: "tree-search",
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchQuery.value = $event),
					type: "text",
					class: "search-input",
					placeholder: placeholder.value,
					"aria-label": placeholder.value,
					onInput: handleInput
				}, null, 40, _hoisted_3$5), [[vModelText, searchQuery.value]]),
				searchQuery.value ? (openBlock(), createElementBlock("button", {
					key: 0,
					class: "clear-button",
					onClick: clearSearch,
					"aria-label": "検索をクリア"
				}, " ✕ ")) : createCommentVNode("v-if", true)
			])]);
		};
	}
});
//#endregion
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region apps/calculator/src/components/TreeSearch.vue
var TreeSearch_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TreeSearch_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-89115f36"]]);
//#endregion
//#region apps/calculator/src/components/TreeItem.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = [
	"data-good-id",
	"aria-label",
	"aria-selected",
	"onKeydown"
];
var _hoisted_2$4 = { class: "tree-item-icon" };
var _hoisted_3$4 = ["src", "alt"];
var _hoisted_4$4 = { class: "tree-item-content" };
var _hoisted_5$4 = { class: "tree-item-name" };
var _hoisted_6$4 = {
	key: 0,
	class: "tree-item-tags"
};
//#endregion
//#region apps/calculator/src/components/TreeItem.vue
var TreeItem_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "TreeItem",
	props: {
		good: {},
		selected: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		showTags: {
			type: Boolean,
			default: false
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const i18n = I18nManager.getInstance();
		const displayName = computed(() => {
			return i18n.t(`goods.${props.good.id}`) || props.good.displayName;
		});
		const iconSrc = computed(() => `/calculator/icons/${props.good.icon}.png`);
		function handleClick() {
			if (!props.disabled) emit("select", props.good);
		}
		function handleImageError(event) {
			const img = event.target;
			img.style.display = "none";
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["tree-item", {
					selected: __props.selected,
					disabled: __props.disabled
				}]),
				"data-good-id": __props.good.id,
				onClick: handleClick,
				role: "button",
				"aria-label": displayName.value,
				"aria-selected": __props.selected,
				tabindex: "0",
				onKeydown: [withKeys(handleClick, ["enter"]), withKeys(withModifiers(handleClick, ["prevent"]), ["space"])]
			}, [createBaseVNode("div", _hoisted_2$4, [createBaseVNode("img", {
				src: iconSrc.value,
				alt: displayName.value,
				class: "good-icon",
				onError: handleImageError
			}, null, 40, _hoisted_3$4)]), createBaseVNode("div", _hoisted_4$4, [createBaseVNode("span", _hoisted_5$4, toDisplayString(displayName.value), 1), __props.showTags ? (openBlock(), createElementBlock("span", _hoisted_6$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.good.tags, (tag) => {
				return openBlock(), createElementBlock("span", {
					key: tag,
					class: "tag"
				}, toDisplayString(tag), 1);
			}), 128))])) : createCommentVNode("v-if", true)])], 42, _hoisted_1$4);
		};
	}
}), [["__scopeId", "data-v-9ab57aeb"]]);
//#endregion
//#region apps/calculator/src/components/TreeCategory.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = ["data-category"];
var _hoisted_2$3 = [
	"aria-expanded",
	"aria-label",
	"onKeydown"
];
var _hoisted_3$3 = { class: "category-icon" };
var _hoisted_4$3 = { class: "category-name" };
var _hoisted_5$3 = { class: "category-count" };
var _hoisted_6$3 = { class: "expand-icon" };
var _hoisted_7$3 = {
	key: 0,
	class: "category-items"
};
//#endregion
//#region apps/calculator/src/components/TreeCategory.vue
var TreeCategory_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "TreeCategory",
	props: {
		category: {},
		goods: {},
		expanded: { type: Boolean },
		selectedId: {}
	},
	emits: ["toggle", "select-item"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const i18n = I18nManager.getInstance();
		const currentLocale = /* @__PURE__ */ ref(i18n.getLocale());
		const categoryName = computed(() => {
			currentLocale.value;
			const locale = i18n.getLocale();
			return props.category.name[locale] || props.category.name.en;
		});
		onMounted(() => {
			i18n.onChange(() => {
				currentLocale.value = i18n.getLocale();
			});
		});
		function toggleExpand() {
			emit("toggle");
		}
		function handleSelectItem(good) {
			emit("select-item", good);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["tree-category", { expanded: __props.expanded }]),
				"data-category": __props.category.id
			}, [createBaseVNode("div", {
				class: "tree-category-header",
				onClick: toggleExpand,
				role: "button",
				"aria-expanded": __props.expanded,
				"aria-label": `${categoryName.value} カテゴリ`,
				tabindex: "0",
				onKeydown: [withKeys(toggleExpand, ["enter"]), withKeys(withModifiers(toggleExpand, ["prevent"]), ["space"])]
			}, [
				createBaseVNode("span", _hoisted_3$3, toDisplayString(__props.category.icon), 1),
				createBaseVNode("span", _hoisted_4$3, toDisplayString(categoryName.value), 1),
				createBaseVNode("span", _hoisted_5$3, "(" + toDisplayString(__props.goods.length) + ")", 1),
				createBaseVNode("span", _hoisted_6$3, toDisplayString(__props.expanded ? "▼" : "▶"), 1)
			], 40, _hoisted_2$3), __props.expanded ? (openBlock(), createElementBlock("div", _hoisted_7$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.goods, (good) => {
				return openBlock(), createBlock(TreeItem_default, {
					key: good.id,
					good,
					selected: good.id === __props.selectedId,
					"show-tags": false,
					onSelect: handleSelectItem
				}, null, 8, ["good", "selected"]);
			}), 128))])) : createCommentVNode("v-if", true)], 10, _hoisted_1$3);
		};
	}
}), [["__scopeId", "data-v-9a26c6e3"]]);
//#endregion
//#region apps/calculator/src/components/GoodsTreeView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "goods-tree-view" };
var _hoisted_2$2 = { class: "tree-content" };
var _hoisted_3$2 = {
	key: 0,
	class: "tree-categories"
};
var _hoisted_4$2 = { class: "no-results" };
var _hoisted_5$2 = {
	key: 2,
	class: "recent-section"
};
var _hoisted_6$2 = { class: "recent-header" };
var _hoisted_7$2 = { class: "recent-title" };
var _hoisted_8$2 = { class: "recent-list" };
var STORAGE_KEY_EXPANDED = "anno117_tree_expanded_categories";
var STORAGE_KEY_RECENT = "anno117_tree_recent_goods";
var MAX_RECENT_ITEMS = 5;
//#endregion
//#region apps/calculator/src/components/GoodsTreeView.vue
var GoodsTreeView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "GoodsTreeView",
	props: {
		goods: {},
		selectedId: {}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const i18n = I18nManager.getInstance();
		const searchQuery = /* @__PURE__ */ ref("");
		const expandedCategories = /* @__PURE__ */ ref(/* @__PURE__ */ new Set());
		const recentGoods = /* @__PURE__ */ ref([]);
		const categories = /* @__PURE__ */ ref([]);
		onMounted(async () => {
			try {
				categories.value = (await (await fetch(`/calculator/data/categories.json`)).json()).categories.sort((a, b) => a.order - b.order);
				console.log("[GoodsTreeView] Loaded", categories.value.length, "categories");
			} catch (error) {
				console.error("[GoodsTreeView] Failed to load categories:", error);
			}
			loadExpandedState();
			loadRecentGoods();
		});
		const categorizedGoods = computed(() => {
			const grouped = /* @__PURE__ */ new Map();
			for (const good of props.goods) {
				const categoryId = good.category || "luxury";
				if (!grouped.has(categoryId)) grouped.set(categoryId, []);
				grouped.get(categoryId).push(good);
			}
			return categories.value.map((category) => ({
				category,
				goods: grouped.get(category.id) || []
			})).filter((item) => item.goods.length > 0);
		});
		const filteredCategories = computed(() => {
			if (!searchQuery.value.trim()) return categorizedGoods.value;
			const query = searchQuery.value.toLowerCase();
			return categorizedGoods.value.map((item) => {
				const filteredGoods = item.goods.filter((good) => {
					const nameEn = good.displayName.toLowerCase();
					const nameJa = i18n.t(`goods.${good.id}`).toLowerCase();
					const id = good.id.toLowerCase();
					const tags = (good.tags || []).join(" ").toLowerCase();
					return nameEn.includes(query) || nameJa.includes(query) || id.includes(query) || tags.includes(query);
				});
				return {
					category: item.category,
					goods: filteredGoods
				};
			}).filter((item) => item.goods.length > 0);
		});
		function toggleCategory(categoryId) {
			if (expandedCategories.value.has(categoryId)) expandedCategories.value.delete(categoryId);
			else expandedCategories.value.add(categoryId);
			saveExpandedState();
		}
		function handleSelectItem(good) {
			emit("select", good);
			addToRecent(good);
		}
		function addToRecent(good) {
			recentGoods.value = [good, ...recentGoods.value.filter((g) => g.id !== good.id)].slice(0, MAX_RECENT_ITEMS);
			saveRecentGoods();
		}
		function saveExpandedState() {
			const expanded = Array.from(expandedCategories.value);
			localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(expanded));
		}
		function loadExpandedState() {
			try {
				const saved = localStorage.getItem(STORAGE_KEY_EXPANDED);
				if (saved) {
					const expanded = JSON.parse(saved);
					expandedCategories.value = new Set(expanded);
				}
			} catch (error) {
				console.error("[GoodsTreeView] Failed to load expanded state:", error);
			}
		}
		function saveRecentGoods() {
			const recentIds = recentGoods.value.map((g) => g.id);
			localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentIds));
		}
		function loadRecentGoods() {
			try {
				const saved = localStorage.getItem(STORAGE_KEY_RECENT);
				if (saved) recentGoods.value = JSON.parse(saved).map((id) => props.goods.find((g) => g.id === id)).filter(Boolean);
			} catch (error) {
				console.error("[GoodsTreeView] Failed to load recent goods:", error);
			}
		}
		watch(searchQuery, (newQuery) => {
			if (newQuery.trim()) filteredCategories.value.forEach((item) => {
				expandedCategories.value.add(item.category.id);
			});
		});
		const noResultsText = computed(() => {
			return i18n.t("ui.noResults") || "検索結果がありません";
		});
		const recentTitle = computed(() => {
			return i18n.t("ui.recentlyViewed") || "最近表示";
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$2, [
				createCommentVNode(" 検索 "),
				createVNode(TreeSearch_default, {
					modelValue: searchQuery.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchQuery.value = $event)
				}, null, 8, ["modelValue"]),
				createCommentVNode(" ツリー本体 "),
				createBaseVNode("div", _hoisted_2$2, [
					createCommentVNode(" カテゴリとアイテム "),
					filteredCategories.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_3$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(filteredCategories.value, (cat) => {
						return openBlock(), createBlock(TreeCategory_default, {
							key: cat.category.id,
							category: cat.category,
							goods: cat.goods,
							expanded: expandedCategories.value.has(cat.category.id),
							"selected-id": __props.selectedId,
							onToggle: ($event) => toggleCategory(cat.category.id),
							onSelectItem: handleSelectItem
						}, null, 8, [
							"category",
							"goods",
							"expanded",
							"selected-id",
							"onToggle"
						]);
					}), 128))])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createCommentVNode(" 検索結果なし "), createBaseVNode("div", _hoisted_4$2, [createBaseVNode("p", null, toDisplayString(noResultsText.value), 1)])], 2112)),
					createCommentVNode(" 最近表示した商品 "),
					recentGoods.value.length > 0 && !searchQuery.value ? (openBlock(), createElementBlock("div", _hoisted_5$2, [createBaseVNode("div", _hoisted_6$2, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "recent-icon" }, "🕒", -1)), createBaseVNode("span", _hoisted_7$2, toDisplayString(recentTitle.value), 1)]), createBaseVNode("div", _hoisted_8$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(recentGoods.value, (good) => {
						return openBlock(), createBlock(TreeItem_default, {
							key: good.id,
							good,
							selected: good.id === __props.selectedId,
							onSelect: handleSelectItem
						}, null, 8, ["good", "selected"]);
					}), 128))])])) : createCommentVNode("v-if", true)
				])
			]);
		};
	}
}), [["__scopeId", "data-v-9e5864d1"]]);
//#endregion
//#region apps/calculator/src/components/TreeAppRoot.vue
var TreeAppRoot_default = /* @__PURE__ */ defineComponent({
	__name: "TreeAppRoot",
	props: {
		initialGoods: {},
		initialSelectedId: {},
		onSelect: { type: Function }
	},
	setup(__props, { expose: __expose }) {
		const props = __props;
		const goodsRef = /* @__PURE__ */ ref(props.initialGoods);
		const selectedIdRef = /* @__PURE__ */ ref(props.initialSelectedId);
		function updateGoods(goods) {
			goodsRef.value = goods;
			console.log("[TreeAppRoot] Goods updated:", goods.length, "items");
		}
		function updateSelection(selectedId) {
			selectedIdRef.value = selectedId;
			console.log("[TreeAppRoot] Selection updated:", selectedId);
		}
		function handleSelect(good) {
			props.onSelect(good);
		}
		__expose({
			updateGoods,
			updateSelection
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(GoodsTreeView_default, {
				goods: goodsRef.value,
				selectedId: selectedIdRef.value,
				onSelect: handleSelect
			}, null, 8, ["goods", "selectedId"]);
		};
	}
});
//#endregion
//#region apps/calculator/src/ts/tree-app.ts
/**
* Vueベースのツリービューアプリケーション
* 既存のApp.tsと共存し、機能フラグで切り替え可能
*
* TreeAppRoot.vueラッパーコンポーネントを使用し、
* defineExposeされたメソッド経由でリアクティブに状態を更新
*/
var TreeApp = class {
	app = null;
	rootInstance = null;
	config;
	constructor(config) {
		this.config = config;
	}
	mount() {
		if (this.app) {
			console.warn("[TreeApp] Already mounted");
			return;
		}
		this.app = createApp(TreeAppRoot_default, {
			initialGoods: this.config.goods,
			initialSelectedId: this.config.selectedId,
			onSelect: this.config.onSelect
		});
		this.rootInstance = this.app.mount(this.config.container);
		console.log("[TreeApp] Mounted successfully with", this.config.goods.length, "goods");
	}
	unmount() {
		if (!this.app) {
			console.warn("[TreeApp] Not mounted");
			return;
		}
		this.app.unmount();
		this.app = null;
		this.rootInstance = null;
		console.log("[TreeApp] Unmounted successfully");
	}
	updateGoods(goods) {
		this.config.goods = goods;
		if (this.rootInstance && typeof this.rootInstance.updateGoods === "function") {
			this.rootInstance.updateGoods(goods);
			console.log("[TreeApp] Updated goods:", goods.length, "items");
		} else console.warn("[TreeApp] Cannot update goods: not mounted or method not exposed");
	}
	updateSelection(selectedId) {
		this.config.selectedId = selectedId;
		if (this.rootInstance && typeof this.rootInstance.updateSelection === "function") this.rootInstance.updateSelection(selectedId);
		else console.warn("[TreeApp] Cannot update selection: not mounted or method not exposed");
	}
};
//#endregion
//#region apps/calculator/src/components/LanguageToggle.vue
var LanguageToggle_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "LanguageToggle",
	setup(__props) {
		const i18nManager = I18nManager.getInstance();
		const settingsManager = SettingsManager.getInstance();
		const buttonText = /* @__PURE__ */ ref("EN");
		/**
		* ボタンテキストを更新
		*/
		const updateButtonText = (locale) => {
			buttonText.value = locale === "en" ? "EN" : "日本語";
		};
		/**
		* 言語を切り替え
		*/
		const toggleLanguage = async () => {
			const nextLocale = i18nManager.getLocale() === "en" ? "ja" : "en";
			await i18nManager.setLocale(nextLocale);
			settingsManager.setSettingValue("language", nextLocale);
			updateButtonText(nextLocale);
			const url = new URL(window.location.href);
			url.searchParams.set("lang", nextLocale);
			window.history.pushState({}, "", url.toString());
		};
		/**
		* 初期化
		*/
		onMounted(() => {
			updateButtonText(i18nManager.getLocale());
			i18nManager.onChange(() => {
				updateButtonText(i18nManager.getLocale());
			});
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("button", {
				id: "language-toggle-btn",
				class: "language-toggle-btn",
				"aria-label": "Toggle Language",
				onClick: toggleLanguage
			}, toDisplayString(buttonText.value), 1);
		};
	}
}), [["__scopeId", "data-v-7a584209"]]);
//#endregion
//#region apps/calculator/src/components/SettingsPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "saved-store-header" };
var _hoisted_2$1 = {
	id: "saved-store-content",
	class: "saved-store-content"
};
var _hoisted_3$1 = { class: "saved-store-section" };
var _hoisted_4$1 = { class: "setting-description" };
var _hoisted_5$1 = { class: "preset-save-row" };
var _hoisted_6$1 = ["placeholder"];
var _hoisted_7$1 = { class: "preset-list" };
var _hoisted_8$1 = {
	key: 0,
	class: "preset-empty"
};
var _hoisted_9 = ["data-preset-id"];
var _hoisted_10 = { class: "preset-meta" };
var _hoisted_11 = { class: "preset-actions" };
var _hoisted_12 = ["onClick"];
var _hoisted_13 = ["onClick"];
var _hoisted_14 = { class: "saved-store-section" };
var _hoisted_15 = { class: "active-toggle-list" };
var _hoisted_16 = {
	key: 0,
	class: "preset-empty"
};
var _hoisted_17 = ["src", "alt"];
//#endregion
//#region apps/calculator/src/components/SettingsPanel.vue
var SettingsPanel_default = /* @__PURE__ */ defineComponent({
	__name: "SettingsPanel",
	props: { isOpen: { type: Boolean } },
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const i18n = I18nManager.getInstance();
		const settingsManager = SettingsManager.getInstance();
		const modifierRegistry = ModifierRegistry.getInstance();
		const iconsPath = "/calculator/icons/";
		const $t = (key) => {
			return i18n.t(key);
		};
		const presetName = /* @__PURE__ */ ref("");
		const presets = /* @__PURE__ */ ref([]);
		const activeToggles = /* @__PURE__ */ ref([]);
		const updatePresets = () => {
			presets.value = settingsManager.getPresets();
		};
		const updateActiveToggles = () => {
			activeToggles.value = modifierRegistry.getDefinitions().flatMap((modifier) => modifier.toggles ?? []).filter((toggle) => settingsManager.getSetting(toggle.key));
		};
		const formatDate = (timestamp) => {
			const date = new Date(timestamp);
			return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit"
			})}`;
		};
		const handleClose = () => {
			console.log("[SettingsPanel] Close button clicked");
			emit("close");
			console.log("[SettingsPanel] Close event emitted");
		};
		const handleOverlayClick = () => {
			console.log("[SettingsPanel] Overlay clicked");
			emit("close");
			console.log("[SettingsPanel] Close event emitted (from overlay)");
		};
		const handleSavePreset = () => {
			if (presetName.value.trim()) {
				settingsManager.saveCurrentAsPreset(presetName.value);
				presetName.value = "";
				updatePresets();
			}
		};
		const handleLoadPreset = (id) => {
			settingsManager.loadPreset(id);
			updateActiveToggles();
		};
		const handleDeletePreset = (id) => {
			settingsManager.deletePreset(id);
			updatePresets();
		};
		const onSettingsChange = () => {
			console.log("[SettingsPanel] Settings changed");
			updateActiveToggles();
			updatePresets();
		};
		let unsubscribe = null;
		onMounted(() => {
			console.log("[SettingsPanel] Mounted");
			updatePresets();
			updateActiveToggles();
			unsubscribe = settingsManager.onChange(onSettingsChange);
		});
		onUnmounted(() => {
			console.log("[SettingsPanel] Unmounted");
			if (unsubscribe) unsubscribe();
		});
		watch(() => props.isOpen, (newValue) => {
			if (newValue) {
				updatePresets();
				updateActiveToggles();
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("div", {
					id: "saved-store-panel",
					class: normalizeClass(["saved-store-panel", { "hidden": !__props.isOpen }])
				}, [createBaseVNode("div", _hoisted_1$1, [createBaseVNode("h2", null, toDisplayString($t("ui.storage")), 1), createBaseVNode("button", {
					id: "saved-store-close",
					class: "saved-store-close",
					"aria-label": "Close Storage",
					onClick: handleClose
				}, " × ")]), createBaseVNode("div", _hoisted_2$1, [
					createCommentVNode(" Saved Configurations Section "),
					createBaseVNode("section", _hoisted_3$1, [
						createBaseVNode("h3", null, toDisplayString($t("ui.savedConfigurations")), 1),
						createBaseVNode("p", _hoisted_4$1, toDisplayString($t("ui.savedConfigurationsDesc")), 1),
						createBaseVNode("div", _hoisted_5$1, [withDirectives(createBaseVNode("input", {
							id: "preset-name-input",
							type: "text",
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => presetName.value = $event),
							placeholder: $t("ui.presetNamePlaceholder"),
							maxlength: "40",
							onKeyup: withKeys(handleSavePreset, ["enter"])
						}, null, 40, _hoisted_6$1), [[vModelText, presetName.value]]), createBaseVNode("button", {
							id: "save-current-preset-btn",
							type: "button",
							onClick: handleSavePreset
						}, toDisplayString($t("ui.saveCurrent")), 1)]),
						createBaseVNode("ul", _hoisted_7$1, [presets.value.length === 0 ? (openBlock(), createElementBlock("li", _hoisted_8$1, toDisplayString($t("ui.noSavedConfigurations")), 1)) : createCommentVNode("v-if", true), (openBlock(true), createElementBlock(Fragment, null, renderList(presets.value, (preset) => {
							return openBlock(), createElementBlock("li", {
								key: preset.id,
								class: "preset-item",
								"data-preset-id": preset.id
							}, [createBaseVNode("div", _hoisted_10, [createBaseVNode("strong", null, toDisplayString(preset.name), 1), createBaseVNode("span", null, toDisplayString(formatDate(preset.createdAt)), 1)]), createBaseVNode("div", _hoisted_11, [createBaseVNode("button", {
								type: "button",
								class: "preset-load-btn",
								onClick: ($event) => handleLoadPreset(preset.id)
							}, toDisplayString($t("ui.load")), 9, _hoisted_12), createBaseVNode("button", {
								type: "button",
								class: "preset-delete-btn",
								onClick: ($event) => handleDeletePreset(preset.id)
							}, toDisplayString($t("ui.delete")), 9, _hoisted_13)])], 8, _hoisted_9);
						}), 128))])
					]),
					createCommentVNode(" Current Modifier Setup Section "),
					createBaseVNode("section", _hoisted_14, [createBaseVNode("h3", null, toDisplayString($t("ui.currentModifierSetup")), 1), createBaseVNode("ul", _hoisted_15, [activeToggles.value.length === 0 ? (openBlock(), createElementBlock("li", _hoisted_16, toDisplayString($t("ui.noActiveModifiers")), 1)) : createCommentVNode("v-if", true), (openBlock(true), createElementBlock(Fragment, null, renderList(activeToggles.value, (toggle) => {
						return openBlock(), createElementBlock("li", { key: toggle.key }, [createBaseVNode("img", {
							src: `${iconsPath}${toggle.icon}`,
							alt: toggle.label
						}, null, 8, _hoisted_17), createBaseVNode("span", null, toDisplayString($t(`modifiers.${toggle.key}`)), 1)]);
					}), 128))])])
				])], 2),
				createCommentVNode(" Overlay "),
				createBaseVNode("div", {
					id: "settings-overlay",
					class: normalizeClass(["settings-overlay", { "active": __props.isOpen }]),
					onClick: handleOverlayClick
				}, null, 2)
			], 64);
		};
	}
});
//#endregion
//#region apps/calculator/src/components/SettingsPanelRoot.vue
var SettingsPanelRoot_default = /* @__PURE__ */ defineComponent({
	__name: "SettingsPanelRoot",
	setup(__props) {
		const isOpen = /* @__PURE__ */ ref(false);
		const openPanel = () => {
			console.log("[SettingsPanelRoot] Opening panel");
			isOpen.value = true;
			console.log("[SettingsPanelRoot] isOpen =", isOpen.value);
		};
		const closePanel = () => {
			console.log("[SettingsPanelRoot] Closing panel");
			isOpen.value = false;
			console.log("[SettingsPanelRoot] isOpen =", isOpen.value);
		};
		onMounted(() => {
			const handleOpenPanel = () => {
				openPanel();
			};
			window.addEventListener("openSettingsPanel", handleOpenPanel);
			return () => {
				window.removeEventListener("openSettingsPanel", handleOpenPanel);
			};
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(SettingsPanel_default, {
				isOpen: isOpen.value,
				onClose: closePanel
			}, null, 8, ["isOpen"]);
		};
	}
});
//#endregion
//#region apps/calculator/src/components/ModifierPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "modifier-panel" };
var _hoisted_2 = { class: "modifier-panel-title" };
var _hoisted_3 = { class: "modifier-sections" };
var _hoisted_4 = { class: "modifier-section-header" };
var _hoisted_5 = { class: "modifier-toggles" };
var _hoisted_6 = ["onClick"];
var _hoisted_7 = ["src", "alt"];
var _hoisted_8 = { class: "toggle-label" };
//#endregion
//#region apps/calculator/src/components/ModifierPanel.vue
var ModifierPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ModifierPanel",
	setup(__props) {
		const i18n = I18nManager.getInstance();
		const modifierRegistry = ModifierRegistry.getInstance();
		const settingsManager = SettingsManager.getInstance();
		const iconsPath = "/calculator/icons/";
		const $t = (key, fallback) => {
			const result = i18n.t(key);
			const subKey = key.split(".").slice(1).join(".");
			if ((result === key || result === subKey) && fallback) return fallback;
			return result;
		};
		const modifiers = /* @__PURE__ */ ref([]);
		const activeToggles = /* @__PURE__ */ ref(/* @__PURE__ */ new Set());
		const loadModifiers = () => {
			try {
				modifiers.value = modifierRegistry.getDefinitions();
				console.log("[ModifierPanel] Loaded modifiers:", modifiers.value.map((m) => ({
					id: m.id,
					toggleCount: m.toggles?.length ?? 0
				})));
				const allToggles = modifiers.value.flatMap((m) => m.toggles ?? []);
				activeToggles.value = new Set(allToggles.filter((t) => settingsManager.getSetting(t.key)).map((t) => t.key));
			} catch (error) {
				console.error("[ModifierPanel] Error loading modifiers:", error);
				modifiers.value = [];
				activeToggles.value = /* @__PURE__ */ new Set();
			}
		};
		const isActive = (key) => {
			return activeToggles.value.has(key);
		};
		const handleToggle = (key) => {
			const currentValue = settingsManager.getSetting(key);
			settingsManager.setSetting(key, !currentValue);
			if (activeToggles.value.has(key)) activeToggles.value.delete(key);
			else activeToggles.value.add(key);
			activeToggles.value = new Set(activeToggles.value);
			console.log(`[ModifierPanel] Toggled ${key} to ${!currentValue}`);
		};
		let unsubscribeRegistry = null;
		onMounted(() => {
			console.log("[ModifierPanel] Mounted");
			loadModifiers();
			settingsManager.onChange(() => {
				loadModifiers();
			});
			unsubscribeRegistry = modifierRegistry.onDefinitionsChanged(() => {
				console.log("[ModifierPanel] Definitions changed (activeChainId updated), reloading modifiers");
				loadModifiers();
			});
		});
		onUnmounted(() => {
			console.log("[ModifierPanel] Unmounted");
			if (unsubscribeRegistry) unsubscribeRegistry();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("h3", _hoisted_2, toDisplayString($t("ui.modifierSettings")), 1), createBaseVNode("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(modifiers.value, (modifier) => {
				return openBlock(), createElementBlock("div", {
					key: modifier.id,
					class: "modifier-section"
				}, [createBaseVNode("div", _hoisted_4, [createBaseVNode("h4", null, toDisplayString($t(`modifiers.${modifier.id}`, modifier.label)), 1)]), createBaseVNode("div", _hoisted_5, [(openBlock(true), createElementBlock(Fragment, null, renderList(modifier.toggles, (toggle) => {
					return openBlock(), createElementBlock("button", {
						key: toggle.key,
						class: normalizeClass(["modifier-toggle-btn", { active: isActive(toggle.key) }]),
						onClick: ($event) => handleToggle(toggle.key)
					}, [toggle.icon ? (openBlock(), createElementBlock("img", {
						key: 0,
						src: `${iconsPath}${toggle.icon}`,
						alt: toggle.label,
						class: "toggle-icon"
					}, null, 8, _hoisted_7)) : createCommentVNode("v-if", true), createBaseVNode("span", _hoisted_8, toDisplayString($t(`modifiers.${toggle.key}`, toggle.label)), 1)], 10, _hoisted_6);
				}), 128))])]);
			}), 128))])]);
		};
	}
}), [["__scopeId", "data-v-5008e8e4"]]);
//#endregion
//#region apps/calculator/src/ts/vue-app.ts
/**
* Vueアプリケーションのエントリーポイント
* 段階的にVueコンポーネントを既存のアプリケーションに統合する
*/
/**
* Vueコンポーネントを初期化
*/
function initVueComponents() {
	const languageToggleElement = document.getElementById("language-toggle-btn");
	if (languageToggleElement) {
		const parent = languageToggleElement.parentElement;
		if (parent) {
			const container = document.createElement("div");
			container.id = "language-toggle-container";
			parent.replaceChild(container, languageToggleElement);
			createApp(LanguageToggle_default).mount("#language-toggle-container");
			console.log("[Vue] LanguageToggle component mounted");
		}
	}
}
/**
* 設定パネルをVueコンポーネントとして初期化
*/
function initSettingsPanel() {
	const modifierContainer = document.getElementById("modifier-container");
	if (!modifierContainer) {
		console.warn("[Vue] #modifier-container not found, falling back to body");
		const settingsPanelContainer = document.createElement("div");
		settingsPanelContainer.id = "settings-panel-vue";
		document.body.appendChild(settingsPanelContainer);
		const app = createApp(SettingsPanelRoot_default);
		app.mount(settingsPanelContainer);
		return app;
	}
	const settingsPanelContainer = document.createElement("div");
	settingsPanelContainer.id = "settings-panel-vue";
	modifierContainer.appendChild(settingsPanelContainer);
	const app = createApp(SettingsPanelRoot_default);
	app.mount(settingsPanelContainer);
	const toggleButton = document.getElementById("saved-store-toggle");
	if (toggleButton) toggleButton.addEventListener("click", () => {
		window.dispatchEvent(new Event("openSettingsPanel"));
	});
	console.log("[Vue] SettingsPanel component mounted");
	return app;
}
/**
* 右パネルにModifierPanelをマウント
*/
function initModifierPanel() {
	const modifierContainer = document.getElementById("modifier-container");
	if (!modifierContainer) {
		console.warn("[Vue] #modifier-container not found");
		return;
	}
	const app = createApp(ModifierPanel_default);
	app.mount(modifierContainer);
	console.log("[Vue] ModifierPanel component mounted");
	return app;
}
//#endregion
//#region apps/calculator/src/ts/modules/App.ts
var ParameterParser = class ParameterParser {
	static PARAMS = {
		GOOD: "good",
		REGION: "region",
		ITEMS: "items",
		LANG: "lang"
	};
	static RESERVED = Object.values(ParameterParser.PARAMS);
	/** Extract app state from the current URL. */
	static parse(url) {
		const items = (url.searchParams.get(ParameterParser.PARAMS.ITEMS) ?? "").split("~").map((entry) => entry.trim()).filter(Boolean);
		const langParam = url.searchParams.get(ParameterParser.PARAMS.LANG);
		const lang = langParam === "ja" || langParam === "en" ? langParam : void 0;
		return {
			good: url.searchParams.get(ParameterParser.PARAMS.GOOD) ?? void 0,
			region: url.searchParams.get(ParameterParser.PARAMS.REGION) ?? void 0,
			items,
			lang
		};
	}
	/** Build a URL that reflects the given app state, preserving unrelated params. */
	static create(state, base = new URL(window.location.href)) {
		const url = new URL(base.href);
		if (state.region) url.searchParams.set(ParameterParser.PARAMS.REGION, state.region);
		else url.searchParams.delete(ParameterParser.PARAMS.REGION);
		if (state.good) url.searchParams.set(ParameterParser.PARAMS.GOOD, state.good);
		else url.searchParams.delete(ParameterParser.PARAMS.GOOD);
		if (state.items && state.items.length) url.searchParams.set(ParameterParser.PARAMS.ITEMS, state.items.join("~"));
		else url.searchParams.delete(ParameterParser.PARAMS.ITEMS);
		if (state.lang) url.searchParams.set(ParameterParser.PARAMS.LANG, state.lang);
		else url.searchParams.delete(ParameterParser.PARAMS.LANG);
		return url;
	}
	/** Any query params not managed by this parser (pass-through preservation). */
	static parseExtras(url) {
		const extras = {};
		url.searchParams.forEach((value, key) => {
			if (!ParameterParser.RESERVED.includes(key)) extras[key] = value;
		});
		return extras;
	}
};
var App = class App {
	static _instance = null;
	static getInstance() {
		if (!App._instance) App._instance = new App();
		return App._instance;
	}
	goodsRepository;
	settingsManager;
	i18nManager;
	selectionContainer;
	calculatorContainer;
	productionView;
	treeApp;
	currentGood = null;
	currentRegion = "Roman";
	allGoods = [];
	constructor() {
		this.goodsRepository = GoodsRepository.getInstance();
		this.settingsManager = SettingsManager.getInstance();
		this.i18nManager = I18nManager.getInstance();
		this.selectionContainer = document.getElementById("selection-container");
		this.calculatorContainer = document.getElementById("calculator-container");
		this.productionView = new ProductionChainView({
			container: this.calculatorContainer,
			calculator: ProductionCalculator.getInstance(),
			graphRenderer: GraphRenderer.getInstance()
		});
		this.productionView.setBackHandler(() => this.showSelectionView());
		this.selectionContainer.innerHTML = "";
		this.treeApp = new TreeApp({
			container: this.selectionContainer,
			goods: [],
			selectedId: void 0,
			onSelect: (good) => this.handleGoodSelection(good)
		});
		initSettingsPanel();
		initModifierPanel();
	}
	async initialize() {
		this.registerServiceWorker();
		const url = new URL(window.location.href);
		const state = ParameterParser.parse(url);
		const storedLang = this.settingsManager.getSettingRaw("language");
		const initialLang = state.lang || storedLang || "en";
		await this.i18nManager.init(initialLang);
		this.settingsManager.init();
		if (initialLang !== storedLang) this.settingsManager.setSettingValue("language", initialLang);
		this.settingsManager.onChange(() => this.handleSettingsChange());
		this.i18nManager.onChange(() => this.handleLanguageChange());
		this.bindRegionToggle();
		await this.loadGoodsList();
		this.restoreFromUrl();
	}
	async handleLanguageChange() {
		this.allGoods = this.goodsRepository.getGoodsList();
		this.updateGoodsList();
		if (this.currentGood) {
			const updatedGood = this.allGoods.find((g) => g.id === this.currentGood.id);
			if (updatedGood) await this.handleGoodSelection(updatedGood);
		} else this.showSelectionView();
	}
	bindRegionToggle() {
		const toggleBtn = document.getElementById("region-toggle-btn");
		const icon = toggleBtn?.querySelector(".region-icon");
		const text = toggleBtn?.querySelector(".region-text");
		const updateButtonState = (region) => {
			if (icon) icon.src = region === "Roman" ? "${ASSETS_ICONS_PATH}latium.webp" : "${ASSETS_ICONS_PATH}albion.webp";
			if (text) text.textContent = region === "Roman" ? "Latium" : "Albion";
		};
		const setRegion = (region) => {
			if (this.currentRegion === region) return;
			this.currentRegion = region;
			updateButtonState(region);
			this.pushUrl();
			this.updateGoodsList();
			if (this.currentGood) this.handleGoodSelection(this.currentGood, { preserveRate: true });
		};
		toggleBtn?.addEventListener("click", () => {
			setRegion(this.currentRegion === "Roman" ? "Celtic" : "Roman");
		});
		updateButtonState(this.currentRegion);
	}
	registerServiceWorker() {
		if (!("serviceWorker" in navigator)) return;
		window.addEventListener("load", () => {
			navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => setInterval(() => registration.update(), 6e4)).catch((error) => console.error("[SW] Registration failed:", error));
		});
	}
	async loadGoodsList() {
		try {
			this.allGoods = await this.goodsRepository.loadGoodsList();
			try {
				await this.goodsRepository.loadItemCompatibility();
				await this.goodsRepository.preloadItemProductivity();
			} catch (error) {
				console.warn("[App] Failed to preload item modifier data", error);
			}
			const filtered = this.allGoods.filter((good) => {
				if (good.startOfChain) return true;
				if (!good.regions?.length) return false;
				return good.regions.includes(this.currentRegion);
			});
			this.treeApp.mount();
			this.treeApp.updateGoods(filtered);
			console.log("[App] TreeApp mounted with", filtered.length, "goods");
		} catch (error) {
			console.error("Error loading goods list:", error);
			this.selectionContainer.innerHTML = "<div class=\"error-message\" style=\"padding: 2rem; text-align: center; color: #721c24;\">Error loading goods list. Please try again later.</div>";
		}
	}
	updateGoodsList() {
		const filtered = this.allGoods.filter((good) => {
			if (good.startOfChain) return true;
			if (!good.regions?.length) return false;
			return good.regions.includes(this.currentRegion);
		});
		this.treeApp.updateGoods(filtered);
	}
	async handleGoodSelection(good, options = {}) {
		this.currentGood = good;
		Item.setActiveChain(good.id);
		this.pushUrl();
		this.productionView.showLoading(good);
		try {
			const recipe = await this.goodsRepository.loadProductionChain(good.id, this.currentRegion);
			if (recipe) await this.productionView.showChain(good, recipe, { preserveRate: Boolean(options.preserveRate) });
			else this.productionView.showBasicInfo(good);
		} catch (error) {
			console.error(`Failed to load production data for ${good.id}`, error);
			this.productionView.showBasicInfo(good);
		}
	}
	showSelectionView() {
		this.currentGood = null;
		Item.setActiveChain(null);
		this.pushUrl();
		this.calculatorContainer.innerHTML = `<p class="info-note">${this.i18nManager.t("ui.selectGoodPrompt")}</p>`;
	}
	handleSettingsChange() {
		if (this.productionView.hasSelection()) this.productionView.applySettingsToCurrentView();
		this.pushUrl();
	}
	restoreFromUrl() {
		const url = new URL(window.location.href);
		const state = ParameterParser.parse(url);
		if (state.region) {
			const region = state.region.charAt(0).toUpperCase() + state.region.slice(1).toLowerCase();
			if (region === "Roman" || region === "Celtic") {
				this.currentRegion = region;
				const toggleBtn = document.getElementById("region-toggle-btn");
				const icon = toggleBtn?.querySelector(".region-icon");
				const text = toggleBtn?.querySelector(".region-text");
				if (icon) icon.src = region === "Roman" ? "${ASSETS_ICONS_PATH}latium.webp" : "${ASSETS_ICONS_PATH}albion.webp";
				if (text) text.textContent = region === "Roman" ? "Latium" : "Albion";
			}
		}
		if (state.good) {
			const good = this.goodsRepository.getGoodsList().find((item) => item.id === state.good);
			if (good) {
				this.applyItemsFromUrl(good.id, state.items ?? []);
				this.handleGoodSelection(good);
			} else this.showSelectionView();
		} else this.showSelectionView();
	}
	pushUrl() {
		const activeItems = this.getActiveItemsForCurrentChain();
		const url = ParameterParser.create({
			good: this.currentGood?.id,
			region: this.currentRegion.toLowerCase(),
			items: activeItems,
			lang: this.i18nManager.getLocale()
		});
		window.history.pushState({
			good: this.currentGood?.id,
			region: this.currentRegion,
			lang: this.i18nManager.getLocale()
		}, "", url);
	}
	applyItemsFromUrl(chainId, guids) {
		if (!guids.length) return;
		const urlGuids = new Set(guids);
		const compatibleItems = this.goodsRepository.getCompatibleItems(chainId);
		for (const item of compatibleItems) {
			const key = Item.getItemSettingKey(chainId, item.guid);
			this.settingsManager.setSettingValue(key, urlGuids.has(item.guid));
		}
	}
	getActiveItemsForCurrentChain() {
		if (!this.currentGood) return [];
		const settings = this.settingsManager.getConfig();
		return Item.getActiveGuidsForChain(settings, this.currentGood.id);
	}
};
//#endregion
//#region apps/calculator/src/ts/modules/modifier/Aqueduct.ts
var Aqueduct = class Aqueduct extends AbstractProductionModifier {
	static KEYS = {
		enabled: "aqueduct.enabled",
		fieldIrrigation: "aqueduct.fieldIrrigation",
		aquaArborica: "aqueduct.aquaArborica",
		hushing: "aqueduct.hushing"
	};
	config;
	constructor() {
		super("aqueduct");
		this.config = {
			field_irrigation: false,
			aqua_arborica: false,
			hushing: false
		};
	}
	loadConfig() {
		this.config = URLTools.fromGetParam(this.configKey, window.location.search, {
			field_irrigation: false,
			aqua_arborica: false,
			hushing: false
		});
	}
	saveConfig() {
		const param = URLTools.toGetParam(this.config);
		const url = new URL(window.location.href);
		if (param === "") url.searchParams.delete(this.configKey);
		else url.searchParams.set(this.configKey, param);
		window.history.replaceState(null, "", url.toString());
	}
	getType() {
		return "flat";
	}
	getDefinition() {
		return {
			id: "aqueduct",
			label: "Aqueducts",
			description: "Water infrastructure boosts for farms, plantations, and mines.",
			icon: "aquaduct.png",
			toggles: [
				{
					key: Aqueduct.KEYS.enabled,
					label: "Aqueduct Network",
					description: "Master switch for all aqueduct boosts.",
					icon: "aquaduct.png"
				},
				{
					key: Aqueduct.KEYS.fieldIrrigation,
					label: "Field Irrigation",
					description: "Arable Farms get +50% productivity.",
					icon: "skill-feldbewaesserung.png",
					requires: Aqueduct.KEYS.enabled
				},
				{
					key: Aqueduct.KEYS.aquaArborica,
					label: "Aqua Arborica",
					description: "Plantations get +50% productivity.",
					icon: "skill-aqua-arborica.png",
					requires: Aqueduct.KEYS.enabled
				},
				{
					key: Aqueduct.KEYS.hushing,
					label: "Hushing",
					description: "Mines get +50% productivity.",
					icon: "skill-hydraulischer-bergbau.png",
					requires: Aqueduct.KEYS.enabled
				}
			]
		};
	}
	getValue(good) {
		switch (good.type) {
			case "arable_farm": return this.config.field_irrigation ? .5 : 0;
			case "plantation": return this.config.aqua_arborica ? .5 : 0;
			case "mine": return this.config.hushing ? .5 : 0;
			default: return 0;
		}
	}
	/** Sync config from SettingsManager and persist to URL. */
	applySettings(config) {
		const enabled = this.readSetting(config, Aqueduct.KEYS.enabled, "aqueductsEnabled");
		this.config = {
			field_irrigation: enabled && this.readSetting(config, Aqueduct.KEYS.fieldIrrigation, "fieldIrrigation"),
			aqua_arborica: enabled && this.readSetting(config, Aqueduct.KEYS.aquaArborica, "aquaArborica"),
			hushing: enabled && this.readSetting(config, Aqueduct.KEYS.hushing, "hushing")
		};
		this.saveConfig();
	}
	getVisualModifier() {
		return "aquaduct.png";
	}
	readSetting(config, key, legacyKey) {
		if (typeof config[key] === "boolean") return Boolean(config[key]);
		if (legacyKey && typeof config[legacyKey] === "boolean") return Boolean(config[legacyKey]);
		return false;
	}
};
function registerAqueductModifier() {
	ModifierRegistry.getInstance().register(new Aqueduct());
}
//#endregion
//#region apps/calculator/src/ts/modules/PanelResizer.ts
/**
* パネルリサイズ機能
* 左右パネルの境界をドラッグして幅を変更可能にする
*/
var PanelResizer = class PanelResizer {
	static _instance = null;
	static getInstance() {
		if (!PanelResizer._instance) PanelResizer._instance = new PanelResizer();
		return PanelResizer._instance;
	}
	resizeHandle = null;
	isResizing = false;
	startX = 0;
	startWidth = 0;
	minWidth = 250;
	maxWidth = 600;
	constructor() {
		this.init();
	}
	init() {
		this.resizeHandle = document.getElementById("resize-handle");
		if (!this.resizeHandle) return;
		const rootStyles = getComputedStyle(document.documentElement);
		const minWidthStr = rootStyles.getPropertyValue("--left-panel-min-width").trim();
		const maxWidthStr = rootStyles.getPropertyValue("--left-panel-max-width").trim();
		if (minWidthStr) this.minWidth = parseInt(minWidthStr);
		if (maxWidthStr) this.maxWidth = parseInt(maxWidthStr);
		this.resizeHandle.addEventListener("mousedown", this.handleMouseDown.bind(this));
		document.addEventListener("mousemove", this.handleMouseMove.bind(this));
		document.addEventListener("mouseup", this.handleMouseUp.bind(this));
		this.resizeHandle.addEventListener("touchstart", this.handleTouchStart.bind(this));
		document.addEventListener("touchmove", this.handleTouchMove.bind(this));
		document.addEventListener("touchend", this.handleTouchEnd.bind(this));
	}
	handleMouseDown(e) {
		e.preventDefault();
		this.startResize(e.clientX);
	}
	handleTouchStart(e) {
		if (e.touches.length === 1) this.startResize(e.touches[0].clientX);
	}
	startResize(clientX) {
		this.isResizing = true;
		this.startX = clientX;
		const currentWidth = getComputedStyle(document.documentElement).getPropertyValue("--left-panel-width").trim();
		this.startWidth = parseInt(currentWidth) || 400;
		if (this.resizeHandle) this.resizeHandle.classList.add("resizing");
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}
	handleMouseMove(e) {
		if (!this.isResizing) return;
		this.resize(e.clientX);
	}
	handleTouchMove(e) {
		if (!this.isResizing || e.touches.length !== 1) return;
		e.preventDefault();
		this.resize(e.touches[0].clientX);
	}
	resize(clientX) {
		const delta = clientX - this.startX;
		let newWidth = this.startWidth + delta;
		newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
		document.documentElement.style.setProperty("--left-panel-width", `${newWidth}px`);
	}
	handleMouseUp() {
		if (!this.isResizing) return;
		this.endResize();
	}
	handleTouchEnd() {
		if (!this.isResizing) return;
		this.endResize();
	}
	endResize() {
		this.isResizing = false;
		if (this.resizeHandle) this.resizeHandle.classList.remove("resizing");
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
		const currentWidth = getComputedStyle(document.documentElement).getPropertyValue("--left-panel-width").trim();
		try {
			localStorage.setItem("anno117_left_panel_width", currentWidth);
		} catch (error) {
			console.warn("[PanelResizer] Failed to save panel width", error);
		}
	}
	/**
	* 保存された幅を復元
	*/
	restoreSavedWidth() {
		try {
			const savedWidth = localStorage.getItem("anno117_left_panel_width");
			if (savedWidth) {
				const width = parseInt(savedWidth);
				if (width >= this.minWidth && width <= this.maxWidth) document.documentElement.style.setProperty("--left-panel-width", savedWidth);
			}
		} catch (error) {
			console.warn("[PanelResizer] Failed to restore panel width", error);
		}
	}
};
//#endregion
//#region apps/calculator/src/ts/entry.ts
document.addEventListener("DOMContentLoaded", async () => {
	registerAqueductModifier();
	registerItemModifier();
	await App.getInstance().initialize();
	initVueComponents();
	PanelResizer.getInstance().restoreSavedWidth();
});
//#endregion

//# sourceMappingURL=index-ZCWToDib.js.map