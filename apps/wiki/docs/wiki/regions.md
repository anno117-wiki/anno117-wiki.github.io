---
title: 地域別商品
description: Anno 117のラティウム・アルビオン・アイギュプト地域別に、固有商品と複数地域で作れる商品を一覧表示。ガルムはラティウム、ウナギはアルビオン、カフクやシストラムはアイギュプトなど、どこで何を作れるかを確認できる。
---

<script setup lang="ts">
import { data } from './regions.data.ts'

const categoryLabel: Record<string, string> = {
  food: '食料',
  construction: '建設資材',
  fashion: 'ファッション',
  culture: '文化',
  household: '家庭',
  intermediate: '中間財',
  resource: '原材料',
}
</script>

# 地域別商品

<p v-if="!data.hasEgyptian">Anno 117 には <strong>ラティウム地域</strong> と <strong>アルビオン地域</strong> の2つの地域があり、生産できる商品が異なります。</p>
<p v-else>Anno 117 には <strong>ラティウム地域</strong>・<strong>アルビオン地域</strong>・<strong>アイギュプト地域</strong>（DLC03）の3つの地域があり、生産できる商品が異なります。</p>

各商品の詳細な生産チェーンは[計算機](/calculator/)で確認できます。アイギュプトの新商品は、計算機で地域をアイギュプトに切り替えると計算できます。[生産チェーン一覧](/wiki/production-chains)に新商品のチェーンを載せています。

## 地域サマリー

<table>
<thead><tr><th>地域</th><th>固有商品数</th><th>共通商品数</th></tr></thead>
<tbody>
<tr><td>ラティウム固有</td><td>{{ data.romanCount }}種</td><td>—</td></tr>
<tr><td>アルビオン固有</td><td>{{ data.celticCount }}種</td><td>—</td></tr>
<tr v-if="data.egyptianCount > 0"><td>アイギュプト固有</td><td>{{ data.egyptianCount }}種</td><td>—</td></tr>
<tr><td>{{ data.hasEgyptian ? '複数地域共通' : '両地域共通' }}</td><td>—</td><td>{{ data.bothCount }}種</td></tr>
</tbody>
</table>

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

<div v-if="data.egyptianCount > 0">

## アイギュプト固有商品

アイギュプト地域（DLC03）でのみ生産できる商品です。

<table>
<thead><tr><th>商品名</th><th>カテゴリ</th></tr></thead>
<tbody>
<tr v-for="good in data.egyptian" :key="good.id">
<td>{{ good.nameJa }}</td>
<td>{{ categoryLabel[good.category] ?? good.category }}</td>
</tr>
</tbody>
</table>

</div>

## 複数地域共通商品

<p v-if="!data.hasEgyptian">ラティウム・アルビオン両地域で生産できる商品です（レシピが異なる場合があります）。</p>
<p v-else>2つ以上の地域で生産できる商品です（レシピが異なる場合があります）。</p>

<table>
<thead><tr><th>商品名</th><th>カテゴリ</th><th v-if="data.hasEgyptian">生産できる地域</th></tr></thead>
<tbody>
<tr v-for="good in data.both" :key="good.id">
<td>{{ good.nameJa }}</td>
<td>{{ categoryLabel[good.category] ?? good.category }}</td>
<td v-if="data.hasEgyptian">{{ good.regionsJa }}</td>
</tr>
</tbody>
</table>

## 関連データ

- [商品一覧](/wiki/goods) — 分類ごとの全商品
- [生産チェーン一覧](/wiki/production-chains) — 各商品の生産工程と必要な素材

## 関連ガイド

- [交易・交易ルートガイド](/guide/trade-guide) — 地域間の交易ルート設定と運用のコツ
