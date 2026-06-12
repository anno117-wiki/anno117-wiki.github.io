# Anno 117 Calculator JP / Anno 117計算機（日本語版）

[English](#english) | [日本語](#japanese)

---

## <a name="english"></a>English

### Overview

Anno 117 Production Chain Calculator with full Japanese language support. This web application helps you visualize and optimize production chains in Anno 117 (PS5/Steam).

### Features

- **Bilingual Support**: Seamless switching between Japanese and English
- **Tree-based Product Selection**: Intuitive category-based product browsing
- **Interactive Production Chains**: Visual SVG graph with zoom and pan controls
- **Auto Ratio Calculation**: Automatic optimization of production ratios
- **Regional Production**: Support for Latium, Albion, and Mesopotamia regions
- **Responsive Design**: Works on desktop and mobile devices

### Tech Stack

- **TypeScript** 5.3.3
- **Vue 3** 3.5.35
- **Vite** 8.0.16
- **Tailwind CSS**
- **Playwright** 1.60.0 (E2E Testing)
- **Bun** (Runtime & Package Manager)

### Quick Start

#### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- Node.js 18+ (optional, for compatibility)

#### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/anno_db2.git
cd anno_db2

# Install dependencies
bun install
```

#### Development

```bash
# Start development server (Vite)
bun run dev

# Access at http://localhost:5173
```

#### Build

```bash
# Build for production
bun run build:vite

# Preview production build
bun run preview
```

#### Testing

```bash
# Run E2E tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests in headed mode (visible browser)
bun run test:headed

# Show test report
bun run test:report
```

### Project Structure

```
anno_db2/
├── src/
│   ├── assets/          # Static assets (icons, data)
│   ├── components/      # Vue 3 components
│   ├── utils/           # Utility functions
│   └── vue-app.ts       # Vue app initialization
├── docs/                # Documentation & build output
├── test/                # E2E tests (Playwright)
├── tools/               # Build & generation scripts
└── special_thanks/      # anno-calculator reference data
```

### Test Results

**E2E Test Success Rate: 97.5% (39/40 tests passing)**

- Product Display: 100% (5/5)
- Language Switching: 100% (6/6)
- Region Switching: 80% (4/5)
- Production Chain: 100% (9/9)
- Tree UI: 100% (10/10)

See [test-reports/e2e-test-results.md](test-reports/e2e-test-results.md) for details.

### Special Thanks

This project is built with maximum respect for the original [Anno Calculator](https://anno-calculator.org/) by [@agentquackyt](https://github.com/agentquackyt/Anno117Calculator). Production data and icons are sourced from the official calculator.

### License

This project is private and not yet licensed for public use.

---

## <a name="japanese"></a>日本語

### 概要

Anno 117（PS5/Steam）の生産チェーン計算機の日本語対応版。生産チェーンの可視化と最適化を支援するWebアプリケーションです。

### 主な機能

- **完全バイリンガル対応**: 日本語と英語のシームレスな切り替え
- **ツリー型商品選択**: カテゴリ別の直感的な商品選択UI
- **インタラクティブな生産チェーン**: ズーム・パン操作可能なSVGグラフ
- **Auto Ratio計算**: 生産比率の自動最適化
- **地域別生産**: Latium、Albion、Mesopotamiaの3地域対応
- **レスポンシブデザイン**: デスクトップ・モバイル対応

### 技術スタック

- **TypeScript** 5.3.3
- **Vue 3** 3.5.35
- **Vite** 8.0.16
- **Tailwind CSS**
- **Playwright** 1.60.0（E2Eテスト）
- **Bun**（ランタイム・パッケージマネージャ）

### クイックスタート

#### 前提条件

- [Bun](https://bun.sh/)（v1.0以降）
- Node.js 18以降（オプション、互換性のため）

#### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/anno_db2.git
cd anno_db2

# 依存関係をインストール
bun install
```

#### 開発

```bash
# 開発サーバー起動（Vite）
bun run dev

# http://localhost:5173 でアクセス
```

#### ビルド

```bash
# 本番環境用ビルド
bun run build:vite

# ビルドのプレビュー
bun run preview
```

#### テスト

```bash
# E2Eテスト実行
bun run test

# UIモードでテスト実行
bun run test:ui

# ブラウザ表示モードでテスト実行
bun run test:headed

# テストレポート表示
bun run test:report
```

### プロジェクト構造

```
anno_db2/
├── src/
│   ├── assets/          # 静的アセット（アイコン、データ）
│   ├── components/      # Vue 3コンポーネント
│   ├── utils/           # ユーティリティ関数
│   └── vue-app.ts       # Vueアプリ初期化
├── docs/                # ドキュメント・ビルド出力
├── test/                # E2Eテスト（Playwright）
├── tools/               # ビルド・生成スクリプト
└── special_thanks/      # anno-calculator参照データ
```

### テスト結果

**E2Eテスト成功率: 97.5%（39/40テスト成功）**

- 商品一覧表示: 100%（5/5）
- 言語切り替え: 100%（6/6）
- 地域切り替え: 80%（4/5）
- 生産チェーン: 100%（9/9）
- ツリーUI: 100%（10/10）

詳細は [test-reports/e2e-test-results.md](test-reports/e2e-test-results.md) を参照してください。

### 謝辞

本プロジェクトは、[@agentquackyt](https://github.com/agentquackyt/Anno117Calculator)氏による公式[Anno Calculator](https://anno-calculator.org/)に最大限のリスペクトを込めて作成されています。生産データとアイコンは公式計算機から提供されています。

### ライセンス

本プロジェクトはプライベートであり、現時点では公開ライセンスは付与されていません。
