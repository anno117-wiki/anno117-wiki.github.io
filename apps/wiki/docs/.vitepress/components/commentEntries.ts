import { ref, onMounted, type Ref } from 'vue'
import { data as pageTitles } from '../../page-titles.data'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string
const SUMMARY_LENGTH = 30

interface WorkerReply {
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
  replies: WorkerReply[]
}

export interface ReplyEntry {
  date: string
  author: string
  summary: string
}

// 更新履歴の1行。記事の更新(updates.json)とコメントを同じ形で扱う
export interface LogEntry {
  date: string
  type: string
  title: string
  link?: string
  summary?: string
  replies?: ReplyEntry[]
}

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
function toEntry(c: WorkerComment): LogEntry | null {
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

// 左サイドバーと更新履歴ページの両方が使うので、ページを移っても取得は1回にする（失敗したら次回やり直す）
let cached: Promise<LogEntry[]> | null = null

async function fetchCommentEntries(): Promise<LogEntry[]> {
  const res = await fetch(`${WORKER_URL}/comments`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const list: WorkerComment[] = await res.json()
  return list.map(toEntry).filter((e): e is LogEntry => e !== null)
}

// コメントは実行時にWorkerから取る。取れなくても呼び出し側は更新履歴だけで表示できる
export function useCommentEntries(): Ref<LogEntry[]> {
  const entries = ref<LogEntry[]>([])
  onMounted(async () => {
    if (!WORKER_URL) return
    try {
      cached ??= fetchCommentEntries()
      entries.value = await cached
    } catch (e) {
      cached = null
      console.warn('コメントの取得に失敗しました', e)
    }
  })
  return entries
}
