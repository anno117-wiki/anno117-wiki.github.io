# Anno 117 統合Wikiプロジェクト

## 概要
Anno 117（PS5/Steam）の日本語情報Wikiを織り込んだ 生産チェーン計算機を統合したWebアプリケーション。

---
  

## 基本構想
- anno-calculator公式からデータを流用し最大級のリスペクトをこめて日本語表示対応のアプリを作成する
- 言語切り替えボタンの実装 EN→J日本語
- 独自デザインのUIに変更 生産品はツリー選択 生産チェーン表示はオリジナルを尊重するがコントロール機能は変更したい
- 主要機能が完成したら独自要素を増やす
- wiki形式での攻略情報配信（将来の展望）

## 技術スタック
- TypeScript (^5.3.3)
- Vue 3
- Tailwind CSS
- Capacitor
- PostCSS / Autoprefixer
- Playwright
- 但し、新たに追加する機能については言及しない

## プロジェクト構造

```
anno_DB2/
|
├── .claude/agents         #カスタムサブエージェント

├── docs/                    
│   └── assets/
│         ├── data
|         ├── fonts/       
|         ├── icon/        # 統一アイコン
|         └── productions/ # 製品ID
│
├── src/
|
├── tools/
|
└── special_thanks/        # anno-calculator data sample           

```
## 言語ルール（重要）

### 内部キー：すべて英語 【絶対順守】

- フォルダ名、ID、タグ、変数もすべて英語

### 表示テキスト：【絶対順守】

- 日本語切替時はすべて日本語表示
- 英語切替時はすべて英語表示

---


## アイコン管理

**統一ルール:**
- 出典: anno-calculator公式（GitHub: agentquackyt/Anno117Calculator）
- 配置: `assets/icons/{商品ID}.png`
- サイズ: 64×64px以上、PNG形式

---

## 主要ツール

---

## 禁止事項

- ❌ 情報源不明の数値をタグなしで記載
- ❌ 不整合の解決以外の目的で独自フォーマットは使用しない
- ❌ 大きなサイズの並列処理（効率低下）
---

## 現在の状況

- 公式データそのものを仮配置してある。
- 日本語→英語変換のマッピング用JSONは作成してあるが活用できる形式に修正が必要

## 今後の制作方針

 1.anno-calculator公式機能の実装
 2.言語切り替え機能の実装 （変換マッピングの整合性確認）
 3.公式機能の改変
 4.独自UIの企画・検討・技術スタックの選定
 5.wikiサイトの作成と連携機能を企画・技術スタックの選定
 6.ビルド・git公開

## 制作の基本行動
 
 1.claude.mdは200行以内とし@docs/○○.mdのように別ファイルに書き出すこと
 2.1つのファイルに処理を詰め込みすぎない
 3.変更前に影響範囲を説明する
 4.エラー処理を追加する
 5.計画・実装・レビュー・テストにはカスタムサブエージェントを使用する



## 参考リンク

- **anno-calculator公式**:（GitHub: agentquackyt/Anno117Calculator）
- **Anno Calculator**: https://anno-calculator.org/
- **Bun**: https://bun.sh/

---
