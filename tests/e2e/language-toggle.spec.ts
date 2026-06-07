import { test, expect } from '@playwright/test';

/**
 * 言語切り替え機能のE2Eテスト
 */

test.describe('言語切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('言語切り替えボタンが表示される', async ({ page }) => {
    // 言語切り替えボタンを確認（IDで特定）
    const languageToggle = page.locator('button#language-toggle-btn');
    await expect(languageToggle).toBeVisible();
  });

  test('言語切り替えボタンをクリックして日本語⇔英語が切り替わる', async ({ page }) => {
    // 初期状態を確認（デフォルトは英語と仮定）
    await page.goto('/?lang=en');

    // 商品一覧が表示されるまで待機
    await page.waitForSelector('.goods-grid');

    // 言語切り替えボタンをクリック
    const languageToggle = page.locator('button#language-toggle-btn');
    await languageToggle.click();

    // URLが変更されることを確認
    await expect(page).toHaveURL(/lang=ja/);

    // 日本語テキストが表示されることを確認
    await page.waitForTimeout(500); // DOM更新を待機
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[぀-ゟ゠-ヿ一-龯]/); // 日本語文字が含まれる

    // 再度切り替えて英語に戻す
    await languageToggle.click();

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

  test('localStorageに言語設定が保存される', async ({ page }) => {
    // 日本語に切り替え
    await page.goto('/?lang=ja');
    await page.waitForSelector('.goods-grid');

    // localStorageを確認（設定は anno117_calculator_settings オブジェクトに保存される）
    const storedSettings = await page.evaluate(() => {
      const raw = localStorage.getItem('anno117_calculator_settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedSettings).toBeTruthy();
    expect(storedSettings.language).toBe('ja');

    // ページをリロードしても言語設定が保持されることを確認
    await page.reload();
    await page.waitForSelector('.goods-grid');

    const afterReloadSettings = await page.evaluate(() => {
      const raw = localStorage.getItem('anno117_calculator_settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(afterReloadSettings.language).toBe('ja');

    // 言語ボタンも日本語表示になっていることを確認
    const buttonText = await page.locator('button#language-toggle-btn').textContent();
    expect(buttonText).toContain('日本語');
  });

  test('商品選択後も言語切り替えが機能する', async ({ page }) => {
    // 商品を選択
    await page.goto('/?lang=en');
    await page.waitForSelector('.goods-card');
    const firstCard = page.locator('.goods-card').first();
    await firstCard.click();

    // calculator-containerが表示されるまで待機
    await page.waitForSelector('#calculator-container:not(.hidden)', { timeout: 10000 });

    // 言語を日本語に切り替え
    const languageToggle = page.locator('button#language-toggle-btn');
    await languageToggle.click();

    // 言語ボタンのテキストが変更されることを確認
    await page.waitForTimeout(500);
    const buttonText = await languageToggle.textContent();
    expect(buttonText).toContain('日本語');
  });

  test('UIテキストが言語に応じて切り替わる', async ({ page }) => {
    // 英語モード - ボタンテキストで確認
    await page.goto('/?lang=en');
    await page.waitForSelector('button#language-toggle-btn');

    let langButton = await page.locator('button#language-toggle-btn').textContent();
    expect(langButton).toContain('EN');

    // 日本語モード
    await page.goto('/?lang=ja');
    await page.waitForSelector('button#language-toggle-btn');

    langButton = await page.locator('button#language-toggle-btn').textContent();
    expect(langButton).toContain('日本語');
  });
});
