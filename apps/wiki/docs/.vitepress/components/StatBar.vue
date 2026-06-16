<template>
  <div class="stat-bar-cell">
    <span class="stat-value">{{ props.n === 0 ? '—' : props.n > 0 ? `+${props.n}` : props.n }}</span>
    <div v-if="props.n !== 0" class="stat-bar-track">
      <div
        class="stat-bar-fill"
        :class="props.n > 0 ? 'pos' : 'neg'"
        :style="{ width: Math.min(Math.abs(props.n) / props.maxAbs * 100, 100) + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ n: number; maxAbs?: number }>(), { maxAbs: 7 })
</script>

<style scoped>
.stat-bar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 36px;
}
.stat-value {
  font-size: 0.85em;
  line-height: 1;
}
.stat-bar-track {
  width: 100%;
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s;
}
.stat-bar-fill.pos { background: #4caf50; }
.stat-bar-fill.neg { background: #f44336; }
</style>
