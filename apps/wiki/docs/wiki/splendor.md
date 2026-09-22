---
title: モニュメントの輝き
description: Anno 117の競馬場・円形闘技場の「輝き」ランク一覧。必要な輝き、自然減少、ランクごとの属性ボーナスと特別な効果を整理。
---

<script setup lang="ts">
import { data } from './splendor.data.ts'

const attrKeys = Object.keys(data.attrs) as (keyof typeof data.attrs)[]

// 属性を ["人口+4", "収入+1"] の形にする（値がある属性だけ、決まった順で）。無ければ ["—"]
const fmt = (o: Record<string, number>) => {
  const list = attrKeys.filter(k => o[k] !== undefined).map(k => `${data.attrs[k]}+${o[k]}`)
  return list.length ? list : ['—']
}

const colorLabel: Record<string, string> = { Bronze: '銅', Silver: '銀', Gold: '金', Maximum: '最大' }
const xpOf = (rank: number) => data.ranks[rank - 1].xp.toLocaleString()
</script>

<style>
/* 属性は途中で折り返さず、属性の区切りで折り返す */
.sp-attr {
  display: inline-block;
  margin-right: 0.6em;
  white-space: nowrap;
}
</style>

# モニュメントの輝き

競馬場と円形闘技場は、レースや試合を開催すると「輝き」が貯まります。輝きが増えるとランクが上がり（I〜X）、モニュメントの効果範囲にボーナスがつきます。

## 輝きのしくみ

- 輝きは、レース（試合）を開催すると貯まります。競馬場では、レースの種類・着順・準備品の供給具合で獲得量が増減します。
- レースを開催していない時間は、輝きが少しずつ減っていきます。ランクが高いほど減り方が速くなります。
- 属性ボーナスは、モニュメントの効果範囲につきます。
- ランクは I〜X の10段階で、必要な輝きと減り方は競馬場・円形闘技場で共通です。

<table>
<thead><tr><th>ランク</th><th>必要な輝き</th><th>1分あたりの減少</th><th>色</th></tr></thead>
<tbody>
<tr v-for="r in data.ranks" :key="r.rank">
<td>{{ r.roman }}</td>
<td>{{ r.xp.toLocaleString() }}</td>
<td>{{ r.decay }}</td>
<td>{{ colorLabel[r.color] ?? r.color }}</td>
</tr>
</tbody>
</table>

競馬場のレース1回で分配される輝きは、公式データ上はアマチュア2,000／クラシック3,000／インペリアル5,000で、着順に応じて 50%／25%／20%／5% に分けられます（<strong>要検証</strong>）。

## ランク別のボーナス

各ランクでは、効果範囲内の建物に属性がつきます。ランクIIからは、効果範囲内のパトリキの住居にも属性が追加されます（後者の対象は公式データ上の定義で、<strong>要検証</strong>）。

## 競馬場

<table>
<thead><tr><th>ランク（必要な輝き）</th><th>効果範囲内の建物</th><th>パトリキの住居（追加）</th><th>特別な効果</th></tr></thead>
<tbody>
<tr v-for="r in data.hippodrome" :key="r.rank">
<td>{{ r.roman }}（{{ xpOf(r.rank) }}）</td>
<td><span v-for="a in fmt(r.main)" :key="a" class="sp-attr">{{ a }}</span></td>
<td><span v-for="a in fmt(r.need)" :key="a" class="sp-attr">{{ a }}</span></td>
<td><template v-if="r.special"><strong v-if="r.special.name">{{ r.special.name }}</strong><template v-if="r.special.name">：</template>{{ r.special.text }}</template><template v-else>—</template></td>
</tr>
</tbody>
</table>

## 円形闘技場

<table>
<thead><tr><th>ランク（必要な輝き）</th><th>効果範囲内の建物</th><th>パトリキの住居（追加）</th><th>特別な効果</th></tr></thead>
<tbody>
<tr v-for="r in data.colosseum" :key="r.rank">
<td>{{ r.roman }}（{{ xpOf(r.rank) }}）</td>
<td><span v-for="a in fmt(r.main)" :key="a" class="sp-attr">{{ a }}</span></td>
<td><span v-for="a in fmt(r.need)" :key="a" class="sp-attr">{{ a }}</span></td>
<td><template v-if="r.special">{{ r.special.text }}</template><template v-else>—</template></td>
</tr>
</tbody>
</table>

## 専門家のレース適性（隠しステータス）

競馬場でレースに出す専門家には、速度・スタミナ・ダッシュ・信頼性という4つの隠しステータスがあります。ゲーム画面には数値が出てこないパラメーターで、試走で候補を見比べながら判断する仕組みです。

数値そのものは公式データが定義する「レアリティごとの生成レンジ」で、実際に専門家1体ごとへ割り振られる値はこの範囲内でランダムに決まります。下表は最終的な値ではなく、あくまで取りうる範囲としてご覧ください。

<table>
<thead><tr><th>レアリティ</th><th>初期値</th><th>追加ポテンシャル</th><th>追加トレーニング回数</th></tr></thead>
<tbody>
<tr><td>コモン</td><td>1〜3</td><td>+3〜+7</td><td>2〜5回</td></tr>
<tr><td>レア</td><td>1〜4</td><td>+2〜+6</td><td>4〜8回</td></tr>
<tr><td>エピック</td><td>2〜4</td><td>+2〜+6</td><td>6〜12回</td></tr>
<tr><td>レジェンダリー</td><td>2〜5</td><td>+1〜+5</td><td>8〜15回</td></tr>
</tbody>
</table>

4つのステータスはどれも同じレンジで決まります（例えばレアなら、速度・スタミナ・ダッシュ・信頼性すべてが初期値1〜4です）。

## 関連ガイド

- [DLC02・競馬場](/guide/dlc02-hippodrome) — 競馬場の建設・チャリオットレース・輝きボーナス
