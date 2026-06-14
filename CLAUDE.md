# Anno 117 統合Wikiプロジェクト

## セッション開始時【MUST】
- `docs-notes/handover-next-session.md` があれば**最初に読む**（前回からの引き継ぎ。残課題・未コミット分・注意点）。

### 起動手順（審議せず順に実行＝考え込み時間を削減）
3セッション並列時、家老は以下を機械的に実行する（毎回の手順検討を省く）:
1. **第1バッチ（1メッセージで並列）**: `ToolSearch select:mcp__claude-peers__list_peers,mcp__claude-peers__send_message,mcp__claude-peers__check_messages,mcp__claude-peers__set_summary` ＋ handover読み込み。
2. `list_peers(scope=repo)` で在陣確認 → `set_summary` で役割表明。
3. 各peerへ役割指示（役割分担はメモリ project-three-session-roles 参照）。

### シェル運用【重要】
- グローバル `SHELL` は **Git Bash**（`C:\Program Files\Git\bin\bash.exe`）。BashツールもPowerShellツールも利用可。
- どちらでもよいが迷わず実行する（起動時にシェル探索で往復しない）。
- 不可避コスト（再調査不要）: deferredツールの `ToolSearch` 往復1回と、起動時のプロンプトキャッシュ冷えは仕様であり設定で無効化不可。

## 概要
Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機を統合したWebアプリ。
anno-calculator公式（GitHub: agentquackyt/Anno117Calculator）のデータを活用。

## 技術スタック
- TypeScript ^5.6 / Vue 3.5.35 / Vite 8.x
- bun（パッケージマネージャ・ランタイム）
- VitePress（wiki）/ Playwright 1.60.0（E2E）
- **Capacitor・Tailwindは未導入**（標準CSS: apps/calculator/src/css/theme.css）

## プロジェクト構造（モノレポ移行後）

```
anno_db2/                        ← workspaces root
├── packages/shared/             # @anno/shared（データ・ロジック共有）
│   ├── src/                     # GoodsRepository, I18nManager, 型定義
│   └── public/                  # 旧 src/assets（データ・アイコン・i18n）
├── apps/
│   ├── calculator/              # 生産チェーン計算機SPA
│   └── wiki/                    # VitePress wiki
├── scripts/build-site.ts        # 一体ビルド合成
├── docs/                        # 配信出力（wiki=/, calculator=/calculator）
├── .claude/agents/              # カスタムサブエージェント
├── tools/                       # データ生成スクリプト
└── special_thanks/              # anno-calculator data sample
```

詳細アーキテクチャ: `docs-notes/architecture-monorepo.md` 参照

## 言語ルール【絶対順守】
- **内部キー（フォルダ名・ID・変数）**: すべて英語
- **表示テキスト**: 日本語切替→全て日本語、英語切替→全て英語

## アイコン管理
- 配置: `packages/shared/public/icons/{商品ID}.png`
- サイズ: 64×64px以上、PNG形式

## 配信規約【重要】
- wiki = `/`（ルート）、calculator = `/calculator/`
- GitHub Pages `docs/`、CNAME無し
- fetchパスは `import.meta.env.BASE_URL` プレフィックス必須（絶対パス禁止）

## 禁止事項
- ❌ 情報源不明の数値をタグなしで記載
- ❌ 不整合解決以外の目的で独自フォーマットを使用
- ❌ 大きなサイズの並列処理（効率低下）
- ❌ 絶対fetchパス（`/i18n/...` 等）の新規追加
- ❌ 【家老】重い実作業を自ら実行（`git commit` / `bun run build:site` / E2E / `bunx serve`）→ 侍・忍者へ委譲。やむを得ない場合は `run_in_background` で実行し対話窓口を空けること

## フェーズ進捗

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1 | 言語切り替え基盤（ja/en 114商品） | ✅ 完了 |
| 2 | Playwright E2E環境構築 | ✅ 完了 |
| 3 | Vue 3.5 + Vite 8 移行 | ✅ 完了 |
| 4 | ツリー型商品選択UI（4カテゴリ・48商品） | ✅ 完了 |
| 5 | 3カラムレイアウト | ✅ 完了 |
| 7 | モノレポ再編 + VitePress wiki | ✅ 完了（第0-5段＋E2E 35/35全通過） |

フェーズ7詳細計画: `c:\Users\kojif\.claude\plans\claude-md-replicated-crown.md`

### フェーズ7 完了済み段（2026-06-13）
- ✅ 第0段: git/作業ツリー整理
- ✅ 第1段: workspaces骨組み
- ✅ 第2段: @anno/shared 切り出し
- ✅ 第3段: calculator アプリ化（src/→apps/calculator/src/、publicDir共有化、BASE_URL化）
- ✅ 第4段: VitePress wiki 骨組み
- ✅ 第5段: 一体ビルド（bun run build:site、exit0確認済み）
- ✅ E2E検証: 33 failed→**35/35 全通過**（2026-06-14）。原因はテスト陳腐化6件＋
  既存バグ2件（SVGズームの pointer-events / 地域切替レート保持）でモノレポ移行とは無関係。
  詳細は docs-notes/handover-phase7-verification.md
- 残課題（軽微・任意）: フォント警告（theme.css のフォントパス、serifフォールバックで実害なし）

## 制作の基本行動【MUST】

1. CLAUDE.mdは200行以内。超える場合は要約または分離
2. 1ファイル1責務、処理を詰め込みすぎない
3. 変更前に影響範囲を説明
4. エラー処理を必ず追加
5. エラー調査はサブエージェント（investigator）を使用
6. 制作は3セッション並列起動を基本動作とする
7. ビルド可否は必ず実コマンド出力で確認（目視「成功」報告禁止）
8. 環境依存文字を受け答えでは使用しない(過去5回ほど経験)

## 重要な教訓
- `@anno/shared` の fetch文字列は変更しない（publicDir契約を壊す）
- 並列セッションでの同一ファイル競合に注意
- Grep結果が混線した場合は必ず実ファイルで確認

## 参考リンク
- anno-calculator公式: GitHub: agentquackyt/Anno117Calculator
- Anno Calculator: https://anno-calculator.org/
- Bun: https://bun.sh/
