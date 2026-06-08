<template>
  <div
    id="saved-store-panel"
    class="saved-store-panel"
    :class="{ 'hidden': !isOpen }"
  >
    <div class="saved-store-header">
      <h2>{{ $t('ui.storage') }}</h2>
      <button
        id="saved-store-close"
        class="saved-store-close"
        aria-label="Close Storage"
        @click="handleClose"
      >
        ×
      </button>
    </div>
    <div id="saved-store-content" class="saved-store-content">
      <!-- Saved Configurations Section -->
      <section class="saved-store-section">
        <h3>{{ $t('ui.savedConfigurations') }}</h3>
        <p class="setting-description">
          {{ $t('ui.savedConfigurationsDesc') }}
        </p>
        <div class="preset-save-row">
          <input
            id="preset-name-input"
            type="text"
            v-model="presetName"
            :placeholder="$t('ui.presetNamePlaceholder')"
            maxlength="40"
            @keyup.enter="handleSavePreset"
          />
          <button
            id="save-current-preset-btn"
            type="button"
            @click="handleSavePreset"
          >
            {{ $t('ui.saveCurrent') }}
          </button>
        </div>
        <ul class="preset-list">
          <li
            v-if="presets.length === 0"
            class="preset-empty"
          >
            {{ $t('ui.noSavedConfigurations') }}
          </li>
          <li
            v-for="preset in presets"
            :key="preset.id"
            class="preset-item"
            :data-preset-id="preset.id"
          >
            <div class="preset-meta">
              <strong>{{ preset.name }}</strong>
              <span>{{ formatDate(preset.createdAt) }}</span>
            </div>
            <div class="preset-actions">
              <button
                type="button"
                class="preset-load-btn"
                @click="handleLoadPreset(preset.id)"
              >
                {{ $t('ui.load') }}
              </button>
              <button
                type="button"
                class="preset-delete-btn"
                @click="handleDeletePreset(preset.id)"
              >
                {{ $t('ui.delete') }}
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Current Modifier Setup Section -->
      <section class="saved-store-section">
        <h3>{{ $t('ui.currentModifierSetup') }}</h3>
        <ul class="active-toggle-list">
          <li
            v-if="activeToggles.length === 0"
            class="preset-empty"
          >
            {{ $t('ui.noActiveModifiers') }}
          </li>
          <li v-for="toggle in activeToggles" :key="toggle.key">
            <img
              :src="`./assets/icons/${toggle.icon}`"
              :alt="toggle.label"
            />
            <span>{{ toggle.label }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>

  <!-- Overlay -->
  <div
    id="settings-overlay"
    class="settings-overlay"
    :class="{ 'active': isOpen }"
    @click="handleOverlayClick"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { I18nManager } from '../i18n/I18nManager';
import { SettingsManager } from '../ts/modules/SettingsManager';
import { ModifierRegistry } from '../ts/modules/ModifierRegistry';

interface SavedPreset {
  id: string;
  name: string;
  createdAt: number;
  config: Record<string, boolean | number | string>;
}

interface ModifierToggle {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const i18n = I18nManager.getInstance();
const settingsManager = SettingsManager.getInstance();
const modifierRegistry = ModifierRegistry.getInstance();

// 翻訳ヘルパー関数
const $t = (key: string): string => {
  return i18n.t(key);
};

// 状態管理
const presetName = ref('');
const presets = ref<SavedPreset[]>([]);
const activeToggles = ref<ModifierToggle[]>([]);

// プリセット一覧を更新
const updatePresets = () => {
  presets.value = settingsManager.getPresets();
};

// アクティブな設定を更新
const updateActiveToggles = () => {
  const allToggles = modifierRegistry
    .getDefinitions()
    .flatMap((modifier) => modifier.toggles ?? []);

  activeToggles.value = allToggles.filter((toggle) =>
    settingsManager.getSetting(toggle.key)
  );
};

// 日付フォーマット
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// イベントハンドラ
const handleClose = () => {
  console.log('[SettingsPanel] Close button clicked');
  emit('close');
  console.log('[SettingsPanel] Close event emitted');
};

const handleOverlayClick = () => {
  console.log('[SettingsPanel] Overlay clicked');
  emit('close');
  console.log('[SettingsPanel] Close event emitted (from overlay)');
};

const handleSavePreset = () => {
  if (presetName.value.trim()) {
    settingsManager.saveCurrentAsPreset(presetName.value);
    presetName.value = '';
    updatePresets();
  }
};

const handleLoadPreset = (id: string) => {
  settingsManager.loadPreset(id);
  updateActiveToggles();
};

const handleDeletePreset = (id: string) => {
  settingsManager.deletePreset(id);
  updatePresets();
};

// 設定変更を監視
const onSettingsChange = () => {
  console.log('[SettingsPanel] Settings changed');
  updateActiveToggles();
  updatePresets();
};

let unsubscribe: (() => void) | null = null;

// 初期化
onMounted(() => {
  console.log('[SettingsPanel] Mounted');
  updatePresets();
  updateActiveToggles();

  // SettingsManagerの変更を監視
  unsubscribe = settingsManager.onChange(onSettingsChange);
});

// クリーンアップ
import { onUnmounted } from 'vue';
onUnmounted(() => {
  console.log('[SettingsPanel] Unmounted');
  if (unsubscribe) {
    unsubscribe();
  }
});

// isOpenの変化を監視して状態を更新
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    updatePresets();
    updateActiveToggles();
  }
});
</script>
