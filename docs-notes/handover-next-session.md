# 引き継ぎ: 次回セッション向け（2026-09-17 更新）

## git状態
- ブランチ: master。**`origin/master` より3コミット先行（未push）**: `f9b1c48` `0500773` `7b5de95`
  - `7d1140b`・`c0822ad` は push 済み。それ以降の3件は**コミットのみでpush未指示**（ユーザーから明示のpush許可を得ていないため）
- 作業ツリーはクリーン。未追跡ファイルなし
- 最新コミット: `7b5de95`

## 本セッション（2026-09-17）完了分 — regions.md孤立修正・コメント機能バグ修正・DLC03情報反映

| コミット | push | 内容 |
|---------|------|------|
| 7d1140b | ✅ | wiki/regions.md(地域別商品)がsidebar/nav未掲載で孤立していたのを修正 |
| c0822ad | ✅ | VITE_WORKER_URL未読込でコメント機能が全ページで壊れていたのを修正 |
| f9b1c48 | 未push | DLC03「デルタの夜明け」の公式発表情報を反映 |
| 0500773 | 未push | DLC03スキルツリーの受け皿を非表示状態で用意 |
| 7b5de95 | 未push | 前セッションのhandover更新＋.claude/skills・agent-sops追加コミット |

### 7d1140b: wiki/regions.md孤立修正
- `apps/wiki/docs/.vitepress/config.ts`のsidebar['/wiki/']に「地域別商品」リンクを追加
- goods.md・production-chains.mdからregions.mdへの相互リンクも追加
- 発端: ユーザーがGoogle Search Console(GSC)で「インデックス未登録」を確認 → 実際は別件（下記）だったが、調査中に本件の孤立リンクを発見・修正

### GSCサイトマップ調査（コミットなし、事実確認のみ）
- GSC「サイトマップ」ページで`sitemap.xml`が繰り返し「取得できませんでした」になる件を調査
- 確認済み事実: `curl`で`https://anno117-wiki.github.io/sitemap.xml`は200・`Content-Type: application/xml`・robots.txtにも記載あり・sitemap内の全20URLが200・GSCの「URL検査→公開URLをテスト」でもGooglebot視点で200/正しいXMLと確認 → **サイト側・GitHub Pages側に技術的な原因は見当たらない**
- 1回目の過去の失敗は「末尾スラッシュ付きURL(`/sitemap.xml/`)を送信」というユーザー側のミスだったが、正しいURLでも改善せず
- ネットの「GitHub PagesがContent-Typeを誤配信する」という既知バグ説も検証したが、本サイトには再現しなかった（Content-Typeは常に正しい）
- 結論: GSC側のサイトマップ処理パイプライン特有の問題（原因不明、コミュニティでも類似報告あり）の可能性が高い
- **2026-09-17、ユーザーがGSC上でサイトマップを削除→`sitemap.xml`（末尾スラッシュなし）で再送信済み。1日後に結果を報告してもらう約束**

### c0822ad: コメント機能の実害バグ修正【重要】
- GSCのクロール統計で`https://anno117-wiki.github.io/{category}/undefined/comments?page=...`という404を多数検出（favicon.ico 404とは別件）
- 原因: `apps/wiki/.env.production`にある`VITE_WORKER_URL`をViteが読み込めていなかった。VitePressのsrcDir(`apps/wiki/docs`)とpackage.jsonのあるワークスペースルート(`apps/wiki`)がズレており、Viteのデフォルト`envDir`は`docs`側を見に行くため`.env.production`が見つからず、`import.meta.env.VITE_WORKER_URL`が常に`undefined`になっていた
- 結果、`UserComments.vue`の`fetch`先が`` `${undefined}/comments?page=...` ``という不正な相対パスに解決され、**トップページ以外の全ページでコメント機能が本番で一度も動作していなかった**
- `config.ts`に`vite: { envDir: fileURLToPath(new URL('../../', import.meta.url)) }`を追加して解消
- ビルド後の埋め込みURL(`https://anno-comments.anno117wiki.workers.dev`)とWorker側の200応答を確認済み
- **favicon.ico の404（GSCクロール統計で複数回検出）は未対応のまま**。実害は軽微（`/images/anno_icon.png`をfaviconとして使っており`/favicon.ico`自体は用意していないため、ブラウザ標準動作で404になる）。気になるなら`/favicon.ico`設置で解消可能

### f9b1c48: DLC03公式発表情報の反映（未push）
- 出典: [Anno Union公式ブログ「Gamescom recap」](https://www.anno-union.com/gamescom-recap-dawn-of-the-delta-and-echoes-of-kassandra/)（2026-09-03）
- `guide/dlc03-dawn-of-delta.md`に、舞台(アエギプトゥス)・3ゾーン地形(アリッド/ファームランド/氾濫原)・住民層(スレッシャー→スクライブ/ポッター)・灌漑システム2方式(ベイスン/ノリア)・新祭神ソベク・新軍事ユニット(クシテ弓兵/ドロメダリイ騎兵)・2026年11月リリース予定を出典明記の上で記載
- **2026年10月に詳細デブログ・ライブ配信が予告されており、内容は今後変更されうる旨をページ冒頭に明記済み**

### 0500773: DLC03スキルツリーの受け皿（未push）
- DLC01/DLC02同様、DLC03でも新スキルツリー追加が想定されるため事前準備
- `techs.data.ts`/`techs.md`に`dlc03`ブランチのラベル（デルタの夜明け）・色（`#059669`）を追加
- `techs.json`に`branchOverride: "dlc03"`・`hidden: true`のプレースホルダーエントリを1件追加。`_source`に「未公開のためプレースホルダー」と明記
- `techs.data.ts`の`filter((t) => !t.hidden)`機構により`byBranch`から除外され、ビルド後HTMLに一切出力されないことを確認済み
- **実データ(GUID・座標・接続・効果文等)判明後、このプレースホルダーを実エントリ群に置き換えて`hidden`を外せば表示が有効になる**

## 未コミット作業
なし（作業ツリークリーン）

## 保留・未解決（次セッションへ）

- **最優先**: GSCサイトマップ削除→再送信(2026-09-17実施)の結果をユーザーから受け取り次第確認。改善しなければsitemap経由の一括登録は諦め、GSCのURL検査ツールでの個別ページ「インデックス登録リクエスト」運用への切替を提案する
- **要判断**: `f9b1c48`・`0500773`・`7b5de95`はまだpush未実施。次セッションでpush可否をユーザーに確認すること
- **未対応**: favicon.ico の404（軽微、SEO実害なし）
- **未対応**: 「対象」データのうち55種類（「生産施設」等の総称カテゴリ）はbuildings-effects.jsonと名前が一致せずリンク化されない
- **未調査**: v2.0.0.1で削除された3件のアイテム（GUID106844／106846／42057）が公式エクスポート対象から外れた理由
- **新規・未対応**: 建物アイコン154件・スキルツリーアイコン40ノード分は画像取得未実施（表示は非表示化で安全化済み。根本解決にはゲームアセット抽出が必要、要ユーザー判断）
- **新規・要注意**: `buildings-effects.json`/`techs.json`のDLC02手編集データは一次ソース未反映のまま。一次ソース更新→`apply-skilltree-connections.py`再実行時は手編集済み値との差分を必ず確認すること（無条件上書きで消失するリスクをdocstringに警告済み）
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
- build:site実行時、`[0/5] Checking generated data freshness...`で一次ソースが生成物より新しい場合に警告が出る。警告が出たら該当の生成スクリプトの再実行を検討すること
- devサーバ(`bun run dev:wiki`)はCSRのためSPA遷移・アンカースクロールの検証には向かない。本番相当の検証は `bun run preview:wiki` を使う

### VitePress / Vite
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- SPA遷移後のアンカースクロール: `useRoute()`にhashは無い。`useData()`のhashを使い、VitePress自身のスクロール処理に`setTimeout(100ms)`で勝つ必要がある
- VitePressの見出しslug化は濁点・半濁点を含む文字をNFD分解する。リンク先見出しに濁点等が含まれる場合`.normalize('NFD')`してから`encodeURIComponent`すること（`items.data.ts`の`RESIDENCE_TIER_ANCHOR`参照）
- **今回発見**: VitePressのsrcDir（`apps/wiki/docs`）とpackage.jsonのあるワークスペースルート（`apps/wiki`）がズレているプロジェクトでは、Viteの`envDir`もsrcDir基準になるため、`.env.production`等をワークスペースルートに置いている場合は`config.ts`で`vite.envDir`を明示しないと環境変数が読み込まれない（`import.meta.env.X`が常に`undefined`になり、気付きにくいバグを生む）

### 生成スクリプト運用
- `tools/generate-goods-list.ts` / `tools/generate-items-list.ts` は既存`list.json`等の手動メンテ値を継承する設計。再実行する際は必ず事前にバックアップ・差分確認してから採用すること
- `apply-skilltree-connections.py`はguid一致時にconnections等を無条件上書きするため、`_local/skilltree-full-data.json`をDLC対応版に更新しないまま実行しないこと

### スキルツリーの非表示プレースホルダー機構
- `techs.data.ts`の`(techsJson as {...}).techs.filter((t) => !t.hidden)`により、`techs.json`の各エントリに`hidden: true`を付けると画面に一切表示されなくなる（`byBranch`から除外）
- 未発表DLCのスキルツリーなど、コード側の受け皿だけ先に用意して表示は保留したい場合に使える。今回`dlc03`ブランチで初めて使用（詳細は上記0500773参照）

### コメントWorker情報
- Worker URL: `https://anno-comments.anno117wiki.workers.dev`
- KV namespace: COMMENT_KV（id=b102b98e22de49729c8702ddc7abaae5）
- リポジトリ: anno117-wiki/anno117-wiki.github.io（Issues に user-comment ラベルで蓄積）
- **今回のenvDir修正まで、本番でコメント取得・投稿が機能していなかった可能性が高い**。今後はビルド成果物のJSにWorker URLの実値（`https://anno-comments.anno117wiki.workers.dev`）が埋め込まれているか、リリース前に念のため確認する習慣を推奨

### 環境
- bun は 1.4.2（グローバル環境、2026-09-11時点）

## 次セッションのミッション【重要】

- **最優先**: GSCサイトマップ再送信の結果確認（ユーザーからの報告待ち）
- f9b1c48・0500773・7b5de95のpush可否をユーザーに確認
- DLC03: 2026年10月の公式デブログで情報更新予定。詳細判明次第、`guide/dlc03-dawn-of-delta.md`とスキルツリーのプレースホルダー(techs.json)を実データに更新すること
- その他、以下から選択:
  - 建物アイコン154件・スキルツリーアイコン40ノード分の画像抽出作業（要ユーザー判断）
  - `buildings-effects.json`/`techs.json`の一次ソースをDLC02版に統合
  - 「対象」データ55種類の表記統一
  - DLC02残タスク: C-4（競馬場の効果値実照合等）、C-1（スキルツリーeffectEn、優先度低）
