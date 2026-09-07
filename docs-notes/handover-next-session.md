# 引き継ぎ: 次回セッション向け（2026-09-07 更新）

## git状態
- ブランチ: master
- タグ: v1.0 付与済み・push済み
- 2026-09-07 セッションで DLC02「競馬場」対応を実施（コミット `403065c`〜末尾）。push状況は下記参照

## 本セッション（2026-09-07）完了分 — DLC02「競馬場」対応

| コミット | 内容 |
|---------|------|
| 403065c | DLC02競馬場ページ更新・v2.0変更点反映（小麦粉30→20秒） |
| 6ff3497 | スキルツリーに「競馬場」ブランチ追加・DLC1を「灰の予言」に改称 |
| 706f485〜105e101 | DLC02ページ加筆（レースの流れ・試走・ダッシュ・建材訂正・パン需要をv2.0側へ） |
| 92c6629 | 建物効果に「競馬場」追加 |
| 52d5b7b | 円形闘技場・競馬場を「（基本効果）」表記に |
| （ここまで push 済み: `5e0ece4..52d5b7b`） | |
| 1b848c7 | スキルツリー「競馬場の設計図」ノード追加 |
| b2d71b9 | スキルツリー競馬場12ノードを正式GUID・正式知識コストへ差し替え |
| 4968e64 | スキルツリー競馬場 英語名・アイコン・接続を確定 |
| dabfce3 | 建物効果ページ 競馬場にアイコン追加 |

## 未コミット作業
このハンドオーバー更新のみ（下記でコミット予定）。`1b848c7`〜末尾は push 待ち

## 気になる点リスト（残存）

### A. コメントシステム
- A-2【低】テストゴミ Issue #5・#7 が未クローズ
- A-5【低】レート制限がUTC日付境界リセット（実害小）

### C. コンテンツ品質
- C-1【低】スキルツリー複数結合3件のeffectEnが2文のまま（意図的）
- C-2【解決】アルビオン版パンの小麦粉（Donkey Mill / `bread_albion.json` guid 5967, time 60）は2.0で変更なし。Patch 2.0 チェンジログは "Water Mills"（ラティウムの水車小屋）のみ言及、Donkey Millは別建物。ラティウム版（`bread.json` guid 3075）30→20 修正済み
- C-3【完了】スキルツリー「競馬場」12ノードを `techs.json` に追加・確定。一次ソース: `_local/anno-official-data/v2.0.0.1/`（assets.xml v2.0.0.1・texts_japanese/english.xml＝GitHub Taludas/Anno-117-Item-Inspector）。正式GUID・正式知識コスト・`nameEn`/`descEn`/`effectEn`・アイコン（`annoNodeId`=GUID、webpは `public/icons/tech/15xxxx.webp`）すべて反映。ノード間接続もユーザーが実機確認済み。GUID対応: 157952競馬場/157959設計図/157954大胆な研究/157960最後まで/157964人物研究/157969襲歩/157962速度制限/157968大規模選考会/159795たゆまぬ訓練/158506名誉ある研究/159796残りのベスト/157971指導。残: DLC01ノードは依然アイコン非表示（`annoNodeId`空・`techIconPath`未使用）＝将来 techs.md を `iconKey`/`techIconPath` 対応にすれば統一可
- C-4【暫定】建物効果に `hippodrome`（競馬場・tier patrician）を追加（`buildings-effects.json`）。維持費800は assets.xml GUID 152714 で裏取り済み。icon=`wonder_hippodrome`（`icon_3d_construction_category_hippodrome` を配置、`wonder_` prefix で category=驚異 に自動判定・`buildings.data.ts` の明示category対応は不要になり revert 済み）。残: 人口/収入/幸福/信仰/名声の実値照合（現状スクショのみ）、輝きバフ10段階（`Effect Hippodrome 01-09`）、建設フェーズ材料（assets.xml GUID 153790-153793）
- C-5【新規データ源】`_local/anno-official-data/v2.0.0.1/`（gitignore）に assets.xml(33MB)・texts_japanese.xml・texts_english.xml を取得済み。従来の official_master.csv（2026年6月・DLC02なし）の後継。詳細は同フォルダ SOURCE.md

### D. スキルツリーアイコン整備（未着手・タスク候補）

<strong>現状</strong>: `techs.md` の `<img>` は `annoNodeId`（基本ゲーム=`m00xx`、DLC02=GUID）と `isGate`（→`gate.webp`）しか見ない。DLC01の発見14ノードは `annoNodeId` 空・`isGate` false のため<strong>アイコン枠ごと非表示</strong>（`iconKey`/`techIconPath` は保持しているが `techs.md` が参照しない死にデータ）。

<strong>方向A（低コスト・推奨の当面策）</strong>: DLC02と同じ手法（`annoNodeId`=GUID + webp を `public/icons/tech/` に配置）をDLC01にも適用。
- DLC01 tech アイコン15枚中<strong>8枚は Item-Inspectorリポジトリ（`Taludas/Anno-117-Item-Inspector` の `data/ui/fhd/dlc01/icon_content/`）から取得可能</strong>
- 残り7枚は `dlc01/icon_content/techtree/icon_3d_techtree_*.png` 系で<strong>同リポジトリに無い</strong>（ゲームRDA抽出が必要、または汎用フォールバックで妥協）
- 見積: 入手可能な8枚の付与で<strong>約40分</strong>。見た目の8割の効果

<strong>方向B（本格整備・DLC03前の投資）</strong>: `techs.md` を `iconKey`/`techIconPath` 対応にし、`tools/build-tech-icons.*` で techs.json 走査→assets.xml で IconFilename 解決→PNG取得→webp変換→一括生成。基本ゲーム＋全DLCを同一パイプライン化。
- 見積: <strong>欠損分を汎用フォールバックで妥協なら 3.5〜4.5時間 / RDA抽出まで完遂なら 6〜9時間（要ゲーム本体）/ DLCブランチのみ縮小版 2.5〜3.5時間</strong>
- 欠損アイコン（DLC01 techtree系7枚＋基本ゲーム要確認分）が最大の不確定要素
- 価値: DLC03（2026年11月予定）以降が出るたび自動でアイコンが揃う

<strong>切り分け</strong>: 今すぐ見栄えを整えるなら方向A、DLC03前の整備タスクとして方向B。

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

- 最優先候補: 上記「D. スキルツリーアイコン整備」（方向A＝約40分 or 方向B＝数時間）
- DLC02残タスク: C-4（競馬場の効果値実照合・輝きバフ10段階・建設フェーズ材料）

### （旧）STEP 1: v1.0 実機確認 ※2026-06-30時点の項目・未消化なら再確認
- GitHub Pages でデプロイされたサイトを実機（ブラウザ）で目視確認
- 確認項目:
  - 生産チェーン図の描画・全ノード正常表示
  - パン/ズーム・ピンチ操作
  - アイコンクリックでポップアップ開閉・Esc/外クリック閉鎖
  - グッド切り替え時の viewBox 復元
  - 言語切替（日本語/英語）
  - スマホ表示（縦向き・横向き）
