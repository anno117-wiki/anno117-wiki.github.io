---
title: 街の状況（都市ステータス）の段階
description: Anno 117の「街の状況」（都市ステータス）の段階一覧。ラティウムの45段階とアイギュプトの35段階の名前、必要人口、ラティウムの段階ごとの属性効果（幸福・健康・火災安全度・信仰・知識・名声）を整理。
---

<script setup lang="ts">
import { data } from './city-status.data.ts'

const aegyptus = data.aegyptus
const attrKeys = Object.keys(data.attrs) as (keyof typeof data.attrs)[]

// 属性の値を「+18」「-15.6」の形にする。値が無い属性は「—」
const fmt = (v: number | undefined) => (v === undefined ? '—' : v > 0 ? `+${v}` : `${v}`)
// 必要人口。人口の表に載っていない段階は「未確認」
const pop = (p: number | null) => (p === null ? '未確認' : p === 0 ? 'なし' : p.toLocaleString())
// スマホの属性の表では見出しを短くして列幅を詰める
const shortAttr = (label: string) => (label === '火災安全度' ? '防火' : label)
</script>

<style>
/* 属性効果の表: PCは1つの表、スマホ（959px以下、custom.css のモバイル判定と同じ）は2つの表に分ける */
.cs-tall {
  display: none;
}
@media (max-width: 959px) {
  .cs-wide {
    display: none;
  }
  .cs-tall {
    display: block;
  }
  .cs-tall table {
    display: table;
    width: 100%;
  }
  /* 属性の表は数値だけなので、列の最小幅と余白を詰めて画面に収める */
  .vp-doc .cs-tall .cs-attr-table th,
  .vp-doc .cs-tall .cs-attr-table td {
    min-width: 0;
    padding-left: 4px;
    padding-right: 4px;
    text-align: right;
  }
}
</style>

# 街の状況（都市ステータス）の段階

島の人口が増えると、島の「街の状況」が上がっていきます。段階ごとに名前が決まっていて、「拠点」から始まり、「村」「町」「都市」「コロニア」「帝国都市」「メガロポリス」と続きます。段階が上がると、島の属性（幸福・健康・火災安全度・信仰・知識・名声）に加わる値も変わります。

## 段階のしくみ

- 段階は、その島の<strong>ローマ人の人口</strong>で決まります。表の「必要人口」に届くと、次の段階に上がります。
- ラティウムの島は45段階です。人口の表があるのは40段階（主要なティタノポリス、260,000人）までで、その先の5段階は必要人口が未確認です。
- 島の画面の右上に、段階がローマ数字で出ます（表の「段階」の列がその読み方です）。段階の名前も、実機の画面で表と合っていることを確認しました。
- 島の人口が2つの段階の間にあるときは、属性の値が人口に応じてなめらかに変わります。次の段階までの割合で、前の段階と次の段階の値の間を直線で結んだ値です。たとえば人口が1,350（段階4が1,000人、段階5が1,500人）なら、割合は0.7です。幸福度は、段階4の-1と段階5の-3の間で、-1 + (-3 - -1) × 0.7 = -2.4になります（実機の画面でも-2.4でした）。
- アイギュプトは35段階で、島のアイギュプト人の人口で決まります。下の「アイギュプトの段階」にまとめました。
- アルビオン（ケルト系）にも、25段階の別の表があります。このページには載せていません。

## 属性効果

- 幸福・健康・火災安全度は、値がある段階ではどれもマイナスです。段階が上がるほど、マイナスが大きくなります。
- 信仰・知識・名声は、値がある段階ではどれもプラスです。段階が上がるほど、プラスが大きくなります。
- この値は、街の状況の画面の「住民ごとの効果」に出ます。どの建物に効くかは未確認です。
- 「—」は、その段階にその属性の値が無いことを示します。段階1と2には、どの属性の値もありません。

<div class="unit-table cs-wide">
<table>
<thead><tr>
<th>段階</th><th>名前</th><th>必要人口</th>
<th v-for="k in attrKeys" :key="k">{{ data.attrs[k] }}</th>
</tr></thead>
<tbody>
<tr v-for="s in data.stages" :key="s.level">
<td>{{ s.roman }}</td>
<td>{{ s.nameJa }}</td>
<td>{{ pop(s.population) }}</td>
<td v-for="k in attrKeys" :key="k">{{ fmt(s.attrs[k]) }}</td>
</tr>
</tbody>
</table>
</div>

<!-- スマホ: 横スクロールさせないため、名前・必要人口と属性の2つの表に分ける -->
<div class="cs-tall">

<strong>名前と必要人口</strong>

<table>
<thead><tr><th>段階</th><th>名前</th><th>必要人口</th></tr></thead>
<tbody>
<tr v-for="s in data.stages" :key="s.level">
<td>{{ s.roman }}</td>
<td>{{ s.nameJa }}</td>
<td>{{ pop(s.population) }}</td>
</tr>
</tbody>
</table>

<strong>属性効果</strong>（「防火」は火災安全度）

<table class="cs-attr-table">
<thead><tr>
<th>段階</th>
<th v-for="k in attrKeys" :key="k">{{ shortAttr(data.attrs[k]) }}</th>
</tr></thead>
<tbody>
<tr v-for="s in data.stages" :key="s.level">
<td>{{ s.roman }}</td>
<td v-for="k in attrKeys" :key="k">{{ fmt(s.attrs[k]) }}</td>
</tr>
</tbody>
</table>

</div>

## アイギュプトの段階

アイギュプトの島は35段階で、島の<strong>アイギュプト人の人口</strong>で決まります。属性効果は、使い分けが分からないため載せていません。

<div class="wrap-head">
<table>
<thead><tr><th>段階</th><th>名前</th><th>必要人口</th></tr></thead>
<tbody>
<tr v-for="s in aegyptus" :key="s.level">
<td>{{ s.roman }}</td>
<td>{{ s.nameJa }}</td>
<td>{{ pop(s.population) }}</td>
</tr>
</tbody>
</table>
</div>

## 注意

- 数値は、ゲームのアップデート3.0のゲーム内データです。41〜45段階だけは、アップデート2.1時点の値です。
- アップデート3.0（2026年11月5日）で、段階3〜10の属性のペナルティが、ゆるやかになりました。段階11以降の値は変わっていません。
- 実機の画面で、段階3〜7と10・11の値を確認しました（人口が段階の間のときも、上の直線で結んだ値と一致しました）。段階8・9は確認できる島がなく、前後の段階が一致していることから、合っているとみなしています。段階41〜45とアイギュプトは、実機との照合が済んでいません。食い違いがあれば、実機に合わせて直します。

## 関連ページ

- [住民層](/wiki/population) — ラティウムの住民層と需要
- [モニュメントの輝き](/wiki/splendor) — 競馬場・円形闘技場による島の属性ボーナス
