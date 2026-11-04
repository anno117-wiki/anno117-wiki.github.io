# PC版のRDA展開と解析の手順（2026-11-04作成）

目的: 無料プレイ期間にPC版（Steam）をダウンロードし、`.rda` から `assets.xml` などを取り出して解析する。
背景: 上流の配布方式が変わり、v2.1 が最後のフル版になる恐れがある（`handover-archive.md` のO節）。PS5版のみでは抽出できなかった。

## 前提（2026-11-04時点）

- 無料プレイ: 2026-11-05（木）19:00 JST（10:00 UTC）から11-09まで。**ベースゲームのみ、DLCは含まれない**（出所: https://www.anno-union.com/union-update-free-weekend-and-dawn-of-the-delta-release/ ）。
- 無料の対象プラットフォームは記事に明記なし。Steamで無料になるかは**当日に確認が必要**。11-04時点のSteamストアには無料の表示なし（通常価格 8,360円）。
- Steamストアの注記: **Ubisoftアカウントが必要**、サードパーティEULAへの同意が必要、DRMは Denuvo Anti-tamper。
- このPC: Core i9-12900H / RAM 31.8GB / GPU は Intel Iris Xe（内蔵）/ SSD / C空き 約715GB / Windows 11 Pro。**GPUが最低要件に届かない**ため、ゲームの起動は期待しない。展開だけが目的なので影響なし。
- 必要な空き容量: 117GB（公式要件）。
- Steamは導入済み。

## ツール（導入済み・起動確認済み）

`_local/tools/`（git管理外）。いずれも anno-mods のGitHubリリース。

| ツール | 版 | 用途 | 場所 |
|---|---|---|---|
| RdaConsole | v1.2（表示は1.1.0） | `.rda` の展開（`extract`）と作成（`pack`） | `_local/tools/RdaConsole/build/RdaConsole.exe` |
| FileDBReader | v3.0.3 | filedb形式をXMLへ変換（`decompress`、`interpret`、`check_fileversion` ほか） | `_local/tools/FileDBReader/FileDBReader/FileDBReader.exe` |
| RDAExplorer | v1.4.0-jakob2 | ライブラリDLLのみ | `_local/tools/RDAExplorer/RDAExplorer.dll` |

**未確認**: Anno 117の `.rda` を実際に読めるか。ゲームファイルが無いと確認できない。
参考: Anno-Unionは、Anno 117のエンジンはAnno 1800の継続で、RDAを展開する道具は変更なしで動くと書いている（https://www.anno-union.com/?p=23284 ）。

## 当日の手順

1. 19:00 JST以降、Steamストアの「Anno 117: Pax Romana」で、無料プレイの表示が出るか確認する。出なければ、ここで中止し、ユーザーに伝える。
2. 無料プレイを開始し、Ubisoftアカウントでの連携とEULAの同意を済ませる（ユーザーが行う）。
3. インストールする。完了したら、インストール先のフォルダの場所を共有してもらう。
4. インストール先にある `.rda` の一覧を確認する（まだ展開しない）。
5. 展開先を新しく作る。既存の `_local/anno-official-data/v2.0.0.1/` と `v2.1/` は**消さない・上書きしない**。例: `_local/anno-official-data/v3.0-base/`。
6. `RdaConsole.exe extract` で、`.rda` を番号の小さい順に1つのフォルダへ展開する。同名のファイル（`assets.xml` など）は、**番号が最大の `.rda` のものが有効**（出所: https://github.com/anno-mods/modding-guide/blob/main/getting-started/tools-you-need.md ）。
7. 展開した `assets.xml` が読めるか確認する。形式が違えば、`FileDBReader` の `check_fileversion` と `decompress` を試す。
8. 展開した `assets.xml` を、v2.1と比べる。
   - 食い違いの種類を数える（追加・削除・値の変更）。
   - 値の変更は、「3.0で変わった既存の数値」（`dlc03-ingame-checklist.md` の10節）の裏付けになる。
9. DLC03のデータ（アイギュプト）が含まれているか確認する。含まれていない見込みが高い。含まれていた場合は、何が入っているかだけを記録し、ユーザーに伝える。
10. 結果を `handover-next-session.md` に記録する。

## 守ること

- 展開したデータは `_local/`（git管理外）に置く。コミットしない。
- 展開前後で、既存の `v2.1/` を変更していないことを確かめる。
- ツールの実行は、ユーザーが行うか、許可ルールを追加してもらう（外部の実行ファイルの実行は、権限判定で止まった）。
- Ubisoftの利用規約（EULA）の確認は、ユーザー側で行う。
- 解析した数値は、公式データだが、実機（PS5）と食い違えば実機を優先する。サイトに載せるときは、従来の方針に従う。

## 期限と終了条件

- 期限: 2026-11-09（無料期間の終了）まで。
- 終了条件: `assets.xml` の取り出しと、v2.1との差分確認が済む。期限までに取れなければ、状況をユーザーに伝える。
