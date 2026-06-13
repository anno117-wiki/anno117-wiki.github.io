# フェーズ7 引き継ぎ書（第5段完了後）

作成日: 2026-06-13 ／ 作成: 侍（代理指揮）

---

## 現状の正確な把握（実コマンド確認済み）

### git状態
- ブランチ: master、未コミット変更なし
- 最新コミット: `52a035e` fix: wiki ソース本体を追跡対象に救出

### ビルド確認
- `bun run build` → exit0（calculator単独、docs/calculator/ へ出力）
- `bun run build:site` → exit0（wiki+calculator一体合成、docs/ へ出力）

### 配信構造（docs/）
```
docs/
├── index.html          ← wiki トップ
├── 404.html
├── assets/
├── guide/
├── wiki/
├── vp-icons.css
├── .nojekyll
└── calculator/         ← 計算機 (/calculator/)
    ├── index.html
    ├── assets/
    ├── data/
    ├── fonts/
    ├── i18n/
    ├── icons/
    ├── images/
    └── productions/
```

---

## 完了済み作業

| 段 | 内容 | コミット |
|---|---|---|
| 第0段 | ゴミファイル削除・git整理 | bd8d266 |
| 第3段 | calculator アプリ化 + BASE_URL化 | d62b2aa |
| 第5段 | 一体ビルドスクリプト | 5ef1eac |
| 修正 | vite.config.ts outDir修正（単独build事故防止）| a002aca |
| 修正 | wiki .gitignore精緻化・ソース追跡 | 52a035e |

---

## 残作業

### 優先度高

1. **E2E playwright 検証**
   - `bun run test` を実行して既存テストが通るか確認
   - テストの baseURL が calculator のサブパス（/calculator/）に対応しているか要確認
   - playwright.config.ts の baseURL を `process.env.E2E_BASE ?? 'http://localhost:5173'` に

2. **フォント警告修正**（軽微）
   - `NotoSerif.ttf referenced in ... didn't resolve at build time` 警告
   - CSS の @font-face 参照パスを確認・修正

### 優先度中

3. **第6段 CLAUDE.md 最終更新**（200行以内厳守）
   - 詳細アーキテクチャを `docs-notes/architecture-monorepo.md` に分離
   - フェーズ7完了を正式記録

4. **wiki コンテンツ充実**
   - 現状はスケルトン（guide/index.md等）のみ
   - Anno 117 攻略情報の追記

---

## 重要な設計メモ

- `bun run build` → calculator のみ（単独確認用）、outDir=docs/calculator/
- `bun run build:site` → wiki+calculator 一体合成（デプロイ用）
- calculator の base は build:site 時のみ `/calculator/`（scripts/build-site.ts が Vite JS API で上書き）
- `@anno/shared` の fetch文字列（`./assets/...` 相対パス）は変更禁止（publicDir契約）
- I18nManager・GoodsTreeView は BASE_URL 化済み

---

## 次回着手時の確認コマンド

```bash
git status
bun run build        # exit0 確認
bun run build:site   # exit0 確認
bun run test         # E2E 状況確認
```
