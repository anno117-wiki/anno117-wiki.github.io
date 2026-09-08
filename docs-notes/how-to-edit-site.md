# サイトの内容を変更する方法（初心者向け・小修整編）

対象: 誤字直し・日付や数値の更新・一文追記など、文章まわりの小さな修正。
計算機（Vue）や新規ページ追加、データ表の作り直しは対象外（末尾「避けた方がよい変更」参照）。

---

## 1. どこを直すと何が変わるか

サイトは2つの部分に分かれている。

| 見えるページ | 直すファイルの場所 | 形式 |
|---|---|---|
| WIKI 記事（攻略ガイド・商品一覧など） | `apps/wiki/docs/` の中の `.md` | Markdown（普通の文章） |
| 生産チェーン計算機 | `apps/calculator/src/` | Vue / TypeScript（難度高） |
| 商品データ・アイコン | `packages/shared/public/` | JSON |

初心者の小修整は **`apps/wiki/docs/**/*.md` だけ** を触るのが安全。

主なファイル:
- `apps/wiki/docs/guide/` … 攻略ガイド各種（`dlc02-hippodrome.md` など）
- `apps/wiki/docs/wiki/` … データ系ページ（`goods.md` など。表の中身は `.data.ts` / `.json` から自動生成なので、`.md` の地の文だけ直す）
- `apps/wiki/docs/index.md` … トップページ
- `apps/wiki/docs/updates.md` … 更新履歴

---

## 2. リポジトリ直下の `docs/` は手で触らない

紛らわしいが、**リポジトリ直下の `docs/` はビルドで自動生成される公開物**。
手で編集しても次のビルドで上書きされる。編集するのは必ず `apps/wiki/docs/`（`apps/` が付く方）。

---

## 3. 小修整の手順

### 3-1. ファイルを開いて直す

例: `apps/wiki/docs/guide/dlc02-hippodrome.md`

先頭のこの部分は「フロントマター」。`title:` と `description:` は検索結果やブラウザタブに出る文字なので、
**ページタイトルを変えたい時だけ**触る。本文だけ直すなら無視してよい。

```
---
title: DLC02・競馬場
description: Anno 117 DLC02「競馬場...」の攻略ガイド。...
---
```

本文は `#` が大見出し、`##` が中見出し、`-` が箇条書き。普通の文章として書き換えるだけ。

### 3-2. Markdown の最低限ルール

- 見出し: 行頭に `## `（半角スペース必須）
- 箇条書き: 行頭に `- `
- 内部リンク: `[表示文字](/guide/strategy)`（`/` 始まり、`.md` は付けない）
- 太字: `**文字**`。ただし **日本語のすぐ後ろに `**` を置くと効かない**（VitePress のクセ）。
  その場合は `<strong>文字</strong>` と書く。
- 丸数字（1,2,3 を囲んだ字）・罫線記号は使わない（プロジェクトの約束）

---

## 4. その場で確認する（プレビュー）

ターミナルで:

```
bun run dev:wiki
```

表示される `http://localhost:xxxx` をブラウザで開くと、**保存するたび自動反映**される。
確認が済んだら `Ctrl+C` で停止。

（Claude Code のプロンプトで `!bun run dev:wiki` と打てば、このセッションからでも起動できる）

---

## 5. 本番ビルドで最終確認

プレビューで良ければ、公開物を作り直す:

```
bun run build:site
```

- `build complete` と最後の `Done. docs/ = wiki(/) + calculator(/calculator/)` が出れば成功
- **必ず `build:site`**。`bun run build` だけだと計算機しかビルドされず wiki が `docs/` から消える
- ビルド後は `ls docs/` で wiki ファイル（index.html・wiki/・guide/）の存在を確認してからコミット

---

## 6. 保存（コミット）と公開（push）

```
git add apps/wiki/docs/ docs/
git commit -m "docs: 競馬場ページの誤字を修正"
git push origin master
```

`git push` した瞬間に GitHub Pages へ反映され、数分で公開される。
**push 前は毎回、人間に可否を確認する**のがこのプロジェクトの決まり。

---

## 7. 慣れるまでの練習に向くタスク

- 攻略ガイドの誤字・言い回しの修正
- 日付や数値の更新
- 箇条書きを1行足す
- `updates.md` に更新履歴を1件追記

## 避けた方がよい変更（別手順が必要）

- `wiki/goods.md` などの表の中身 → データファイル生成が絡む（`bun run generate` 等）
- 計算機（`apps/calculator/`）→ Vue の知識が必要
- 新規ページ追加 → サイドバー設定 `apps/wiki/docs/.vitepress/config.ts` も要る

---

## 参考: 実例（2026-09-08）

`apps/wiki/docs/guide/strategy.md` の1行を修正しただけの小修整。

```
- [DLC02・競馬場](/guide/dlc02-hippodrome) — 2026/8月予定
+ [DLC02・競馬場](/guide/dlc02-hippodrome) — 2026/8/20 追加
```

→ `bun run build:site` → `git add apps/wiki/docs/guide/strategy.md docs/` → commit → push。
コミット `08193ea`。
