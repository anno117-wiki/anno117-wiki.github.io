<script setup lang="ts">
import { ref, computed } from 'vue'
import { data } from './needs-index.data.ts'

const activeCategory = ref(data.categories[0])

const filtered = computed(() =>
  data.items.filter(item =>
    item.demands.some(d => d.category === activeCategory.value)
  )
)

function tierName(tier: string, region: string): string {
  return (data.tierLabels[region] ?? {})[tier] ?? tier
}

const TIER_CSS: Record<string, string> = {
  libertus:  'tier-lib',
  plebeian:  'tier-ple',
  equites:   'tier-equ',
  patrician: 'tier-pat',
}
</script>

# 生産品需要逆引き

住民が必要とする生産品を需要カテゴリ別に分類した一覧です。公式ゲームデータから抽出（{{ data.items.length }}件）。

<div class="cat-tabs">
  <button
    v-for="c in data.categories"
    :key="c"
    :class="['tab-btn', { active: activeCategory === c }]"
    @click="activeCategory = c"
  >{{ data.categoryLabels[c] ?? c }}</button>
</div>

<table v-if="filtered.length" class="needs-table">
  <thead>
    <tr>
      <th>商品名</th>
      <th>需要住民層</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in filtered" :key="item.productGuid">
      <td>{{ item.productNameJa || item.productNameEn }}</td>
      <td>
        <span
          v-for="t in item.tiers"
          :key="t.region + t.tier"
          :class="['tier-badge', TIER_CSS[t.tier] ?? '']"
        >{{ tierName(t.tier, t.region) }}</span>
      </td>
    </tr>
  </tbody>
</table>

<style scoped>
.cat-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 6px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.tab-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
.needs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.needs-table th,
.needs-table td {
  border: 1px solid var(--vp-c-divider);
  padding: 6px 10px;
  text-align: left;
}
.needs-table th {
  background: var(--vp-c-bg-soft);
  font-weight: bold;
}
.needs-table tr:nth-child(even) td {
  background: var(--vp-c-bg-soft);
}
.en {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}
.tier-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  margin-right: 4px;
  margin-bottom: 2px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
}
.tier-lib { border-color: #6b7280; color: #6b7280; }
.tier-ple { border-color: #2563eb; color: #2563eb; }
.tier-equ { border-color: #d97706; color: #d97706; }
.tier-pat { border-color: #9333ea; color: #9333ea; }
.dark .tier-lib { border-color: #9ca3af; color: #9ca3af; }
.dark .tier-ple { border-color: #60a5fa; color: #60a5fa; }
.dark .tier-equ { border-color: #fbbf24; color: #fbbf24; }
.dark .tier-pat { border-color: #c084fc; color: #c084fc; }
</style>
