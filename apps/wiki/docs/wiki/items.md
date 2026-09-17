---
title: アイテム一覧
description: Anno 117の全アイテムをニッチ・レアリティ別に一覧表示。効果・入手方法を日本語で整理。
---

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { data } from './items.data.ts'

const selRarity = ref('')
const selNiche = ref('')
const selTarget = ref('')
const filtered = computed(() => data.items.filter(i =>
  (!selRarity.value || i.rarityJa === selRarity.value) &&
  (!selNiche.value || i.nicheJa === selNiche.value) &&
  (!selTarget.value || i.targets.includes(selTarget.value))
))

onMounted(() => {
  const target = new URLSearchParams(window.location.search).get('target')
  if (target) selTarget.value = target
})

function fmtPrice(p: string): string {
  if (!p) return '—'
  const n = Number(p)
  if (!Number.isFinite(n) || n === 0) return p || '—'
  if (n >= 1_000_000) return (n / 1_000_000).toString().replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toString().replace(/\.0$/, '') + 'k'
  return String(n)
}
</script>

# アイテム一覧

Anno 117 の専門家が装着できる全アイテムの一覧です。分類・レアリティ・対象・効果・価格を掲載しています。

各項目でソートができます。対象の名称をクリックで関連アイテムを確認できます。

<div class="item-filters">
  <label><strong>レアリティ:</strong>
    <select v-model="selRarity">
      <option value="">すべて</option>
      <option v-for="r in data.rarities" :key="r" :value="r">{{ r }}</option>
    </select>
  </label>
  <label><strong>分類:</strong>
    <select v-model="selNiche">
      <option value="">すべて</option>
      <option v-for="n in data.niches" :key="n" :value="n">{{ n }}</option>
    </select>
  </label>
  <label><strong>対象:</strong>
    <input type="text" v-model="selTarget" list="item-target-list" placeholder="名称で検索" />
    <datalist id="item-target-list">
      <option v-for="t in data.targets" :key="t" :value="t" />
    </datalist>
  </label>
  <span class="item-count">{{ filtered.length }} 件</span>
</div>

<style scoped>
.item-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin: 12px 0;
  padding: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.item-filters label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-filters select,
.item-filters input[type="text"] {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  min-width: 140px;
}
.item-filters select {
  cursor: pointer;
}
.item-count {
  color: var(--vp-c-text-2);
  margin-left: auto;
}
.item-caution-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  cursor: help;
  white-space: nowrap;
}

/* PC(>=960px): 既存テーブル表示、モバイルカードは非表示 */
.items-card-list {
  display: none;
}

/* モバイル(<=959px): テーブルの代わりにカード表示 */
@media (max-width: 959px) {
  .items-table-wrap {
    display: none;
  }
  .items-card-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 16px 0;
  }
  .item-filters {
    position: sticky;
    top: var(--vp-nav-height);
    z-index: 10;
    margin-bottom: 0 !important;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 8px;
    padding: 8px 10px;
  }
  .item-filters label {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 0.75rem;
  }
  .item-filters select,
  .item-filters input[type="text"] {
    width: 100%;
    min-width: 0;
    padding: 4px 6px;
    font-size: 0.8rem;
  }
  .item-count {
    grid-column: 1 / -1;
    margin-left: 0;
    text-align: right;
    font-size: 0.8rem;
  }
}

.item-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.item-card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
  font-weight: 700;
  word-break: break-word;
}
.item-card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}
.item-card-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.item-card-row {
  display: block;
}
.item-card-label {
  color: var(--vp-c-text-2);
  margin-right: 4px;
}
</style>

<div class="items-table-wrap">
<table>
<thead>
<tr><th>名称</th><th>レアリティ</th><th>分類</th><th>対象</th><th>効果</th><th>価格</th></tr>
</thead>
<tbody>
<tr v-for="item in filtered" :key="item.guid">
<td style="white-space:normal;">
  <div style="min-width:350px;word-break:break-all;">
    {{ item.nameJa }}
    <span v-if="item.caution" class="item-caution-badge" :title="item.caution">要検証</span>
  </div>
</td>
<td>{{ item.rarityJa }}</td>
<td>{{ item.nicheJa }}</td>
<td style="white-space:normal;">
  <template v-if="item.targetLinks.length">
    <template v-for="(t, i) in item.targetLinks" :key="i">
      <a v-if="t.href" :href="withBase(t.href)">{{ t.name }}</a>
      <span v-else>{{ t.name }}</span>
      <span v-if="i < item.targetLinks.length - 1">、</span>
    </template>
  </template>
  <template v-else>—</template>
</td>
<td style="white-space:normal;">{{ item.effects.length ? item.effects.join('、') : '—' }}</td>
<td>{{ fmtPrice(item.price) }}</td>
</tr>
</tbody>
</table>
</div>

<div class="items-card-list">
<div class="item-card" v-for="item in filtered" :key="item.guid">
  <div class="item-card-header">
    <span>{{ item.nameJa }}</span>
    <span v-if="item.caution" class="item-caution-badge" :title="item.caution">要検証</span>
  </div>
  <div class="item-card-body">
    <div class="item-card-meta">
      <span><span class="item-card-label">レアリティ:</span> {{ item.rarityJa }}</span>
      <span><span class="item-card-label">分類:</span> {{ item.nicheJa }}</span>
    </div>
    <div class="item-card-row">
      <span class="item-card-label">対象:</span>
      <span>
        <template v-if="item.targetLinks.length">
          <template v-for="(t, i) in item.targetLinks" :key="i">
            <a v-if="t.href" :href="withBase(t.href)">{{ t.name }}</a>
            <span v-else>{{ t.name }}</span>
            <span v-if="i < item.targetLinks.length - 1">、</span>
          </template>
        </template>
        <template v-else>—</template>
      </span>
    </div>
    <div class="item-card-row">
      <span class="item-card-label">効果:</span>
      <span>{{ item.effects.length ? item.effects.join('、') : '—' }}</span>
    </div>
    <div class="item-card-row">
      <span class="item-card-label">価格:</span>
      <span>{{ fmtPrice(item.price) }}</span>
    </div>
  </div>
</div>
</div>

## 関連ガイド

- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 専門家の装着先・入手方法
