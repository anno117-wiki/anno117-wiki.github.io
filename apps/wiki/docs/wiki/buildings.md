<script setup lang="ts">
import { data } from './buildings.data.ts'

function val(n: number): string {
  if (n === 0) return '—'
  return n > 0 ? `+${n}` : `${n}`
}
</script>

# 建物効果

各建物が周辺住民に与える効果の一覧です。建物名の日本語訳は準備中です。

> 出典: [anno.land/en/anno-117-buildings](https://anno.land/en/anno-117-buildings/)
> パトリキ向け建物・ケルト建物は未収録（動的フィルターのため自動取得不可）。

<table>
<thead>
<tr>
  <th>建物（英語名）</th>
  <th>需要Tier</th>
  <th>維持費</th>
  <th>人口</th>
  <th>収入</th>
  <th>信仰</th>
  <th>知識</th>
  <th>名声</th>
  <th>健康度</th>
  <th>幸福</th>
  <th>火災安全度</th>
</tr>
</thead>
<tbody>
<tr v-for="b in data.buildings" :key="b.id">
  <td>{{ b.nameJa ?? b.nameEn }}</td>
  <td>{{ b.tierJa }}</td>
  <td>{{ b.maintenance }}</td>
  <td>{{ val(b.population) }}</td>
  <td>{{ val(b.income) }}</td>
  <td>{{ val(b.faith) }}</td>
  <td>{{ val(b.knowledge) }}</td>
  <td>{{ val(b.prestige) }}</td>
  <td>{{ val(b.health) }}</td>
  <td>{{ val(b.happiness) }}</td>
  <td>{{ val(b.fireSafety) }}</td>
</tr>
</tbody>
</table>
