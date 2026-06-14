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

function regionText(regions: string[]): string {
  return regions.map((r) => regionLabels[r] ?? r).join(' / ')
}
</script>

# 生産チェーン一覧

各商品の生産に必要な建物・素材・時間をまとめています。
詳細な生産チェーンの計算は[計算機](/calculator/)をご利用ください。

<div v-for="cat in data.categories" :key="cat">

<h2>{{ categoryLabels[cat] ?? cat }}</h2>

<table>
<thead>
<tr><th>商品名</th><th>英語名</th><th>対応地域</th><th>生産時間</th><th>直接素材</th></tr>
</thead>
<tbody>
<tr v-for="entry in data.byCategory[cat]" :key="entry.id">
<td>{{ entry.nameJa }}</td>
<td>{{ entry.nameEn }}</td>
<td>{{ regionText(entry.regions) }}</td>
<td>{{ entry.timeSeconds }}秒</td>
<td>{{ entry.inputs.join('、') || '—' }}</td>
</tr>
</tbody>
</table>

</div>
