<template>
  <div ref="container" class="mermaid-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{ definition: string }>()
const container = ref<HTMLElement | null>(null)

async function render() {
  if (!container.value) return
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
    const id = 'mermaid-' + Math.random().toString(36).slice(2)
    const { svg } = await mermaid.render(id, props.definition)
    container.value.innerHTML = svg
  } catch (err) {
    console.error('[MermaidDiagram] render failed:', err)
    if (container.value) container.value.innerHTML = '<span style="color:var(--vp-c-danger)">図の描画に失敗しました</span>'
  }
}

onMounted(render)
watch(() => props.definition, render)
</script>

<style scoped>
.mermaid-container {
  max-width: 100%;
  overflow-x: auto;
  margin: 1rem 0;
}
</style>
