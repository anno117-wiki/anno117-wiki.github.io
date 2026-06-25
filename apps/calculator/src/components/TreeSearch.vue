<template>
  <div class="tree-search">
    <div class="search-input-container">
      <span class="search-icon">🔍</span>
      <input
        id="tree-search"
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="placeholder"
        :aria-label="placeholder"
        @input="handleInput"
      />
      <button
        v-if="searchQuery"
        class="clear-button"
        @click="clearSearch"
        aria-label="検索をクリア"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { I18nManager } from '@anno/shared';

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

interface Props {
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
});

const emit = defineEmits<Emits>();

const i18n = I18nManager.getInstance();

const searchQuery = ref(props.modelValue);

const placeholder = computed(() => {
  return i18n.t('ui.searchGoods') || 'Search products...';
});

function handleInput() {
  emit('update:modelValue', searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  emit('update:modelValue', '');
}
</script>

<style scoped>
.tree-search {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--background);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.7);
}

.search-input-container:focus-within {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}

.search-icon {
  font-size: 16px;
  color: var(--text-secondary);
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.clear-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.clear-button:hover {
  background-color: var(--background-accent);
  color: var(--text-primary);
}

.clear-button:focus {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}
</style>
