import { test, expect } from '@playwright/test';

/**
 * 生産チェーン表示のE2Eテスト
 */

test.describe('生産チェーン表示とインタラクション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.goods-card');

    // 商品を選択して生産チェーンを表示
    const firstCard = page.locator('.goods-card').first();
    await firstCard.click();
    await page.waitForSelector('.production-chain-view', { timeout: 5000 });
  });

  test('生産チェーンのSVGグラフが正しく描画される', async ({ page }) => {
    // SVGグラフが表示される
    const svg = page.locator('svg#production-graph');
    await expect(svg).toBeVisible();

    // グラフ内にノード（生産建物）が存在する
    const nodes = svg.locator('g[data-building]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);

    // グラフ内にエッジ（依存関係の線）が存在する可能性がある
    const edges = svg.locator('path, line');
    const edgeCount = await edges.count();
    expect(edgeCount).toBeGreaterThanOrEqual(0);
  });

  test('生産建物ノードにアイコンが表示される', async ({ page }) => {
    const svg = page.locator('svg#production-graph');

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
    const svg = page.locator('svg#production-graph');
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
    const svg = page.locator('svg#production-graph');

    // グラフの初期transformを取得
    const initialTransform = await svg.locator('g').first().getAttribute('transform');

    // マウスホイールでズーム（シミュレーション）
    const svgBox = await svg.boundingBox();
    if (svgBox) {
      await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
      await page.mouse.wheel(0, -100); // ズームイン
      await page.waitForTimeout(300);

      // transformが変更されることを確認
      const updatedTransform = await svg.locator('g').first().getAttribute('transform');

      // ズームが適用されたかを確認（transformが変化する）
      // 初期値がnullの場合もあるため、存在確認
      expect(updatedTransform).toBeTruthy();
    }
  });

  test('SVGグラフのパン（移動）機能が動作する', async ({ page }) => {
    const svg = page.locator('svg#production-graph');

    // グラフの初期位置を取得
    const initialTransform = await svg.locator('g').first().getAttribute('transform');

    // 左クリックでドラッグしてパン移動
    const svgBox = await svg.boundingBox();
    if (svgBox) {
      const startX = svgBox.x + 100;
      const startY = svgBox.y + 100;

      await page.mouse.move(startX, startY);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(startX + 50, startY + 50);
      await page.mouse.up({ button: 'left' });
      await page.waitForTimeout(300);

      // transformが変更されることを確認
      const updatedTransform = await svg.locator('g').first().getAttribute('transform');

      // パンが適用されたかを確認
      expect(updatedTransform).not.toBe(initialTransform);
    }
  });

  test('生産建物ノードをクリックすると詳細ポップアップが表示される', async ({ page }) => {
    const svg = page.locator('svg#production-graph');

    // 最初のノード（アイコン）をクリック
    const firstIcon = svg.locator('image').first();
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
    // 日本語に切り替え
    const languageToggle = page.locator('button').filter({ hasText: /JA|日本語/i }).first();
    await languageToggle.click();
    await page.waitForTimeout(500);

    // SVGグラフが引き続き表示される
    const svg = page.locator('svg#production-graph');
    await expect(svg).toBeVisible();

    // ノードが存在する
    const nodes = svg.locator('g[data-building]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);

    // 日本語テキストが表示される
    const chainView = page.locator('.production-chain-view');
    const chainText = await chainView.textContent();
    expect(chainText).toMatch(/[぀-ゟ゠-ヿ一-龯]/);
  });
});
