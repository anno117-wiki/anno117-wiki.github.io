<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { withBase, useData } from 'vitepress'
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

const effectLabels: Record<string, string> = {
  population: '人口',
  income: '収入',
  faith: '信仰',
  knowledge: '知識',
  prestige: '名声',
  health: '健康度',
  happiness: '幸福',
  fireSafety: '防火',
  gymnasiarchWorkforce: 'ギムナシアリコスの労働力',
}

// 例: { prestige: 1, happiness: 1 } -> 「名声+1・幸福+1」
function formatEffects(effects: Record<string, number>): string {
  return Object.entries(effects)
    .map(([key, n]) => `${effectLabels[key] ?? key}${n > 0 ? '+' : ''}${n}`)
    .join('・')
}

// モバイルでは、建物名の下のスキル効果の説明が長く行が縦に伸びるので、折りたたんでタップで開く
const isMobile = ref(false)
const openRows = ref<Set<string>>(new Set())

function toggleRow(id: string) {
  const next = new Set(openRows.value)
  if (!next.delete(id)) next.add(id)
  openRows.value = next
}

onMounted(() => {
  try {
    const mq = window.matchMedia('(max-width: 959px)')
    isMobile.value = mq.matches
    mq.addEventListener('change', (e) => { isMobile.value = e.matches })
  } catch {
    // matchMedia が使えない環境では、常に全て表示する
  }
})

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
    sortDir.value = key === 'tier' ? 1 : -1
  }
}

// スマホのカード表示では見出しをタップできないので、並べ替えはメニューで選ぶ
const SORT_OPTIONS = [
  { value: 'population', label: '人口' },
  { value: 'income', label: '収入' },
  { value: 'faith', label: '信仰' },
  { value: 'knowledge', label: '知識' },
  { value: 'prestige', label: '名声' },
  { value: 'health', label: '健康度' },
  { value: 'happiness', label: '幸福' },
  { value: 'fireSafety', label: '防火' },
  { value: 'tier', label: '需要Tier' },
]

function setSort(key: string) {
  sortKey.value = key
  sortDir.value = key === 'tier' ? 1 : -1 // 効果は大きい順、層は低い順
}

// カード表示用: 値が0でない効果だけを「人口+1・収入+2」の形にする
const CARD_EFFECT_KEYS = ['population', 'income', 'faith', 'knowledge', 'prestige', 'health', 'happiness', 'fireSafety']

function cardEffects(b: Record<string, unknown>): string {
  const effects: Record<string, number> = {}
  for (const key of CARD_EFFECT_KEYS) {
    const n = b[key]
    if (typeof n === 'number' && n !== 0) effects[key] = n
  }
  return Object.keys(effects).length ? formatEffects(effects) : '—'
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

// 絞り込みの並び: ラティウム -> アルビオン -> アイギュプト（各地域の中は住民層の低い順）。
// ここに無い層は最後に、データに出た順で並べる
const TIER_ORDER = [
  'libertus', 'plebeian', 'equites', 'patrician', // ラティウム
  'wader', 'smith', 'alderman', 'mercators', 'nobles', // アルビオン
  'thresher', 'potter', 'priestess', 'scribe', 'gymnasiarch', // アイギュプト
  'none',
]

const tiers = computed(() => {
  const labels = new Map<string, string>()
  for (const b of data.buildings) {
    for (const t of [{ tier: b.tier, tierJa: b.tierJa }, ...(b.extraTiers ?? [])]) {
      if (!labels.has(t.tier)) labels.set(t.tier, t.tierJa)
    }
  }
  const rank = (k: string) => { const i = TIER_ORDER.indexOf(k); return i < 0 ? TIER_ORDER.length : i }
  return [...labels]
    .map(([value, label], i) => ({ value, label, i }))
    .sort((a, b) => rank(a.value) - rank(b.value) || a.i - b.i)
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
    const matchTier = !selectedTier.value || b.tier === selectedTier.value || (b.extraTiers ?? []).some(t => t.tier === selectedTier.value)
    const matchCategory = !selectedCategory.value || b.category === selectedCategory.value
    return matchName && matchTier && matchCategory
  })
})

// 層での並べ替え用: 併記の層のうち最も早い順位
function tierRank(b: { tier: string; extraTiers?: { tier: string }[] }): number {
  const rank = (k: string) => { const i = TIER_ORDER.indexOf(k); return i < 0 ? TIER_ORDER.length : i }
  return Math.min(rank(b.tier), ...(b.extraTiers ?? []).map(t => rank(t.tier)))
}

const sortedFiltered = computed(() => {
  const key = sortKey.value
  if (!key) return filtered.value
  const dir = sortDir.value
  return [...filtered.value].sort((a, b) => {
    const av = key === 'tier' ? tierRank(a) : (a as any)[key] ?? 0
    const bv = key === 'tier' ? tierRank(b) : (b as any)[key] ?? 0
    return (av - bv) * dir
  })
})

// SPA遷移直後はテーブルがまだ描画されておらずアンカーへスクロールできないため、
// 描画完了後に改めて該当行までスクロールする。
const { hash } = useData()

function scrollToHash() {
  const target = decodeURIComponent(hash.value || '').replace(/^#/, '')
  if (!target) return
  // VitePress自身のページ遷移スクロール処理(nextTick内)と競合するため、
  // それより後に実行されるよう遅延させて上書きする。
  setTimeout(() => {
    document.getElementById(target)?.scrollIntoView({ block: 'center' })
  }, 100)
}

onMounted(scrollToHash)
watch(hash, scrollToHash)
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
    <select
      class="bt-sort-mobile"
      :value="sortKey"
      aria-label="並べ替え"
      @change="setSort(($event.target as HTMLSelectElement).value)"
      style="padding:6px 10px;border:1px solid var(--vp-c-divider);border-radius:6px;font-size:14px;background:var(--vp-c-bg);color:var(--vp-c-text-1);"
    >
      <option value="">並べ替えなし</option>
      <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}{{ o.value === 'tier' ? 'の低い順' : 'の大きい順' }}</option>
    </select>
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
          <th @click="toggleSort('population')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">人口 {{ sortArrow('population') }}</th>
          <th @click="toggleSort('income')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">収入 {{ sortArrow('income') }}</th>
          <th @click="toggleSort('faith')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">信仰 {{ sortArrow('faith') }}</th>
          <th @click="toggleSort('knowledge')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">知識 {{ sortArrow('knowledge') }}</th>
          <th @click="toggleSort('prestige')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">名声 {{ sortArrow('prestige') }}</th>
          <th @click="toggleSort('health')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">健康度 {{ sortArrow('health') }}</th>
          <th @click="toggleSort('happiness')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">幸福 {{ sortArrow('happiness') }}</th>
          <th @click="toggleSort('fireSafety')" style="cursor:pointer;white-space:nowrap;padding:8px 4px;">防火 {{ sortArrow('fireSafety') }}</th>
          <th @click="toggleSort('tier')" style="cursor:pointer;white-space:nowrap;">需要Tier {{ sortArrow('tier') }}</th>
          <th>維持費</th>
          <th style="white-space:nowrap;padding:8px 4px;">関連アイテム</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in sortedFiltered" :key="b.id" :id="isMobile ? undefined : b.id">
          <td style="white-space:normal;">
            <div class="building-name-cell" style="max-width:140px;word-break:break-all;">
              <img v-if="b.icon" :src="withBase('/icons/buildings-thumb/icon_3d_' + b.icon + '.webp')" :alt="b.nameJa ?? b.nameEn" width="28" height="28" loading="lazy" style="width:28px;height:28px;vertical-align:middle;margin-right:4px;object-fit:contain;" />
              {{ b.nameJa ?? b.nameEn }}
              <button
                v-if="isMobile && b.skillBonuses?.length"
                type="button"
                class="building-skill-toggle"
                :aria-expanded="openRows.has(b.id)"
                @click="toggleRow(b.id)"
              >スキル{{ b.skillBonuses.length }}件 {{ openRows.has(b.id) ? '▲' : '▼' }}</button>
              <template v-if="!isMobile || openRows.has(b.id)">
                <div v-for="s in b.skillBonuses" :key="s.skill" class="building-skill-bonus">
                  スキル「{{ s.skill }}」で{{ formatEffects(s.effects) }}<span v-if="s.unverified">（ゲーム内データの値。実機では未確認です）</span>
                </div>
              </template>
            </div>
          </td>
          <td style="padding:8px 4px;"><StatBar :n="b.population" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.income" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.faith" :maxAbs="6" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.knowledge" :maxAbs="7" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.prestige" :maxAbs="7" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.health" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.happiness" :maxAbs="3" /></td>
          <td style="padding:8px 4px;"><StatBar :n="b.fireSafety" :maxAbs="3" /></td>
          <td class="building-tier-cell"><div v-for="t in [b.tierJa, ...(b.extraTiers ?? []).map(t => t.tierJa)]" :key="t">{{ t }}</div></td>
          <td>{{ b.maintenance }}</td>
          <td style="padding:8px 4px;text-align:center;">
            <a v-if="b.itemCount" :href="withBase(`/wiki/items.html?target=${encodeURIComponent(b.nameJa ?? '')}&exact=1`)" class="calc-link-btn">{{ b.itemCount }}件</a>
            <span v-else>—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- スマホ: 1建物を1枚のカードにする（横スクロールさせない。値が0の効果は省く） -->
  <div class="bt-cards">
    <div v-for="b in sortedFiltered" :key="b.id" :id="isMobile ? b.id : undefined" class="bt-card">
      <div class="bt-card-header">
        <img v-if="b.icon" :src="withBase('/icons/buildings-thumb/icon_3d_' + b.icon + '.webp')" alt="" width="28" height="28" loading="lazy" class="bt-card-icon" />
        <div>
          <strong>{{ b.nameJa ?? b.nameEn }}</strong>
          <div class="bt-sub">{{ [b.tierJa, ...(b.extraTiers ?? []).map(t => t.tierJa)].join('・') }}</div>
        </div>
      </div>
      <dl class="bt-card-body">
        <div><dt>効果</dt><dd>{{ cardEffects(b) }}</dd></div>
        <div><dt>維持費</dt><dd>{{ b.maintenance }}</dd></div>
        <div v-if="b.itemCount"><dt>関連アイテム</dt><dd><a :href="withBase(`/wiki/items.html?target=${encodeURIComponent(b.nameJa ?? '')}&exact=1`)" class="calc-link-btn">{{ b.itemCount }}件</a></dd></div>
        <div v-if="b.skillBonuses?.length">
          <dt>スキル</dt>
          <dd>
            <button
              type="button"
              class="building-skill-toggle"
              :aria-expanded="openRows.has(b.id)"
              @click="toggleRow(b.id)"
            >{{ b.skillBonuses.length }}件 {{ openRows.has(b.id) ? '▲' : '▼' }}</button>
            <template v-if="openRows.has(b.id)">
              <div v-for="s in b.skillBonuses" :key="s.skill" class="building-skill-bonus">
                スキル「{{ s.skill }}」で{{ formatEffects(s.effects) }}<span v-if="s.unverified">（ゲーム内データの値。実機では未確認です）</span>
              </div>
            </template>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.bt-cards,
.bt-sort-mobile {
  display: none;
}

/* 959px は custom.css のモバイル判定と同じ。PCは従来の表のまま */
@media (max-width: 959px) {
  .buildings-table-wrap {
    display: none;
  }
  .bt-sort-mobile {
    display: inline-block;
  }
  .bt-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 12px 0;
  }
  .bt-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    overflow: hidden;
    scroll-margin-top: calc(var(--vp-nav-height) + var(--local-nav-height, 0px) + 8px);
  }
  .bt-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--vp-c-bg-soft);
  }
  .bt-card-icon {
    width: 28px;
    height: 28px;
    flex: none;
    object-fit: contain;
  }
  .bt-sub {
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
  }
  .bt-card-body {
    margin: 0;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
  }
  .bt-card-body > div {
    display: flex;
    gap: 8px;
  }
  .bt-card-body dt {
    flex: none;
    width: 6.5em;
    color: var(--vp-c-text-2);
  }
  .bt-card-body dd {
    margin: 0;
    min-width: 0;
  }
}
</style>
