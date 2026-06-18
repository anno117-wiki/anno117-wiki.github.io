# 次回セッション 引き継ぎプラン

作成日: 2026-06-18 / 作成: 家老（指揮役）

---

## 最重要・家老ツール「化け」の現況【次回必読】

家老セッションでツール出力が断続的に化ける既知の異常は継続中（メモリ [[karo-tool-garbling]]）。
- PowerShell は単一値出力で安定。多列出力・Get-Content -Raw は避ける。
- ファイル実在確認は Glob を優先。値そのものは正しいことが多い。
- transcript非保存設定のため事後ログ検証は不可（[[no-transcript-logs]]）。

---

## 今セッションで完了したこと（2026-06-17〜18）

### タスク1: ホワイトボード統合 ✅
- docs-notes/whiteboard.md 完成（3役・計21項目）

### タスク2: 役割別docs分離 ✅
- docs-notes/roles/karo.md / samurai.md / ninja.md 作成
- CLAUDE.md ディスパッチャ化（起動手順step3に「自分の役のdocsを読む」追加）

### タスク3: albion_underground_pit 判明 ✅
- 殿の実機確認で「実機に存在しないデータ」と確定 → 要削除（次回対応）

### D-2: 建物アイコン全件実装 ✅
- アイコン付き: 合計34件（公共施設19・驚異2・港湾5・施設3・軍事4・住居1）
- カテゴリーフィルター追加（公共施設/驚異/港湾/軍事/施設/住居/生産施設）
- アイコンキーのプレフィックスからカテゴリーを自動導出する設計
- 建物効果ページ総件数: 156件
- アイコン逆引きマッピング記録: docs-notes/building-icon-mapping.md
- public_celtic_library アイコンは将来用として保留（対応建物なし）

### データ修正 ✅
- 劇場(theatre): tier libertus → equites
- 鳥使い(albion_bird_charmer): 誤icon削除（生産施設に正しく分類）
- 運動場(albion_resort)・聖所(albion_panam): アイコン追加漏れ修正

---

## 次の一手（優先順）

1. **未コミット**: docs-notes/building-icon-mapping.md をコミットせよ（侍へ委譲）
2. **albion_underground_pit 削除**: 実機非存在確定。忍者が影響範囲調査→侍が削除＋ビルド＋コミット。
3. **wikiと計算機の連携改善**（殿が冒頭で言及・D-2着手で後回し）: 軽量化も視野に入れた改善案を改めて提案する。
4. **public_celtic_library**: 対応建物追加のタイミングでアイコン設定を行う。

---

## 注意点

- 「解散」は禁止語（hook起動でセッション終了）。使わず「任務完了」「撤収せよ」等。
- 役固有の詳細は docs-notes/roles/ 参照（CLAUDE.mdはディスパッチャ＋共通項目のみ）。
- peer ID は起動毎に変わるため list_peers(scope=repo) で都度確認。
- 忍者が Chrome DevTools MCP を user スコープに導入済み。

---

## データソース（不変）

- 公式ゲームデータ: _local/anno-official-data/（未追跡・最重要資産）
- 建物効果JSON: apps/wiki/docs/wiki/buildings-effects.json（156件）
- 建物アイコン: apps/wiki/docs/public/icons/buildings/（34件PNG）
- アイテム: packages/shared/public/data/items-full.json（421件）
