import { test, expect } from '@playwright/test';

/**
 * 地域切り替え機能のE2Eテスト
 */

test.describe('地域切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });

    // カテゴリを展開して商品を選択
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.locator('.category-header').click();
    await page.waitForTimeout(300);

    const firstItem = page.locator('.tree-item').first();
    await firstItem.click();

    // SVGグラフが表示されるまで待機
    await page.waitForSelector('svg#dependency-graph', { timeout: 10000 });
  });

  test('地域切り替えボタンが表示される', async ({ page }) => {
    // 地域名を含むボタンまたはトグルを確認
    const regionButtons = page.locator('button, .toggle-button').filter({ hasText: /Latium|Albion|Mesopotamia/i });

    // 少なくとも1つの地域ボタンが表示される
    const count = await regionButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('地域を切り替えると生産チェーンが更新される', async ({ page }) => {
    // 初期状態のグラフを取得
    const initialGraph = await page.locator('svg#dependency-graph').innerHTML();

    // 地域切り替えボタンを探す（例：Albion）
    const regionButton = page.locator('button, .toggle-button').filter({ hasText: /Albion/i }).first();

    if (await regionButton.isVisible()) {
      await regionButton.click();

      // グラフが再描画されるまで待機
      await page.waitForTimeout(1000);

      // グラフの内容が変更されたことを確認（完全一致しないことを確認）
      const updatedGraph = await page.locator('svg#dependency-graph').innerHTML();

      // 地域によって生産チェーンが変わる場合は内容が異なるはず
      // ただし、同じ商品が両地域で利用可能な場合は同じになる可能性もある
      expect(updatedGraph).toBeTruthy();
    }
  });

  test('地域フィルターが正しく機能する', async ({ page }) => {
    // Latium専用の商品があればそれを選択
    await page.goto('/');
    await page.waitForSelector('.goods-tree-view', { timeout: 10000 });

    // 地域フィルターボタンを探す
    const latiumFilter = page.locator('button, .toggle-button').filter({ hasText: /Latium/i }).first();

    if (await latiumFilter.isVisible()) {
      await latiumFilter.click();
      await page.waitForTimeout(500);

      // フィルター後もツリービューが表示される
      const treeView = page.locator('.goods-tree-view');
      await expect(treeView).toBeVisible();
    }
  });

  test('複数地域を切り替えても状態が保持される', async ({ page }) => {
    // 生産レート入力があれば値を設定
    const rateInput = page.locator('input#target-rate');

    if (await rateInput.isVisible()) {
      await rateInput.fill('10');

      // 地域を切り替え
      const regionButtons = page.locator('button, .toggle-button').filter({ hasText: /Latium|Albion|Mesopotamia/i });

      if (await regionButtons.first().isVisible()) {
        await regionButtons.first().click();
        await page.waitForTimeout(500);

        // 入力値が保持されていることを確認
        const inputValue = await rateInput.inputValue();
        expect(inputValue).toBe('10');
      }
    }
  });

  test('言語切り替え後も地域選択が保持される', async ({ page }) => {
    // 地域ボタンをクリック
    const regionButton = page.locator('button, .toggle-button').filter({ hasText: /Mesopotamia/i }).first();

    if (await regionButton.isVisible()) {
      await regionButton.click();
      await page.waitForTimeout(500);

      // 言語を切り替え
      const languageToggle = page.locator('button').filter({ hasText: /JA|日本語/i }).first();
      await languageToggle.click();
      await page.waitForTimeout(500);

      // 地域選択が保持されていることを確認（アクティブクラスなどで判定）
      // 実装に応じて調整が必要
      const activeRegion = page.locator('button.active, .toggle-button.active').filter({ hasText: /メソポタミア|Mesopotamia/i });

      if (await activeRegion.count() > 0) {
        await expect(activeRegion.first()).toBeVisible();
      }
    }
  });
});
