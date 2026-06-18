# 建物アイコン マッピングテーブル

作成: 2026-06-17 / 素材パス: C:\Users\kojif\Desktop\claude_TEMP\item_extract\Anno.117.Item.Inspector.exe_extracted\data\ui\fhd\base\icon_content\building\

アイコンファイル命名規則: `icon_3d_{key}.png`
プロジェクト配置先（予定）: `packages/shared/public/icons/buildings/{key}.png`
buildings-effects.json に `"icon": "{key}"` フィールドを追加してアクセスする。

---

## 確定マッピング（17件）忍者確認済み

| building_id | icon key | ファイル名 |
|---|---|---|
| tavern | public_roman_tavern | icon_3d_public_roman_tavern.png |
| theatre | public_roman_theatre | icon_3d_public_roman_theatre.png |
| gambling_house | public_roman_gambling_house | icon_3d_public_roman_gambling_house.png |
| grammaticus | public_roman_grammaticus | icon_3d_public_roman_grammaticus.png |
| library | public_roman_library | icon_3d_public_roman_library.png |
| market | public_roman_marketplace | icon_3d_public_roman_marketplace.png |
| sanctuary | public_roman_sanctuary | icon_3d_public_roman_sanctuary.png |
| temple | public_roman_temple | icon_3d_public_roman_temple.png |
| thermae | wonder_roman_bathhouse | icon_3d_wonder_roman_bathhouse.png |
| forum | wonder_roman_forum | icon_3d_wonder_roman_forum.png |
| albion_sacred_grove | public_celtic_sacred_grove | icon_3d_public_celtic_sacred_grove.png |
| albion_market | public_celtic_marketplace | icon_3d_public_celtic_marketplace.png |
| albion_burial_mound | public_celtic_barrows | icon_3d_public_celtic_barrows.png |
| albion_council | public_celtic_town_hall | icon_3d_public_celtic_town_hall.png |
| albion_resort | public_celtic_sportsfield | icon_3d_public_celtic_sportsfield.png |
| albion_panam | public_celtic_fanum | icon_3d_public_celtic_fanum.png |
| albion_theatre | public_celtic_bardic_hall | icon_3d_public_celtic_bardic_hall.png |

---

## 要確認マッピング（実機確認推奨）

| building_id | 候補 icon key | 備考 |
|---|---|---|
| albion_bird_charmer | public_celtic_fanum | fanum=ケルト聖域。bird charmer との対応は推測 |
| amphitheatre | （なし） | 38件中に amphitheatre アイコンなし |
| aqueduct | （なし） | 38件中に aqueduct アイコンなし |
| aqueduct_cistern | （なし） | 同上 |
| aqueduct_source | （なし） | 同上 |

---

## アイコンなし（生産施設・農場・工房 等）

38件のアイコンは公共施設・奇観・住居・港湾・軍事に限定されている。
以下は対応アイコンなし:
- 農場系（wheat_farm, sheep_farm, pig_farm 等）
- 工房系（tavern以外の生産施設）
- アルビオン生産施設全般

---

## 未使用アイコン（buildings-effects.json に対応ID無し）

| icon key | 備考 |
|---|---|
| base_guesthouse | 宿泊施設？建物IDに該当なし |
| base_residence | 住居系？建物IDに該当なし |
| base_villa | 別荘？建物IDに該当なし |
| base_warehouse | 倉庫？建物IDに該当なし |
| harbour_depot | 港倉庫。建物IDに該当なし |
| harbour_kontor | 交易所。建物IDに該当なし |
| harbour_repair_crane | 修理クレーン。建物IDに該当なし |
| harbour_shipyard | 造船所。建物IDに該当なし |
| harbour_trading_pier | 交易桟橋。建物IDに該当なし |
| institution_roman_cohortes | ローマ消防/警備。建物IDに該当なし |
| institution_roman_medici | ローマ医師。建物IDに該当なし |
| institution_roman_vigiles | ローマ衛兵。建物IDに該当なし |
| military_barracks | 兵舎 |
| military_camp | 野営地 |
| military_siege_workshop | 攻城兵器工房 |
| military_training_grounds | 訓練場 |
| wonder_celtic_bathhouse | ケルト奇観浴場。建物ID未確認 |
| wonder_celtic_forum | ケルト奇観広場。建物ID未確認 |

---

## 実装方針

1. `packages/shared/public/icons/buildings/` を新設し、確定分のPNGをコピー
2. `buildings-effects.json` の該当建物に `"icon": "{key}"` フィールドを追加
3. wiki の建物効果ページ（VueコンポーネントまたはVitePress）でアイコンを表示
4. アイコンがない建物は表示なし（エラーにしない）

---

## 次のアクション

- [ ] 殿に「要確認マッピング」と「未使用アイコン」の実機確認を依頼
- [ ] 侍がPNGコピー＋buildings-effects.json更新＋wiki表示実装
- [ ] 忍者が albion_gambling_house 等の建物ID実在確認
