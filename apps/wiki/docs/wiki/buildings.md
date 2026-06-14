<script setup lang="ts">
import { data } from './buildings.data.ts'

const regionLabels: Record<string, string> = {
  Roman: 'ローマ',
  Celtic: 'ケルト',
}

function regionText(regions: string[]): string {
  return regions.map((r) => regionLabels[r] ?? r).join(' / ')
}

function buildingCostText(cost: Record<string, number>): string {
  if (Object.keys(cost).length === 0) return '—'
  return Object.entries(cost)
    .map(([k, v]) => `${k}: ${v}`)
    .join('、')
}
</script>

# 建物一覧

Anno 117 に登場する生産建物の一覧です。建物タイプ別に生産できる商品をまとめています。
詳細な生産チェーンは[計算機](/calculator/)または[生産チェーン一覧](/wiki/production-chains)を参照してください。

<table>
<thead>
<tr><th>建物タイプ</th><th>生産できる商品</th><th>燃料</th><th>月間維持費</th><th>必要ワーカー</th></tr>
</thead>
<tbody>
<tr v-for="b in data.buildings" :key="b.type">
<td><strong>{{ b.label }}</strong></td>
<td>{{ b.goods.map(g => g.nameJa).join('、') }}</td>
<td>{{ b.needsFuel ? '必要' : '不要' }}</td>
<td>{{ b.moneyCost }}金</td>
<td>{{ b.workers.map(w => w.label + ' x' + w.count).join('、') || '—' }}</td>
</tr>
</tbody>
</table>
