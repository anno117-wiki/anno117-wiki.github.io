# 引き継ぎ: 次回セッション向け（2026-09-19 更新・第5版）

## git状態
- ブランチ: master。**`origin/master` と一致・全push済み**、作業ツリーはクリーン
- 最新コミット: `2bebc9d`。GitHub Pagesのデプロイも成功済み（`gh run list --repo anno117-wiki/anno117-wiki.github.io --limit 5` で確認可）
- **`docs-notes/` は `.gitignore` 対象**（`handover-next-session.md` / `building-icon-mapping.md` / `how-to-edit-site.md` / `wiki/` のみ例外で追跡）。今回作った調査メモ2本は**ローカルのみでGit未管理**
  - `docs-notes/research-alt-producers-coal-gold.md`（石炭・金の生産元、信仰神、サイロ、実機確認の記録）
  - `docs-notes/research-splendor-hippodrome-colosseum.md`（競馬場・円形闘技場の輝きバフ）
  - 消したくない場合は `.gitignore` に例外を足すか、必要な内容を別ファイルへ移すこと

## 本セッション（2026-09-19）完了分
本セッションは**単独セッション**（契約がProのため）で実施。家老の「直接作業しない」制約は外して作業した。

### A. 商品region整合性チェック（前回の最優先ミッション）【完了】
- 公式assets.xml(v2.1)のProduct資産(`ProductionRegions`)・生産施設の`AssociatedRegions`と全113商品を機械突合
- 誤り4件を修正: `chariots` / `brooches` / `cheese` / `handmirrors`（Roman → Celtic）。`ponies`(ポニー)・`chassis`・`ochs`・`reeds`・`seashells`・`silver`・`silver_ore`のregionsも連動して公式値に一致（ポニーは`chariots`チェーンの子だったためラティウム扱いだった。馬とは別商品で混同ではなかった）
- `charcoal`だけは公式でラティウム・アルビオン両方だが、`list.json`のregionsは各チェーンからの導出値のため`mosaics`(ラティウム)のみで**Romanのまま**（意図的に未変更）
- 「抜けている商品」: **なし**。公式Product 155件 = 商品113 + 非商品42（貨幣・許可証・サービス施設・労働力）
- エジプト(DLC03)専用の商品・生産施設はv2.1に**存在しない**（`Egyptian`は既存67商品のタグとして付くのみ）
- 手順の型: `productions/*.json`のregion修正 → `bun run tools/generate-goods-list.ts` → 差分確認 → `bun run build:site`

### B. 信仰神ページ新設 `/wiki/patrons`
- 生成: `tools/build-patrons-data.py` → `apps/wiki/docs/wiki/patrons.json`（表示は `patrons.md` / `PatronDetail.vue` / `patrons.data.ts`）
- 仕組み（公式`ReligionBalancing`）: 世界の信仰 祭壇1,000 / **奇跡4,000** / 高位祭神7,000。祭神変更で島の信仰は0にリセット
- 奇跡: **炭鉱=ウルカヌス、金鉱=メルクリウス・ルグス、サイロ=エポナ**（金鉱もウルカヌスという当初の認識は誤りだった）
- 局所効果1（生産アップ系）は「効果段階値=%」（+10%〜+150%）を実機確認済み。メルクリウス「交易術」は交易収益+10〜+150%
- 局所効果2の単位・内訳は**全神を実機確認済み**。表示定義は `build-patrons-data.py` の `LOCAL2_DISPLAY` / `LOCAL1_DISPLAY`（値を変えるときはここ）
  - エポナ「繁栄の手綱」は人口+1×段階 **と名声+2×段階**。ネプトゥーヌスの維持費は最大-70%（経済ガイドも-70%に訂正済み）
- エポナ節にサイロの説明を追加: 対象=羊牧場・養豚場・馬ブリーダー、牧場の横に設置、小麦を5分ごとに1個、生産性+100%と3サイクルごと+1個が重複
- 経済ガイド「信仰神による経済バフ」節から信仰神ページへリンク（金鉱・炭鉱の解放も記載）
- **未確認（要検証のまま）**: 奇跡の失効。世界の信仰が3,500を下回ると失効するか（公式のヒステリシス値: 奇跡3,500・祭壇800）

### C. モニュメントの輝きページ新設 `/wiki/splendor`（競馬場・円形闘技場、ランクI〜X）
- 生成: `tools/build-splendor-data.py` → `apps/wiki/docs/wiki/splendor.json`。ランクの必要な輝きと自然減少は両施設共通
- 特別な効果は同スクリプトの `SPECIALS` に手書き。**公式データと実機が食い違う場合は実機を優先**（競馬場IVの騎兵バフは実機の攻撃+1・防御+2。公式は防御+2・近接+2・突撃+2）
- 実機確認済み: 属性は効果範囲につく／自然減少はレース非開催時／獲得量はレース種類・着順・準備品で変わる／競馬場Xの戦車産出は島全体の馬ブリーダー
- **要検証のまま**: パトリキの住居への追加効果の対象と単位、競馬場Xの隣接効果(生産性+20%)、円形闘技場VIIの全部隊攻撃+1、円形闘技場Xの反乱阻止・祭り+25%（ゲーム内で明言なし）、円形闘技場の試合ごとの輝き獲得量
- 競馬場ガイドの円形闘技場「9段階」を**10段階に訂正**済み

### D. 石炭・金鉱石の生産元を商品一覧で分けて掲載
- 商品一覧(`/wiki/goods`)の石炭・金鉱石に、生産元ごとの建物効果・サイクルタイム・解放条件を表示。生成: `tools/build-goods-producers.py` → `goods-producers.json`（表示は `GoodsProducers.vue`）
- サイクルタイム（実機）: **金鉱150秒 / 炭鉱30秒 / 炭焼き師30秒**、金選鉱240秒（公式一致）。信仰神バフなどで大きく変わるため注記付き
- **計算機には金鉱・炭鉱を追加しない**（ユーザー決定。サイクルタイムが信仰神バフで大きく変わるため）
- 建物効果ページに炭鉱（`coal_mine` / `albion_coal_mine`）とラティウム用の炭焼き師（`charcoal_burner`）を追加
- 計算機 `mosaics.json` の炭焼き師を60→30秒に修正
- 建物効果の金選鉱・金鉱の住民層を patrician → **plebeian** に訂正（公式の維持費労働力と一致）

### E. 更新履歴
- 2026-09-19付で計9件を追記済み（信仰神ページ追加・商品の地域修正・輝きページ追加・信仰神の数値更新・競馬場ガイド訂正・石炭金の分割掲載・建物効果への炭鉱追加・計算機の炭焼き師修正・金選鉱金鉱の住民層訂正）

## 未コミット作業
なし（作業ツリークリーン、全push済み）。ただし上記のとおり `docs-notes/research-*.md` 2本はGit管理外

## 次セッションのミッション
**最優先ミッションはなし**。以下は候補（着手前にユーザーへ確認）。

- 要検証の実機確認（上記B・Cの「要検証のまま」）
- 経済ガイド「100%効率の生産チェーン比率」のパンの行にある「炭焼き師 0.5」が、炭焼き師30秒で正しいか未確認（計算機のパンのチェーンに炭焼き師は無く、数字の出どころ不明）
- 競馬場ガイド: 新ページ(`/wiki/splendor`)へのリンク未追加。馬需要(ランクVII)・戦車産出(ランクX)が本文では「レベルが上がると」とまとめ書きのまま
- DLC01ガイドの「新祭神ウルカヌス」から信仰神ページへのリンク未追加
- 獣脂(`lard`)の別の生産元アスピック職人(GUID5475, アルビオン)は、商品一覧に未対応（現行チェーンは31756を使用）。建物効果ページに載っているかも未確認
- GSC: 前回`wiki/items.html`と`wiki/buildings.html`を個別リクエスト済み（2026-09-18）。**結果反映を確認すること**。未リクエスト: `needs-index` / `population` / `regions` / `techs*` / `guide/*` / `updates` / 新設の`patrons` / `splendor`

## 保留・未解決（従来の持ち越し）

- DLC03: 2026年10月の公式デブログで情報更新予定。判明次第、`guide/dlc03-dawn-of-delta.md`とスキルツリー（`techs.json`のプレースホルダー→実エントリ、`techs-dlc03.md`新規作成）を更新
- `Kirjokansi`（GUID160494）は変更（NPC受動交易限定）が一次ソースに未反映のため`caution`継続。`Taludas/Anno-117-Item-Inspector`の更新待ち
- **未対応**: 建物アイコン154件・スキルツリーアイコン40ノード分は画像取得未実施（非表示化で安全化済み。ゲームアセット抽出が必要、要ユーザー判断）
- **未対応**: 「対象」データのうち55種類（「生産施設」等の総称カテゴリ）はbuildings-effects.jsonと名前が一致せずリンク化されない
- **要注意**: `buildings-effects.json`/`techs.json`のDLC02手編集データは一次ソース未反映のまま。一次ソース更新→`apply-skilltree-connections.py`再実行時は手編集値との差分を必ず確認
- **未解明（優先度低・実害なし）**: スキルツリーページの旧CLS問題の根本原因
- **未対応**: favicon.ico の404（軽微）
- **未調査**: v2.0.0.1で削除された3件のアイテム（GUID106844／106846／42057）
- 持ち越し（未着手）: C-4のうち競馬場(`hippodrome`)の**建設フェーズ材料**の実照合（輝きバフ10段階と効果値は今回`/wiki/splendor`で対応済み）／C-1【低】スキルツリー結合3件の effectEn が2文のまま（意図的）

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
- devサーバ(`bun run dev:wiki`)はCSRのためSPA遷移・アンカースクロールの検証には向かない。本番相当の検証は `bun run preview:wiki` を使う
- `bun run preview`はファイルを再ビルドしても、古いプロセスがポートを掴んだままだと404が出る。**再ビルド後は必ずプレビューを止めて起動し直す**。Windowsでは`PowerShell`ツールで`Get-NetTCPConnection -LocalPort 4173 -State Listen`→`Stop-Process -Id <OwningProcess> -Force`で確実に停止
- GitHub Pagesの本番デプロイ確認は `gh run list --repo anno117-wiki/anno117-wiki.github.io --limit 5`。push直後は前回の実行が先頭に出るため、`headSha`で今回分を選んで待つこと

### VitePress / Vite
- 日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- SPA遷移後のアンカースクロール: `useRoute()`にhashは無い。`useData()`のhashを使い、`setTimeout(100ms)`でVitePress自身のスクロール処理に勝つ必要がある
- モバイル用sticky要素の`top`は固定値`var(--vp-nav-height)`ではなく`var(--local-nav-height, var(--vp-nav-height))`を使うこと
- PC/モバイルでDOMを両方生成しCSSで出し分けるページ（items.md/goods.md/production-chains.md）で、`#id`アンカーを提供する場合は`id`を重複させず`data-anchor`属性にし、画面幅に応じて表示中(`offsetParent !== null`)の要素へJSで`scrollIntoView`する
- VitePressのデータローダーからnamed exportは不可（`export default { load() }`のみ）。新ページ(patrons/splendor)もこの形
- グローバル登録するVueコンポーネントは `apps/wiki/docs/.vitepress/theme/index.ts` の `enhanceApp` に足す（PatronDetail / GoodsProducers など）

### 生成スクリプト運用
- `tools/generate-goods-list.ts` / `generate-items-list.ts` は既存`list.json`等の手動メンテ値を継承する設計。再実行前にバックアップ・差分確認
- `tools/build-items-ja.py`は一次ソース参照先を`v2.1`。`caution`フィールドは手動追記のため再実行のたびに消える（Tiranna/Laevinus/Kirjokansiは再実行後に手動で戻す）
- `apply-skilltree-connections.py`はguid一致時にconnections等を無条件上書き。`_local/skilltree-full-data.json`をDLC対応版に更新しないまま実行しない
- **`tools/build-buildings-data.py`は既存の建物の効果値を更新するだけで、新しい建物は追加しない**。新規は`buildings-effects.json`に手で追加し、同スクリプトの`ID_TO_GUID`にも登録する（今回の炭鉱・炭焼き師がその例）
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
- 契約がProのため、ユーザーの指示で**単独セッション**にする場合がある（その場合、家老の「直接作業しない」制約は外れ、直接作業してよい）。ユーザーが実機(PS5)で確認した数値を提示する運用が多く、確認待ちの項目は「要検証」で残す

### 環境
- bun は 1.4.2（グローバル環境、2026-09-11時点）
