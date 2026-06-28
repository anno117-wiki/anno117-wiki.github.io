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
      :stroke="color"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-opacity="0.85"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TechEntry {
  guid: string
  gridX: number
  gridY: number
  annoR?: number
  connections?: string[]
}

const props = defineProps<{
  branch: string
  meta: { minX: number; minY: number; maxX: number; maxY: number; minR?: number; maxR?: number }
  techs: TechEntry[]
  color: string
}>()

const CELL_W = 120
const CELL_H = 73
const CELL_R = 60

const useAnnoR = computed(() => props.meta.minR !== undefined && props.meta.maxR !== undefined)

const svgW = computed(() => (props.meta.maxX - props.meta.minX) * CELL_W + 96)
const svgH = computed(() =>
  useAnnoR.value
    ? (props.meta.maxR! - props.meta.minR!) * CELL_R + 40
    : (props.meta.maxY - props.meta.minY) * CELL_H + 40
)

function cx(t: TechEntry) {
  return (t.gridX - props.meta.minX) * CELL_W + 48
}
function cy(t: TechEntry) {
  if (useAnnoR.value && t.annoR !== undefined) {
    return (t.annoR - props.meta.minR!) * CELL_R + 20
  }
  return (t.gridY - props.meta.minY) * CELL_H + 34
}

const segments = computed(() => {
  const guidMap = new Map(props.techs.map(t => [t.guid, t]))
  const result: { x1: number; y1: number; x2: number; y2: number }[] = []
  const added = new Set<string>()

  for (const t of props.techs) {
    if (!t.connections || t.connections.length === 0) continue
    for (const targetGuid of t.connections) {
      const target = guidMap.get(targetGuid)
      if (!target) continue
      const key = [t.guid, target.guid].sort().join('-')
      if (added.has(key)) continue
      added.add(key)
      result.push({ x1: cx(t), y1: cy(t), x2: cx(target), y2: cy(target) })
    }
  }
  return result
})
</script>
