# 次回セッション 引き継ぎプラン

作成日: 2026-06-24 / 更新: 家老（指揮役）

---

## 今セッションで完了したこと（2026-06-24）

### 生産チェーン不整合修正・名称公式化 (78e9051)
- Clan Shields → Ceremonial Shields（ID/表示名/アイコン/ファイル名すべて変更）
- Standing Lyres → Lyres（同上、icon=lyre.png使用）
- Mosaics: Coal（Charcoal Burner, guid 5977）を3番目inputとして追加（暫定time/cost値）
- i18n ja/en両方のキー更新済み

### buildings-effects.json 名称修正 (ac3ac8e)
- albion_water_gate: nameEn "Water Gate" → "Sluice Gate"（公式: GUID9035）
- albion_panam: nameEn "Panam" → "Fanum"（公式: GUID6728）

### build-game-data.py productionChains追加 (dc685d0)
- Step 7追加: 57件のproductionChainsを抽出

### devサーバーポート固定 (9f2c5c3)
- calculator:5200 / wiki:5201（CloudCLI UI 5174との競合解消）

### 技術ツリーwikiページ (63a1ab4)
- 193件・4ブランチタブUI（経済/市民/軍事/DLC）
- techs.json を apps/wiki/docs/wiki/ に出力
- サイドバーに「技術ツリー」追加

### DLC商品2件追加 (703cc12)
- Statuettes（小像）: Caelator(guid 145229) / time=180 / inputs=Obsidian+Marble
- Latrunculi Sets（ラトルンクリ一式）: Latrunculi Workshop(guid 145230) / time=90 / inputs=Obsidian+Ornate Wood
- list.json count=50 / i18n追加 / アイコンはプレースホルダー（writing_tablets.pngで仮置き）

---

## 次の一手（優先順）

1. **DLC商品アイコン差し替え**（要実機確認）
   - idol_goods.png（Statuettes）/ boardgame_goods.png（Latrunculi Sets）
   - 公式アイコンは `_local/anno-official-data/` の icons フォルダを確認
   - パス: data/ui/fhd/dlc01/icon_content/production_goods/

2. **Mosaics Coal inputの暫定値を実測値に更新**
   - time=60 / libertus:3 / money:8 は暫定値
   - anno.land または実機で Charcoal Burner(Celtic) のデータ確認

3. **計算機の生産チェーン可視化（Mermaid）が全商品で空白**
   - 今回変更と無関係の既存問題
   - 計算機のチェーン表示コンポーネントを調査・修正が必要

4. **buildings-effects.json 残課題**
   - military_camp: 公式エントリ不特定・実機確認待ち（aqueduct_cisternは現行値で問題なし）

5. **DLC商品の building_cost 補完**
   - statuettes.json / latrunculi_sets.json の building_cost が全0（公式データなし）
   - 実機確認推奨

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。「任務完了」「撤収せよ」等を使う。
- build-buildings-data.py 再実行: `python tools/build-buildings-data.py`
- build-game-data.py 再実行: `python tools/build-game-data.py`
- _local/anno-official-data/ は gitignore済み
- guid照合はCSVの列厳密一致で行うこと（途中カラム混線に注意）

---

## データソース

- 公式ゲームデータ: `_local/anno-official-data/`（未追跡・最重要資産）
- 建物効果JSON: `apps/wiki/docs/wiki/buildings-effects.json`（173件）
- 軽量参照JSON: `_local/anno-official-data/buildings-data.json` / `game-data.json`
- アイテム: `packages/shared/public/data/items-full.json`（421件）
- DLC公式アイコンパス: `data/ui/fhd/dlc01/icon_content/production_goods/`
