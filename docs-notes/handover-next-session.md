# 次回セッション 引き継ぎプラン

作成日: 2026-06-24 / 作成: 家老（指揮役）

---

## 今セッションで完了したこと（2026-06-24）

### wiki↔計算機 双方向ナビゲーション整備 (5f53853)
- 計算機ヘッダーに「Wiki」リンク追加（/へ遷移）
- wiki商品一覧・生産チェーン一覧の計算機リンクをtarget="_blank"に変更
- calculator-guide.mdに操作説明を記載

### 建物効果データ大幅拡充
- 173件（旧156件から増加）・全件アイコン設定済み
- 新規追加: ミニ施設3件（well/watchtower/latrine）・祭壇8件・生産建物6件
- tier順ソート・shrineカテゴリー追加
- 維持費・効果値を公式データで補完（施設3件/祭壇/生産建物の公式値修正）
- theatre/sanctuary/governor_villaの効果値を公式データで修正

### 公式データ自動生成インフラ（最重要）
- `tools/build-buildings-data.py` 新規作成（4ad8ad6）
  - assets.xml + official_master.csv → buildings-effects.json 自動更新
  - Matched 169/173（未照合4件は現行値維持）
- `tools/build-game-data.py` 新規作成（92995df）
  - products:154件 / needs:81件 / populationLevels:9件 / techs:193件
  - 出力: `_local/anno-official-data/game-data.json`

---

## 次の一手（優先順）

1. **技術ツリーwikiページ作成**
   - `_local/anno-official-data/game-data.json` の `techs` データを活用
   - 知識コスト付き193件の技術一覧ページ

2. **buildings-effects.json 未照合4件の手動確認**
   - military_camp / aqueduct_cistern / albion_water_gate / albion_panam
   - 公式データに存在しないため anno.land で確認

3. **buildings-effects.json 実機確認**
   - 新規追加・修正分の表示確認（忍者にChrome DevTools確認依頼）

4. **public_celtic_library**
   - 対応建物追加のタイミングでアイコン設定

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。「任務完了」「撤収せよ」等を使う。
- build-buildings-data.py を再実行する場合: `python tools/build-buildings-data.py`（--dry-runで差分確認可）
- build-game-data.py 再実行: `python tools/build-game-data.py`
- _local/anno-official-data/ は gitignore済み（JSONはコミット不要、スクリプトのみコミット）

---

## データソース

- 公式ゲームデータ: `_local/anno-official-data/`（未追跡・最重要資産）
- 建物効果JSON: `apps/wiki/docs/wiki/buildings-effects.json`（173件）
- 建物アイコン: `apps/wiki/docs/public/icons/buildings/`（全件PNG設定済み）
- 軽量参照JSON: `_local/anno-official-data/buildings-data.json` / `game-data.json`
- アイテム: `packages/shared/public/data/items-full.json`（421件）
