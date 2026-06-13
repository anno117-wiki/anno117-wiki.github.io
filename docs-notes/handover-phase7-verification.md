# フェーズ7 検証結果と次回引き継ぎ（家老総括）

作成日: 2026-06-13 ／ 作成: 家老（指揮役）
位置づけ: 侍・忍者の引き継ぎ書（`handover-phase7-after-step5.md` /
`handover-phase7-after-step5-ninja.md`）に、家老が実施した**検証4点の結果**を加えた総括。

---

## 1. 現在の戦況（実コマンドで確認済み）

- ブランチ: `master`、作業ツリーはほぼクリーン（untracked: 各 handover メモのみ）
- `bun run build:site` → **exit 0**（wiki=`docs/`、calculator=`docs/calculator/`、`.nojekyll` 生成）
- `docs/` はコミット `5b390f7` で追跡済み・完全な状態。途中 `build:vite` 単独実行で
  一時的に欠けても `bun run build:site` で一体再生成すれば回復する。
- 本日のコミット: `a002aca`(outDir修正) / `5b390f7`(docs追跡化) /
  `52a035e`(wikiソース救出) / `9020929`(侍: 引き継ぎ・CLAUDE.md)

## 2. フェーズ7 実装の到達点

第0段〜第5段まで**実装は全段貫通**（モノレポ再編・@anno/shared・calculatorアプリ化・
VitePress wiki・一体ビルド）。ただし下記検証により「実装完了・検証未通過」が正確な状態。

## 3. 検証4点の結果

| # | 項目 | 結果 | 重大度 |
|---|------|------|--------|
| 1 | 配信物の構造・パス | docs/ 構造は正常。JS/CSSは `/calculator/` base 正しい。⚠ `docs/calculator/index.html` 内に `./assets/productions/list.json` 等の相対参照があり、実体は `./productions/` `./data/` 直下。配信時のデータ取得経路の要確認 | 中 |
| 2 | **E2E (playwright)** | **33 failed / 2 passed**。モノレポ移行でほぼ全滅。`bun run dev`(calculator) は起動するがテストが通らない | **最高** |
| 3 | フォント警告 | `apps/calculator/src/css/theme.css:3` の `url("./../assets/fonts/NotoSerif.ttf")` が旧 `src/assets` 基準のまま。実体は `packages/shared/public/fonts/`。`--font-family` に `serif` フォールバックあり実害は字体のみ | 低 |
| 4 | CLAUDE.md | 侍が第5段完了を記録済み。家老が E2E 実態（検証未通過）を反映 | — |

## 4. 次の一手（優先順）

1. **E2E修復【最優先】** — 33件失敗の原因究明。investigator サブエージェント推奨。
   疑い: ① モノレポ移行後の dev 起動時データfetchパス（BASE_URL化）とテスト期待値の不整合
   ② セレクタの旧UI依存。`tests/e2e/*.spec.ts` と `apps/calculator/src` の現行DOMを突合。
2. **配信データ経路の確認(#1)** — `docs/calculator/index.html` の `./assets/productions/`
   参照が実配信で 404 にならないか preview で実地確認。
3. **フォントパス修正(#3)** — `theme.css` の url を実体（public/fonts）に整合させる。
   dev(base=/) と build:site(base=/calculator/) 双方で読める形に。
4. CLAUDE.md フェーズ表の最終確定（E2E通過後に「✅完了」へ）。

## 5. 注意点

- **同一CWDで3セッション（家老・侍・忍者）が並走**。同一ファイル競合に注意。
  CLAUDE.md・handover は本日複数人が触れた。次回は持ち場を先に切ること。
- `@anno/shared` の fetch文字列・publicDir契約は変更しない（既存規約）。
