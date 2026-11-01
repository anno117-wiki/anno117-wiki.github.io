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
import { computed, ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import updates from '../data/updates.json'
import { data as pageTitles } from '../../page-titles.data'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string
const SUMMARY_LENGTH = 30

const BADGE_LABEL: Record<string, string> = { post: '追加', fix: '修正', comment: 'コメント' }

interface Reply {
  author: string
  body: string
  createdAt: string
}

interface WorkerComment {
  title: string
  name: string
  type: string
  body: string
  createdAt: string
  replies: Reply[]
}

interface ReplyEntry {
  date: string
  author: string
  summary: string
}

interface Entry {
  date: string
  type: string
  title: string
  link?: string
  summary?: string
  replies?: ReplyEntry[]
}

const commentEntries = ref<Entry[]>([])

function excerpt(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > SUMMARY_LENGTH ? `${oneLine.slice(0, SUMMARY_LENGTH)}…` : oneLine
}

// Issueタイトルは "[種別] ページパス.md — 投稿者名" の形式（cf-worker/comment-api.js）
function pageOf(title: string): string | null {
  const m = title.match(/^\[[^\]]*\]\s+(.+?)\.md\s+—\s/)
  return m ? m[1] : null
}

// 返信は別行にせず、元コメントの下にぶら下げる
function toEntry(c: WorkerComment): Entry | null {
  const page = pageOf(c.title)
  if (!page) return null
  return {
    date: c.createdAt.slice(0, 10),
    type: 'comment',
    title: `${pageTitles[page] ?? page}に${c.type}（${c.name}）`,
    link: `/${page}#comments`,
    summary: excerpt(c.body),
    replies: (c.replies ?? []).map((r) => ({
      date: r.createdAt.slice(0, 10),
      author: r.author,
      summary: excerpt(r.body),
    })),
  }
}

// コメントは実行時にWorkerから取る。取れなくても更新履歴だけは出す
onMounted(async () => {
  if (!WORKER_URL) return
  try {
    const res = await fetch(`${WORKER_URL}/comments`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list: WorkerComment[] = await res.json()
    commentEntries.value = list.map(toEntry).filter((e): e is Entry => e !== null)
  } catch (e) {
    console.warn('コメントの取得に失敗しました', e)
  }
})

const entries = computed<Entry[]>(() =>
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
