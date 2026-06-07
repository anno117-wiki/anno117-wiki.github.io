# Auto Ratio デバッグログ実装レポート

**実施日:** 2026-06-07  
**対応:** 既知の問題（緊急度：高）- Auto Ratio計算結果と生産チェーン表示の不一致  
**アプローチ:** 改善案B（最小限の変更）

---

## 📋 実装内容

### 追加したデバッグログ

#### 1. ProductionChainView.ts

**Auto Ratioボタンクリック時（281-295行目）:**
```typescript
this.recommendButton?.addEventListener('click', () => {
    console.debug('[Auto Ratio] Button clicked');
    console.debug('[Auto Ratio] Current rate before:', this.currentRate);

    const recommended = this.calculator.findRecommendedRate(recipe);
    console.debug('[Auto Ratio] Recommended rate:', recommended);

    this.currentRate = recommended;
    if (this.targetInput) {
        this.targetInput.value = recommended.toFixed(2);
        console.debug('[Auto Ratio] Input field updated to:', this.targetInput.value);
    }

    this.updateCalculations(recipe);
});
```

**updateCalculationsメソッド（572-582行目）:**
```typescript
updateCalculations(recipe: Goods): void {
    if (!recipe) return;
    const rate = typeof this.currentRate === 'number' ? this.currentRate : 1;
    console.debug('[updateCalculations] Using rate:', rate, 'for good:', recipe.id);

    const workingRecipe = this.calculator.cloneRecipe(recipe);
    const allBuildings = this.calculator.collectAllBuildings(workingRecipe, rate, {});
    console.debug('[updateCalculations] Buildings calculated:', allBuildings);

    this.updateBuildingCounts(allBuildings);
    this.updateCostSummary(allBuildings);
    this.graphRenderer.render(recipe, allBuildings);
}
```

#### 2. ProductionCalculator.ts

**findRecommendedRateメソッド（189-240行目）:**
```typescript
findRecommendedRate(productionData: Goods): number {
    console.debug('[findRecommendedRate] Starting for good:', productionData.id);

    const minRateForMainBuilding = this.getMinimumRateForMainBuilding(productionData);
    console.debug('[findRecommendedRate] Minimum rate for main building:', minRateForMainBuilding);

    if (minRateForMainBuilding > MAX_RECOMMENDED_RATE) {
        console.debug('[findRecommendedRate] Min rate exceeds MAX, returning:', this.roundRate(minRateForMainBuilding));
        return this.roundRate(minRateForMainBuilding);
    }

    // ... 計算ロジック ...

    // 燃料建物を除くすべての建物が整数のレートが見つかればそれを返す（優先度：高）
    if (firstIntegerRate !== null) {
        console.debug(`[findRecommendedRate] ✅ Perfect integer rate found (excluding fuel): ${firstIntegerRate}`);
        console.debug('[findRecommendedRate] Returning firstIntegerRate (priority: high)');
        return firstIntegerRate;
    }

    // 整数レートが見つからない場合は、誤差が最小のレートを返す（優先度：低）
    console.debug(`[findRecommendedRate] ⚠️ No perfect integer rate. Best candidate: ${bestCandidateRate}`);
    console.debug(`[findRecommendedRate] Max error: ${bestCandidateError.toFixed(4)}, Total error: ${bestCandidateTotalError.toFixed(4)}`);
    return this.roundRate(bestCandidateRate);
}
```

#### 3. UIツールチップ

**Auto Ratioボタン（349行目）:**
```html
<button 
    id="recommend-ratio-btn" 
    type="button" 
    class="recommend-button" 
    title="整数建物数になる最適レートを自動設定します"
>
    Auto Ratio
</button>
```

---

## 🔍 デバッグログの読み方

### 正常な動作例

**ユーザー操作:**
1. モザイク（mosaics）を選択
2. Output / minを「4.00」に設定
3. Auto Ratioボタンをクリック

**期待されるコンソール出力:**
```
[Auto Ratio] Button clicked
[Auto Ratio] Current rate before: 4.00
[findRecommendedRate] Starting for good: mosaics
[findRecommendedRate] Minimum rate for main building: 0.5
[findRecommendedRate] ✅ Perfect integer rate found (excluding fuel): 8.00
[findRecommendedRate] Returning firstIntegerRate (priority: high)
[Auto Ratio] Recommended rate: 8.00
[Auto Ratio] Input field updated to: 8.00
[updateCalculations] Using rate: 8.00 for good: mosaics
[updateCalculations] Buildings calculated: {
    mosaics: 8.00,
    clay: 4.00,
    clay_pit: 2.00,
    ...
}
```

**解釈:**
1. ユーザーが設定した4.00が、Auto Ratioにより8.00に上書きされる
2. これは**仕様通りの動作**（燃料除外で整数比率になる最適レート）
3. 入力欄とグラフが**一致している**ことを確認できる

### 不一致が発生する場合

**想定される問題パターン:**
```
[Auto Ratio] Recommended rate: 8.00
[Auto Ratio] Input field updated to: 8.00
[updateCalculations] Using rate: 4.00 ← ❌ 不一致！
```

**考えられる原因:**
- `this.currentRate`が正しく更新されていない
- 非同期タイミング問題
- 他のイベントハンドラーによる上書き

---

## 📊 期待される効果

### 1. 問題の原因特定

デバッグログにより、以下を確認できる:
- ✅ `findRecommendedRate()`が返す値
- ✅ `this.currentRate`の更新タイミング
- ✅ `updateCalculations()`に渡されるrate値
- ✅ `allBuildings`の計算結果

### 2. ユーザーへの説明

- ✅ ツールチップで「Auto Ratioは最適レートを自動設定する」と明記
- ✅ ユーザーの手動入力が上書きされることを予測可能に

### 3. 将来のバグ修正の基盤

- ✅ ログを元に、改善案A（ユーザーフレンドリー）への移行が容易に
- ✅ 新しい機能追加時のデバッグが簡単に

---

## ✅ 検証方法

### ブラウザでの手動確認

1. 開発者ツールのコンソールを開く
2. 商品を選択（例：モザイク）
3. Output / minを任意の値に設定
4. Auto Ratioボタンをクリック
5. コンソールログを確認

**確認ポイント:**
- ✅ ログが正しい順序で出力される
- ✅ 各ステップの値が一致している
- ✅ 入力欄の値とグラフの表示が一致している

### E2Eテストでの確認

現在のE2Eテストはコンソールログを検証していないため、以下を追加することを推奨:

```typescript
test('Auto Ratioのデバッグログが正しく出力される', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'debug' && msg.text().includes('[Auto Ratio]')) {
            consoleLogs.push(msg.text());
        }
    });

    await page.goto('/');
    const firstCard = page.locator('.goods-card').first();
    await firstCard.click();
    await page.waitForSelector('#calculator-container:not(.hidden)');

    const autoRatioBtn = page.locator('button#recommend-ratio-btn');
    await autoRatioBtn.click();

    await page.waitForTimeout(500);

    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(consoleLogs[0]).toContain('Button clicked');
});
```

---

## 🎯 次のステップ

### 即座に実施（推奨）

1. ✅ ブラウザで動作確認
2. ⬜ コンソールログをスクリーンショットで記録
3. ⬜ 不一致が解消されているか確認

### 中期的な対応

1. ⬜ E2Eテストにコンソールログ検証を追加
2. ⬜ 必要に応じて改善案A（ユーザーフレンドリー）への移行を検討
3. ⬜ UIに「推奨レート：8.00」などの表示を追加

### 長期的な改善

1. ⬜ Auto Ratioのアルゴリズム改善
2. ⬜ ユーザー設定で「手動入力を尊重」オプション追加
3. ⬜ ビジュアルフィードバック（推奨レートのハイライト表示）

---

## 📝 結論

**デバッグログとツールチップの追加により、Auto Ratio機能の動作が可視化されました。**

- ✅ 計算過程の各ステップを追跡可能
- ✅ ユーザーへの説明を追加
- ✅ 最小限の変更でリスクを低減

**推奨アクション:**
1. ブラウザでコンソールログを確認
2. 不一致が解消されていることを確認
3. 必要に応じて改善案Aへの移行を検討

---

**関連ドキュメント:**
- `docs/bug-fix-plan.md` - バグ修正計画
- `test-reports/known-issues.md` - 既知の問題リスト

**署名:** Claude Sonnet 4.5  
**日付:** 2026-06-07
