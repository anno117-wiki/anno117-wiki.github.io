---
title: スキルツリー・軍事
description: Anno 117の軍事スキルツリー（58件）。研究順序と効果を日本語で確認できる。
outline: false
---

<script setup lang="ts">
import { data } from './techs.data.ts'
</script>

# スキルツリー・軍事

知識を消費して解放できる軍事スキルの一覧です。**ゲート**（太枠）は次フェーズへの解放条件です。セルをクリックすると詳細を確認できます。

<SkillTreeBranch branch="military" :techs="data.byBranch['military'] || []" :meta="data.branchMeta['military']" color="#dc2626" />

## 関連ガイド

- [スキルツリー一覧](/wiki/techs) — 他のブランチを見る
- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 研究システムの仕組みと専門家の活用法
