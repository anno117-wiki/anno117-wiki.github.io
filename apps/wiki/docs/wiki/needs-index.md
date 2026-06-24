<script setup lang="ts">
import { ref, computed } from 'vue'
import { data } from './needs-index.data.ts'

const activeCategory = ref(data.categories[0])

const filtered = computed(() =>
  data.items.filter(item =>
    item.demands.some(d => d.category === activeCategory.value)
  )
)

function regionBadge(region: string): string {
  return data.regionLabels[region] ?? region
}
</script>

# 商品需要逆引き

住民が必要とする商品を需要カテゴリ別に分類した一覧です。公式ゲームデータから抽出（{{ data.items.length }}商品）。

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
      <th>English</th>
      <th>需要地域</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in filtered" :key="item.productGuid">
      <td>{{ item.productNameJa || item.productNameEn }}</td>
      <td class="en">{{ item.productNameEn }}</td>
      <td>
        <span
          v-for="d in item.demands.filter(d => d.category === activeCategory)"
          :key="d.region"
          :class="['region-badge', d.region.replace(' ', '-').toLowerCase()]"
        >{{ regionBadge(d.region) }}</span>
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
.region-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 4px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
}
.region-badge.roman { border-color: #e85d2a; color: #e85d2a; }
.region-badge.celtic { border-color: #2a7ae8; color: #2a7ae8; }
.region-badge.roman-celtic { border-color: #6b2ae8; color: #6b2ae8; }
</style>
