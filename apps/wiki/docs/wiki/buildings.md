<script setup lang="ts">
import { data } from './buildings.data.ts'

function costText(cost: Record<string, number> | null): string {
  if (!cost) return '—'
  return Object.entries(cost)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' / ')
}
</script>

# 建物一覧

生産チェーンで使用される建物の一覧です。建物名の日本語訳は準備中です。

<table>
<thead>
<tr><th>建物（英語名）</th><th>生産品</th><th>建設コスト（ローマ）</th><th>建設コスト（ケルト）</th><th>維持費（ローマ）</th><th>維持費（ケルト）</th></tr>
</thead>
<tbody>
<tr v-for="b in data.buildings" :key="b.type">
<td>{{ b.nameEn }}</td>
<td>{{ b.goods.join('、') }}</td>
<td>{{ costText(b.romanCost) }}</td>
<td>{{ costText(b.celticCost) }}</td>
<td>{{ costText(b.romanMaintenance) }}</td>
<td>{{ costText(b.celticMaintenance) }}</td>
</tr>
</tbody>
</table>
