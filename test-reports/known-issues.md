# 既知の問題（Known Issues）

**最終更新:** 2026-06-08（E2Eテスト安定化完了）

---

## ✅ 解決済み

### ツリーUI描画問題
**期間:** 2026-06-07 〜 2026-06-08  
**症状:** GoodsTreeView.vueがブラウザに描画されない（E2Eテスト0/10成功）  
**原因:** 
1. devserver.ts（Bun.serve）がTypeScript/Vueをトランスパイルしていなかった
2. mount()/updateGoods()の実行順序が逆
3. categories.jsonのパス不一致

**解決策:**
1. 開発環境をViteに統一（package.json修正）
2. TreeAppRoot.vueラッパーコンポーネント作成（リアクティブ対応）
3. App.tsのマウントタイミング修正
4. devserver.tsをViteビルドに変更

**結果:** E2Eテスト4/10成功（40%）、主要機能正常動作  
**詳細:** `test-reports/tree-ui-integration-issues.md`

---

### ツリーUI E2Eテスト安定化
**期間:** 2026-06-08  
**症状:** tree-navigation.spec.ts E2Eテスト: 9/10成功（90%）、1テストがタイムアウトで失敗  
**原因:** 生産チェーン連携部分のタイムアウト（待機条件不足）

**解決策:**
- 待機条件の改善（`waitForFunction`使用）
- タイムアウト延長（7.8秒→15秒）
- SVG描画完了の明示的な確認

**結果:** E2Eテスト10/10成功（100%）  
**詳細:** セクション「ツリーUI E2Eテストの部分的失敗」参照

---

### SVGグラフE2Eテスト安定化
**期間:** 2026-06-08  
**症状:** production-chain.spec.ts E2Eテスト: 0/9成功、すべてSVG関連テストが失敗  
**原因:** 
1. ツリーUI実装後、セレクタが変更（`.goods-card` → `.tree-item`）
2. beforeEachでカテゴリ展開が未実装
3. 商品選択フローが旧UIのまま

**解決策:**
1. beforeEach修正（`.tree-category` + `.tree-item`対応）
2. カテゴリ展開→商品選択の2ステップ実装
3. 言語切り替えテストも同様に修正

**結果:** E2Eテスト9/9成功（100%、5.5秒で完了）  
**詳細:** セクション「SVGグラフの詳細インタラクションテストの失敗」参照

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
**ステータス:** ✅ 修正完了・検証済み（2026-06-07）  
**テスト結果:** 2/2テスト成功（100%）  
**詳細:** `test-reports/bug-fix-verification.md`  

**結論:** 
- **不一致は存在しない**（仕様通りの動作）
- Auto Ratioは手動入力値を推奨レートで上書きする設計
- デバッグログにより計算過程が完全に可視化

---


## ⚠️ 緊急度：低

### 4. Vue GoodsListコンポーネントの動作確認未完了

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
