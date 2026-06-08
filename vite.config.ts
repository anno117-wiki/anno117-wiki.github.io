import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/**
 * Vite設定ファイル
 * Vue 3コンポーネントのビルドと開発サーバー設定
 */
export default defineConfig({
  plugins: [vue()],

  // プロジェクトルート
  root: 'src',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // 開発サーバー設定
  server: {
    port: 5173,  // Playwrightと統一
    strictPort: true,  // ポートが使用中の場合エラー
    open: false,
  },

  // ビルド設定
  build: {
    outDir: resolve(__dirname, 'docs'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
    minify: false,  // minifyを無効化（開発中）
    sourcemap: true,
  },

  // CSS設定
  css: {
    devSourcemap: true,
  },

  // 公開ディレクトリ（アセットなど）
  publicDir: resolve(__dirname, 'src/assets'),
});
