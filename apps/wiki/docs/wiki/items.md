<script setup lang="ts">
import { data } from './items.data.ts'

const totalItems = Object.values(data.byNiche).reduce((n, arr) => n + arr.length, 0)
</script>

# アイテム一覧

Anno 117 で使用できる全 {{ totalItems }} アイテムの一覧です。

::: tip 日本語対応状況
- アイテム固有名は日本語で表示しています（ja.json `specialists` より）
- rarity・niche の日本語名は未整備のため英語表示です（後日対応予定）
:::

<div v-for="niche in data.niches" :key="niche">

<h2>{{ niche }}</h2>

<table>
<thead>
<tr><th>名称</th><th>英語名</th><th>レアリティ</th><th>生産性</th><th>対象商品</th></tr>
</thead>
<tbody>
<tr v-for="item in data.byNiche[niche]" :key="item.guid">
<td>{{ item.nameJa !== item.nameEn ? item.nameJa : '—' }}</td>
<td>{{ item.nameEn }}</td>
<td>{{ item.rarity }}</td>
<td>{{ item.productivityBonus > 0 ? '+' + item.productivityBonus + '%' : '—' }}</td>
<td>{{ item.targets.map(t => t.nameJa).join('、') || '—' }}</td>
</tr>
</tbody>
</table>

</div>
