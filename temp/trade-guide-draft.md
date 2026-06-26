# Anno 117: Pax Romana 交易・交易ルート 攻略ドラフト

作成日: 2026-06-25 / ステータス: 草稿（未検証）

> **注意**: 本ドキュメントはインターネット上の英語攻略ガイド（Ubisoft公式/Anno Union/TheGamer/GameRant/GAMES.GG/Steam Community 等）を集約し日本語化したものです。実機未検証であり、数値・仕様には誤りや旧バージョン情報が含まれる可能性があります。具体的な数値には「※要検証」を付し、出典は末尾の「出典一覧」を参照してください。商品名・建物名は英語名を併記しています（後で当プロジェクトの日本語表記に統一するため）。

---

## 交易の全体像

Anno 117 の交易には大きく2種類ある（複数ソースで共通）。

- **能動的交易（Active Trading / 交易ルート）**: 自分の船を使い、島と島（および地域間）を巡回させて商品を自動で積み下ろしする。自分の島同士でも、AI（他都市）相手でも設定可能。
- **受動的交易（Passive Trading）**: 交易所（Trading Post / 港 Harbour）の各商品に「売り注文・買い注文」を設定しておくと、交易協定を結んだ相手やNPC商人が自動で船を寄越して取引する。マイクロ管理がほぼ不要。

商品は1対1ではなく、**各商品の金銭価値（monetary value）に基づいて**交換される。メニュー上でアイコンの上に表示される単価を見て、入出力量を調整する（TheGamer / NoobFeed）。

---

## 交易ルートの設定手順（能動的交易）

複数ソースで手順はほぼ一致している（TheGamer / GameRant / Vortex Gaming / ofzenandcomputing）。

1. 画面下部のHUDから**交易ルートメニュー**を開く。アイコンは「2本の矢印（two arrows）」。ショートカットは **T キー** とする情報あり（※要検証）。
2. 「**New Trade Routes / Create New Route（新規交易ルート）**」を選択。
3. **1つ目の島（出発地）**を選ぶ。
4. **2つ目の島（目的地）**を選ぶ。3島以上を順に追加することも可能。
5. ルートに使う**船を割り当てる**。
6. 各島で**積む商品（load）／下ろす商品（unload）**を設定する。商品ごとに**カーゴスロット（cargo slot）**を割り当てる。
7. 「**Establish Route / 確定**」でルートを起動。以後、船がルートを**ループ巡回**し自動で積み下ろしする。

### 地域をまたぐルート（ラティウム Latium ⇄ アルビオン Albion）

- 基本手順は同じだが、島を選ぶ際に**地域マップを切り替える**必要がある（GameRant）。
- 出発地・目的地は異なる地域でも指定できる。

---

## 船の選択とカーゴ・速度

- **民間船（Civilian）**: カーゴスロットが多く、輸送量に優れる。
- **軍用船（Military）**: 攻撃を受けても自衛できる。海賊・敵対勢力対策。
- 船は3ティア構成: **Penteconter（ペンテコンテル）→ Trireme（トリレメ／三段櫂船）→ Quinquereme（クィンクエレメ／五段櫂船）**。民間・軍用それぞれに存在（ofzenandcomputing / namu wiki）。
- 長距離・大量輸送には **Quinquereme** が推奨。最良の積載量と durability（耐久）を持つ（複数ソース）。
  - カーゴスロットは最適化で**最大8スロット**との情報（※要検証。ソースにより表現にばらつき）。
  - **帆（Sails）と櫂（Oars）モジュール**を装備すると最低速度が上がる。例: **36 → 51**（※要検証。Vortex Gaming / 複数ガイドが同じ例を引用）。
- 船は**造船所（Shipyard）**が必要で、Harbour Building タブから建設。造船所と同時に **Rope（ロープ）/ Sails（帆）** がアンロックされ、これらは建造・交易素材にもなる（ofzenandcomputing）。
- 高ティア船ほど**モジュール（Modules）**を多く装着でき、速度増加や弓兵（archers）による防御などを付与できる。
- **専門家（Specialist / 船長 Captain）アイテム**を船に乗せると交易コスト削減などの効果を得られる（GameRant / Into Indie Games）。

---

## 受動的交易（Passive Trading / 売買注文）

交易所・港のメニューで各商品に閾値を設定する（TheGamer / plitch / Steam Community）。

- **下限値（最低在庫 minimum stock）**: 常に島に残しておく量。これ以下は売らない。
- **上限値（sell threshold）**: この量を超えると自動で売却を開始する。
- **買い注文（buy order）**: 不足する商品を、空き容量と資金がある限り自動で買い付ける。
- 交易協定を結んだ相手は、設定に応じて**自動で船を派遣**して売買してくれる。

### 価格・収益の注意（Steam Community のプレイヤー談）

- 受動的交易の単価は控えめ。**受動売却 2/単位、NPC商人に直接売ると 3/単位**との報告（※要検証・プレイヤー情報）。
- AIは余剰生産を勝手に買い取らない。**売り設定を能動的に行う必要**がある。
- 他都市・知事は**自分の集落に不足している商品のみ**購入する。
- ゲーム設計上、過剰生産での輸出は労働者コストに見合わないことが多く、**輸出特化より自集落の需要に合わせた生産**が推奨される。

---

## AI・他都市との売買（交易協定・外交）

### 交易協定（Trade Treaty）の締結

- AI（他都市・知事）と取引するにはまず**交易協定**を結ぶ必要がある。
- 協定は**相手との関係（reputation/relationship）を改善**してから利用可能になる。改善手段:
  - **クエストの達成**
  - **金銭の贈与（monetary gifts / large gifts）**
  - **島の契約（island contracts）の履行**
- 協定締結後、新規交易ルートを設定でき、受動的な売買注文も相手の市場に対して有効化される。

### 取引相手のキャラクターと商品（例）

- 各キャラは「売りたい商品」と「欲しい商品」を持つ。NoobFeed の例:
  - **Dorian** は **Marble（大理石）/ Amphorae（アンフォラ）/ Shoes（靴）** を売り、**Cheese（チーズ）/ Soap（石鹸）/ Olive Oil（オリーブ油）** を求める。
  - Dorian に **Olive Oil / Soap / Garum（ガルム）** を売ると、進行に従い最大100単位・**60〜74/単位**で買い取り、良い収入源になる（※要検証）。
- 緊急時には船に余剰を積み、NPC商人（例: **Diana / Valeria / Sarina**）に直接売って即時資金化できる（plitch / Into Indie Games）。

### 外交システム全体（Anno Union 公式 DevBlog）

- ライバル知事を最大3名選択可能。例: **Dorian**（健康・文化重視、ラティウムのみ入植、平和志向）、**Tarragon**（軍人気質）、**Concordia**（宗教・ローマ伝統重視、拡張志向）、**Athr**（アルビオンのケルト系統治者）。
- 外交メニューでは各知事の**治世状況・条約状況・軍事/経済/威信（prestige）比較・キャラ特性**を確認できる。
- 取れる外交アクション:
  - **交易協定（Trade Treaty）** — 港での商品売買
  - **防衛協定（Defensive Pact）** — 相互防衛
  - **同盟（Alliance）** — 友好・支援
  - **大きな贈り物 / 専門家任命**（研究が必要）
- **従属化（Subjugation / 属国化）**: 同盟状態で相手より強い、または（プロ）コンスル称号を持ち相手を上回り資金があると、ライバルを**属国（vassal）**化できる。従属したライバルは強力な専門家として自分の villa（邸宅）に配置でき、その島は属国都市になる。
- **戦争**: 全面戦争（All-Out War, 皇帝の不興を買う）と限定戦争（Limited War, 民間建物と交易ルートを保護）がある。戦争宣言は**皇帝への評判を低下**させ、評判が低いほど皇帝が介入しやすくなる。
- **皇帝 Calidus との関係**: 入植コストの増減、**交易禁輸（trade embargo）**の有無、コンスル/プロコンスル称号の取得可否に影響する。

---

## 遠征（Expeditions）について

- 今回参照した英語ガイド（TheGamer / Into Indie Games Advanced Guide / Anno Union DevBlog 等）では、**Anno 1800 のような独立した「遠征（Expeditions）」システムへの明確な言及は確認できなかった**。
- ビギナーガイドでは「序盤に**早めに探索（expeditions）を出し、交易所（trade posts）を建てて近隣の島を自島として確保する」**という文脈で expedition の語が使われる程度（GAMES.GG / 検索結果）。これは Anno 1800 的な探索遠征ミッションというより、**船による島の探索・入植**を指している可能性が高い。
- **※要検証**: Anno 117 に独立した遠征ミニゲーム/ミッション機構があるかは、今回のリサーチでは断定できない。実機またはより詳しい一次情報での確認が必要。

---

## 交易所・港のアップグレード（研究）

交易効率を高める主な研究技術（TheGamer / plitch）。

- **Depots（倉庫/デポ）**: 交易商品の島の保管容量を増やす。
- **Trading Post Improvements（交易所改良）**: ランプ（ramps）を追加し積み下ろしを高速化。
- **Pier-to-Pier Trading（桟橋間交易）**: 複数の桟橋で複数船の同時着岸に対応。
- **Seaport Specification（港湾指定）**: 終盤技術。どの船がどの交易所/ステーションを使うか指定できる。
- **Repair Cranes（修理クレーン）**: 港で交易船・軍用船を修理。

### 交易に有用な守護神（Patron Gods）

- **Neptune（ネプトゥヌス）**: 序盤向け。新造船の維持費削減・耐久増加（Garum 生産増との情報も／※要検証）。
- **Mercury-Lugus（メルクリウス＝ルグス）**: 終盤向け。**受動的交易の収益と、港/交易所からの威信（prestige）を強化**。交易神メルクリウスは受動交易をより儲かるようにする。

---

## 交易ルート運用のコツ

- **ルートのグルーピング**: 目的地島の名前でグループを作る（例: 'To Nisus', 'To Vortis'）。特定の島宛のルートを一覧でき、問題の切り分けが容易（Vortex Gaming）。
- **輸出量の調整（往復時間を考慮）**:
  - 近い島: 消費量より **2〜3トン**多く生産・輸出（※要検証）。
  - 遠い島: 例として消費 11トン/分 なら、往復時間を見込み **約16〜17トン/分**の生産を狙う（※要検証）。
  - 最低在庫は低め（**50〜100単位**）に設定し余剰を輸出に回す（※要検証）。
- **ルートの防衛**:
  1. 護衛（escort）— 交易船と**同速度**の軍船を右クリックで割り当て。
  2. 哨戒（patrol）— 島間に軍船を配置し即応。
  3. 迂回 — 海賊多発海域を避けてルート変更。
- **よくある不具合**: 交易ルートの問題は概ね (a) 容量不足で交易所スペースを増やす必要がある、(b) 船が損傷・カーゴ不足・交易所にアクセスできない、のいずれか（TheGamer）。

---

## 当プロジェクトの住民層表記との対応メモ

- 英語ガイドの **Liberti → Plebeians → Equites** は、当プロジェクトのラティウム表記 **リベルトゥス / プレブス / エクィテス**（さらに上位にパトリキ）に対応する。
- アルビオンの住民層（ウェーダー/スミス/アルダー/メルカトル/ノビレス）に対応する英語表記は、今回の交易系ガイドでは明示的に揃わなかった。商品名（Garum, Olive Oil, Cheese, Soap, Marble, Amphorae, Shoes 等）は当プロジェクトのデータ（productions/list.json）に合わせて後で日本語表記へ統一すること。

---

## 出典一覧

- [Complete Guide To Trade In Anno 117: Pax Romana — TheGamer](https://www.thegamer.com/anno-117-pax-romana-trading-guide/)
- [How To Go To Albion & Make Trade Routes In Anno 117 Pax Romana — GameRant](https://gamerant.com/anno-117-pax-romana-how-make-trade-routes-goods-reach-go-albion/)
- [Anno 117: Pax Romana Money and Economy Guide — Into Indie Games](https://intoindiegames.com/walkthroughs/anno-117-pax-romana-money-and-economy-guide/)
- [Anno 117: Pax Romana Advanced Guide — Into Indie Games](https://intoindiegames.com/walkthroughs/anno-117-pax-romana-advanced-guide/)
- [Anno 117: Pax Romana Perfect Trade Route Building Guide — Vortex Gaming](https://vortexgaming.io/en/postdetail/715789)
- [Anno 117 Trade Guide | Trading in Pax Romana — plitch](https://blogs.plitch.com/en/blog/anno-117-trade-guide-trading-in-pax-romana)
- [But where can I sell the products? — Steam Community Discussions](https://steamcommunity.com/app/3274580/discussions/0/684112192552999426/)
- [Diplomacy and AI — Steam Community Discussions](https://steamcommunity.com/app/3274580/discussions/0/555745238868560964/)
- [DevBlog: Diplomacy, Rivals and the Emperor — Anno Union（公式）](https://www.anno-union.com/devblog-diplomacy-rivals-and-the-emperor/)
- [How to Unlock and Use Ships in Anno 117 — Of Zen and Computing](https://www.ofzenandcomputing.com/how-to-unlock-and-use-ships-in-anno-117/)
- [Anno 117: Pax Romana Ultimate Beginner's Guide — GAMES.GG](https://games.gg/anno-117-pax-romana/guides/anno-117-pax-romana-ultimate-beginners-guide/)
- [Anno 117: Pax Romana Guide | How to Trade — NoobFeed](https://www.noobfeed.com/articles/anno-117-pax-romana-how-to-trade)（※本文はHTTP 403で直接取得不可、検索抜粋を参照）
