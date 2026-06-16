# 次回セッション 引き継ぎプラン

作成日: 2026-06-16 / 作成: 侍（終了ルーチン担当）

---

## 現在の状態【クリーン】

- ブランチ: master
- 作業ツリー: クリーン（handover-next-session.md 除く）
- ビルド: exit 0 確認済み（bun run build:site）

---

## 今セッションで完了した作業

### buildings-effects.json 全件補完完了
- **コミット `7fa97ef`**: アルビオン4件 nameEn/nameJa 修正（実機確認値に統一）
  - albion_cockle_farm: nameEn "Cockle Picker"
  - albion_burial_mound: nameEn "Barrow" / nameJa "バロウ"
  - albion_resort: nameEn "Recreation Ground"
  - albion_sacred_grove: nameJa "聖なる森"
- **コミット `18915c0`**: パトリキ・equites 19件 nameJa 補完 + nameEn 実機修正11件
  - 出典: 殿提供 CSV（実機確認済み）
  - nameJa=null 0件達成（全142件補完完了）
- **コミット `3ba4d22`**: ビルド出力 docs/ 更新（exit 0 確認）

### 最終検証済み（忍者）
- 総件数 142件、nameJa=null 0件

---

## 次回の優先作業

### 1. アイテム一覧ページの実装
- データは `packages/shared/public/data/items/` に存在（55件程度）
- 現在 wiki ページはプレースホルダー表示のみ
- 商品一覧ページ（wiki/goods）と同様のアプローチで実装可能

### 2. 住民層：パトリキ公共サービス欄の追記
- 画像不鮮明のため未収録
- 殿に実機スクリーンショット提供を依頼するか、次回実機確認時に収集

---

## 注意点

- docs/ の build 出力は fix/feat コミットと同時に含めるのが本来のルール
  今回は JSON コミット後にビルドしたため chore として別コミットになった
  次回は build 後にコミットする手順を守ること
- lectus_maker: nameJa "鎖職人"（殿実機確認済み確定値）

---

## データソース一覧

| データ | 場所 |
|--------|------|
| 建物効果JSON（完成） | `apps/wiki/docs/wiki/buildings-effects.json` |
| アイテムデータ | `packages/shared/public/data/items/` |
| 公式日本語名(商品のみ) | `packages/shared/public/i18n/locales/ja.json` |
