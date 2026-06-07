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
    port: 3000,
    open: false,
  },

  // ビルド設定
  build: {
    outDir: resolve(__dirname, 'docs'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
    minify: 'terser',
    sourcemap: false,
  },

  // CSS設定
  css: {
    devSourcemap: true,
  },

  // 公開ディレクトリ（アセットなど）
  publicDir: resolve(__dirname, 'src/assets'),
});
