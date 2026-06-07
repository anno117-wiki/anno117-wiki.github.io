import { test, expect } from '@playwright/test';

/**
 * 商品一覧表示のE2Eテスト
 */

test.describe('商品一覧の表示と選択', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('商品一覧が正しく表示される', async ({ page }) => {
    // 商品グリッドが表示されることを確認
    const goodsGrid = page.locator('.goods-grid');
    await expect(goodsGrid).toBeVisible();

    // 少なくとも1つの商品カードが表示されることを確認
    const goodsCards = page.locator('.goods-card');
    await expect(goodsCards.first()).toBeVisible();

    // 商品カード数を確認（最低限の商品数）
    const count = await goodsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('商品カードにアイコンと名前が表示される', async ({ page }) => {
    const firstCard = page.locator('.goods-card').first();

    // アイコン画像が存在する
    const icon = firstCard.locator('img');
    await expect(icon).toBeVisible();

    // 商品名テキストが存在する
    await expect(firstCard).toContainText(/\w+/);
  });

  test('商品を選択すると生産チェーンが表示される', async ({ page }) => {
    // 最初の商品カードをクリック
    const firstCard = page.locator('.goods-card').first();
    await firstCard.click();

    // calculator-containerが表示されることを確認
    const calculatorContainer = page.locator('#calculator-container:not(.hidden)');
    await expect(calculatorContainer).toBeVisible({ timeout: 10000 });

    // SVGグラフが描画されることを確認
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible();
  });

  test('日本語モードで商品名が日本語表示される', async ({ page }) => {
    // 日本語モードに切り替え
    await page.goto('/?lang=ja');

    // 商品一覧が表示されるまで待機
    await page.waitForSelector('.goods-grid');

    // 少なくとも1つの商品カードに日本語が含まれることを確認
    const cards = page.locator('.goods-card');
    const firstCardText = await cards.first().textContent();

    // 日本語文字（ひらがな、カタカナ、漢字）が含まれることを確認
    expect(firstCardText).toMatch(/[぀-ゟ゠-ヿ一-龯]/);
  });

  test('英語モードで商品名が英語表示される', async ({ page }) => {
    // 英語モードに切り替え
    await page.goto('/?lang=en');

    // 商品一覧が表示されるまで待機
    await page.waitForSelector('.goods-grid');

    // 少なくとも1つの商品カードに英語が含まれることを確認
    const cards = page.locator('.goods-card');
    const firstCardText = await cards.first().textContent();

    // 英語アルファベットが含まれることを確認
    expect(firstCardText).toMatch(/[a-zA-Z]/);
  });
});
