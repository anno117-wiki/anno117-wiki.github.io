<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-after>
      <GitHistory />
    </template>
    <template #doc-after>
      <ContributionPanel v-if="page.layout !== 'home'" />
    </template>
  </DefaultTheme.Layout>

  <!-- Menuボタンの横にセクション間ナビボタンを注入（モバイルのみ有効） -->
  <ClientOnly>
    <Teleport v-if="page.layout !== 'home'" to=".VPLocalNav .container">
      <SectionNav />
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import { useData, onContentUpdated } from 'vitepress'
import ContributionPanel from '../components/ContributionPanel.vue'
import GitHistory from '../components/GitHistory.vue'
import SectionNav from '../components/SectionNav.vue'

const { page } = useData()

// VitePressのSPAルーターが /calculator/ へのリンクを
// クライアントサイドナビゲーションとして横取りするのを防ぐ。
// captureフェーズで先に拾い、window.location.href で強制フルリロード。
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

onMounted(fixCalculatorLinks)
onContentUpdated(fixCalculatorLinks)
</script>
