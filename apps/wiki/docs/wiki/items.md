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

::: tip 出典・日本語対応状況
出典: Anno 117 公式ゲームデータ（Item Inspector 抽出データより生成）。アイテム名・説明・効果は公式日本語。効果の一部（軍事・海事）は機械訳のため表現が粗い場合があります。
:::

<div style="display:flex;gap:1rem;align-items:center;margin:1rem 0;flex-wrap:wrap">
  <label>ニッチ:
    <select v-model="selNiche" style="margin-left:.4rem">
      <option value="">すべて</option>
      <option v-for="n in data.niches" :key="n" :value="n">{{ n }}</option>
    </select>
  </label>
  <label>レアリティ:
    <select v-model="selRarity" style="margin-left:.4rem">
      <option value="">すべて</option>
      <option v-for="r in data.rarities" :key="r" :value="r">{{ r }}</option>
    </select>
  </label>
  <span>{{ filtered.length }} 件</span>
</div>

<table>
<thead>
<tr><th>名称</th><th>レアリティ</th><th>ニッチ</th><th>効果</th><th>説明</th><th>価格</th></tr>
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
