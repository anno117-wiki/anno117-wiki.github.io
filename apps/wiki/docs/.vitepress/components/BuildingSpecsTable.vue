<template>
  <div>
    <FilterBar class="bs-filters" :active-count="activeFilterCount">
      <template #main>
        <label><strong>建物名:</strong>
          <input type="text" v-model="selName" placeholder="建物名で検索" />
        </label>
      </template>
      <template #count>{{ filtered.length }} 件</template>
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
      <button type="button" class="bs-reset" @click="resetFilters">リセット</button>
    </FilterBar>

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
            <td>
              <div class="bs-name">
                <img v-if="b.icon" :src="iconSrc(b)" alt="" width="28" height="28" loading="lazy" class="bs-icon" />
                <div><strong>{{ b.name }}</strong><br /><span class="bs-sub">{{ b.category }}</span></div>
              </div>
            </td>
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
          <img v-if="b.icon" :src="iconSrc(b)" alt="" width="28" height="28" loading="lazy" class="bs-icon" />
          <div class="bs-card-title">
            <strong>{{ b.name }}</strong>
            <span class="bs-sub">{{ b.category }}・{{ regionText(b) }}</span>
          </div>
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
import { withBase } from 'vitepress'
import specs from '../../wiki/building-specs-list.json'
import BuildingCostList from './BuildingCostList.vue'
import FilterBar from './FilterBar.vue'

interface Cost { name: string; amount: number }
interface Building {
  guid: string
  name: string
  icon: string
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
const PLACEMENTS = ['氾濫原限定', '川スロット', '山スロット']

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

/** 建物名の検索欄以外で、条件を指定している欄の数（スマホの［絞り込み］に出す） */
const activeFilterCount = computed(() => [selRegion.value, selCategory.value, selPlacement.value].filter(Boolean).length)

function resetFilters(): void {
  selName.value = ''
  selRegion.value = ''
  selCategory.value = ''
  selPlacement.value = ''
}

// 建物のアイコン(表示用の小さい WebP)。生産施設は、ゲームでも生産品のアイコンを使っている
function iconSrc(b: Building): string {
  return withBase(`/icons/buildings-thumb/icon_3d_${b.icon}.webp`)
}
function sizeText(b: Building): string {
  return `${b.width}×${b.height}`
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

.bs-sub {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.bs-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bs-name > div {
  min-width: 9em;
}
.bs-icon {
  flex: none;
  width: 28px;
  height: 28px;
  object-fit: contain;
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
  .bs-filters .filter-bar-more label,
  .bs-filters .filter-bar-more select {
    width: 100%;
  }
  /* 1行に縮めた欄では、検索欄の見出し（建物名:）を横に並べる */
  .bs-filters .filter-bar-main label {
    flex-direction: row;
    align-items: center;
  }
  .bs-filters .filter-bar-main input[type="text"] {
    min-width: 0;
  }
  .bs-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    overflow: hidden;
  }
  .bs-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--vp-c-bg-soft);
  }
  .bs-card-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
