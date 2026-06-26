# Anno 117: Pax Romana 経済・収入最適化ガイド（草稿）

> **作成日: 2026-06-25 / ステータス: 草稿（未検証）**
>
> 本文書は英語圏の攻略ガイド・コミュニティ情報をネット集約し、日本語に整理したものです。
> 実機検証は未実施。数値・仕様には誤り・バージョン差・誇張が含まれる可能性があります。
> 個別の数値には可能な限り出典を付し、未確認のものは「※要検証」と明記しています。
> 商品名・建物名は英語名を併記しています（後で当プロジェクトの日本語表記に統一するため）。
>
> 注: 一部のソース（特にSteamの議論スレッド）はデモ版／旧ビルドを前提としており、
> 製品版とはバランスが異なる可能性があります。

---

## 収入の基本原則

Anno 117の通貨は **デナリウス（Denarii）**。画面上部に「現在の所持金」と「収支（Balance／毎分の増減）」が表示される。
**収支をプラスに保つこと**が経済運営の最優先目標で、プラスを維持できていれば大きな出費がない限り資金は時間とともに増えていく。

複数ソースが一致して挙げる収入の3本柱:

1. **住民からの税収（Taxation）** — 最も信頼できる主力収入。
2. **生産建物の収入エリア効果（Area Effect / 「オーラ」）** — 住区に隣接させて発生させる受動収入。
3. **交易（Trade）** — 余剰品の自動販売・交易ルート・契約報酬。

### コア戦略: 「Build wide, not high（横に広げる、縦に伸ばさない）」

複数ガイドが「最も重要な助言」「これを守れば破産しない」と強調する原則。
（出典: Into Indie Games, NeonLightsMedia, GAMES.GG）

- **理由**: 住居を上位ティアに早期アップグレードすると、満たすべきニーズ（必要な生産チェーン）が増え、未充足だと税収ボーナスが伸びず、上位ニーズ用の建物の維持費だけが増えて赤字化する。
- **実践**: あるサービス建物の効果範囲内の住居枠を、まず **Tier1（Libertus／リベルトゥス）住居で埋め切ってから**アップグレードする。範囲あたりの税収を維持費に対して最大化できる。
- **レイアウト**: 中央に幅広の「メインストリート」を通し、そこに Market / Tavern / Grammaticus などサービス建物を集約。住区はそこから **T字型（T-Shape）**に伸ばす。正方形グリッドより効果範囲のカバー効率が高い、とされる。※カバー効率の優劣は要検証
- **道路の質**: メイン道路は直線で、工業用の枝道は短く。Anno 1800より「距離が生産効率に与える影響が大きい」との指摘あり。※要検証

### 序盤の方針

- 序盤は住居の建設と、住民を満足させるアメニティ整備に時間を割く。税収と生産収入が主収入になる。
- 「ゆっくり建てる」のが基本。Annoは忍耐と緩やかな拡大のゲーム。
- 余剰労働力（workforce）を健全に保つ。労働力こそが最大の税収源、との表現あり。
- ゲーム速度を1xではなく **3x** で進めると、経済問題が顕在化する前に成長が回りやすい（逆に1xだと赤字が悪化しやすい）。※プレイ感由来・要検証

---

## 税収の最大化

### 仕組み: ニーズ充足ボーナス

税額は固定ではなく、**各住居について満たした「ニーズ（need）」1つごとにボーナスが加算される**。
ガイドにより「ニーズ1つ＝+1 Coin/家」と表現される（出典: Into Indie Games ビギナーガイド）。※数値は要検証

- ティアが上がるほどニーズの数が増え、各ボーナスの価値も高くなる。
- 住民を増やすほど既存建物からの税収総額も増える。
- ある上級プレイヤーは「交易を一切せず、住居の進化だけで人口10万・収支毎分71,000デナリウス」に到達したと報告（出典: Steam Community）。※個人報告・要検証

### 高利益商品の例（Latium）

ニーズ充足による1家あたりの税ボーナスの例（出典: Into Indie Games 経済ガイド）。※数値は要検証:

- **Liberti（Tier1）**: Sardines（イワシ・+1 coin）／Tunics（チュニック・+2 coin）
- **Plebeians（Tier2）**: Garum（魚醤・+2 coin）／Cheese（チーズ・+3 coin）

### 収入エリア効果（Area Effect / オーラ）

多くの工業建物は、効果範囲内の建物の収入を上げる「見えないオーラ」を持つ。
**ただし、その建物が実際に生産稼働している間しか効果が出ない**（倉庫満杯や原料切れで生産が止まるとボーナスも即停止）。

毎分の収入オーラ値の例（出典: Into Indie Games 経済ガイド）。※数値は要検証:

| 建物 | エリア効果 |
|------|-----------|
| Spinner（紡績／Tunics） | +1 デナリ/分 |
| Potter（陶工） | +2 デナリ/分 |
| Bakery（パン屋） | +3 デナリ/分 |
| Schola（学校） | 約 +5 デナリ/分 |

公式チップでも「Spinner は効果範囲内の全建物の収入を+1する」と明記（出典: Ubisoft News）。

### 税収を伸ばす配置・研究のコツ

- 収入・人口にプラス属性を持つ生産建物を**住区のすぐ近く**に置く（例: 靴=shoesの生産で「+1〜2収入/家」、わずか2〜3人の労働力で数百デナリの上乗せ、との報告／Steam）。※要検証
- **Fishing Hut**（漁師小屋）を海沿いの住区の近くに。研究 **Fish Markets** で Fishing Hut と Cockle Pickers の収入エリア効果が強化される（出典: TheGamer, Reddit/Steam系）。
- **Bakery** は効果範囲が重複しないよう配置し、1軒で可能な限り多くの住居をカバー。
- **Market** は範囲内の収入と人口を増やす。研究 **Portitores** は倉庫の労働力・維持費を削減（出典: TheGamer）。
- 注意: 本作は **旧作のような「税率スライダー」が存在しない**。税は生産最適化と配置で間接的に伸ばすしかない（出典: Steam Community）。

---

## 維持費（Upkeep）の管理

赤字の典型原因は **拡大しすぎ**。「家と事業を増やす→維持費が増える→さらに増やす…」の悪循環で資金が尽きる（出典: Steam Community）。
収支が赤に振れたら、**高コストの生産建物を一時停止**して立て直す。

### 維持費削減テクニック（出典: Into Indie Games 経済ガイド）※各数値要検証

- 兵士を野営（encamp）させると軍維持費 **-80%**。
- 建物の効果範囲を広げる研究で、必要なサービス建物の数を削減。
- 倉庫の維持費を **-10%** 削減する施策。
- 道路を舗装すると必要な倉庫数が減る。

### 専門家（Specialists）による削減・増収

専門家は **Governor's Villa**（総督邸）や **Officium** のスロットに装着し、その建物の周囲範囲にバフを与える。
**専門家自体は維持費を取らず、いつでも付け替え可能**（出典: GamesRadar）。Officium は効果範囲を広げる用途。

経済関連の専門家の例（出典: ANNOLAND, GamesRadar）。※レアリティ・数値は要検証:

**収入アップ系**
- Amyntas of Taxila, Taxtaker Emeritus（Legendary）: 収入 +2
- Aulus Pecunius Magnus, Patrician Profiteer（Epic）: 収入 +1.8
- Actorius Maximinus, Nummularius Nonpareil（Unique）: 収入エリア効果 +1.5 ／ 範囲内Marketの維持費 -75%
- Aulus Rannius, Aureate Collegiate（Epic）: 収入エリア効果 +1.5

**維持費削減系**
- Divergent Factor（Rare）／Gleaner（Common）: 維持費 -50%
- Aquila Dulcis, Curator Aquarum（Legendary）: 維持費 -30%
- Aun, Proselyte of Mars Loucetius（Legendary）／Brian of the Many Blessings（Legendary）: 維持費 -25%
- The Vesseler: 範囲内Tavernの必要労働力 -25%・維持費 -50%

**生産強化系**
- Aneirin Gwawdrydd, Smith Weard（Legendary）: 製錬所 生産性 +25%（＋10サイクルごとに追加1t）
- The Aeolian Modist（Epic）: Lyres チェーン 生産性 +35%
- Axle Wheeler（Rare）: Chariots チェーン 生産性 +20%

### 守護神（Patron Gods）による経済バフ

聖域（Sanctuary）で選ぶ神により経済効果が異なる（出典: Into Indie Games, TheGamer）。※数値は要検証:

- **Saras（農業の女神）**: 必要な農場数が減る／住居あたり人口密度↑。ビギナー経済では「ほぼ必須」との評価。
- **Neptune（海）**: 船の維持費を最大 **-50%**（ガイドにより「significantly」とのみ記載のものもあり）。
- **Mercury（交易）**: 受動交易の利益性が向上。
- **Mars（戦争）**: 軍・徴兵の維持費削減。

---

## 生産バランス

### 監視ツール

- 画面右上の **毎分収入（income per minute）** 表示。プラス=黒字、マイナス=破産接近。
- **統計メニュー（Ctrl+Q）→ Production タブ**で消費と生産の比率を確認。消費が生産に迫ってきたら増設して欠品を防ぐ。

### 基本の生産チェーン

- **木材（最重要の土台）**: Woodcutter's Hut（森の緑ゾーンで100%稼働）→ Sawmill → Boards/Timber。1 Sawmill が 1 Woodcutter を概ね処理。公式は「このチェーンを2倍にしておく」ことを推奨（出典: Ubisoft, Into Indie Games）。
- すべての建物を道路で Trading Post に接続。**倉庫（Warehouse）は島内で内容を共有**（1つに入れた物は全倉庫からアクセス可。各倉庫はカート2台分の搬送能力）。倉庫を複数置いてボトルネックを防ぐ。
- Charcoal Burner（炭焼き）は周囲建物の健康・防火を下げるため**住区から離して**配置。

### 100%効率の生産チェーン比率（Latium 抜粋）

出典: Steam ガイド「100% EFFICIENT PRODUCTION CHAINS」。
**研究・専門家・祭礼・宗教などのブースト無しの素の生産速度に基づく値**。※全数値要検証:

**Tier1（Liberti / リベルトゥス）**
- Boards（板材）: Lumberjack 1 + Sawmill 1
- Porridge（粥）: Oat Farm 1 + Porridge Stall 1
- Tunics（チュニック）: Hemp Farm 1 + Spinner 1

**Tier2（Plebeians / プレブス）**
- Bread（パン）: Wheat Farm 2 + Mill 1 + Bakery 2 + Charcoal Burner 0.5
- Weapons（武器）: Iron Mine 1 + Furnace 2 + Weaponsmith 3 + Charcoal Burner 1.25
- Olive Oil（オリーブ油）: Olive Grower 4 + Olive Press 3

**Tier3（Equites / エクィテス）**
- Wine（ワイン）: Vineyard 2 + Beehive 1 + Winemaker 1
- Togas（トーガ）: Flax Farm 3 + Snail Breeder 3 + Weaver 4 + Dye Workshop 4 + Loom 2

**Tier4（Patricians / パトリキ）**
- Necklaces（首飾り）: Mineral Quarry 3 + Mineral Crusher 4 + Gold Mine 10 + Goldsmith 4 + Jeweler 6 + Charcoal Burner 2.5

### 住民ティアと必要ニーズ（Latium）

出典: Into Indie Games, NeonLightsMedia。※組み合わせはソースにより表記揺れあり・要検証:

- **Liberti（Tier1）**: Oatmeal/Porridge（Oat Farm + Kitchen/Stall）、Tunics（Hemp Farm + Spinner）、Fishing Hut の食料、Market の公共サービス。
- **Plebeians（Tier2）**: Bread（Wheat→Mill→Bakery）または Garum（Mackerel + Salt）、Sandals または Soap、Tiles（Clay Pit→Tile Kiln）など。アップグレードには Plebeian 労働力が必要。

> **労働力の注意**: 住居を上位ティアにアップグレードすると、その家の Liberti 労働力が減り（-2/家）、Plebeian 労働力が増える（+1/家）との記述あり（出典: Into Indie Games）。※数値要検証。
> 基礎産業を維持するため、**アップグレードと並行して新規 Liberti 住居を建て続ける**こと。

---

## 交易での利益

### 受動交易（Passive Trade）

- Trading Post で各商品の**最低在庫しきい値**を設定すると、それを超えた余剰が中立トレーダーへ自動販売される。
- 自国資源を枯渇させないため、最低在庫を適切に設定すること。
- 守護神 Mercury や研究で受動交易の利益性が上がる。

### 能動交易（Active Trade Routes）

- 交易ルートメニューから手動でルートを組み、高値で売却。Latium と Albion 間など**州をまたぐ輸送**で、各地域固有のニーズ品（Cheese、Brooches 等）を融通する。
- 高値が付きやすい交易品の例: Horses、Weapons、Luxury Goods（出典: Into Indie Games）。
- プレイヤー報告の相場例（出典: Steam Community）※要検証:
  - Olive Oil / Soap / Garum を Dorian に **1個 60〜74**（大口で最大100個まで）。
  - Wine 等は Albion トレーダーと**無限取引**可能で安定収入。
  - NPCトレーダーのクエスト（例: Sardines 40個 → 4,000ゴールド）。
  - プレイヤーAIの港から安く買って転売する**裁定取引（アービトラージ）**。

### 契約・救済

- 中立トレーダーの灯台で**契約（Contracts）**: 2万デナリ超の一括報酬＋貴重な専門家を獲得できる場合あり（出典: Into Indie Games）。
- ゲーム設定で「Allow Bailouts（救済を許可）」を有効にすると、財政難時に資金援助を受けられる（出典: TheGamer）。デモでは約-5,000で総督が2万を繰り返し供与、との報告（出典: Steam／デモ版前提・要検証）。

---

## クイック・チェックリスト（赤字脱出）

1. 拡大を止め、収支がプラスに戻るまで様子を見る。
2. 原料切れ・倉庫満杯で**止まっている生産建物**を解消（オーラ復活）。
3. 高維持費の生産建物を一時停止。
4. 住区のニーズ未充足を埋め、エリア効果建物（Spinner/Bakery/Fishing Hut＋Fish Market）を住区中心に配置。
5. ゲーム速度を3xにして黒字を回す。
6. 余剰品の受動交易の最低在庫を見直す。
7. 専門家で維持費削減（-50%系）・収入アップを Villa/Officium に装着。

---

## 出典一覧

- [Anno 117 Pax Romana: Money and Economy Guide - Into Indie Games](https://intoindiegames.com/walkthroughs/anno-117-pax-romana-money-and-economy-guide/)
- [Anno 117 Pax Romana: Beginner's Guide - Into Indie Games](https://intoindiegames.com/walkthroughs/anno-117-pax-romana-beginners-guide/)
- [Anno 117: Pax Romana - How To Make Money - TheGamer](https://www.thegamer.com/anno-117-pax-romana-how-to-make-money-fast-easily-guide/)
- [Anno 117: Pax Romana - Top 5 Beginner Tips and Tricks Guide - NeonLightsMedia](https://www.neonlightsmedia.com/blog/anno-117-pax-romana-tips-tricks-guide)
- [Anno 117: Pax Romana – 5 Tips For Getting Started - Ubisoft News](https://news.ubisoft.com/en-us/article/4fvALjiPTxYODChSgRb1Mk/anno-117-pax-romana-5-tips-for-getting-started)
- [How to make money? - Steam Community Discussions](https://steamcommunity.com/app/3274580/discussions/0/685238975203491150/)
- [What's up with the economy in this game? - Steam Community Discussions](https://steamcommunity.com/app/3274580/discussions/0/604166319349415438/)
- [EN-GUIDE ANNO 117: 100% EFFICIENT PRODUCTION CHAINS - Steam Community Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3607540019)
- [All Anno 117: Pax Romana specialists explained - GamesRadar+](https://www.gamesradar.com/games/simulation/anno-117-pax-romana-specialists/)
- [All Specialist Items in Anno 117 - ANNOLAND](https://anno.land/en/anno-117-specialists/)
- [Anno 117: Pax Romana – A Guide to Albion, Part 2 - Ubisoft News](https://news.ubisoft.com/en-us/article/5HGazfenOFsUMh807aEkZg/anno-117-pax-romana-a-guide-to-albion-part-2)

> 注: GAMES.GG のビギナーガイドは取得時にアクセス制限（403）で本文を直接取得できず、検索サマリーのみ参照。
