<script setup lang="ts">
import { ref, computed } from 'vue'
import { data } from './techs.data.ts'

const activeBranch = ref(data.branches[0])
const meta = computed(() => data.branchMeta[activeBranch.value])

function gridStyle(tech: any) {
  const m = meta.value
  const col = tech.gridX - m.minX + 1
  const row = tech.gridY - m.minY + 1
  return `grid-column: ${col}; grid-row: ${row};`
}
</script>

# 技術ツリー

知識を消費して解放できる技術の一覧です。ゲート（枠線強調）は次のフェーズへの解放条件となる技術です。

<div class="branch-tabs">
  <button
    v-for="b in data.branches"
    :key="b"
    :class="['tab-btn', { active: activeBranch === b }]"
    @click="activeBranch = b"
  >{{ data.byBranch[b][0]?.branchLabel }}</button>
</div>

<div
  v-if="activeBranch && meta"
  class="tech-grid"
  :style="`--cols: ${meta.maxX - meta.minX + 1}; --rows: ${meta.maxY - meta.minY + 1};`"
>
  <div
    v-for="tech in data.byBranch[activeBranch]"
    :key="tech.guid"
    :class="['tech-cell', `color-${tech.color.toLowerCase()}`, { 'is-gate': tech.isGate }]"
    :style="gridStyle(tech)"
    :title="tech.internalName"
  >
    <span v-if="tech.isGate && tech.knowledgeCost" class="gate-cost">{{ tech.knowledgeCost.toLocaleString() }}</span>
    <span class="tech-label">{{ tech.label }}</span>
  </div>
</div>

<style scoped>
.branch-tabs {
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
.tech-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
  grid-template-rows: repeat(var(--rows), 60px);
  gap: 4px;
  overflow-x: auto;
  min-width: 0;
}
.tech-cell {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 4px;
  font-size: 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.is-gate {
  border-width: 2px;
  font-weight: bold;
}
.gate-cost {
  font-size: 0.7rem;
  color: var(--vp-c-brand);
}
.color-green .gate-cost { color: #22c55e; }
.color-green.is-gate { border-color: #22c55e; }
.color-purple .gate-cost { color: #a855f7; }
.color-purple.is-gate { border-color: #a855f7; }
.color-rustred .gate-cost { color: #ef4444; }
.color-rustred.is-gate { border-color: #ef4444; }
.color-yellow .gate-cost { color: #eab308; }
.color-yellow.is-gate { border-color: #eab308; }
.tech-label {
  line-height: 1.2;
}
</style>
