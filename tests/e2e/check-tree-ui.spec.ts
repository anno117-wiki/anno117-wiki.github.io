import { test, expect } from '@playwright/test';

test('TreeUI表示確認', async ({ page }) => {
  // 日本語モードでアクセス
  await page.goto('http://localhost:5173/?lang=ja');

  // ツリービューが表示されるまで待機（最大15秒）
  await page.waitForSelector('.goods-tree-view', { timeout: 15000 });

  // スクリーンショット撮影
  await page.screenshot({
    path: 'test-results/manual-verification/tree-ui-loaded.png',
    fullPage: true
  });

  // カテゴリが表示されているか確認
  const categories = await page.locator('.tree-category').count();
  console.log('カテゴリ数:', categories);

  // 検索ボックスが表示されているか確認
  const searchBox = await page.locator('input[placeholder*="検索"]').count();
  console.log('検索ボックス:', searchBox);

  expect(categories).toBeGreaterThan(0);
  expect(searchBox).toBe(1);
});
