/**
 * Vueアプリケーションのエントリーポイント
 * 段階的にVueコンポーネントを既存のアプリケーションに統合する
 */

import { createApp } from 'vue';
import LanguageToggle from '../components/LanguageToggle.vue';
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

    }
  }
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


  return app;
}
