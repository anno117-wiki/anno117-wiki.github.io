<script setup lang="ts">
// 一覧ページの絞り込み欄。スクロールしても画面の上に残るよう固定する。
// スマホ（959px 以下）では「主な検索欄・件数・［絞り込み］」の1行だけを見せ、残りの欄は［絞り込み］で開く
// （欄を丸ごと固定すると、一覧を見られる範囲が画面の半分ほどまで狭まるため）。
// PC では全部の欄を1つの帯に並べ、［絞り込み］は出さない。
import { ref } from 'vue'

defineProps<{
  /** 主な検索欄以外で、条件を指定している欄の数。［絞り込み（2）］のように見せる */
  activeCount: number
}>()

const open = ref(false)
</script>

<template>
  <div class="filter-bar" :class="{ 'is-open': open }">
    <div class="filter-bar-main">
      <slot name="main" />
      <span class="filter-bar-count"><slot name="count" /></span>
      <button type="button" class="filter-bar-toggle" :aria-expanded="open" @click="open = !open">
        絞り込み<template v-if="activeCount">（{{ activeCount }}）</template>
        <span aria-hidden="true">{{ open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <div class="filter-bar-more">
      <slot />
    </div>
  </div>
</template>

<style>
/* 中身（入力欄や選択欄の見た目）は各ページの CSS のまま。ここでは並べ方と固定だけを決める */
.filter-bar {
  position: sticky;
  /* スマホでは上のナビは流れて消え、「メニュー／目次」の帯（--local-nav-height、Layout.vue が測る）だけが残る */
  top: var(--local-nav-height, 0px);
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin: 12px 0;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

/* PC: 主な欄と残りの欄を1つの帯に並べ、件数は右端に置く */
.filter-bar-main,
.filter-bar-more {
  display: contents;
}
.filter-bar-count {
  order: 99;
  margin-left: auto;
  font-size: 14px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.filter-bar-toggle {
  display: none;
}

@media (min-width: 960px) {
  .filter-bar {
    /* PC では上のナビ（固定）の下に置く。960〜1279px は「メニュー／目次」の帯も残る */
    top: calc(var(--vp-nav-height) + var(--local-nav-height, 0px));
  }
}

@media (max-width: 959px) {
  .filter-bar {
    display: block;
    padding: 8px 10px;
  }
  .filter-bar-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .filter-bar-main > label,
  .filter-bar-main > input {
    flex: 1;
    min-width: 0;
  }
  .filter-bar-main input {
    width: 100%;
    min-width: 0;
  }
  /* 1行に縮めた欄では、検索欄の見出し（「名前:」など）を隠して幅を空ける。何を入れるかは入力欄の案内文で伝わる */
  .filter-bar-main label > strong,
  .filter-bar-main label > span {
    display: none;
  }
  .filter-bar-count {
    order: 0;
    margin-left: 0;
  }
  /* 件数の「/ 全体の数」は、検索欄の幅を空けるためにスマホでは出さない */
  .filter-bar-total {
    display: none;
  }
  .filter-bar-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: 14px;
    white-space: nowrap;
    color: var(--vp-c-brand-1);
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-brand-1);
    border-radius: 6px;
    cursor: pointer;
  }
  .filter-bar-more {
    display: none;
  }
  .filter-bar.is-open .filter-bar-more {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: 8px;
    /* 開いた欄が長いときも、一覧の上を覆い尽くさないよう中でスクロールさせる */
    max-height: 50vh;
    overflow-y: auto;
  }
}
</style>
