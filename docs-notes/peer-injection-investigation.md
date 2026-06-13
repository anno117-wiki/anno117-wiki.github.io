# 調査報告書 — claude-peers「偽テキスト混入」事案の原文追跡

調査日: 2026-06-13 ／ 調査: 侍（実装役）＋investigatorサブエージェント二回
発端: 家老が2026-06-12に経験した「外部由来の偽テキスト混入」事案（docs-notes/next-session-phase4.md 第7節）の出所特定

---

## 結論（先に要点）

**家老が報告した攻撃ペイロードの「原文」は、claude-peers のメッセージDBに実在しなかった。**
peerメッセージ全1454件を実データで検分した限り、外部の第三者による標的型プロンプトインジェクションの物証は得られなかった。
ただし claude-peers の造り自体は無害化を欠き、将来の本物の攻撃に対して無防備である（別項）。

---

## 調査の経緯と確認した事実

### 一. 混入の入口候補の絞り込み（investigator 一回目）
- 家老の事案セッション `d0ec1330-...jsonl` を検分。
- 偽テキスト混入を報告した家老の発話に `attributionMcpServer:"claude-peers"` / `attributionMcpTool:"check_messages"` の刻印あり。
  → この時点では「経路＝claude-peers のpeerメッセージ」と**推測**された。
- Read/WebFetch等のツール結果やファイル本体には混入痕跡なし。
- ただし攻撃の「生の原文」はセッション記録(.jsonl)に独立したtool_resultとして残っていなかった。

### 二. メッセージの保存先特定（investigator 二回目）
- `C:\Users\kojif\.claude\peer-mcp\broker.ts` を精読。
- 受信メッセージは **SQLite に永続化**される: `C:\Users\kojif\.claude-peers.db`（WALモード）。
- `messages` テーブル: `from_id, to_id, text, sent_at, delivered`。
- `handleSendMessage` は無害化なしで原文をそのままINSERT。
- 配信時は `delivered=1` へUPDATEするのみで **行を削除しない**。
  → 配信済みの攻撃メッセージも論理的にDBに残り続ける設計。

### 三. 原文の実検分（侍がBash＋Python sqlite3で読み取り専用アクセス）
- `messages` 全1454件を取得。
- 攻撃の常套句（`rm -rf` / `:wq` / `system-reminder` / 削除誘導 / `ignore previous` 等）で絞り込み → 該当11件。
- **11件は全て正規のセッション間開発指示だった**。例:
  - #30: devserver.ts の `rm -rf ./docs/*` をViteビルドに置換するコード提案
  - #79: Viteキャッシュ `rm -rf node_modules/.vite` 削除の正規手順
  - #159: `rm -rf dustbox` 死蔵フォルダ整理のタスク指示
  - #1394: `git rm -f` で旧i18n削除した完了報告（殿の采配済みと明記）
  - #1403: `git rm -r --cached` 二重管理解消の家老指示
- **決定的所見**: 家老が報告した攻撃の固有の特徴 —— `:wq`、偽の system-reminder、`rm -rf docs-notes/` の削除誘導、偽の「殿の指示」 —— を含むメッセージは、1454件のどこにも存在しなかった。

---

## 見立て（最も妥当な解釈）

外部攻撃ではなく、以下が「偽の指示が紛れ込んだ」と認識された可能性が高い:
- 複数セッション（侍・忍者・家老・将軍・武将等）の正規メッセージの錯綜
- claude-peers MCP が接続時に流す instructions 文（`IMPORTANT: ...RESPOND IMMEDIATELY...` という行動誘導。今回の investigator も同文を受信し、従わず継続した）

確証ではない。だが「peerメッセージDBに原文が無い」以上、標的型インジェクションと断ずる根拠は無い。

---

## 別項: 実在する脆弱性（今回攻撃が無くても残る課題）

- `server.ts` / `broker.ts` は受信本文を **無害化せずそのままモデルのコンテキストへ注入**する。
- 配信後も論理削除せずDBに残す。
- 将来、悪意あるプロセスがローカルbroker（`http://127.0.0.1:7899`）の `/send-message` を叩けば、本物のプロンプトインジェクションは通り得る。
- 受信メッセージは引き続き疑うこと。harness が付ける `<channel source=...>` の untrusted 警告に従うのが正しい。

---

## 検分した主なファイル（絶対パス）
- `C:\Users\kojif\.claude\peer-mcp\server.ts`（送受信ロジック、無害化なしを確認）
- `C:\Users\kojif\.claude\peer-mcp\broker.ts`（SQLite永続化、論理削除のみを確認）
- `C:\Users\kojif\.claude-peers.db`（messages 全1454件、読み取り専用で検分）
- `C:\Users\kojif\.claude\projects\C--Users-kojif-Desktop-anno-db2\d0ec1330-...jsonl`（事案セッション）
- `docs-notes\next-session-phase4.md` 第7節（事案の元記述）

調査中、DBへの変更は一切行っていない（読み取り専用接続）。
