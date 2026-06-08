import { test, expect } from '@playwright/test';

test('コンソールログ確認', async ({ page }) => {
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  // コンソールメッセージを記録
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // ページエラーを記録
  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });

  // ビルド後のHTMLを開く
  await page.goto('file:///' + 'C:/Users/kojif/Desktop/anno_db2/docs/index.html');

  // 10秒待機
  await page.waitForTimeout(10000);

  // ログを出力
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== Console Errors ===');
  consoleErrors.forEach(err => console.log(err));

  // selection-containerの内容を確認
  const containerHTML = await page.locator('#selection-container').innerHTML();
  console.log('\n=== selection-container HTML ===');
  console.log(containerHTML);

  // エラーがあることを確認（デバッグ目的）
  expect(consoleMessages.length).toBeGreaterThan(0);
});
