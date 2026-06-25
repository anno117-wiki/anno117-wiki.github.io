<template>
  <svg
    :width="svgW"
    :height="svgH"
    style="position:absolute;top:4px;left:4px;pointer-events:none;z-index:0;"
    aria-hidden="true"
  >
    <polyline
      v-for="(seg, i) in segments"
      :key="i"
      :points="`${seg.x1},${seg.y1} ${seg.x2},${seg.y1} ${seg.x2},${seg.y2}`"
      :stroke="`${color}99`"
      stroke-width="1.5"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TechEntry {
  guid: string
  gridX: number
  gridY: number
  connections?: string[]
}

const props = defineProps<{
  branch: string
  meta: { minX: number; minY: number; maxX: number; maxY: number }
  techs: TechEntry[]
  color: string
}>()

const CELL_W = 101
const CELL_H = 73

const svgW = computed(() => (props.meta.maxX - props.meta.minX) * CELL_W + 96)
const svgH = computed(() => (props.meta.maxY - props.meta.minY) * CELL_H + 68)

function cx(t: TechEntry) {
  return (t.gridX - props.meta.minX) * CELL_W + 48
}
function cy(t: TechEntry) {
  return (t.gridY - props.meta.minY) * CELL_H + 34
}

const segments = computed(() => {
  const guidMap = new Map(props.techs.map(t => [t.guid, t]))
  const result: { x1: number; y1: number; x2: number; y2: number }[] = []
  const added = new Set<string>()

  function addSeg(a: TechEntry, b: TechEntry) {
    const key = [a.guid, b.guid].sort().join('-')
    if (added.has(key)) return
    const dx = Math.abs(a.gridX - b.gridX)
    const dy = Math.abs(a.gridY - b.gridY)
    if (dx + dy > 3) return
    added.add(key)
    result.push({ x1: cx(a), y1: cy(a), x2: cx(b), y2: cy(b) })
  }

  for (const t of props.techs) {
    if (t.connections && t.connections.length > 0) {
      for (const targetGuid of t.connections) {
        const target = guidMap.get(targetGuid)
        if (target) addSeg(t, target)
      }
    } else {
      for (const other of props.techs) {
        if (other.guid === t.guid) continue
        const dx = Math.abs(t.gridX - other.gridX)
        const dy = Math.abs(t.gridY - other.gridY)
        if (dx <= 1 && dy <= 1 && dx + dy <= 1) addSeg(t, other)
      }
    }
  }
  return result
})
</script>
