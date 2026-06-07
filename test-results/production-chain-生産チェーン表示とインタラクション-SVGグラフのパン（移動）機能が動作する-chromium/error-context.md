# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-chain.spec.ts >> 生産チェーン表示とインタラクション >> SVGグラフのパン（移動）機能が動作する
- Location: tests\e2e\production-chain.spec.ts:122:7

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not null
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
  129 |     const svgBox = await svg.boundingBox();
  130 |     if (svgBox) {
  131 |       const startX = svgBox.x + 100;
  132 |       const startY = svgBox.y + 100;
  133 | 
  134 |       await page.mouse.move(startX, startY);
  135 |       await page.mouse.down({ button: 'left' });
  136 |       await page.mouse.move(startX + 50, startY + 50);
  137 |       await page.mouse.up({ button: 'left' });
  138 |       await page.waitForTimeout(300);
  139 | 
  140 |       // transformが変更されることを確認
  141 |       const updatedTransform = await svg.locator('g').first().getAttribute('transform');
  142 | 
  143 |       // パンが適用されたかを確認
> 144 |       expect(updatedTransform).not.toBe(initialTransform);
      |                                    ^ Error: expect(received).not.toBe(expected) // Object.is equality
  145 |     }
  146 |   });
  147 | 
  148 |   test('生産建物ノードをクリックすると詳細ポップアップが表示される', async ({ page }) => {
  149 |     const svg = page.locator('svg#dependency-graph');
  150 | 
  151 |     // 最初のノード（アイコン）をクリック
  152 |     const firstIcon = svg.locator('image').first();
  153 |     await firstIcon.click();
  154 |     await page.waitForTimeout(500);
  155 | 
  156 |     // 詳細ポップアップが表示される
  157 |     const popup = page.locator('.info-container, .detail-popup');
  158 | 
  159 |     if (await popup.count() > 0) {
  160 |       await expect(popup.first()).toBeVisible();
  161 | 
  162 |       // ポップアップ内に情報が含まれることを確認
  163 |       const popupText = await popup.first().textContent();
  164 |       expect(popupText).toBeTruthy();
  165 |     }
  166 |   });
  167 | 
  168 |   test('言語切り替え後も生産チェーンが正しく表示される', async ({ page }) => {
  169 |     // 日本語に切り替え
  170 |     const languageToggle = page.locator('button#language-toggle-btn');
  171 |     await languageToggle.click();
  172 |     await page.waitForTimeout(500);
  173 | 
  174 |     // SVGグラフが引き続き表示される
  175 |     const svg = page.locator('svg#dependency-graph');
  176 |     await expect(svg).toBeVisible();
  177 | 
  178 |     // ノードが存在する
  179 |     const nodes = svg.locator('g[data-building]');
  180 |     const nodeCount = await nodes.count();
  181 |     expect(nodeCount).toBeGreaterThan(0);
  182 | 
  183 |     // 言語ボタンが日本語表示になっていることを確認
  184 |     const buttonText = await languageToggle.textContent();
  185 |     expect(buttonText).toContain('日本語');
  186 |   });
  187 | });
  188 | 
```