---
title: 信仰神
description: Anno 117の信仰神8柱の一覧。信仰値ごとの解放しきい値、奇跡（炭鉱・金鉱・サイロなどの解放）、局所効果・支配効果を公式データから整理。
---

<script setup lang="ts">
import { data } from './patrons.data.ts'

const wonderThreshold = data.thresholds.wonder
const dominantThreshold = data.thresholds.dominant
const byId = Object.fromEntries(data.patrons.map((p: any) => [p.id, p]))
const sharedMilestones: [number, number][] = data.patrons[0].local[0].milestones
</script>

# 信仰神

島の祭神を決めると信仰が貯まり、信仰値に応じて生産アップや新しい建物の解放といった効果がもらえます。
炭鉱・金鉱・サイロが使えるようになるのも、信仰神の効果です。

## 信仰のしくみ

- 島の祭神を選ぶと、その島の信心（Belief）から時間をかけて信仰が貯まります。祭神を選ぶには信心が1以上必要です。
- <strong>祭神を変えると、その島の信仰は0にリセット</strong>されます。
- 島ごとの信仰（局所効果）と、全島の信仰を合計した世界の信仰（奇跡・支配効果・祭壇）があります。
- 世界の信仰は、複数の島で同じ神を祭神にしていれば合算されます。

## 解放のしきい値

| 世界の信仰 | 解放されるもの |
|---|---|
| {{ data.thresholds.shrine.toLocaleString() }} | その神の祭壇 |
| {{ data.thresholds.wonder.toLocaleString() }} | その神の奇跡（新しい建物などの解放）。どの神でも、信仰が足りていれば解放できます |
| {{ data.thresholds.dominant.toLocaleString() }} | 高位祭神。しきい値を超えた神のうち、信仰が最も多い1柱だけが支配効果を発動します |

解放後にしきい値を下回った場合の扱いとして、公式データには祭壇800・奇跡3,500というヒステリシス値があります。この値を下回ると効果が切れるとみられます（<strong>要検証</strong>）。

## 奇跡の一覧

世界の信仰が {{ wonderThreshold.toLocaleString() }} に達すると解放されます。

<table>
<thead><tr><th>神</th><th>解放される効果</th></tr></thead>
<tbody>
<tr v-for="p in data.patrons" :key="p.id">
<td><a :href="'#' + p.id">{{ p.nameJa }}</a></td>
<td>{{ p.wonder.descJa }}</td>
</tr>
</tbody>
</table>

## 生産アップの効果段階（全神共通）

各神の局所効果1（生産アップ系）は、島の信仰値が下のしきい値を超えるたびに段階が上がります（全15段階）。

<table>
<thead><tr><th>島の信仰値</th><th>効果段階値</th></tr></thead>
<tbody>
<tr v-for="[devotion, scale] in sharedMilestones" :key="devotion">
<td>{{ devotion.toLocaleString() }}</td>
<td>{{ scale }}</td>
</tr>
</tbody>
</table>

効果段階値は10刻みで10から150まで上がります。生産性の増加率（+10%〜+150%）に相当すると推定していますが、<strong>要検証</strong>です。

## マルス {#mars}

<PatronDetail :patron="byId.mars" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## ケレース {#ceres}

<PatronDetail :patron="byId.ceres" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## ネプトゥーヌス {#neptune}

<PatronDetail :patron="byId.neptune" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## メルクリウス・ルグス {#mercury}

<PatronDetail :patron="byId.mercury" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## エポナ {#epona}

<PatronDetail :patron="byId.epona" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

### サイロ（奇跡で解放）

サイロは、牧場に取り付けて生産を増やすモジュールです。小麦を与えると、その牧場の生産量がアップします。

- <strong>効果のある施設</strong>：羊牧場・養豚場・馬ブリーダー（ラティウム・アルビオン共通）。牛牧場・馬追い（ポニー）・養蜂場には使えません。
- <strong>設置場所</strong>：対象の牧場の横に置きます。範囲内に倉庫も必要です。
- <strong>必要な品物</strong>：小麦を5分（300秒）ごとに1個。貯蔵は5個までで、小麦が足りなくなると「サイロの小麦が不足している」と表示されます。
- <strong>効果</strong>：牧場の生産性が +100% になり、さらに3サイクルごとに同じ商品が +1個 増えます。この2つの効果は重複します。
- <strong>建設費</strong>：木板20・瓦10のほか、コンクリート・大理石・モザイクが必要です（数量は要検証）。

## ケルヌンノス {#cernunnos}

<PatronDetail :patron="byId.cernunnos" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## ミネルヴァ {#minerva}

<PatronDetail :patron="byId.minerva" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## ウルカヌス {#vulcan}

DLC01「灰の予言」で追加された神です。

<PatronDetail :patron="byId.vulcan" :wonder-threshold="wonderThreshold" :dominant-threshold="dominantThreshold" />

## 関連ガイド

- [経済・収入最適化ガイド](/guide/economy-guide) — 信仰神による経済バフのまとめ
- [DLC01・灰の予言](/guide/dlc01-ashes-of-prophecy) — 新しい祭神ウルカヌスと炭鉱の解放
