/**
 * デバッグログ確認用テスト
 * Auto Ratio機能のログ出力を検証
 */
import { test, expect } from '@playwright/test';

test.describe('Auto Ratioデバッグログ検証', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.goods-tree-view', { timeout: 10000 });
    });

    test('Auto Ratioボタンクリック時にデバッグログが出力される', async ({ page }) => {
        const logs: string[] = [];

        // コンソールログをキャプチャ
        page.on('console', (msg) => {
            if (msg.type() === 'debug' || msg.type() === 'log') {
                logs.push(msg.text());
            }
        });

        // カテゴリを展開して商品を選択
        const firstCategory = page.locator('.tree-category').first();
        await firstCategory.locator('.category-header').click();
        await page.waitForTimeout(300);

        const firstItem = page.locator('.tree-item').first();
        await firstItem.click();

        // SVGグラフが表示されるまで待機
        await page.waitForSelector('svg#dependency-graph', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Output / minを手動設定
        const targetInput = page.locator('#target-rate');
        await targetInput.waitFor({ state: 'visible' });
        await targetInput.fill('4');
        await page.waitForTimeout(500);

        // ログをクリア
        logs.length = 0;

        // Auto Ratioボタンをクリック
        const autoRatioBtn = page.locator('#recommend-ratio-btn');
        await autoRatioBtn.waitFor({ state: 'visible' });
        await autoRatioBtn.click();

        // ログ出力を待機
        await page.waitForTimeout(2000);

        // デバッグログの検証
        console.log('=== Captured Logs ===');
        logs.forEach(log => console.log(log));

        // 必須ログの存在確認
        const hasButtonClickLog = logs.some(log => log.includes('[Auto Ratio] Button clicked'));
        const hasCurrentRateLog = logs.some(log => log.includes('[Auto Ratio] Current rate before:'));
        const hasRecommendedLog = logs.some(log => log.includes('[Auto Ratio] Recommended rate:'));
        const hasInputUpdateLog = logs.some(log => log.includes('[Auto Ratio] Input field updated to:'));
        const hasFindRecommendedLog = logs.some(log => log.includes('[findRecommendedRate]'));
        const hasUpdateCalcLog = logs.some(log => log.includes('[updateCalculations]'));

        expect(hasButtonClickLog).toBe(true);
        expect(hasCurrentRateLog).toBe(true);
        expect(hasRecommendedLog).toBe(true);
        expect(hasInputUpdateLog).toBe(true);
        expect(hasFindRecommendedLog).toBe(true);
        expect(hasUpdateCalcLog).toBe(true);

        // 入力欄の値を確認
        const updatedValue = await targetInput.inputValue();
        console.log('Updated input value:', updatedValue);

        // 推奨レートが設定されていることを確認
        expect(parseFloat(updatedValue)).toBeGreaterThan(0);
    });

    test('Auto Ratio計算後、グラフと入力欄の値が一致する', async ({ page }) => {
        const logs: string[] = [];

        // コンソールログをキャプチャ
        page.on('console', (msg) => {
            if (msg.type() === 'debug' || msg.type() === 'log') {
                logs.push(msg.text());
            }
        });

        // カテゴリを展開して商品を選択
        const firstCategory = page.locator('.tree-category').first();
        await firstCategory.locator('.category-header').click();
        await page.waitForTimeout(300);

        const firstItem = page.locator('.tree-item').first();
        await firstItem.click();
        await page.waitForSelector('svg#dependency-graph', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Auto Ratioボタンをクリック
        const autoRatioBtn = page.locator('#recommend-ratio-btn');
        await autoRatioBtn.click();
        await page.waitForTimeout(2000);

        // 入力欄の値を取得
        const targetInput = page.locator('#target-rate');
        const inputValue = await targetInput.inputValue();
        const inputRate = parseFloat(inputValue);

        console.log('Input field rate:', inputRate);

        // ログから推奨レートを抽出
        const recommendedLog = logs.find(log => log.includes('[Auto Ratio] Recommended rate:'));
        console.log('Recommended log:', recommendedLog);

        // Buildings calculatedログを確認
        const buildingsLog = logs.find(log => log.includes('[updateCalculations] Buildings calculated:'));
        console.log('Buildings log:', buildingsLog);

        // 入力欄の値が正の数であることを確認
        expect(inputRate).toBeGreaterThan(0);

        // ログが存在することを確認
        expect(recommendedLog).toBeDefined();
        expect(buildingsLog).toBeDefined();
    });
});
