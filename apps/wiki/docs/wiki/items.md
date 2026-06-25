<script setup lang="ts">
import { ref, computed } from 'vue'
import { data } from './items.data.ts'

const selNiche = ref('')
const selRarity = ref('')
const filtered = computed(() => data.items.filter(i =>
  (!selNiche.value || i.nicheJa === selNiche.value) &&
  (!selRarity.value || i.rarityJa === selRarity.value)
))

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

<div class="item-filters">
  <label><strong>分類:</strong>
    <select v-model="selNiche">
      <option value="">すべて</option>
      <option v-for="n in data.niches" :key="n" :value="n">{{ n }}</option>
    </select>
  </label>
  <label><strong>レアリティ:</strong>
    <select v-model="selRarity">
      <option value="">すべて</option>
      <option v-for="r in data.rarities" :key="r" :value="r">{{ r }}</option>
    </select>
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
.item-filters select {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 140px;
}
.item-count {
  color: var(--vp-c-text-2);
  margin-left: auto;
}
</style>

<table>
<thead>
<tr><th>名称</th><th>レアリティ</th><th>分類</th><th>効果</th><th>説明</th><th>価格</th></tr>
</thead>
<tbody>
<tr v-for="item in filtered" :key="item.guid">
<td>{{ item.nameJa }}</td>
<td>{{ item.rarityJa }}</td>
<td>{{ item.nicheJa }}</td>
<td>{{ item.effects.length ? item.effects.join('、') : '—' }}</td>
<td>{{ item.description || '—' }}</td>
<td>{{ fmtPrice(item.price) }}</td>
</tr>
</tbody>
</table>
