# Anno 117: Pax Romana 研究・スキルツリー・専門家(アイテム) 攻略まとめ（草稿）

作成日: 2026-06-25 / ステータス: 草稿（未検証）

> **注意**: 本ドキュメントはインターネット上の英語攻略ガイド・公式DevBlog等を日本語で集約したものです。実機で未検証の数値・仕様を多く含みます。具体的な数値や挙動には**※要検証**を付記しています。当プロジェクトには既にスキルツリー(193件・4ブランチ)とアイテム(421件)のデータがあるため、本書は**それを補完する解説・攻略**の位置づけです。建物名・アイテム名は後でプロジェクトの日本語表記へ統一するため、英語名を併記しています。
>
> ソース間で仕様が食い違う箇所があります（特に「研究ツリーは3トラックか4ブランチか」「レアリティは4段階か5段階か」）。下記に併記しました。

---

## 用語の対応メモ（プロジェクトとの差異）

- ネット記事では「研究ツリー(Discovery Tree)」を **Economy / Civic(Civil) / Military の3トラック**と説明するものが多い。一方、当プロジェクトのスキルツリーデータは**4ブランチ**。この差異は要確認（DLCや別分類、あるいは「3トラック＋共通/特殊」の可能性）。**※要検証**
- 旧作の「アイテム(items)」は本作で**専門家(Specialists)**に呼称変更された。当プロジェクトの「アイテム421件」はこの Specialists に相当すると思われる。**※要検証**

---

## 研究システムの仕組み（Discovery Tree / 発見ツリー）

- 研究は「**ディスカバリー(発見, discoveries)**」をアンロックして、生産効率・選択肢・都市サービスを拡張する仕組み。アンロックした内容と知識(Knowledge)は**全島で共有**される。（allthings.how / vortexgaming）
- ツリーは大きく **Economy(経済) / Civic・Civil(市民・公共) / Military(軍事)** の3トラックに分かれる。「150以上のディスカバリー」が存在するとの記述。（allthings.how / thegamer）
- **排他的な分岐は無い**。時間をかければ全てアンロック可能。（allthings.how / thegamer）
- 研究が解放されるのは**人口2段階目(Grammaticus 利用可能)到達**または**都市レベル3**あたりから。（vortexgaming）**※要検証**
- 複数のディスカバリーを**キューに積める**。研究速度は都市が産出する Knowledge 量に比例してスケールする。（thegamer / allthings.how）

### Inspirations（インスピレーション＝研究の解放ゲート）

- ツリーの深部ノードを開くには「**Inspirations**」と呼ばれるマイルストーン条件を満たす必要がある。条件例: 交易ルート数、水道橋(aqueduct)の建設数、都市ステータスのしきい値など。（allthings.how）
- 具体例として「**国際交易ルート5本**」「**研究ポイント17,000産出**」などが研究解放条件として挙がる。後者が「毎時収入(income)」なのか「累計産出」なのかはプレイヤー間でも議論あり。**※要検証**（Steam Community / 検索結果）
- 実績「Research Inspirations を9件達成」が存在し、Inspirations が主要な進行要素であることを裏付ける。（space4games トロフィーガイド）

---

## 知識(Knowledge)ポイントの入手

Knowledge はゲームの**8つのコア属性**の一つ（population / income / belief / knowledge / prestige / health / happiness / fire safety）。（gamerant / xboxplay）

- **Knowledge が高いほど研究が速くなる**。Knowledge は研究の通貨/速度因子として働く。（thegamer / allthings.how）
- Knowledge は**建物のニーズが満たされたとき、または関連バフを受けたとき**に産出される。（allthings.how）

### Knowledge を産む主な建物・要素

- **Grammaticus（グラマティクス）** — プレブス(Plebeians)向けの公共サービス。範囲内の建物に **+3 Knowledge**。最初に Knowledge を上げる建物の一つ。住宅密集地の近くに置き、効果範囲が多くの家をカバーするよう配置するのが推奨。（allthings.how / thegamer / deltia 等）
- **Fanum（ファヌム）** — 序盤に Knowledge を上げるもう一つの建物。（thegamer）
- **Library（図書館）** — 「大きなボーナス」を与えるとされる。（vortexgaming）**※要検証（建物名英語要確認）**
- **Tabulus Workshop（タブルス工房 / 書字板工房）** — writing tablets（書字板）と lyres（竪琴）を供給すると Knowledge を産出。（vortexgaming）**※要検証**
- **Writing Tablets for Eques（エクィテス向け書字板, Tier3 ニーズ）** — 供給時に **+3 Knowledge**。（allthings.how）

### Knowledge を増やすコツ

- **守護神 Minerva（ミネルヴァ）** を島の守護神(patron god)に設定し「**Divine Wisdom**」バフを得ると、その島の全住民の基礎 Knowledge が増加。「1住宅あたり最大+9 Knowledge」との記述あり。（thegamer / vortexgaming）**※要検証**
- 研究ノード **Lingua Romana** や **Cult of Minerva** で追加の Knowledge バフ。（thegamer）
- **アルコール(Wine/酒)供給を減らすと Knowledge 値が上がる**（属性トレードオフ: Wine は Belief を上げるが教育/Knowledge を一部下げる）。（allthings.how / vortexgaming）
- 専門家(Specialist) **Rapsode（from Booran）** — 範囲内の住宅の Knowledge 値 **+25%**。（vortexgaming）**※要検証**

---

## 研究ツリーの種類（トラック別の内容）

> 3トラック構成での記述。当プロジェクトの4ブランチとの対応は**要検証**。

### Economy（経済）

物流(logistics)、生産アップグレード、資源アクセス、道路改善。具体内容: 交易インフラ、林業管理、農業灌漑、鉱業強化、倉庫容量拡張など。（allthings.how / vortexgaming）

序盤推奨ノード:
- **Depots（倉庫/集積所）** — 島の**保管容量(Storage)を増加**。基礎ノード。Better Bellows / Paved Roads へ繋がる。（thegamer）
- **Trading Post Improvements（交易所改良）** — 交易所の効率と保管容量を強化、収入増。Sewing Circles / Fish Markets を解放。（thegamer）
- **Sewing Circles（裁縫サークル）** — 紡績所(spinning mills)の Knowledge 産出を上げるため、序盤に有用。（検索結果 / vortexgaming）
- **Paved Roads（舗装道路）** — 輸送速度と建物のストリート範囲を増加（手動アップグレードが必要）。（allthings.how）
- **Blood of Terra** — 鉱床の無い島で**鉄(iron)を低レートで採掘可能**にする。（allthings.how）

### Civic / Civil（市民・公共）

公共サービス、都市範囲/ユーティリティ、修理・維持オプション、生活の質(QoL)向上。災害対策、市場効果、船の改良、NPC同盟(従属)条約など。（allthings.how / vortexgaming）

序盤推奨ノード:
- **Market Forces（市場の力）** — **Market（市場）の効果範囲を増加**。（thegamer）
- **Quartermastery（需品管理）** — 船の積荷スロット増・積荷重量減。交易を円滑化、衛生・防火改善へ繋がる。（thegamer）
- 終盤の船として **Quinquireme**、同盟条約による NPC 従属などもこのトラック。（vortexgaming）**※要検証**

### Military（軍事）

ユニット性能、士気(morale)、耐久(toughness)、遠征支援。兵営、防御構造物、新ユニット(Legionaries / Praetorians / Scorpions / Catapults)、海軍アップグレード(移動速度ボーナス等)。（allthings.how / vortexgaming）

- 軍事は**後回し推奨**。軍隊は人口・船・資金を要するため、都市が黒字で安定してから着手。（thegamer / allthings.how）
- 推奨順: **Provisional Castra → Armorsmithing → Legionaries**。（thegamer）
- **Protective Entourage** — Auxilia の士気と耐久を強化。（allthings.how）

### 序盤の全体方針

**Economy + Civic を先に**進め、軍事は都市が安定してから。現在のボトルネックを解消する1トラックに集中するとよい。（allthings.how / thegamer）

---

## 専門家(Specialists) / アイテム

旧作の「items」が本作では **Specialists（専門家）** に。公式建物や船にスロット装着して**範囲(AoE)バフ**を与えるカード的存在。（gamesradar / anno-union）

### レアリティ（ソース間で4段階説/5段階説あり）

- **5段階説**: Common / Rare / Epic / Legendary / Unique（anno.land データベース）
- **4段階説**: Common / Rare / Epic / Unique（thegamer / anno-union DevBlog）
- 高レアほど効果が強く、入手難度も高い。**※5段階か4段階か要検証（Legendary の有無）**

### カテゴリ（専門分野）

- 大別: **Economy(経済) / Research(研究) / Seafaring(航海) / Military(軍事)**。（gamesradar）
- anno.land データベースではより細分化: Economic / Finance / Military / Nature / Religion / Culture / Civic / Research。**※分類体系は要検証**

### 装着先とスロット数

| 装着先 | スロット数 | 備考 |
|---|---|---|
| **Governor's Villa（総督邸）** | 標準5スロット、Prestige(名声)で増加 | 効果範囲が広い。汎用/共通属性バフ向き。住宅地近くに配置。 |
| **Officium（オフィキウム, 小型行政施設）** | 2スロット → Discovery Tree 進行で3スロット | 効果範囲が狭い。建設可能数は島のPrest-ige と Discovery Tree で得る permits(許可)に依存。**Villa や他 Officia と範囲を重複させられない**。生産系の特化バフ(労働力削減・維持費削減)向きで生産建物の周りに配置。 |
| **船(Ships)** | 1隻あたり1スロット（Captain＝船長） | 海事系専門家(Captains)を装着。その船にのみ効果。 |

（gamerant / anno-union DevBlog）

> 注: GameRant記事では Officium を "Guest House" と呼称している箇所があり、UI名称の対応は**要検証**。

### 効果の仕組み

- 専門家は**範囲内の建物数に応じて**バフ量が決まる。密集配置ほど効率が上がる。（thegamer）
- 効果対象: 住宅(residences)、生産建物、公共サービス建物、船。（anno-union）
- 効果の種類(anno.land 集計): 生産性 **+10%〜+35%**、労働力 **-25%〜-80%**、維持費 **-25%〜-80%**、属性ボーナス(Population/Belief/Knowledge/Health/Happiness/Fire Safety/Income/Prestige)、特殊(例: 10サイクルごとに追加1t)。**※数値レンジは要検証**

### 入手方法（ソース横断でまとめ）

- **クエスト/イベント** — 専用クエストやイベント(例: Gemini in the Rough)の報酬。最初の専門家を無料で1体得られることも。（anno-union / thegamer / gamerant）
- **交易商(Traders)** — Latium / Albion / Corvinus / Valeria / Manx 等の商人から denarii(金)で購入(Itemsタブ)。来訪中の専門家を雇用。（gamesradar / gamerant / anno.land）
- **Discovery Tree（研究)** — 特定の経済/市民/軍事の研究で専門家をアンロック。（gamesradar / anno-union）
- **Hall of Fame（殿堂）** — 統計メニュー内。fame points(名声ポイント)で購入、または実績達成で高レア入手。（gamesradar / anno-union）※thegamer は Hall of Fame に言及せず。**※要検証**
- **Festivals（祭礼)** — 開催するとランダムな Specialist/Captain がゲストとして来訪。（gamerant）
- **Lighthouse Contracts（灯台の契約）** — マルチ等で他プレイヤーの灯台契約を達成すると専門家報酬の抽選チャンス。（thegamer / gamerant）

### 具体的な専門家の例（※名称・数値とも要検証）

| 名称 (英語) | 効果 | 出典 |
|---|---|---|
| The Vesseler | 範囲内の酒場(taverns)の必要労働力 -25%、維持費 -50% | anno-union |
| Thunderous Bolter | scorpiones の命中 +15%、攻撃速度 +20% | anno-union |
| Rapsode (from Booran) | 範囲内住宅の Knowledge 値 +25% | vortexgaming |
| Merypath (Captain) | 探索範囲 +100% ほか海軍ボーナス | thegamer |
| Troucotouto | 労働力 +150%（※極端値、要確認） | thegamer |
| Actuary | 収入 +0.6 | thegamer |
| The Vesseler / Concordia the Vestal (Unique) ほか | anno.land に Eelhunter / Physician(Common)、Axle Wheeler / Brooch Boutiquer(Rare)、Abdfil the Elephant Handler(Epic)、Ahinadab the Praefectus(Legendary) 等を掲載 | anno.land |

---

## プロジェクトへの反映メモ（作業者向け）

- 「研究ツリー3トラック vs 当DBの4ブランチ」の対応を最初に確認すること。
- レアリティが5段階(Legendary含む)か4段階かを実機/公式DBで確定させる。
- Officium/Governor's Villa/Captain のスロット数・UI名称(Guest House問題)を実機確認。
- Knowledge 産出建物の英語名(Library / Tabulus Workshop 等)と日本語表記をプロジェクトの住民層表記(リベルトゥス/プレブス/エクィテス/パトリキ)に揃える。
- 数値(+3 Knowledge、+25%、17,000研究ポイント等)はすべて**実機検証後にタグ付け**で記載すること（情報源不明の数値をタグなしで記載しない、の規約に従う）。

---

## 出典一覧

- [Anno 117: Pax Romana research tree explained — allthings.how](https://allthings.how/anno-117-pax-romana-research-tree-explained/)
- [Anno 117: Pax Romana - Best Research To Take First — TheGamer](https://www.thegamer.com/anno-117-pax-romana-best-research-early-game-guide/)
- [Anno 117: Pax Romana Comprehensive Research Guide — Vortex Gaming](https://vortexgaming.io/en/postdetail/603240)
- [Anno 117 Pax Romana: How To Increase Knowledge — Deltia's Gaming](https://deltiasgaming.com/anno-117-pax-romana-how-to-increase-knowledge/)
- [Anno 117: Pax Romana Guide | How to Start Research Early — NoobFeed](https://www.noobfeed.com/articles/anno-117-pax-romana-start-research-early)
- [All Anno 117: Pax Romana specialists explained — GamesRadar+](https://www.gamesradar.com/games/simulation/anno-117-pax-romana-specialists/)
- [All Specialist Items in Anno 117 — ANNOLAND](https://anno.land/en/anno-117-specialists/)
- [Anno 117 Databases: All Specialists Items, Buildings & more — ANNOLAND](https://anno.land/en/anno-117-datenbanken/)
- [Anno 117: Pax Romana - Complete Guide To Specialists — TheGamer](https://www.thegamer.com/anno-117-pax-romana-specialists-guide/)
- [How To Get & Use Specialists In Anno 117 Pax Romana — Game Rant](https://gamerant.com/anno-117-pax-romana-how-get-specialist-captain-slot-use-governor-villa-officium-guest-house/)
- [DevBlog: An Empire built on Specialists — Anno Union](https://www.anno-union.com/devblog-an-empire-built-on-specialists/)
- [How To Increase All Attributes In Anno 117 — Game Rant](https://gamerant.com/anno-117-pax-romana-how-increase-attribute-happiness-health-fire-safety/)
- [How To Increase All Attributes In Anno 117 — xboxplay.games](https://xboxplay.games/anno-117-pax-romana/how-to-increase-all-attributes-in-anno-117-pax-romana-68745)
- [Anno 117: Pax Romana Trophy Guide — space4games](https://space4games.com/en/games-en/anno-117-pax-romana-trophy-guide/)
- [Research question — Steam Community Discussions](https://steamcommunity.com/app/3274580/discussions/0/684112501455001838/)
