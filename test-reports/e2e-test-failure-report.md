# E2Eテスト失敗レポート

**実行日時:** 2026-06-08  
**テストコマンド:** `npx playwright test`  
**全体結果:** 21件失敗 / 44件実行（成功率: 52%）  
**前回成功率:** 96% (24/25テスト) - 2026-06-08午前

---

## 📊 実行結果サマリー

| カテゴリ | 成功 | 失敗 | 成功率 |
|---------|------|------|--------|
| 商品一覧表示 | 0 | 5 | 0% |
| 言語切り替え | 不明 | 複数 | 低 |
| 生産チェーン | 不明 | 不明 | 低 |
| ツリーUI | 不明 | 1+ | 低 |
| デバッグ機能 | 0 | 2 | 0% |

---

## 🔴 失敗したテストファイル

### 1. goods-list.spec.ts（5件失敗）
**影響度:** 高  
**失敗原因:** 旧UI参照（`.goods-grid`セレクタ）

**詳細:**
- 新UIは`.goods-tree-view`に変更済み
- 商品カード選択フローが旧実装のまま
- 検索機能のセレクタ不一致

**修正箇所:**
```typescript
// 修正前
await page.locator('.goods-grid .goods-card').first().click();

// 修正後
await page.locator('.goods-tree-view .tree-item').first().click();
```

---

### 2. language-toggle.spec.ts（複数失敗）
**影響度:** 中  
**失敗原因:** 
- `.goods-grid`セレクタ参照
- ポート3000への接続試行（正しくは5173）

**修正箇所:**
- `baseURL`を`http://localhost:5173`に統一
- セレクタを`.goods-tree-view`に変更

---

### 3. debug-auto-ratio.spec.ts（2件失敗）
**影響度:** 中  
**失敗原因:** 旧UIセレクタ参照

**修正箇所:**
- 商品選択フローの更新（ツリーUI対応）
- Auto Ratioボタンの待機条件追加

---

### 4. check-tree-ui.spec.ts（1件失敗）
**影響度:** 低  
**失敗原因:** タイムアウト（部分的）

**詳細:**
- 10/11テストが成功（90%）
- 生産チェーン連携部分のみ失敗
- 既知の問題（タイムアウト調整済みのはずだが再発）

---

### 5. その他のテストファイル
**詳細確認:** `test-results/.last-run.json`参照

---

## 🔍 主なエラーパターン

### パターン1: セレクタ不一致
```
Error: Locator('.goods-grid') not found
```
**原因:** ツリーUI実装により`.goods-grid`が削除された  
**修正:** `.goods-tree-view`に置換

---

### パターン2: ポート接続エラー
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**原因:** Vite開発サーバーはポート5173を使用  
**修正:** `playwright.config.ts`の`baseURL`を修正

---

### パターン3: 商品選択フローの変更
```
Error: click target not found
```
**原因:** ツリーUI導入により選択フローが2ステップに変更
- 旧: `.goods-card`クリック
- 新: `.tree-category`展開 → `.tree-item`クリック

**修正:** `beforeEach`でカテゴリ展開処理を追加

---

## 📝 影響を受けたセレクタ一覧

| 旧セレクタ | 新セレクタ | 影響ファイル数 |
|-----------|-----------|--------------|
| `.goods-grid` | `.goods-tree-view` | 5+ |
| `.goods-card` | `.tree-item` | 5+ |
| `.search-input` | `.tree-search input` | 2+ |
| ポート3000 | ポート5173 | playwright.config.ts |

---

## 🛠️ 修正方針

### フェーズ1: セレクタ一括置換（推定15分）
1. `goods-list.spec.ts` - 5箇所
2. `language-toggle.spec.ts` - 3箇所
3. `debug-auto-ratio.spec.ts` - 2箇所
4. `check-tree-ui.spec.ts` - 1箇所（タイムアウト調整）

### フェーズ2: 商品選択フロー修正（推定20分）
```typescript
// 共通ヘルパー関数を作成
async function selectGoodFromTree(page, goodName: string) {
  // カテゴリを展開
  await page.locator('.tree-category').first().click();
  // 商品を選択
  await page.locator(`.tree-item:has-text("${goodName}")`).click();
}
```

### フェーズ3: playwright.config.ts修正（推定5分）
```typescript
use: {
  baseURL: 'http://localhost:5173', // 3000 → 5173
}
```

### フェーズ4: E2Eテスト再実行（推定5分）
```bash
npx playwright test
```

**推定修正時間:** 45分  
**目標成功率:** 96%以上（前回レベルに回復）

---

## ✅ 再テスト計画

### ステップ1: 修正実施
- 左セッション: goods-list.spec.ts, language-toggle.spec.ts
- 中セッション: debug-auto-ratio.spec.ts, check-tree-ui.spec.ts
- 右セッション: playwright.config.ts

### ステップ2: 再実行
```bash
npx playwright test --reporter=list
```

### ステップ3: 結果検証
- 成功率96%以上 → 完了
- 成功率96%未満 → 追加調査

### ステップ4: レポート更新
- `known-issues.md`に解決済みとして記録
- 本ファイルにFINALステータス追記

---

## 📌 known-issues.mdとの整合性

### 関連する既知の問題
1. **ツリーUI描画問題** - ✅ 解決済み（2026-06-08）
2. **ツリーUI E2Eテスト安定化** - ✅ 解決済み（2026-06-08）
3. **SVGグラフE2Eテスト安定化** - ✅ 解決済み（2026-06-08）

### 新規問題として追加すべき項目
```markdown
## ⚠️ 緊急度：高

### E2Eテストのセレクタ不整合（2026-06-08）

**症状:**
- ツリーUI実装後、21件のE2Eテストが失敗
- 成功率が96% → 52%に低下

**原因:**
- テストファイルが旧UI（.goods-grid）を参照
- 開発サーバーポート変更（3000 → 5173）が未反映

**解決策:**
- セレクタ一括置換（.goods-grid → .goods-tree-view）
- playwright.config.ts修正
- 商品選択フロー2ステップ対応

**優先度:** 高  
**ステータス:** 修正中  
**担当:** 左・中・右セッション並列作業
```

---

## 📎 参考情報

- **前回成功時のコミット:** `bd4434f`
- **前回テスト実行:** 2026-06-08午前（96%成功）
- **ツリーUI実装コミット:** 確認中
- **Vite統合コミット:** 確認中

---

**次のアクション:** 左・中セッションの修正完了を待機 → E2Eテスト再実行
