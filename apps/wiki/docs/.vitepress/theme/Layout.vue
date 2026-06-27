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
import { useData } from 'vitepress'
import ContributionPanel from '../components/ContributionPanel.vue'
import GitHistory from '../components/GitHistory.vue'
import SectionNav from '../components/SectionNav.vue'

const { page } = useData()
</script>
