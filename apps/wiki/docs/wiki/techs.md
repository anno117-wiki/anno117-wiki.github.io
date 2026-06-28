<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { data } from './techs.data.ts'

const { site } = useData()
const BASE = computed(() => site.value.base || '/')

const hoveredTech = ref<any>(null)
const tooltipStyle = ref('')
const selected = ref<any>(null)
const zoom = ref(0.6)

const CELL_W = 120
const CELL_R = 60

function gridStyle(tech: any) {
  const m = data.branchMeta[tech.branch]
  if (!m) return ''
  const x = (tech.gridX - m.minX) * CELL_W
  const y = (tech.annoR - m.minR) * CELL_R
  return `position:absolute;left:${x}px;top:${y}px;width:96px;height:40px;`
}

function gridVars(b: string) {
  const m = data.branchMeta[b]
  if (!m) return ''
  const w = (m.maxX - m.minX) * CELL_W + 96
  const h = (m.maxR - m.minR) * CELL_R + 40
  return `width:${w}px;height:${h}px;`
}

function onEnter(tech: any, e: MouseEvent) {
  hoveredTech.value = tech
  positionTooltip(e)
}
function onMove(e: MouseEvent) {
  if (hoveredTech.value) positionTooltip(e)
}
function positionTooltip(e: MouseEvent) {
  tooltipStyle.value = `left:${e.clientX + 14}px;top:${e.clientY + 14}px;`
}
function onLeave() { hoveredTech.value = null }

function selectTech(tech: any) {
  if (panState.value?.didMove) return
  selected.value = selected.value?.guid === tech.guid ? null : tech
}

function stripTags(s: string) {
  return s ? s.replace(/<[^>]+>/g, '') : ''
}

function zoomStep(d: number) {
  zoom.value = Math.min(1.0, Math.max(0.3, +(zoom.value + d).toFixed(2)))
}

function formatKnowledge(n: number): string {
  if (n >= 1_000_000) return parseFloat((n / 1_000_000).toFixed(1)) + 'M'
  if (n >= 1_000) return parseFloat((n / 1_000).toFixed(1)) + 'k'
  return String(n)
}

const branchLabelMap: Record<string, string> = {
  economy: '経済', civic: '市民', military: '軍事',
}
function getBranchDisplayLabel(b: string): string {
  if (branchLabelMap[b]) return branchLabelMap[b]
  const m = b.match(/^dlc(\d+)$/)
  if (m) return `DLC${Number(m[1])}`
  return b
}
const branchColorMap: Record<string, string> = {
  economy: '#16a34a', civic: '#7c3aed', military: '#dc2626', dlc01: '#d97706',
}

// パン操作
interface PanState {
  viewportEl: HTMLElement
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  didMove: boolean
}
const panState = ref<PanState | null>(null)
const viewportRefs: Record<string, HTMLElement> = {}

function setViewportRef(b: string, el: any) {
  if (el) viewportRefs[b] = el as HTMLElement
}

function onViewportMousedown(b: string, e: MouseEvent) {
  if (e.button !== 0) return
  const el = viewportRefs[b]
  if (!el) return
  panState.value = {
    viewportEl: el,
    startX: e.clientX,
    startY: e.clientY,
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop,
    didMove: false,
  }
}

function onWindowMousemove(e: MouseEvent) {
  if (!panState.value) return
  const dx = e.clientX - panState.value.startX
  const dy = e.clientY - panState.value.startY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panState.value.didMove = true
  panState.value.viewportEl.scrollLeft = panState.value.scrollLeft - dx
  panState.value.viewportEl.scrollTop = panState.value.scrollTop - dy
}

function onWindowMouseup() {
  panState.value = null
}

onMounted(() => {
  window.addEventListener('mousemove', onWindowMousemove)
  window.addEventListener('mouseup', onWindowMouseup)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMousemove)
  window.removeEventListener('mouseup', onWindowMouseup)
})
</script>

# スキルツリー

知識を消費して解放できるスキルの一覧です。**ゲート**（太枠）は次フェーズへの解放条件です。セルをクリックで詳細表示。

<div class="zoom-bar">
  <button class="zoom-btn" @click="zoomStep(-0.05)" :disabled="zoom <= 0.3">−</button>
  <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
  <button class="zoom-btn" @click="zoomStep(0.05)" :disabled="zoom >= 1.0">＋</button>
  <input type="range" min="0.3" max="1" step="0.05" v-model.number="zoom" class="zoom-slider">
</div>

<div v-if="selected" class="detail-panel">
  <div class="detail-header">
    <span :class="['color-dot', `dot-${selected.color.toLowerCase()}`]"></span>
    <strong>{{ selected.label }}</strong>
    <span v-if="selected.isGate" class="gate-badge">ゲート</span>
    <button class="close-btn" @click="selected = null">×</button>
  </div>
  <div class="detail-body">
    <div v-if="selected.knowledgeCost" class="detail-row">
      <span class="detail-key">知識コスト</span>
      <span class="detail-val">{{ formatKnowledge(selected.knowledgeCost) }}</span>
    </div>
    <div v-if="selected.effectJa" class="detail-row full">
      <span class="detail-key">効果</span>
      <span class="detail-val">{{ stripTags(selected.effectJa) }}</span>
    </div>
    <div v-if="selected.descJa" class="detail-row full">
      <span class="detail-key">研究条件</span>
      <span class="detail-val">{{ stripTags(selected.descJa) }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">GUID</span>
      <span class="detail-val mono">{{ selected.guid }}</span>
    </div>
  </div>
</div>

<div :class="['branch-row']">
<div v-for="b in data.branches" :key="b" class="branch-section">
  <div class="branch-heading" :style="`border-left-color: ${branchColorMap[b] || '#888'};`">
    {{ getBranchDisplayLabel(b) }}
    <span class="branch-count">{{ (data.byBranch[b] || []).length }}件</span>
  </div>
  <div
    class="tree-viewport"
    :style="`zoom: ${zoom};`"
    :class="{ 'is-panning': panState?.viewportEl === viewportRefs[b] }"
    :ref="(el: any) => setViewportRef(b, el)"
    @mousedown="onViewportMousedown(b, $event)"
  >
    <ClientOnly>
      <TechLinks :branch="b" :meta="data.branchMeta[b]" :techs="data.byBranch[b] || []" :color="branchColorMap[b] || '#888888'" />
    </ClientOnly>
    <div class="tech-grid" :style="gridVars(b)">
      <div
        v-for="tech in (data.byBranch[b] || [])"
        :key="tech.guid"
        :class="['tech-cell', `color-${tech.color.toLowerCase()}`, { 'is-gate': tech.isGate, 'is-selected': selected?.guid === tech.guid }]"
        :style="gridStyle(tech)"
        @mouseenter="onEnter(tech, $event)"
        @mousemove="onMove($event)"
        @mouseleave="onLeave"
        @click="selectTech(tech)"
      >
        <img
          v-if="tech.annoNodeId || tech.isGate"
          :src="tech.annoNodeId ? `${BASE}icons/tech/${tech.annoNodeId}.webp` : `${BASE}icons/tech/gate.webp`"
          class="tech-icon"
          :alt="tech.label"
          @error="($event.target as HTMLImageElement).src = `${BASE}icons/tech/gate.webp`"
        />
        <span v-if="tech.isGate && tech.knowledgeCost" class="gate-cost">{{ formatKnowledge(tech.knowledgeCost) }}</span>
        <span class="tech-label">{{ tech.label }}</span>
      </div>
    </div>
  </div>
</div>
</div>

<Teleport to="body">
  <div v-if="hoveredTech && !selected" class="tech-tooltip" :style="tooltipStyle">
    <div class="tt-name">{{ hoveredTech.label }}</div>
    <div v-if="hoveredTech.effectJa" class="tt-effect">{{ stripTags(hoveredTech.effectJa) }}</div>
    <div v-if="hoveredTech.knowledgeCost" class="tt-cost">知識コスト: {{ formatKnowledge(hoveredTech.knowledgeCost) }}</div>
    <div v-if="hoveredTech.isGate" class="tt-gate">ゲート（フェーズ解放条件）</div>
  </div>
</Teleport>

<style scoped>
.zoom-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}
.zoom-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--vp-c-divider); border-radius: 4px;
  cursor: pointer; background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font-size: 1rem; line-height: 1;
  display: flex; align-items: center; justify-content: center;
}
.zoom-btn:disabled { opacity: 0.4; cursor: default; }
.zoom-label { min-width: 40px; text-align: center; }
.zoom-slider { flex: 1; max-width: 160px; accent-color: var(--vp-c-brand); }

.detail-panel {
  margin-bottom: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px; overflow: hidden;
  position: sticky; top: 60px; z-index: 10;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.detail-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.9rem;
}
.color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-green   { background: #22c55e; }
.dot-purple  { background: #a855f7; }
.dot-rustred { background: #ef4444; }
.dot-blue    { background: #3b82f6; }
.dot-brown   { background: #b45309; }
.dot-yellow  { background: #ca8a04; }
.gate-badge {
  background: #f59e0b; color: #fff;
  border-radius: 4px; padding: 1px 7px;
  font-size: 0.72rem; font-weight: 600;
}
.close-btn {
  margin-left: auto; border: none; background: none;
  cursor: pointer; color: var(--vp-c-text-2); font-size: 1.1rem; padding: 0 4px;
}
.detail-body { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 4px 24px; }
.detail-row { display: flex; align-items: baseline; gap: 6px; font-size: 0.82rem; }
.detail-row.full { width: 100%; }
.detail-key { color: var(--vp-c-text-2); white-space: nowrap; flex-shrink: 0; }
.detail-val { color: var(--vp-c-text-1); }
.detail-val.mono { font-family: monospace; font-size: 0.76rem; }

.branch-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 12px;
}
.branch-section {
  min-width: 0;
}
.branch-heading {
  font-size: 1rem; font-weight: 600;
  border-left: 4px solid #888;
  padding: 4px 0 4px 10px;
  margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.branch-count {
  font-size: 0.78rem; font-weight: normal;
  color: var(--vp-c-text-2);
}

.tree-viewport {
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  padding: 4px;
  position: relative;
  cursor: grab;
  user-select: none;
}
.tree-viewport.is-panning {
  cursor: grabbing;
}

.tech-grid {
  position: relative;
}

.tech-cell {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 2px 4px;
  font-size: 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  line-height: 1.2;
}
.tech-cell:hover { transform: scale(1.06); box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 2; position: relative; }
.is-gate { border-width: 3px; font-weight: 600; border-color: #d4a017; box-shadow: 0 0 5px rgba(212,160,23,0.5); }
.is-selected { outline: 2px solid #fff; outline-offset: 1px; box-shadow: 0 0 0 3px rgba(0,0,0,0.3); z-index: 3; position: relative; }
.gate-cost { font-size: 0.6rem; font-weight: 700; margin-bottom: 0; }
.tech-label { line-height: 1.2; }
.tech-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  margin-bottom: 1px;
  flex-shrink: 0;
}

.color-green   { background: #dcfce7; border-color: #86efac; color: #14532d; }
.color-green   .gate-cost { color: #16a34a; }
.color-green.is-gate   { background: #86efac; }
.color-purple  { background: #f3e8ff; border-color: #d8b4fe; color: #4c1d95; }
.color-purple  .gate-cost { color: #7c3aed; }
.color-purple.is-gate  { background: #c4b5fd; }
.color-rustred { background: #fee2e2; border-color: #fca5a5; color: #7f1d1d; }
.color-rustred .gate-cost { color: #dc2626; }
.color-rustred.is-gate { background: #fca5a5; }
.color-blue    { background: #dbeafe; border-color: #93c5fd; color: #1e3a8a; }
.color-blue    .gate-cost { color: #2563eb; }
.color-blue.is-gate    { background: #93c5fd; }
.color-brown   { background: #fef3c7; border-color: #fcd34d; color: #78350f; }
.color-brown   .gate-cost { color: #b45309; }
.color-brown.is-gate   { background: #fcd34d; }
.color-yellow  { background: #fefce8; border-color: #fde047; color: #713f12; }
.color-yellow  .gate-cost { color: #ca8a04; }
.color-yellow.is-gate  { background: #fde047; }

.dark .color-green   { background: #14532d; border-color: #16a34a; color: #bbf7d0; }
.dark .color-green.is-gate   { background: #15803d; }
.dark .color-purple  { background: #4c1d95; border-color: #7c3aed; color: #e9d5ff; }
.dark .color-purple.is-gate  { background: #6d28d9; }
.dark .color-rustred { background: #7f1d1d; border-color: #dc2626; color: #fecaca; }
.dark .color-rustred.is-gate { background: #b91c1c; }
.dark .color-blue    { background: #1e3a8a; border-color: #2563eb; color: #bfdbfe; }
.dark .color-blue.is-gate    { background: #1d4ed8; }
.dark .color-brown   { background: #78350f; border-color: #b45309; color: #fde68a; }
.dark .color-brown.is-gate   { background: #92400e; }
.dark .color-yellow  { background: #713f12; border-color: #ca8a04; color: #fef08a; }
.dark .color-yellow.is-gate  { background: #a16207; }
.dark .color-green .gate-cost { color: #4ade80; }
.dark .color-purple .gate-cost { color: #c084fc; }
.dark .color-rustred .gate-cost { color: #f87171; }
.dark .color-blue .gate-cost { color: #60a5fa; }
.dark .color-brown .gate-cost { color: #fcd34d; }
.dark .color-yellow .gate-cost { color: #fde047; }
</style>

<style>
.tech-tooltip {
  position: fixed; z-index: 9999;
  max-width: 280px;
  background: var(--vp-c-bg-elv, #fff);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px; padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none;
}
.tech-tooltip .tt-name   { font-weight: bold; font-size: 0.85rem; margin-bottom: 3px; }
.tech-tooltip .tt-effect { font-size: 0.78rem; color: var(--vp-c-text-1); line-height: 1.4; margin-bottom: 3px; }
.tech-tooltip .tt-cost   { font-size: 0.78rem; color: #f59e0b; }
.tech-tooltip .tt-gate   { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
</style>
