# Anno 117: Pax Romana 軍事・戦闘ガイド（草稿）

作成日: 2026-06-25 / ステータス: 草稿（未検証）

> **注意**: 本ドキュメントはインターネット上の英語ガイド（攻略サイト・公式DevBlog・Steamコミュニティ）を集約した未検証の草稿です。実機・公式データによる数値検証は未実施です。具体的な数値・仕様は出典先により表現が異なる場合があり、未確認の値には「※要検証」を付しています。部隊名・建物名は英語原名を併記しています（後で当プロジェクトの日本語表記に統一するため）。

---

## 戦闘の基本

- Anno 117 の戦闘は **陸戦（Land Military）** と **海戦（Naval Military）** の2系統に分かれる。（複数ソース共通）
- 戦闘の中心は **総督邸（Governor's Villa）** を巡る攻防。各島の防衛の要であり、敵の総督邸を制圧すると、その島全体を奪取できる。（TheGamer / The Gamer 検索, Anno Union）
  - ただしSteamコミュニティのプレイヤー検証では「侵攻AIは総督邸を基本的に無視する傾向があり、過剰な要塞化は不要かもしれない」との報告もある。※要検証（出典: Steam Community 防衛スレッド）
- **士気（Morale）** が重要システム。HP（体力）とは別に士気を管理する必要があり、戦闘中に士気が下がりすぎると部隊が **敗走（flee）** する。敗走した部隊は近くの味方の士気にも悪影響を与え、より大規模な総崩れ（rout）に発展しうる。（Anno Union, GamesGG検索）
- 陸戦ユニットは **ジャンケン（rock-paper-scissors）型の相性** で設計されている（Anno Union）:
  - Auxilia（槍歩兵）は騎兵（cavalry）に強い
  - 遠隔ユニット（ranged）は距離を保って戦う
  - 騎兵は側面攻撃や無防備な射手（archers）を狙う
  - 砲兵（artillery）は防御施設や単体目標に対処する

### ユニット／艦船の操作・スタンス

- 個別選択のほか、ドラッグで全部隊／全艦隊を一括選択できる。（TheGamer, GameRant）
- 攻撃は対象を選んで敵を右クリック（PC）。移動する敵を狙う際はゲームを一時停止すると照準しやすい。（GameRant）
- スタンスは陸・海ともに共通の3種（TheGamer）:
  - **Aggressive（積極）**: 敵が近づくと命令を放棄して攻撃する
  - **Disciplined（規律）**: 命令を決して放棄しない
  - **Evasive（回避）**: 攻撃されると命令を放棄して逃走する
- 陸戦ユニットには **オート戦闘（Auto Battle / Auto Combat）** ボタンもあり、戦闘を自動処理できる。（TheGamer, GameRant）

---

## 陸軍（Land Military）

### 兵舎（Barracks）と徴募

- 陸戦ユニットは **兵舎（Barracks）** で徴募する。兵舎は人口を一定以上に増やし、労働力（workforce）と軍隊の両方を維持できるようになると解禁される。（TheGamer, GameRant）
- キャンペーンでは **第2幕（Act II）** で兵舎と防御施設が導入される。（Steam Community 防衛スレッド）
- 最初に徴募できる基本ユニットは **Auxilia（補助歩兵）** と **Archers（射手）**。それ以上のユニットタイプは研究（Research）と信仰／信心（Belief / Devotion）の上昇で解禁される。（複数ソース共通）

### ユニットの4分類（Anno Union）

陸戦ユニットは4タイプに分かれ、それぞれ専用の徴募建物を持つ:

| 分類 | 代表ユニット（英語名） | 備考 |
|------|----------------------|------|
| 歩兵 Infantry | Auxilia（槍を持つ中装歩兵） / Legionaries（高規律の軍団兵） | Auxilia には武器（weapons）が必要。Legionaries には高価な armour（鎧）の生産が必要 |
| 遠隔 Ranged | Archers（射手） | 距離を保って戦う |
| 騎兵 Cavalry | Equestrian Cavalry（騎兵） / 重騎兵（heavy cavalry） | 側面攻撃や無防備な射手狩りに有効 |
| 砲兵 Artillery | Scorpios / Onagers | 防御施設・単体目標に対処 |

- **Legionaries（軍団兵）** は高規律ユニットで、Discovery Tree（研究ツリー）から解禁。生産に高価な armour（鎧）が必要。（Anno Union, GamesGG検索）
- **Equestrian Cavalry（騎兵）** は **Epona's Hoofbeat** という Civic（市民）研究を完了すると解禁される。Epona は馬と動物の女神で、この研究は動物系生産チェーン・物流速度の強化や農業サイロの解禁も伴う。（TheGamer検索, WebSearch）

### 兵装と資源・維持コスト

- Auxilia の武器（weapons）は furnace（炉）・smith（鍛冶）・鉄（iron）・石炭（coal）の生産が必要。（Anno Union）
- すべてのユニットは建造／徴募に資源と資金が必要で、さらに **維持費（資金）** と **維持に必要な労働力（workforce）** がかかる。軍事力が人口・経済の安定に直結する設計。（Anno Union）
- 部隊を徴募すると **労働力が減少する**。徴募と並行して住宅を建設・アップグレードし続けるとよい。（TheGamer）
- 防衛時も攻撃時も、近接（melee）と遠隔（ranged）を混在させたバランスの良い編成が望ましい。（TheGamer）

---

## 海軍（Naval Military）

### 造船所（Shipyard）と艦船建造

- 艦船は **造船所（Shipyard）** で建造する。造船所は港湾建設（Harbour Build）タブから建てられ、十分な住民（Plebeians/プレブス級 と Liberati/リベルトゥス級、あるいは特定の City Status 到達）が必要。（TheGamer, GameRant）
- 建造前に **Rope（ロープ）** と **Sail（帆）** の生産が必要。建造には資金と資源を要する。（TheGamer, GameRant）
- 造船所では2系統を建造できる（GamesGG検索）:
  - **Civilian Ships（民間船）**: 物資・市民の輸送用
  - **Legio（軍船）**: 海上での戦闘用

### 艦船タイプ（小型→大型）

| 艦船（英語名） | 解禁 | モジュールスロット |
|----------------|------|--------------------|
| Penteconter（ペンテコンター） | 基本 | 全3スロット（うち2つカスタマイズ可）※要検証 |
| Trireme（トリレーム／三段櫂船） | 中位 | 全5スロット（改造可3＋貨物2）※要検証 |
| Quinquireme（クィンクェレーメ／五段櫂船） | 研究（Research）で解禁 | 最多（大型ほど多い） |

- 大型艦ほど搭載できるモジュールが多く、貨物や陸戦部隊の積載量も増える。（TheGamer, GameRant）
- 同盟相手から購入する艦船は高価で、改造（modify）不可。（TheGamer）

### 艦船モジュール（武装・性能）

| モジュール（英語名） | 機能 |
|----------------------|------|
| Ship Archers（艦載射手） | 艦対艦戦闘に必須。追加の人手（manpower）を要する |
| Ship Scorpion（艦載スコルピオ） | 陸・海両用の攻撃に有用。運用に追加の乗員が必要 |
| Ship Catapult（艦載カタパルト） | 低速・低命中だが高威力 |
| Ship Mast（帆柱） | 追い風時の最大速度を上げる |
| Ship Oars（櫂） | 機動力を上げ風への依存を減らす（労働力コスト増） |
| Ship Hull（船体） | 被ダメージへの耐久を上げる |

- 攻撃モジュール3種（archer towers / scorpions / catapults）は **射程・命中精度・連射速度・威力** が異なり、状況によって使い分ける。（Anno Union, 検索）
  - Archer towers（艦載射手）: 射程が限られ、**防御施設を破壊できない**
  - Catapults（カタパルト）: 低速・不正確だが高威力
- モジュール構成は自動保存され、別構成にするには手動でリセットが必要。（GameRant）

### 艦隊運用

- 1隻ずつ選択するか、ドラッグで艦隊全体を一括操作できる。（TheGamer, GameRant）
- 艦隊は敵艦との戦闘、他島との交易、陸戦部隊を運んで敵の総督邸（Villa）を攻撃する、といった用途に使える。（GamesGG検索）

---

## 防衛（Defense）

- 防御施設には **palisade（木製の柵）**・**walls（石壁）**・**defence towers（防御塔／Archer Towers 射手塔）** がある。（Anno Union, Steam Community）
  - palisade は基本。石壁（stone walls）は砲兵（artillery）でなければ破壊できない。（Anno Union）
  - 防御塔（特に Archer Towers）は侵攻してくる敵に反撃し、大きなダメージを与える防衛の要。（GameRant, Steam Community）
- **敵はビーチ（beach／砂浜）からのみ侵攻してくる**。そのため壁は砂浜のアクセス地点に集中させるのが効率的（島全周を囲む必要はない）。（Steam Community）
  - プレイヤーの戦術例: 「全ビーチを壁で塞ぎ、1か所だけ開けて killbox（キルゾーン）を作る」。門（gate）を使わず一点に敵を誘導して集中砲火する。※プレイヤー検証（Steam Community）
- **軍事系の研究（Military Tech）** で:
  - 壁の建設コストと維持費を下げられる。（Steam Community）
  - **水上に防御塔を建てられる**技術が解禁され、沿岸防衛を拡張できる。（Steam Community）
- **総督邸（Governor's Villa）** は新機能を解禁し、部隊を駐留（garrison）させられる重要建物。木製壁と射手塔で守るべきとされる一方、前述のとおり「侵攻AIは総督邸を無視しがち」とのプレイヤー報告もある。※要検証（Anno Union検索 / Steam Community）

---

## いつ戦うか・交易するか（戦略メモ）

- 戦闘は資源・資金・労働力を消費し、維持費も継続的にかかるため、軍備は経済・人口の安定とのバランスが重要。むやみな拡張より、相性編成（近接＋遠隔＋騎兵＋砲兵）と防衛施設の効率配置が鍵。（Anno Union, TheGamer, Steam Community）
- 交易・外交で解決できる局面と、軍事制圧すべき局面の見極めが推奨される（出典: dtgre 戦闘ガイドのタイトル/趣旨。本文はアクセス不可のため詳細未取得）。※要検証

---

## 当プロジェクト日本語表記への対応メモ（参考）

- 住民層の対応（プロジェクト既定）: ラティウム＝リベルトゥス（Liberati）/プレブス（Plebeians）/エクィテス/パトリキ。本ガイドの造船所解禁条件「Plebeians と Liberati」は、日本語表記では「プレブス級とリベルトゥス級」に相当する見込み。※用語統一は後工程で確認。

---

## 出典一覧

- [DevBlog: The Art of War in Anno 117: Pax Romana - Anno Union（公式）](https://www.anno-union.com/devblog-the-art-of-war-in-anno-117-pax-romana/)
- [Anno 117: Pax Romana - Complete Guide To Land And Naval Military - TheGamer](https://www.thegamer.com/anno-117-pax-romana-complete-guide-land-naval-military-strategy-guide/)
- [Ships, Troops, and Combat Guide In Anno 117 Pax Romana - GameRant](https://gamerant.com/anno-117-pax-romana-how-build-ship-penteconter-recruit-troops-combat-fight/)
- [Any good guides on properly defending? - Steam Community（防衛スレッド）](https://steamcommunity.com/app/3274580/discussions/0/802331141614152093/)
- [Anno 117 Pax Romana: Land and Naval Army Guide - Deltia's Gaming（HTTP 405 でアクセス不可・タイトルのみ参照）](https://deltiasgaming.com/anno-117-pax-romana-land-and-naval-army-guide/)
- [Combat in Anno 117: Land Warfare, Naval Raids & When to Fight vs. Trade - DTGRE（HTTP 403 でアクセス不可・趣旨のみ参照）](https://www.dtgre.com/2025/11/anno-117-combat-guide-land-naval-warfare-vs-trade.html)
- [Anno 117: Pax Romana Guide | How to Use Land Military - NoobFeed（HTTP 403 でアクセス不可・検索要約のみ参照）](https://www.noobfeed.com/articles/anno-117-pax-romana-use-land-military)
- [Anno 117: Pax Romana guide: The best techs to research - Epic Games Store（HTTP 403 でアクセス不可）](https://store.epicgames.com/news/anno-117-pax-romana-guide-best-techs-research-civic-economic-military?lang=en-US)
- [Anno 117: Pax Romana Guide: The Ultimate Beginner's Guide - GAMES.GG（HTTP 403 でアクセス不可）](https://games.gg/anno-117-pax-romana/guides/anno-117-pax-romana-ultimate-beginners-guide/)

> 注: 一部ソース（Deltia's Gaming, DTGRE, NoobFeed, Epic Games, GAMES.GG）は本文取得がブロックされたため、検索結果の要約またはタイトルの趣旨のみを参照しています。これらに依拠した記述は次セッションでの再取得・検証が望ましいです。
