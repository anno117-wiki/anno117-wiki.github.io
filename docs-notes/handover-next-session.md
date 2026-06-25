# 次回セッション 引き継ぎプラン

作成日: 2026-06-25 / 更新: 家老（指揮役）

---

## 完了済み（2026-06-25）

### 建物効果データ2倍バグ修正
- `tools/build-buildings-data.py` の `AttributeProvider` 二重計上を除去（`FunctionalEffects` のみ使用）
- 再実行で全173件の効果値が正常値に更新済み
- 代表例: Tannery -4→-2、Gold Mine -4→-2

### 商品一覧 中間品/原材料カテゴリー追加
- `packages/shared/public/productions/list.json` に64件追加
- `start_of_chain: true` → `category: "resource"`（原材料 41件）
- 有input・非startOfChain → `category: "intermediate"`（中間品 23件）

### 生産品需要逆引き（needs-index）改修
- ページ名「商品需要逆引き」→「生産品需要逆引き」
- 需要地域表示 → 住民層（tier）表示に変更・上位互換展開済み
- 住民名公式日本語: リベルトゥス/プレブス/エクィテス/パトリキ/ウェーダー/スミス/アルダー/メルカトル/ノビレス

### アイテム効果差分 保存
- annolayouts.de/117/en/items の57件を `_local/annolayouts-items-data.json` に保存
- wiki vs サイトの差分27件を `diff_vs_wiki` セクションに記録（検証待ち）

---

## 完了済み（2026-06-24）

- wiki↔計算機 双方向ナビ整備
- 建物効果データ大幅拡充（173件）・公式データ自動生成インフラ整備
- 技術ツリーwikiページ（193件・4ブランチタブUI）
- DLC商品2件追加（Statuettes/Latrunculi Sets）
- techs.json 日本語名復元・build-game-data.py に保護処理追加

---

## 次の一手（優先順）

1. **アイテム効果値の検証・更新**（要実機確認）
   - 差分27件は `_local/annolayouts-items-data.json` の `diff_vs_wiki` セクション参照
   - 実機でannolayouts.deの値が正しいことを確認→ items-full.json の該当effectsテキストを更新
   - 全件wiki < site の傾向あり（ゲームアップデートで上方修正された可能性）

2. **DLC商品アイコン差し替え**（要実機確認）
   - Statuettes: `idol_goods.png` / Latrunculi Sets: `boardgame_goods.png`
   - 公式アイコン: `_local/anno-official-data/data/ui/fhd/dlc01/icon_content/production_goods/`

3. **military_camp 建物効果の実機確認**（公式エントリ不特定・未照合）

4. **計算機のMermaid生産チェーン表示が全商品空白**（既存問題・未着手）

5. **Mosaics Coal inputの暫定値を実測値に更新**
   - time=60 / libertus:3 / money:8 は暫定値（anno.land または実機確認）

6. **DLC商品の building_cost 補完**（全0・実機確認推奨）

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。「任務完了」「撤収せよ」等を使う
- build-buildings-data.py 再実行: `python tools/build-buildings-data.py`
- build-game-data.py 再実行: `python tools/build-game-data.py`
- `_local/anno-official-data/` は gitignore済み（最重要資産）
- VitePressデータローダーはnamed export不可（`export default { load() }` のみ）
- 建物効果: FunctionalEffectsのみ集計・AttributeProviderは二重計上になるため除外

---

## データソース

- 公式ゲームデータ: `_local/anno-official-data/`（未追跡・最重要資産）
- 建物効果JSON: `apps/wiki/docs/wiki/buildings-effects.json`（173件）
- アイテム: `packages/shared/public/data/items-full.json`（421件）
- アイテム差分メモ: `_local/annolayouts-items-data.json`（検証待ち27件）
- 軽量参照JSON: `_local/anno-official-data/buildings-data.json` / `game-data.json`
- DLC公式アイコンパス: `data/ui/fhd/dlc01/icon_content/production_goods/`
