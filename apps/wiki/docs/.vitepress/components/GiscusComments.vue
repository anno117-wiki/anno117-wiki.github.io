<template>
  <div ref="container" class="giscus-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

// giscus.app で取得した値を設定する
const GISCUS_REPO = 'anno117-wiki/anno117-wiki.github.io'
const GISCUS_REPO_ID = 'R_kgDOTExLIA'
const GISCUS_CATEGORY = 'Announcements'
const GISCUS_CATEGORY_ID = 'DIC_kwDOTExLIM4C_25Y'

const container = ref<HTMLElement | null>(null)
const { page, isDark } = useData()

function loadGiscus() {
  if (!container.value) return
  container.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', GISCUS_REPO)
  script.setAttribute('data-repo-id', GISCUS_REPO_ID)
  script.setAttribute('data-category', GISCUS_CATEGORY)
  script.setAttribute('data-category-id', GISCUS_CATEGORY_ID)
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'top')
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', 'ja')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true

  container.value.appendChild(script)
}

onMounted(loadGiscus)

// ページ遷移時に再ロード
watch(() => page.value.relativePath, loadGiscus)

// ダークモード切替時にテーマを更新
watch(isDark, (dark) => {
  const iframe = document.querySelector<HTMLIFrameElement>('.giscus-frame')
  if (!iframe) return
  iframe.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: dark ? 'dark' : 'light' } } },
    'https://giscus.app'
  )
})
</script>

<style scoped>
.giscus-container {
  margin-top: 2rem;
}
</style>
