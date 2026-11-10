<template>
  <span v-if="costs.length">
    <template v-for="(c, i) in costs" :key="i">
      <span class="bcl-item">
        <img
          v-if="c.name === COIN_NAME"
          class="bcl-coin"
          :src="withBase('/icons/goods-thumb/money.webp')"
          :alt="COIN_NAME"
          :title="COIN_NAME"
          width="18"
          height="18"
        />
        <template v-else>{{ c.name }}</template>{{ c.amount }}<template v-if="i < costs.length - 1">、</template>
      </span>
      <!-- 資材の区切りで折り返せるようにする（ブラウザによって、nowrapの隣では折り返せないため明示する） -->
      <wbr v-if="i < costs.length - 1" />
    </template>
  </span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'

defineProps<{ costs: { name: string; amount: number }[] }>()

// 通貨のデナリウスは、スペースを節約するためにコインのアイコンで表す
const COIN_NAME = 'デナリウス'
</script>

<style scoped>
.bcl-item {
  display: inline-block;
  white-space: nowrap;
}
.bcl-coin {
  display: inline-block;
  width: 18px;
  height: 18px;
  vertical-align: text-bottom;
  object-fit: contain;
}
/* 画像が黒っぽいコインなので、ダークモードでは白黒を反転して見えるようにする */
.dark .bcl-coin {
  filter: invert(1);
}
</style>
