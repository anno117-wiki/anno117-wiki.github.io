---
title: 生産チェーン一覧
description: Anno 117の商品ごとの生産チェーンをMermaid図で可視化。必要建物・原材料の関係を一覧で確認できる。
---

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { withBase, useData } from 'vitepress'
import { data } from './production-chains.data.ts'
import ProductionChainSvg from '../.vitepress/components/ProductionChainSvg.vue'

const categoryLabels: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
}

const regionLabels: Record<string, string> = {
  Roman: 'ラティウム',
  Celtic: 'アルビオン',
}

function regionText(regions: string[]): string {
  return regions.map((r) => regionLabels[r] ?? r).join(' / ')
}

function timeText(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}分` : `${m}分${s}秒`
}

// SPA遷移直後はテーブルがまだ描画されておらずアンカーへスクロールできないため、
// 描画完了後に改めて該当行までスクロールする。
// テーブル版・カード版のうち画面幅に応じて表示されている方の要素へスクロールする
// 必要があるため、id直指定ではなくdata-anchorを両方に持たせて選別する。
const { hash } = useData()

function scrollToHash() {
  const target = decodeURIComponent(hash.value || '').replace(/^#/, '')
  if (!target) return
  // VitePress自身のページ遷移スクロール処理(nextTick内)と競合するため、
  // それより後に実行されるよう遅延させて上書きする。
  setTimeout(() => {
    const candidates = document.querySelectorAll(`[data-anchor="${CSS.escape(target)}"]`)
    for (const el of candidates) {
      if ((el as HTMLElement).offsetParent !== null) {
        el.scrollIntoView({ block: 'center' })
        return
      }
    }
  }, 100)
}

onMounted(scrollToHash)
watch(hash, scrollToHash)
</script>

# 生産チェーン一覧

各商品の生産に必要な建物・素材・時間をまとめています。
詳細な生産チェーンの計算は[計算機](/calculator/)をご利用ください。
ラティウム・アルビオン地域別の商品分布は[地域別商品](/wiki/regions)をご覧ください。

<div v-for="cat in data.categories" :key="cat">

<h2>{{ categoryLabels[cat] ?? cat }}</h2>

<div class="chain-table-wrap">
<table>
<thead>
<tr><th>商品名</th><th>対応地域</th><th>生産時間</th><th>直接素材</th><th>計算機</th></tr>
</thead>
<tbody>
<tr v-for="entry in data.byCategory[cat]" :key="entry.id" :data-anchor="entry.id">
<td style="white-space:nowrap;">
  <img v-if="entry.icon" :src="withBase('/icons/goods/' + entry.icon + '.png')" :alt="entry.nameJa" style="width:28px;height:28px;vertical-align:middle;margin-right:6px;object-fit:contain;" />
  {{ entry.nameJa }}
</td>
<td>{{ regionText(entry.regions) }}</td>
<td>{{ timeText(entry.timeSeconds) }}</td>
<td>
  {{ entry.inputs.join('、') || '—' }}
  <ProductionChainSvg v-if="entry.graph" :graph="entry.graph" />
</td>
<td><a class="calc-link-btn" :href="withBase(`/calculator/?good=${entry.id}`)" target="_blank" rel="noopener noreferrer">開く</a></td>
</tr>
</tbody>
</table>
</div>

<div class="chain-card-list">
<div class="chain-card" v-for="entry in data.byCategory[cat]" :key="entry.id" :data-anchor="entry.id">
  <div class="chain-card-header">
    <img v-if="entry.icon" :src="withBase('/icons/goods/' + entry.icon + '.png')" :alt="entry.nameJa" class="chain-card-icon" />
    <span class="chain-card-name">{{ entry.nameJa }}</span>
    <a class="calc-link-btn" :href="withBase(`/calculator/?good=${entry.id}`)" target="_blank" rel="noopener noreferrer">開く</a>
  </div>
  <div class="chain-card-body">
    <div class="chain-card-meta">
      <span>{{ regionText(entry.regions) }}</span>
      <span>{{ timeText(entry.timeSeconds) }}</span>
    </div>
    <div class="chain-card-row" v-if="entry.inputs.length">
      <span class="chain-card-label">直接素材:</span>{{ entry.inputs.join('、') }}
    </div>
    <ProductionChainSvg v-if="entry.graph" :graph="entry.graph" />
  </div>
</div>
</div>

</div>

<style scoped>
.chain-card-list {
  display: none;
}

@media (max-width: 959px) {
  .chain-table-wrap {
    display: none;
  }
  .chain-card-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 16px 0;
  }
}

.chain-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.chain-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
}
.chain-card-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}
.chain-card-name {
  font-weight: 700;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.chain-card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}
.chain-card-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}
.chain-card-label {
  color: var(--vp-c-text-2);
  margin-right: 4px;
}
</style>

## 関連ガイド

- [序盤攻略・基本戦略](/guide/early-game-strategy) — 木材生産チェーンなど序盤の組み方
