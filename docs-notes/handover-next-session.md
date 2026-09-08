# 引き継ぎ: 次回セッション向け（2026-09-08 更新）

## git状態
- ブランチ: master（`origin/master` と一致・全 push 済み）
- タグ: v1.0 付与済み・push済み
- 作業ツリーはクリーン。未追跡は `.claude/skills/` と `agent-sops/` のみ（本セッション以前から存在・未対応）
- 最新コミット: `ccb9bbc`

## 本セッション（2026-09-08）完了分 — 小修整とアイコン方針決定

| コミット | 内容 |
|---------|------|
| 08193ea | 攻略ガイド `strategy.md` DLC02競馬場の表記を「2026/8月予定」→「2026/8/20 追加」 |
| e71f24d | `docs-notes/how-to-edit-site.md` 追加（サイト編集の初心者向け手順書）＋ .gitignore 例外登録 |
| 05ba9a0 | 全WIKIページのコメント欄見出し直下に情報募集文を常時表示（`UserComments.vue`） |
| ccb9bbc | 未使用のスキルツリーアイコン150枚を削除（`{m,s,w}00xx.webp`・下記参照） |

すべて push 済み。

### スキルツリーアイコン: 不採用を決定
- 調査の結果、tech-tree ノード固有アイコンの画像ソースが **anno.land しか存在しない**（Item-Inspector は建物/商品/神のみ・73/192、公式アセットPNGは非公開、RDA抽出は要ゲーム本体）
- anno.land 経由は slug→GUID のグラフマッチング復元が必要で工数3.5〜6h＋帰属表示の懸念
- 費用対効果が見合わず **アイコンは設置しない方針で確定**（現状維持: ゲート31＋DLC02の9件のみ表示）
- 孤立していた `apps/wiki/docs/public/icons/tech/{m,s,w}00xx.webp` 150枚を削除済み（`gate.webp`＋DLC02の9枚は保持）
- 調査詳細: `docs-notes/research-tech-icons.md`（将来方針が変わった場合の再調査の起点）

## 未コミット作業
なし（このハンドオーバー更新を除く）

## 気になる点リスト（残存）

### A. コメントシステム
- A-2【解決】テスト Issue #1〜#7 は全て closed 済み（2026-09-08 確認）
- A-5【低】レート制限がUTC日付境界リセット（実害小）
- A-6【メモ】コメントは giscus ではなく自作（`UserComments.vue` → CF Worker `cf-worker/comment-api.js` → GitHub Issues label `user-comment`）。確認は `gh issue list --repo anno117-wiki/anno117-wiki.github.io --label user-comment --state open`。実ユーザーコメントは0件

### C. コンテンツ品質
- C-1【低】スキルツリー複数結合3件のeffectEnが2文のまま（意図的）
- C-2【解決】アルビオン版パンの小麦粉（Donkey Mill / `bread_albion.json` guid 5967, time 60）は2.0で変更なし。Patch 2.0 チェンジログは "Water Mills"（ラティウムの水車小屋）のみ言及、Donkey Millは別建物。ラティウム版（`bread.json` guid 3075）30→20 修正済み
- C-3【完了】スキルツリー「競馬場」12ノードを `techs.json` に追加・確定。一次ソース: `_local/anno-official-data/v2.0.0.1/`（assets.xml v2.0.0.1・texts_japanese/english.xml＝GitHub Taludas/Anno-117-Item-Inspector）。正式GUID・正式知識コスト・`nameEn`/`descEn`/`effectEn`・アイコン（`annoNodeId`=GUID、webpは `public/icons/tech/15xxxx.webp`）すべて反映。ノード間接続もユーザーが実機確認済み。GUID対応: 157952競馬場/157959設計図/157954大胆な研究/157960最後まで/157964人物研究/157969襲歩/157962速度制限/157968大規模選考会/159795たゆまぬ訓練/158506名誉ある研究/159796残りのベスト/157971指導。（基本ゲーム・DLC01のアイコン非表示は「D. スキルツリーアイコン整備」で不採用決定済み）
- C-4【暫定】建物効果に `hippodrome`（競馬場・tier patrician）を追加（`buildings-effects.json`）。維持費800は assets.xml GUID 152714 で裏取り済み。icon=`wonder_hippodrome`（`icon_3d_construction_category_hippodrome` を配置、`wonder_` prefix で category=驚異 に自動判定・`buildings.data.ts` の明示category対応は不要になり revert 済み）。残: 人口/収入/幸福/信仰/名声の実値照合（現状スクショのみ）、輝きバフ10段階（`Effect Hippodrome 01-09`）、建設フェーズ材料（assets.xml GUID 153790-153793）
- C-5【新規データ源】`_local/anno-official-data/v2.0.0.1/`（gitignore）に assets.xml(33MB)・texts_japanese.xml・texts_english.xml を取得済み。従来の official_master.csv（2026年6月・DLC02なし）の後継。詳細は同フォルダ SOURCE.md

### D. スキルツリーアイコン整備 →【不採用決定・2026-09-08】

ユーザー判断で<strong>アイコンは設置しない</strong>。理由と調査記録は上記「スキルツリーアイコン: 不採用を決定」および `docs-notes/research-tech-icons.md` 参照。
再検討する場合の起点: anno.land slug→GUID のグラフ同型マッチング（`_local/anno_land_graph.json` slugエッジ327 ↔ `_local/skilltree-full-data.json` GUIDエッジ326、既知アンカー7件は research-skill-tree-connections.md）。

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

- 明確な最優先タスクは無し。以下から選択:
  - DLC02残タスク: C-4（競馬場の効果値実照合・輝きバフ10段階・建設フェーズ材料）
  - C-1（スキルツリー結合3件の effectEn が2文のまま・意図的なので優先度低）
  - 下記「（旧）STEP 1: v1.0 実機確認」が未消化なら実施
- スキルツリーアイコン整備（旧D）は不採用決定済み

### （旧）STEP 1: v1.0 実機確認 ※2026-06-30時点の項目・未消化なら再確認
- GitHub Pages でデプロイされたサイトを実機（ブラウザ）で目視確認
- 確認項目:
  - 生産チェーン図の描画・全ノード正常表示
  - パン/ズーム・ピンチ操作
  - アイコンクリックでポップアップ開閉・Esc/外クリック閉鎖
  - グッド切り替え時の viewBox 復元
  - 言語切替（日本語/英語）
  - スマホ表示（縦向き・横向き）
