# Anno 117 統合Wikiプロジェクト

## セッション開始時【MUST】
- `docs-notes/handover-next-session.md` があれば**最初に読む**（前回からの引き継ぎ。残課題・未コミット分・注意点）。
- 完了済み作業の記録は `docs-notes/handover-archive.md`。開始時には読まず、必要な節だけ引く。

### セッション体制
- **単独セッションが基本**。役決めや peer 通信は行わず、調査・実装・ビルド・コミットまで1セッションで行う。
- 並列（家老・侍・忍者・隠密）で動かすのは、ユーザーが `prompts/startup-auto.md` の起動プロンプトを貼ったとき、または並列と明言したときだけ。そのときは同ファイルの手順で役を決め、`docs-notes/roles/` の自分の役の定義を読む。
- 並列時の家老のターミナルでは、ユーザーが `/role 家老` を打つと直接作業のガード（anno-roles）が効く。

### シェル運用
- `SHELL` は **Git Bash**。BashツールもPowerShellツールも利用可。迷わず実行する。

## 概要
Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機を統合したWebアプリ。
anno-calculator公式（GitHub: agentquackyt/Anno117Calculator）のデータを活用。

## 技術スタック
- TypeScript ^5.6 / Vue 3.5.35 / Vite 8.x / bun / VitePress / Playwright 1.60.0
- **Capacitor・Tailwindは未導入**（標準CSS: apps/calculator/src/css/theme.css）

## プロジェクト構造

```
anno_db2/
├── packages/shared/public/   # データ・アイコン・i18n（productions/list.json等）
├── apps/calculator/          # 生産チェーン計算機SPA
├── apps/wiki/docs/wiki/      # VitePress wikiページ・データローダー
├── tools/                    # データ生成スクリプト
└── _local/                   # gitignore済みローカル資産
    └── anno-official-data/   # 公式全言語テキスト+assets.xml+official_master.csv
```

## 言語ルール【絶対順守】
- **内部キー（フォルダ名・ID・変数）**: すべて英語
- **表示テキスト**: 日本語切替→全て日本語、英語切替→全て英語

## 配信規約【重要】
- wiki = `/`（ルート）、calculator = `/calculator/`、GitHub Pages `docs/`
- fetchパスは `import.meta.env.BASE_URL` プレフィックス必須（絶対パス禁止）

## 禁止事項
- 情報源不明の数値をタグなしで記載 / 不整合解決以外の独自フォーマット
- 大きなサイズの並列処理 / 絶対fetchパス（`/i18n/...` 等）の新規追加

## 現在の状態（2026-10-06）
- v1.0 を2026-06-30に公開済み（git tag `v1.0`）。開発フェーズ1〜9は完了し、今は**運用フェーズ**。過去の経緯は `git log` と `docs-notes/handover-archive.md` を見る
- 表示上のサイト名は「Anno 117攻略Wiki」。wiki は日本語のみ（英語化は2026-09-20に中止）。日英切替があるのは計算機だけ
- データはゲームのアップデート2.1時点。数値は公式データと実機(PS5)確認が元で、食い違えば実機を優先する
- 主な作業: 検索流入と表示速度の改善、データの検証と更新、ガイドの加筆
- 次の節目: 2026-11-05 のアップデート3.0・DLC03。受け皿は用意済み（`docs-notes/dlc03-ingame-checklist.md`）
- 直近の任務・保留・注意点は引き継ぎ書に書く。このファイルには長く変わらない決まりだけを置く

## モバイルCSS設計メモ（2026-06-27確定）
- 縦向きモバイル: `@media (max-width:768px)` in theme.css
- 横向きスマホ全機種(SOG15含む): `@media (orientation:landscape) and (max-height:500px) and (max-width:1024px)` — ボトムシート+生産チェーン表示を含む
- WIKIモバイル: `@media (max-width:959px)` in custom.css
- セクションナビ: Layout.vue `onContentUpdated` DOM直接挿入（Teleport廃止）
- 計算機リンク: Layout.vue `fixCalculatorLinks()` でSPAルーター横取り回避

## 公式ゲームデータ（最重要資産）
- `_local/anno-official-data/`（gitignore・未追跡）: assets.xml + official_master.csv（30,719件）
- スクリプト: `tools/build-buildings-data.py`（建物）/ `tools/build-game-data.py`（商品等）
- 軽量参照: `_local/anno-official-data/buildings-data.json` / `game-data.json`
- 版ごとのフォルダ（`v2.0.0.1/` `v2.1/`）に一次データがある。上流の配布方式が変わり、v2.1 が最後のフル版になる恐れがある（引き継ぎ書アーカイブO節）。**消さない・上書きしない**

## 制作の基本行動【MUST】
1. CLAUDE.mdは200行以内。超える場合は要約または分離
2. 1ファイル1責務、処理を詰め込みすぎない
3. 変更前に影響範囲を説明
4. エラー処理を必ず追加
5. エラー調査はサブエージェント（investigator）を使用
6. 制作は単独セッションを基本とし、並列はユーザーの指示があるときだけ（上記「セッション体制」）
7. ビルド可否は必ず実コマンド出力で確認（目視「成功」報告禁止）
8. 環境依存文字を受け答えでは使用しない

## 重要な教訓
- `@anno/shared` の fetch文字列は変更しない（publicDir契約を壊す）
- 並列で動かすときは、同一ファイルの競合に注意
- VitePressデータローダーからnamed exportは不可（`export default { load() }` のみ）
- 建物効果: FunctionalEffectsのみ集計・AttributeProviderは二重計上になるため除外
- **ビルドは必ず `bun run build:site`**（`bun run build` は計算機のみ・wikiが docs/ から消える）
- build:site 実行後は `ls docs/` で wiki ファイルの存在を確認してからコミット
- VitePressで日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- VitePress SPA遷移後のアンカースクロール: `useRoute()` に `hash` は無い（`useData()` の `hash` を使う）。かつVitePress自身の遷移時スクロール処理と競合するため `setTimeout(100ms)` 程度遅延させて後勝ちにする必要がある（`nextTick` だけでは早すぎて負ける）

## 参考リンク
- anno-calculator公式: GitHub: agentquackyt/Anno117Calculator
- Bun: https://bun.sh/
