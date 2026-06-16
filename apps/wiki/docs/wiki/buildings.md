<script setup lang="ts">
import { data } from './buildings.data.ts'
</script>

# 建物効果

各建物が周辺住民に与える効果の一覧です。建物名の日本語訳は準備中です。

> 出典: [anno.land/en/anno-117-buildings](https://anno.land/en/anno-117-buildings/)
> パトリキ向け建物・ケルト建物は未収録（動的フィルターのため自動取得不可）。

<table>
<thead>
<tr>
  <th>建物</th>
  <th>需要Tier</th>
  <th>維持費</th>
  <th>人口</th>
  <th>収入</th>
  <th>信仰</th>
  <th>知識</th>
  <th>名声</th>
  <th>健康度</th>
  <th>幸福</th>
  <th>防火</th>
</tr>
</thead>
<tbody>
<tr v-for="b in data.buildings" :key="b.id">
  <td>{{ b.nameJa ?? b.nameEn }}</td>
  <td>{{ b.tierJa }}</td>
  <td>{{ b.maintenance }}</td>
  <td><StatBar :n="b.population" :maxAbs="3" /></td>
  <td><StatBar :n="b.income" :maxAbs="3" /></td>
  <td><StatBar :n="b.faith" :maxAbs="6" /></td>
  <td><StatBar :n="b.knowledge" :maxAbs="7" /></td>
  <td><StatBar :n="b.prestige" :maxAbs="7" /></td>
  <td><StatBar :n="b.health" :maxAbs="3" /></td>
  <td><StatBar :n="b.happiness" :maxAbs="3" /></td>
  <td><StatBar :n="b.fireSafety" :maxAbs="3" /></td>
</tr>
</tbody>
</table>
