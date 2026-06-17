<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from './buildings.data.ts'

const searchText = ref('')
const selectedTier = ref('')

const tiers = computed(() => {
  const seen = new Set<string>()
  return data.buildings
    .filter(b => !seen.has(b.tier) && seen.add(b.tier))
    .map(b => ({ value: b.tier, label: b.tierJa }))
})

const filtered = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  return data.buildings.filter(b => {
    const matchName = !q || (b.nameJa ?? b.nameEn).toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q)
    const matchTier = !selectedTier.value || b.tier === selectedTier.value
    return matchName && matchTier
  })
})
</script>

# 建物効果

各建物が周辺住民に与える効果の一覧です。

> 出典: [anno.land/en/anno-117-buildings](https://anno.land/en/anno-117-buildings/)
> パトリキ向け建物・ケルト建物は未収録（動的フィルターのため自動取得不可）。

<div style="display:flex;gap:8px;align-items:center;margin:16px 0;flex-wrap:wrap;">
  <input
    v-model="searchText"
    type="text"
    placeholder="建物名で検索..."
    style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);width:200px;"
  />
  <select
    v-model="selectedTier"
    style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);"
  >
    <option value="">すべてのTier</option>
    <option v-for="t in tiers" :key="t.value" :value="t.value">{{ t.label }}</option>
  </select>
  <span style="font-size:13px;color:var(--vp-c-text-2);">{{ filtered.length }} / {{ data.buildings.length }} 件</span>
</div>

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
<tr v-for="b in filtered" :key="b.id">
  <td style="white-space:nowrap;">
    <img v-if="b.icon" :src="withBase('/icons/buildings/icon_3d_' + b.icon + '.png')" :alt="b.nameJa ?? b.nameEn" style="width:32px;height:32px;vertical-align:middle;margin-right:6px;object-fit:contain;" />
    {{ b.nameJa ?? b.nameEn }}
  </td>
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
