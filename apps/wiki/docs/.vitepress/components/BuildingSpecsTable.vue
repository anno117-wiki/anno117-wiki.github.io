<template>
  <div>
    <div class="bs-filters">
      <label><strong>建物名:</strong>
        <input type="text" v-model="selName" placeholder="建物名で検索" />
      </label>
      <label><strong>地域:</strong>
        <select v-model="selRegion">
          <option value="">すべて</option>
          <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label><strong>分類:</strong>
        <select v-model="selCategory">
          <option value="">すべて</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <label><strong>配置制限:</strong>
        <select v-model="selPlacement">
          <option value="">すべて</option>
          <option v-for="p in PLACEMENTS" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <div class="bs-filters-footer">
        <button type="button" class="bs-reset" @click="resetFilters">リセット</button>
        <span class="bs-count">{{ filtered.length }} 件</span>
      </div>
    </div>

    <div class="bs-table-wrap">
      <table>
        <thead>
          <tr>
            <th>建物</th>
            <th>地域</th>
            <th>サイズ</th>
            <th>範囲</th>
            <th>配置制限</th>
            <th>建設費</th>
            <th>維持費</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in filtered" :key="b.guid">
            <td><strong>{{ b.name }}</strong><br /><span class="bs-sub">{{ b.category }}</span></td>
            <td class="bs-nowrap"><span v-for="r in regionList(b)" :key="r" class="bs-region">{{ r }}</span></td>
            <td class="bs-nowrap">{{ sizeText(b) }}</td>
            <td class="bs-nowrap">{{ b.radius || '—' }}</td>
            <td>{{ placementText(b) }}</td>
            <td class="bs-cost"><BuildingCostList :costs="b.construction" /></td>
            <td class="bs-cost"><BuildingCostList :costs="b.maintenance" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bs-cards">
      <div v-for="b in filtered" :key="b.guid" class="bs-card">
        <div class="bs-card-header">
          <strong>{{ b.name }}</strong>
          <span class="bs-sub">{{ b.category }}・{{ regionText(b) }}</span>
        </div>
        <dl class="bs-card-body">
          <div><dt>サイズ</dt><dd>{{ sizeText(b) }}</dd></div>
          <div><dt>範囲</dt><dd>{{ b.radius || '—' }}</dd></div>
          <div><dt>配置制限</dt><dd>{{ placementText(b) }}</dd></div>
          <div><dt>建設費</dt><dd><BuildingCostList :costs="b.construction" /></dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="b.maintenance" /></dd></div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import specs from '../../wiki/building-specs-list.json'
import BuildingCostList from './BuildingCostList.vue'

interface Cost { name: string; amount: number }
interface Building {
  guid: string
  name: string
  category: string
  regions: string[]
  width: number
  height: number
  radius: string
  placement: string[]
  construction: Cost[]
  maintenance: Cost[]
}

const REGIONS = ['ラティウム', 'アルビオン', 'アイギュプト']
const PLACEMENTS = ['川スロット', '山スロット']

const buildings = specs.buildings as Building[]
const categories = specs.categories as string[]

const selName = ref('')
const selRegion = ref('')
const selCategory = ref('')
const selPlacement = ref('')

const filtered = computed(() => {
  const name = selName.value.trim()
  return buildings.filter(b =>
    (!name || b.name.includes(name)) &&
    (!selRegion.value || b.regions.includes(selRegion.value)) &&
    (!selCategory.value || b.category === selCategory.value) &&
    (!selPlacement.value || b.placement.includes(selPlacement.value)),
  )
})

function resetFilters(): void {
  selName.value = ''
  selRegion.value = ''
  selCategory.value = ''
  selPlacement.value = ''
}

function sizeText(b: Building): string {
  return `${b.width}x${b.height}`
}
function regionText(b: Building): string {
  return b.regions.length === REGIONS.length ? '全地域' : b.regions.join('・')
}
// 表では地域を縦に並べて、列の幅を抑える
function regionList(b: Building): string[] {
  return b.regions.length === REGIONS.length ? ['全地域'] : b.regions
}
function placementText(b: Building): string {
  return b.placement.length ? b.placement.join('・') : '—'
}
</script>

<style scoped>
.bs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
  margin: 16px 0;
  padding: 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}
.bs-filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.bs-filters select,
.bs-filters input[type="text"] {
  min-width: 140px;
  padding: 5px 8px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.bs-filters-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.bs-reset {
  padding: 5px 12px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
}
.bs-reset:hover {
  border-color: var(--vp-c-brand-1);
}
.bs-count {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.bs-sub {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.bs-nowrap {
  white-space: nowrap;
}
.bs-region {
  display: block;
}
.bs-table-wrap th {
  white-space: nowrap;
}
/* 費用の欄は、資材が多い建物でも列が広がりすぎないよう、幅を抑えて折り返す */
.bs-cost {
  min-width: 9em;
  max-width: 15em;
}

.bs-cards {
  display: none;
}

@media (max-width: 1119px) {
  /* 表は約800pxの幅が要るので、これより狭いときはカード表示にする */
  .bs-table-wrap {
    display: none;
  }
  .bs-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bs-filters label,
  .bs-filters select,
  .bs-filters input[type="text"] {
    width: 100%;
  }
  .bs-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    overflow: hidden;
  }
  .bs-card-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    background: var(--vp-c-bg-soft);
  }
  .bs-card-body {
    margin: 0;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
  }
  .bs-card-body div {
    display: flex;
    gap: 8px;
  }
  .bs-card-body dt {
    flex: none;
    min-width: 4.5em;
    color: var(--vp-c-text-2);
  }
  .bs-card-body dd {
    margin: 0;
  }
}
</style>
