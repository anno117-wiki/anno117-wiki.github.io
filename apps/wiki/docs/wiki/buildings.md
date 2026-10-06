---
title: 建物効果
description: Anno 117の各建物が周辺住民に与える効果を一覧表示。建物名・効果範囲・効果内容を日本語で整理。
---

<script setup>
// 建物データを含むため全体登録せず、このページでのみ読み込む(全ページ共通チャンクの肥大化防止)
import BuildingsTable from '../.vitepress/components/BuildingsTable.vue'
</script>

# 建物効果

各建物が周辺住民に与える効果の一覧です。

表の数値は、建物がはじめから持っている効果です。建物名の下に「スキル「○○」で…」とあるものは、そのスキルを取ると付近の建物に追加で付く効果で、表の数値には含めていません。

<BuildingsTable />

## 関連データ

- [住民層](/wiki/population) — 建物の効果を受ける住民層と需要
- [アイテム一覧](/wiki/items) — 専門家に装着して建物の効果を伸ばすアイテム

## 関連ガイド

- [経済・収入最適化ガイド](/guide/economy-guide) — 建物配置と税収・維持費の最適化のコツ
