# 引き継ぎ: 次回セッション向け（2026-06-27 更新）

## git状態
- ブランチ: master / origin/master と同期済み（未コミットなし）
- 最新コミット: cace800

## 本セッション完了作業（全push済み）

| コミット | 内容 |
|---------|------|
| fb15aac | 計算機スマホ対応（ボトムシート方式） |
| 9cae60d | WIKIモバイル本文余白 + テーブル横スクロール |
| 61526ab | 計算機横向き生産チェーン不可視 + WIKI投稿欄パディング |
| 1b8caef | 横向きCSS max-width 768px→1024px（iPhone12以降対応） |
| d01cd87 | LP「計算機を開く」404修正 |
| 92d719f | モバイルWIKIセクション間ナビボタン追加 |
| d261292 | VitePressルーターが/calculator/を横取りする問題修正 |
| bc34efd | SOG15等768px超スマホ横向きボトムシートUI修正 |
| cace800 | SPA遷移後にナビボタンが表示されない問題修正（Teleport→DOM直接挿入） |

E2E: 35/35 全緑（SOG15実機・デスクトップ含む検証済み）

## 残作業（フェーズ8未完）

- アイテム効果値の検証・更新（`_local/annolayouts-items-data.json` 差分27件）
- DLC商品アイコン差し替え（Statuettes/Latrunculi Sets）
- military_camp 建物効果の実機確認
- 計算機のMermaid生産チェーン表示が全商品空白（既存バグ）

## 次回注意点

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
