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

### 配信物ビルドコミット
- `082ffee` / `e20de20` / `bfcbdba` / `92d0aa0` / `74f2283` / `a0b3f90` chore: wikiビルド出力を更新（docs/ 再ビルド）

---

## 次回の優先作業

### 1. アイテム一覧ページの実装【最優先・フェーズ8唯一の残作業】
- データ: `packages/shared/public/data/items/`（55件・未着手）
- 現状: wiki はプレースホルダー（apps/wiki/docs/wiki/items.md）
- 参考実装: 商品一覧（goods.md + goods.data.ts）の VitePress データローダー方式

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
| アイテムデータ（未着手） | `packages/shared/public/data/items/` |
| 公式日本語名（商品のみ） | `packages/shared/public/i18n/locales/ja.json` |
| anno-calculator サンプル（退避済み） | `_local/special_thanks/`（未追跡） |
| 殿の建物名CSV | `c:\Users\kojif\Desktop\claude_TEMP\Tier需要資料\` |
