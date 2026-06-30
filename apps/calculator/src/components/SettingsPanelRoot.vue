<template>
  <SettingsPanel :isOpen="isOpen" @close="closePanel" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SettingsPanel from './SettingsPanel.vue';

const isOpen = ref(false);

const openPanel = () => {
  isOpen.value = true;
};

const closePanel = () => {
  isOpen.value = false;
};

// CustomEventでパネル開閉を管理（グローバル汚染を回避）
onMounted(() => {
  const handleOpenPanel = () => {
    openPanel();
  };

  window.addEventListener('openSettingsPanel', handleOpenPanel);

  // クリーンアップ
  return () => {
    window.removeEventListener('openSettingsPanel', handleOpenPanel);
  };
});
</script>
