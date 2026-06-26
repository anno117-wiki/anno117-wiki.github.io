# Anno 117 統合Wikiプロジェクト

## セッション開始時【MUST】
- `docs-notes/handover-next-session.md` があれば**最初に読む**（前回からの引き継ぎ。残課題・未コミット分・注意点）。

### 役割の自動決定【MUST・名乗り前に必ず実行】
役は**起動順で自動決定**する。優先順位は **家老 > 侍 > 忍者**。**空いている最上位の役**を名乗る。
1. `list_peers(scope=repo)` で既に名乗られている役を確認する。
2. 空いている最上位の役を名乗る：誰もいない→家老 / 家老だけ→侍 / 家老＋侍→忍者。
3. `set_summary` に**必ず役名を含めて**名乗る。
4. 名乗った直後に再度 `list_peers` で重複確認。重複なら下位側が譲って人間に確認。
5. **4人目以降／判断できない時は名乗らず人間に確認**（推測で兼任しない）。

### 起動手順（審議せず順に実行）
1. **第1バッチ（並列）**: `ToolSearch select:mcp__claude-peers__list_peers,...` ＋ handover読み込み。
2. 役割の自動決定 → `set_summary` で名乗る。
3. 自分の役の `docs-notes/roles/{karo|samurai|ninja}.md` を読む。
4. 家老のみ各peerへ役割指示（メモリ project-three-session-roles 参照）。

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

詳細: `docs-notes/architecture-monorepo.md` 参照

## 言語ルール【絶対順守】
- **内部キー（フォルダ名・ID・変数）**: すべて英語
- **表示テキスト**: 日本語切替→全て日本語、英語切替→全て英語

## 配信規約【重要】
- wiki = `/`（ルート）、calculator = `/calculator/`、GitHub Pages `docs/`
- fetchパスは `import.meta.env.BASE_URL` プレフィックス必須（絶対パス禁止）

## 禁止事項
- 情報源不明の数値をタグなしで記載 / 不整合解決以外の独自フォーマット
- 大きなサイズの並列処理 / 絶対fetchパス（`/i18n/...` 等）の新規追加

## フェーズ進捗

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1〜7 | 言語基盤・E2E・Vue移行・UI・モノレポ | ✅ 完了 |
| 8 | wikiコンテンツ充実 | 🔄 進行中 |

### フェーズ8 完了済み（〜2026-06-25）
- 商品一覧（食料/建設/ファッション/文化/中間品/原材料の6分類・全商品）
- 生産チェーン一覧（Mermaid図）・地域別商品・住民層・建物効果（173件）
- アイテム一覧（421件）・生産品需要逆引き（tier表示・上位互換含む）
- スキルツリー（193件・4ブランチ・アイコン150件）
- wiki↔計算機 双方向ナビ
- 公式データ自動生成インフラ（build-buildings-data.py / build-game-data.py）
- 建物効果2倍バグ修正（AttributeProvider二重計上を除去）

### フェーズ8 残作業
- アイテム効果値の検証・更新（`_local/annolayouts-items-data.json` に差分27件保存済み）
- DLC商品アイコン差し替え（Statuettes/Latrunculi Sets）
- military_camp 建物効果の実機確認
- 計算機のMermaid生産チェーン表示が全商品空白（既存問題）

### 公式ゲームデータ（最重要資産）
- `_local/anno-official-data/`（gitignore・未追跡）: assets.xml + official_master.csv（30,719件）
- スクリプト: `tools/build-buildings-data.py`（建物）/ `tools/build-game-data.py`（商品等）
- 軽量参照: `_local/anno-official-data/buildings-data.json` / `game-data.json`

## 制作の基本行動【MUST】
1. CLAUDE.mdは200行以内。超える場合は要約または分離
2. 1ファイル1責務、処理を詰め込みすぎない
3. 変更前に影響範囲を説明
4. エラー処理を必ず追加
5. エラー調査はサブエージェント（investigator）を使用
6. 制作は3セッション並列起動を基本動作とする
7. ビルド可否は必ず実コマンド出力で確認（目視「成功」報告禁止）
8. 環境依存文字を受け答えでは使用しない

## 重要な教訓
- ピアへの送信は antml:invoke 形式で書く（`<invoke>` 形式は「malformed」で弾かれる）
- `@anno/shared` の fetch文字列は変更しない（publicDir契約を壊す）
- 並列セッションでの同一ファイル競合に注意
- VitePressデータローダーからnamed exportは不可（`export default { load() }` のみ）
- 建物効果: FunctionalEffectsのみ集計・AttributeProviderは二重計上になるため除外
- **ビルドは必ず `bun run build:site`**（`bun run build` は計算機のみ・wikiが docs/ から消える）
- build:site 実行後は `ls docs/` で wiki ファイルの存在を確認してからコミット

## 参考リンク
- anno-calculator公式: GitHub: agentquackyt/Anno117Calculator
- Bun: https://bun.sh/
