<template>
  <div class="update-log">
    <div v-for="(entry, i) in updates" :key="i" class="update-entry">
      <div class="update-meta">
        <span class="ul-badge" :class="entry.type">{{ entry.type === 'post' ? '追加' : '修正' }}</span>
        <span class="ul-date">{{ entry.date }}</span>
      </div>
      <div class="update-body">
        <a v-if="entry.link" class="ul-title" :href="withBase(entry.link)">{{ entry.title }}</a>
        <span v-else class="ul-title">{{ entry.title }}</span>
        <p v-if="entry.summary" class="ul-summary">{{ entry.summary }}</p>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import updates from '../data/updates.json'
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
