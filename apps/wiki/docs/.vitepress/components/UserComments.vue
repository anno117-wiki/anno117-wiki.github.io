<template>
  <div class="user-comments">
    <h2 class="uc-heading">コメント</h2>

    <!-- コメント一覧 -->
    <p v-if="loading" class="uc-status">読み込み中...</p>
    <p v-else-if="fetchError" class="uc-status uc-error">{{ fetchError }}</p>
    <p v-else-if="comments.length === 0" class="uc-status">まだコメントはありません</p>
    <div v-else class="uc-list">
      <div v-for="c in comments" :key="c.id" class="uc-entry">
        <div class="uc-meta">
          <span class="uc-author">{{ c.name }}</span>
          <span class="uc-badge" :class="c.type">{{ TYPE_LABEL[c.type] ?? c.type }}</span>
          <span class="uc-date">{{ c.createdAt.slice(0, 10) }}</span>
        </div>
        <p class="uc-body">{{ c.body }}</p>
      </div>
    </div>

    <!-- 投稿フォーム -->
    <template v-if="props.showForm">
    <form class="uc-form" @submit.prevent="submit">
      <h3 class="uc-form-title">コメントを投稿する</h3>

      <label class="uc-label">
        名前 <span class="uc-required">*</span>
        <input v-model="form.name" class="uc-input" type="text" required maxlength="100" placeholder="名前を入力" />
      </label>

      <label class="uc-label">
        種別
        <select v-model="form.type" class="uc-select">
          <option value="comment">コメント</option>
          <option value="report">誤り報告</option>
          <option value="bug">バグ報告</option>
        </select>
      </label>

      <label class="uc-label">
        本文 <span class="uc-required">*</span>
        <textarea v-model="form.body" class="uc-textarea" required maxlength="2000" rows="4" placeholder="本文を入力" />
      </label>

      <p v-if="submitError" class="uc-status uc-error">{{ submitError }}</p>
      <p v-if="submitSuccess" class="uc-status uc-success">投稿しました。ご協力ありがとうございます。</p>

      <button class="uc-submit" type="submit" :disabled="submitting">
        {{ submitting ? '送信中...' : '投稿する' }}
      </button>
    </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

const props = withDefaults(defineProps<{ showForm?: boolean; allPages?: boolean }>(), { showForm: true, allPages: false })

const WORKER_URL = 'https://anno-comments.anno117wiki.workers.dev'

const TYPE_LABEL: Record<string, string> = {
  comment: 'コメント',
  report: '誤り報告',
  bug: 'バグ報告',
}

interface Comment {
  id: number
  page: string
  name: string
  type: string
  body: string
  createdAt: string
}

const { page } = useData()

const comments = ref<Comment[]>([])
const loading = ref(false)
const fetchError = ref('')

const form = ref({ name: '', type: 'comment' as 'comment' | 'report' | 'bug', body: '' })
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

async function fetchComments() {
  loading.value = true
  fetchError.value = ''
  try {
    const url = props.allPages
      ? `${WORKER_URL}/comments`
      : `${WORKER_URL}/comments?page=${encodeURIComponent(page.value.relativePath)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    comments.value = await res.json()
  } catch (e) {
    fetchError.value = 'コメントの取得に失敗しました。'
  } finally {
    loading.value = false
  }
}

async function submit() {
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = false
  try {
    const res = await fetch(`${WORKER_URL}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: page.value.relativePath,
        name: form.value.name,
        type: form.value.type,
        body: form.value.body,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    form.value = { name: '', type: 'comment', body: '' }
    submitSuccess.value = true
    await fetchComments()
  } catch (e) {
    submitError.value = '投稿に失敗しました。しばらくしてからもう一度お試しください。'
  } finally {
    submitting.value = false
  }
}

onMounted(fetchComments)
watch(() => page.value.relativePath, fetchComments)
</script>

<style scoped>
.user-comments {
  margin-top: 2rem;
}

.uc-heading {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.uc-status {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 8px 0;
}
.uc-error { color: #c0392b; }
.uc-success { color: #27ae60; }

.uc-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.uc-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.uc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.uc-author {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.uc-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.uc-badge.comment {
  background: #e8f0fe;
  color: #1a3a6b;
}
.uc-badge.report {
  background: #fef9e8;
  color: #6b4a1a;
}
.uc-badge.bug {
  background: #fce8e8;
  color: #6b1a1a;
}

.uc-date {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.uc-body {
  margin: 0;
  font-size: 13px;
  color: var(--vp-c-text-1);
  line-height: 1.6;
  white-space: pre-wrap;
}

/* フォーム */
.uc-form {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uc-form-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
}

.uc-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.uc-required {
  color: #c0392b;
  margin-left: 2px;
}

.uc-input,
.uc-select,
.uc-textarea {
  padding: 7px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.15s;
}
.uc-input:focus,
.uc-select:focus,
.uc-textarea:focus {
  border-color: var(--vp-c-brand-1);
}

.uc-textarea {
  resize: vertical;
  min-height: 80px;
}

.uc-submit {
  align-self: flex-start;
  padding: 8px 20px;
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.uc-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.uc-submit:not(:disabled):hover {
  opacity: 0.85;
}
</style>
