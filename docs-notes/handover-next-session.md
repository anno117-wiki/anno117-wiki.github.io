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
- C-2【解決】アルビオン版パンの小麦粉（Donkey Mill / `bread_albion.json` guid 5967, time 60）は2.0で変更なし。Patch 2.0 チェンジログは "Water Mills"（ラティウムの水車小屋）のみ言及、Donkey Millは別建物。ラティウム版（`bread.json` guid 3075）30→20 修正済み
- C-3【概ね確定】スキルツリー「競馬場」12ノードを `techs.json` に追加。<strong>正式GUID・正式知識コストへ差し替え済み</strong>（一次ソース: `_local/anno-official-data/v2.0.0.1/assets.xml`＝GitHub Taludas/Anno-117-Item-Inspector・v2.0.0.1・texts_japanese.xml）。残: (1)`nameEn`/`descEn`/`effectEn` が全ノード空（texts_english.xml から補完可） (2)`annoNodeId` が空でアイコン非表示（DLC02アイコンは同リポジトリ `data/ui/fhd/dlc02/` にあり） (3)ノード間接続は全体図スクショからの推定（六角形＋中心スポーク）。GUID対応: 157952競馬場/157959設計図/157954大胆な研究/157960最後まで/157964人物研究/157969襲歩/157962速度制限/157968大規模選考会/159795たゆまぬ訓練/158506名誉ある研究/159796残りのベスト/157971指導
- C-4【暫定】建物効果に `hippodrome`（競馬場・tier patrician・category wonder）を追加（`buildings-effects.json`・スクショ準拠・`_source` タグ付き）。維持費800は assets.xml GUID 152714 で裏取り済み。残: 人口/収入/幸福/信仰/名声の実値照合、icon 未取得、輝きバフ10段階（`Effect Hippodrome 01-09`）。建設フェーズ材料も assets.xml GUID 153790-153793 に存在
- C-5【新規データ源】`_local/anno-official-data/v2.0.0.1/`（gitignore）に assets.xml(33MB)・texts_japanese.xml・texts_english.xml を取得済み。従来の official_master.csv（2026年6月・DLC02なし）の後継。詳細は同フォルダ SOURCE.md

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
