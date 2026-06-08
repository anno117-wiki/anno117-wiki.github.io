<template>
  <GoodsTreeView
    :goods="goodsRef"
    :selectedId="selectedIdRef"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GoodsTreeView from './GoodsTreeView.vue';
import type { RecipeListItem } from '../ts/types/RecipeList';

interface Props {
  initialGoods: RecipeListItem[];
  initialSelectedId?: string;
  onSelect: (good: RecipeListItem) => void;
}

const props = defineProps<Props>();

// リアクティブな状態
const goodsRef = ref<RecipeListItem[]>(props.initialGoods);
const selectedIdRef = ref<string | undefined>(props.initialSelectedId);

// 外部から更新するためのメソッドを公開
function updateGoods(goods: RecipeListItem[]) {
  goodsRef.value = goods;
  console.log('[TreeAppRoot] Goods updated:', goods.length, 'items');
}

function updateSelection(selectedId: string | undefined) {
  selectedIdRef.value = selectedId;
  console.log('[TreeAppRoot] Selection updated:', selectedId);
}

function handleSelect(good: RecipeListItem) {
  props.onSelect(good);
}

// defineExposeで外部にメソッドを公開
defineExpose({
  updateGoods,
  updateSelection,
});
</script>
