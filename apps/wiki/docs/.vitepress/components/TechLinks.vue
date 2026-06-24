<template>
  <svg
    :width="svgW"
    :height="svgH"
    style="position:absolute;top:4px;left:4px;pointer-events:none;z-index:0;"
    aria-hidden="true"
  >
    <line
      v-for="(seg, i) in segments"
      :key="i"
      :x1="seg.x1" :y1="seg.y1"
      :x2="seg.x2" :y2="seg.y2"
      stroke="rgba(0,0,0,0.18)"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TechEntry {
  guid: string
  gridX: number
  gridY: number
}

const props = defineProps<{
  branch: string
  meta: { minX: number; minY: number; maxX: number; maxY: number }
  techs: TechEntry[]
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

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]] as const

const segments = computed(() => {
  const map = new Map<string, TechEntry>()
  for (const t of props.techs) {
    map.set(`${t.gridX},${t.gridY}`, t)
  }
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (const t of props.techs) {
    for (const [dx, dy] of DIRS) {
      const nb = map.get(`${t.gridX + dx},${t.gridY + dy}`)
      if (nb) {
        lines.push({ x1: cx(t), y1: cy(t), x2: cx(nb), y2: cy(nb) })
      }
    }
  }
  return lines
})
</script>
