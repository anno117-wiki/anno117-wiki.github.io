<template>
  <div class="sh-root">
    <h2 id="sea-ships">海の船（ラティウム・アルビオン・アイギュプト共通）</h2>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>船</th>
            <th>体力</th>
            <th>速度</th>
            <th>積載</th>
            <th>建造時間</th>
            <th>建造費</th>
            <th>維持費</th>
            <th>改造枠</th>
            <th>解放</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in seaShips" :key="s.id">
            <td><strong>{{ s.name }}</strong><br /><span class="sh-sub">{{ s.desc }}</span></td>
            <td class="sh-num">{{ s.health }}</td>
            <td class="sh-num">{{ s.speed }}</td>
            <td class="sh-nowrap">{{ loadText(s) }}</td>
            <td class="sh-nowrap">{{ s.buildMinutes }}分</td>
            <td class="sh-cost"><BuildingCostList :costs="s.cost" /></td>
            <td class="sh-cost"><BuildingCostList :costs="s.upkeep" /></td>
            <td class="sh-num">{{ s.modSlots }}</td>
            <td>{{ s.unlock ? `研究「${s.unlock}」` : '最初から' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sh-cards">
      <div v-for="s in seaShips" :key="s.id" class="sh-card">
        <div class="sh-card-header">
          <strong>{{ s.name }}</strong>
          <span class="sh-sub">{{ s.desc }}</span>
        </div>
        <dl class="sh-card-body">
          <div><dt>体力</dt><dd>{{ s.health }}</dd></div>
          <div><dt>速度</dt><dd>{{ s.speed }}</dd></div>
          <div><dt>積載</dt><dd>{{ loadText(s) }}</dd></div>
          <div><dt>建造時間</dt><dd>{{ s.buildMinutes }}分</dd></div>
          <div><dt>建造費</dt><dd><BuildingCostList :costs="s.cost" /></dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="s.upkeep" /></dd></div>
          <div><dt>改造枠</dt><dd>{{ s.modSlots }}</dd></div>
          <div><dt>解放</dt><dd>{{ s.unlock ? `研究「${s.unlock}」` : '最初から' }}</dd></div>
        </dl>
      </div>
    </div>

    <h2 id="nile-ships">ナイルの川船（アイギュプト）</h2>
    <div class="sh-table-wrap">
      <table>
        <thead>
          <tr>
            <th>船</th>
            <th>体力</th>
            <th>速度</th>
            <th>積載</th>
            <th>建造時間</th>
            <th>建造費</th>
            <th>維持費</th>
            <th>解放</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in riverShips" :key="s.id">
            <td><strong>{{ s.name }}</strong><br /><span class="sh-sub">{{ s.desc }}</span></td>
            <td class="sh-num">{{ s.health }}</td>
            <td class="sh-num">{{ s.speed }}</td>
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
        </div>
        <dl class="sh-card-body">
          <div><dt>体力</dt><dd>{{ s.health }}</dd></div>
          <div><dt>速度</dt><dd>{{ s.speed }}</dd></div>
          <div><dt>積載</dt><dd>{{ loadText(s) }}</dd></div>
          <div><dt>建造時間</dt><dd>{{ s.buildMinutes }}分</dd></div>
          <div><dt>建造費</dt><dd><BuildingCostList :costs="s.cost" /></dd></div>
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
            <th>建造費</th>
            <th>建造時間</th>
            <th>維持費</th>
            <th>戦力点</th>
            <th>売却価格</th>
            <th>解放</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in modules" :key="m.id">
            <td><strong>{{ m.name }}</strong><br /><span class="sh-sub">{{ m.desc }}</span></td>
            <td class="sh-cost"><BuildingCostList :costs="m.cost" /></td>
            <td class="sh-nowrap">{{ m.buildMinutes }}分</td>
            <td class="sh-cost"><BuildingCostList :costs="m.upkeep" /></td>
            <td class="sh-num">{{ m.war || '—' }}</td>
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
          <span class="sh-sub">{{ m.desc }}</span>
        </div>
        <dl class="sh-card-body">
          <div><dt>建造費</dt><dd><BuildingCostList :costs="m.cost" /></dd></div>
          <div><dt>建造時間</dt><dd>{{ m.buildMinutes }}分</dd></div>
          <div><dt>維持費</dt><dd><BuildingCostList :costs="m.upkeep" /></dd></div>
          <div><dt>戦力点</dt><dd>{{ m.war || '—' }}</dd></div>
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
import { computed } from 'vue'
import data from '../../wiki/ships-list.json'
import BuildingCostList from './BuildingCostList.vue'

interface Cost { name: string; amount: number }
interface Ship {
  id: string
  name: string
  kind: 'sea' | 'river'
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
}
interface ShipModule {
  id: string
  name: string
  desc: string
  buildMinutes: number
  cost: Cost[]
  upkeep: Cost[]
  war: number
  sell: number
  unlock: string | null
  workforce: Record<string, string | null>
}

const REGIONS = ['ラティウム', 'アルビオン', 'アイギュプト']
const ships = data.ships as Ship[]
const modules = data.modules as ShipModule[]
const seaShips = computed(() => ships.filter(s => s.kind === 'sea'))
const riverShips = computed(() => ships.filter(s => s.kind === 'river'))

function loadText(s: Ship): string {
  return `${s.slots}枠（1枠 ${s.stack}）`
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
