<script setup lang="ts">
import { data } from './production-chains.data.ts'

const categoryLabels: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
}

const regionLabels: Record<string, string> = {
  Roman: 'ローマ',
  Celtic: 'ケルト',
}

const buildingLabels: Record<string, string> = {
  armoury: '武器庫',
  artisanal_studio: '工芸スタジオ',
  clothier: '仕立て屋',
  fishery: '漁場',
  gatherer: '採取場',
  kitchen: '台所',
  livestock_farm: '畜産農場',
  refinery: '精製所',
  upholsterer: '家具工房',
  victualler: '食料商',
  workshop: '工房',
}

function regionText(regions: string[]): string {
  return regions.map((r) => regionLabels[r] ?? r).join(' / ')
}

function buildingText(type: string): string {
  return buildingLabels[type] ?? type
}
</script>

# 生産チェーン一覧

各商品の生産に必要な建物・素材・時間をまとめています。
詳細な生産チェーンの計算は[計算機](/calculator/)をご利用ください。

<div v-for="cat in data.categories" :key="cat">

<h2>{{ categoryLabels[cat] ?? cat }}</h2>

<table>
<thead>
<tr><th>商品名</th><th>英語名</th><th>対応地域</th><th>建物タイプ</th><th>生産時間</th><th>直接素材</th></tr>
</thead>
<tbody>
<tr v-for="entry in data.byCategory[cat]" :key="entry.id">
<td>{{ entry.nameJa }}</td>
<td>{{ entry.nameEn }}</td>
<td>{{ regionText(entry.regions) }}</td>
<td>{{ buildingText(entry.buildingType) }}</td>
<td>{{ entry.timeSeconds }}秒</td>
<td>{{ entry.inputs.join('、') || '—' }}</td>
</tr>
</tbody>
</table>

</div>
