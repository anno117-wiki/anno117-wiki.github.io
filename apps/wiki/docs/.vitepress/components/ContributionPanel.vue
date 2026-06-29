<template>
  <div class="contribution-panel">
    <div class="suggest-bar">
      <span class="suggest-label">この記事の内容について</span>
      <a :href="issueUrl" target="_blank" rel="noopener" class="suggest-button">
        GitHubで編集を提案
      </a>
    </div>
    <UserComments v-if="page.relativePath === 'updates.md'" :show-form="false" :all-pages="true" />
    <UserComments v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import UserComments from './UserComments.vue'

const GITHUB_REPO = 'kojifujita0822/anno117_JP_WIKI'

const { page } = useData()

const issueUrl = computed(() => {
  const title = encodeURIComponent(`【提案】${page.value.title}`)
  const body = encodeURIComponent(`対象ページ: /${page.value.relativePath.replace('.md', '')}\n\n提案内容:\n`)
  return `https://github.com/${GITHUB_REPO}/issues/new?template=content-suggestion.yml&title=${title}&body=${body}`
})
</script>

<style scoped>
.contribution-panel {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.suggest-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.suggest-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.suggest-button {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

.suggest-button:hover {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

/* モバイルで本文(.vp-doc)と左右余白を揃える。
   ContributionPanel は #doc-after スロット経由で .vp-doc の外側に置かれるため、
   本文側の左右paddingが効かず左端に張り付く。同じ 1rem を与えて揃える。 */
@media (max-width: 959px) {
  .contribution-panel {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
