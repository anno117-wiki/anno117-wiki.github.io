# 引き継ぎ: 次回セッション向け（2026-06-30 更新）

## git状態
- ブランチ: master
- 最新コミット: 3c6e2a6（2026-06-30 push済み・公開）

## 本日完了分（push済み）

| コミット | 内容 |
|---------|------|
| d760def | fix: 建物効果テーブルのソートクリック不具合を修正（ポインターキャプチャ閾値導入） |
| 03199be | chore: GitHub Pages ビルド成果物を更新（ソートクリック修正反映） |
| 5185b2e | chore: cf-worker/.wrangler/ を .gitignore に追加 |
| 9c56a3d | chore: production-chains-official.json を .gitignore に追加（中間成果物） |
| e621317 | refactor: ゾンビコード3件を削除（URLTools・GoodsListView・lcm/gcd） |
| efe5815 | chore: 本番 console.log/debug 46件を削除（11ファイル） |
| （M系）| refactor: 重複コード共通化・誤字修正・定数化（M-1〜M-7） |
| 3c6e2a6 | chore: 未使用アイコン20件を削除（建物・商品・アイテム） |

JS総量: 277.69KB → 274.16KB（-3.53KB）

## 未コミット作業
なし（全てpush済み）

## 気になる点リスト（残存）

### A. コメントシステム
- A-2【低】テストゴミ Issue #5・#7 が未クローズ
- A-5【低】レート制限がUTC日付境界リセット（実害小）

### C. コンテンツ品質
- C-1【低】スキルツリー複数結合3件のeffectEnが2文のまま（意図的）

### L. 低優先度（保留）
- L-1【別セッション推奨】GraphRenderer.ts 神クラス解体（830行 → ~300行に分割）
  対象: GraphInteractionHandler.ts・NodeTooltip.ts への分割
  理由: 大規模変更のため単独セッションで実施推奨

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

## 次セッションのミッション【重要】

### STEP 1: L-1 GraphRenderer.ts 神クラス解体
- 実装プラン: `docs-notes/plan-graph-renderer-refactor.md` を参照
- 分割構成: GraphRenderer.ts（ファサード約120行）+ GraphNodeRenderer.ts + GraphInteractionHandler.ts + NodeInfoPopup.ts
- 外部API変更なし（呼び出し元 ProductionChainView.ts の修正不要）
- 完了後 bun run build:site でビルド確認必須

### STEP 2: バージョン 1.0 リリース（L-1完了後）
1. UpdateLog.vue のデータを全クリアして「v1.0 正式リリース」エントリ1件のみに更新
   - 日付: リリース当日
   - 内容: Anno 117 統合Wiki v1.0 正式リリース（wiki・生産チェーン計算機）
2. bun run build:site → push
3. git tag v1.0 && git push origin v1.0
