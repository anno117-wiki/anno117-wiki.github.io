---
title: スキルツリー・経済
description: Anno 117の経済スキルツリー（55件）。研究順序と効果を日本語で確認できる。
outline: false
---

<script setup lang="ts">
import { data } from './techs.data.ts'
</script>

# スキルツリー・経済

知識を消費して解放できる経済スキルの一覧です。**ゲート**（太枠）は次フェーズへの解放条件です。セルをクリックすると詳細を確認できます。

<SkillTreeBranch branch="economy" :techs="data.byBranch['economy'] || []" :meta="data.branchMeta['economy']" color="#16a34a" />

## 関連ガイド

- [スキルツリー一覧](/wiki/techs) — 他のブランチを見る
- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 研究システムの仕組みと専門家の活用法
