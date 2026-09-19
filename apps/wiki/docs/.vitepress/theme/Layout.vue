<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-after>
      <GitHistory />
    </template>
    <template #doc-after>
      <ContributionPanel v-if="page.layout !== 'home'" />
      <SiteDisclaimer />
    </template>
    <template #layout-bottom>
      <div v-if="frontmatter.layout === 'home'" class="home-disclaimer">
        <SiteDisclaimer />
      </div>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted } from 'vue'
import { useData, onContentUpdated } from 'vitepress'
import ContributionPanel from '../components/ContributionPanel.vue'
import GitHistory from '../components/GitHistory.vue'
import SiteDisclaimer from '../components/SiteDisclaimer.vue'

const { page, frontmatter } = useData()

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

  // .container(flex, space-between)の3つ目のアイテムとして追加すると、
  // 目次ドロップダウンのボタン幅が圧迫されテキスト折り返しでCLSが発生するため、
  // .container(既存2要素)とは別行として.VPLocalNav直下に追加する。
  const localNav = document.querySelector('.VPLocalNav')
  if (!localNav) return

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
  localNav.appendChild(nav)

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

// VPLocalNav(Menu行+セクション間ナビボタン)は内容によって高さが可変のため、
// sticky要素(item-filters・buildings-filter-bar等)がtop固定値だと重なって隠れる。
// 実測高さをCSS変数化し、各ページのCSSからvar(--local-nav-height)で参照させる。
function updateLocalNavHeight() {
  const localNav = document.querySelector<HTMLElement>('.VPLocalNav')
  document.documentElement.style.setProperty('--local-nav-height', localNav ? `${localNav.offsetHeight}px` : '0px')
}

// 初回マウント時はnextTickを挟まず即挿入し、レイアウト確定前に済ませてCLSを防ぐ。
// SPA遷移時はVPLocalNavの再描画完了を待つ必要があるためnextTickを残す。
onMounted(() => {
  renderSectionNav()
  fixCalculatorLinks()
  updateLocalNavHeight()
  window.addEventListener('resize', updateLocalNavHeight)
})
onContentUpdated(() => nextTick(() => {
  renderSectionNav()
  fixCalculatorLinks()
  updateLocalNavHeight()
}))
</script>
