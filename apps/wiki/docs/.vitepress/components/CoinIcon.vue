<template>
  <img
    class="coin-icon"
    :src="withBase('/icons/goods-thumb/money.webp')"
    :alt="COIN_NAME"
    :title="COIN_NAME"
    width="18"
    height="18"
  />
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'

// 通貨のデナリウスは、スペースを節約するためにコインのアイコンで表す
const COIN_NAME = 'デナリウス'
</script>

<style scoped>
.coin-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin: 0;
  vertical-align: text-bottom;
  object-fit: contain;
}
/* 画像が黒っぽいコインなので、ダークモードでは白黒を反転して見えるようにする */
.dark .coin-icon {
  filter: invert(1);
}
</style>
