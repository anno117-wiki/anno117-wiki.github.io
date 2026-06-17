# Anno 117 統合Wikiプロジェクト

## セッション開始時【MUST】
- `docs-notes/handover-next-session.md` があれば**最初に読む**（前回からの引き継ぎ。残課題・未コミット分・注意点）。

### 役割の自動決定【MUST・名乗り前に必ず実行】
役は**起動順で自動決定**する。人間が役ラベルを手で打ち分けないため、取り違えが構造的に起きない。
優先順位は **家老 > 侍 > 忍者**。**空いている最上位の役**を名乗る（人数を数えるのではなく、どの役が空席かを見る）。
1. `list_peers(scope=repo)` で、既に名乗られている役を確認する。
2. 空いている最上位の役を名乗る：誰もいない→家老 / 家老だけ居る→侍 / 家老＋侍が居る→忍者。
3. `set_summary` に**必ず役名を含めて**名乗る（他セッションから空席状況が見えるように）。
4. 名乗った直後にもう一度 `list_peers` で確認し、同じ役が重複していたら、**下位側（家老＞侍＞忍者の順で後）が譲って人間に確認する**。
5. **4人目以降になる／状況が判断できない時は、名乗らず人間に確認する**（推測で兼任・自動補完しない）。

※ 起動順を厳密にしたい時はターミナルを1つずつ間を空けて起動する。手動で役を固定したい場合は `prompts/startup-*.md` 参照（追跡対象外）。

### 起動手順（審議せず順に実行＝考え込み時間を削減）
1. **第1バッチ（1メッセージで並列）**: `ToolSearch select:mcp__claude-peers__list_peers,mcp__claude-peers__send_message,mcp__claude-peers__check_messages,mcp__claude-peers__set_summary` ＋ handover読み込み。
2. **役割の自動決定（上記）を実行** → 空席の最上位役を `set_summary` で名乗る。
3. **役を名乗ったら、自分の役の `docs-notes/roles/{karo|samurai|ninja}.md` を読む**（役固有の責務・手順を定義。共通項目は本CLAUDE.mdに残す）。
4. 家老になった場合のみ、各peerへ役割指示（役割分担はメモリ project-three-session-roles 参照）。

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
└── _local/                      # ローカル退避（.gitignore・コミット対象外）
    └── special_thanks/          # anno-calculator data sample（参照用・未追跡）
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

※ 役固有の責務（家老の委譲ルール・侍のコミット粒度/ビルド検証・忍者の調査作法）は `docs-notes/roles/` 配下を参照。

## フェーズ進捗

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1 | 言語切り替え基盤（ja/en 114商品） | ✅ 完了 |
| 2 | Playwright E2E環境構築 | ✅ 完了 |
| 3 | Vue 3.5 + Vite 8 移行 | ✅ 完了 |
| 4 | ツリー型商品選択UI（4カテゴリ・48商品） | ✅ 完了 |
| 5 | 3カラムレイアウト | ✅ 完了 |
| 7 | モノレポ再編 + VitePress wiki | ✅ 完了（第0-5段＋E2E 35/35全通過） |
| 8 | wikiコンテンツ充実（進行中） | 🔄 進行中 |

### フェーズ8 完了済み（2026-06-16）
- ✅ 商品一覧（カテゴリ別・48商品・VitePress データローダー）
- ✅ 地域別商品（ローマ固有/ケルト固有/共通の3分類）
- ✅ 生産チェーン一覧（多段階Mermaid図・クリック展開・生産時間表示）
- ✅ 住民層（9層のニーズ情報・進化図を静的SVG化＝ラティウム直線/アルビオン分岐）
- ✅ 建物効果（141件・全tier・nameJa=null 0件・殿実機確認済み・StatBar可視化・ヘッダー固定）
- ✅ アイテム一覧（公式日本語421件・分類/レアリティ絞り込み・価格k/M表記）
- ✅ 計算機改修（About削除/デフォルト日本語/Help多言語/使い方常時表示/ゴシック体/メタ自サイト化/件数→軒）
- ✅ 公式ゲームデータで日本語名を照合（建物・商品を公式値へ修正、アルビオン建物7件公式名化・不存在1件削除）

### フェーズ8 残作業
- albion_underground_pit（土窯）の公式名のみ未確定（実機確認待ち）

### 公式ゲームデータ（最重要資産）
- `_local/anno-official-data/`（gitignore済・未追跡）に公式全12言語テキスト＋assets.xml＋official_master.csv（30,719 asset）
- GUID→公式日本語名の解決済みマスタ。今後の名称照合は official_master.csv 一枚で完結
- 突合ロジック参考: `tools/build-items-ja.py`

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
- ピアへの送信は<invoke>形式）で書いてしまうと「malformed」で弾かれて送信されない。正しい書式（antml:invoke形式）で送る
- `@anno/shared` の fetch文字列は変更しない（publicDir契約を壊す）
- 並列セッションでの同一ファイル競合に注意
- Grep結果が混線した場合は必ず実ファイルで確認

## 参考リンク
- anno-calculator公式: GitHub: agentquackyt/Anno117Calculator
- Anno Calculator: https://anno-calculator.org/
- Bun: https://bun.sh/
