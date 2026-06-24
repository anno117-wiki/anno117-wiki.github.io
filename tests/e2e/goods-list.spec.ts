import { test, expect } from '@playwright/test';

/**
 * 商品一覧表示のE2Eテスト
 */

test.describe('商品一覧の表示と選択', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('商品一覧が正しく表示される', async ({ page }) => {
    // ツリービューが表示されることを確認
    const treeView = page.locator('.goods-tree-view');
    await expect(treeView).toBeVisible({ timeout: 15000 });

    // 少なくとも1つのカテゴリが表示されることを確認
    const categories = page.locator('.tree-category');
    await expect(categories.first()).toBeVisible();

    // カテゴリ数を確認（最低限のカテゴリ数）
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test('商品アイテムにアイコンと名前が表示される', async ({ page }) => {
    // カテゴリを展開して商品を表示
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.locator('.tree-category-header').click();
    await page.waitForTimeout(300);

    const firstItem = page.locator('.tree-item').first();
    await expect(firstItem).toBeVisible();

    // アイコン画像が存在する
    const icon = firstItem.locator('img');
    await expect(icon).toBeVisible();

    // 商品名テキストが存在する
    const name = firstItem.locator('.tree-item-name');
    await expect(name).toContainText(/\S+/);
  });

  test('商品を選択すると生産チェーンが表示される', async ({ page }) => {
    // カテゴリを展開
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.locator('.tree-category-header').click();
    await page.waitForTimeout(300);

    // 最初の商品アイテムをクリック
    const firstItem = page.locator('.tree-item').first();
    await firstItem.click();
    await page.waitForTimeout(500);

    // SVGグラフが描画されることを確認
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 10000 });
  });

  test('日本語モードで商品名が日本語表示される', async ({ page }) => {
    // 日本語モードに切り替え
    await page.goto('/?lang=ja');

    // ツリービューが表示されるまで待機
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });

    // カテゴリを展開
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.locator('.tree-category-header').click();
    await page.waitForTimeout(300);

    // 少なくとも1つの商品アイテムに日本語が含まれることを確認
    const items = page.locator('.tree-item');
    const firstItemText = await items.first().textContent();

    // 日本語文字（ひらがな、カタカナ、漢字）が含まれることを確認
    expect(firstItemText).toMatch(/[぀-ゟ゠-ヿ一-龯]/);
  });

  test('英語モードで商品名が英語表示される', async ({ page }) => {
    // 英語モードに切り替え
    await page.goto('/?lang=en');

    // ツリービューが表示されるまで待機
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });

    // カテゴリを展開
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.locator('.tree-category-header').click();
    await page.waitForTimeout(300);

    // 少なくとも1つの商品アイテムに英語が含まれることを確認
    const items = page.locator('.tree-item');
    const firstItemText = await items.first().textContent();

    // 英語アルファベットが含まれることを確認
    expect(firstItemText).toMatch(/[a-zA-Z]/);
  });
});
