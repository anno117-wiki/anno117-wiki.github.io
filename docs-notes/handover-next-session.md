# 引き継ぎ: 次回セッション向け（2026-09-22 更新・第11版）

## git状態
- ブランチ: master。この引き継ぎ書（第10版）のコミットが最新。push 済みかは `git status -sb`、直近の作業は `git log -8` で確認すること。デプロイは `gh run list` で確認
- GitHub Pagesデプロイの確認は `gh run list --repo anno117-wiki/anno117-wiki.github.io --limit 5`。`562498f`（データベースメニュー）の見た目はユーザーが本番で確認済み
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
- **guide系10件 + `updates.html` は未リクエスト**。1日の上限が非公式に10〜12件程度のため、翌日以降（2026-09-23以降）にリクエストする予定
  - `guide/getting-started.html` / `guide/early-game-strategy.html` / `guide/economy-guide.html` / `guide/military-guide.html` / `guide/research-guide.html` / `guide/trade-guide.html` / `guide/calculator-guide.html` / `guide/dlc01-ashes-of-prophecy.html` / `guide/dlc02-hippodrome.html` / `guide/dlc03-dawn-of-delta.html` / `updates.html`
- `/calculator/` はSPA(Vue)でクロール直後は本文が薄く見えるためインデックスされにくい可能性あり。リクエストは出しつつ様子見

## 未コミット作業
なし（この引き継ぎ書の更新分を除く。`git status -sb` で確認）。ただし上記のとおり `docs-notes/research-*.md` 2本はGit管理外

## 次セッションのミッション
**最優先ミッションはなし**。以下は候補（着手前にユーザーへ確認）。

- 要検証の実機確認（上記B・Cの「要検証のまま」）
- 競馬場ガイド: 馬需要(ランクVII)・戦車産出(ランクX)が本文では「レベルが上がると」とまとめ書きのまま（`/wiki/splendor` へのリンクは追加済み）
- 獣脂(`lard`)の別の生産元アスピック職人(GUID5475, アルビオン)は、商品一覧に未対応（現行チェーンは31756を使用）。建物効果ページに載っているかも未確認
- GSC: 上記I・Nを参照（サイトマップ状態の再確認、guide系10件+`updates.html`のリクエスト、リクエスト済み分の登録確認）
- 計算機(`/calculator/`)のOGP: 保留中（J参照）。計算機を残す方針になったため、付ける価値は上がった
- 図に出す比率は各商品の最初の地域版のみ。アルビオン版の表示・アルビオンの燃料の実際（L参照）
- 宣伝: 案は提示済み（実施はユーザー判断）。日本語圏（X・Steam・Discord）→英語圏（Reddit r/anno 等）の順。上流のライセンス確認は済み（K参照。アイコン以外は自由に使用可）

## 保留・未解決（従来の持ち越し）

- DLC03: 2026年10月の公式デブログで情報更新予定。判明次第、`guide/dlc03-dawn-of-delta.md`とスキルツリー（`techs.json`のプレースホルダー→実エントリ、`techs-dlc03.md`新規作成）を更新
- `Kirjokansi`（GUID160494）は変更（NPC受動交易限定）が一次ソースに未反映のため`caution`継続。`Taludas/Anno-117-Item-Inspector`の更新待ち
- **対応しない（ユーザー決定 2026-09-19）**: 建物アイコン（生産系ほか約150件）・スキルツリーのノードアイコン。PC版ゲームが無く画像ソースが無いため。非表示化で安全化済み。**今後も提案しない**
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
