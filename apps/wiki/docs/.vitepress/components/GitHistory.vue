<template>
  <details class="git-history" open>
    <summary>更新履歴</summary>
    <ul>
      <li v-for="(entry, i) in recent" :key="i">
        <span class="gh-badge" :class="entry.type">{{ entry.type === 'post' ? '投稿' : '修正' }}</span>
        <span class="gh-date">{{ entry.date }}</span>
        <a v-if="entry.link" class="gh-text" :href="withBase(entry.link)">{{ entry.title }}</a>
        <span v-else class="gh-text">{{ entry.title }}</span>
      </li>
    </ul>
    <a class="gh-all" :href="withBase('/updates')">すべて見る →</a>
  </details>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import updates from '../data/updates.json'

const recent = updates.slice(0, 5)
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

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gh-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  width: fit-content;
}
.gh-badge.post {
  background: #e8f0fe;
  color: #1a3a6b;
}
.gh-badge.fix {
  background: #fce8e8;
  color: #6b1a1a;
}

.gh-date {
  color: var(--vp-c-text-2);
  font-size: 10px;
}

.gh-text {
  color: var(--vp-c-text-1);
  line-height: 1.4;
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
