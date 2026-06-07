import { test, expect } from '@playwright/test';

/**
 * 言語切り替え機能のE2Eテスト
 */

test.describe('言語切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('言語切り替えボタンが表示される', async ({ page }) => {
    // 言語切り替えボタンを確認
    const languageToggle = page.locator('button').filter({ hasText: /EN|JA|日本語|English/i });
    await expect(languageToggle).toBeVisible();
  });

  test('言語切り替えボタンをクリックして日本語⇔英語が切り替わる', async ({ page }) => {
    // 初期状態を確認（デフォルトは英語と仮定）
    await page.goto('/?lang=en');

    // 商品一覧が表示されるまで待機
    await page.waitForSelector('.goods-grid');

    // 言語切り替えボタンをクリック
    const languageToggle = page.locator('button').filter({ hasText: /JA|日本語/i }).first();
    await languageToggle.click();

    // URLが変更されることを確認
    await expect(page).toHaveURL(/lang=ja/);

    // 日本語テキストが表示されることを確認
    await page.waitForTimeout(500); // DOM更新を待機
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[぀-ゟ゠-ヿ一-龯]/); // 日本語文字が含まれる

    // 再度切り替えて英語に戻す
    const toggleBackButton = page.locator('button').filter({ hasText: /EN|English/i }).first();
    await toggleBackButton.click();

    // URLが英語に戻ることを確認
    await expect(page).toHaveURL(/lang=en/);
  });

  test('URLパラメータで言語を指定できる', async ({ page }) => {
    // 日本語でアクセス
    await page.goto('/?lang=ja');
    await page.waitForSelector('.goods-grid');

    const bodyTextJa = await page.locator('body').textContent();
    expect(bodyTextJa).toMatch(/[぀-ゟ゠-ヿ一-龯]/);

    // 英語でアクセス
    await page.goto('/?lang=en');
    await page.waitForSelector('.goods-grid');

    const bodyTextEn = await page.locator('body').textContent();
    expect(bodyTextEn).toMatch(/[a-zA-Z]/);
  });

  test('localStorageに言語設定が保存される', async ({ page, context }) => {
    // 日本語に切り替え
    await page.goto('/?lang=ja');
    await page.waitForSelector('.goods-grid');

    // localStorageを確認
    const storedLang = await page.evaluate(() => localStorage.getItem('language'));
    expect(storedLang).toBe('ja');

    // 新しいページを開いても言語設定が保持されることを確認
    const newPage = await context.newPage();
    await newPage.goto('/');
    await newPage.waitForSelector('.goods-grid');

    const newPageLang = await newPage.evaluate(() => localStorage.getItem('language'));
    expect(newPageLang).toBe('ja');

    await newPage.close();
  });

  test('商品選択後も言語切り替えが機能する', async ({ page }) => {
    // 商品を選択
    await page.goto('/?lang=en');
    await page.waitForSelector('.goods-card');
    const firstCard = page.locator('.goods-card').first();
    await firstCard.click();

    // 生産チェーンが表示されるまで待機
    await page.waitForSelector('.production-chain-view', { timeout: 5000 });

    // 言語を日本語に切り替え
    const languageToggle = page.locator('button').filter({ hasText: /JA|日本語/i }).first();
    await languageToggle.click();

    // 生産チェーンビューが日本語で再描画されることを確認
    await page.waitForTimeout(500);
    const chainText = await page.locator('.production-chain-view').textContent();
    expect(chainText).toMatch(/[぀-ゟ゠-ヿ一-龯]/);
  });

  test('UIテキストが言語に応じて切り替わる', async ({ page }) => {
    // 英語モード
    await page.goto('/?lang=en');
    await page.waitForSelector('body');

    let bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Select a Good');

    // 日本語モード
    await page.goto('/?lang=ja');
    await page.waitForSelector('body');

    bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('生産品を選択');
  });
});
