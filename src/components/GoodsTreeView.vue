<template>
  <div class="goods-tree-view">
    <!-- 検索 -->
    <TreeSearch v-model="searchQuery" />

    <!-- ツリー本体 -->
    <div class="tree-content">
      <!-- カテゴリとアイテム -->
      <div v-if="filteredCategories.length > 0" class="tree-categories">
        <TreeCategory
          v-for="cat in filteredCategories"
          :key="cat.category.id"
          :category="cat.category"
          :goods="cat.goods"
          :expanded="expandedCategories.has(cat.category.id)"
          :selected-id="selectedId"
          @toggle="toggleCategory(cat.category.id)"
          @select-item="handleSelectItem"
        />
      </div>

      <!-- 検索結果なし -->
      <div v-else class="no-results">
        <p>{{ noResultsText }}</p>
      </div>

      <!-- 最近表示した商品 -->
      <div v-if="recentGoods.length > 0 && !searchQuery" class="recent-section">
        <div class="recent-header">
          <span class="recent-icon">🕒</span>
          <span class="recent-title">{{ recentTitle }}</span>
        </div>
        <div class="recent-list">
          <TreeItem
            v-for="good in recentGoods"
            :key="good.id"
            :good="good"
            :selected="good.id === selectedId"
            @select="handleSelectItem"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import TreeSearch from './TreeSearch.vue';
import TreeCategory from './TreeCategory.vue';
import TreeItem from './TreeItem.vue';
import { I18nManager } from '../i18n/I18nManager';

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

interface CategoryWithGoods {
  category: Category;
  goods: RecipeListItem[];
}

interface Props {
  goods: RecipeListItem[];
  selectedId?: string;
}

interface Emits {
  (e: 'select', good: RecipeListItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const i18n = I18nManager.getInstance();

// 状態管理
const searchQuery = ref('');
const expandedCategories = ref<Set<string>>(new Set());
const recentGoods = ref<RecipeListItem[]>([]);
const categories = ref<Category[]>([]);

// ローカルストレージキー
const STORAGE_KEY_EXPANDED = 'anno117_tree_expanded_categories';
const STORAGE_KEY_RECENT = 'anno117_tree_recent_goods';
const MAX_RECENT_ITEMS = 5;

// カテゴリデータの読み込み
onMounted(async () => {
  try {
    // 開発環境・ビルド環境共通: /assets/data/categories.json
    const response = await fetch('/assets/data/categories.json');
    const data: CategoriesData = await response.json();
    categories.value = data.categories.sort((a, b) => a.order - b.order);
    console.log('[GoodsTreeView] Loaded', categories.value.length, 'categories');
  } catch (error) {
    console.error('[GoodsTreeView] Failed to load categories:', error);
  }

  // ローカルストレージから状態を復元
  loadExpandedState();
  loadRecentGoods();
});

// 商品をカテゴリ別にグループ化
const categorizedGoods = computed<CategoryWithGoods[]>(() => {
  const grouped = new Map<string, RecipeListItem[]>();

  // カテゴリごとに商品を分類
  for (const good of props.goods) {
    const categoryId = good.category || 'luxury';
    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, []);
    }
    grouped.get(categoryId)!.push(good);
  }

  // CategoryWithGoodsの配列を作成
  return categories.value.map(category => ({
    category,
    goods: grouped.get(category.id) || []
  })).filter(item => item.goods.length > 0);
});

// 検索フィルタリング
const filteredCategories = computed<CategoryWithGoods[]>(() => {
  if (!searchQuery.value.trim()) {
    return categorizedGoods.value;
  }

  const query = searchQuery.value.toLowerCase();

  return categorizedGoods.value
    .map(item => {
      const filteredGoods = item.goods.filter(good => {
        // 商品名（英語）
        const nameEn = good.displayName.toLowerCase();
        // 商品名（日本語）
        const nameJa = i18n.t(`goods.${good.id}`).toLowerCase();
        // 商品ID
        const id = good.id.toLowerCase();
        // タグ
        const tags = (good.tags || []).join(' ').toLowerCase();

        return nameEn.includes(query) ||
               nameJa.includes(query) ||
               id.includes(query) ||
               tags.includes(query);
      });

      return {
        category: item.category,
        goods: filteredGoods
      };
    })
    .filter(item => item.goods.length > 0);
});

// カテゴリ展開/折り畳み
function toggleCategory(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
  saveExpandedState();
}

// 商品選択
function handleSelectItem(good: RecipeListItem) {
  emit('select', good);
  addToRecent(good);
}

// 最近表示した商品に追加
function addToRecent(good: RecipeListItem) {
  // 既存の同じ商品を削除
  const filtered = recentGoods.value.filter(g => g.id !== good.id);

  // 先頭に追加
  recentGoods.value = [good, ...filtered].slice(0, MAX_RECENT_ITEMS);

  // ローカルストレージに保存
  saveRecentGoods();
}

// ローカルストレージへの保存/読み込み
function saveExpandedState() {
  const expanded = Array.from(expandedCategories.value);
  localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(expanded));
}

function loadExpandedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED);
    if (saved) {
      const expanded = JSON.parse(saved) as string[];
      expandedCategories.value = new Set(expanded);
    }
  } catch (error) {
    console.error('[GoodsTreeView] Failed to load expanded state:', error);
  }
}

function saveRecentGoods() {
  const recentIds = recentGoods.value.map(g => g.id);
  localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentIds));
}

function loadRecentGoods() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECENT);
    if (saved) {
      const recentIds = JSON.parse(saved) as string[];
      recentGoods.value = recentIds
        .map(id => props.goods.find(g => g.id === id))
        .filter(Boolean) as RecipeListItem[];
    }
  } catch (error) {
    console.error('[GoodsTreeView] Failed to load recent goods:', error);
  }
}

// 検索時にすべてのカテゴリを自動展開
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    // 検索結果があるカテゴリをすべて展開
    filteredCategories.value.forEach(item => {
      expandedCategories.value.add(item.category.id);
    });
  }
});

// i18nテキスト
const noResultsText = computed(() => {
  return i18n.t('ui.noResults') || '検索結果がありません';
});

const recentTitle = computed(() => {
  return i18n.t('ui.recentlyViewed') || '最近表示';
});
</script>

<style scoped>
.goods-tree-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background);
  overflow: hidden;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-categories {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.no-results {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.recent-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.recent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.recent-icon {
  font-size: 16px;
}

.recent-title {
  flex: 1;
}

.recent-list {
  margin-top: 4px;
}

/* スクロールバーのスタイル */
.tree-content::-webkit-scrollbar {
  width: 8px;
}

.tree-content::-webkit-scrollbar-track {
  background: var(--background);
}

.tree-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.tree-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
