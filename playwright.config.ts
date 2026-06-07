import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * Anno 117生産計算機のE2Eテスト環境
 */
export default defineConfig({
  testDir: './tests/e2e',

  // テスト実行設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: 'html',

  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:3000',

    // トレース設定
    trace: 'on-first-retry',

    // スクリーンショット設定
    screenshot: 'only-on-failure',
  },

  // テスト対象ブラウザ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
