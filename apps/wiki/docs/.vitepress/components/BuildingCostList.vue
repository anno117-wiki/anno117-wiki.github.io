<template>
  <span v-if="costs.length">
    <template v-for="(c, i) in costs" :key="i">
      <span class="bcl-item">
        <CoinIcon v-if="c.name === COIN_NAME" />
        <template v-else>{{ c.name }}</template>{{ c.amount }}<template v-if="i < costs.length - 1">、</template>
      </span>
      <!-- 資材の区切りで折り返せるようにする（ブラウザによって、nowrapの隣では折り返せないため明示する） -->
      <wbr v-if="i < costs.length - 1" />
    </template>
  </span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import CoinIcon from './CoinIcon.vue'

defineProps<{ costs: { name: string; amount: number }[] }>()

// 通貨のデナリウスは CoinIcon で表す
const COIN_NAME = 'デナリウス'
</script>

<style scoped>
.bcl-item {
  display: inline-block;
  white-space: nowrap;
}
</style>
