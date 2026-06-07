# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-chain.spec.ts >> 生産チェーン表示とインタラクション >> 生産チェーンのSVGグラフが正しく描画される
- Location: tests\e2e\production-chain.spec.ts:20:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - img "Anno 117 Logo" [ref=e3]
    - button "Toggle Language" [ref=e4] [cursor=pointer]: EN
    - button "Toggle Region" [ref=e5] [cursor=pointer]:
      - img "Region Icon" [ref=e6]
      - generic [ref=e7]: Latium
    - button "About" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
      - generic [ref=e11]: About
    - button "Open Storage" [ref=e12] [cursor=pointer]:
      - img [ref=e13]
      - generic [ref=e15]: Storage
  - main [ref=e16]:
    - generic [ref=e19]:
      - generic [ref=e20]:
        - button "Back to list" [ref=e21] [cursor=pointer]: ←
        - 'heading "Dependency Graph: Amphorae" [level=3] [ref=e22]'
      - generic [ref=e23]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]: Output / min
            - spinbutton "Output / min" [ref=e28]: "1"
            - button "Auto Ratio" [ref=e29] [cursor=pointer]
          - generic [ref=e30]:
            - heading "Modifier Settings" [level=4] [ref=e31]
            - paragraph [ref=e32]: Apply productivity boosts to improve efficiency.
            - generic [ref=e33]:
              - generic [ref=e34]:
                - generic [ref=e35]: Aqueducts Settings
                - generic [ref=e36]:
                  - button "Aqueduct Network" [ref=e37] [cursor=pointer]:
                    - img [ref=e38]
                    - generic [ref=e39]: Aqueduct Network
                    - text: "Aqueduct Network: Master switch for all aqueduct boosts."
                  - button "Field Irrigation" [ref=e40]:
                    - img [ref=e41]
                    - generic [ref=e42]: Field Irrigation
                    - text: "Field Irrigation: Arable Farms get +50% productivity."
                  - button "Aqua Arborica" [ref=e43]:
                    - img [ref=e44]
                    - generic [ref=e45]: Aqua Arborica
                    - text: "Aqua Arborica: Plantations get +50% productivity."
                  - button "Hushing" [ref=e46]:
                    - img [ref=e47]
                    - generic [ref=e48]: Hushing
                    - text: "Hushing: Mines get +50% productivity."
              - generic [ref=e49]:
                - generic [ref=e50]: Items Settings
                - button "Handler" [ref=e52] [cursor=pointer]:
                  - img [ref=e53]
                  - generic [ref=e54]: Handler
                  - text: "Handler: Amphorae: +10% productivity"
        - generic [ref=e55]:
          - generic [ref=e56]:
            - heading "Dependency Graph" [level=4] [ref=e57]
            - img [ref=e59]:
              - generic [ref=e62]:
                - generic [ref=e66]: Amphorae
                - generic [ref=e67]: 1.00x
              - generic [ref=e68]:
                - generic [ref=e71]: Clay
                - generic [ref=e72]: 0.50x
              - generic [ref=e73]:
                - generic [ref=e76]: Resin
                - generic [ref=e77]: 1.00x
          - generic [ref=e78]:
            - generic [ref=e79]:
              - strong [ref=e80]: "Building Cost:"
              - generic [ref=e81]:
                - generic [ref=e82]:
                  - img "Timber" [ref=e83]
                  - generic [ref=e84]: "6"
                - generic [ref=e85]:
                  - img "Tiles" [ref=e86]
                  - generic [ref=e87]: "4"
            - generic [ref=e88]:
              - strong [ref=e89]: "Maintenance:"
              - generic [ref=e90]:
                - generic [ref=e91]:
                  - img "Money" [ref=e92]
                  - generic [ref=e93]: "30"
                - generic [ref=e94]:
                  - img "Plebeian" [ref=e95]
                  - generic [ref=e96]: "10"
                - generic [ref=e97]:
                  - img "Charcoal" [ref=e98]
                  - generic [ref=e99]: 0.25x
  - contentinfo [ref=e100]:
    - paragraph [ref=e101]:
      - strong [ref=e102]: "Tip:"
      - text: On touch, drag with one finger to pan and pinch to zoom. On desktop, hold right mouse button to pan and use the mouse wheel to zoom.
    - paragraph [ref=e103]:
      - text: Developed by AgentQuack. Not affiliated with Ubisoft or Ubisoft Mainz. All trademarks are the property of their respective owners. Visit the
      - link "GitHub repository" [ref=e104] [cursor=pointer]:
        - /url: https://github.com/agentquackyt/Anno117Calculator
      - text: for source code and updates.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * 生産チェーン表示のE2Eテスト
  5   |  */
  6   | 
  7   | test.describe('生産チェーン表示とインタラクション', () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto('/');
  10  |     await page.waitForSelector('.goods-card');
  11  | 
  12  |     // 商品を選択して生産チェーンを表示
  13  |     const firstCard = page.locator('.goods-card').first();
  14  |     await firstCard.click();
  15  | 
  16  |     // calculator-containerが表示されるまで待機（hiddenクラスが削除される）
  17  |     await page.waitForSelector('#calculator-container:not(.hidden)', { timeout: 10000 });
  18  |   });
  19  | 
  20  |   test('生産チェーンのSVGグラフが正しく描画される', async ({ page }) => {
  21  |     // SVGグラフが表示される
  22  |     const svg = page.locator('svg#dependency-graph');
  23  |     await expect(svg).toBeVisible();
  24  | 
  25  |     // グラフ内にノード（生産建物）が存在する
  26  |     const nodes = svg.locator('g[data-building]');
  27  |     const nodeCount = await nodes.count();
> 28  |     expect(nodeCount).toBeGreaterThan(0);
      |                       ^ Error: expect(received).toBeGreaterThan(expected)
  29  | 
  30  |     // グラフ内にエッジ（依存関係の線）が存在する可能性がある
  31  |     const edges = svg.locator('path, line');
  32  |     const edgeCount = await edges.count();
  33  |     expect(edgeCount).toBeGreaterThanOrEqual(0);
  34  |   });
  35  | 
  36  |   test('生産建物ノードにアイコンが表示される', async ({ page }) => {
  37  |     const svg = page.locator('svg#dependency-graph');
  38  | 
  39  |     // 少なくとも1つのimage要素（アイコン）が存在する
  40  |     const icons = svg.locator('image');
  41  |     await expect(icons.first()).toBeVisible();
  42  |   });
  43  | 
  44  |   test('生産レート入力フィールドが機能する', async ({ page }) => {
  45  |     const rateInput = page.locator('input#target-rate');
  46  |     await expect(rateInput).toBeVisible();
  47  | 
  48  |     // 初期値を確認
  49  |     const initialValue = await rateInput.inputValue();
  50  |     expect(parseFloat(initialValue)).toBeGreaterThanOrEqual(0);
  51  | 
  52  |     // 値を変更
  53  |     await rateInput.fill('15');
  54  |     await page.waitForTimeout(500);
  55  | 
  56  |     // 値が反映されることを確認
  57  |     const updatedValue = await rateInput.inputValue();
  58  |     expect(updatedValue).toBe('15');
  59  | 
  60  |     // グラフが再計算される（建物数が変わる可能性）
  61  |     const svg = page.locator('svg#dependency-graph');
  62  |     await expect(svg).toBeVisible();
  63  |   });
  64  | 
  65  |   test('Auto Ratioボタンが機能する', async ({ page }) => {
  66  |     const autoRatioBtn = page.locator('button#recommend-ratio-btn');
  67  | 
  68  |     if (await autoRatioBtn.isVisible()) {
  69  |       await autoRatioBtn.click();
  70  |       await page.waitForTimeout(500);
  71  | 
  72  |       // 入力値が自動計算された値に変更される
  73  |       const rateInput = page.locator('input#target-rate');
  74  |       const calculatedValue = await rateInput.inputValue();
  75  | 
  76  |       // 0より大きい値が設定される
  77  |       expect(parseFloat(calculatedValue)).toBeGreaterThan(0);
  78  |     }
  79  |   });
  80  | 
  81  |   test('建設コストと維持費が表示される', async ({ page }) => {
  82  |     // 建設コストセクション
  83  |     const buildingCost = page.locator('.building-cost, .cost-section').first();
  84  | 
  85  |     if (await buildingCost.isVisible()) {
  86  |       // コスト情報が表示される
  87  |       const costText = await buildingCost.textContent();
  88  |       expect(costText).toBeTruthy();
  89  |     }
  90  | 
  91  |     // 維持費セクション
  92  |     const maintenance = page.locator('.maintenance, .cost-section').nth(1);
  93  | 
  94  |     if (await maintenance.isVisible()) {
  95  |       const maintenanceText = await maintenance.textContent();
  96  |       expect(maintenanceText).toBeTruthy();
  97  |     }
  98  |   });
  99  | 
  100 |   test('SVGグラフのズーム機能が動作する', async ({ page }) => {
  101 |     const svg = page.locator('svg#dependency-graph');
  102 | 
  103 |     // グラフの初期transformを取得
  104 |     const initialTransform = await svg.locator('g').first().getAttribute('transform');
  105 | 
  106 |     // マウスホイールでズーム（シミュレーション）
  107 |     const svgBox = await svg.boundingBox();
  108 |     if (svgBox) {
  109 |       await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
  110 |       await page.mouse.wheel(0, -100); // ズームイン
  111 |       await page.waitForTimeout(300);
  112 | 
  113 |       // transformが変更されることを確認
  114 |       const updatedTransform = await svg.locator('g').first().getAttribute('transform');
  115 | 
  116 |       // ズームが適用されたかを確認（transformが変化する）
  117 |       // 初期値がnullの場合もあるため、存在確認
  118 |       expect(updatedTransform).toBeTruthy();
  119 |     }
  120 |   });
  121 | 
  122 |   test('SVGグラフのパン（移動）機能が動作する', async ({ page }) => {
  123 |     const svg = page.locator('svg#dependency-graph');
  124 | 
  125 |     // グラフの初期位置を取得
  126 |     const initialTransform = await svg.locator('g').first().getAttribute('transform');
  127 | 
  128 |     // 左クリックでドラッグしてパン移動
```