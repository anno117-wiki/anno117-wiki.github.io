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
  // 手元の Windows では、ブラウザを4つ以上同時に動かすとローカルへの通信が止まり、goto がタイムアウトする
  // （2026-11-26 に確認。原因は未確定。NordVPN の保護は除外済み）。2つまでなら通るので2に抑える
  workers: process.env.CI ? 1 : 2,

  // レポート設定
  reporter: 'html',

  use: {
    // ベースURL（Vite開発サーバー）
    baseURL: 'http://localhost:5200',

    // トレース設定
    trace: 'on-first-retry',

    // スクリーンショット設定
    screenshot: 'only-on-failure',

    // 閲覧数の計測スクリプト（Cloudflare Web Analytics）を読み込ませない。
    // DNS によっては名前解決に20秒ほどかかり、ページの load が遅れて goto がタイムアウトするため。
    // テストの閲覧が計測に入るのも防ぐ
    launchOptions: {
      args: ['--host-resolver-rules=MAP static.cloudflareinsights.com ~NOTFOUND'],
    },
  },

  // テスト対象ブラウザ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 以下のブラウザは必要に応じてコメント解除
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // // モバイルテスト
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5200',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,  // Vite起動待機時間を延長
  },
});
