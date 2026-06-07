<template>
  <button
    id="language-toggle-btn"
    class="language-toggle-btn"
    aria-label="Toggle Language"
    @click="toggleLanguage"
  >
    {{ buttonText }}
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { I18nManager, type Locale } from '../i18n/I18nManager';
import { SettingsManager } from '../ts/modules/SettingsManager';

const i18nManager = I18nManager.getInstance();
const settingsManager = SettingsManager.getInstance();

const buttonText = ref<string>('EN');

/**
 * ボタンテキストを更新
 */
const updateButtonText = (locale: Locale) => {
  buttonText.value = locale === 'en' ? 'EN' : '日本語';
};

/**
 * 言語を切り替え
 */
const toggleLanguage = async () => {
  const currentLocale = i18nManager.getLocale();
  const nextLocale: Locale = currentLocale === 'en' ? 'ja' : 'en';

  await i18nManager.setLocale(nextLocale);
  settingsManager.setSettingValue('language', nextLocale);
  updateButtonText(nextLocale);

  // URLを更新
  const url = new URL(window.location.href);
  url.searchParams.set('lang', nextLocale);
  window.history.pushState({}, '', url.toString());
};

/**
 * 初期化
 */
onMounted(() => {
  updateButtonText(i18nManager.getLocale());

  // 言語変更リスナーを登録
  i18nManager.onChange(() => {
    updateButtonText(i18nManager.getLocale());
  });
});
</script>

<style scoped>
/* Vueコンポーネント用のスタイル（必要に応じて追加） */
</style>
