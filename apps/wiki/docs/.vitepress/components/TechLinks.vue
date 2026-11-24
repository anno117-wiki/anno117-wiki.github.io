<template>
  <svg
    :width="svgW"
    :height="svgH"
    style="position:absolute;top:18px;left:18px;pointer-events:none;z-index:0;"
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
import { CELL_W, CELL_R, BOX_W, BOX_H } from './techGrid'

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

const svgW = computed(() => (props.meta.maxX - props.meta.minX) * CELL_W + BOX_W)
const svgH = computed(() => (props.meta.maxR! - props.meta.minR!) * CELL_R + BOX_H)

function cx(t: TechEntry) {
  return (t.gridX - props.meta.minX) * CELL_W + BOX_W / 2
}
function cy(t: TechEntry) {
  return (t.annoR! - props.meta.minR!) * CELL_R + BOX_H / 2
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
