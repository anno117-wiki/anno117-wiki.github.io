<template>
  <details class="production-mermaid">
    <summary>生産チェーン図を表示</summary>
    <div ref="container" class="mermaid-container"></div>
  </details>
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
    console.error('[ProductionMermaid] render failed:', err)
    if (container.value) container.value.innerHTML = '<span style="color:var(--vp-c-danger)">図の描画に失敗しました</span>'
  }
}

onMounted(render)
watch(() => props.definition, render)
</script>

<style scoped>
.production-mermaid {
  margin-top: 0.25rem;
  font-size: 0.85em;
}
.production-mermaid summary {
  cursor: pointer;
  color: var(--vp-c-brand);
  user-select: none;
}
.mermaid-container {
  max-width: 100%;
  overflow-x: auto;
}
</style>
