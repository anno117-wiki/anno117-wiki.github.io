/**
 * Vueアプリケーションのエントリーポイント
 * 段階的にVueコンポーネントを既存のアプリケーションに統合する
 */

import { createApp } from 'vue';
import LanguageToggle from '../components/LanguageToggle.vue';
import SettingsPanelRoot from '../components/SettingsPanelRoot.vue';
import ModifierPanel from '../components/ModifierPanel.vue';

/**
 * Vueコンポーネントを初期化
 */
export function initVueComponents() {
  // 言語切り替えボタンをVueコンポーネントに置き換え
  const languageToggleElement = document.getElementById('language-toggle-btn');

  if (languageToggleElement) {
    // 既存のボタンを削除
    const parent = languageToggleElement.parentElement;
    if (parent) {
      // 新しいコンテナを作成
      const container = document.createElement('div');
      container.id = 'language-toggle-container';

      // 既存のボタンを置き換え
      parent.replaceChild(container, languageToggleElement);

      // Vueアプリをマウント
      const app = createApp(LanguageToggle);
      app.mount('#language-toggle-container');

      console.log('[Vue] LanguageToggle component mounted');
    }
  }
}


/**
 * 設定パネルをVueコンポーネントとして初期化
 */
export function initSettingsPanel() {
  const modifierContainer = document.getElementById('modifier-container');

  if (!modifierContainer) {
    console.warn('[Vue] #modifier-container not found, falling back to body');
    const settingsPanelContainer = document.createElement('div');
    settingsPanelContainer.id = 'settings-panel-vue';
    document.body.appendChild(settingsPanelContainer);

    const app = createApp(SettingsPanelRoot);
    app.mount(settingsPanelContainer);
    return app;
  }

  const settingsPanelContainer = document.createElement('div');
  settingsPanelContainer.id = 'settings-panel-vue';
  modifierContainer.appendChild(settingsPanelContainer);

  const app = createApp(SettingsPanelRoot);
  app.mount(settingsPanelContainer);

  // Storageボタンのクリックイベントを設定（CustomEventで通知）
  const toggleButton = document.getElementById('saved-store-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      // CustomEventを発火してSettingsPanelRootに通知
      window.dispatchEvent(new Event('openSettingsPanel'));
    });
  }

  console.log('[Vue] SettingsPanel component mounted');

  return app;
}

/**
 * 右パネルにModifierPanelをマウント
 */
export function initModifierPanel() {
  const modifierContainer = document.getElementById('modifier-container');

  if (!modifierContainer) {
    console.warn('[Vue] #modifier-container not found');
    return;
  }

  const app = createApp(ModifierPanel);
  app.mount(modifierContainer);

  console.log('[Vue] ModifierPanel component mounted');

  return app;
}
