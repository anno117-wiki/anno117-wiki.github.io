<template>
  <details class="git-history" open>
    <summary>更新履歴</summary>
    <template v-for="group in groups" :key="group.heading">
      <h4 class="gh-heading">{{ group.heading }}</h4>
      <ul>
        <li v-for="(entry, i) in group.items" :key="i">
          <span class="gh-badge" :class="entry.type">{{ BADGE_LABEL[entry.type] }}</span>
          <span class="gh-date">{{ entry.date }}</span>
          <a v-if="entry.link" class="gh-text" :href="withBase(entry.link)">{{ entry.title }}</a>
          <a v-else-if="entry.type === 'fix'" class="gh-text" :href="withBase('/updates')">{{ entry.title }}</a>
          <span v-else class="gh-text">{{ entry.title }}</span>
        </li>
      </ul>
    </template>
    <a class="gh-all" :href="withBase('/updates')">すべて見る →</a>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import updates from '../data/updates.json'
import { useCommentEntries, type LogEntry } from './commentEntries'

const RECENT_UPDATE_COUNT = 5
const RECENT_COMMENT_COUNT = 3
const BADGE_LABEL: Record<string, string> = { post: '投稿', fix: '修正', comment: 'コメント' }

const commentEntries = useCommentEntries()

const byDateDesc = (a: LogEntry, b: LogEntry) => b.date.localeCompare(a.date)

// コメントを上、更新履歴を下に置く（更新履歴ページと同じ並び）。コメントが無い間は更新履歴だけ出す
const groups = computed(() => {
  const list: { heading: string; items: LogEntry[] }[] = []
  const comments = [...commentEntries.value].sort(byDateDesc).slice(0, RECENT_COMMENT_COUNT)
  if (comments.length > 0) list.push({ heading: 'みなさんからのコメント', items: comments })
  list.push({ heading: '更新', items: [...updates].sort(byDateDesc).slice(0, RECENT_UPDATE_COUNT) })
  return list
})
</script>

<style scoped>
.git-history {
  margin: 16px 8px 8px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 12px;
  font-size: 11px;
}

.git-history summary {
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  letter-spacing: 0.05em;
  user-select: none;
  margin-bottom: 8px;
  list-style: none;
}
.git-history summary::before {
  content: '▾ ';
}
details:not([open]) summary::before {
  content: '▸ ';
}

.gh-heading {
  margin: 8px 0 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--vp-c-text-2);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  line-height: 1.5;
}

.gh-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  margin-right: 4px;
  vertical-align: middle;
}
.gh-badge.post {
  background: #e8f0fe;
  color: #1a3a6b;
}
.gh-badge.fix {
  background: #fce8e8;
  color: #6b1a1a;
}
.gh-badge.comment {
  background: #e6f4ea;
  color: #1a4d2e;
}

.gh-date {
  display: inline;
  color: var(--vp-c-text-2);
  font-size: 10px;
  margin-right: 4px;
}

.gh-text {
  display: inline;
  color: var(--vp-c-text-1);
  word-break: keep-all;
  text-decoration: none;
}
a.gh-text:hover {
  text-decoration: underline;
}

.gh-all {
  display: block;
  margin-top: 8px;
  font-size: 10px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.gh-all:hover {
  text-decoration: underline;
}
</style>
