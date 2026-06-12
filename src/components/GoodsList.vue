<template>
  <div class="goods-list-container">
    <h3>{{ $t('ui.selectGood') }}</h3>

    <!-- 検索ボックス -->
    <div class="search-container">
      <input
        type="text"
        v-model="searchTerm"
        :placeholder="$t('ui.searchGoods')"
        :aria-label="$t('ui.searchGoods')"
        id="goods-search"
      />
    </div>

    <!-- 商品グリッド -->
    <div class="goods-grid-container">
      <div class="goods-grid" id="goods-grid">
        <div
          v-for="good in filteredGoods"
          :key="good.id"
          class="goods-card"
          :class="{ selected: selectedGoodId === good.id }"
          :data-good-id="good.id"
          @click="handleSelect(good)"
        >
          <div class="goods-card-icon">
            <img
              :src="`/icons/${good.icon}.png`"
              :alt="good.displayName"
              loading="lazy"
              @error="handleImageError"
            />
            <div class="icon-placeholder" style="display:none;">
              {{ good.icon.substring(0, 2).toUpperCase() }}
            </div>
          </div>
          <div class="goods-card-name">{{ good.displayName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { I18nManager } from '../i18n/I18nManager';
import type { RecipeListItem } from '../ts/types/RecipeList';

interface Props {
  goods: RecipeListItem[];
}

interface Emits {
  (e: 'select', good: RecipeListItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const i18nManager = I18nManager.getInstance();
const searchTerm = ref<string>('');
const selectedGoodId = ref<string>('');

/**
 * 翻訳ヘルパー関数
 */
const $t = (key: string): string => {
  return i18nManager.t(key);
};

/**
 * フィルタリングされた商品リスト
 */
const filteredGoods = computed(() => {
  if (!searchTerm.value) {
    return props.goods.filter(good => !good.startOfChain);
  }

  const term = searchTerm.value.toLowerCase();
  return props.goods.filter((good) => {
    if (good.startOfChain) return false;
    return (
      good.displayName?.toLowerCase().includes(term) ||
      good.id?.toLowerCase().includes(term)
    );
  });
});

/**
 * 商品選択ハンドラー
 */
const handleSelect = (good: RecipeListItem) => {
  selectedGoodId.value = good.id;
  emit('select', good);
};

/**
 * 画像エラーハンドラー
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img) {
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
};

/**
 * 初期化
 */
onMounted(() => {
  // 言語変更時の再描画リスナー
  i18nManager.onChange(() => {
    // Vueのリアクティブシステムが自動的に再描画
  });
});

/**
 * propsの変更を監視
 */
watch(() => props.goods, () => {
  // 商品リストが更新されたら選択をリセット
  searchTerm.value = '';
});
</script>

<style scoped>
/* Vueコンポーネント用のスタイル（必要に応じて追加） */
/* 既存のCSSがtheme.cssに定義されているため、追加スタイルは最小限に */
</style>
