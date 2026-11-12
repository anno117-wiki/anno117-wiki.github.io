# Anno 117 統合Wikiプロジェクト

## セッション開始時【MUST】
- `docs-notes/handover-next-session.md` があれば**最初に読む**（前回からの引き継ぎ。残課題・未コミット分・注意点）。
- 完了済み作業の記録は `docs-notes/handover-archive.md`。開始時には読まず、必要な節だけ引く。

### セッション体制
- **単独セッションが基本**。役決めや peer 通信は行わず、調査・実装・ビルド・コミットまで1セッションで行う。
- 並列（家老・侍・忍者・隠密）で動かすのは、ユーザーが `prompts/startup-auto.md` の起動プロンプトを貼ったとき、または並列と明言したときだけ。そのときは同ファイルの手順で役を決め、`docs-notes/roles/` の自分の役の定義を読む。並列では同一ファイルの競合に注意する。

### 作業環境
- 主な環境は Windows の開発PC（`SHELL` は **Git Bash**。BashツールもPowerShellツールも利用可。迷わず実行する）。
- クラウド（Linux）のセッションでも作業できる。違い: `_local/`（公式ゲームデータ）と `docs-notes/research-*.md` は無い／本番サイトには直接アクセスできない（デプロイは GitHub の Actions の結果で確かめる）／ビルド後に `docs/` の画像が消えていないかを `git status` で見る（引き継ぎ書「ビルド」節）。

## 概要
Anno 117（PS5/Steam）の日本語攻略Wiki（表示名「Anno 117攻略Wiki」）と生産チェーン計算機を統合したWebサイト。GitHub Pages で公開（`anno117-wiki/anno117-wiki.github.io`、master ブランチの `docs/`）。
計算機は anno-calculator公式（GitHub: agentquackyt/Anno117Calculator）のデータを活用。

## 技術スタック・構成
- Bun（実行・パッケージ管理）／TypeScript／Vue 3／Vite／VitePress（wiki）／Playwright（E2E・スマホ表示の確認）／Python（`tools/` のデータ生成）／Cloudflare Worker（コメント機能、`cf-worker/`）
- **Capacitor・Tailwindは未導入**（標準CSS: 計算機は `apps/calculator/src/css/theme.css`、wiki は `apps/wiki/docs/.vitepress/theme/custom.css`）
- `apps/wiki/`（VitePress の wiki）／`apps/calculator/`（計算機）／`packages/shared/`（共通データ・アイコン）／`docs/`（ビルドした公開物。手で編集しない）／`tools/`（データ生成）／`scripts/`（ビルドと検査）

## 言語ルール【絶対順守】
- **内部キー（フォルダ名・ID・変数）**: すべて英語
- **表示テキスト**: wiki は日本語のみ（英語化は2026-09-20に中止）。計算機は日英切替があり、日本語切替→全て日本語、英語切替→全て英語

## 配信規約【重要】
- wiki = `/`（ルート）、calculator = `/calculator/`、GitHub Pages `docs/`
- fetchパスは `import.meta.env.BASE_URL` プレフィックス必須（絶対パス禁止）

## 禁止事項
- 情報源不明の数値をタグなしで記載する
- 公式由来のデータ（計算機の productions/*.json など）の形式を、不整合を直す目的以外で独自に変える
- 大きなファイル（assets.xml など）を複数のサブエージェントや並列処理で同時に扱う（重複読み込みで効率が落ちるため）
- 絶対fetchパス（`/i18n/...` 等）を新しく足す

## 現在の状態（2026-11-12）
- v1.0 を2026-06-30に公開済み（git tag `v1.0`）。今は**運用フェーズ**。過去の経緯は `git log` と `docs-notes/handover-archive.md` を見る
- ゲームのアップデート3.0・DLC03（デルタの夜明け、2026-11-05配信）に対応済み。3.0・DLC03の数値はゲーム内データが元で、実機との照合が済んでいないものは本文に「未確認です」と書く（一覧は `docs-notes/unverified-items.md`、照合シートは `docs-notes/dlc03-verify-sheet.md`）
- 数値は公式データと実機(PS5)確認が元で、食い違えば実機を優先する
- 主な作業: 検索流入と表示速度の改善、スマホでの見やすさ、データの検証と更新、ガイドの加筆
- 直近の任務・保留・注意点は引き継ぎ書に書く。このファイルには長く変わらない決まりだけを置く

## モバイルCSS設計メモ
- 縦向きモバイル: `@media (max-width:768px)` in theme.css（計算機）
- 横向きスマホ全機種(SOG15含む): `@media (orientation:landscape) and (max-height:500px) and (max-width:1024px)` — ボトムシート+生産チェーン表示を含む
- WIKIモバイル: `@media (max-width:959px)` in custom.css。PC（960px以上）の表示は変えない
- セクションナビ: Layout.vue `onContentUpdated` DOM直接挿入（Teleport廃止）
- 計算機リンク: Layout.vue `fixCalculatorLinks()` でSPAルーター横取り回避
- 表（2026-11-12）: スマホでは表を横にはみ出させない。列の多い表は `<div class="stack-table">` で囲みカード表示（custom.css モバイル節(5)・Layout.vue `labelStackTables()`）、見出しが長い表は `<div class="wrap-head">`。数値の多い表はPC用/スマホ用の2表をCSSで切替、絞り込み付きの一覧は部品内にカード表示。確認は `bun run check:mobile`（スキル `mobile-check`）。詳細は引き継ぎ書の「スマホの表」

## 公式ゲームデータ（最重要資産）
- `_local/anno-official-data/`（gitignore・未追跡。Windows の開発PCにだけある）: assets.xml + official_master.csv（30,719件）
- スクリプト: `tools/build-buildings-data.py`（建物）/ `tools/build-game-data.py`（商品等）。3.0・DLC03 分は `tools/build-*-aegyptus.py` などの別スクリプト
- 軽量参照: `_local/anno-official-data/buildings-data.json` / `game-data.json`
- 版ごとのフォルダ（`v2.0.0.1/` `v2.1/`、3.0は `v3.0-planner/` `v3.0-item-inspector/` など）に一次データがある。完全な assets.xml は v2.1 が最後（3.0は Planner・Item Inspector の抽出データで代替。引き継ぎ書アーカイブO節）。**消さない・上書きしない**

## 制作の基本行動【MUST】
1. CLAUDE.mdは200行以内。超える場合は要約または分離
2. 1ファイル1責務、処理を詰め込みすぎない
3. 変更前に影響範囲を説明
4. エラー処理を必ず追加
5. エラー調査はサブエージェント（investigator）を使用
6. ビルド可否は必ず実コマンド出力で確認（目視「成功」報告禁止）
7. 環境依存文字を受け答えでは使用しない
8. 表を新しく作った・表の列や中身を変えた・表まわりのCSSを変えたときは、スキル `mobile-check`（`bun run check:mobile`）でスマホ表示を確かめる。iPhone 13（390px）と Galaxy S8（360px）の両方ではみ出しが0件になってからコミットする
9. サイトの見た目や内容が変わったら、更新履歴 `apps/wiki/docs/.vitepress/data/updates.json` の先頭に1件追記する（ユーザーに確かめてから）

## ビルドと公開の手順
- **ビルドは必ず `bun run build:site`**（`bun run build` は計算機のみ・wikiが docs/ から消える）
- build:site は最後に `docs/` を自動検査する（必須ファイル・sitemap・サイト内リンク・Git登録済み画像の減少・計算機のデータとそれが指す画像・計算機の翻訳キー・更新履歴の中身・各ページのタイトルと説明文。`scripts/check-*.ts`）。`[5/5]` が OK で終わったのを実出力で確かめてからコミット。検査だけなら `bun run check:site`
- コミットは「ソースを先にコミット → `build:site` → `docs/` を別にコミット」の順にする（sitemap の最終更新日がソースの最終コミット日から作られるため）
- push 後のデプロイは GitHub Pages が行う。完了は Actions の「pages build and deployment」の結果で確かめる

## 重要な教訓
- `@anno/shared` の fetch文字列は変更しない（publicDir契約を壊す）
- VitePressデータローダーからnamed exportは不可（`export default { load() }` のみ）
- 建物効果: FunctionalEffectsのみ集計・AttributeProviderは二重計上になるため除外
- VitePressで日本語文字の直後の `**太字**` 記法は機能しない → `<strong>` タグを使う
- VitePress SPA遷移後のアンカースクロール: `useRoute()` に `hash` は無い（`useData()` の `hash` を使う）。かつVitePress自身の遷移時スクロール処理と競合するため `setTimeout(100ms)` 程度遅延させて後勝ちにする必要がある（`nextTick` だけでは早すぎて負ける）
- `packages/shared/public/icons` にアイコンを足したら、`apps/wiki/docs/public/icons/goods/` にも同じファイルを置いて `git add -f` する（Windows ではシンボリックリンクだが Git では別フォルダ。忘れると Windows 以外のビルドで消える）

## 参考リンク
- anno-calculator公式: GitHub: agentquackyt/Anno117Calculator
- Bun: https://bun.sh/
