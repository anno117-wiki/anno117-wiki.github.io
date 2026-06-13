# フェーズ7 引き継ぎ書（忍者セッション 2026-06-13）

## 作業概要

第4段 wiki 検証・残骸整理・vite.config.ts 修正を実施した。

## 完了した作業

### 任A: 第4段 wiki 検証
- `bun run build:wiki` → exit code=0（3.44s）
- config.ts: base='/'、ignoreDeadLinks設定、nav計算機リンク（/calculator/）すべて正常
- index.md / getting-started.md / goods.md: 誘導リンク健全、言語ルール準拠

### 任B: 旧残骸整理
- ルート `vite.config.ts`：現役（apps/calculator に独自 vite.config.ts なし）
- `.bak` ファイル：プロジェクト全体でゼロ件
- **修正実施**：`outDir: 'docs'` → `'docs/calculator'` に変更（家老許可済み）
  - コミット: `a002aca fix: 単独build時のwiki上書き防止（calculator outDir修正）`

## 現在の git 状態（注意事項）

`bun run build:vite`（ルート）実行により `docs/` 配下のwikiビルド成果物が削除状態になっている。

```
git status: docs/ 配下に大量の deleted ファイル（wiki成果物）
```

**次回セッション開始前に `bun run build:site`（一体ビルド）を実行して docs/ を再生成すること。**

## 残作業（次の一手）

| 優先度 | タスク |
|--------|--------|
| 高 | `bun run build:site` で docs/ 再生成・コミット |
| 高 | E2E (Playwright) 検証：モノレポ移行後の動作確認 |
| 中 | フォント警告修正（NotoSerif.ttf が build 時に解決されない） |
| 低 | 第6段: CLAUDE.md 最終更新 |

## E2E 検証の注意点

- `bun run test` 前に dev サーバー起動が必要（`bun run dev`）
- モノレポ移行後に Playwright のセレクタ・URLが変わった可能性あり
- 過去の成功率は 87.5%（48%→87.5% 改善済み、残り5件は既知問題）

## ビルドコマンド早見表

```bash
bun run build:wiki   # wiki のみ（exit code=0 確認済み）
bun run build:vite   # calculator のみ → docs/calculator/
bun run build:site   # 一体ビルド（推奨）→ docs/
bun run dev          # calculator 開発サーバー（port 5173）
bun run dev:wiki     # wiki 開発サーバー
bun run test         # E2E テスト
```
