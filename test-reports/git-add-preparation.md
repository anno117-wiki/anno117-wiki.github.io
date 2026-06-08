# Git Add準備 - 未トラックファイル整理

作成日: 2026-06-08

## 概要

コミット前に未トラックファイルをカテゴリ別に整理し、コミット対象を明確化。

---

## カテゴリ別ファイルリスト

### 1. Vueコンポーネント（8ファイル）- **コミット対象**

```
src/components/GoodsTreeView.vue
src/components/SettingsPanel.vue
src/components/SettingsPanelRoot.vue
src/components/TreeAppRoot.vue
src/components/TreeCategory.vue
src/components/TreeItem.vue
src/components/TreeSearch.vue
src/ts/tree-app.ts
```

**用途:** ツリーUI実装の中核コンポーネント

---

### 2. TypeScriptモジュール（1ファイル）- **コミット対象**

```
src/ts/modules/PanelResizer.ts
```

**用途:** パネル幅リサイズ機能

---

### 3. データファイル（2項目）- **コミット対象**

```
src/assets/data/categories.json
src/data/
```

**用途:** 商品カテゴリデータ

---

### 4. E2Eテストファイル（5ファイル）- **コミット対象**

```
tests/e2e/check-console-logs.spec.ts
tests/e2e/check-tree-ui.spec.ts
tests/e2e/debug-auto-ratio.spec.ts
tests/e2e/tree-navigation.spec.ts
tests/e2e/vite-server-test.spec.ts
```

**用途:** ツリーUI・デバッグ機能のE2Eテスト

---

### 5. テストレポート（4ファイル）- **コミット対象**

```
test-reports/bug-fix-verification.md
test-reports/svg-test-completion-summary.md
test-reports/svg-test-fix-report.md
test-reports/tree-ui-integration-issues.md
```

**用途:** 開発履歴・問題追跡ドキュメント

---

### 6. ツール（1ファイル）- **コミット対象**

```
tools/auto-categorize-goods.ts
```

**用途:** 商品自動分類ツール

---

### 7. test-results/（多数）- **コミット不要（.gitignore対象）**

```
test-results/check-tree-ui-TreeUI表示確認-chromium/
test-results/debug-auto-ratio-*.../
test-results/goods-list-*.../
test-results/language-toggle-*.../
test-results/region-toggle-*.../
test-results/tree-navigation-*.../
test-results/vite-tree-ui-success.png
```

**理由:** テスト実行結果は一時ファイル、git管理不要

---

### 8. playwright-report/data/（多数）- **コミット不要（.gitignore対象）**

```
playwright-report/data/*.md
playwright-report/data/*.png
```

**理由:** Playwrightレポートデータは自動生成、git管理不要

---

### 9. その他（1ファイル）- **コミット不要**

```
workspace.code-workspace
```

**理由:** IDEワークスペース設定は個人環境依存

---

## コミット対象まとめ

**合計: 21ファイル**

| カテゴリ | ファイル数 |
|---------|----------|
| Vueコンポーネント | 8 |
| TypeScriptモジュール | 1 |
| データファイル | 2 |
| E2Eテストファイル | 5 |
| テストレポート | 4 |
| ツール | 1 |

---

## 推奨コミット分割

### コミット1: ツリーUI実装
- Vueコンポーネント（8ファイル）
- データファイル（2ファイル）
- ツール（1ファイル）

### コミット2: E2Eテスト追加
- E2Eテストファイル（5ファイル）

### コミット3: TypeScript改善 + ドキュメント
- TypeScriptモジュール（1ファイル）
- テストレポート（4ファイル）

---

## .gitignore確認

以下のパターンが.gitignoreに含まれているか確認:

```
test-results/
playwright-report/
*.code-workspace
```

---

## 次のアクション

1. .gitignoreを確認・更新
2. コミット対象ファイルを git add
3. 3段階でコミット作成
