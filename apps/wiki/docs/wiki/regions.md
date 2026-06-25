<script setup lang="ts">
import { data } from './regions.data.ts'

const categoryLabel: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
  intermediate: '中間品',
  resource: '原材料',
}
</script>

# 地域別商品

Anno 117 には **ラティウム地域** と **アルビオン地域** の2つの地域があり、生産できる商品が異なります。
各商品の詳細な生産チェーンは[計算機](/calculator/)で確認できます。

## 地域サマリー

| 地域 | 固有商品数 | 共通商品数 |
|------|-----------|-----------|
| ラティウム固有 | {{ data.romanCount }}種 | — |
| アルビオン固有 | {{ data.celticCount }}種 | — |
| 両地域共通 | — | {{ data.bothCount }}種 |

## ラティウム固有商品

ラティウム地域でのみ生産できる商品です。

<table>
<thead><tr><th>商品名</th><th>カテゴリ</th></tr></thead>
<tbody>
<tr v-for="good in data.roman" :key="good.id">
<td>{{ good.nameJa }}</td>
<td>{{ categoryLabel[good.category] ?? good.category }}</td>
</tr>
</tbody>
</table>

## アルビオン固有商品

アルビオン地域でのみ生産できる商品です。

<table>
<thead><tr><th>商品名</th><th>カテゴリ</th></tr></thead>
<tbody>
<tr v-for="good in data.celtic" :key="good.id">
<td>{{ good.nameJa }}</td>
<td>{{ categoryLabel[good.category] ?? good.category }}</td>
</tr>
</tbody>
</table>

## 両地域共通商品

ラティウム・アルビオン両地域で生産できる商品です（レシピが異なる場合があります）。

<table>
<thead><tr><th>商品名</th><th>カテゴリ</th></tr></thead>
<tbody>
<tr v-for="good in data.both" :key="good.id">
<td>{{ good.nameJa }}</td>
<td>{{ categoryLabel[good.category] ?? good.category }}</td>
</tr>
</tbody>
</table>
