---
title: スキルツリー
description: Anno 117のスキルツリーを5ブランチ・204件のスキルで一覧表示。ブランチごとのページで研究順序と効果を日本語で確認できる。
---

<script setup lang="ts">
import { data } from './techs.data.ts'

const branchLabelMap: Record<string, string> = {
  economy: '経済', civic: '市民', military: '軍事',
  dlc01: '灰の予言', dlc02: '競馬場', dlc03: 'デルタの夜明け',
}
const branchColorMap: Record<string, string> = {
  economy: '#16a34a', civic: '#7c3aed', military: '#dc2626', dlc01: '#d97706', dlc02: '#0891b2', dlc03: '#059669',
}
const branchPageMap: Record<string, string> = {
  economy: '/wiki/techs-economy', civic: '/wiki/techs-civic', military: '/wiki/techs-military',
  dlc01: '/wiki/techs-dlc01', dlc02: '/wiki/techs-dlc02', dlc03: '/wiki/techs-dlc03',
}
function getBranchDisplayLabel(b: string): string {
  if (branchLabelMap[b]) return branchLabelMap[b]
  const m = b.match(/^dlc(\d+)$/)
  if (m) return `DLC${Number(m[1])}`
  return b
}
</script>

# スキルツリー

知識を消費して解放できるスキルの一覧です。ブランチごとにページを分けています。見たいブランチを選んでください。

<div class="branch-links">
  <a
    v-for="b in data.branches"
    :key="b"
    :href="branchPageMap[b] || '#'"
    class="branch-link"
    :style="`border-left-color: ${branchColorMap[b] || '#888'};`"
  >
    <span class="branch-link-name">{{ getBranchDisplayLabel(b) }}</span>
    <span class="branch-link-count">{{ (data.byBranch[b] || []).length }}件</span>
  </a>
</div>

<style scoped>
.branch-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 24px 0;
}
.branch-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 1px solid var(--vp-c-divider);
  border-left: 4px solid #888;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: background-color 0.15s;
}
.branch-link:hover {
  background: var(--vp-c-bg-elv, var(--vp-c-bg-soft));
}
.branch-link-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.branch-link-count {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>

## 関連ガイド

- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 研究システムの仕組みと専門家の活用法
