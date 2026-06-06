/**
 * I18nManager - 多言語対応システムの中核
 * シングルトンパターンで言語切り替えとテキスト翻訳を管理
 */

export type Locale = 'en' | 'ja';

type TranslationData = {
    goods: Record<string, string>;
    ui: Record<string, string>;
    regions: Record<string, string>;
    populationTiers: Record<string, string>;
    modifiers: Record<string, string>;
};

type LocaleChangeListener = (locale: Locale) => void;

export class I18nManager {
    private static _instance: I18nManager | null = null;

    public static getInstance(): I18nManager {
        if (!I18nManager._instance) {
            I18nManager._instance = new I18nManager();
        }
        return I18nManager._instance;
    }

    private currentLocale: Locale;
    private translations: Map<Locale, TranslationData>;
    private listeners: Set<LocaleChangeListener>;
    private loadPromises: Map<Locale, Promise<void>>;

    private constructor() {
        this.currentLocale = 'en';
        this.translations = new Map();
        this.listeners = new Set();
        this.loadPromises = new Map();
    }

    /**
     * 初期化 - 指定された言語の翻訳データを読み込む
     */
    async init(locale: Locale = 'en'): Promise<void> {
        await this.loadLocale(locale);
        this.currentLocale = locale;
    }

    /**
     * 現在の言語を取得
     */
    getLocale(): Locale {
        return this.currentLocale;
    }

    /**
     * 言語を設定（翻訳データを読み込み、リスナーに通知）
     */
    async setLocale(locale: Locale): Promise<void> {
        if (this.currentLocale === locale) return;

        await this.loadLocale(locale);
        this.currentLocale = locale;
        this.notify();
    }

    /**
     * 言語変更時のコールバックを登録
     */
    onChange(callback: LocaleChangeListener): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * 翻訳キーからテキストを取得
     * @param key - ドット記法のキー（例: "ui.selectGood", "goods.amphorae"）
     * @returns 翻訳されたテキスト（キーが見つからない場合は英語フォールバック）
     */
    t(key: string): string {
        const parts = key.split('.');
        if (parts.length !== 2) {
            console.warn(`[I18n] Invalid key format: ${key}`);
            return key;
        }

        const [category, subKey] = parts;
        const data = this.translations.get(this.currentLocale);

        if (!data) {
            console.warn(`[I18n] No translations loaded for locale: ${this.currentLocale}`);
            return this.fallbackTranslation(category, subKey);
        }

        const categoryData = data[category as keyof TranslationData];
        if (!categoryData) {
            console.warn(`[I18n] Unknown category: ${category}`);
            return this.fallbackTranslation(category, subKey);
        }

        const translation = categoryData[subKey];
        if (!translation) {
            console.warn(`[I18n] Missing translation: ${key}`);
            return this.fallbackTranslation(category, subKey);
        }

        return translation;
    }

    /**
     * 英語フォールバック（翻訳が見つからない場合）
     */
    private fallbackTranslation(category: string, subKey: string): string {
        if (this.currentLocale === 'en') {
            // 英語でも見つからない場合はキーをそのまま返す
            return subKey;
        }

        // 英語から取得を試みる
        const enData = this.translations.get('en');
        if (!enData) return subKey;

        const categoryData = enData[category as keyof TranslationData];
        if (!categoryData) return subKey;

        return categoryData[subKey] || subKey;
    }

    /**
     * 翻訳データの読み込み（キャッシュあり）
     */
    private async loadLocale(locale: Locale): Promise<void> {
        // 既に読み込み済みならスキップ
        if (this.translations.has(locale)) {
            return;
        }

        // 読み込み中なら待機
        const existingPromise = this.loadPromises.get(locale);
        if (existingPromise) {
            return existingPromise;
        }

        // 新規読み込み
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
    private async fetchTranslationData(locale: Locale): Promise<void> {
        try {
            const response = await fetch(`./i18n/locales/${locale}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load locale: ${locale} (${response.status})`);
            }
            const data: TranslationData = await response.json();
            this.translations.set(locale, data);
        } catch (error) {
            console.error(`[I18n] Error loading locale ${locale}:`, error);
            // エラー時は空のデータをセット（フォールバックが動作するように）
            this.translations.set(locale, {
                goods: {},
                ui: {},
                regions: {},
                populationTiers: {},
                modifiers: {}
            });
        }
    }

    /**
     * リスナーに変更を通知
     */
    private notify(): void {
        this.listeners.forEach((listener) => listener(this.currentLocale));
    }
}
