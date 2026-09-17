# Anno117 Add Production Chain（生産チェーン追加・更新ワークフロー）

## Overview

Anno 117統合Wiki（`C:\Users\kojif\Desktop\anno_db2\`）に新しい生産チェーンJSONを追加、または既存チェーンを更新し、一覧再生成・型チェック・ビルド・E2Eまで検証を完了させる標準手順。数値の一次ソースは `_local/anno-official-data/official_master.csv`（GUID→公式日英名）と `assets.xml` であり、情報源不明の数値をタグなしで記載することは禁止されている。

## Parameters

- **good_id** (required): 追加・更新する生産物の英語スネークケースID（例: `bread`、Albion版は `bread_albion`）
- **data_source** (required): 数値の情報源（`official_master.csv` の該当GUID、anno-calculator公式データ、または「実機確認」のいずれか）
- **repo_root** (optional, default: "C:\Users\kojif\Desktop\anno_db2"): プロジェクトルート

**Constraints for parameter acquisition:**
- If all required parameters are already provided, You MUST proceed to the Steps
- If any required parameters are missing, You MUST ask for them before proceeding
- When asking for parameters, You MUST request all parameters in a single prompt
- When asking for parameters, You MUST use the exact parameter names as defined

## Steps

### 1. データソース確認
公式データと名称対応表で正確な名称・数値を確認する。

**Constraints:**
- You MUST verify names and GUIDs against `_local/anno-official-data/official_master.csv` when available, because 公式データで確認できる名称・数値の推測は禁止されているため
- You MUST check `production_JP_to_EN.json` and `words_JP_to_EN.json` for name mappings（日本語表示名はJSONに直書きせず対応表で解決する）
- If the value cannot be confirmed, You MUST mark it as 「公式名未確定・実機確認待ち」 and record it in `docs-notes/handover-next-session.md`

### 2. JSONファイル作成・編集
`packages/shared/public/productions/<good_id>.json` を作成・編集する。

**Constraints:**
- You MUST follow the existing schema（典型例: `packages/shared/public/productions/bread.json`）: `id, name, type, guid, time, needs_fuel, building_cost{...}, maintanance_cost{...}, input[...], region[...]`
- You MUST spell the field `maintanance_cost` as-is because 既存スキーマ・ローダーがこの綴りを前提としているため（正しい英語綴りに直すと読み込みが壊れる）
- You MUST add `"start_of_chain": true` to chain-end raw-material nodes
- You MUST use English snake_case for `id`, filename, and `type`（内部キーは英語、絶対順守）
- You MUST NOT add absolute fetch paths (e.g. `/i18n/...`) because GitHub Pages配信では `import.meta.env.BASE_URL` プレフィックスが必須のため

### 3. 一覧の再生成
集約リストを再生成する。

**Constraints:**
- You MUST run `bun run generate`（= `tools/generate-goods-list.ts` + `tools/generate-items-list.ts`）to update `packages/shared/public/productions/list.json`
- You MUST NOT edit `list.json` by hand because 自動生成物のため次回生成で消えるため

### 4. 型チェックとビルド
検証を実行し、exit code を根拠に成否を判定する。

**Constraints:**
- You MUST run `bunx vue-tsc --noEmit` and confirm exit code 0
- You MUST build with `bun run build:site` and You MUST NOT use `bun run build` because 後者は計算機のみビルドし wiki が `docs/` から消えるため
- After build, You MUST run `ls docs/` and confirm wiki files exist
- You MUST NOT report success based on目視 alone because 成否は実コマンドの exit code / 出力を根拠とする運用のため

### 5. E2Eテスト
Playwright E2E を実行する。

**Constraints:**
- You MUST run `bun run test` and check the pass count against the known baseline（直近基準: 39/40）
- If new failures appear, You MUST investigate before committing; You MUST NOT commit with regressions because デプロイは `docs/` 配信で即公開されるため

### 6. コミット
変更をコミットする。

**Constraints:**
- You MUST include build artifacts (`docs/calculator/assets` 等) in the same `feat:`/`fix:` commit（配信物同梱ルール）
- You MUST separate management files (CLAUDE.md・引き継ぎ・settings) into `chore:`/`docs:` commits
- You SHOULD keep one concern per commit and MUST NOT join multiple topics with `・` in the title because コミット粒度ルールで禁止されているため

## Examples

### Example 1: 新規Albionチェーン追加
**Input:**
- good_id: "mead_albion"
- data_source: "official_master.csv GUID 12345"

**Expected Behavior:**
official_master.csv で名称確認 → `productions/mead_albion.json` 作成（region: Albion）→ `bun run generate` → `bunx vue-tsc --noEmit` → `bun run build:site` → `ls docs/` → `bun run test` → `feat:` コミット。

## Troubleshooting

### ビルド後にwikiページが消えた
`bun run build` を使っていないか確認する。必ず `bun run build:site` を使い、`ls docs/` で確認する。

### 建物効果の数値が2倍になる
集計に AttributeProvider を含めていないか確認する。集計対象は FunctionalEffects のみ（過去の「建物効果2倍バグ」の原因）。

### VitePressで太字が効かない
日本語文字直後の `**太字**` は効かない。`<strong>` タグを使う。

### ツール出力が文字化けする
`Format-Table` や `Get-Content -Raw` を避け、PowerShellの単一値出力（例 `(Get-Item path).Length`）で確認する。ファイル実在確認は Glob を優先する。
