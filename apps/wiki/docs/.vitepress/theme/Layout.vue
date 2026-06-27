<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-after>
      <GitHistory />
    </template>
    <template #doc-after>
      <ContributionPanel v-if="page.layout !== 'home'" />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted } from 'vue'
import { useData, onContentUpdated } from 'vitepress'
import ContributionPanel from '../components/ContributionPanel.vue'
import GitHistory from '../components/GitHistory.vue'

const { page } = useData()

// VPLocalNav .container にセクション間ナビボタンをDOM直接挿入。
// Teleportはターゲット消滅→再生成時に追いつけないため、onContentUpdatedで毎回再描画。
function renderSectionNav() {
  document.querySelectorAll('.section-nav-links').forEach(el => el.remove())

  const path = page.value.relativePath
  type LinkDef = { text: string; href: string; target?: string }
  let links: LinkDef[] = []

  if (path.startsWith('guide/')) {
    links = [
      { text: '計算機', href: '/calculator/', target: '_self' },
      { text: 'データベース', href: '/wiki/goods.html' },
    ]
  } else if (path.startsWith('wiki/')) {
    links = [
      { text: '計算機', href: '/calculator/', target: '_self' },
      { text: '攻略ガイド', href: '/guide/strategy.html' },
    ]
  }

  if (!links.length) return

  const container = document.querySelector('.VPLocalNav .container')
  if (!container) return

  const nav = document.createElement('div')
  nav.className = 'section-nav-links'
  links.forEach(({ text, href, target }) => {
    const a = document.createElement('a')
    a.href = href
    a.textContent = text
    a.className = 'section-nav-link'
    if (target) a.target = target
    nav.appendChild(a)
  })
  container.appendChild(nav)

  // 追加したリンクにも計算機フルリロードを適用
  fixCalculatorLinks()
}

// VitePressのSPAルーターが /calculator/ へのリンクを横取りするのを防ぐ。
function fixCalculatorLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[href="/calculator/"]').forEach(link => {
    if (link.dataset.calcFixed) return
    link.dataset.calcFixed = '1'
    link.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      window.location.href = '/calculator/'
    }, true)
  })
}

onMounted(() => nextTick(() => { renderSectionNav(); fixCalculatorLinks() }))
onContentUpdated(() => nextTick(() => { renderSectionNav(); fixCalculatorLinks() }))
</script>
