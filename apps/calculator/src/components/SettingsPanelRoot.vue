<template>
  <SettingsPanel :isOpen="isOpen" @close="closePanel" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SettingsPanel from './SettingsPanel.vue';

const isOpen = ref(false);

const openPanel = () => {
  console.log('[SettingsPanelRoot] Opening panel');
  isOpen.value = true;
  console.log('[SettingsPanelRoot] isOpen =', isOpen.value);
};

const closePanel = () => {
  console.log('[SettingsPanelRoot] Closing panel');
  isOpen.value = false;
  console.log('[SettingsPanelRoot] isOpen =', isOpen.value);
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
