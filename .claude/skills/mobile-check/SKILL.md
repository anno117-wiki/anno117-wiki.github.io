---
name: mobile-check
description: Anno 117攻略Wiki をスマホの画面サイズで開き、横にはみ出す表・横にずれるページが無いかを数値で確かめ、見つかったものをサイトの「スマホの表」の方針に沿って直す標準手順。表やCSSを変えたとき、新しいページや表を足したとき、「スマホで見やすいか確かめて」と頼まれたときに使う。
---

# Anno117 Mobile Check（スマホ表示の確認）

## Overview

閲覧はスマホからが多いため、サイトの表は**スマホで横にスクロールさせない**方針にしている（PC の表示は変えない）。
このスキルは `bun run check:mobile`（`scripts/check-mobile.ts`）で全ページを iPhone 13 の画面サイズで開き、

- 本文の表ごとに「見えている幅」と「中身の幅」の差（はみ出し）
- ページ全体の横ずれ

を数え、はみ出しがあれば場所を挙げて、方針に沿って直す。方針の詳細は引き継ぎ書 `docs-notes/handover-next-session.md` の「注意点 > スマホの表」、要約は CLAUDE.md の「モバイルCSS設計メモ」。

## Parameters

- **target** (optional, default: 全ページ): 調べるページ。URL の一部（例: `/wiki/patrons`、`/guide/`）
- **device** (optional, default: "iPhone 13"): Playwright の端末名（例: `Pixel 7`、`iPhone SE`）
- **fix** (optional, default: true): はみ出しを見つけたら直すか。false なら報告だけ

**Constraints for parameter acquisition:**
- 全て省略できる。省略されたら既定値で進める（ユーザーに聞き返さない）

## Steps

### 1. サイトを作り直す

**Constraints:**
- You MUST run `bun run build:site` first when ソース（`apps/wiki/docs/`）を変えた後, because check:mobile は `docs/` の生成物を調べるため。変えていなければ省いてよい
- You MUST confirm the `[5/5]` の検査が OK で終わったことを実出力で確かめる（CLAUDE.md の決まり）
- Windows 以外でビルドしたら、`git status` に `D docs/icons/...` が無いことも見る（引き継ぎ書「ビルド」節）

### 2. スマホ表示を測る

```bash
bun run check:mobile                                   # 全ページ・iPhone 13
bun run check:mobile -- --page /wiki/patrons           # ページを絞る
bun run check:mobile -- --device "Galaxy S8"           # 幅360pxの端末でも見る
bun run check:mobile -- --screenshots <フォルダ>        # はみ出した表を撮る
bun run check:mobile -- --all                          # 全ての表の幅を一覧する
```

**Constraints:**
- You MUST report the 実際の出力（OK の行、または [NG] の行）をそのまま根拠にする。目視だけで「収まった」と言わない
- 1回に約1分かかる（全36ページ）。ページを絞れば速い
- You MUST check both `iPhone 13`（幅390px、既定）and `Galaxy S8`（幅360px。Android で多い狭い幅）before 「収まった」と報告する
- `[WARN] 既定のブラウザを起動できないため /opt/pw-browsers/chromium を使います` はクラウド環境での正常な表示。Windows で「ブラウザが無い」と止まったら `bunx playwright install chromium` を案内する
- スクリーンショットは自分で見て確かめる用。ユーザーに見せる画像を撮るときは別に deviceScaleFactor: 2 で撮る

### 3. はみ出しを直す（fix が true のとき）

表の形ごとに、次の順で直し方を選ぶ。

**Constraints:**
- You MUST keep PC（960px以上）の表示を変えない。CSS はモバイル判定 `@media (max-width: 959px)` の中だけに書く
- 2〜4列で数px〜70px はみ出す → まず原因を見る。多いのはサイト全体の最小幅（`custom.css` のモバイル節: 1列目 5em、長文セル `long-cell` 10em）と、見出しの折り返し禁止。見出しが長い表は `<div class="wrap-head">` で囲むと見出しとセルが折り返す。`unit-table`（値を折り返さず1列目を固定）で囲まれた表は、本当に必要か見直す
- 列が多い・中身が長い表 → `<div class="stack-table">` で囲んでカード表示にする（Markdown の表は前後に空行。HTML の表・`v-for` の表も可）
- 行が多く数値を比べる表 → PC用とスマホ用の2つの表を描いて CSS で切り替える（例: `PatronDetail.vue` の `milestone-wide`/`milestone-tall`、`city-status.md` の `cs-wide`/`cs-tall`）
- 絞り込み・並べ替えのある一覧 → 部品の中にカード表示を持たせる（例: `BuildingsTable.vue` の `bt-cards`）
- 札・アイコンを並べるセル → 折り返しを許す
- 同じ行を PC用とスマホ用で2回描くときは、ページ内リンクの id を片方にだけ付ける（同じ id が2つあると飛ぶ先がずれる）
- 直したら Step 1・2 をやり直し、OK になるまで繰り返す

### 4. 見た目を確かめて報告する

**Constraints:**
- You MUST 直した表をスマホ幅で撮って、列が数文字幅に潰れていないか・カードの見出しが読めるかを自分の目で確かめる
- You MUST 直したページを PC 幅（1280px）でも撮り、PC の表示が変わっていないことを確かめる
- You MUST 報告に、直す前と後のはみ出しの件数・直した表と直し方・PC で変わっていないことを書く
- コミット・push はユーザーの指示に従う。サイトの見た目が変わったら、更新履歴（`apps/wiki/docs/.vitepress/data/updates.json`）への追記を提案する

## Examples

### Example 1: 新しい表を足した後
**Input:** 「DLC04ガイドに表を足したからスマホで確かめて」
**Expected Behavior:** `bun run build:site` → `bun run check:mobile -- --page /guide/dlc04` → はみ出しが 120px の6列の表を `stack-table` で囲む → 再ビルド・再測定で OK → スマホと PC で撮って確認 → 報告。

### Example 2: 報告だけ
**Input:** 「今のサイトでスマホで横にはみ出す表ある？」（fix: false）
**Expected Behavior:** `bun run check:mobile -- --all` の結果から、はみ出す表の一覧（ページ・表の見出し・はみ出し幅）と直し方の案を報告する。直さない。

## Troubleshooting

### はみ出しが出ないのに、スマホで横にずらせる表がある
しきい値（既定 4px）以下のはみ出しは [NG] にならない。`--threshold 0 --all` で全ての表の値を見る。

### 測定値が実機と違う気がする
端末の幅: `iPhone 13` 390px、`iPhone 15` 393px、`iPhone SE (3rd gen)` 375px、`Galaxy S8` 360px、`Pixel 7` 412px。Playwright の `iPhone SE` は初代の320pxで、今は少ないので対象外にしている（2026-11-12 時点で、320pxでははみ出す表がある）。フォントの違いで数px変わることはある。

### ページが開けない（[ERROR] ... を開けませんでした）
`docs/` が古い・壊れている可能性。`bun run build:site` からやり直す。
