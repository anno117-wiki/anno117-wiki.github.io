# 引き継ぎ: 次回セッション向け（2026-06-29 更新）

## git状態
- ブランチ: master
- 最新コミット: `9f75238`（2026-06-29 push済み・公開）

## 本日完了分（push済み）

| コミット | 内容 |
|---------|------|
| bbd9a7e | A-1: コメントWorkerページネーション対応（最大500件ループ取得） |
| c70f54b | B-1/B-2: デッドコード削除（MermaidDiagram・giscus一式） |
| 7101d0a | A-4: WORKER_URLを環境変数(VITE_WORKER_URL)に移動 |
| 33b34f3 | ContributionPanelのGITHUB_REPOを正しいリポジトリ名に修正 |
| 9f75238 | 更新履歴に2026-06-29分を追加 |

## 未コミット作業【重要】

### E-1: 生産チェーン図 Mermaid → 独自SVG移行（実装完了・未コミット）

**実装完了・動作確認済み**（dev server で表示確認）

変更ファイル:
- `apps/wiki/docs/.vitepress/components/ProductionChainSvg.vue`（新規）
- `apps/wiki/docs/.vitepress/components/ProductionMermaid.vue`（削除）
- `apps/wiki/docs/.vitepress/theme/index.ts`（ProductionMermaid登録を削除）
- `apps/wiki/docs/wiki/production-chains.data.ts`（graph型に変更）
- `apps/wiki/docs/wiki/production-chains.md`（import・props2行変更）
- `apps/wiki/package.json`（mermaid依存を削除）
- `bun.lock`（mermaid削除後のロック更新）
- `docs/`（ビルド成果物・mermaidチャンク多数削除）

コミットはまだ行っていない（殿の確認待ち）。

## 気になる点リスト（残存）

### A. コメントシステム
- A-2【低】テストゴミ Issue #5・#7 が未クローズ
- A-5【低】レート制限がUTC日付境界リセット（実害小）

### C. コンテンツ品質
- C-1【低】スキルツリー複数結合3件のeffectEnが2文のまま（意図的）

### E. 新規
- E-1【完了】生産チェーン図独自SVG移行（実装完了・未コミット）

## 注意点（変わらず有効）

### ビルド
- 必ず `bun run build:site`（wikiも含む全ビルド）
- build:site 後は `ls docs/` で wiki ファイルの存在確認

### VitePress Markdown太字
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う

### モバイルCSS設計
- 縦向きモバイル: `@media (max-width:768px)`
- 横向きスマホ(全機種): `@media (orientation:landscape) and (max-height:500px) and (max-width:1024px)`
- WIKIモバイル: `@media (max-width:959px)` in custom.css

### コメントWorker情報
- Worker URL: `https://anno-comments.anno117wiki.workers.dev`
- KV namespace: COMMENT_KV（id=b102b98e22de49729c8702ddc7abaae5）
- リポジトリ: anno117-wiki/anno117-wiki.github.io（Issues に user-comment ラベルで蓄積）
