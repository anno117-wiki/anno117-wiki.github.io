# 引き継ぎ: 次回セッション向け（2026-06-28 更新）

## git状態
- ブランチ: master（fix/skilltree-connections をマージ済み）
- 最新コミット: d299e55（master push 済み・GitHub Pages 反映待ち）
- 未コミット変更: docs-notes/handover-next-session.md のみ

## フェーズ9 完了（2026-06-28）

スキルツリー接続・描画の全面改修が完了し master に公開済み。

| コミット | 内容 |
|---------|------|
| 979fd31 | fix: スキルツリー接続をanno.land準拠に全面修正＋DLC手入力＋視認性改善 |
| d299e55 | refactor: スキルツリーDLC座標をannoR系に統一＋DLCラベルをDLC1に |

### 実施内容まとめ

| 内容 | 詳細 |
|------|------|
| 接続エッジ | anno.land実エッジ175ノード326エッジを双方向 connections に反映、隣接自動接続廃止 |
| 描画座標 | 全ブランチ annoR 統一（旧: grid/annoR分岐）、CELL_W=120・CELL_R=60 |
| ノードサイズ | 40px（旧68px） |
| 接続線 | ノード背面・隙間から視認可能（z-index:0）、ゲート金枠追加 |
| DLC01 | 実機スクショ手入力17ノード（食糧配給-UNUSEDを除外）、annoR=2×gridY付与 |
| DLCラベル | 「DLC」→「DLC1」（dlcNN→DLC{N} 汎用化、将来のDLC追加対応） |
| build-game-data.py | -UNUSED スキップ・保護フィールド上書き防止追加 |
| tools/apply-skilltree-connections.py | anno.land エッジ適用スクリプト追加 |

### 重要な設計メモ

- **全ブランチ annoR 統一**: Economy/Civic/Military は既存 annoR、DLC01 は gridY×2 で付与
- **DLC01 座標**: gridY が小数（0.5刻み）→ annoR=2×gridY で整数化
- **TechLinks.vue**: useAnnoR 分岐廃止、cy(t) = (t.annoR - minR) * CELL_R + 20 のみ
- **techs.data.ts**: getBranchLabel() 関数で dlcNN → DLC{N} 汎用化
- **techs.md**: getBranchDisplayLabel() で同様汎用化

### 現在のファイル状態（主要）

| ファイル | 状態 |
|--------|------|
| apps/wiki/docs/wiki/techs.json | 192ノード（-UNUSED除外）・698エッジ |
| apps/wiki/docs/.vitepress/components/TechLinks.vue | annoR統一・useAnnoR分岐削除済み |
| apps/wiki/docs/wiki/techs.data.ts | getBranchLabel() 追加済み |
| apps/wiki/docs/wiki/techs.md | getBranchDisplayLabel() 追加・CELL_H削除済み |
| tools/build-game-data.py | -UNUSED スキップ・保護フィールド追加済み |

## 次回セッションの候補タスク

1. GitHub Pages 反映確認（URL: anno117-wiki.github.io）
2. DLC02/DLC03 ノードの実機確認と追加（現在 DLC01 のみ）
3. スキルツリーのクリック詳細表示改善（必要であれば）

## 注意点（変わらず有効）

### VitePress Markdown太字の注意
- 日本語文字の直後に `**太字**` 記法は機能しない
- 回避策: `<strong>テキスト</strong>` タグを使う

### ビルド
- 必ず `bun run build:site`（wikiも含む全ビルド）
- `bun run build` は計算機のみ（wikiがdocs/から消える）
- build:site 後は `ls docs/` で wiki ファイルの存在確認

### モバイルCSS設計の現状
- 縦向きモバイル: `@media (max-width:768px)` — ボトムシート・1カラム等
- 横向きスマホ(全機種): `@media (orientation:landscape) and (max-height:500px) and (max-width:1024px)`
- WIKIモバイル: `@media (max-width:959px)` in custom.css

### 計算機リンクのSPA遷移回避
- Layout.vue の `fixCalculatorLinks()` で `a[href="/calculator/"]` を capture フェーズで横取り
