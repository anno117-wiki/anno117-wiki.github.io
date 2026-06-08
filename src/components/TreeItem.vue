<template>
  <div
    :class="['tree-item', { selected, disabled }]"
    :data-good-id="good.id"
    @click="handleClick"
    role="button"
    :aria-label="displayName"
    :aria-selected="selected"
    tabindex="0"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="tree-item-icon">
      <img
        :src="`./assets/icons/${good.icon}.png`"
        :alt="displayName"
        class="good-icon"
        @error="handleImageError"
      />
    </div>
    <div class="tree-item-content">
      <span class="tree-item-name">{{ displayName }}</span>
      <span v-if="showTags" class="tree-item-tags">
        <span v-for="tag in good.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

interface Props {
  good: RecipeListItem;
  selected?: boolean;
  disabled?: boolean;
  showTags?: boolean;
}

interface Emits {
  (e: 'select', good: RecipeListItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  showTags: false
});

const emit = defineEmits<Emits>();

const i18n = I18nManager.getInstance();

const displayName = computed(() => {
  return i18n.t(`goods.${props.good.id}`) || props.good.displayName;
});

function handleClick() {
  if (!props.disabled) {
    emit('select', props.good);
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped>
.tree-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 48px;
  user-select: none;
}

.tree-item:hover {
  background-color: var(--background-accent);
}

.tree-item:focus {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}

.tree-item.selected {
  background-color: var(--theme-color);
  color: var(--background);
}

.tree-item.selected:hover {
  background-color: var(--theme-color-hover);
}

.tree-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.good-icon {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.tree-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.tree-item-name {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-item-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: rgba(95, 3, 46, 0.1);
  color: var(--text-secondary);
}

.tree-item.selected .tag {
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--background);
}

/* タッチデバイス対応 */
@media (hover: none) {
  .tree-item {
    min-height: 52px;
  }
}
</style>
