<template>
  <div class="update-log">
    <div v-for="(entry, i) in entries" :key="i" class="update-entry">
      <div class="update-meta">
        <span class="ul-badge" :class="entry.type">{{ BADGE_LABEL[entry.type] }}</span>
        <span class="ul-date">{{ entry.date }}</span>
      </div>
      <div class="update-body">
        <a v-if="entry.link" class="ul-title" :href="withBase(entry.link)">{{ entry.title }}</a>
        <span v-else class="ul-title">{{ entry.title }}</span>
        <p v-if="entry.summary" class="ul-summary">{{ entry.summary }}</p>
        <div v-for="(r, j) in entry.replies" :key="j" class="ul-reply">
          <span class="ul-reply-meta">{{ r.author }}・{{ r.date }}</span>
          <p class="ul-summary">{{ r.summary }}</p>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import updates from '../data/updates.json'
import { useCommentEntries, type LogEntry } from './commentEntries'

const BADGE_LABEL: Record<string, string> = { post: '追加', fix: '修正', comment: 'コメント' }

const commentEntries = useCommentEntries()

const entries = computed<LogEntry[]>(() =>
  [...updates, ...commentEntries.value].sort((a, b) => b.date.localeCompare(a.date)),
)
</script>

<style scoped>
.update-log {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.update-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.update-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ul-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.ul-badge.post {
  background: #e8f0fe;
  color: #1a3a6b;
}
.ul-badge.fix {
  background: #fce8e8;
  color: #6b1a1a;
}
.ul-badge.comment {
  background: #e6f4ea;
  color: #1a4d2e;
}

.ul-date {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.ul-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.ul-reply {
  position: relative;
  margin: 8px 0 0 20px;
}
.ul-reply::before {
  content: '';
  position: absolute;
  left: -22px;
  top: -6px;
  width: 18px;
  height: 22px;
  background-color: var(--vp-c-text-2);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 22'%3E%3Cpath d='M2 0V18H12' fill='none' stroke='black' stroke-width='1.6'/%3E%3Cpath d='M11 14.5L17 18L11 21.5Z'/%3E%3C/svg%3E") no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 22'%3E%3Cpath d='M2 0V18H12' fill='none' stroke='black' stroke-width='1.6'/%3E%3Cpath d='M11 14.5L17 18L11 21.5Z'/%3E%3C/svg%3E") no-repeat center / contain;
}
.ul-reply-meta {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
a.ul-title:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.ul-summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
