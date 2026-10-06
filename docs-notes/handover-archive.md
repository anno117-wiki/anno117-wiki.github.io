# 引き継ぎ書アーカイブ（完了済み作業の記録）

`handover-next-session.md` から移した完了済み作業の記録。セッション開始時に読む必要はない。
引き継ぎ書の「アーカイブX節」は、このファイルの「### X.」を指す。新しい完了分は末尾に追記する。

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
- 2026-09-19付で計11件を追記済み（信仰神ページ追加・商品の地域修正・輝きページ追加・信仰神の数値更新・競馬場ガイド訂正・石炭金の分割掲載・建物効果への炭鉱追加・計算機の炭焼き師修正・金選鉱金鉱の住民層訂正・経済ガイドのパン比率訂正・データベースメニュー追加）

### F. 経済ガイドのパン比率をv2.0に合わせて訂正（`8240599`）
- 「100%効率の生産チェーン比率」のパンを 小麦農場2・粉ひき所1・パン屋2・炭焼き師0.5 → **小麦農場3・粉ひき所1・パン屋3・炭焼き師0.75** に訂正
- 原因: v2.0で粉ひき所が30秒→20秒に短縮（`403065c`でbread.jsonは修正済みだったがガイドが旧値のまま）
- 根拠: 公式v2.1のassets.xml。パン屋=小麦粉1→パン1・60秒・燃料要、粉ひき所=小麦1→小麦粉1・20秒、小麦農場=小麦1個・60秒。炭焼き師は計算機の定数（1個が燃える120秒・生産30秒）から1軒あたり0.25
- 炭焼き師の燃焼時間120秒は、**公式 assets.xml で確認済み**（`EconomyFeature`(GUID1010000)の `Fuel/Products` に `FuelProduct 2085`・`ProductionTime 120000`ms）。炭焼き師のサイクル30秒は assets.xml に記載が無く、実機確認値
- 同ガイドの武器・ネックレス等の他の行は**確認不要**（ユーザー申告 2026-09-19: v2.0でサイクルタイムが変わったのはパンのみ）

### G. 上メニュー「データベース」追加と導線の整理（`562498f`）
- 上メニューは5項目: ホーム / 攻略ガイド / データベース（ドロップダウン）/ 更新履歴 / 計算機。個別項目（商品・生産品・建物効果等）は上メニューから外した
- データベース配下とwikiサイドバー（`config.ts` の `nav` / `sidebar['/wiki/']`）は同じ4グループ: 生産（商品一覧・生産チェーン一覧・地域別商品・商品需要逆引き）/ 建物・住民（建物効果・住民層）/ 成長・信仰（スキルツリー・信仰神・モニュメントの輝き）/ アイテム（アイテム一覧）
- 呼び名を「商品」に統一（「生産品」は廃止。needs-indexのタイトル等を修正済み。ソース内のTODOコメントには「生産品」が残る）
- ドロップダウンボタンの配色は `custom.css` の `.VPNavBarMenuGroup` で指定（ナビが紺地のため既定色だと文字が見えない）
- 攻略ガイド内の「データベース」ボタン（`Layout.vue` のセクションナビ）は `/wiki/goods` のまま変更なし
- 実画面確認済み: PC幅・800px幅・スマホ幅のハンバーガー、ダークモード、ドロップダウンの実クリック（後2つはユーザー確認 2026-09-19）。**未確認: E2E（wikiのナビ文言への依存が無いことはgrepのみ）**
- 新しいwikiページを追加したら、`nav` と `sidebar['/wiki/']` の**両方**に同じグループで足すこと

### H. ガイド間リンクの追加（`c9ae207`）
- DLC01ガイドの新祭神ウルカヌス → `/wiki/patrons#vulcan`、競馬場ガイド「輝きボーナス」節 → `/wiki/splendor` を追加（前回の持ち越し2件は完了）
- 更新履歴（`updates.json`）には載せていない（リンク追加のみで、ユーザー向けに載せるほどではないと判断）

### I. Google Search Console・コメント機能の確認（2026-09-19）
- **sitemap.xml 自体は正常**: 公開URLが200・`application/xml`、`<urlset>`＋名前空間あり、`<loc>` 28件、Googlebot系UAでも同一応答、robots.txt に Sitemap 行あり。Firefoxのツリー表示は名前空間宣言を隠すため `<urlset>` が空に見えるが正常（`view-source:` で確認可）
- **GSCのサイトマップ画面**: 最終読み込み09/17・検出ページ0・「サイトマップを読み込めませんでした」、再送信後は「取得できませんでした」。エラー詳細は出ない。URL検査のライブテストは sitemap.xml が「Googleに登録できます」で成功済み。原因は特定できず、Google側の処理待ちの可能性が高い
  - **数日待って再確認**すること。変わらなければ別名ファイルでの再送信を検討（効果は未確認）。待つ間の再送信は不要
  - 「クロール済み - インデックス未登録」に sitemap.xml が1件出るが、sitemap はインデックス対象外なので正常。検証が「失敗」になっても無視してよい
  - `/calculator/` は sitemap に含まれない（wiki側の生成物のみ）
- **個別リクエスト済み**: 09/18 `wiki/items.html`・`wiki/buildings.html`／09/19 に4件（URLは記録なし）。**結果反映を確認すること**（URL検査で再検査）
- **未リクエスト候補**: `/`・`/calculator/`・`guide/getting-started`・`wiki/goods`・`wiki/production-chains`・`guide/economy-guide` ほか `needs-index` / `population` / `regions` / `techs*` / `guide/*` / `updates` / `patrons` / `splendor`（1日10件前後が上限）
- **コメント機能は正常**: 投稿→GitHub Issue作成→ページ表示→運営返信の表示→close後に消える、まで実ページで確認。テスト投稿 #8・#9 は close 済み。実ユーザーの投稿は0件（#1〜#9 はすべてテスト）。サイト側の来訪がまだ少ないためと見られる
  - 種別バッジに色が付かない: Worker が種別を日本語（コメント等）で返し、CSSは英語クラス（`.comment` 等）を待つため（`UserComments.vue` 17行目・229〜240行目）。ユーザー判断で「問題ない」ため**未修正**
  - 確認コマンド: `gh issue list --repo anno117-wiki/anno117-wiki.github.io --label user-comment --state open`

### J. OGP（SNS共有カード）の追加（`9c86182` / `6337e3e`）
- 全ページに `og:*` と `twitter:card`（`summary_large_image`）を出力。`config.ts` の `buildOgpTags`（`transformHead` から呼ぶ）。タイトルは「ページ名 | Anno 117攻略Wiki」、説明は各ページの `description`（無ければ `SITE_DESCRIPTION`）。パンくずのJSON-LDは従来どおり併存
- 共有画像 `images/ogp.png`（1200x630・紺グラデーション＋既存 `anno_icon.png` の「A」マーク＋「Anno 117 攻略Wiki／生産チェーン計算機つき」）。ユーザーが3案から選択
  - 不採用: スプラッシュ画像の切り出し（「Calculator」表記・Ubisoftロゴ入りで、権利は**未確認**）／スプラッシュをぼかして文字を重ねる案（焼き込み文字が透ける）
- **`public/images` は `packages/shared/public/images` へのシンボリックリンク**だが、`core.symlinks=false` のため git は**両方のパスを別ファイルとして追跡**する。画像を足すときは両パスをコミットすること（既存画像も同じ形）
- **未対応（ユーザー判断で保留）**: 計算機 `/calculator/`（別SPA）には OGP 未設定。URLを共有してもカードが出ない。付けるなら `apps/calculator` の `index.html` にタグを足す
- 未確認: 公開後の実際のカード表示（Discord等。サービス側のキャッシュに注意）
- 型チェック: `config.ts` に**既存の型エラー1件**（トップレベルの `search` が `UserConfig` に無い）。動作に影響なし・今回の変更とは無関係・未修正

### K. 上流計算機のライセンス確認と、計算機を残す方針（2026-09-20）
- 上流 agentquackyt/Anno117Calculator にはLICENSEファイルが無いため、2026-09-19 にユーザーが英語でIssueを立てて問い合わせた（https://github.com/agentquackyt/Anno117Calculator/issues/6 。READMEの謝辞にも許諾の根拠として同URLを記載済み）。**作者が2026-09-20に回答**: 「The icons are property of Ubisoft, everything else is free to use (without attribution, if you like)」
  - アイコン以外（生産データ・コード等）は自由に使用可、表記は任意。アイコンはUbisoftの所有物
  - ユーザーは、この回答を受けて**計算機を残す方針に決定**（当初は「ライセンスの懸念で消したい」だった）。`/calculator/` の転送ページ等の削除作業は**不要**
  - 返信は投稿済みの想定（お礼＋「注記をwikiに追加する」旨＋サイトの案内＋LICENSE追加の軽い依頼）。LICENSEファイル追加の依頼への返答は未確認
- リポジトリ・README の「生産データとアイコンは公式計算機から」の記述は現状のまま
- アイコンの扱い: ユーザーの方針は「**追加も提案もしない**」（PC版が無く画像ソースが無い）。既存アイコンはそのまま

### L. 生産チェーン図に建物数の比率を表示（`2e2c50a` ＋ 表示の改善）
- `tools/build-chain-ratios.py`（要 `_local/anno-official-data/v2.1/assets.xml`）→ `apps/wiki/docs/wiki/chain-ratios.json`（62件。`counts` と `fuel`）。データローダーは `production-chains.data.ts`
- 表示（`ProductionChainSvg.vue`）: 各ノードの角に「×N」バッジ（建物数の比率）。**燃料が要る建物はパネル下段に「石炭×N」**（N = その建物に燃料を届ける炭焼き師の数。燃料のあるチェーンは全62件中25件で、その図は全ノードの高さが60、無い図は44）
- 説明文は図ごとには出さず、**ページ上部の一文**（`production-chains.md`: 「図の『×』の数字は、ブーストなしの100%効率で回すときの建物数の比率です（『石炭×』は…炭焼き師の数）」）だけ。図の下の注記は削除済み。右端・下端の枠線が切れないよう viewBox に +2px の余白（`EDGE_SLACK`）
- 計算式: 根=1として、子の必要数 = 親の数 × (親の入力量/親サイクル) ÷ (子の産出量/子サイクル)。全建物が整数になる最小倍率（60以内）で掛ける。燃料は「燃料が要る建物ごと × (炭焼き師サイクル30秒÷燃焼120秒)」を `fuel` に出力（合計は旧 `fuelBurners` と同じ。例: パン0.75、ネックレス 1.5＋1 = 2.5）
- 建物の構成（どれがどれに供給するか）は既存の `productions/*.json`、数値は assets.xml。JSONと食い違えば警告を出す（サイクル不一致・燃料要否の不一致）
- 検証: 経済ガイドの比率表と照合し、パン・武器・オリーブオイル・ワイン・トガ等7チェーンが一致。ネックレスだけ差異（JSONは金選鉱240秒×16、ガイドは金鉱150秒×10。金の生産元の違いで説明がつく）
- 制限: 図は各商品の最初の地域版（ラティウム）だけ。アルビオン版の比率は計算済みだが未表示。アルビオンの燃料も炭焼き師30秒で計算しており、実際の燃料の作り方は**未確認**。黒曜石（assets.xmlに建物として無い）と石畳の木炭は比率なし
- 確認済み: スマホ表示（縦・カード表示）、E2E（`bunx playwright test` 35件すべて通過。ただし対象は計算機のみで、wikiの図はE2E範囲外）
- 未確認: ダークモード（ノードのパネルは白固定）。経済ガイドの比率表は手書きのまま（比率JSONとは連動しない）

### M. 権利の注記（`d713d98` / `6247d15`）
- 文言（ユーザー承認）: 「本サイトは非公式のファンサイトで、Ubisoftとは関係ありません。Anno 117に関する商標・ゲーム内画像・アイコン等の権利は、Ubisoftに帰属します。」
- wiki: `SiteDisclaimer.vue` を通常ページは `doc-after`、トップは `layout-bottom` に配置（トップだけ `frontmatter.layout === 'home'` で判定。`page.layout` は存在しない属性）
- 計算機: デスクトップは下部の `<footer class="site-disclaimer">`。モバイル（縦・横）は下部が隠れるためヘルプ内に同文。翻訳キー `ui.disclaimer`（ja/en）で日英対応。スマホはヘルプを開かないと見えない
- 既存の小さな問題（未修正）: トップのカードの下に空の角丸ボックスがある（`index.md` に本文が無く空の `vp-doc` が出る。変更前の本番にもあった）

### N. GSCインデックス登録リクエストの進捗（2026-09-22）
- sitemap.xml掲載27件のうちGSC「インデックス登録済み」は6件のみ（`/` / `wiki/goods.html` / `wiki/buildings.html` / `wiki/items.html` / `wiki/production-chains.html` / `guide/strategy.html`）と判明。残り21件を優先度別にリクエスト対象として洗い出した
- **wiki系11件は2026-09-22にリクエスト済み**: `wiki/techs.html` / `wiki/population.html` / `wiki/regions.html` / `wiki/splendor.html` / `wiki/patrons.html` / `wiki/needs-index.html` / `wiki/techs-civic.html` / `wiki/techs-economy.html` / `wiki/techs-military.html` / `wiki/techs-dlc01.html` / `wiki/techs-dlc02.html`
- **guide系: `guide/getting-started.html` はリクエスト済み**（この日も1日の上限（非公式に10〜12件程度）に到達したため、以降は翌日以降に持ち越し）
- **guide系の残り9件 + `updates.html` は未リクエスト**。翌日以降、上限（非公式に10〜12件程度）に注意しながら継続すること
  - `guide/early-game-strategy.html` / `guide/economy-guide.html` / `guide/military-guide.html` / `guide/research-guide.html` / `guide/trade-guide.html` / `guide/calculator-guide.html` / `guide/dlc01-ashes-of-prophecy.html` / `guide/dlc02-hippodrome.html` / `guide/dlc03-dawn-of-delta.html` / `updates.html`
- **`/calculator/` がsitemap.xmlに含まれていない不備を発見・修正済み**（`/calculator/`はVitePress外の別Viteビルドのため、sitemap自動収集の対象外だった）
  - 修正: `apps/wiki/docs/.vitepress/config.ts` の `sitemap.transformItems` で `{ url: '/calculator/' }` を手動追加
  - `bun run build:site` → `docs/sitemap.xml` の件数27→29（`/calculator/` ＋ 既存の `updates.html` 分）を確認
  - コミット `8711e16` でpush済み。GitHub Pagesデプロイ完了（`gh run list` で `conclusion: success` 確認済み、2026-09-22）
  - ユーザーが `/calculator/` のインデックス登録を再リクエスト済み（2026-09-22）。結果反映は次回以降のGSC確認時にチェックすること
- **2026-09-23: guide系9件+`updates.html`のリクエストを再開**。`updates.html`のみリクエスト成功、直後に1日の上限に到達（残り9件は未リクエスト）
  - 上限の回復条件（24時間ローリングか日付変更基準か）はGoogle非公表のため不明。前回リクエスト時刻も未記録のため経過時間は計算不可。**ユーザー判断で明日以降に改めてリクエストする方針**
  - **未リクエストのまま残っている9件**（フルパスは `https://anno117-wiki.github.io/` + 以下）:
    - `guide/early-game-strategy.html` / `guide/economy-guide.html` / `guide/military-guide.html` / `guide/research-guide.html` / `guide/trade-guide.html` / `guide/calculator-guide.html` / `guide/dlc01-ashes-of-prophecy.html` / `guide/dlc02-hippodrome.html` / `guide/dlc03-dawn-of-delta.html`

### O. 競馬場レーサー適性(ItemRacerPreset)の判明とItem Inspectorリポジトリの配布方式変更（2026-09-22調査）
詳細は `docs-notes/research-hippodrome-racer-stats.md`（新規・Git管理外）参照。

- **上流`Taludas/Anno-117-Item-Inspector`がV2.1.0.1に更新**されていたが、これは**アプリ自体のバージョン**でゲームデータ（Update 2.1）は変更なし。`items_export_with_effects.csv`はバイト単位で一致確認済み
- **【重要・要注意】上流リポジトリが配布方式を変更**: 従来の全アセット`assets.xml`・全会話`texts_*.xml`の同梱をやめ、アイテム関連に絞った軽量JSON（`export_assets.json`は全アセットの一部1,078件のみ、`loca/*.json`は1,885件のみ）に移行済み。**次回パッチ以降、この上流から建物・生産チェーン・信仰神等の全体データを取得できなくなる可能性が高い**。ローカルの`_local/anno-official-data/v2.1/`が最後のフル版データになるかもしれない点に注意
- **「騎手適性」システムの正体を特定**: `ItemRacerPreset`テンプレート（`assets.xml`に14件）が、レアリティ別のレース適性ステータス（内部名Speed/Stamina/Boost/Consistency。**日本語版UIでの正式表記は「速度・スタミナ・ダッシュ・信頼性」とユーザーが実機で確認・確定**）の初期値・追加ポテンシャル・追加トレーニング回数のレンジを定義。480アイテム中400件（Common除く）が紐付け済み。数値表は調査メモ参照
- ライバル/Mythic系7件は全員が騎兵（灰色馬）でレース、「馬の執政官-インシデンティウス」（GUID80513）は執政官の馬、隠しクエスト「聖なる羊」報酬「Gaius Schaafus」（GUID140460）は羊に騎乗、という特殊レーサー4パターンを確認済み（調査メモ参照）
- **wikiに反映・コミット・push済み（`4d79b72`）**: `apps/wiki/docs/wiki/splendor.md`に「専門家のレース適性（隠しステータス）」セクションを新設し、プリセットのレンジ表（コモン〜レジェンダリーの4行のみ）を掲載。**Talent版はユーザー判断で確度が低いため掲載除外**。レアリティ表記は`items.data.ts`の`RARITY_JA`に合わせカタカナ化。`bun run build:site`でのビルド確認・`ls docs/`確認済み。GitHub Pagesデプロイ`success`確認済み
- **要検証のまま**: ストーリープリセットとヒエロ関連アイテムGUIDの直接対応（推測どまり）、Commonレアリティがレース参加不可か（実機確認要）
- ユーザー指示: セーブごとの乱数生成値そのものはこれ以上調査しない方針（本調査は生成ルール＝レンジの記録のみ）
- **【今後のリスク】assets.xml等の全体データの入手先に懸念あり**（ユーザーはPS5版のみでPC版データ抽出不可）。代替手段を調査したが構造的な解決策はなし（`anno-mods/asset-extractor`はPC版のゲーム本体必須で実行不可）。現実的な対応策の優先順位は調査メモ参照。次パッチ時に改めて状況確認すること

### P. 隣接する太字（`**`）表記が崩れるバグを発見・修正（`4d79b72`、2026-09-22）
ユーザーが本番ページ`/wiki/population.html`の表示崩れを指摘したのを起点に調査。**単独の`**太字**`は問題なし**（例: `**デナリウス**`は正常）。壊れるのは以下のパターンのみ:

- **`**A**と**B**`のように2つの太字スパンが空白なしで連続し、かつ閉じ括弧（）の直後に`**`が来る場合**、太字の対応がズレる、または片方が太字にならない
- 発見・修正した3箇所:
  - `wiki/population.md`: 「ラティウム（ローマ）」「アルビオン（ケルト）」の連続太字（ユーザー指摘の起点）
  - `guide/military-guide.md`（67行目）: 「歩兵（アウクシリア）」「弓兵」の連続太字（`<strong>`タグがネストして壊れていた）
  - `guide/military-guide.md`（140行目）: 「防御塔（射手塔）」だけ太字にならず`**`がそのまま表示
- 全て`<strong>`タグへの置き換えで解消。`bun run build:site`後、`docs/`配下の実HTMLで3件とも正常表示を確認済み
- **横展開は未実施**: 同一パターン（隣接太字＋閉じ括弧）を持つ他ページ・他文言は全件チェックしていない。怪しいパターンの検索コマンド例:
  ```
  grep -rnP '\*\*[^*\n]+\*\*[^\s*]{1,6}\*\*[^*\n]+\*\*' apps/wiki/docs/guide/*.md apps/wiki/docs/wiki/*.md
  ```
  ヒットした箇所は`docs/`のビルド済みHTMLで実際に`<strong>`が正しく対になっているか目視確認すること（ヒット＝即バグではない。今回もヒット十数件中3件のみが実際に壊れていた）
- ついでに`guide/economy-guide.md`の専門家レアリティ表記（`Legendary`/`Epic`/`Unique`/`Rare`/`Common`）を`items.data.ts`の`RARITY_JA`に合わせカタカナ化

### Q. GSC調査 ＆ アイテム「取得先」情報の追加（2026-09-24、単独セッション）

#### GSC関連
- ユーザーがGSCで「クロール済み - インデックス未登録」に`techs-economy.html`等2件を発見、調査を依頼された
- 調査の結果、**GSCの「URL検査」ツールでは既に「インデックス登録済み」と判明**（カバレッジレポート側の反映ラグだった。数日で自動的に「登録済み」表示に揃うはず）
- 前回引き継ぎN節の「guide系残り9件+`updates.html`」のうち、`updates.html`は既にリクエスト済みだった。**guide系9件をユーザーが今回リクエスト済み**（結果は未確認、フルパスは旧N節参照）
- サイト全体の参照整合性チェック（内部リンク切れ・絶対fetchパス違反・sitemap⇔実ファイル整合性・画像参照）をinvestigatorサブエージェントで実施 → **全項目問題なし**

#### アイテム「取得先(source)」情報の追加（大規模機能追加、`5a7bd98`〜`eebb323`の7コミット）
- 発端: 公式データ `tools/data/items_export_with_effects.csv` に `Source`（取得元）・`Allocation`（住居/船）列が存在するのに、`tools/build-items-ja.py` が読み捨てていたことに気づき実装
- **NPC商人・ライバル専門家16名の実名マップ**（`NPC_NAME_JA`）: 撃破報酬(`ItemGainedWhenDefeated`)GUID直接解決とportrait画像ファイル名（`portrait_{rival,trader,pirate,emperor}_<name>.png`）から確認。**Procurator→コルヴィヌス／Zarai→ザラ・ニトゥ／Nefeneru→ネフェルネル はユーザー確認済みで確定扱い**。Julia(ユリア)のみ用途不明・低確率の副次ソースにしか出ないため**取得先表示から除外**（`NPC_NAME_EXCLUDED`）
- **祭り16種の実名化**: `RewardPool Festival <属性>`のGUID自体を直接解決すると実際の祭りイベント名が取れると判明（例: 幸福度祭り→ヒラリア祭、信仰祭り→エプルム・ヨウィス祭）。`FESTIVAL_NAME_BY_GUID`で全16件対応
- **エンドゲーム技術（無限リピート技術）4種の実名化**: `RewardList Endgame <分野>Tech`もブランチ名ではなく`VisibleTechName`解決で実際のスキル名に変更。経済=健全な競争／市民=採用活動／軍事=剣と塩／レース=指導（DLC02）。表示は「スキル「○○」の報酬」
- **来訪者イベント報酬（5種、レアリティ別）**: GUID自体には紐づくテキストが無く、固有の祭りのようなイベント名は存在しないと判明（参照元は`VisitorsFeature`、通知名`Mystic Visitor Interaction Window`＝システム名）。現状「来訪者イベントの報酬」表記のまま（レアリティ表記のみ省略）
- **バグ修正**: QuestEntry・RewardPoolのXML解析で、正規表現`.*?`がAsset境界を越えて誤マッチするケースを発見（`<Standard>`〜`</Standard>`の逐次パース方式に修正。既存の`asset_oasis`構築と同じパターン）
- **候補が11件以上（実質「共通ドロッププール」）の場合は「多数の交易商・祭りからランダム入手（低確率）」に1行集約**（ユーザー判断。421件中286件が該当し、個別列挙すると最大74行になり情報過多になるため）
- `source`は「、」区切りの1文字列ではなく**配列**で持たせ、UIでは`<ul><li>`の1件1行表示に変更（ユーザー要望）
- 結果、**要検証(`sourceCaution`)フラグは380件→0件**まで削減（GUID解決ロジックの拡充とJulia除外・NPC確定により）
- UI実装: `items.md`の名称横に「取得先」バッジ、**PCはホバー・モバイルはタップでポップオーバー表示**、外側クリック/タップで閉じる。`items.data.ts`の`ItemEntry`に`source: string[]`・`sourceCaution: boolean`・`allocation: string`を追加
- ブラウザ実機確認済み（chrome-devtools MCP、PC・モバイル390x844エミュレーション両方でホバー/タップ双方の表示を確認）。`bun run build:site`成功も都度確認済み
- 7回に分けてコミット・プッシュ済み: `5a7bd98`（初回実装）→`05c44a4`（表記調整）→`e649221`（配列化・1行表示）→`73cdf46`（来訪者レアリティ省略）→`7ae31f7`（エンドゲーム技術を実名に）→`09ffe3b`（祭りを実名に）→`eebb323`（Zarai/Nefeneru確定）
- **花形の潜り手-ナタンハエル・シタール（GUID90573）はSource列が公式データ自体で空文字**。海外サイト（ANNOLAND、Anno Companion Item Inspector）でも入手方法の記載なし。アイコンパスが`icon_3d_unique_campaign_003_shipwreck_diver`のため、キャンペーン固有のストーリーイベントで確定入手する特殊アイテムと推測（未確定）

### R. GSC「ウェブに関する主な指標」不表示の調査 ＆ ページ表示速度改善（2026-09-27、単独セッション）

#### GSC「ウェブに関する主な指標」が表示されない件
- ユーザーから「PageSpeed Insightsを試す」ボタンしか出ない、と相談を受け原因を説明
- 原因はCrUX（Chrome User Experience Report）の**実ユーザー計測データ不足**の可能性が高いと判断（開設2026-06-30から3ヶ月経過済みのため「開設したばかり」は当てはまらない。個人運営・ニッチジャンルのwikiだと、期間が経ってもトラフィック不足でCrUXレポート自体が生成されないのはよくあるパターン）
- 構造的な解決策はなし（サイトの訪問規模が増えるのを待つしかない）。ユーザーは「GSCのキャッシュ更新を待ってから再計測する」方針

#### PageSpeed Insights ラボ計測を元にした表示速度改善（3コミット、全てpush済み・デプロイ確認済み）
ユーザーが貼ったPageSpeed Insightsのモバイル計測（低速4Gスロットリング）でFCP/LCPが赤(5〜6秒台)だったのを起点に調査・修正。

1. **`c346a5c`**: calculator本番ビルドの未圧縮問題を解消
   - `vite.config.ts` の `minify: false` を削除（esbuild既定minifyに戻す）。実測: JS 276KB→134KB（gzip 44KB）、CSS 52KB→38KB（gzip 6.7KB）
   - 未使用の `@font-face NotoSerif`（`apps/calculator/src/css/theme.css`）を削除。全ソース(`apps`/`packages`)をgrepし、実際にはどの要素にも適用されていない死んだCSSと確認済み。実体ファイル `packages/shared/public/fonts/NotoSerif.ttf`（1.87MB）も削除
2. **`3422033`**: wiki側 `custom.css` の `@import url(fonts.googleapis.com...)` を廃止し `config.ts` の `head` に `preconnect` + `<link rel=stylesheet>` 直書きへ変更
   - **この時点では不十分だった**: `rel=stylesheet` は事前接続していてもLighthouse上は引き続き「レンダリングをブロックしているリクエスト」に計上される（実測でも1,830msとほぼ変わらず）。ユーザーが実機再計測して「あんまり変わらない」と報告、原因を説明の上で3へ
3. **`4fa14f5`**: `preload(as=style)` + `onload` でstylesheetに昇格させる標準パターンに変更、`noscript`フォールバック追加
   - **実測で効果確認**: レンダリングブロック推定削減時間 **4,210ms → 150ms**。「レンダリングをブロックしているリクエスト」一覧からGoogle Fontsの行が消えたことをユーザーがPageSpeed Insights再計測で確認

#### 保留・未対応にした項目（ユーザー判断）
- **アイコンPNG圧縮**: `docs/calculator/icons/` 配下211ファイル・合計21MB（1枚200KB超のものが多数）。**保留**。理由: (a) 圧縮ツール(pngquant/optipng/cwebp/ImageMagick)が環境未導入 (b) 画質劣化の有無は目視確認が要る種類の判断で、211枚一括変換は無人では避けたい
- **キャッシュTTL10分の指摘**（PageSpeed Insights「効率的なキャッシュ保存期間」推定削減215KiB）: **未対応**。GitHub Pagesは`Cache-Control`をデフォルトで全ファイル一律10分に設定しており、カスタムレスポンスヘッダーの設定手段（Netlifyの`_headers`相当）が無いため、GH Pagesのままでは直接対応不可。対応するならCloudflare等を前段に挟むレベルの変更が必要

### S. GSCインデックス登録の反映確認 ＆ chrome-devtools MCP接続不良（2026-09-28）

#### GSCインデックス登録の反映確認（N・Q節の続き）
- GSCカバレッジレポートの「有効（インデックス登録済み）」表（`表.csv`、2026-09-28時点）を確認したところ、N節の「guide系9件+`updates.html`」（2026-09-23/24リクエスト済み）が**全件まだ載っていない**。加えて`wiki/techs-economy.html`も1件だけ載っていない
- `wiki/techs-economy.html`はQ節の通り既にURL検査で「登録済み」と判明済み（レポート反映ラグ）
- 今回`guide/economy-guide.html`をURL検査したところ**「URLはGoogleに登録されています」＝登録済みと確認**（ユーザーがスクショで確認）。カバレッジレポートへの反映が数日遅れているだけとみられる
- **2026-09-28追記: 残り8件+`updates.html`も全件確認完了・全件「URLはGoogleに登録されています」**（chrome-devtools MCP復旧により自動化して確認）:
  - `guide/early-game-strategy.html` / `guide/military-guide.html` / `guide/research-guide.html` / `guide/trade-guide.html` / `guide/calculator-guide.html` / `guide/dlc01-ashes-of-prophecy.html` / `guide/dlc02-hippodrome.html` / `guide/dlc03-dawn-of-delta.html` / `updates.html`
- **結論確定**: guide系9件+`updates.html`は全件Google登録済み。カバレッジレポート（「有効」表）への反映が数日遅れているだけで、実害・追加対応は不要。次にGSCを見る際はカバレッジレポートの「有効」件数が18件から増えているか確認する程度でよい

#### chrome-devtools MCP接続不良 → 復旧確認済み（2026-09-28）
- 前回セッションでは`CONNECT_TIMEOUT`で接続失敗していたが、本セッションでは`ToolSearch`→`list_pages`が正常動作し、GSCのURL検査を9件連続で自動操作できた（前回開いていたGSCサマリーページがそのまま残っていた）
- 再現しなかったため原因は不明（ユーザーのセッション再起動が効いた可能性）。以後接続不良が再発したら`claude mcp list`の表示とセッション内`ToolSearch`結果の両方を確認すること

### T. アイテム一覧モバイルUI改善 ＆ sitemap.xml GSCエラーの切り分け（2026-09-28）

#### アイテム一覧（`items.md`）モバイル表示に上部ジャンプリンク追加（`e711472`）
- モバイル表示のフィルタ直下に「「対象」の総称の内訳を見る ↓」リンクを追加。下部の`## 対象の総称と内訳`（id=`対象の総称と内訳`）へワンタップで移動できる
- `.item-legend-jumplink`はデフォルト`display:none`、`@media (max-width:959px)`内でのみ表示。PC幅では非表示のまま
- chrome-devtools MCPでモバイル390x844のタップ動作（正しくジャンプ）とPC 1280幅での非表示を実機確認済み

#### sitemap.xml GSCエラーの切り分け: sitemap-pages.xml を新規追加（`ffbbe54`）
- 経緯: N・S節のとおり`/sitemap.xml`はGSC「サイトマップ」画面で送信日2026-09-19以降ずっと「型:不明・取得できませんでした」のまま変化なし。curl（`Content-Type: application/xml`確認済み）・GSC URL検査のライブテスト（「URLはGoogleに登録できます」「取得: 成功」）はいずれも正常
- ユーザー指摘: 過去の「読み込めませんでした→再送信」は間隔を空けずに行っていたため、キャッシュ/再試行間隔が原因だとしても「再送信すれば直る」という前提は弱いと判明
- **対応**: `scripts/build-site.ts`のStep 5として、ビルド時に`docs/sitemap.xml`を`docs/sitemap-pages.xml`として複製する処理を追加（既存の失敗キャッシュと独立させるため、同内容を別名URLとしてGSCに新規登録する狙い）
- 2026-09-28に`https://anno117-wiki.github.io/sitemap-pages.xml`をGSC「サイトマップ」画面に新規送信済み。送信直後のため現在は`/sitemap.xml`と同じ「型:不明・取得できませんでした」表示（送信直後は常にこう出るため今は無意味な情報）
- **次セッションで確認すること**: 数日〜1週間後にGSC「サイトマップ」画面で`/sitemap.xml`と`/sitemap-pages.xml`の型・ステータスを見比べる
  - `sitemap-pages.xml`だけ正常化 → GSC内部の「既存URLの失敗キャッシュ」が原因と確定。以後`sitemap.xml`は諦めて`sitemap-pages.xml`を正としてよい
  - 両方とも変化なし → GSC側の一般的なサイトマップ処理自体が動いていない/別要因。深掘りが必要（sitemap-pages.xml削除も検討）
  - 実害（個別ページのインデックス登録）は既にS節の通りURL検査経由で進んでいるため、このエラー自体の優先度は高くない

### V. 表示速度・SEO・導線の総合改善（2026-10-02、単独セッション、11コミット・全てpush済み）

#### 表示速度（PageSpeed Insights / Lighthouse モバイル起点）
- **Google Fontsを廃止**（`53f0961`→`a2c10f1`）: まず`display=optional`でCLS 0.256→0にしたが、Noto Sans JP一式（woff2約26本・約550KB＋CSS 89KB）が低速4G想定で最初の描画を待たせ、FCP/LCP 5.2秒の主因と判明（フォント遮断でLighthouse 67→95を実測）。ユーザーが游ゴシック版との比較画像を見て承認し、読み込み自体を削除。`--vp-font-family-base`は先頭が`'Noto Sans JP'`のまま（端末に入っていれば使われる）
- **VitePress標準のInterフォントを除去**（`a024a58`）: `theme/index.ts`・`Layout.vue`の読み込みを`vitepress/theme-without-fonts`に変更（67KB削減）
- **全ページ共通JSからitems-full.jsonを除去**（`df8e94d`）: `BuildingsTable`がアイテム件数の集計だけのために365KBのJSONを読んでいた。集計を`buildings.data.ts`（ビルド時）へ移し、`BuildingsTable`はグローバル登録をやめて`buildings.md`でのみ読み込む。theme chunk 404KB→79KB
- **アイコンをWebPサムネイル化**（`9725bfb`・`fef37a1`）: `tools/build-icon-thumbs.py`（Pillow使用、導入済み12.2.0）で96pxのWebPを生成
  - `packages/shared/public/icons/*.png` → `apps/wiki/docs/public/icons/goods-thumb/*.webp`（133件、8.8MB→521KB）。商品一覧・生産チェーンが参照
  - `apps/wiki/docs/public/icons/buildings/*.png` → `.../icons/buildings-thumb/*.webp`（161件、3.9MB→690KB）。建物効果が参照
  - img には width/height と `loading="lazy"` を付与。元PNGは再生成用に残している
  - **アイコンを追加・差し替えたら `python tools/build-icon-thumbs.py` を再実行すること**（しないとwikiに出ない）
- **本番計測（2026-10-02、モバイル、各1回）**: トップ100／DB入口99／商品一覧99（前92）／生産チェーン99（前88）／建物一覧98（前92、転送量714→174KB）／アイテム一覧93（前87）／スキルツリー経済99／計算機96（前97、誤差）。デスクトップのトップは100

#### SEO
- **canonical**を全ページに追加（404除く。`df8e94d`）。`pageUrl()`で og:url と共用し、`index.md`はディレクトリURL（`/`、`/wiki/`）になる
- **サイト名を「Anno 117攻略Wiki」に統一**（`6f57445`、ユーザー決定）: ナビ（`title: SITE_NAME`）・トップh1・計算機・llms.txt・getting-started・updatesのdescription。トップに`WebSite`構造化データ（alternateName: Anno117DB／アノ117 攻略Wiki）。更新履歴の過去エントリ（v1.0リリース名）とCLAUDE.md等の内部文書は旧名のまま
- **sitemapにlastmod**（`6f57445`）: `transformItems`で各ページのソース.mdの最終コミット日を付与（`gitLastModified()`）。VitePressの`lastUpdated`はページに表示も出るため使っていない。データJSONだけ更新したページはlastmodが変わらない点に注意
- **計算機ページ**（`6f57445`）: `html lang="ja"`、言語切替で`document.documentElement.lang`も追従（`App.ts`）、canonical・og:url/image/site_name・twitter:imageを追加、twitter系を`name`属性に修正
- **短いdescription補強**: regions・techs-economy/civic/military/dlc01/dlc02 に具体的な商品名・スキル名を追加
- **スキル効果一覧**（`1b50808`）: `SkillEffectList.vue`をツリー下に折りたたみ（初期は閉）で表示。効果文が静的HTMLに入る。並びは研究順（ツリー下段→上段、各段左→右）。`stripTags`/`formatKnowledge`は`components/techFormat.ts`へ切り出し

#### 導線
- **データベース入口ページ `/wiki/`（`wiki/index.md`）を新設**（`f91da13`、ユーザー決定）: トップの「データベース」ボタン・特徴カード、ナビ先頭、サイドバー先頭、セクションナビ（Layout.vue）を`/wiki/`へ。パンくずはデータベース配下全ページが「ホーム > データベース > 各ページ」（`breadcrumbParent()`。スキル各ブランチの親もtechsではなくデータベース）
- **関連リンク追加**（`1c74cd4`）: ガイド7ページ末尾に「関連データ」（はじめには「関連ページ」）、DB9ページの「関連ガイド」直前に「関連データ」

#### その他
- **計算機の未稼働Service Worker削除**（`a0c3896`、ユーザー決定）: `/sw.js`が本番404で一度も動いていなかった。登録処理と`packages/shared/public/data/sw.js`を削除。E2E 35件全成功
- **見送り（ユーザー決定）**: アイテム一覧のDOM削減（16,000要素・TBT 180〜230ms）は「今は手を付けない」
- **新規ページのGSCインデックス登録**: 2026-10-02に `https://anno117-wiki.github.io/wiki/` **のみ**ユーザーが登録リクエスト済み。スキルツリー5ページ（効果一覧追加）は案内したが**リクエストしていない**（任意）

### W. GSCレポート停止の確認 ＆ sitemap-pages.xml の廃止（2026-10-05、単独セッション）
- 発端: ユーザーから「インデックス登録をリクエストして2週間たつがグラフに反映されない」と相談
- **原因はGSC側のレポート更新停止**: 「ページのインデックス登録」レポートの最終更新日が**2026/09/21のまま**（登録済み18・未登録2）。09/22以降のリクエスト分はグラフに入る余地がない。なぜ止まっているかはGSCの画面からは不明
- **実際の登録は進んでいる**: URL検査で `/wiki/`（10/02リクエスト分）と `wiki/patrons.html`（09/22リクエスト分）が「URLはGoogleに登録されています」。検索パフォーマンスは正常に更新中（直近28日でクリック306・表示1,130・平均掲載順位4.1）
- サイト側は正常（Googlebot UAで robots.txt・sitemap.xml・主要ページが200、確認した4ページに noindex 無し・canonical は自己参照）
- **サイトマップは2本とも「取得できませんでした」のままだった**（`/sitemap.xml` 09/19送信、`/sitemap-pages.xml` 09/28送信）。別名でも変わらなかったので、T節の「既存URLの失敗キャッシュ」説は外れ。原因は未特定
- **ユーザー決定**: レポートはしばらく様子見。サイトマップの取得失敗は追わない（約30ページで全ページが内部リンクで辿れ、登録も進んでいるため不要と判断）
- **sitemap-pages.xml を廃止**（`b36eef8`）: `scripts/build-site.ts` の複製処理（旧Step 5）を削除し、手順表示を `[n/5]` に変更。GSCの「サイトマップ」からも `/sitemap-pages.xml` を削除済み（残るのは `/sitemap.xml` の1件）。`sitemap.xml` と robots.txt の Sitemap 行はそのまま
- GSCの操作メモ: URL検査は上部の検索ボックスにURLを入れてEnter（`/inspect?id=<URL>` を直接開くと404）。サイトマップの削除は詳細画面右上の「その他のオプション」から


### U. 検索CTR改善: title変更とベースライン保存（2026-09-30）
- `/`・`guide/strategy.html`・`wiki/goods.html` のtitleを検索語（アノ117・攻略）入りに変更（`ee38089`）
- 変更前のGSCデータを `docs-notes/gsc-baseline-2026-09-30/` に保存（README参照）
- **次回**: 2〜3週間後（10月中旬〜下旬）に同じ形式でCSVを出力し、3ページのCTR・順位・表示回数を比較する

### X. 運用整理・建物アイコン復元・建物効果の全件照合（2026-10-06、単独セッション、全てpush済み）

#### 運用整理（`dc15150`〜`b933b5b`）
- 引き継ぎ書を分割し、完了記録をこのアーカイブへ移した（382行→約120行）。以後、完了分はこのファイルの末尾に追記する（引き継ぎ手順書・終了フックにも反映）
- 単独セッションを基本の体制に変更。CLAUDE.md から `@prompts/startup-auto.md` の自動読み込みを外し、並列は起動プロンプトを貼ったときだけ。`.claude/settings.json` の「[家老警告]」フックは撤去（ユーザー許可済み）
- CLAUDE.md のフェーズ履歴を「現在の状態」に置き換え（107行→90行）
- メモリを棚卸し（46件中12件を `memory/archive/` へ退避、体制に関する2件を書き換え）
- `scripts/check-site.ts` を追加し、`build:site` の最後で `docs/` を自動検査（必須ファイル・sitemap・サイト内リンク）

#### 更新履歴の追記（`769d020`・`5e70493`・`60fc20e`）
- 9月20日〜10月6日の未記載10件と、10月6日の建物効果まわり5件を追記。「サイト名の統一」「権利の注記」は載せない（ユーザー決定）。検索向けの調整や内部の変更も載せていない

#### 建物アイコン153件の復元（`e5f2760`）
- `4516e48`（2026-09-11）が「画像の実体が無い」として154件の割り当てを削除していたが、画像は wiki 側のフォルダに実在していた（計算機側の19枚のフォルダで判定した誤り）。削除前の割り当てを、画像のある153件に限って復元。ローカル配信で173枚すべての読み込みを確認
- 発端: ユーザーが Item Inspector の抽出フォルダ（建物アイコン38枚）を示して反映状況を尋ねた。38枚中33枚が取り込み済み、当時19枚だけが使用中だった

#### 建物効果の全件照合と追加（`6bbb007`）
- 全177件を公式v2.1と照合: 一致108、空欄で正しい65（公式にも基本効果の定義なし）、手入力3、照合先の誤り1（ウルカヌスの祭壇、値は正しい）
- 騎兵養成所などの範囲効果は、建物の基本効果ではなくスキルで付くものと判明。13スキル分を `skillBonuses` として建物名の下に表示（表の数値には含めない。ユーザー決定）
- 9建物を追加（計186件）、粉ひき所の維持費を-12に修正（実機確認済み）
- `tools/build-buildings-data.py` の参照先を v2.1 に変更、手入力の円形闘技場を上書きしない `MANUAL_IDS` を追加。再実行して内容が変わらないことを確認
- スキル以外で範囲効果が付く元（祭り2・信仰神3・神話級の専門家9・選択肢イベント22）も洗い出したが、載せない（ユーザー決定）

#### モバイル表示の改善（`0328630`・`64f54e0`）
- 建物効果: 建物名の列が約61pxまで潰れていたため、959px以下でだけ最小幅 `7.5em` を持たせた（`.building-name-cell`）。固定列が広がる分、初期表示で見える効果の列は減る
- スキル効果一覧（`SkillEffectList.vue`）: 959px以下では1スキル=1カードの縦並び。DOMは表のままでCSSだけ切り替え。画面で確かめたのは市民スキルのページのみ（他ブランチも同じ部品）
