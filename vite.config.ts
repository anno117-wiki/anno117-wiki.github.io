import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/**
 * Vite設定ファイル
 * Vue 3コンポーネントのビルドと開発サーバー設定
 */
export default defineConfig({
  plugins: [vue()],

  root: 'apps/calculator/src',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/calculator/src'),
      '@anno/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },

  server: {
    port: 5200,
    strictPort: true,
    open: false,
  },

  build: {
    outDir: resolve(__dirname, 'docs/calculator'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'apps/calculator/src/index.html'),
    },
    minify: false,
    sourcemap: true,
  },

  css: {
    devSourcemap: true,
  },

  publicDir: resolve(__dirname, 'packages/shared/public'),
});
