---
title: アイテム一覧
description: Anno 117の全アイテムをニッチ・レアリティ別に一覧表示。効果・入手方法を日本語で整理。
---

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { data } from './items.data.ts'

const selRegion = ref('')
const selRarity = ref('')
const selNiche = ref('')
const selTarget = ref('')
const selName = ref('')
// 対象の総称と内訳で、建物がこれより多い総称（生産施設など）は折りたたむ
const POOL_COLLAPSE_COUNT = 20
// 建物効果の「関連アイテム」のリンクから来たときは、建物名が完全に一致するものだけに絞る（件数と一覧を合わせるため）。
// 総称の名前は建物名と同じでも中身が違うことがある（総称「貯水池」の中身は水源とノリア）ので、建物名だけで照合する。
// 入力欄を触ったら、これまでどおり部分一致にする
const exactTarget = ref(false)
watch(selTarget, () => { exactTarget.value = false })
const matchTarget = (t: string) => exactTarget.value ? t === selTarget.value.trim() : t.includes(selTarget.value.trim())
const filtered = computed(() => data.items.filter(i =>
  // 対象から地域が決まらないアイテム（船のアイテムなど）は、どの地域を選んでも出す
  (!selRegion.value || i.regions.length === 0 || i.regions.includes(selRegion.value)) &&
  (!selRarity.value || i.rarityJa === selRarity.value) &&
  (!selNiche.value || i.nicheJa === selNiche.value) &&
  (!selTarget.value.trim() || (exactTarget.value ? i.targetBuildings : [...i.targets.split('、'), ...i.targetBuildings]).some(matchTarget)) &&
  (!selName.value || i.nameJa.includes(selName.value.trim()))
))

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const target = params.get('target')
  if (target) {
    selTarget.value = target
    if (params.get('exact') === '1') nextTick(() => { exactTarget.value = true })
  }
  document.addEventListener('click', hideSourcePopover)
})
onUnmounted(() => {
  document.removeEventListener('click', hideSourcePopover)
})

// 取得先ポップオーバー: PCはホバー(mouseenter/leave)、モバイルはタップ(click)で開閉する。
// トリガーのclickはstopPropagationしているので、それ以外の場所をクリックするとdocument側の
// リスナーでhideSourcePopoverが呼ばれて閉じる。
type ItemRow = (typeof data.items)[number]
const sourcePopover = ref<{ guid: string; item: ItemRow; x: number; y: number } | null>(null)

function showSourcePopover(item: ItemRow, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = Math.min(rect.left, window.innerWidth - 280)
  sourcePopover.value = { guid: item.guid, item, x: Math.max(8, x), y: rect.bottom + 6 }
}
function hideSourcePopover() {
  sourcePopover.value = null
}
function toggleSourcePopover(item: ItemRow, event: MouseEvent) {
  if (sourcePopover.value?.guid === item.guid) {
    hideSourcePopover()
  } else {
    showSourcePopover(item, event)
  }
}

function resetFilters(): void {
  selRegion.value = ''
  selRarity.value = ''
  selNiche.value = ''
  selTarget.value = ''
  selName.value = ''
}

function fmtPrice(item: { price: string; obsidianPrice: number | null }): string {
  if (item.obsidianPrice !== null) return `黒曜石 ${item.obsidianPrice}`
  const p = item.price
  if (!p) return '—'
  const n = Number(p)
  if (!Number.isFinite(n) || n === 0) return p || '—'
  if (n >= 1_000_000) return (n / 1_000_000).toString().replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toString().replace(/\.0$/, '') + 'k'
  return String(n)
}
</script>

# アイテム一覧

Anno 117 の専門家が装着できる全アイテムの一覧です。地域・分類・レアリティ・対象・効果・価格を掲載しています。

使い方は次のとおりです。

- 下の絞り込み欄で表を絞れます。複数を指定すると、すべてに当てはまるアイテムだけが残ります。
  - アイテム名: 名前の一部を入れると絞り込めます。
  - 地域・レアリティ・分類: 一覧から選びます。
  - 対象名: 名前の一部を入れると絞り込めます。入力すると候補も出ます。「生産チェーン」や「農場」のような総称が対象のアイテムも、中の建物名（カイク工房など）で探せます。
- 「リセット」で、指定した条件をすべて解除します。右側の件数は、表示中のアイテム数です。
- 「対象」欄の名前をクリックすると、その建物・生産チェーン・住居のページに移動します。
- 「取得先」は、PCならマウスを乗せる、スマホならタップすると、入手先が出ます。
- 「対象」欄にある総称(「住居」「船」以外)の内訳は、ページ下部にまとめています。

「地域」は、アイテムの効果の対象になる建物がどの地域にあるかで決めています（ゲーム内データ、アップデート3.0）。船のアイテムなど、対象から地域が決まらないものは「指定なし」で、どの地域を選んでも表示します。実機での確認はまだです。

<div class="item-filters">
  <label><strong>アイテム名:</strong>
    <input type="text" v-model="selName" placeholder="アイテム名で検索" />
  </label>
  <label><strong>地域:</strong>
    <select v-model="selRegion">
      <option value="">すべて</option>
      <option v-for="r in data.regionOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
    </select>
  </label>
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
    <input type="text" v-model="selTarget" list="item-target-list" placeholder="対象名で検索" />
    <datalist id="item-target-list">
      <option v-for="t in data.targets" :key="t" :value="t" />
    </datalist>
  </label>
  <div class="item-filters-footer">
    <button type="button" class="item-filter-reset" @click="resetFilters">リセット</button>
    <span class="item-count">{{ filtered.length }} 件</span>
  </div>
</div>

<a href="#対象の総称と内訳" class="item-legend-jumplink">「対象」の総称の内訳を見る ↓</a>

<style scoped>
.item-legend-jumplink {
  display: none;
}

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
.item-filters-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.item-filter-reset {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  cursor: pointer;
}
.item-filter-reset:hover {
  background: var(--vp-c-bg-mute);
}
.item-count {
  color: var(--vp-c-text-2);
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
.item-source-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.item-source-popover {
  position: fixed;
  z-index: 100;
  max-width: 320px;
  padding: 10px 12px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg-soft));
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}
.item-source-popover-label {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}
.item-source-popover-list {
  margin: 0;
  padding-left: 1.2em;
  max-height: 240px;
  overflow-y: auto;
}
.item-source-popover-list li {
  margin: 2px 0;
}
.item-source-popover-caution {
  margin-top: 6px;
  color: #92400e;
  font-size: 0.8rem;
}
.item-boost-block {
  margin-top: 6px;
  padding: 5px 8px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.92em;
  line-height: 1.5;
}
.item-boost-label {
  font-weight: 700;
  font-size: 0.9em;
  margin-bottom: 2px;
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
    top: var(--local-nav-height, var(--vp-nav-height));
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
  .item-filters-footer {
    grid-column: 1 / -1;
    margin-left: 0;
    justify-content: space-between;
  }
  .item-count {
    font-size: 0.8rem;
  }
  .item-filter-reset {
    padding: 4px 10px;
    font-size: 0.75rem;
  }
  .item-legend-jumplink {
    display: inline-block;
    margin: 10px 0 4px;
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
<tr><th>名称</th><th style="white-space:nowrap;">地域</th><th>レアリティ</th><th>分類</th><th>対象</th><th>効果</th><th>価格</th></tr>
</thead>
<tbody>
<tr v-for="item in filtered" :key="item.guid">
<td style="white-space:normal;">
  <div style="min-width:350px;word-break:break-all;">
    {{ item.nameJa }}
    <span v-if="item.caution" class="item-caution-badge" :title="item.caution">未確認</span>
    <span
      v-if="item.source.length"
      class="item-source-badge"
      @mouseenter="showSourcePopover(item, $event)"
      @mouseleave="hideSourcePopover"
      @click.stop="toggleSourcePopover(item, $event)"
    >取得先</span>
  </div>
</td>
<td style="white-space:nowrap;"><div v-for="r in item.regionLabels" :key="r">{{ r }}</div></td>
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
<td style="white-space:normal;">
  {{ item.effects.length ? item.effects.join('、') : '—' }}
  <div v-if="item.boostEffects.length || item.boostHint || item.boostCondition" class="item-boost-block">
    <div class="item-boost-label">覚醒<template v-if="item.boostHint">: {{ item.boostHint }}</template><template v-if="item.boostCondition">（条件: {{ item.boostCondition }}）</template></div>
    <div>{{ item.boostEffects.length ? item.boostEffects.join('、') : '覚醒後の効果は未確認です' }}</div>
  </div>
</td>
<td>{{ fmtPrice(item) }}</td>
</tr>
</tbody>
</table>
</div>

<div class="items-card-list">
<div class="item-card" v-for="item in filtered" :key="item.guid">
  <div class="item-card-header">
    <span>{{ item.nameJa }}</span>
    <span v-if="item.caution" class="item-caution-badge" :title="item.caution">未確認</span>
    <span
      v-if="item.source.length"
      class="item-source-badge"
      @click.stop="toggleSourcePopover(item, $event)"
    >取得先</span>
  </div>
  <div class="item-card-body">
    <div class="item-card-meta">
      <span><span class="item-card-label">地域:</span> {{ item.regionLabels.join('／') }}</span>
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
    <div v-if="item.boostEffects.length || item.boostHint || item.boostCondition" class="item-card-row item-boost-block">
      <div class="item-boost-label">覚醒<template v-if="item.boostHint">: {{ item.boostHint }}</template><template v-if="item.boostCondition">（条件: {{ item.boostCondition }}）</template></div>
      <div>{{ item.boostEffects.length ? item.boostEffects.join('、') : '覚醒後の効果は未確認です' }}</div>
    </div>
    <div class="item-card-row">
      <span class="item-card-label">価格:</span>
      <span>{{ fmtPrice(item) }}</span>
    </div>
  </div>
</div>
</div>

<Teleport to="body">
  <div
    v-if="sourcePopover"
    class="item-source-popover"
    :style="{ left: sourcePopover.x + 'px', top: sourcePopover.y + 'px' }"
    @mouseleave="hideSourcePopover"
    @click.stop
  >
    <div class="item-source-popover-label">取得先</div>
    <ul class="item-source-popover-list">
      <li v-for="(s, i) in sourcePopover.item.source" :key="i">{{ s }}</li>
    </ul>
    <div v-if="sourcePopover.item.sourceCaution" class="item-source-popover-caution">※内部名から独自に意訳した箇所を含むため、未確認です</div>
  </div>
</Teleport>

## 対象の総称と内訳

アイテムの「対象」欄に出てくる総称が、どの建物を指すかの一覧です。ゲーム内データ（アップデート3.0）から作っていて、実機では未確認です。

- 建物が1つだけの総称と、「○○の生産チェーン」「住居」（全住居層）「生産施設」（ほぼ全ての生産施設）、船の総称は省いています。
- 同じ名前の建物が地域ごとにある場合は、1つにまとめています。

<div class="stack-table">
<table>
<thead><tr><th>総称</th><th>含まれる建物</th></tr></thead>
<tbody>
<tr v-for="pool in data.pools" :key="pool.name">
<td style="white-space:nowrap;">{{ pool.name }}</td>
<td>
<details v-if="pool.buildings.length > POOL_COLLAPSE_COUNT"><summary>{{ pool.buildings.length }}件の建物（開く）</summary>{{ pool.buildings.join('・') }}</details>
<template v-else>{{ pool.buildings.join('・') }}</template>
</td>
</tr>
</tbody>
</table>
</div>

## 関連データ

- [建物効果](/wiki/buildings) — アイテム効果の対象になる建物
- [スキルツリー](/wiki/techs) — 専門家を解放できるスキル

## 関連ガイド

- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 専門家の装着先・入手方法
