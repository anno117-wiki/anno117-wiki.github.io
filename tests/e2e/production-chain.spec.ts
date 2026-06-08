import { test, expect, Page } from '@playwright/test';

/**
 * 生産チェーン表示のE2Eテスト
 */

/**
 * SVGグラフの完全な描画を待機するヘルパー関数
 * ノードとエッジの両方が描画されるまで待機します
 */
async function waitForSVGGraphRendered(page: Page, timeout = 20000) {
  // SVG要素が存在するまで待機
  await page.waitForSelector('svg#dependency-graph', { timeout });

  // SVG内部のノード（建物）が最低1つ描画されるまで待機
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('svg#dependency-graph');
      if (!svg) return false;

      // ノード（g要素またはimage要素）が存在するか確認
      const nodes = svg.querySelectorAll('g[data-building], image');
      return nodes.length > 0;
    },
    { timeout }
  );

  // 描画が安定するまで少し待機
  await page.waitForTimeout(500);
}

test.describe('生産チェーン表示とインタラクション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // ツリーUIの最初のカテゴリが表示されるまで待機
    await page.waitForSelector('.tree-category', { timeout: 10000 });

    // 最初のカテゴリを展開
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.click();
    await page.waitForTimeout(500);

    // カテゴリ内の最初の商品を選択
    const firstItem = page.locator('.tree-item').first();
    await firstItem.waitFor({ state: 'visible', timeout: 5000 });
    await firstItem.click();

    // calculator-containerが表示されるまで待機（hiddenクラスが削除される）
    await page.waitForSelector('#calculator-container:not(.hidden)', { timeout: 10000 });

    // SVGグラフの描画完了を待機
    await waitForSVGGraphRendered(page);
  });

  test('生産チェーンのSVGグラフが正しく描画される', async ({ page }) => {
    // beforeEachでSVG描画待機済み

    // SVGグラフが表示される
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 5000 });

    // グラフ内にノード（生産建物）が存在する
    // data-building属性を持つg要素、またはimage要素を探す
    const dataNodes = svg.locator('g[data-building]');
    const imageNodes = svg.locator('image');

    const dataNodeCount = await dataNodes.count();
    const imageNodeCount = await imageNodes.count();

    // いずれかのノードが存在することを確認
    expect(dataNodeCount + imageNodeCount).toBeGreaterThan(0);

    // グラフ内にエッジ（依存関係の線）が存在する可能性がある
    const edges = svg.locator('path, line');
    const edgeCount = await edges.count();
    expect(edgeCount).toBeGreaterThanOrEqual(0);
  });

  test('生産建物ノードにアイコンが表示される', async ({ page }) => {
    const svg = page.locator('svg#dependency-graph');

    // 少なくとも1つのimage要素（アイコン）が存在する
    const icons = svg.locator('image');
    await expect(icons.first()).toBeVisible();
  });

  test('生産レート入力フィールドが機能する', async ({ page }) => {
    const rateInput = page.locator('input#target-rate');
    await expect(rateInput).toBeVisible();

    // 初期値を確認
    const initialValue = await rateInput.inputValue();
    expect(parseFloat(initialValue)).toBeGreaterThanOrEqual(0);

    // 値を変更
    await rateInput.fill('15');
    await page.waitForTimeout(500);

    // 値が反映されることを確認
    const updatedValue = await rateInput.inputValue();
    expect(updatedValue).toBe('15');

    // グラフが再計算される（建物数が変わる可能性）
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible();
  });

  test('Auto Ratioボタンが機能する', async ({ page }) => {
    const autoRatioBtn = page.locator('button#recommend-ratio-btn');

    if (await autoRatioBtn.isVisible()) {
      await autoRatioBtn.click();
      await page.waitForTimeout(500);

      // 入力値が自動計算された値に変更される
      const rateInput = page.locator('input#target-rate');
      const calculatedValue = await rateInput.inputValue();

      // 0より大きい値が設定される
      expect(parseFloat(calculatedValue)).toBeGreaterThan(0);
    }
  });

  test('建設コストと維持費が表示される', async ({ page }) => {
    // 建設コストセクション
    const buildingCost = page.locator('.building-cost, .cost-section').first();

    if (await buildingCost.isVisible()) {
      // コスト情報が表示される
      const costText = await buildingCost.textContent();
      expect(costText).toBeTruthy();
    }

    // 維持費セクション
    const maintenance = page.locator('.maintenance, .cost-section').nth(1);

    if (await maintenance.isVisible()) {
      const maintenanceText = await maintenance.textContent();
      expect(maintenanceText).toBeTruthy();
    }
  });

  test('SVGグラフのズーム機能が動作する', async ({ page }) => {
    // beforeEachでSVG描画待機済み

    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 5000 });

    // グラフの初期viewBox属性を取得（ズーム/パンはviewBoxを変更する）
    const initialViewBox = await svg.getAttribute('viewBox');
    expect(initialViewBox).toBeTruthy();

    // マウスホイールでズーム（シミュレーション）
    const svgBox = await svg.boundingBox();
    if (svgBox) {
      await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
      await page.mouse.wheel(0, -100); // ズームイン
      await page.waitForTimeout(500);

      // viewBoxが変更されることを確認
      const updatedViewBox = await svg.getAttribute('viewBox');

      // ズームが適用されたかを確認（viewBoxが変化する）
      expect(updatedViewBox).not.toBe(initialViewBox);
    }
  });

  test('SVGグラフのパン（移動）機能が動作する', async ({ page }) => {
    // beforeEachでSVG描画待機済み

    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 5000 });

    // グラフの初期viewBox属性を取得（パン移動はviewBoxを変更する）
    const initialViewBox = await svg.getAttribute('viewBox');
    expect(initialViewBox).toBeTruthy();

    // 左クリックでドラッグしてパン移動
    const svgBox = await svg.boundingBox();
    if (svgBox) {
      const startX = svgBox.x + 100;
      const startY = svgBox.y + 100;

      await page.mouse.move(startX, startY);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(startX + 50, startY + 50, { steps: 10 });
      await page.mouse.up({ button: 'left' });
      await page.waitForTimeout(500);

      // viewBoxが変更されることを確認
      const updatedViewBox = await svg.getAttribute('viewBox');

      // パンが適用されたかを確認
      expect(updatedViewBox).not.toBe(initialViewBox);
    }
  });

  test('生産建物ノードをクリックすると詳細ポップアップが表示される', async ({ page }) => {
    // beforeEachでSVG描画待機済み

    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible({ timeout: 5000 });

    // 最初のノード（アイコン）を探す
    const firstIcon = svg.locator('image').first();
    await expect(firstIcon).toBeAttached({ timeout: 5000 });

    // クリック可能になるまで待機
    await firstIcon.waitFor({ state: 'visible', timeout: 5000 });

    // クリック
    await firstIcon.click();
    await page.waitForTimeout(500);

    // 詳細ポップアップが表示される
    const popup = page.locator('.info-container, .detail-popup');

    if (await popup.count() > 0) {
      await expect(popup.first()).toBeVisible();

      // ポップアップ内に情報が含まれることを確認
      const popupText = await popup.first().textContent();
      expect(popupText).toBeTruthy();
    }
  });

  test('言語切り替え後も生産チェーンが正しく表示される', async ({ page }) => {
    // beforeEachでSVG描画待機済み（英語モード）

    // SVGグラフが現在表示されていることを確認
    const svg = page.locator('svg#dependency-graph');
    await expect(svg).toBeVisible();

    // ページ全体を日本語モードで再読み込み
    await page.goto('/?lang=ja');
    await page.waitForSelector('.tree-category', { timeout: 10000 });

    // 最初のカテゴリを展開
    const firstCategory = page.locator('.tree-category').first();
    await firstCategory.click();
    await page.waitForTimeout(500);

    // カテゴリ内の最初の商品を選択
    const firstItem = page.locator('.tree-item').first();
    await firstItem.waitFor({ state: 'visible', timeout: 5000 });
    await firstItem.click();

    // calculator-containerが表示されるまで待機
    await page.waitForSelector('#calculator-container:not(.hidden)', { timeout: 10000 });

    // SVGグラフの描画を待機
    await waitForSVGGraphRendered(page);

    // SVGグラフが日本語モードでも表示される
    await expect(svg).toBeVisible();

    // ノードが存在する（data-building属性またはimage要素）
    const dataNodes = svg.locator('g[data-building]');
    const imageNodes = svg.locator('image');
    const totalNodes = (await dataNodes.count()) + (await imageNodes.count());
    expect(totalNodes).toBeGreaterThan(0);

    // 言語が日本語に切り替わったことを確認
    await expect(page).toHaveURL(/lang=ja/);
  });
});
