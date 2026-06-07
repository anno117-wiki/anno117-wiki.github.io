# 既知の問題（Known Issues）

**最終更新:** 2026-06-07

---

## ⚠️ 緊急度：高

### 1. Auto Ratio計算結果と生産チェーン表示の不一致

**症状:**
- Output / minに「4.00」を設定
- Auto Ratioボタンをクリック
- 生産チェーンのノードに「8.00x」などの不一致な数値が表示される

**再現手順:**
1. 商品（例：モザイク）を選択
2. Output / minを4.00に設定
3. Auto Ratioボタンをクリック
4. 生産チェーングラフを確認

**期待される動作:**
- Output / min入力欄とグラフ内の建物数が一致すること
- または、Auto Ratioが推奨レート（例：8.00）を設定した場合、入力欄も8.00に更新されること

**現在の動作:**
- 入力欄：4.00
- グラフ表示：8.00x（不一致）

**影響範囲:**
- すべての生産チェーン計算
- ユーザーの混乱を招く

**原因仮説:**
1. `currentRate`変数とGraphRenderer間の同期問題
2. `findRecommendedRate()`が返す値が`currentRate`に正しく設定されていない
3. GraphRendererが古い`allBuildings`データを使用している

**関連ファイル:**
- `src/ts/modules/ProductionChainView.ts` (281-287行目: Auto Ratioボタンハンドラー)
- `src/ts/modules/ProductionChainView.ts` (565-573行目: updateCalculations)
- `src/ts/modules/ProductionCalculator.ts` (189-236行目: findRecommendedRate)
- `src/ts/modules/GraphRenderer.ts` (render メソッド)

**修正方針:**
1. Auto Ratioボタンクリック後、`this.targetInput.value`と`this.currentRate`が正しく同期しているか確認
2. `updateCalculations()`呼び出し時に最新の`currentRate`が使用されているか確認
3. GraphRenderer.render()に渡される`allBuildings`が正しいレートで計算されているか確認
4. デバッグログを追加して、各ステップでの値を確認

**優先度:** 高  
**ステータス:** デバッグログ追加完了（2026-06-07）  
**次のアクション:** ブラウザでコンソールログ確認  
**関連:** `test-reports/auto-ratio-debug-summary.md`

---

## ⚠️ 緊急度：中

### 2. SVGグラフの詳細インタラクションテストの失敗

**症状:**
- Playwright E2Eテスト 5個が失敗
- すべてSVGグラフの非同期描画に関連

**失敗テスト:**
1. 生産チェーンのSVGグラフが正しく描画される
2. SVGグラフのズーム機能が動作する
3. SVGグラフのパン（移動）機能が動作する
4. 生産建物ノードをクリックすると詳細ポップアップが表示される
5. 複数地域を切り替えても状態が保持される

**原因:**
- SVG要素の非同期描画タイミング
- 待機時間（5-10秒）が不十分

**修正方針:**
- 待機条件の改善（`waitForFunction`使用）
- タイムアウト延長（10秒→20秒）
- SVG描画完了の明示的な確認

**優先度:** 中  
**ステータス:** 未修正  
**関連:** `test-reports/e2e-test-results.md`

---

## ⚠️ 緊急度：低

### 3. Vue GoodsListコンポーネントの動作確認未完了

**症状:**
- GoodsList.vueコンポーネント実装済み
- ブラウザでの動作確認が未実施

**修正方針:**
- Vite開発サーバーでブラウザテスト
- 機能フラグ`USE_VUE_GOODS_LIST`で切り替え
- 既存のGoodsListViewと動作比較

**優先度:** 低  
**ステータス:** 実装済み・テスト待ち

---

## 📝 メモ

### 今後の調査が必要な項目

1. **言語切り替え後のSVG再描画**
   - 一部のテキストが翻訳されない可能性
   - GraphRenderer内のi18n統合を確認

2. **パフォーマンス最適化**
   - 大規模な生産チェーン（10層以上）での描画速度
   - 仮想スクロールの検討

3. **モバイル対応**
   - タッチ操作の改善
   - レスポンシブデザインの最適化
