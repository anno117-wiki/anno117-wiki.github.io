# 次回セッション 引き継ぎプラン

作成日: 2026-06-14 ／ 作成: 家老（指揮役）

---

## 1. 最優先：未コミット分のコミット（殿の指示で次回に持ち越し）

本日の作業ツリーに、未コミットの設定変更が残っている。次回まずこれをコミットすること。

```
 M CLAUDE.md                           セッション開始時の引き継ぎ読み込み導線を追加
 M .claude/hooks/dismiss-trigger.js   解散フックをロックファイル方式へ改修＋出力先を固定名に統一
 M .gitignore                          .claude/.dismiss.lock を除外追加
?? .claude/agents/e2e.md               三人衆作業中に生成されたエージェント定義
?? docs-notes/handover-next-session.md この引き継ぎ書自体
```

- コミット前に `.claude/agents/e2e.md` の中身を確認し、追跡してよいか殿に確認（要否未判断）。
- `.claude/` 一式（hooks/・settings.local.json・agents/）を追跡するか方針を決める。
  settings.local.json は個人設定ゆえ通常は追跡しない判断もある。殿に諮ること。
- コミット例:
  - `chore: 解散フックをロックファイル方式に変更（CLAUDE.md同時書き込み競合を解消）`

## 2. 完了済みの確認事項（再着手不要）

- **フェーズ7（モノレポ再編 + VitePress wiki）は完了**。E2E **35/35 全通過**。
- 一体ビルド `bun run build:site` は exit 0、配信物 docs/ もコミット済み・最新。
- 解散フックは「ロックファイルで最初の1セッションのみ終了作業」に改修済み
  （詳細: メモリ project-dismiss-trigger-hook、本書末尾の注意点）。

## 3. 残課題（軽微・任意）

- **NotoSerif フォント警告**: `apps/calculator/src/css/theme.css` の `url("../fonts/NotoSerif.ttf")`。
  配信(build:site, base=/calculator/)では正しく解決され実害なし。serif フォールバックあり。
  dev(base=/) では字体が出ないが開発時のみ。完全対応は優先度低。
- **E2E テスト陳腐化の予防**: 今回 tree-navigation のカテゴリ体系ずれを修正済み。
  今後 categories.json を変えたら E2E の期待値も追従させること。

## 4. 視覚確認で見えた品質メモ（次に着手するなら）

`bunx serve docs` で実画面を確認した際の所見:
- 計算機のアイコン画像が一部欠ける箇所があった（生産チェーンのノード、修正設定パネル、
  地域アイコン）。E2E は handleImageError で隠れるため検出されない。
  fetch/参照パスかアイコン配置の不整合が疑われる。要調査（今回は未着手）。
- 計算機初期の "Select a good from the table..." が英語のまま（初期メッセージ未翻訳）。

## 5. 運用上の注意点

- **解散フックは次回起動から有効**（hookはセッション開始時に読まれる）。
- 3セッション並列が基本動作。同一 cwd で競合に注意（CLAUDE.md・handover は本日複数人が触れた）。
- `@anno/shared` の fetch文字列・publicDir契約は変更しない。
- 環境依存文字（丸数字・絵文字・罫線記号）は使わない（殿との約束）。

## 6. 主要コミット履歴（本日分）

- bde8757 docs: フェーズ7を完了に更新（E2E 35/35）
- c81c63a build: 配信物再生成（残バグ修正反映）
- ad54bf8 test: E2Eを現行仕様に追従
- 5ec8d63 fix: E2E残バグ修正（SVGズーム/地域切替/stale closure）
- c0c99b4 build: 配信物再生成（fetchパス修正反映）
- 62166b2 fix: E2E復旧（fetchパス・テンプレ内import.meta）
