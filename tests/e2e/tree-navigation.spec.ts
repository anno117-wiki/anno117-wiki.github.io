import { test, expect } from '@playwright/test';

/**
 * ツリーナビゲーション機能のE2Eテスト
 */

test.describe('ツリーナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=ja');
    // ツリービューが表示されるまで待機
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });
  });

  test('カテゴリが正しく表示される', async ({ page }) => {
    // カテゴリヘッダーが表示される
    const luxuryCategory = page.locator('[data-category="luxury"] .category-header');
    await expect(luxuryCategory).toBeVisible();

    // カテゴリ名が日本語で表示される
    const categoryName = luxuryCategory.locator('.category-name');
    await expect(categoryName).toHaveText('高級品');

    // カテゴリ数が表示される
    const categoryCount = luxuryCategory.locator('.category-count');
    const countText = await categoryCount.textContent();
    expect(countText).toMatch(/\(\d+\)/);
  });

  test('カテゴリクリックで商品が表示される', async ({ page }) => {
    // 高級品カテゴリをクリック
    const luxuryHeader = page.locator('[data-category="luxury"] .category-header');
    await luxuryHeader.click();
    await page.waitForTimeout(300);

    // カテゴリが展開される
    const luxuryCategory = page.locator('[data-category="luxury"]');
    await expect(luxuryCategory).toHaveClass(/expanded/);

    // 商品アイテムが表示される
    const items = page.locator('[data-category="luxury"] .tree-item');
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThan(0);

    // Fine Glassが存在する
    const fineGlass = page.locator('[data-good-id="fine_glass"]');
    await expect(fineGlass).toBeVisible();
  });

  test('カテゴリを再クリックで折り畳まれる', async ({ page }) => {
    // カテゴリを展開
    const foodHeader = page.locator('[data-category="food"] .category-header');
    await foodHeader.click();
    await page.waitForTimeout(300);

    // 展開されていることを確認
    const foodCategory = page.locator('[data-category="food"]');
    await expect(foodCategory).toHaveClass(/expanded/);

    // 再度クリックして折り畳み
    await foodHeader.click();
    await page.waitForTimeout(300);

    // 折り畳まれていることを確認
    await expect(foodCategory).not.toHaveClass(/expanded/);
  });

  test('検索で商品がフィルタされる', async ({ page }) => {
    // 検索ボックスに入力
    const searchInput = page.locator('#tree-search');
    await searchInput.fill('パン');
    await page.waitForTimeout(500);

    // パンが含まれる商品が表示される
    const breadItem = page.locator('[data-good-id="bread"]');
    await expect(breadItem).toBeVisible();

    // パンが含まれないカテゴリは空になる
    const militaryCategory = page.locator('[data-category="military"]');
    await expect(militaryCategory).not.toBeVisible();
  });

  test('検索結果がない場合にメッセージが表示される', async ({ page }) => {
    // 存在しない商品を検索
    const searchInput = page.locator('#tree-search');
    await searchInput.fill('存在しない商品XYZ');
    await page.waitForTimeout(500);

    // 「検索結果がありません」メッセージが表示される
    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText('検索結果がありません');
  });

  test('検索クリアボタンで検索がリセットされる', async ({ page }) => {
    // 検索を実行
    const searchInput = page.locator('#tree-search');
    await searchInput.fill('ガラス');
    await page.waitForTimeout(500);

    // クリアボタンが表示される
    const clearButton = page.locator('.clear-button');
    await expect(clearButton).toBeVisible();

    // クリアボタンをクリック
    await clearButton.click();
    await page.waitForTimeout(300);

    // 検索欄が空になる
    await expect(searchInput).toHaveValue('');

    // すべてのカテゴリが再表示される
    const allCategories = page.locator('.tree-category');
    const categoryCount = await allCategories.count();
    expect(categoryCount).toBeGreaterThanOrEqual(5);
  });

  test('商品をクリックすると生産チェーンが表示される', async ({ page }) => {
    // カテゴリを展開
    const foodHeader = page.locator('[data-category="food"] .category-header');
    await foodHeader.click();
    await page.waitForTimeout(300);

    // 商品を選択
    const breadItem = page.locator('[data-good-id="bread"]');
    await breadItem.click();
    await page.waitForTimeout(1000);

    // 2カラムレイアウトのため、ツリービューは常に表示される
    // SVGグラフが表示される
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 10000 });
  });

  test('最近表示した商品がリストに追加される', async ({ page }) => {
    // カテゴリを展開
    const militaryHeader = page.locator('[data-category="military"] .category-header');
    await militaryHeader.click();
    await page.waitForTimeout(300);

    // 商品を選択
    const armourItem = page.locator('[data-good-id="armour"]');
    await armourItem.click();
    await page.waitForTimeout(1000);

    // 商品一覧に戻る
    const backButton = page.locator('.back-button');
    await backButton.click();
    await page.waitForTimeout(500);

    // 最近表示セクションが表示される
    const recentSection = page.locator('.recent-section');
    await expect(recentSection).toBeVisible();

    // Armourが最近表示リストに存在する
    const recentArmour = page.locator('.recent-list [data-good-id="armour"]');
    await expect(recentArmour).toBeVisible();
  });

  test('英語に切り替えるとカテゴリ名が英語になる', async ({ page }) => {
    // 英語に切り替え
    await page.goto('/?lang=en');
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });

    // カテゴリ名が英語で表示される
    const luxuryCategory = page.locator('[data-category="luxury"] .category-header');
    const categoryName = luxuryCategory.locator('.category-name');
    await expect(categoryName).toHaveText('Luxury Goods');
  });

  test('キーボードナビゲーションが機能する', async ({ page }) => {
    // カテゴリヘッダーにフォーカス
    const luxuryHeader = page.locator('[data-category="luxury"] .category-header');
    await luxuryHeader.focus();

    // Enterキーで展開
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // カテゴリが展開される
    const luxuryCategory = page.locator('[data-category="luxury"]');
    await expect(luxuryCategory).toHaveClass(/expanded/);
  });
});
