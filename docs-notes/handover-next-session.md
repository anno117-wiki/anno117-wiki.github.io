# 次回セッション 引き継ぎプラン

作成日: 2026-06-18（更新） / 作成: 侍（実装役）

---

## 最重要・家老ツール「化け」の現況【次回必読】

家老セッションでツール出力が断続的に化ける異常は継続。原因は絞れている（メモリ [[karo-tool-garbling]]）。

- 正体は2種類: (a) 英語の独白がモデル側で結果直後に混入、(b) 多列出力や `Get-Content -Raw` の整形崩れ。
- **コアのツール値そのものは正しい**。壊れているのは整形と混入であって値ではない。
- 対処: PowerShell は `... | Out-String` で単一値を返すと安定。ファイル実在確認は Glob を優先。Edit が「未読」エラーなら Write 全文置換で回避。
- 検証手段: ファイル有無・成否は PowerShell の単純出力か殿の目視を最終根拠とする（事後ログ検証は不可＝[[no-transcript-logs]]）。

---

## 今セッションで完了したこと（2026-06-17）

### タスク1: ホワイトボード作成・統合 ✅完了
- 前回「実体なし」だった3ファイルを各役が書き直し。
- `docs-notes/whiteboard_karo.md`（家老7項目）/ `whiteboard-samurai.md`（侍7項目）/ `whiteboard-ninja.md`（忍者7項目）。
- 忍者が `docs-notes/whiteboard.md` に統合（3役・計21項目・「## 家老/## 侍/## 忍者」見出し）。家老が内容確認済み。

### タスク2: 役割別docs分離 ✅完了
- `docs-notes/roles/karo.md`（家老：采配・委譲作法・化け対処・禁止語）作成。
- `docs-notes/roles/samurai.md`（侍：ビルド検証MUST・コミット粒度・E2E・PowerShell安定化）作成。
- `docs-notes/roles/ninja.md`（忍者：公式データ照合・二重検証・未確定事項の扱い・investigator使用）作成。
- **CLAUDE.md ディスパッチャ化**（家老が直接編集）:
  1. 起動手順に「役を名乗ったら自分の役の `roles/{役}.md` を読む」step追加（旧step3→4に繰り下げ）。
  2. 禁止事項の【家老】重い実作業行を削除 → karo.md へ移設。
  3. 「コミット粒度ルール」節を削除 → samurai.md へ移設。
  4. 共通項目（言語・配信・禁止・シェル・役割自動決定）は本体に残置。CLAUDE.md は約126行で200行ルール内。

### コミット（侍が実施）
- docs: 役割別docs分離（CLAUDE.mdディスパッチャ化＋roles/3ファイル）
- docs: 3セッション開発ホワイトボードを追加（whiteboard関連）
- ※ 各hashは侍の報告参照。handover-next-session.md は本ファイルのみ別途コミット要。

---

## 今セッション完了（2026-06-18）

### buildings-effects.json データ修正（殿承認済み、全コミット済み）
- theatre: tier `libertus` → `equites`（commit 2e88e27）
- albion_bird_charmer: icon フィールド削除（commit 2e88e27）
- albion_resort: icon `public_celtic_sportsfield` 追加漏れ修正（commit 64e9ad2）
- albion_panam: icon `public_celtic_fanum` 追加漏れ修正（commit 64e9ad2）

### 港湾・軍事・施設・住居系 16建物 追加（commit 1a4ed94）
PNG 16件を 2箇所へコピー済み（packages/shared/public/icons/buildings/ と apps/wiki/docs/public/icons/buildings/）。
追加エントリ: warehouse / residence / governor_villa / officium / depot / trading_post / shipyard / trading_pier / repair_crane / vigiles / custodia / medici / barracks / military_camp / siege_workshop / equitum_campus

**建物効果JSON現況: 総156件・アイコン付き34件（家老確認済み）**

## 次の一手（優先順）

1. **albion_underground_pit（土窯）削除**: 2026-06-17 殿の実機確認で「実機に存在しないデータ」と判明。忍者が影響範囲調査→侍が削除＋ビルド＋コミット。
2. **新規追加16件の効果値補完**: 現在全フィールド0またはmaintenanceのみ。殿確認後に実値を入れる。
3. **役別docs運用の継続検証**: 各役が起動時に `docs-notes/roles/{役}.md` を読む運用定着確認。

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。使わず「任務完了」「撤収せよ」等を使う。
- ピア送信・ファイル操作は正規のツール呼び出しで行い、PowerShell/Glob で成否を検証する。
- 3セッション役割: 家老（采配）・侍（実装/ビルド/E2E）・忍者（調査/検証）。peer ID は起動毎に変わるため list_peers(scope=repo) で都度確認。
- 役固有の詳細は `docs-notes/roles/` を参照する構造になった（CLAUDE.mdはディスパッチャ＋共通項目）。
- 忍者が Chrome DevTools MCP を user スコープに導入済み。

---

## データソース（不変）

- 公式ゲームデータ一式: `_local/anno-official-data/`（未追跡・最重要資産）。GUID→公式日本語名は official_master.csv 一枚で解決。
- アイテム一覧: `packages/shared/public/data/items-full.json`（421件）
- アイテム生成: `tools/build-items-ja.py`
- 建物効果JSON: `apps/wiki/docs/wiki/buildings-effects.json`（156件・アイコン付き34件）
