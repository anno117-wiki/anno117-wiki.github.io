# 引き継ぎ: 次回セッション向け（2026-06-27 更新）

## git状態
- ブランチ: master / origin/master と同期済み（未コミットなし）
- 最新コミット: 6e89988

## 本セッション完了作業（全push済み）

| コミット | 内容 |
|---------|------|
| 264b5fc | DLC01ページ添削・生産品アンカーリンク追加 |
| 656c384 | DLC01 50%太字適用・9番の読点削除 |
| 01cbb58 | calculator-guide Storage説明削除・言語切替「EN / 日本語」修正 |
| 6e89988 | CLAUDE.md更新（フェーズ8追記・VitePress太字教訓追加） |

## 残作業
なし（フェーズ1〜8 全完了）

## 次回注意点

### VitePress Markdown太字の注意
- 日本語文字の直後に `**太字**` 記法を使うと `<strong>` に変換されない
- 回避策: `<strong>テキスト</strong>` タグを直接使う

### モバイルCSS設計の現状
- 縦向きモバイル: `@media (max-width:768px)` — ボトムシート・1カラム等
- 横向きスマホ(全機種): `@media (orientation:landscape) and (max-height:500px) and (max-width:1024px)` — ボトムシート+横向き最適化を両方含む
- WIKIモバイル: `@media (max-width:959px)` in custom.css

### セクション間ナビボタン（Layout.vue）
- `onContentUpdated` フックで `.VPLocalNav .container` にDOM直接挿入
- スタイルは custom.css の `.section-nav-links` / `.section-nav-link`
- SectionNav.vue は廃止済み（Teleport方式から移行）

### 計算機リンクのSPA遷移回避
- Layout.vue の `fixCalculatorLinks()` で `a[href="/calculator/"]` 全てをcaptureフェーズで横取り
- `onMounted` + `onContentUpdated` の両方で適用

### ビルド
- 必ず `bun run build:site`（wikiも含む全ビルド）
- `bun run build` は計算機のみ（wikiがdocs/から消える）
