<script setup lang="ts">
import { data } from './items.data.ts'

const totalItems = Object.values(data.byNiche).reduce((n, arr) => n + arr.length, 0)
</script>

# アイテム一覧

Anno 117 で使用できる全 {{ totalItems }} アイテムの一覧です。

::: tip 日本語対応状況
アイテム名・効果・対象は英語表記（公式日本語訳がないため）。レアリティ・ニッチは日本語化済み。出典: コミュニティ作成のAnno 117アイテムDB
:::

<div v-for="niche in data.niches" :key="niche">

<h2>{{ niche }}</h2>

<table>
<thead>
<tr><th>名称</th><th>レアリティ</th><th>ニッチ</th><th>効果</th><th>対象</th><th>取引価格</th><th>DLC</th></tr>
</thead>
<tbody>
<tr v-for="item in data.byNiche[niche]" :key="item.guid">
<td>{{ item.name }}</td>
<td>{{ item.rarityJa }}</td>
<td>{{ item.nicheJa }}</td>
<td>{{ item.buffs || '—' }}</td>
<td>{{ item.targets || '—' }}</td>
<td>{{ item.tradePrice || '—' }}</td>
<td>{{ item.isDlc ? 'DLC' : '' }}</td>
</tr>
</tbody>
</table>

</div>
