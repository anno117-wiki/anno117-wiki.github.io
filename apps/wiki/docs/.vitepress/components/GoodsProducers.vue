<template>
  <div class="goods-producers">
    <div v-for="p in producers" :key="p.name" class="gp-item">
      <div class="gp-head">
        <strong>{{ p.name }}</strong>
        <span class="gp-place">{{ p.place }}</span>
      </div>
      <div class="gp-line">
        <span class="gp-label">建物効果</span>
        <span v-for="e in p.effects" :key="e.label" class="gp-effect">{{ e.label }} {{ e.value }}</span>
      </div>
      <div class="gp-line">
        <span class="gp-label">サイクルタイム</span>{{ p.cycle }}秒<span v-if="p.cycleUnverified">（要検証）</span>
      </div>
      <div class="gp-line">
        <span class="gp-label">解放条件</span>{{ p.unlock ?? '—' }}
      </div>
    </div>
    <p class="gp-note">サイクルタイムは基本の値です。信仰神のバフなどで大きく変わります。</p>
  </div>
</template>

<script setup lang="ts">
interface Producer {
  name: string
  place: string
  unlock: string | null
  cycle: number
  cycleUnverified: boolean
  effects: { label: string; value: number }[]
}

defineProps<{ producers: Producer[] }>()
</script>

<style scoped>
.goods-producers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}
.gp-item {
  padding: 8px 12px;
  border-left: 3px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  border-radius: 0 6px 6px 0;
}
.gp-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}
.gp-place {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.gp-line {
  line-height: 1.7;
}
.gp-label {
  display: inline-block;
  min-width: 7.5em;
  color: var(--vp-c-text-2);
}
.gp-effect {
  display: inline-block;
  margin-right: 0.8em;
  white-space: nowrap;
}
.gp-note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}
</style>
