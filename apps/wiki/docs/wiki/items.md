<script setup lang="ts">
import { data } from './items.data.ts'

const totalItems = Object.values(data.byNiche).reduce((n, arr) => n + arr.length, 0)
</script>

# アイテム一覧

Anno 117 で使用できる全 {{ totalItems }} アイテムの一覧です。

::: tip 出典・日本語対応状況
出典: Anno 117 公式ゲームデータ（Item Inspector 抽出データより生成）。アイテム名・説明・効果は公式日本語。効果の一部（軍事・海事）は機械訳のため表現が粗い場合があります。
:::

<div v-for="niche in data.niches" :key="niche">

<h2>{{ niche }}</h2>

<table>
<thead>
<tr><th>名称</th><th>レアリティ</th><th>効果</th><th>説明</th><th>価格</th></tr>
</thead>
<tbody>
<tr v-for="item in data.byNiche[niche]" :key="item.guid">
<td>{{ item.nameJa }}</td>
<td>{{ item.rarityJa }}</td>
<td>{{ item.effects.length ? item.effects.join('、') : '—' }}</td>
<td>{{ item.description || '—' }}</td>
<td>{{ item.price || '—' }}</td>
</tr>
</tbody>
</table>

</div>
