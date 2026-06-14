<template>
  <div class="modifier-panel">
    <h3 class="modifier-panel-title">{{ $t('ui.modifierSettings') }}</h3>

    <div class="modifier-sections">
      <div
        v-for="modifier in modifiers"
        :key="modifier.id"
        class="modifier-section"
      >
        <div class="modifier-section-header">
          <h4>{{ $t(`modifiers.${modifier.id}`, modifier.label) }}</h4>
        </div>

        <div class="modifier-toggles">
          <button
            v-for="toggle in modifier.toggles"
            :key="toggle.key"
            :class="['modifier-toggle-btn', { active: isActive(toggle.key) }]"
            @click="handleToggle(toggle.key)"
          >
            <img
              v-if="toggle.icon"
              :src="`${iconsPath}${toggle.icon}`"
              :alt="toggle.label"
              class="toggle-icon"
            />
            <span class="toggle-label">{{ $t(`modifiers.${toggle.key}`, toggle.label) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { I18nManager } from '@anno/shared';
import { ModifierRegistry } from '../ts/modules/ModifierRegistry';
import { SettingsManager } from '../ts/modules/SettingsManager';

interface ModifierToggle {
  key: string;
  label: string;
  icon?: string;
}

interface ModifierDefinition {
  id: string;
  label: string;
  toggles?: ModifierToggle[];
}

const i18n = I18nManager.getInstance();
const modifierRegistry = ModifierRegistry.getInstance();
const settingsManager = SettingsManager.getInstance();
const iconsPath = import.meta.env.BASE_URL + 'icons/';

const $t = (key: string, fallback?: string): string => {
  const result = i18n.t(key);
  const subKey = key.split('.').slice(1).join('.');
  if ((result === key || result === subKey) && fallback) {
    return fallback;
  }
  return result;
};

const modifiers = ref<ModifierDefinition[]>([]);
const activeToggles = ref<Set<string>>(new Set());

const loadModifiers = () => {
  try {
    modifiers.value = modifierRegistry.getDefinitions();
    console.log('[ModifierPanel] Loaded modifiers:', modifiers.value.map(m => ({ id: m.id, toggleCount: m.toggles?.length ?? 0 })));

    // アクティブな設定を読み込み
    const allToggles = modifiers.value.flatMap((m) => m.toggles ?? []);
    activeToggles.value = new Set(
      allToggles.filter((t) => settingsManager.getSetting(t.key)).map((t) => t.key)
    );
  } catch (error) {
    console.error('[ModifierPanel] Error loading modifiers:', error);
    modifiers.value = [];
    activeToggles.value = new Set();
  }
};

const isActive = (key: string): boolean => {
  return activeToggles.value.has(key);
};

const handleToggle = (key: string) => {
  const currentValue = settingsManager.getSetting(key);
  settingsManager.setSetting(key, !currentValue);

  // 状態を更新
  if (activeToggles.value.has(key)) {
    activeToggles.value.delete(key);
  } else {
    activeToggles.value.add(key);
  }

  // 強制的に再レンダリング
  activeToggles.value = new Set(activeToggles.value);

  console.log(`[ModifierPanel] Toggled ${key} to ${!currentValue}`);
};

let unsubscribeRegistry: (() => void) | null = null;

onMounted(() => {
  console.log('[ModifierPanel] Mounted');
  loadModifiers();

  // SettingsManagerの変更を監視
  settingsManager.onChange(() => {
    loadModifiers();
  });

  // ModifierRegistryのDefinitions変更を監視（activeChainId変更対応）
  unsubscribeRegistry = modifierRegistry.onDefinitionsChanged(() => {
    console.log('[ModifierPanel] Definitions changed (activeChainId updated), reloading modifiers');
    loadModifiers();
  });
});

onUnmounted(() => {
  console.log('[ModifierPanel] Unmounted');
  if (unsubscribeRegistry) {
    unsubscribeRegistry();
  }
});
</script>

<style scoped>
.modifier-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
}

.modifier-panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--theme-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--theme-color);
}

.modifier-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modifier-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modifier-section-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modifier-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modifier-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid rgba(95, 3, 46, 0.2);
  border-radius: 8px;
  background: rgba(255, 233, 222, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modifier-toggle-btn:hover {
  background: rgba(255, 233, 222, 0.2);
  border-color: var(--theme-color);
}

.modifier-toggle-btn.active {
  background: var(--theme-color);
  border-color: var(--theme-color);
  color: var(--background);
}

.toggle-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
  flex: 1;
  text-align: left;
}
</style>
