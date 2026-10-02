---
title: スキルツリー・市民
description: Anno 117の市民スキルツリー全62件。井戸・トイレ・市場の力・ミネルヴァ信仰など、住民の需要や信仰に関わるスキルの研究順序と効果を日本語で確認できる。
outline: false
---

<script setup lang="ts">
import { data } from './techs.data.ts'
</script>

# スキルツリー・市民

知識を消費して解放できる市民スキルの一覧です。**ゲート**（太枠）は次フェーズへの解放条件です。セルをクリックすると詳細を確認できます。

<SkillTreeBranch branch="civic" :techs="data.byBranch['civic'] || []" :meta="data.branchMeta['civic']" color="#7c3aed" />

## 関連ガイド

- [スキルツリー一覧](/wiki/techs) — 他のブランチを見る
- [研究・スキルツリー・専門家ガイド](/guide/research-guide) — 研究システムの仕組みと専門家の活用法
