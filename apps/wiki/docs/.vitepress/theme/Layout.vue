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
import { useData } from 'vitepress'
import ContributionPanel from '../components/ContributionPanel.vue'
import GitHistory from '../components/GitHistory.vue'

const { page } = useData()
</script>
