<template>
  <details class="production-chain" @toggle="onToggle">
    <summary>生産チェーン図を表示</summary>
    <div v-if="isOpen" class="chain-scroll">
    <svg
      :viewBox="layout.viewBox"
      :width="layout.totalW"
      :height="layout.totalH"
      style="display:block"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#888" />
        </marker>
      </defs>
      <path
        v-for="(e, i) in layout.edgePaths"
        :key="i"
        :d="e"
        fill="none"
        stroke="#aaa"
        stroke-width="1.5"
        marker-end="url(#arrow)"
      />
      <g v-for="n in layout.posNodes" :key="n.id">
        <rect :x="n.x" :y="n.y" width="120" height="44" rx="6" fill="#fff" stroke="#aaa" stroke-width="1.5" />
        <text :x="n.x + 60" :y="n.y + 16" text-anchor="middle" font-size="12" font-weight="bold" fill="#222">{{ n.label }}</text>
        <text :x="n.x + 60" :y="n.y + 32" text-anchor="middle" font-size="11" fill="#666">{{ n.time }}</text>
      </g>
    </svg>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ProductionGraph } from '../../wiki/production-chains.data'

const NODE_W = 120
const NODE_H = 44
const GAP_X = 70
const GAP_Y = 20
const PADDING = 10

const props = defineProps<{ graph: ProductionGraph }>()
const isOpen = ref(false)

function onToggle(e: Event) {
  isOpen.value = (e.target as HTMLDetailsElement).open
}

watch(() => props.graph, () => {
  // graphが変わっても isOpen は維持（再計算はcomputedが行う）
})

const layout = computed(() => {
  const { nodes, edges } = props.graph

  // 各ノードへの入力ノードID一覧（to → from[]）
  const inputsOf = new Map<string, string[]>()
  for (const n of nodes) inputsOf.set(n.id, [])
  for (const e of edges) {
    const arr = inputsOf.get(e.to)
    if (arr) arr.push(e.from)
  }

  // ランク計算（DFS・メモ化）
  const rankMap = new Map<string, number>()
  function calcRank(id: string): number {
    if (rankMap.has(id)) return rankMap.get(id)!
    const inputs = inputsOf.get(id) ?? []
    const rank = inputs.length === 0 ? 0 : 1 + Math.max(...inputs.map(calcRank))
    rankMap.set(id, rank)
    return rank
  }
  for (const n of nodes) calcRank(n.id)

  // Y軸：葉ノード（rank 0）に連番、内部ノードは入力ノードの平均行
  const leaves = nodes.filter(n => (inputsOf.get(n.id)?.length ?? 0) === 0)
  const rowMap = new Map<string, number>()
  leaves.forEach((n, i) => rowMap.set(n.id, i))

  const nonLeaves = [...nodes]
    .filter(n => (inputsOf.get(n.id)?.length ?? 0) > 0)
    .sort((a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0))

  for (const n of nonLeaves) {
    const inputIds = inputsOf.get(n.id) ?? []
    const rows = inputIds.map(id => rowMap.get(id) ?? 0)
    const avg = rows.length > 0 ? rows.reduce((s, v) => s + v, 0) / rows.length : 0
    rowMap.set(n.id, avg)
  }

  // 座標計算
  const posNodes = nodes.map(n => ({
    ...n,
    x: (rankMap.get(n.id) ?? 0) * (NODE_W + GAP_X) + PADDING,
    y: (rowMap.get(n.id) ?? 0) * (NODE_H + GAP_Y) + PADDING,
  }))

  const posMap = new Map(posNodes.map(n => [n.id, n]))

  // エッジパス（三次ベジェ）
  const edgePaths: string[] = []
  for (const e of edges) {
    const src = posMap.get(e.from)
    const dst = posMap.get(e.to)
    if (!src || !dst) continue
    const sx = src.x + NODE_W
    const sy = src.y + NODE_H / 2
    const dx = dst.x
    const dy = dst.y + NODE_H / 2
    const cx1 = sx + 35
    const cx2 = dx - 35
    edgePaths.push(`M${sx},${sy} C${cx1},${sy} ${cx2},${dy} ${dx},${dy}`)
  }

  // viewBox計算
  const maxRank = Math.max(...[...rankMap.values()])
  const maxRow = Math.max(...[...rowMap.values()])
  const totalW = (maxRank + 1) * (NODE_W + GAP_X) - GAP_X + PADDING * 2
  const totalH = (maxRow + 1) * (NODE_H + GAP_Y) - GAP_Y + PADDING * 2

  return {
    posNodes,
    edgePaths,
    viewBox: `${-PADDING} ${-PADDING} ${totalW} ${totalH}`,
    totalW,
    totalH,
  }
})
</script>

<style scoped>
.production-chain {
  margin-top: 0.25rem;
}
.production-chain summary {
  cursor: pointer;
  color: var(--vp-c-brand);
  user-select: none;
}
.chain-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  max-width: 100vw;
}
</style>
