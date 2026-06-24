<script setup lang="ts">
import { withBase } from 'vitepress'
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

function timeText(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}分` : `${m}分${s}秒`
}
</script>

# 生産チェーン一覧

各商品の生産に必要な建物・素材・時間をまとめています。
詳細な生産チェーンの計算は[計算機](/calculator/)をご利用ください。

<div v-for="cat in data.categories" :key="cat">

<h2>{{ categoryLabels[cat] ?? cat }}</h2>

<table>
<thead>
<tr><th>商品名</th><th>対応地域</th><th>生産時間</th><th>直接素材</th><th></th></tr>
</thead>
<tbody>
<tr v-for="entry in data.byCategory[cat]" :key="entry.id">
<td>{{ entry.nameJa }}</td>
<td>{{ regionText(entry.regions) }}</td>
<td>{{ timeText(entry.timeSeconds) }}</td>
<td>
  {{ entry.inputs.join('、') || '—' }}
  <ProductionMermaid v-if="entry.mermaidDef" :definition="entry.mermaidDef" />
</td>
<td><a :href="withBase(`/calculator/?good=${entry.id}`)" target="_blank" rel="noopener noreferrer">計算</a></td>
</tr>
</tbody>
</table>

</div>
