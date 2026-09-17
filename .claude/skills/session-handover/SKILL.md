---
name: session-handover
description: Anno 117統合Wikiプロジェクト（`C:\Users\kojif\Desktop\anno_db2\`）のセッション終了時に、次セッションへの引き継ぎ文書 `docs-notes/handover-next-session.md` を更新する標準手順。3セッション並列体制（家老/侍/忍者）では家老の責務。次セッションはこの文書を最初に読んで状態を把握するため、git状態・残課題・注意点を漏れなく記録する。
---

# Anno117 Session Handover（セッション引き継ぎ更新）

## Overview

Anno 117統合Wikiプロジェクト（`C:\Users\kojif\Desktop\anno_db2\`）のセッション終了時に、次セッションへの引き継ぎ文書 `docs-notes/handover-next-session.md` を更新する標準手順。3セッション並列体制（家老/侍/忍者）では家老の責務。次セッションはこの文書を最初に読んで状態を把握するため、git状態・残課題・注意点を漏れなく記録する。

## Parameters

- **session_summary** (required): 今セッションで完了した作業と未完了の作業の概要
- **repo_root** (optional, default: "C:\Users\kojif\Desktop\anno_db2"): プロジェクトルート

**Constraints for parameter acquisition:**
- If all required parameters are already provided, You MUST proceed to the Steps
- If any required parameters are missing, You MUST ask for them before proceeding
- When asking for parameters, You MUST request all parameters in a single prompt
- When asking for parameters, You MUST use the exact parameter names as defined

## Steps

### 1. git状態の確認
現在のリポジトリ状態を実コマンドで確認する。

**Constraints:**
- You MUST run `git status` and `git log --oneline -5` to record the actual state
- You MUST list uncommitted changes explicitly because 次セッションが「コミット済みか」を推測すると事故につながるため

### 2. 引き継ぎ文書の更新
`docs-notes/handover-next-session.md` を更新する。

**Constraints:**
- You MUST record: 完了した作業 / 未コミット分 / 残課題 / 注意点・保留事項
- You MUST NOT delete the 「セッション開始時の確認事項」 section because 全セッション共通の起動チェックリストであり削除禁止と明記されているため
- You MUST record unconfirmed values as 「公式名未確定・実機確認待ち」or「保留・確認待ち」（推測での確定禁止）
- You SHOULD convert relative dates（「今日」「昨日」等）to absolute dates because 次セッションでは基準日が変わるため

### 3. メモリの更新
ユーザーメモリのプロジェクト情報を最新化する。

**Constraints:**
- You SHOULD update the project memory if project paths, phases, or major decisions changed this session
- You MUST NOT duplicate what handover-next-session.md already records, because 二重管理は更新漏れによる矛盾の原因になるため（メモリはパス・体制などの安定情報、handoverは作業状態、と役割を分ける）

## Examples

### Example 1: 通常のセッション終了
**Input:**
- session_summary: "生産チェーン3件追加、E2E 39/40、mead_albionの日本語名が未確定"

**Expected Behavior:**
git status / log で実状態を確認 → handover-next-session.md に完了3件・未確定1件（実機確認待ち）・E2E結果を記録 → 「セッション開始時の確認事項」セクションは保持。

## Troubleshooting

### handoverに何を書くべきか迷う
「次セッションの自分が最初の5分で知りたいこと」を基準にする。git状態・やりかけの作業・踏むと危ない罠の3点は必須。

### 並列セッションで他の役の作業状態が不明
list_peers / check_messages で確認し、応答がない場合は「状態未確認」と明記して引き継ぐ（推測で「完了」と書かない）。
