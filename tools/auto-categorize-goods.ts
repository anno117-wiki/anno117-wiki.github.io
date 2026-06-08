#!/usr/bin/env bun

/**
 * 商品自動分類ツール
 *
 * 目的:
 * - docs/assets/productions/list.json の各商品にcategory/tags/complexityメタデータを追加
 * - src/data/categories.json を自動生成
 *
 * 実行方法:
 * bun run tools/auto-categorize-goods.ts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

// ============================================================================
// 型定義
// ============================================================================

interface RecipeListItem {
    displayName: string;
    id: string;
    icon: string;
    regions: string[];
    files: Record<string, string>;
    startOfChain?: boolean;
    category?: string;
    tags?: string[];
    complexity?: number;
}

interface GoodsList {
    README: string;
    generated: string;
    count: number;
    goods: RecipeListItem[];
}

interface Category {
    id: string;
    icon: string;
    name: { en: string; ja: string };
    order: number;
    description: { en: string; ja: string };
}

interface CategoriesData {
    version: string;
    categories: Category[];
}

interface Goods {
    id: string;
    inputs?: Array<{ id: string; rate: number }>;
    time?: number;
}

// ============================================================================
// カテゴリ分類ルール
// ============================================================================

const categoryKeywords: Record<string, string[]> = {
    luxury: [
        'glass', 'mirror', 'necklace', 'brooches', 'lyres', 'lounger',
        'mosaics', 'handmirror', 'standing_lyre', 'writing_tablet'
    ],
    food: [
        'bread', 'wine', 'beer', 'cheese', 'garum', 'aspic', 'porridge',
        'sausages', 'cockles', 'eels', 'oyster', 'sardine', 'roast',
        'bird_tongues', 'amphorae', 'drinking_horn'
    ],
    clothing: [
        'togas', 'tunics', 'sandals', 'cloaks', 'pileus', 'trousers',
        'fur_hats', 'wigs', 'shoes', 'reed_shoes'
    ],
    military: [
        'weapons', 'armour', 'shields', 'horses', 'chariots', 'clan_shield', 'torcs'
    ],
    construction: [
        'timber', 'concrete', 'tiles', 'marble', 'granite', 'rope',
        'sails', 'wattle', 'soap'
    ]
};

const categoryDefinitions: Category[] = [
    {
        id: 'luxury',
        icon: '🏛️',
        name: { en: 'Luxury Goods', ja: '高級品' },
        order: 1,
        description: {
            en: 'High-end products for wealthy citizens',
            ja: '富裕市民向けの高級製品'
        }
    },
    {
        id: 'food',
        icon: '🍖',
        name: { en: 'Food & Beverages', ja: '食品・飲料' },
        order: 2,
        description: {
            en: 'Consumable goods for sustenance',
            ja: '生活必需品の食料品'
        }
    },
    {
        id: 'clothing',
        icon: '👔',
        name: { en: 'Clothing & Textiles', ja: '衣服・織物' },
        order: 3,
        description: {
            en: 'Garments and fabric products',
            ja: '衣類と布製品'
        }
    },
    {
        id: 'military',
        icon: '⚔️',
        name: { en: 'Military Supplies', ja: '軍事物資' },
        order: 4,
        description: {
            en: 'Equipment for military units',
            ja: '軍事ユニット用装備'
        }
    },
    {
        id: 'construction',
        icon: '🏗️',
        name: { en: 'Construction Materials', ja: '建設資材' },
        order: 5,
        description: {
            en: 'Materials for building structures',
            ja: '建物建設用資材'
        }
    },
    {
        id: 'intermediate',
        icon: '🔧',
        name: { en: 'Intermediate Resources', ja: '中間資源' },
        order: 6,
        description: {
            en: 'Resources used in production chains',
            ja: '生産チェーンで使用される中間資源'
        }
    }
];

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * 商品IDからカテゴリを推定
 */
function inferCategory(good: RecipeListItem): string {
    const id = good.id.toLowerCase();

    // startOfChain（中間資源）は常にintermediate
    if (good.startOfChain) {
        return 'intermediate';
    }

    // キーワードマッチング
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => id.includes(keyword))) {
            return category;
        }
    }

    // デフォルト: luxury（最終製品として扱う）
    return 'luxury';
}

/**
 * タグを生成（地域、Tier推定）
 */
function generateTags(good: RecipeListItem, complexity: number): string[] {
    const tags: string[] = [];

    // 地域タグ
    tags.push(...good.regions.map(r => r.toLowerCase()));

    // Tierタグ（complexityから推定）
    if (complexity >= 4) {
        tags.push('tier3');
    } else if (complexity >= 2) {
        tags.push('tier2');
    } else {
        tags.push('tier1');
    }

    // カテゴリ固有タグ
    const category = good.category || 'luxury';
    if (category === 'food' && good.id.includes('wine')) {
        tags.push('liquid');
    }
    if (category === 'food' && good.id.includes('amphorae')) {
        tags.push('liquid');
    }

    return [...new Set(tags)]; // 重複削除
}

/**
 * 生産チェーンの深さ（complexity）を計算
 * 注: 実際のレシピファイルを読み込む必要があるため、簡易版として
 *     入力数から推定（本実装時は再帰的に計算）
 */
async function calculateComplexity(good: RecipeListItem): Promise<number> {
    try {
        // ローマ地域のレシピファイルを読み込み（存在する場合）
        const regionKey = good.regions.includes('Roman') ? 'roman' : 'celtic';
        const fileName = good.files[regionKey];
        if (!fileName) return 1;

        const recipePath = resolve(__dirname, `../docs/assets/productions/${fileName}.json`);
        const recipeContent = await readFile(recipePath, 'utf-8');
        const recipe: Goods = JSON.parse(recipeContent);

        // 入力数から深さを推定（簡易版）
        if (!recipe.inputs || recipe.inputs.length === 0) {
            return 1; // 基本資源
        }

        // 入力数が多いほど複雑と仮定
        if (recipe.inputs.length >= 3) {
            return 3;
        } else if (recipe.inputs.length >= 2) {
            return 2;
        } else {
            return 1;
        }
    } catch (error) {
        console.warn(`[Complexity] レシピファイル読み込み失敗: ${good.id}, デフォルト値1を使用`);
        return 1;
    }
}

// ============================================================================
// メイン処理
// ============================================================================

async function autoCategorizeGoods() {
    console.log('=== 商品自動分類ツール ===\n');

    // 1. list.jsonを読み込み
    const listPath = resolve(__dirname, '../src/assets/productions/list.json');
    console.log(`[1/4] ${listPath} を読み込み中...`);

    const listContent = await readFile(listPath, 'utf-8');
    const goodsList: GoodsList = JSON.parse(listContent);

    console.log(`      → ${goodsList.goods.length}個の商品を検出\n`);

    // 2. 各商品にメタデータを追加
    console.log('[2/4] メタデータを生成中...');

    let finalProductCount = 0;
    let intermediateCount = 0;
    const categoryCount: Record<string, number> = {};

    for (const good of goodsList.goods) {
        // カテゴリ推定
        good.category = inferCategory(good);

        // 複雑度計算
        good.complexity = await calculateComplexity(good);

        // タグ生成
        good.tags = generateTags(good, good.complexity);

        // 統計
        if (good.startOfChain) {
            intermediateCount++;
        } else {
            finalProductCount++;
        }
        categoryCount[good.category] = (categoryCount[good.category] || 0) + 1;
    }

    console.log(`      → 最終製品: ${finalProductCount}個`);
    console.log(`      → 中間資源: ${intermediateCount}個`);
    console.log(`      → カテゴリ別内訳:`);
    for (const [cat, count] of Object.entries(categoryCount)) {
        console.log(`         - ${cat}: ${count}個`);
    }
    console.log();

    // 3. list.jsonを更新
    console.log('[3/4] list.jsonを更新中...');

    goodsList.generated = new Date().toISOString();
    const updatedListContent = JSON.stringify(goodsList, null, 2);
    await writeFile(listPath, updatedListContent, 'utf-8');

    console.log(`      → ${listPath} を更新完了\n`);

    // 4. categories.jsonを生成
    console.log('[4/4] categories.jsonを生成中...');

    const categoriesData: CategoriesData = {
        version: '1.0.0',
        categories: categoryDefinitions
    };

    // src/assets/dataディレクトリが存在しない場合は作成
    const dataDir = resolve(__dirname, '../src/assets/data');
    try {
        await mkdir(dataDir, { recursive: true });
    } catch (error) {
        // ディレクトリが既に存在する場合は無視
    }

    const categoriesPath = resolve(dataDir, 'categories.json');
    const categoriesContent = JSON.stringify(categoriesData, null, 2);
    await writeFile(categoriesPath, categoriesContent, 'utf-8');

    console.log(`      → ${categoriesPath} を生成完了\n`);

    // 完了メッセージ
    console.log('✅ 自動分類完了!\n');
    console.log('次のステップ:');
    console.log('1. list.json の分類結果を手動レビュー');
    console.log('2. 不適切な分類があれば手動で修正');
    console.log('3. categories.json の内容を確認');
    console.log('4. i18n/locales/*.json にカテゴリ翻訳を追加\n');
}

// スクリプト実行
autoCategorizeGoods().catch(error => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
});
