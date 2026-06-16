# 次回セッション 引き継ぎプラン

作成日: 2026-06-16 / 作成: 家老（指揮役）

---

## 現在の状態【クリーン】

- ブランチ: master
- 作業ツリー: クリーン（handover-next-session.md・CLAUDE.md の本更新分を除く）
- ビルド: `bun run build:site` exit 0 確認済み

---

## 今セッションで完了した作業

### 1. 建物効果データ補完（buildings-effects.json 全142件）
- `8a7d084` feat: 建物効果テーブルのStatBar可視化とヘッダー固定・列調整
- `53fd9f2` fix: アルビオン建物2件のnameJaを実機確認値に修正（塚・神聖な森）
- nameJa=null 0件達成。パトリキ19件・アルビオン補完すべて殿の実機確認済み

### 2. 生産チェーン一覧の多段階Mermaid図
- `fd28983` feat: 生産チェーン一覧に多段階Mermaid図を追加
- クリック展開（details/summary）・再帰トラバースで全段階描画・各ノードに生産時間・graph LR
- mermaid パッケージを apps/wiki に追加（案B＝クライアント側レンダリング）
- 配信物 docs/ に mermaid チャンク50件超（500KB級）追加＝案B の必然コスト

### 3. 住民層の進化図をSVG化
- `50d7cde` feat: 住民層の進化図をSVG化
- ラティウム（直線4層）・アルビオン（ローマ/ケルト分岐）を静的SVGに置換
- SVG配置: `apps/wiki/docs/public/diagrams/{latium,albion}-tiers.svg`
- Tier番号表記なし・住民層名のみ・ローマ赤/ケルト緑で色分け

### 4. リポジトリ整理
- `85b287c` chore: special_thanksをローカル退避しコミット対象外に変更
- `special_thanks/`（350件）を `_local/special_thanks/` へ移動し .gitignore に `_local/` 追加
- ビルド・実行コードから未参照を確認済み。データはディスク上に保持

### 5. 住民層 ラティウム上位層の欄を補完（殿の実機確認による）
- `c097b98` feat: パトリキの公共サービス欄を追記（神殿・図書館）
- `0284607` feat: パトリキの脅威欄を追記 → `71a5bd9` fix: 円形闘技場のみに訂正
- `a8fec31` feat: エクィテスの脅威欄を追記（公共広場・浴場）
- 上位互換ルール: 公共広場・浴場はエクィテス段で充足のためパトリキ脅威は円形闘技場のみ
- これによりパトリキ公共サービス欄（旧フェーズ8残作業）は解消済み

### 6. アイテム一覧を公式日本語データ(421件)で全面刷新【完了】
- 計算機の Anno 117 Item Inspector（PyInstaller製exe）を静的展開し公式ゲームデータを入手
- `tools/build-items-ja.py` で CSV + texts_japanese.xml + assets.xml を突合し生成
- 公式日本語の 名称・効果・フレーバー説明、効果内GUIDも公式名へ解決（例 浴場/スミスの労働力）
- 生成物 `packages/shared/public/data/items-full.json`（421件）
- items.md: 分類別/レアリティ別の絞り込み、価格k/M簡略表記、列=名称/レアリティ/分類/効果/説明/価格
- 注意: 効果の一部（軍事・海事）は機械訳。実機照合で微修正可。再生成は build-items-ja.py

### 7. 計算機の各種改修【完了】
- Aboutボタン/モーダル削除、デフォルト言語を日本語化、Helpモーダル多言語化（data-i18n機構）
- 使い方説明文をメイン画面常時表示、生産チェーンの建物件数を「軒」表記（末尾ゼロ除去）
- 生産チェーン図ラベルをアイコン上部へ移動（エッジ重なり解消）、フォントをゴシック体化
- ページタイトル/メタを自サイト向けに変更（公式anno-calculator.org由来の表記を除去）

### 配信物ビルドコミット
- 各fix/featに対応する chore: ビルド出力更新コミットを併せて作成済み

---

## 8. 公式データで日本語名を照合（実施済み・一部残）
- 公式マスタ `official_master.csv`（30,719 asset・GUID/internalName/officialEN/officialJA）を生成し `_local/anno-official-data/` に保存（再利用資産）
- 建物142件: 133件が公式と整合確認。実機確認で不一致を公式へ修正済み（grain_mill粉ひき所/cockle_farmザル貝採り/dairy乳工房/resort運動場/copper_mine銅鉱/tin_mine錫鉱）
- 商品: ほぼ整合。公式へ修正済み（ブドウ/蜂の巣/牡蠣/縄/木材）。※wine「ワインレッド」は誤マッチで不採用
- 照合CSV群: `c:\Users\kojif\Desktop\claude_TEMP\日本語名照合\`（buildings/goods_name_check, unmatched_reverse_check, albion9_candidates, official_master）

### 【次回・最優先の残作業】アルビオン建物9件の公式名（実機確認待ち）
逆引きで公式テキストに無く要確認。忍者がマスタから候補を抽出済み。実機で確認し採否を裁定:
- 有力6件（既存→公式候補）: albion_logging_camp きこり→木こり / albion_malt_house 麦芽工房→麦芽製造所 / albion_pants_maker 靴下工房→靴下職人 / albion_horn_smithy 角細工師→角杯職人 / albion_council アルダー評議会→市議会 / albion_chariot_body シャーシ工房→シャーシの組立工
- 要確認3件: albion_glasswort_site ウェルド農場→（候補ウォールド畑/Weld・植物名相違）/ albion_cattle_farm 牛農場（候補なし）/ albion_underground_pit 土窯（候補なし）
- 詳細CSV: `albion9_candidates.csv`

## 次回の好機（その他）
- 建物・商品名の更なる公式照合（official_master.csv 一枚で完結。assets.xml再パース不要）
- アイテム効果の機械訳（軍事・海事）の実機照合・微修正

---

## 運用メモ（次回の効率化）

- **ローカル退避の仕組み**: 不要ファイルは `_local/` へ移動すればコミット対象外。
  既に追跡済みのファイルは `git rm --cached` で追跡解除が別途必要（移動だけでは止まらない）
- **コミット粒度**: theme/index.ts が custom.css・複数コンポーネントを import するため、
  概念別コミットには index.ts の段階的ステージングが必要だった（今回4機能を分割）
- **「解散」は禁止語**: hook が起動しセッションが終了する。撤収指示は別語を使う

---

## データソース一覧

| データ | 場所 |
|--------|------|
| 建物効果JSON（完成） | `apps/wiki/docs/wiki/buildings-effects.json` |
| 住民層SVG図 | `apps/wiki/docs/public/diagrams/` |
| 生産チェーンMermaidコンポーネント | `apps/wiki/docs/.vitepress/components/ProductionMermaid.vue` |
| アイテム一覧データ（421件・完成） | `packages/shared/public/data/items-full.json` |
| アイテム生成スクリプト | `tools/build-items-ja.py`（CSV+公式XML突合） |
| 計算機用 旧アイテムデータ（保護） | `packages/shared/public/data/items/`（55件・計算機Item.tsが使用） |
| 公式日本語名（商品のみ） | `packages/shared/public/i18n/locales/ja.json` |
| **公式ゲームデータ一式（退避・最重要）** | `_local/anno-official-data/config/`（未追跡・94.9MB） |
| └ 公式日本語テキスト | `_local/anno-official-data/config/gui/texts_japanese.xml`（GUID/OasisId→日本語） |
| └ アセットデータ | `_local/anno-official-data/config/export/assets.xml`（GUID→OasisId）|
| └ 他言語テキスト | 同 `gui/` に英独仏韓中露等 全12言語 |
| anno-calculator サンプル（退避済み） | `_local/special_thanks/`（未追跡） |
| 殿の建物名CSV | `c:\Users\kojif\Desktop\claude_TEMP\Tier需要資料\` |
