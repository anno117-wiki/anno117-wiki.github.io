# 次回セッション 引き継ぎプラン

作成日: 2026-06-14（夜）／ 作成: 家老（指揮役）

---

## 現在の状態

- ブランチ: master、作業ツリー: クリーン（未コミット変更なし）
- 最終ビルド: `bun run build:site` exit 0 確認済み

---

## 今セッションで完了した作業

- 生産チェーン一覧: 建物タイプ列削除→英語名列削除→生産時間を分・秒表示に変換
- 住民層ページ: スクショ + `c:\Users\kojif\Desktop\anno_DB\data\population\tiers.md` からニーズ情報を収録
- 建物効果ページ新設: anno.land から48件（ローマ Tier1〜3）の効果データを取得・JSON化
- コミット粒度ルールを CLAUDE.md に追記済み
- `.gitignore` に `tests/e2e/screenshots/` を追加済み

---

## 次回の推奨作業（優先順）

### 1. 建物効果ページの補完【中優先】

`apps/wiki/docs/wiki/buildings-effects.json` に追記が必要な建物:

- **パトリキ（Tier 4）向け建物**: anno.land の動的フィルターのため自動取得不可。手動追記が必要
- **ケルト（アルビオン）全建物**: 同様に手動追記
- **建物名の日本語訳**: `nameJa` フィールドが全て `null`。`https://anno.land/en/anno-117-buildings/` を参照して埋める
- 追記方法: JSON の `buildings` 配列に同じ形式でオブジェクトを追加するだけ

### 2. 建物効果ページの値検証【低優先】

- `Aqueduct Cistern` の効果（健康+3・火災安全+3）は WebFetch の解釈ベースのため要確認
- `Mineral Quarry` / `Mineral Crusher` の tier が plebeian になっているが実際は equites の可能性あり
- 一部の建物（Flax Farm）がリベルトゥスとエクィテスの両方に記載された → 現在は libertus に収録

### 3. 生産チェーン一覧への建物列追加【要検討】

- 殿が「建物列は必要でした」と言っていた背景として、生産チェーンと建物効果の対応付けが最終目標の可能性あり
- `production-chains.data.ts` には `buildingType` が既にある（表示を止めているだけ）
- 建物効果ページと生産チェーンページをリンクさせる設計も検討価値あり

### 4. アイテム一覧ページのコンテンツ充実【低優先】

- `apps/wiki/docs/wiki/items.md` が現在「準備中」のままプレースホルダー
- アイテムデータは `packages/shared/public/data/items/` 配下に存在

### 5. 引き継ぎ前から継続の課題

- **theme.css フォントパス**: `apps/calculator/src/css/theme.css` の変更が未コミット
  - ただし `git status` でクリーンになっているため、前回セッション以降に解決済みの可能性あり
  - 次回起動時に `git diff` で確認を推奨
- **calculator のアイコン実画面確認**: `bunx serve docs` での目視確認（E2Eは handleImageError で隠れる）

---

## 注意点

- wiki ページの日本語名は必ず ja.json（公式）から取得する。スクショ・推測による名称は禁止
- `buildings-effects.json` の値は anno.land 出典（2026-06-14取得）。ゲームアップデートで変わる可能性あり
- 住民層ページのパトリキ公共サービス欄は「画像不鮮明のため未収録」。要補完
- `serve_docs_out.txt` が作業ツリーに残っている可能性あり → 不要なら削除、または .gitignore 追加

---

## データソース一覧（今後の作業用）

| データ | 場所 |
|--------|------|
| 建物効果（自動取得可） | https://anno.land/en/anno-117-buildings/（Tier1-3のみ） |
| 住民層ニーズ | `c:\Users\kojif\Desktop\anno_DB\data\population\tiers.md` |
| 住民層スクショ | `C:\Users\kojif\Desktop\claude_TEMP\Tier需要資料\` |
| 公式日本語名 | `packages/shared/public/i18n/locales/ja.json` |
