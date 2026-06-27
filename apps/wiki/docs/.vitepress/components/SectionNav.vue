<template>
  <div v-if="links.length" class="section-nav-links">
    <a
      v-for="link in links"
      :key="link.href"
      :href="link.href"
      :target="link.target ?? undefined"
      class="section-nav-link"
    >{{ link.text }}</a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

const links = computed(() => {
  const path = page.value.relativePath
  if (path.startsWith('guide/')) {
    return [
      { text: '計算機', href: '/calculator/', target: '_self' },
      { text: 'データベース', href: '/wiki/goods.html', target: null },
    ]
  }
  if (path.startsWith('wiki/')) {
    return [
      { text: '計算機', href: '/calculator/', target: '_self' },
      { text: '攻略ガイド', href: '/guide/strategy.html', target: null },
    ]
  }
  return []
})
</script>

<style scoped>
.section-nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
}

.section-nav-link {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 12px;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;
}

.section-nav-link:hover {
  background-color: var(--vp-c-brand-1);
  color: #fff;
}

/* デスクトップ(≥960px)では VPLocalNav 自体が非表示になるため不要 */
@media (min-width: 960px) {
  .section-nav-links {
    display: none;
  }
}
</style>
