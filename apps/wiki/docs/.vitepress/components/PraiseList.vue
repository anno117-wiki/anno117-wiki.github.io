<script setup lang="ts">
// 称賛（ゲーム内の実績）の一覧（wiki/praise）。データは tools/build-praise-data.py が作る praise-list.json。
import { computed, ref } from 'vue'
import data from '../../wiki/praise-list.json'

interface Item { title: string; desc: string; grade: '銅' | '銀' | '金' }
interface PraiseSet { name: string; region: string; rewards: string[]; items: Item[] }

const sets = data.sets as PraiseSet[]
const GRADES = ['銅', '銀', '金'] as const
const REGIONS = ['全地域', 'ラティウム', 'アルビオン', 'アイギュプト']

const query = ref('')
const grade = ref('')
const region = ref('')

const total = sets.reduce((n, s) => n + s.items.length, 0)

/** 絞り込んだ結果。条件に合う実績が無いセットは出さない */
const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return sets
    .map((s, i) => ({
      ...s,
      index: i + 1,
      items: s.items.filter(it =>
        (!grade.value || it.grade === grade.value)
        && (!q || it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)),
      ),
    }))
    .filter(s => s.items.length > 0 && (!region.value || s.region === region.value))
})

const shown = computed(() => visible.value.reduce((n, s) => n + s.items.length, 0))

function rewardText(s: PraiseSet): string {
  return s.rewards.length ? `称号「${s.rewards.join('」と「')}」` : ''
}
</script>

<template>
  <div class="pr-root">
    <div class="pr-filter">
      <label class="pr-field">
        <span>検索</span>
        <input v-model="query" type="search" placeholder="名前や条件の言葉" />
      </label>
      <label class="pr-field">
        <span>等級</span>
        <select v-model="grade">
          <option value="">すべて</option>
          <option v-for="g in GRADES" :key="g" :value="g">{{ g }}</option>
        </select>
      </label>
      <label class="pr-field">
        <span>地域</span>
        <select v-model="region">
          <option value="">すべて</option>
          <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
    </div>
    <p class="pr-count">{{ total }}件中 {{ shown }}件を表示しています。</p>

    <p v-if="!visible.length" class="pr-empty">条件に合う称賛はありません。</p>

    <section v-for="s in visible" :key="s.name" class="pr-set">
      <h2 :id="`praise-set-${s.index}`">{{ s.name }}</h2>
      <p class="pr-meta">
        <span class="pr-region">{{ s.region }}</span>
        <span v-if="s.rewards.length">全9件を達成すると、{{ rewardText(s) }}が解除されます。</span>
        <span v-else>全9件を達成しても、称号の報酬はありません。</span>
      </p>
      <ul class="pr-list">
        <li v-for="it in s.items" :key="it.title" class="pr-item">
          <span class="pr-grade" :class="`pr-grade-${it.grade}`">{{ it.grade }}</span>
          <div class="pr-body">
            <strong class="pr-title">{{ it.title }}</strong>
            <span class="pr-desc">{{ it.desc }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.pr-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 12px 0 4px;
}
.pr-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.pr-field input,
.pr-field select {
  padding: 4px 8px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.pr-field input {
  min-width: 14em;
}
.pr-count,
.pr-empty {
  margin: 8px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.pr-meta {
  margin: 4px 0 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.pr-region {
  display: inline-block;
  margin-right: 8px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  color: var(--vp-c-text-1);
}
.pr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.pr-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 8px 12px;
}
.pr-item + .pr-item {
  border-top: 1px solid var(--vp-c-divider);
}
.pr-grade {
  flex: none;
  min-width: 2em;
  padding: 0 6px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid currentColor;
}
.pr-grade-銅 {
  color: #8a4b1f;
}
.pr-grade-銀 {
  color: #5a6470;
}
.pr-grade-金 {
  color: #8a6a00;
}
:root.dark .pr-grade-銅 {
  color: #d9a066;
}
:root.dark .pr-grade-銀 {
  color: #c3ccd6;
}
:root.dark .pr-grade-金 {
  color: #f0c94d;
}
.pr-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pr-title {
  color: var(--vp-c-text-1);
}
.pr-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  overflow-wrap: anywhere;
}

@media (max-width: 959px) {
  .pr-field input {
    min-width: 0;
    width: 100%;
  }
  .pr-field {
    flex: 1 1 100%;
  }
  .pr-field input,
  .pr-field select {
    flex: 1;
  }
}
</style>
