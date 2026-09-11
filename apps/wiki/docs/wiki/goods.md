---
title: 商品一覧
description: Anno 117の全商品を食料・建設・ファッション・文化・中間品・原材料の6分類で一覧表示。公式データ準拠の日本語商品名と地域情報を掲載。
---

<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from './goods.data.ts'

const categoryLabels: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
  intermediate: '中間品',
  resource: '原材料',
}

const regionLabels: Record<string, string> = {
  Roman: 'ラティウム',
  Celtic: 'アルビオン',
}

function regionText(regions: string[]): string {
  if (!regions || regions.length === 0) return '—'
  return regions.map((r) => regionLabels[r] ?? r).join(' / ')
}
</script>

# 商品一覧

Anno 117 で生産・消費される全 {{ data.categories.reduce((n, c) => n + data.byCategory[c].length, 0) }} 商品の一覧です。
個別の生産チェーンと必要量の計算は[計算機](/calculator/)をご利用ください。

<div v-for="cat in data.categories" :key="cat">

<h2>{{ categoryLabels[cat] ?? cat }}</h2>

<table>
<thead>
<tr><th>商品名</th><th>対応地域</th><th>計算機</th></tr>
</thead>
<tbody>
<tr :id="good.id" v-for="good in data.byCategory[cat]" :key="good.id">
<td style="white-space:nowrap;">
  <img v-if="good.icon" :src="withBase('/icons/goods/' + good.icon + '.png')" :alt="good.nameJa" style="width:28px;height:28px;vertical-align:middle;margin-right:6px;object-fit:contain;" />
  {{ good.nameJa }}
</td>
<td>{{ regionText(good.regions) }}</td>
<td>
  <a v-if="cat !== 'intermediate' && cat !== 'resource'" class="calc-link-btn" :href="withBase(`/calculator/?good=${good.id}`)" target="_blank" rel="noopener noreferrer">開く</a>
  <span v-else>—</span>
</td>
</tr>
</tbody>
</table>

</div>

## 関連ガイド

- [序盤攻略・基本戦略](/guide/early-game-strategy) — 建設順・木材チェーン・住民需要の基本
- [経済・収入最適化ガイド](/guide/economy-guide) — 税収・維持費・交易での利益
