import { test, expect } from '@playwright/test';

test('Viteサーバー - TreeUI表示確認', async ({ page }) => {
  const consoleMessages: string[] = [];

  // コンソールメッセージを記録
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Vite開発サーバーにアクセス（ポート5173）
  await page.goto('http://localhost:5173/?lang=ja');

  // ツリービューが表示されるまで待機
  await page.waitForSelector('.goods-tree-view', { timeout: 15000 });

  // スクリーンショット撮影
  await page.screenshot({
    path: 'test-results/vite-tree-ui-success.png',
    fullPage: true
  });

  // カテゴリが表示されているか確認
  const categories = await page.locator('.tree-category').count();
  console.log('\nカテゴリ数:', categories);

  // コンソールログを出力
  console.log('\n=== Console Messages ===');
  consoleMessages.filter(m => m.includes('[TreeApp]') || m.includes('[GoodsTreeView]') || m.includes('[App]')).forEach(msg => console.log(msg));

  expect(categories).toBeGreaterThan(0);
});
