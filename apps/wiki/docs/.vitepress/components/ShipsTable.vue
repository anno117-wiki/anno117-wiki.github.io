<template>
  <div class="sh-root">
    <h2 id="sea-ships">海の船（編成ごと）</h2>
    <p class="sh-lead">造船所の建造メニューに並ぶ、民間と軍団の6つの編成です。付いているモジュールは、地域で違います。</p>
    <div class="sh-filter">
      <label><strong>地域:</strong>
        <select v-model="selRegion">
          <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
    </div>
    <p v-if="!hasMeasured" class="sh-lead">この地域の造船所は、実機の確認がまだです。ゲームのデータからの値で、航行速度は未確認です。</p>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>編成</th>
            <th>ヒットポイント</th>
            <th>積荷スロット</th>
            <th>航行速度</th>
            <th v-if="hasRiver">川の速度</th>
            <th>設置済みのモジュール</th>
            <th>建設時間</th>
            <th>建設費</th>
            <th>維持費</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in visibleConfigs" :key="c.label">
            <td><strong>{{ c.label }}</strong><br /><span class="sh-sub">{{ c.ship }}</span></td>
            <td class="sh-num">{{ c.health }}</td>
            <td class="sh-num">{{ c.slots }}</td>
            <td class="sh-nowrap">{{ speedText(c.sail) }}</td>
            <td v-if="hasRiver" class="sh-nowrap">{{ speedText(c.river) }}</td>
            <td>{{ moduleText(c) }}</td>
            <td class="sh-nowrap">{{ c.buildMinutes }}分</td>
            <td class="sh-cost"><BuildingCostList :costs="c.cost" /></td>
            <td class="sh-cost"><BuildingCostList :costs="c.upkeep" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sh-cards">
      <div v-for="c in visibleConfigs" :key="c.label" class="sh-card">
        <div class="sh-card-header">
          <strong>{{ c.label }}</strong>
          <span class="sh-sub">{{ c.ship }}</span>
        </div>
        <dl class="sh-card-body">
          <div><dt>ヒットポイント</dt><dd>{{ c.health }}</dd></div>
          <div><dt>積荷スロット</dt><dd>{{ c.slots }}</dd></div>
          <div><dt>航行速度</dt><dd>{{ speedText(c.sail) }}</dd></div>
          <div v-if="hasRiver"><dt>川の速度</dt><dd>{{ speedText(c.river) }}</dd></div>
          <div><dt>設置済みのモジュール</dt><dd>{{ moduleText(c) }}</dd></div>
          <div><dt>建設時間</dt><dd>{{ c.buildMinutes }}分</dd></div>
          <div><dt>建設費</dt><dd><BuildingCostList :costs="c.cost" /></dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="c.upkeep" /></dd></div>
        </dl>
      </div>
    </div>

    <h2 id="nile-ships">ナイルの川船（アイギュプト）</h2>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>船</th>
            <th>ヒットポイント</th>
            <th>航行速度</th>
            <th>川の速度</th>
            <th>積荷スロット</th>
            <th>建設時間</th>
            <th>建設費</th>
            <th>維持費</th>
            <th>解放</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in riverShips" :key="s.id">
            <td><strong>{{ s.name }}</strong><br /><span class="sh-sub">{{ s.desc }}</span><template v-if="s.kind === 'sea'"><br /><span class="sh-sub">編成: {{ s.configs.join('・') }}</span></template><template v-if="s.fitted.length"><br /><span class="sh-sub">設置済みのモジュール: {{ s.fitted.join('・') }}</span></template></td>
            <td class="sh-num">{{ s.health }}</td>
            <td class="sh-nowrap">{{ speedText(s.sail) }}</td>
            <td class="sh-nowrap">{{ speedText(s.river) }}</td>
            <td class="sh-nowrap">{{ loadText(s) }}</td>
            <td class="sh-nowrap">{{ s.buildMinutes }}分</td>
            <td class="sh-cost"><BuildingCostList :costs="s.cost" /></td>
            <td class="sh-cost"><BuildingCostList :costs="s.upkeep" /></td>
            <td>{{ s.unlock ? `研究「${s.unlock}」` : '最初から' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sh-cards">
      <div v-for="s in riverShips" :key="s.id" class="sh-card">
        <div class="sh-card-header">
          <strong>{{ s.name }}</strong>
          <span class="sh-sub">{{ s.desc }}</span>
          <span v-if="s.kind === 'sea'" class="sh-sub">編成: {{ s.configs.join('・') }}</span>
          <span v-if="s.fitted.length" class="sh-sub">設置済みのモジュール: {{ s.fitted.join('・') }}</span>
        </div>
        <dl class="sh-card-body">
          <div><dt>ヒットポイント</dt><dd>{{ s.health }}</dd></div>
          <div><dt>航行速度</dt><dd>{{ speedText(s.sail) }}</dd></div>
          <div><dt>川の速度</dt><dd>{{ speedText(s.river) }}</dd></div>
          <div><dt>積荷スロット</dt><dd>{{ loadText(s) }}</dd></div>
          <div><dt>建設時間</dt><dd>{{ s.buildMinutes }}分</dd></div>
          <div><dt>建設費</dt><dd><BuildingCostList :costs="s.cost" /></dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="s.upkeep" /></dd></div>
          <div><dt>解放</dt><dd>{{ s.unlock ? `研究「${s.unlock}」` : '最初から' }}</dd></div>
        </dl>
      </div>
    </div>

    <h2 id="ship-modules">海の船のモジュール</h2>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>モジュール</th>
            <th>建設費</th>
            <th>建設時間</th>
            <th>維持費</th>
            <th>売却価格</th>
            <th>解放</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in modules" :key="m.id">
            <td><strong>{{ m.name }}</strong><template v-if="m.regions"><br /><span class="sh-sub">{{ m.regions.join('・') }}専用</span></template><br /><span class="sh-sub">{{ m.desc }}</span></td>
            <td class="sh-cost"><BuildingCostList :costs="m.cost" /></td>
            <td class="sh-nowrap">{{ m.buildMinutes ? `${m.buildMinutes}分` : '—' }}</td>
            <td class="sh-cost"><BuildingCostList :costs="m.upkeep" /></td>
            <td class="sh-num">{{ m.sell.toLocaleString() }}</td>
            <td>{{ m.unlock ? `研究「${m.unlock}」` : '最初から' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sh-cards">
      <div v-for="m in modules" :key="m.id" class="sh-card">
        <div class="sh-card-header">
          <strong>{{ m.name }}</strong>
          <span v-if="m.regions" class="sh-sub">{{ m.regions.join('・') }}専用</span>
          <span class="sh-sub">{{ m.desc }}</span>
        </div>
        <dl class="sh-card-body">
          <div><dt>建設費</dt><dd><BuildingCostList :costs="m.cost" /></dd></div>
          <div><dt>建設時間</dt><dd>{{ m.buildMinutes ? `${m.buildMinutes}分` : '—' }}</dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="m.upkeep" /></dd></div>
          <div><dt>売却価格</dt><dd>{{ m.sell.toLocaleString() }}</dd></div>
          <div><dt>解放</dt><dd>{{ m.unlock ? `研究「${m.unlock}」` : '最初から' }}</dd></div>
        </dl>
      </div>
    </div>

    <h2 id="ship-workforce">維持費の労働力の種類</h2>
    <p>維持費の労働力は、地域によって種類が違います。数は同じです。</p>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>対象</th>
            <th v-for="r in REGIONS" :key="r">{{ r }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in workforceRows" :key="row.label">
            <td><strong>{{ row.label }}</strong></td>
            <td v-for="r in REGIONS" :key="r">{{ row.by[r] ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sh-cards">
      <div v-for="row in workforceRows" :key="row.label" class="sh-card">
        <div class="sh-card-header"><strong>{{ row.label }}</strong></div>
        <dl class="sh-card-body">
          <div v-for="r in REGIONS" :key="r"><dt>{{ r }}</dt><dd>{{ row.by[r] ?? '—' }}</dd></div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import data from '../../wiki/ships-list.json'
import BuildingCostList from './BuildingCostList.vue'

interface Cost { name: string; amount: number }
interface Ship {
  id: string
  name: string
  kind: 'sea' | 'river'
  configs: string[]
  desc: string
  health: number
  speed: number
  slots: number
  stack: number
  buildMinutes: number
  modSlots: number
  cost: Cost[]
  upkeep: Cost[]
  war: number
  trade: number
  unlock: string | null
  workforce: Record<string, string | null>
  sail: [number, number] | null
  river: [number, number] | null
  fitted: string[]
}
interface SeaConfig {
  region: string
  river: [number, number] | null
  label: string
  kind: 'civil' | 'military'
  ship: string
  health: number
  slots: number
  sail: [number, number] | null
  modules: { name: string; count: number }[]
  buildMinutes: number
  cost: Cost[]
  upkeep: Cost[]
}
interface ShipModule {
  id: string
  name: string
  desc: string
  buildMinutes: number | null
  cost: Cost[]
  upkeep: Cost[]
  war: number
  sell: number
  unlock: string | null
  workforce: Record<string, string | null>
  regions?: string[]
}

const REGIONS = ['ラティウム', 'アルビオン', 'アイギュプト']
const ships = data.ships as Ship[]
const modules = data.modules as ShipModule[]
const seaShips = computed(() => ships.filter(s => s.kind === 'sea'))
const configs = data.configs as SeaConfig[]
const selRegion = ref('ラティウム')
const visibleConfigs = computed(() => configs.filter(c => c.region === selRegion.value))
// 実機で航行速度を確認した地域か（確認していなければ、その旨を出す）
const hasMeasured = computed(() => visibleConfigs.value.some(c => c.sail))
// 川の速度は、アイギュプトの造船所の画面にだけ表示される
const hasRiver = computed(() => visibleConfigs.value.some(c => c.river))
const riverShips = computed(() => ships.filter(s => s.kind === 'river'))

function moduleText(c: SeaConfig): string {
  return c.modules.length ? c.modules.map(m => (m.count > 1 ? `${m.name}×${m.count}` : m.name)).join('、') : 'なし'
}

function loadText(s: Ship): string {
  return String(s.slots)
}

// 航行速度・川の速度は、実機の表示（最小 - 最大）。確認していない船は「未確認です」
function speedText(range: [number, number] | null): string {
  return range ? `${range[0]} - ${range[1]} ペース（毎秒）` : '未確認です'
}

// 労働力の種類の表。同じ種類の並びの船・モジュールは1行にまとめる
const workforceRows = computed(() => {
  const rows: { label: string; by: Record<string, string | null> }[] = []
  const add = (label: string, by: Record<string, string | null>) => {
    if (Object.values(by).every(v => !v)) return
    const key = JSON.stringify(by)
    const same = rows.find(r => JSON.stringify(r.by) === key)
    if (same) same.label += `・${label}`
    else rows.push({ label, by })
  }
  for (const s of seaShips.value) add(s.name, s.workforce)
  for (const m of modules) add(m.name, m.workforce)
  return rows
})
</script>

<style scoped>
.sh-filter {
  margin: 8px 0 12px;
}
.sh-filter label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.sh-filter select {
  padding: 4px 8px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.sh-lead {
  margin: 8px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.sh-sub {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.sh-nowrap {
  white-space: nowrap;
}
.sh-num {
  white-space: nowrap;
  text-align: right;
}
.sh-table-wrap th {
  white-space: nowrap;
}
.sh-cost {
  min-width: 9em;
  max-width: 15em;
}

.sh-cards {
  display: none;
}

@media (max-width: 1119px) {
  /* 表は約900pxの幅が要るので、これより狭いときはカード表示にする */
  .sh-table-wrap {
    display: none;
  }
  .sh-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sh-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    overflow: hidden;
  }
  .sh-card-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    background: var(--vp-c-bg-soft);
  }
  .sh-card-body {
    margin: 0;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
  }
  .sh-card-body div {
    display: flex;
    gap: 8px;
  }
  .sh-card-body dt {
    flex: none;
    min-width: 4.5em;
    color: var(--vp-c-text-2);
  }
  .sh-card-body dd {
    margin: 0;
  }
}
</style>
