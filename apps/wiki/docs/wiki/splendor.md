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

各ランクでは、建物に属性がつきます。ランクIIからは、パトリキの住居にだけ属性が追加されます（エクィテスの住居にはつきません）。競馬場は、島内に置いてあれば効果が島内すべての建物に及びます（実機確認済み。円形闘技場の範囲は<strong>要検証</strong>）。数値は%ではなく、そのままの加算値です。

## 競馬場

<table>
<thead><tr><th>ランク（必要な輝き）</th><th>島内の建物</th><th>パトリキの住居（追加）</th><th>特別な効果</th></tr></thead>
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

### 円形闘技場の建築工程

円形闘技場は4つのフェーズで建てます。フェーズIは設置時に支払い、フェーズII〜IVは材料と労働力を納めて進めます。フェーズIVの所要は30分です。材料と労働力は実機で確認しました（材料は公式データとも一致）。

| フェーズ | 必要材料 | 必要労働力 |
|---|---|---|
| I（設置） | デナリウス 75,000／木板 100／コンクリート 60 | — |
| II 基礎 | 木板 150／コンクリート 300／縄 150 | リベルトゥス 350人 |
| III 外壁 | コンクリート 150／瓦 300／大理石 300／縄 150 | プレブス 200人 |
| IV 闘技場 | 瓦 300／大理石 300／モザイク 300／コンクリート 300／金 60 | エクィテス 150人 |

- 合計は、デナリウス 75,000／木板 250／コンクリート 910／瓦 600／大理石 600／縄 300／モザイク 300／金 60 です。
- 島に置けるのは1つだけです。

## 専門家のレース適性（戦車御者のステータス）

競馬場でレースに出す専門家（戦車御者）には、速度・スタミナ・ダッシュ・信頼性という4つのステータスがあります。ゲーム画面では、戦車御者を選ぶときに「戦車御者のステータス」として4つのバーで表示され、数値は出ません。試走で候補を見比べながら判断する仕組みです。コモンの専門家もレースに出られます（実機確認済み）。

ヒエロ・プロペルティウスは、物語を最後まで進めた「競馬場の頂にある星」の段階で、専門家として配置すると試走の回数が+2回増えます（効果欄に「利用可能なアップグレード +2」と出ます。途中の段階にはこの効果はありません。実機確認済み）。

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

## 関連データ

- [スキルツリー・競馬場](/wiki/techs-dlc02) — 競馬場まわりのスキル

## 関連ガイド

- [DLC02・競馬場](/guide/dlc02-hippodrome) — 競馬場の建設・チャリオットレース・輝きボーナス
