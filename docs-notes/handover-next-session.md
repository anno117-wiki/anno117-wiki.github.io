# 引き継ぎ: 次回セッション向け（2026-10-06 更新・第18版）

この文書には「今の状態・次の任務・保留・注意点」だけを書く。完了した作業の記録は `docs-notes/handover-archive.md` に移してあり、開始時に読む必要はない（文中の「アーカイブX節」で必要な箇所だけ引く）。

## git状態
- ブランチ: master。`60fc20e`（2026-10-06、更新履歴の追記）まで**push済み・本番反映確認済み**。2026-10-06の作業（運用整理、建物アイコンの復元、建物効果の全件照合と追加、モバイル表示の改善、更新履歴の追記）の経緯はアーカイブX節。この引き継ぎ書の更新コミットだけ、push されているかを `git status -sb` で確認すること。直近の作業は `git log -15`
- GitHub Pagesデプロイの確認は `gh run list --repo anno117-wiki/anno117-wiki.github.io --limit 5`
- **`docs-notes/` は `.gitignore` 対象**（`handover-next-session.md` / `handover-archive.md` / `building-icon-mapping.md` / `how-to-edit-site.md` / `dlc03-ingame-checklist.md` / `wiki/` のみ例外で追跡）。次の調査メモ3本は**ローカルのみでGit未管理**
  - `docs-notes/research-alt-producers-coal-gold.md`（石炭・金の生産元、信仰神、サイロ、実機確認の記録）
  - `docs-notes/research-splendor-hippodrome-colosseum.md`（競馬場・円形闘技場の輝きバフ）
  - `docs-notes/research-hippodrome-racer-stats.md`（2026-09-22新規。競馬場レーサー適性`ItemRacerPreset`の全数値、Item Inspectorリポジトリの配布方式変更リスク）
  - 消したくない場合は `.gitignore` に例外を足すか、必要な内容を別ファイルへ移すこと

## 未コミット作業
なし（この引き継ぎ書の更新分を除く。`git status -sb` で確認）。ただし上記のとおり `docs-notes/research-*.md` 3本はGit管理外

## 次セッションのミッション
**最優先ミッションはなし**。以下は候補（着手前にユーザーへ確認）。

- **【リマインド・ユーザー依頼 2026-10-05】2026年11月5日（アップデート3.0・DLC03「デルタの夜明け」配信日）以降の最初のセッションで、冒頭にユーザーへ声をかけること**: 「公式データ調査とGitHubからの情報収集の時期です」
  - 公式: Anno Union のパッチノート・デブログ（`https://www.anno-union.com/tag/anno-117-en/`、`/roadmap-for-2026/`）。10月中旬に配信・デブログの予告あり
  - GitHub: `Taludas/Anno-117-Item-Inspector`（v3.0データの有無。アーカイブO節のとおり全体データは配布されなくなった可能性が高い）、`agentquackyt/Anno117Calculator`（生産チェーンの更新）
  - 反映先: `guide/dlc03-dawn-of-delta.md`、スキルツリー（`techs.json`・`techs-dlc03.md`新規）、商品・生産チェーン・信仰神（新祭神3柱）・アイテム
  - **実機確認シート `docs-notes/dlc03-ingame-checklist.md` を用意済み（2026-10-06、`b86b273`）**。控える項目、反映先のファイル、事前に済ませた準備、配信後に決めることをまとめてある。配信後はまずこのシートを見ること
  - 事前に済ませた準備: 地域別商品ページと計算機の3地域対応（データが入るまで表示は従来どおり）、`wiki/techs-dlc03.md` の骨組み（スキル登録までビルド対象外）、住民層ページのアエギプトゥス節（準備中として公開）
  - クラウドの予約（2026-11-06 09:00 JST に1回、調査と報告のみ）: https://claude.ai/code/routines/trig_01WtBULkotMsf91c594bardj
  - DLC03ページには2026-10-05にリリース日（11月5日）とアップデート3.0の内容（統計メニュー拡張・スタンプ機能・バランス調整・栄誉の殿堂）を追記済み（`ffdcde5`〜`c111e2b`、push済み）

- **GSC「ページのインデックス登録」レポートの更新再開を確認**（アーカイブW節）: 2026-10-05時点で最終更新日が2026/09/21のまま止まっている。次にGSCを見るとき、最終更新日が動いたか、登録済み件数が18件から増えたかを見る。サイトマップの取得失敗は**追わない**（ユーザー決定）
- **検索CTRの比較（アーカイブU節）**: 2026-09-30に `/`・`guide/strategy.html`・`wiki/goods.html` のtitleを変更済み。10月中旬〜下旬に、`docs-notes/gsc-baseline-2026-09-30/` と同じ形式でGSCのCSVを出力し、3ページのCTR・順位・表示回数を比べる
- GSC「ウェブに関する主な指標」（アーカイブR節）: ユーザーがCrUXキャッシュ更新を待って再計測予定。相談があれば経過を確認
- アイコン圧縮: **wiki側は対応済み**（アーカイブV節。商品・建物をWebPサムネイル化）。**計算機側（`docs/calculator/icons/`、約21MB）は未対応**。計算機の初期ロードはアイコン5件206KBで、skill-*.png（1枚56〜60KB）が主。着手するなら計算機の表示サイズを確認してから
- 2026-10-02の調査で出た未着手の低優先度項目（ユーザー未依頼）: 計算機の使い方ページの「計算」リンク表記が実際のボタン名「開く」と不一致（`guide/calculator-guide.md:47`）／計算機ページで`/assets/images/anno_icon.png`が404（manifest経由と推測）／llms.txtにpatrons・splendor・スキル各ブランチ・DLC02/03・/wiki/が未掲載／計算機の初期ロードで`data/items/*.json`64件を個別fetch（1ファイル統合の余地）／wiki全ページのCLS 0.034（Layout.vueのセクションナビDOM挿入が原因と推測、合格域）
- 要検証の実機確認（アーカイブB・C節の「要検証のまま」）
- 競馬場ガイド: 馬需要(ランクVII)・戦車産出(ランクX)が本文では「レベルが上がると」とまとめ書きのまま（`/wiki/splendor` へのリンクは追加済み）
- 獣脂(`lard`)の別の生産元アスピック職人(GUID5475, アルビオン)は、商品一覧に未対応（現行チェーンは31756を使用）。建物効果ページに載っているかも未確認
- GSC: アーカイブI・N・Q節を参照。**guide系9件+`updates.html`は2026-09-28のURL検査で全件登録済みと確認済み**（アーカイブS節）。`techs-economy.html`等「クロール済み-インデックス未登録」表示は解消見込み（数日後に再確認）
- アイテム取得先(アーカイブQ節): Julia(ユリア)は実在・用途不明のため表示除外中。実機で「ユリア」という商人/NPCを確認できれば`tools/build-items-ja.py`の`NPC_NAME_EXCLUDED`から外して復活可能。GUID90573「花形の潜り手」の入手方法も未解明のまま
- Item Inspectorリポジトリの配布方式変更・全体データ入手先リスク（アーカイブO節）: 次パッチ時に改めて状況確認
- 隣接太字崩れバグ（アーカイブP節）の横展開チェック未実施。同節に載せた検索コマンドで他ページも確認するとよい
- 図に出す比率は各商品の最初の地域版のみ。アルビオン版の表示・アルビオンの燃料の実際（アーカイブL節）
- 宣伝: 案は提示済み（実施はユーザー判断）。日本語圏（X・Steam・Discord）→英語圏（Reddit r/anno 等）の順。上流のライセンス確認は済み（アーカイブK節。アイコン以外は自由に使用可）

## 保留・未解決（従来の持ち越し）

- DLC03: 2026年10月の公式デブログで情報更新予定。判明次第、`guide/dlc03-dawn-of-delta.md`とスキルツリー（`techs.json`のプレースホルダー→実エントリ、`techs-dlc03.md`新規作成）を更新
- `Kirjokansi`（GUID160494）は変更（NPC受動交易限定）が一次ソースに未反映のため`caution`継続。`Taludas/Anno-117-Item-Inspector`の更新待ち
- **建物アイコンは2026-10-06に153件を復元済み**: `4516e48`（2026-09-11）が「画像の実体が無い」として154件の割り当てを消していたが、画像は `apps/wiki/docs/public/icons/buildings/` に実在していた（誤判定）。今アイコンが無いのは4件だけ（`albion_mirror_factory`・`charcoal_burner`・`coal_mine`・`albion_coal_mine`、画像なし）。**画像の有無は必ず wiki 側のフォルダで確かめること**（`packages/shared/public/icons/buildings/` は計算機用の19枚だけ）。分類（公共・奇観・祭壇など）は `buildings.data.ts` がアイコン名の接頭辞から決めるため、アイコンを外すと分類も「生産」に化ける
- **対応しない（ユーザー決定 2026-09-19）**: スキルツリーのノードアイコンと、画像の無い建物4件のアイコン。PC版ゲームが無く新しい画像を入手できないため。**新規の画像入手は今後も提案しない**
- **未対応**: 「対象」データのうち55種類（「生産施設」等の総称カテゴリ）はbuildings-effects.jsonと名前が一致せずリンク化されない
- **要注意**: `buildings-effects.json`/`techs.json`のDLC02手編集データは一次ソース未反映のまま。一次ソース更新→`apply-skilltree-connections.py`再実行時は手編集値との差分を必ず確認
- **未解明（優先度低・実害なし）**: スキルツリーページの旧CLS問題の根本原因
- **未対応**: favicon.ico の404（軽微）
- **未調査**: v2.0.0.1で削除された3件のアイテム（GUID106844／106846／42057）
- 持ち越し（未着手）: C-4のうち競馬場(`hippodrome`)の**建設フェーズ材料**の実照合（輝きバフ10段階と効果値は今回`/wiki/splendor`で対応済み）／C-1【低】スキルツリー結合3件の effectEn が2文のまま（意図的）

## セッション開始時の確認事項【削除禁止】

### ピア・役割確認
- **単独セッションが基本**（2026-10-06決定、CLAUDE.md「セッション体制」）。単独のときは役決め・peer通信をせず、以下の並列用の項目は飛ばしてよい
- 3セッション並列作業の場合、`list_peers(scope=repo)` で既存ピアの役割を確認してから作業着手
- **役割が確定するまで実作業を開始しない**（役決め完了 = set_summary に役名のみ残った状態）
- 同一ファイルへの競合を避けるため、着手前に担当範囲を家老へ確認・報告すること
- 役割: 家老（采配）・侍（実装/ビルド）・忍者（調査/検証）・隠密（補佐・4番手）
- **このファイルを編集する際は「セッション開始時の確認事項」セクションを消さないこと**（隠密が管理）

## 注意点（変わらず有効・今回追加分含む）

### ビルド
- 必ず `bun run build:site`（wikiも含む全ビルド）
- build:site は最後の `[5/5]` で `docs/` を自動検査する（必須ファイル・sitemapの実ファイル・サイト内リンク切れ。2026-10-06追加、`scripts/check-site.ts`）。問題があれば exit 1 で止まる。検査だけなら `bun run check:site`。拡張子なしのリンク（`/wiki/items` 等）は GitHub Pages が `.html` を補うため正常扱い
- sitemap の lastmod はソース.mdの最終コミット日から作るため、**ソースをコミットする前にビルドすると1つ前の日付になる**（2026-10-06に4ページ分のずれを再ビルドで解消）。気になるときはコミット後にもう一度ビルドする
- devサーバ(`bun run dev:wiki`)はCSRのためSPA遷移・アンカースクロールの検証には向かない。本番相当の検証は `bun run preview:wiki` を使う
- `bun run preview`はファイルを再ビルドしても、古いプロセスがポートを掴んだままだと404が出る。**再ビルド後は必ずプレビューを止めて起動し直す**。Windowsでは`PowerShell`ツールで`Get-NetTCPConnection -LocalPort 4173 -State Listen`→`Stop-Process -Id <OwningProcess> -Force`で確実に停止
- GitHub Pagesの本番デプロイ確認は `gh run list --repo anno117-wiki/anno117-wiki.github.io --limit 5`。push直後は前回の実行が先頭に出るため、`headSha`で今回分を選んで待つこと
- **`docs/`をローカルサーバー（`python -m http.server`等）で配信中に`build:site`すると`EBUSY: rm docs`で失敗する**。サーバーを止めてからビルドする
- Lighthouseのローカル実行: `CHROME_PATH="C:/Users/kojif/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe" npx -y lighthouse@12 <URL> --only-categories=performance --output=json --output-path=<file> --chrome-flags="--headless=new" --quiet`（既定はモバイル、`--preset=desktop`でデスクトップ）。**`python -m http.server`は非圧縮配信のため、ローカルのスコアは本番より大幅に低く出る**。判断は本番URLで計測すること
- **見た目比較の罠**: この開発PCには Noto Sans JP がインストール済み（`C:\Windows\Fonts\NotoSansJP-VF.ttf`）。フォントの比較をするときは、フォント指定からNotoを外さないと一般的なWindows（游ゴシック）の見え方にならない

### VitePress / Vite
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- SPA遷移後のアンカースクロール: `useRoute()`にhashは無い。`useData()`のhashを使い、`setTimeout(100ms)`でVitePress自身のスクロール処理に勝つ必要がある
- モバイル用sticky要素の`top`は固定値`var(--vp-nav-height)`ではなく`var(--local-nav-height, var(--vp-nav-height))`を使うこと
- PC/モバイルでDOMを両方生成しCSSで出し分けるページ（items.md/goods.md/production-chains.md）で、`#id`アンカーを提供する場合は`id`を重複させず`data-anchor`属性にし、画面幅に応じて表示中(`offsetParent !== null`)の要素へJSで`scrollIntoView`する
- VitePressのデータローダーからnamed exportは不可（`export default { load() }`のみ）。新ページ(patrons/splendor)もこの形
- グローバル登録するVueコンポーネントは `apps/wiki/docs/.vitepress/theme/index.ts` の `enhanceApp` に足す（PatronDetail / GoodsProducers など）
- **ただし大きなデータ（JSON・データローダー）をimportするコンポーネントはグローバル登録しない**。グローバル登録すると全ページ共通のtheme chunkに入り全ページが読み込む（`BuildingsTable`がこれで404KBになっていた、アーカイブV節）。使うページの`<script setup>`で個別にimportする

### 生成スクリプト運用
- `tools/generate-goods-list.ts` / `generate-items-list.ts` は既存`list.json`等の手動メンテ値を継承する設計。再実行前にバックアップ・差分確認
- `tools/build-items-ja.py`は一次ソース参照先を`v2.1`。`caution`フィールドは手動追記のため再実行のたびに消える（Tiranna/Laevinus/Kirjokansiは再実行後に手動で戻す）
- 同スクリプトの`source`（取得先）解決ロジック（2026-09-24追加、アーカイブQ節参照）は`NPC_NAME_JA`/`FESTIVAL_NAME_BY_GUID`/`ENDGAME_TECH_JA`等の辞書はコード内に確定値として書いてあるため、再実行しても消えない（`caution`とは違い手動で戻す必要はない）。新しいDLCでNPC・祭り・エンドゲーム技術が追加されたら辞書に追記すること
- `apply-skilltree-connections.py`はguid一致時にconnections等を無条件上書き。`_local/skilltree-full-data.json`をDLC対応版に更新しないまま実行しない
- **`tools/build-buildings-data.py`は既存の建物の効果値を更新するだけで、新しい建物は追加しない**。新規は`buildings-effects.json`に手で追加し、同スクリプトの`ID_TO_GUID`にも登録する（今回の炭鉱・炭焼き師がその例）
- **建物効果の全件照合（2026-10-06）**: 公式v2.1と突き合わせ、効果値の誤りは無し。9建物を追加（ラティウムの鉄鉱山・溶鉱炉・瓦工房・武器工房・防具工房・石灰岩の採石場・大理石の採石場、アルビオンの花崗岩の採石場・地窯）。粉ひき所の維持費を-12に修正（実機確認済み）。採石場3件と地窯はアイコン画像なし。石灰岩の採石場のアルビオン版（GUID 5978、効果は同じ）は未追加
- **`skillBonuses`（スキルで追加される範囲効果）は `buildings-effects.json` に手で入れてある**（13スキル・13建物）。公式では `BuildingBuff` の `AdditionalFunctionalEffect` → `Effect` → 対象プール、配る元が `Tech` のもの。スキルを足すDLCが来たら同じ辿り方で追記する。祭り・信仰神・専門家・選択肢イベント由来の範囲効果は**載せない**（ユーザー決定）。野営地の行（`military_camp`）は公式の歩兵・騎兵・攻城部隊の野営地に当たるものとして「陣地戦略」を付けた
- **`tools/build-buildings-data.py` の参照先を `v2.1/assets.xml` に変更**（以前は6月の `config/export/assets.xml` で、v2.0以降の変更が入らなかった）。`MANUAL_IDS`（円形闘技場）は上書きしない。再実行して内容が変わらないことを確認済み。出力の改行はCRLFになるので、差分を見るときは内容で比べること。新しいデータ版が来たら、このパスを差し替える
- **今回追加した生成スクリプト**（いずれも`_local/anno-official-data/`が必要）: `build-patrons-data.py`（信仰神）/ `build-splendor-data.py`（輝き）/ `build-goods-producers.py`（石炭・金の生産元）。手書きの表示定義（`LOCAL2_DISPLAY`・`SPECIALS`・`PRODUCERS`）は実機確認済みの値のみ載せ、未確認は載せない方針
- **ツールの罠**: Write/ヒアドキュメントで`\uXXXX`のような文字エスケープを書くと実文字に展開されることがある（不可視のゼロ幅スペースがファイルに残る）。日本語の範囲指定などは**実文字で直接書く**

### データの扱い
- 公式データの数値と実機表示が食い違う場合は**実機を優先**し、公式の値は調査メモに残す。未確認の値は「要検証」を付ける
- 公式データのGUIDはテンプレート名にスペース入り（`Production Marsh`等）や`SlotFactoryBuilding7`（鉱山系）など多様。名前が`Production`で始まるかで絞ると取りこぼす
- 生産施設の`CycleTime`は、記載のあるものは現行JSONの時間と一致(120/120件)。記載のない山系施設の標準は30秒

### 生産チェーン図（`ProductionChainSvg.vue`）
- ノード配置ロジック（葉ノード最長パス降順＋内部ノード最小行揃え）と矢印コーナー位置（到達ノード直前）は公式ツール準拠として確定済み。変更する場合は必ず公式ツール（Anno117Calculator等）のスクリーンショットと突き合わせる
- レイアウトの見た目に関する指摘は、どの要素（配置か接続線か）についてか早めに切り分けて確認する

### コメントWorker情報
- Worker URL: `https://anno-comments.anno117wiki.workers.dev`
- KV namespace: COMMENT_KV（id=b102b98e22de49729c8702ddc7abaae5）
- リポジトリ: anno117-wiki/anno117-wiki.github.io（Issues に user-comment ラベルで蓄積）

### 運用
- **単独セッションが基本**（契約がProのため。2026-10-06決定）。調査・実装・ビルド・コミットまで1セッションで行う。並列（家老・侍・忍者）はユーザーが起動プロンプトを貼ったときだけで、そのときに限り家老の「直接作業しない」制約が付く。ユーザーが実機(PS5)で確認した数値を提示する運用が多く、確認待ちの項目は「要検証」で残す
- `.claude/settings.json` の「[家老警告]」フック（`git commit` やビルドのたびに警告を出していたもの）は2026-10-06に撤去した（ユーザー許可済み）。並列時の家老のガードは anno-roles mod（`/role 家老`）が担う

### 環境
- bun は 1.4.2（グローバル環境、2026-09-11時点）

