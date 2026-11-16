---
name: ps5-capture
description: PC で起動中の PS Remote Play のウィンドウを撮って画像を読み、PS5 の Anno 117 の画面（ツールチップ・需要・建物・スキルなど）をサイトの値と照らし合わせる手順。ユーザーが「撮って」「今の画面を見て」「Remote Play の画面を確認して」と言ったとき、実機の値の照合（未確認項目の確認）をするときに使う。
---

# PS5 Capture（PS Remote Play の画面を撮る）

## Overview

ユーザーは PC の PS Remote Play で PS5 を操作している。このスキルは、そのウィンドウを撮って `_local/ps5-captures/`（Git 管理外）に保存し、画像を読んでサイトの値と照らし合わせる。
ユーザーがスクショを保存して会話に貼る手間をなくすのが目的。操作（コントローラー入力）はユーザーが行い、Claude は撮影と照合だけを行う。

## Steps

1. **撮る**: PowerShell ツールで次を実行する（`-Name` は省略可。照合の対象が分かる短い英数字名を付けると後で探しやすい）。
   ```
   pwsh -File .claude/skills/ps5-capture/capture-remoteplay.ps1 -Name miut-tooltip
   ```
   出力の最終行が保存した画像のパス。エラーが出たら、その日本語のメッセージをユーザーに伝える（起動していない・最小化されている、など）。
2. **読む**: Read ツールで出力されたパスの画像を開く。
3. **照合する**: 画面の値を、サイトのデータ（`apps/wiki/docs/wiki/*.json`・`packages/shared/public/data/items-full.json` など）と本文に照らす。食い違えば**実機を優先**する（CLAUDE.md）。照合シートや未確認一覧（`docs-notes/unverified-items.md`）に関わる場合は、その記録の決まりに従う。
4. **報告する**: 読み取った値・一致／不一致・次に見たい画面を簡潔に伝える。ツールチップなどは表示中しか出ないので、次の画面を開いてもらうときは「どこにカーソルを当てるか」を具体的に頼む。

## 注意

- 撮影の方式は PrintWindow（`PW_RENDERFULLCONTENT`）。ほかのウィンドウが重なっていても撮れるが、**最小化中は撮れない**。
- 画像は `_local/ps5-captures/` に溜まる（Git 管理外）。不要になった画像の削除はユーザーに確かめてから行う。
- 画像はローカルで読むだけで、外部のサービスに送らない。
- 画面の文字が小さくて読み取れないときは、ゲーム側で拡大してもらうか、Remote Play のウィンドウを大きくしてもらう。
- プロセス名は `RemotePlay`（公式の PS Remote Play アプリ、2026-11-16 時点）。見つからないときは `Get-Process | Where-Object MainWindowTitle` で確かめ、`-ProcessName` で指定する。
