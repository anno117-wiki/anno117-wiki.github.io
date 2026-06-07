# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: region-toggle.spec.ts >> 地域切り替え機能 >> 複数地域を切り替えても状態が保持される
- Location: tests\e2e\region-toggle.spec.ts:70:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "10"
Received: "1"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - img "Anno 117 Logo" [ref=e3]
    - button "Toggle Language" [ref=e4] [cursor=pointer]: EN
    - button "Toggle Region" [active] [ref=e5] [cursor=pointer]:
      - img "Region Icon" [ref=e6]
      - generic [ref=e7]: Albion
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
                - generic [ref=e71]: Mud
                - generic [ref=e72]: 1.50x
              - generic [ref=e73]:
                - generic [ref=e76]: Resin
                - generic [ref=e77]: 1.00x
          - generic [ref=e78]:
            - generic [ref=e79]:
              - strong [ref=e80]: "Building Cost:"
              - generic [ref=e81]:
                - generic [ref=e82]:
                  - img "Timber" [ref=e83]
                  - generic [ref=e84]: "10"
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
                  - img "Mercators" [ref=e95]
                  - generic [ref=e96]: "7"
                - generic [ref=e97]:
                  - img "Wader" [ref=e98]
                  - generic [ref=e99]: "6"
                - generic [ref=e100]:
                  - img "Charcoal" [ref=e101]
                  - generic [ref=e102]: 0.25x
  - contentinfo [ref=e103]:
    - paragraph [ref=e104]:
      - strong [ref=e105]: "Tip:"
      - text: On touch, drag with one finger to pan and pinch to zoom. On desktop, hold right mouse button to pan and use the mouse wheel to zoom.
    - paragraph [ref=e106]:
      - text: Developed by AgentQuack. Not affiliated with Ubisoft or Ubisoft Mainz. All trademarks are the property of their respective owners. Visit the
      - link "GitHub repository" [ref=e107] [cursor=pointer]:
        - /url: https://github.com/agentquackyt/Anno117Calculator
      - text: for source code and updates.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * 地域切り替え機能のE2Eテスト
  5   |  */
  6   | 
  7   | test.describe('地域切り替え機能', () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto('/');
  10  |     await page.waitForSelector('.goods-card');
  11  | 
  12  |     // 商品を選択して生産チェーンを表示
  13  |     const firstCard = page.locator('.goods-card').first();
  14  |     await firstCard.click();
  15  | 
  16  |     // calculator-containerが表示されるまで待機
  17  |     await page.waitForSelector('#calculator-container:not(.hidden)', { timeout: 10000 });
  18  |   });
  19  | 
  20  |   test('地域切り替えボタンが表示される', async ({ page }) => {
  21  |     // 地域名を含むボタンまたはトグルを確認
  22  |     const regionButtons = page.locator('button, .toggle-button').filter({ hasText: /Latium|Albion|Mesopotamia/i });
  23  | 
  24  |     // 少なくとも1つの地域ボタンが表示される
  25  |     const count = await regionButtons.count();
  26  |     expect(count).toBeGreaterThan(0);
  27  |   });
  28  | 
  29  |   test('地域を切り替えると生産チェーンが更新される', async ({ page }) => {
  30  |     // 初期状態のグラフを取得
  31  |     const initialGraph = await page.locator('svg#dependency-graph').innerHTML();
  32  | 
  33  |     // 地域切り替えボタンを探す（例：Albion）
  34  |     const regionButton = page.locator('button, .toggle-button').filter({ hasText: /Albion/i }).first();
  35  | 
  36  |     if (await regionButton.isVisible()) {
  37  |       await regionButton.click();
  38  | 
  39  |       // グラフが再描画されるまで待機
  40  |       await page.waitForTimeout(1000);
  41  | 
  42  |       // グラフの内容が変更されたことを確認（完全一致しないことを確認）
  43  |       const updatedGraph = await page.locator('svg#dependency-graph').innerHTML();
  44  | 
  45  |       // 地域によって生産チェーンが変わる場合は内容が異なるはず
  46  |       // ただし、同じ商品が両地域で利用可能な場合は同じになる可能性もある
  47  |       expect(updatedGraph).toBeTruthy();
  48  |     }
  49  |   });
  50  | 
  51  |   test('地域フィルターが正しく機能する', async ({ page }) => {
  52  |     // Latium専用の商品があればそれを選択
  53  |     await page.goto('/');
  54  |     await page.waitForSelector('.goods-card');
  55  | 
  56  |     // 地域フィルターボタンを探す
  57  |     const latiumFilter = page.locator('button, .toggle-button').filter({ hasText: /Latium/i }).first();
  58  | 
  59  |     if (await latiumFilter.isVisible()) {
  60  |       await latiumFilter.click();
  61  |       await page.waitForTimeout(500);
  62  | 
  63  |       // フィルター後も商品カードが表示される
  64  |       const goodsCards = page.locator('.goods-card');
  65  |       const count = await goodsCards.count();
  66  |       expect(count).toBeGreaterThan(0);
  67  |     }
  68  |   });
  69  | 
  70  |   test('複数地域を切り替えても状態が保持される', async ({ page }) => {
  71  |     // 生産レート入力があれば値を設定
  72  |     const rateInput = page.locator('input#target-rate');
  73  | 
  74  |     if (await rateInput.isVisible()) {
  75  |       await rateInput.fill('10');
  76  | 
  77  |       // 地域を切り替え
  78  |       const regionButtons = page.locator('button, .toggle-button').filter({ hasText: /Latium|Albion|Mesopotamia/i });
  79  | 
  80  |       if (await regionButtons.first().isVisible()) {
  81  |         await regionButtons.first().click();
  82  |         await page.waitForTimeout(500);
  83  | 
  84  |         // 入力値が保持されていることを確認
  85  |         const inputValue = await rateInput.inputValue();
> 86  |         expect(inputValue).toBe('10');
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  87  |       }
  88  |     }
  89  |   });
  90  | 
  91  |   test('言語切り替え後も地域選択が保持される', async ({ page }) => {
  92  |     // 地域ボタンをクリック
  93  |     const regionButton = page.locator('button, .toggle-button').filter({ hasText: /Mesopotamia/i }).first();
  94  | 
  95  |     if (await regionButton.isVisible()) {
  96  |       await regionButton.click();
  97  |       await page.waitForTimeout(500);
  98  | 
  99  |       // 言語を切り替え
  100 |       const languageToggle = page.locator('button').filter({ hasText: /JA|日本語/i }).first();
  101 |       await languageToggle.click();
  102 |       await page.waitForTimeout(500);
  103 | 
  104 |       // 地域選択が保持されていることを確認（アクティブクラスなどで判定）
  105 |       // 実装に応じて調整が必要
  106 |       const activeRegion = page.locator('button.active, .toggle-button.active').filter({ hasText: /メソポタミア|Mesopotamia/i });
  107 | 
  108 |       if (await activeRegion.count() > 0) {
  109 |         await expect(activeRegion.first()).toBeVisible();
  110 |       }
  111 |     }
  112 |   });
  113 | });
  114 | 
```