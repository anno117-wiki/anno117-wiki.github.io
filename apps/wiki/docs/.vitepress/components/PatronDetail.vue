<template>
  <div class="patron-detail">
    <p class="patron-desc">{{ patron.descJa }}</p>

    <div class="patron-block wonder">
      <div class="block-label">奇跡（世界の信仰 {{ wonderThreshold.toLocaleString() }} で解放）</div>
      <div class="block-body">{{ patron.wonder.descJa }}</div>
    </div>

    <div class="patron-block">
      <div class="block-label">局所効果1（島単位）：{{ effect1.titleJa }}</div>
      <div class="block-body">
        <span v-if="effect1.targets.length">生産が増加。対象：{{ effect1.targets.join('、') }}</span>
        <span v-else>{{ effect1.descJa }}</span>
        <span class="muted">（信仰値ごとの効果段階は上の共通表と同じ）</span>
      </div>
    </div>

    <div class="patron-block">
      <div class="block-label">局所効果2（島単位）：{{ effect2.titleJa }}</div>
      <div class="block-body">
        {{ effect2.descJa }}
        <span v-if="effect2.targets.length && !isGeneric(effect2.targets)">対象：{{ effect2.targets.join('、') }}</span>
      </div>
      <table class="milestone-table">
        <thead>
          <tr><th>島の信仰値</th><th v-for="[devotion] in effect2.milestones" :key="devotion">{{ devotion.toLocaleString() }}</th></tr>
        </thead>
        <tbody>
          <tr><th>効果段階値</th><td v-for="[devotion, scale] in effect2.milestones" :key="devotion">{{ scale }}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="patron-block">
      <div class="block-label">支配効果（世界の信仰 {{ dominantThreshold.toLocaleString() }} 以上の最多信仰の1柱）：{{ patron.dominant.titleJa }}</div>
      <div class="block-body">{{ patron.dominant.descJa }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface LocalEffect {
  titleJa: string
  descJa: string
  targets: string[]
  milestones: [number, number][]
}

interface Patron {
  descJa: string
  wonder: { descJa: string }
  local: LocalEffect[]
  dominant: { titleJa: string; descJa: string }
}

const props = defineProps<{
  patron: Patron
  wonderThreshold: number
  dominantThreshold: number
}>()

const effect1 = computed(() => props.patron.local[0])
const effect2 = computed(() => props.patron.local[1])

// 「全住居」等の総称のみの対象は本文の説明と重複するため表示しない
const isGeneric = (targets: string[]) => targets.length === 1 && targets[0].startsWith('全')
</script>

<style scoped>
.patron-desc {
  margin: 0.5rem 0 1rem;
}
.patron-block {
  margin: 0.75rem 0;
  padding: 0.6rem 0.9rem;
  border-left: 3px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  border-radius: 0 6px 6px 0;
}
.patron-block.wonder {
  border-left-color: var(--vp-c-brand-1);
}
.block-label {
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}
.block-body {
  line-height: 1.7;
}
.muted {
  color: var(--vp-c-text-3);
  font-size: 0.85em;
}
.milestone-table {
  margin: 0.5rem 0 0;
  font-size: 0.85em;
}
.milestone-table th,
.milestone-table td {
  text-align: center;
  white-space: nowrap;
}
.milestone-table tbody th {
  text-align: left;
}
</style>
