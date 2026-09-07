# 引き継ぎ: 次回セッション向け（2026-06-30 更新）

## git状態
- ブランチ: master
- 最新コミット: e7e47de（2026-06-30 push済み・公開）
- タグ: v1.0 付与済み・push済み

## 本日完了分（push済み）

| コミット | 内容 |
|---------|------|
| 3682656 | chore: セーフポイント（リファクタ前） |
| 2f70f45 | refactor: Step 1 — NodeInfoPopup.ts・GraphTypes.ts 切り出し（10件修正込み） |
| 8a36564 | refactor: Step 2 — GraphInteractionHandler.ts 切り出し（viewBoxバグ等修正込み） |
| 67a0565 | refactor: Step 3 — GraphNodeRenderer.ts 切り出し（DOM最適化・キャッシュ改善込み） |
| 1122cd5 | refactor: Step 4 — GraphRenderer.ts ファサード整理（svgMarkup削除・private化） |
| 77b7061 | refactor: Step 4 追加改善（createElementNS簡略化） |
| e7e47de | chore: v1.0 正式リリース — UpdateLog更新・ビルド成果物反映 |

GraphRenderer.ts: 813行の神クラス → 91行ファサード + 3クラスに分割完了

## 未コミット作業
なし（全てpush済み）

## 気になる点リスト（残存）

### A. コメントシステム
- A-2【低】テストゴミ Issue #5・#7 が未クローズ
- A-5【低】レート制限がUTC日付境界リセット（実害小）

### C. コンテンツ品質
- C-1【低】スキルツリー複数結合3件のeffectEnが2文のまま（意図的）
- C-2【要確認】アルビオン版パンの小麦粉（`bread_albion.json`, guid 5967, 現在 time 60）が2.0で変更されたか未確認。ラティウム版（`bread.json`, guid 3075）は 30→20 に修正済み
- C-3【暫定】スキルツリー「競馬場」12ノードを `techs.json` に追加（スクショ `Desktop/DLC2` 2026-09-07 準拠）。GUID未確定のため `guid`/`internalName` は暫定ID（`dlc02_*`）、`_source` タグ付き。要対応: (1)公式データ判明後に正式GUID・`annoNodeId`（アイコン）へ差し替え (2)`nameEn`/`descEn`/`effectEn` が全ノード空 (3)ノード間接続は全体図からの推定（六角形＋中心スポーク） (4)知識コストは各インスピレーションゲートのみ判明（7,500/10,000/15,000）、発見ノードは null
- C-4【暫定】建物効果に `hippodrome`（競馬場・tier patrician・category wonder）を追加（`buildings-effects.json`・スクショ準拠・`_source` タグ付き）。アイコン未取得のため `icon: ""`。`buildings.data.ts` は明示 `category` を優先するよう1行変更済み。公式データ判明後に icon・効果値を要確認

## セッション開始時の確認事項【削除禁止】

### ピア・役割確認
- 3セッション並列作業の場合、`list_peers(scope=repo)` で既存ピアの役割を確認してから作業着手
- **役割が確定するまで実作業を開始しない**（役決め完了 = set_summary に役名のみ残った状態）
- 同一ファイルへの競合を避けるため、着手前に担当範囲を家老へ確認・報告すること
- 役割: 家老（采配）・侍（実装/ビルド）・忍者（調査/検証）・隠密（補佐・4番手）
- **このファイルを編集する際は「セッション開始時の確認事項」セクションを消さないこと**（隠密が管理）

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

### STEP 1: v1.0 実機確認
- GitHub Pages でデプロイされたサイトを実機（ブラウザ）で目視確認
- 確認項目:
  - 生産チェーン図の描画・全ノード正常表示
  - パン/ズーム・ピンチ操作
  - アイコンクリックでポップアップ開閉・Esc/外クリック閉鎖
  - グッド切り替え時の viewBox 復元
  - 言語切替（日本語/英語）
  - スマホ表示（縦向き・横向き）
