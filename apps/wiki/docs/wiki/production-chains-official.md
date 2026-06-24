<script setup lang="ts">
import { ref } from 'vue'
import { data } from './production-chains-official.data.ts'

const activeRegion = ref(data.regions[0])
</script>

# 公式生産チェーン一覧

公式ゲームデータから抽出した全 {{ data.regions.reduce((n, r) => n + data.byRegion[r].length, 0) }} 件の生産チェーン一覧です。

<div class="region-tabs">
  <button
    v-for="r in data.regions"
    :key="r"
    :class="['tab-btn', { active: activeRegion === r }]"
    @click="activeRegion = r"
  >{{ data.regionLabels[r] ?? r }}（{{ data.byRegion[r].length }}件）</button>
</div>

<table v-if="data.byRegion[activeRegion]" class="chains-table">
  <thead>
    <tr>
      <th>商品名</th>
      <th>English</th>
      <th>生産建物</th>
      <th>Building</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="c in data.byRegion[activeRegion]" :key="c.guid">
      <td>{{ c.nameJa || c.nameEn }}</td>
      <td class="en">{{ c.nameEn }}</td>
      <td>{{ c.buildingNameJa || c.buildingNameEn }}</td>
      <td class="en">{{ c.buildingNameEn }}</td>
    </tr>
  </tbody>
</table>

<style scoped>
.region-tabs {
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
.chains-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.chains-table th,
.chains-table td {
  border: 1px solid var(--vp-c-divider);
  padding: 6px 10px;
  text-align: left;
}
.chains-table th {
  background: var(--vp-c-bg-soft);
  font-weight: bold;
}
.chains-table tr:nth-child(even) td {
  background: var(--vp-c-bg-soft);
}
.en {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}
</style>
