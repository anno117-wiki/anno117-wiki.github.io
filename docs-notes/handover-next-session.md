# 引き継ぎ: 次回セッション向け（2026-09-11 更新）

## git状態
- ブランチ: master（`origin/master` と一致・全 push 済み）
- 作業ツリーはクリーン。未追跡は `.claude/skills/` と `agent-sops/` のみ（本セッション以前から存在・未対応）
- 最新コミット: `4516e48`

## 本セッション（2026-09-11 後半）完了分 — 計算機DLC02対応・レアリティ訂正・サイト全体不整合7件修正

| コミット | 内容 |
|---------|------|
| 10f0ce4 | 計算機のアイテム生産性ブーストをDLC02(v2.0.0.1)に対応 |
| aa76fd8 | アイテムレアリティ「ミシック」→「ヒロイック」に訂正（公式訳誤り） |
| 4516e48 | サイト全体の表示破壊・リンク不整合・データ基盤不整合を修正 |

すべて push 済み。

### 10f0ce4: 計算機アイテムのDLC02対応
- `packages/shared/public/data/items/*.json`（生産性ブースト詳細、計算機の`Item.ts`が参照）が6月時点の55件のまま放置され、DLC02で削除済みの9GUIDが残存・新規追加分が未反映だった
- `tools/build-calculator-items.py`を新設し、`items_export_with_effects.csv`からProductivityUpgrade保有アイテムを64件抽出。対象商品名は生産チェーンJSONのguid→name逆引きで解決
- `i18n/locales/{ja,en}.json`の`specialists`セクションを49→70件に追加
- `tools/generate-items-list.ts`のパスがモノレポ化前のまま（`src/assets/...`）で動作していなかったため現行パスに修正、実行トリガー（`import.meta.main`）も追加
- ブラウザ実機確認済み（Sardinesチェーンで「網師」トグルON→建物数1軒→0.91軒、+10%ブースト反映を確認）
- **画像取得は対応せず**（ユーザー指示）。DLC02新規434件は引き続きアイコン画像なし

### aa76fd8: レアリティ「ミシック」→「ヒロイック」訂正
- 内部enum名`Mythic`を独自カタカナ音写した「ミシック」は誤り。公式ローカライズ（texts_japanese.xml/texts_english.xml）では「輝きがあればヒロイックの専門家が現れる」「Heroic specialists」等、英語Heroic/日本語ヒロイックと表示される
- `items.data.ts`のRARITY_JA、`updates.json`の告知文、`_local/.../SOURCE.md`の注記を修正

### 4516e48: サイト全体不整合7件（横断調査→一括修正）
4体の並列サブエージェントでi18n・リンク整合性・アイコン整合性・データ生成基盤を調査し、発覚した問題に対応:

1. **建物アイコン174件中154件が実体なし**で壊れた画像表示だった → `buildings-effects.json`から実在しないicon参照を削除（20件のみ残存）。`BuildingsTable.vue`の`v-if="b.icon"`は元から実在チェックをしないため、データ側で対応
2. **スキルツリー40ノードのアイコン**も実体なし、`@error`フォールバックも二重に404 → CLAUDE.mdの「アイコン不採用決定（2026-09-08）」に合わせて`techs.md`の該当`<img>`タグ・関連CSS・未使用import(`useData`,`computed`)を削除
3. **items.html→population.htmlの住民層リンク21件中18件(86%)が機能不全** → 原因は2つ: (a) VitePressの見出しslug化で濁点文字がNFD分解されるのに`items.data.ts`側はNFC文字列のままだった (b) 「スミス（ケルト文化路線）」等の括弧付き見出しと単体名の不一致。`RESIDENCE_TIER_ANCHOR`マップを新設し`.normalize('NFD')`して解決、9件全リンクの一致をビルド後HTMLで検証済み
4. **`bun run generate`が起動不能** → `generate-goods-list.ts`が存在しないパス参照で異常終了、`&&`連結のため`generate-items-list.ts`にも未到達だった。パス修正に加え、`determineCategory`のハードコード4分類（現行6分類のresource/intermediateを誤判定）と、中間品・原材料が生産チェーンJSON内にネストされ収集されない不具合（113→50件に壊れる）を発見・修正。既存list.jsonのcategory/iconを継承する設計にして安全化、差分検証済み
5. **建物/スキルツリーのDLC02手編集データが一次ソース未反映のまま** → `apply-skilltree-connections.py`はguid一致時にconnections/annoS/annoRを無条件上書きするため、一次ソース更新後の再実行で消失するリスクがある旨をdocstringに明記（一次ソース自体の更新は未実施）
6. **生成スクリプトの陳腐化がビルド時に検知されない** → `scripts/build-site.ts`に一次ソース/生成物のmtime比較チェックを追加（`[0/5]`ステップ、警告のみでビルドは止めない）
7. **言語切替に追従しない固定文言** → 検索クリアのaria-label、カテゴリ名suffix、自動比率ツールチップ、`Aqueduct.ts`のトグルラベル（英語固定だった）をi18n化。日英切替をブラウザ実機で確認済み

## 未コミット作業
なし

## 保留・未解決（次セッションへ）

- **未対応**: 「対象」データのうち55種類（「生産施設」「公共サービス」「壁」等の総称カテゴリ、および「アルビオンの倉庫」等の地域接頭辞付き表記）はbuildings-effects.jsonと名前が一致せず、リンク化されずプレーンテキストのまま
- **未調査**: v2.0.0.1で削除された3件のアイテム（船上の猫-ケントゥリオ・キロテカ GUID106844／忠実な猟犬-フィデウス GUID106846／象使い-アブドフィル GUID42057）が公式エクスポート対象から外れた理由
- **新規・未対応**: 建物アイコン154件・スキルツリーアイコン40ノード分は画像取得をしていない（表示は「非表示化」で安全化しただけ。根本解決にはゲームアセットからのPNG抽出作業が必要、要ユーザー判断）
- **新規・要注意**: `buildings-effects.json`/`techs.json`のDLC02（競馬場）手編集データは、一次ソース（`_local/anno-official-data/config/`, `_local/skilltree-full-data.json`）側では未反映のまま。今後一次ソースをDLC02版に更新して`build-buildings-data.py`/`apply-skilltree-connections.py`を再実行する際は、手編集済み値との差分を必ず確認すること（上書き消失注意、docstringに警告済み）
- **新規・未検証**: `generate-goods-list.ts`修復により`bun run generate`が動作可能になったが、実運用（新DLC商品追加時）での使用実績はまだない（今回はdry-run差分確認のみ）
- 前セッションからの持ち越し（未着手）:
  - C-4【暫定】競馬場(`hippodrome`)の効果値実照合（人口/収入/幸福/信仰/名声）・輝きバフ10段階・建設フェーズ材料
  - C-1【低】スキルツリー結合3件の effectEn が2文のまま（意図的）

## セッション開始時の確認事項【削除禁止】

### ピア・役割確認
- 3セッション並列作業の場合、`list_peers(scope=repo)` で既存ピアの役割を確認してから作業着手
- **役割が確定するまで実作業を開始しない**（役決め完了 = set_summary に役名のみ残った状態）
- 同一ファイルへの競合を避けるため、着手前に担当範囲を家老へ確認・報告すること
- 役割: 家老（采配）・侍（実装/ビルド）・忍者（調査/検証）・隠密（補佐・4番手）
- **このファイルを編集する際は「セッション開始時の確認事項」セクションを消さないこと**（隠密が管理）

## 注意点（変わらず有効・今回追加分含む）

### ビルド
- 必ず `bun run build:site`（wikiも含む全ビルド）
- build:site 後は `ls docs/` で wiki ファイルの存在確認
- **今回追加**: build:site実行時、`[0/5] Checking generated data freshness...`で一次ソース(`_local/anno-official-data/`等)が生成物より新しい場合に警告が出る（`scripts/build-site.ts`のcheckDataFreshness）。警告が出たら該当の生成スクリプト（build-buildings-data.py等）の再実行を検討すること
- devサーバ(`bun run dev:wiki`)はCSRのためSPA遷移・アンカースクロールの検証には向かない。本番相当の検証は `bun run preview:wiki`（vitepress preview、ビルド後の静的配信）を使う

### VitePress
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- SPA遷移後のアンカースクロール: `useRoute()`にhashは無い。`useData()`のhashを使い、VitePress自身のスクロール処理に`setTimeout(100ms)`で勝つ必要がある
- **今回発見**: VitePressの見出しslug化は濁点・半濁点を含む文字をNFD分解する（例: 「ベ」→「ヘ」+結合文字U+3099）。他ページへのアンカーリンクをコードで生成する際は、リンク先の見出しテキストに濁点等が含まれる場合`.normalize('NFD')`してから`encodeURIComponent`すること（`items.data.ts`の`RESIDENCE_TIER_ANCHOR`参照）。括弧付き見出し（「〇〇（△△文化路線）」）も表示名と実際のslugが異なるため、別途マップで対応が必要

### 生成スクリプト運用
- `tools/generate-goods-list.ts` / `tools/generate-items-list.ts` は、実行時に既存`list.json`/`item-compatibility.json`の手動メンテ値（category/icon等）を継承する設計にした（今回修正）。再実行する際は必ず事前にバックアップを取り、差分を確認してから採用すること（今回、パス修正直後の初回実行で113→50件に壊れる不具合が発生し、差分確認で発覚・修正した経緯あり）
- `apply-skilltree-connections.py`はguid一致時にconnections等を無条件上書きするため、`_local/skilltree-full-data.json`をDLC対応版に更新しないまま実行しないこと

### コメントWorker情報
- Worker URL: `https://anno-comments.anno117wiki.workers.dev`
- KV namespace: COMMENT_KV（id=b102b98e22de49729c8702ddc7abaae5）
- リポジトリ: anno117-wiki/anno117-wiki.github.io（Issues に user-comment ラベルで蓄積）

### 環境
- bun は 1.4.2 にアップグレード済み（グローバル環境、2026-09-11）。lockfile変更なし・ビルド/E2E問題なし確認済み

## 次セッションのミッション【重要】

- 明確な最優先タスクは無し。以下から選択:
  - 建物アイコン154件・スキルツリーアイコン40ノード分の画像抽出作業（要ユーザー判断、ゲームアセット抽出が必要）
  - `buildings-effects.json`/`techs.json`の一次ソースをDLC02版（v2.0.0.1相当）に統合
  - 「対象」データ55種類の表記統一（生産施設カテゴリ等）
  - DLC02残タスク: C-4（競馬場の効果値実照合・輝きバフ10段階・建設フェーズ材料）
  - C-1（スキルツリー結合3件の effectEn が2文のまま・意図的なので優先度低）
