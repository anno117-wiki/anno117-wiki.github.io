<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../wiki/buildings.data.ts'

const tableWrap = ref<HTMLElement | null>(null)
const isPanning = ref(false)

const PAN_THRESHOLD = 5

interface PanState { pointerId: number; startX: number; scrollLeft: number }
let _panState: PanState | null = null

function onTablePointerdown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const el = tableWrap.value
  if (!el) return
  _panState = { pointerId: e.pointerId, startX: e.clientX, scrollLeft: el.scrollLeft }
}

function onTablePointermove(e: PointerEvent) {
  if (!_panState || _panState.pointerId !== e.pointerId) return
  const el = tableWrap.value
  if (!el) return
  const dx = e.clientX - _panState.startX
  if (!isPanning.value) {
    if (Math.abs(dx) < PAN_THRESHOLD) return
    el.setPointerCapture(e.pointerId)
    isPanning.value = true
  }
  el.scrollLeft = _panState.scrollLeft - dx
}

function onTablePointerup(e: PointerEvent) {
  if (_panState && _panState.pointerId === e.pointerId) {
    _panState = null
    isPanning.value = false
  }
}

const categoryLabels: Record<string, string> = {
  public: '公共施設',
  wonder: '驚異',
  harbour: '港湾',
  military: '軍事',
  institution: '施設',
  shrine: '祭壇',
  base: '住居',
  production: '生産施設',
}

const searchText = ref('')
const selectedTier = ref('')
const selectedCategory = ref('')
const sortKey = ref('')
const sortDir = ref<1 | -1>(1)

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 1 ? -1 : 1
  } else {
    sortKey.value = key
    sortDir.value = -1
  }
}

function resetFilters() {
  searchText.value = ''
  selectedTier.value = ''
  selectedCategory.value = ''
  sortKey.value = ''
  sortDir.value = 1
}

function sortArrow(key: string) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 1 ? '↑' : '↓'
}

const tiers = computed(() => {
  const seen = new Set<string>()
  return data.buildings
    .filter(b => !seen.has(b.tier) && seen.add(b.tier))
    .map(b => ({ value: b.tier, label: b.tierJa }))
})

const categories = computed(() => {
  const seen = new Set<string>()
  return data.buildings
    .filter(b => !seen.has(b.category) && seen.add(b.category))
    .map(b => ({ value: b.category, label: categoryLabels[b.category] ?? b.category }))
})

const filtered = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  return data.buildings.filter(b => {
    const matchName = !q || (b.nameJa ?? b.nameEn).toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q)
    const matchTier = !selectedTier.value || b.tier === selectedTier.value
    const matchCategory = !selectedCategory.value || b.category === selectedCategory.value
    return matchName && matchTier && matchCategory
  })
})

const sortedFiltered = computed(() => {
  const key = sortKey.value
  if (!key) return filtered.value
  const dir = sortDir.value
  return [...filtered.value].sort((a, b) => {
    const av = (a as any)[key] ?? 0
    const bv = (b as any)[key] ?? 0
    return (av - bv) * dir
  })
})
</script>

<template>
  <div class="buildings-filter-bar" style="display:flex;gap:8px;align-items:center;margin:16px 0;flex-wrap:wrap;">
    <input
      v-model="searchText"
      type="text"
      placeholder="建物名で検索..."
      style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);width:200px;"
    />
    <select
      v-model="selectedCategory"
      style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);"
    >
      <option value="">すべてのカテゴリー</option>
      <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
    </select>
    <select
      v-model="selectedTier"
      style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);"
    >
      <option value="">すべてのTier</option>
      <option v-for="t in tiers" :key="t.value" :value="t.value">{{ t.label }}</option>
    </select>
    <button @click="resetFilters()" style="padding:6px 12px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);cursor:pointer;">リセット</button>
    <span style="font-size:13px;color:var(--vp-c-text-2);">{{ sortedFiltered.length }} / {{ data.buildings.length }} 件</span>
  </div>

  <div
    class="buildings-table-wrap"
    :class="{ 'is-panning': isPanning }"
    ref="tableWrap"
    @pointerdown="onTablePointerdown"
    @pointermove="onTablePointermove"
    @pointerup="onTablePointerup"
    @pointercancel="onTablePointerup"
  >
    <table>
      <thead>
        <tr>
          <th>建物</th>
          <th>需要Tier</th>
          <th>維持費</th>
          <th @click="toggleSort('population')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">人口 {{ sortArrow('population') }}</th>
          <th @click="toggleSort('income')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">収入 {{ sortArrow('income') }}</th>
          <th @click="toggleSort('faith')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">信仰 {{ sortArrow('faith') }}</th>
          <th @click="toggleSort('knowledge')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">知識 {{ sortArrow('knowledge') }}</th>
          <th @click="toggleSort('prestige')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">名声 {{ sortArrow('prestige') }}</th>
          <th @click="toggleSort('health')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">健康度 {{ sortArrow('health') }}</th>
          <th @click="toggleSort('happiness')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">幸福 {{ sortArrow('happiness') }}</th>
          <th @click="toggleSort('fireSafety')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">防火 {{ sortArrow('fireSafety') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in sortedFiltered" :key="b.id">
          <td style="white-space:normal;">
            <div style="max-width:140px;word-break:break-all;">
              <img v-if="b.icon" :src="withBase('/icons/buildings/icon_3d_' + b.icon + '.png')" :alt="b.nameJa ?? b.nameEn" style="width:28px;height:28px;vertical-align:middle;margin-right:4px;object-fit:contain;" />
              {{ b.nameJa ?? b.nameEn }}
            </div>
          </td>
          <td>{{ b.tierJa }}</td>
          <td>{{ b.maintenance }}</td>
          <td style="padding:8px 4px;"><StatBar :n="b.population" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.income" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.faith" :maxAbs="6" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.knowledge" :maxAbs="7" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.prestige" :maxAbs="7" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.health" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.happiness" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.fireSafety" :maxAbs="3" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
