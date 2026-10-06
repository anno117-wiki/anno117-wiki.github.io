<template>
  <!-- ツリー図はホバー/クリックでしか効果文を出さないため、検索エンジンにも読める形で全効果を一覧化する。
       初期状態は閉じておき、ツリー図の見た目は変えない。 -->
  <details class="skill-effect-list">
    <summary>スキル効果一覧（{{ techs.length }}件）</summary>
    <table>
      <thead>
        <tr>
          <th>スキル</th>
          <th>効果</th>
          <th>知識コスト</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tech in sortedTechs" :key="tech.guid">
          <td class="name">
            {{ tech.label }}
            <span v-if="tech.isGate" class="gate">ゲート</span>
          </td>
          <td>{{ stripTags(tech.effectJa) || '—' }}</td>
          <td class="cost">{{ tech.knowledgeCost ? formatKnowledge(tech.knowledgeCost) : '—' }}</td>
        </tr>
      </tbody>
    </table>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { stripTags, formatKnowledge } from './techFormat'

interface TechEntry {
  guid: string
  label: string
  isGate: boolean
  knowledgeCost: number | null
  effectJa: string
  gridX: number
  annoR?: number
}

const props = defineProps<{ techs: TechEntry[] }>()

// 研究を進める順に並べる。ツリー図は根元（最初のゲート）が下の段にあるため、
// 下の段から上へ、各段は左から右の順にする
const sortedTechs = computed(() =>
  [...props.techs].sort((a, b) => (b.annoR ?? 0) - (a.annoR ?? 0) || a.gridX - b.gridX),
)
</script>

<style scoped>
.skill-effect-list {
  margin-top: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 8px 12px;
}
.skill-effect-list summary {
  cursor: pointer;
  font-weight: 600;
}
.skill-effect-list table {
  margin-top: 12px;
  font-size: 0.85rem;
}
.skill-effect-list th,
.name {
  white-space: nowrap;
}
.gate {
  margin-left: 4px;
  background: #f59e0b;
  color: #fff;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 0.7rem;
  font-weight: 600;
}
.cost {
  white-space: nowrap;
  text-align: right;
}

/* モバイルでは3列の表だと効果文が細く折り返すため、1スキル=1カードの縦並びにする。
   DOMは表のまま（検索エンジン向けの構造を変えない）で、見た目だけ切り替える。 */
@media (max-width: 959px) {
  .skill-effect-list table,
  .skill-effect-list tbody,
  .skill-effect-list tr,
  .skill-effect-list td {
    display: block;
    width: 100%;
  }
  .skill-effect-list table {
    overflow-x: visible;
    border: none;
  }
  .skill-effect-list thead {
    display: none;
  }
  .skill-effect-list tr {
    margin-bottom: 8px;
    padding: 8px 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background: var(--vp-c-bg-soft);
  }
  .skill-effect-list td {
    padding: 0;
    border: none;
    background: transparent;
  }
  .name {
    white-space: normal;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .cost {
    margin-top: 4px;
    text-align: left;
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
  }
  .cost::before {
    content: '知識コスト ';
  }
}
</style>
