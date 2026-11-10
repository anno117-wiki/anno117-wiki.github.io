<template>
  <div class="update-log">
    <section v-for="section in sections" :key="section.id" class="ul-section">
      <h2 :id="section.id">{{ section.heading }}</h2>
      <div class="ul-list">
        <div v-for="(entry, i) in section.items" :key="i" class="update-entry">
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
      <button v-if="section.canExpand" type="button" class="ul-more" @click="showAllComments = true">
        もっと見る（全{{ comments.length }}件）
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import updates from '../data/updates.json'
import { useCommentEntries, type LogEntry } from './commentEntries'

const BADGE_LABEL: Record<string, string> = { post: '追加', fix: '修正', comment: 'コメント' }

// 最初に見せるコメントの件数。残りは「もっと見る」で開く
const INITIAL_COMMENT_COUNT = 5

const commentEntries = useCommentEntries()
const showAllComments = ref(false)

const byDateDesc = (a: LogEntry, b: LogEntry) => b.date.localeCompare(a.date)
const comments = computed<LogEntry[]>(() => [...commentEntries.value].sort(byDateDesc))
const updateEntries = computed<LogEntry[]>(() => [...updates].sort(byDateDesc))

// コメントを上、更新履歴を下に置く。コメントが無い間（読み込み中・取得失敗）はコメント枠ごと出さない
const sections = computed(() => {
  const hasMore = !showAllComments.value && comments.value.length > INITIAL_COMMENT_COUNT
  const list = []
  if (comments.value.length > 0) {
    list.push({
      id: 'comments-from-everyone',
      heading: 'みなさんからのコメント',
      items: hasMore ? comments.value.slice(0, INITIAL_COMMENT_COUNT) : comments.value,
      canExpand: hasMore,
    })
  }
  list.push({ id: 'update-history', heading: '更新履歴', items: updateEntries.value, canExpand: false })
  return list
})
</script>

<style scoped>
.update-log {
  margin-top: 16px;
}

.ul-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.ul-more {
  margin-top: 12px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.ul-more:hover {
  border-color: var(--vp-c-brand-1);
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
