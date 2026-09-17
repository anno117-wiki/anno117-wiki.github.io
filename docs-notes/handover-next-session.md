# 引き継ぎ: 次回セッション向け（2026-09-17 更新）

## git状態
- ブランチ: master。**`origin/master` と一致・全push済み**
- 作業ツリーはクリーン
- 最新コミット: `e602dd2`

## 本セッション（2026-09-17）完了分

| コミット | 内容 |
|---------|------|
| 7d1140b | wiki/regions.md(地域別商品)がsidebar/nav未掲載で孤立していたのを修正 |
| c0822ad | VITE_WORKER_URL未読込でコメント機能が全ページで壊れていたのを修正 |
| f9b1c48 | DLC03「デルタの夜明け」の公式発表情報を反映 |
| 0500773 | DLC03スキルツリーの受け皿を非表示状態で用意 |
| 7b5de95 | 前セッションのhandover更新＋.claude/skills・agent-sops追加コミット |
| d684a8c | 本セッション前半分の引き継ぎ更新 |
| d2523a7 | 更新履歴にDLC03情報追加・コメント機能修正を記載 |
| 8481ef1 | パッチ2.1のヒロイックアイテム変更を告知・サイト文言を口語化 |
| f83c5a9 | スキルツリーページのモバイル初期表示コストを削減（content-visibility） |
| e602dd2 | スキルツリーを5ブランチ別ページに分割しCLS/LCPを改善 |

前半5件（7d1140b〜d2523a7）の詳細は git log 参照。以下、後半4件（8481ef1〜e602dd2）を記録する。

### 8481ef1: パッチ2.1告知＋サイト文言の口語化
- **パッチ2.1(Pax Romana, 2026-09-17公開)** でヒロイック専門家3件の効果対象が変更されたことをAnno Union公式パッチノートで確認:
  - Laevinus（ラエウィヌス）: 全採掘施設 → 採石場・砂金採取場・粘土採掘場のみに限定
  - Kirjokansi（キルョカンシ）: プレイヤー間取引 → NPCとの受動交易のみに変更
  - Tiranna（ティランナ）: 染料 → 顔料に対象変更
  - **正式な新数値は未発表**。GitHub `Taludas/Anno-117-Item-Inspector` にもまだ反映なし（2026-09-17時点でユーザーが確認済み）
  - `packages/shared/public/data/items-full.json`の該当3件に`caution`フィールドを追加、`items.md`に「要検証」バッジ表示（ホバーで詳細）。数値自体は正式データ判明まで**旧データのまま保持**
  - 更新履歴にも告知エントリを追加
- **サイト文言の軽度口語化**（ユーザー指示「ある程度口語体にしたい」）: index.md, guide/getting-started.md, guide/strategy.md, guide/early-game-strategy.md, guide/economy-guide.md, guide/research-guide.md, guide/trade-guide.md, guide/dlc01-ashes-of-prophecy.md, guide/dlc03-dawn-of-delta.md, wiki/techs.md, wiki/population.md, wiki/needs-index.mdを対象に、体言止め・硬い言い回しをですます調の話し言葉寄りに調整。DLC01/DLC03は元々「である調」だったのをですます調に統一
- **副次的な修正**: 口語化中にユーザーが`research-guide.md`の誤りを指摘。「経済/市民/軍事の3トラック+DLC灰の予言ブランチの計4系統」という記述がDLC02(競馬場)ブランチを計上しておらず誤りだった。実際に`techs.json`を集計し直し「3トラック+DLC2ブランチ=計5系統、204件」に訂正

### f83c5a9 → e602dd2: スキルツリーのモバイルパフォーマンス改善【重要】
- 発端: ユーザーから「モバイル検索がPCの3倍多い、モバイル表示を優先させたい」という相談
- chrome-devtools MCP（Lighthouse・Performance trace）でモバイル実測（360x800viewport, CPU4倍スロットリング, Fast4G）:
  - トップページ・計算機ページはLCP 400-600msで良好
  - **スキルツリーページ(旧techs.html)が204件×5ブランチを一括レンダリングしており、LCP 1018ms・CLS 0.16（Googleの基準で「要改善」）と判明**
- **f83c5a9**: まず`content-visibility: auto`をtree-viewportに追加し画面外ブランチのレイアウト計算を遅延。部分的に改善したが不十分
- CLS原因調査で以下4パターンを試したが**いずれも効果なし**（時間をかけたが未解決、一旦切り上げ）:
  1. `Layout.vue`のセクションナビ挿入処理のnextTick除去
  2. `techs.md`に`outline: false`をfrontmatterで設定
  3. `## 関連ガイド`見出しをh2から`<p>`に変更（目次スキャン対象から除外）
  4. `.section-nav-links`の挿入先を`.container`外（`.VPLocalNav`直下）に変更
  - 根本原因はVitePress標準コンポーネント`VPLocalNavOutlineDropdown`が、ページ読み込み後に見出し検出を再実行し「Return to top」→「On this page」にボタン内容を切り替える際に発生。`outline:false`をfrontmatterに設定してもクライアント側の再計算では効果が出ない、というVitePress内部の未解明の挙動（SSR出力には正しく反映されているのに）
- **e602dd2**: ユーザー提案「5分割してリンクで飛ぶ仕様に」で解決。204件を経済/市民/軍事/灰の予言/競馬場の5ページに分割:
  - `SkillTreeBranch.vue`（新規）: 単一ブランチ描画用の再利用コンポーネント。旧techs.mdのzoom/detail-panel/tree-viewport/tooltipロジックを移設
  - `techs.md`: 5ブランチへの件数付きリンク一覧のハブページに変更
  - `techs-{economy,civic,military,dlc01,dlc02}.md`（新規5ページ）: 各ブランチの個別ページ
  - `config.ts`のsidebarに5ブランチへの階層リンクを追加、`theme/index.ts`に`SkillTreeBranch`をグローバル登録
  - **結果**: DOM要素数 1046→454（経済ページ）、CLS 0.16→**0.00**（ハブページ）/**0.03**（各ブランチページ、Googleの基準で「Good」）に劇的改善。5分割が偶然CLS問題そのものも解消した
  - **DLC03のスキルツリーは現状`hidden:true`のプレースホルダーのままなので`techs-dlc03.md`は未作成**。実データ判明後は他5ページと同じ構成で追加すればよい
- 全変更を本番反映後、chrome-devtools MCPでモバイル実機相当の見た目を一通り確認済み（ハブページ・経済ブランチページ・DLC03ページ・items.mdの要検証バッジ・口語化ページ、すべて正常表示）

## 未コミット作業
なし（作業ツリークリーン、全push済み）

## 保留・未解決（次セッションへ）

- **次に着手する候補（ユーザーが次回対応したいと明言）**: `wiki/items.html`（アイテム一覧）のモバイル表示改善。テーブルの列数が多く横スクロールが必要になっており、行の高さも縦に間延びして見える。今回のセッションで実機確認時に発見、対応は次セッション送りとした
- **要確認**: GSCサイトマップの削除→再送信（2026-09-17実施）の結果。本セッション中にユーザーからの報告が無いまま終了したため、次セッション開始時に状況を尋ねること。改善しなければsitemap経由の一括登録は諦め、GSCのURL検査ツールでの個別ページ「インデックス登録リクエスト」運用への切替を提案する
- **未解明（優先度低）**: スキルツリーCLS問題の根本原因（VPLocalNavOutlineDropdownのheaders検出タイミング、`outline:false`がクライアント側で効かない件）。5分割で実害は消えたため深追い不要だが、今後同様に重いページ（大量ノード一括レンダリング等）を追加する際は要注意
- **未対応**: favicon.ico の404（GSCクロール統計で検出、軽微・SEO実害なし）
- **未対応**: 「対象」データのうち55種類（「生産施設」等の総称カテゴリ）はbuildings-effects.jsonと名前が一致せずリンク化されない
- **未調査**: v2.0.0.1で削除された3件のアイテム（GUID106844／106846／42057）が公式エクスポート対象から外れた理由
- **未対応**: 建物アイコン154件・スキルツリーアイコン40ノード分は画像取得未実施（表示は非表示化で安全化済み。根本解決にはゲームアセット抽出が必要、要ユーザー判断）
- **要注意**: `buildings-effects.json`/`techs.json`のDLC02手編集データは一次ソース未反映のまま。一次ソース更新→`apply-skilltree-connections.py`再実行時は手編集済み値との差分を必ず確認すること（無条件上書きで消失するリスクをdocstringに警告済み）
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
- **今回発見**: `apps/wiki/docs/.vitepress/cache/`が古いframontmatter設定を残していることがある（`outline:false`が反映されず古い挙動のままになった事例あり）。frontmatterやconfig.tsのビルド挙動に関わる設定を変えたのに反映されないときはまずキャッシュ削除(`rm -rf apps/wiki/docs/.vitepress/cache`)してから再ビルドすること
- **今回発見**: `bun run preview`（vitepress preview）はファイルを再ビルドしても、ブラウザ側が古いHTMLを304キャッシュしたまま新しいハッシュ付きJS/CSSを404にすることがある。挙動がおかしい時はプレビューサーバー自体を再起動する（ポート4173のプロセスをkillして`bun run preview`を再実行）のが確実

### VitePress / Vite
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- SPA遷移後のアンカースクロール: `useRoute()`にhashは無い。`useData()`のhashを使い、VitePress自身のスクロール処理に`setTimeout(100ms)`で勝つ必要がある
- VitePressの見出しslug化は濁点・半濁点を含む文字をNFD分解する。リンク先見出しに濁点等が含まれる場合`.normalize('NFD')`してから`encodeURIComponent`すること（`items.data.ts`の`RESIDENCE_TIER_ANCHOR`参照）
- VitePressのsrcDir（`apps/wiki/docs`）とpackage.jsonのあるワークスペースルート（`apps/wiki`）がズレているプロジェクトでは、Viteの`envDir`もsrcDir基準になるため、`.env.production`等をワークスペースルートに置いている場合は`config.ts`で`vite.envDir`を明示しないと環境変数が読み込まれない（`import.meta.env.X`が常に`undefined`になり、気付きにくいバグを生む）
- **今回発見**: ページのfrontmatterに`outline: false`を設定しても、モバイル用の`VPLocalNavOutlineDropdown`（目次ドロップダウン）はクライアント側の再計算タイミングで意図通りに反映されないことがある（SSR出力・埋め込みデータには正しく`outline:false`が入っているのに、実際のブラウザでは目次ボタンが後から出現しCLSを起こす）。原因未特定。回避策は「ページ自体を軽量化する」方向（今回はスキルツリー5分割で回避）

### 生成スクリプト運用
- `tools/generate-goods-list.ts` / `tools/generate-items-list.ts` は既存`list.json`等の手動メンテ値を継承する設計。再実行する際は必ず事前にバックアップ・差分確認してから採用すること
- `apply-skilltree-connections.py`はguid一致時にconnections等を無条件上書きするため、`_local/skilltree-full-data.json`をDLC対応版に更新しないまま実行しないこと

### スキルツリーページの構成（今回大幅変更）
- `wiki/techs.md`は5ブランチへのリンク一覧のみを表示する**ハブページ**（旧: 全ブランチを1ページに一括表示）
- 実際のツリー描画は`wiki/techs-{economy,civic,military,dlc01,dlc02}.md`の5ページに分割。各ページは`<SkillTreeBranch>`コンポーネントを1つ呼ぶだけのシンプルな構成
- `SkillTreeBranch.vue`（`.vitepress/components/`）が実際の描画ロジック（zoom操作・詳細パネル・ツリーグリッド・ツールチップ・パン操作）を持つ。新しいブランチページを追加する際はこのコンポーネントを流用すること
- `techs.data.ts`の`(techsJson as {...}).techs.filter((t) => !t.hidden)`により、`techs.json`の各エントリに`hidden: true`を付けると画面に一切表示されなくなる（`byBranch`から除外）。DLC03はこの機構で現在非表示（`branchOverride: "dlc03"`のプレースホルダー1件のみ）。実データ判明後はプレースホルダーを実エントリに置き換えて`hidden`を外し、`techs-dlc03.md`を他5ページと同じ構成で追加すればよい

### コメントWorker情報
- Worker URL: `https://anno-comments.anno117wiki.workers.dev`
- KV namespace: COMMENT_KV（id=b102b98e22de49729c8702ddc7abaae5）
- リポジトリ: anno117-wiki/anno117-wiki.github.io（Issues に user-comment ラベルで蓄積）
- 2026-06-29の`.env.production`作成〜本セッション(2026-09-17)のenvDir修正まで、本番でコメント取得・投稿が機能していなかった可能性が高い。今後はビルド成果物のJSにWorker URLの実値（`https://anno-comments.anno117wiki.workers.dev`）が埋め込まれているか、リリース前に念のため確認する習慣を推奨

### 環境
- bun は 1.4.2（グローバル環境、2026-09-11時点）

## 次セッションのミッション【重要】

- **最優先**: GSCサイトマップ再送信の結果確認（ユーザーからの報告待ち、本セッション終了時点で未報告）
- **次の作業候補（ユーザーが明言）**: `wiki/items.html`（アイテム一覧）のモバイルテーブル表示改善（横スクロール・行間延びの解消）
- DLC03: 2026年10月の公式デブログで情報更新予定。詳細判明次第、`guide/dlc03-dawn-of-delta.md`とスキルツリー（`techs.json`のプレースホルダー→実エントリ、`techs-dlc03.md`新規作成）を実データに更新すること
- パッチ2.1のヒロイックアイテム3件（Laevinus/Kirjokansi/Tiranna）: GitHub `Taludas/Anno-117-Item-Inspector`が更新されたら正式な新数値を反映し、`items-full.json`の`caution`フィールドを削除すること
- その他、以下から選択:
  - 建物アイコン154件・スキルツリーアイコン40ノード分の画像抽出作業（要ユーザー判断）
  - `buildings-effects.json`/`techs.json`の一次ソースをDLC02版に統合
  - 「対象」データ55種類の表記統一
  - DLC02残タスク: C-4（競馬場の効果値実照合等）、C-1（スキルツリーeffectEn、優先度低）
