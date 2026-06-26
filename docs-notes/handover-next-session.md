# 次回セッション 引き継ぎプラン

作成日: 2026-06-25 / 更新: 家老（指揮役）

---

## 完了済み（2026-06-25 第3セッション）

### テーブル・レイアウト改修（コミット 2741905）
- メインパネル幅: `.vp-doc` padding削除（B案）
- レイアウト幅: 左サイドバー180px→140px、右aside224px→160px
- needs-index: stickyヘッダー競合修正・English列削除
- 建物効果テーブル: 建物列折り返し(max-width:140px) + stat列padding削減
- アイテム一覧: 名称列折り返し(max-width:180px) + 説明列拡大(389px)
- custom.css `td:nth-child(1) { white-space:nowrap }` 競合修正済み

### glossary第6章 公式データ裏取り完了
- 神名カナ確定（ケレース・ネプトゥーヌス・メルクリウス等）
- 軍事ユニット確定（近衛騎兵・ローマ軍団兵・トライリーメ・アウクシリア）
- スキルツリー: 公式は Economy/Civic/Military の3トラック+DLC01（DBの「other」は非公式）
- 「Austa」は公式データに存在しない（要追調査）

### CLAUDE.md更新
- ビルドは `bun run build:site` 必須・build後 `ls docs/` 確認を追記

---

## 完了済み（2026-06-25 後半セッション）

### UIデザイン統一（ネイビー×ゴールド × ネオモーフィズム）
- 計算機・Wiki 両方を同テーマで統一
- ネオモーフィズムシャドウ色調整（Wiki・計算機共通 `#a8b3c0`）
- サイドバー項目パディング追加（5px / テキスト3px）
- 計算機検索窓白浮き解消（`input[type=text]:not(.search-input)` で除外）

### ダークモード対応
- Wiki: VitePress `.dark` クラスベース（月アイコンで切り替え）
- 計算機: OS連動 + 手動トグルボタン（localStorage保存）
- ダークモード時リンク色・ブランドカラー・生産チェーン図サマリー色を修正

### 生産品一覧・生産チェーン一覧
- 商品アイコン表示追加（`/icons/goods/{icon}.png` ジャンクション経由）

### 計算機UI整理
- ヘッダー左上に「Anno 117 統合Wiki」タイトル表示（Wikiリンク）
- Storage ボタン削除（押すとフリーズするバグ機能）
- フッター（AgentQuack帰属表記）削除

### ブラウザタブ統一
- タイトル形式を「ページ名 | Anno 117 統合Wiki」に統一
- Wiki に favicon（anno_icon.png）追加

---

## 完了済み（2026-06-25 前半セッション）

### 建物効果データ2倍バグ修正
- `tools/build-buildings-data.py` の `AttributeProvider` 二重計上を除去

### 商品一覧・生産品需要逆引き改修
- 中間品/原材料カテゴリー追加（list.json 64件）
- needs-index: 住民層（tier）表示に変更・上位互換展開

### アイテム効果差分 保存
- 差分27件を `_local/annolayouts-items-data.json` に記録（検証待ち）

---

## 攻略情報リサーチ＋用語統一（2026-06-25 実施）

ネット攻略情報を**テーマ別に集約**して `temp/` に草稿化（全て**未検証・出典付き**）。
さらに**用語統一ガイドを作成し、5草稿の施設名・商品名・システム用語を正式表記へ一括統一済み**。

| テーマ | 草稿ファイル（temp/） | 状態 |
|--------|----------------------|------|
| 序盤の進め方・基本戦略 | `early-game-strategy-draft.md` | 草稿・用語統一済 |
| 交易・交易ルート | `trade-guide-draft.md` | 草稿・用語統一済 |
| 軍事・戦闘（海軍/陸軍） | `military-combat-guide-draft.md` | 草稿・用語統一済 |
| 経済・収入最適化 | `economy-guide-draft.md` | 草稿・用語統一済 |
| 研究・スキル・アイテム | `research-skills-items-guide-draft.md` | 草稿・用語統一済 |

### 用語統一ガイド（重要・新規）
- **`temp/glossary-draft.md`** … Wiki化時の**日本語表記の基準**。
  - 第2〜5章＝建物/商品/住民層/システム用語の**正式表記（確定）**。出典は i18n `ja.json` と公式 `buildings-data.json`。
  - 第6章＝**★要検証**（神名・軍事ユニット・船種）。プロジェクトに正式日本語名が無くネット由来の仮表記。
- 中間調査ファイル（削除可）: `temp/_glossary-master.md`（正式表記マスター）/ `temp/_glossary-draft-terms.md`（草稿の表記揺れ55件一覧）
- 主な確定修正例: 総督邸→**総督のヴィラ**、取引所→**交易所**、Depot→**貯蔵所**（Warehouse=倉庫と別物）、紡績機→**糸紡ぎ師**、木炭焼き→**炭焼き師**、文法学校→**ラテン語学校**、釣り小屋→**漁師小屋**、Timber=**木材**／Planks=**板材**（別商品）

### 残課題（次セッション）
- **glossary 第6章の★要検証を公式データで裏取り**（最優先）:
  - 神名カナ（ケレス/セレス Ceres・ネプトゥヌス Neptune・メルクリウス Mercury 等）
  - 軍事ユニット・船種（五段櫂船 Quinquereme の英綴り含む）の公式日本語名
  - 皇帝「アウスタ Austa」と「カリドゥス Calidus」が別人か同一か
  - スキルツリー「ネット=3トラック」vs「当DB=4ブランチ」の対応
- 未検証数値（生産比率・船速度・税ボーナス等）の裏取り
- 既存 population.md との重複整理 → 確定分を `apps/wiki/docs/wiki/` へ展開
- `temp/` はgit追跡対象。Wiki確定分のみ移す

---

## 次の方針

**攻略情報のWiki充実が最優先。**

### Wiki充実 候補コンテンツ
- 各住民層の解放条件・必要商品まとめ
- 建物の建設コスト一覧（実機確認推奨）
- 地域別の発展ガイド（ラティウム／アルビオン）
- アイテム効果値の検証・更新（差分27件・`_local/annolayouts-items-data.json` 参照）

### スキルツリー改修（次回実装プラン）
1. 4セクションを縦並びに変更（現在は横並び）
2. 左クリックでパン操作（現在は右クリックまたはドラッグ操作）
3. SVGの接続線が繋がっていない箇所の修正

### 技術的残課題（低優先）
- military_camp 建物効果の実機確認
- Mosaics（モザイク）Coal input の暫定値を実測値に更新（time=60 / libertus:3 / money:8）
- DLC商品の building_cost 補完（全0・実機確認推奨）

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。「任務完了」「撤収せよ」等を使う
- `apps/wiki/docs/public/icons/goods/` と `apps/wiki/docs/public/images/` はジャンクション（git追跡外）
- build-buildings-data.py 再実行: `python tools/build-buildings-data.py`
- build-game-data.py 再実行: `python tools/build-game-data.py`

---

## データソース

- 公式ゲームデータ: `_local/anno-official-data/`（未追跡・最重要資産）
- 建物効果JSON: `apps/wiki/docs/wiki/buildings-effects.json`（173件）
- アイテム: `packages/shared/public/data/items-full.json`（421件）
- アイテム差分メモ: `_local/annolayouts-items-data.json`（検証待ち27件）
