<template>
  <div :class="['tree-category', { expanded }]" :data-category="category.id">
    <div
      class="tree-category-header"
      @click="toggleExpand"
      role="button"
      :aria-expanded="expanded"
      :aria-label="`${categoryName} カテゴリ`"
      tabindex="0"
      @keydown.enter="toggleExpand"
      @keydown.space.prevent="toggleExpand"
    >
      <span class="category-icon">{{ category.icon }}</span>
      <span class="category-name">{{ categoryName }}</span>
      <span class="category-count">({{ goods.length }})</span>
      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
    </div>
    <div v-if="expanded" class="category-items">
      <TreeItem
        v-for="good in goods"
        :key="good.id"
        :good="good"
        :selected="good.id === selectedId"
        :show-tags="false"
        @select="handleSelectItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import TreeItem from './TreeItem.vue';
import { I18nManager } from '@anno/shared';

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

interface Props {
  category: Category;
  goods: RecipeListItem[];
  expanded: boolean;
  selectedId?: string;
}

interface Emits {
  (e: 'toggle'): void;
  (e: 'select-item', good: RecipeListItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const i18n = I18nManager.getInstance();

// 言語切り替えに対応するためref化
const currentLocale = ref(i18n.getLocale());

const categoryName = computed(() => {
  // currentLocaleを参照することでリアクティブに
  const _ = currentLocale.value;
  const locale = i18n.getLocale();
  return props.category.name[locale] || props.category.name.en;
});

// 言語変更リスナーを登録
onMounted(() => {
  i18n.onChange(() => {
    currentLocale.value = i18n.getLocale();
  });
});

function toggleExpand() {
  emit('toggle');
}

function handleSelectItem(good: RecipeListItem) {
  emit('select-item', good);
}
</script>

<style scoped>
.tree-category {
  margin-bottom: 4px;
}

.tree-category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  min-height: 48px;
  user-select: none;
}

.tree-category-header:hover {
  background-color: var(--background-accent);
}

.tree-category-header:focus {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}

.category-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-count {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: normal;
}

.expand-icon {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.tree-category.expanded .expand-icon {
  transform: rotate(0deg);
}

.category-items {
  padding-left: 16px;
  margin-top: 4px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* タッチデバイス対応 */
@media (hover: none) {
  .tree-category-header {
    min-height: 52px;
  }
}
</style>
