<script setup lang="ts">
// クエスト一覧（wiki/quests）。データは tools/build-quests-data.py が作る quests-list.json。
// 選択肢はネタバレのため、クエストを開いたときだけ描く（開くまでは DOM に出さない）。
import { computed, nextTick, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import data from '../../wiki/quests-list.json'

interface Reward { t: string; k: string; rarity?: string | null; link?: boolean }
interface Result { rewards: Reward[]; next: string[] }
interface Option extends Result { text: string; cost?: string; chance?: string; cond?: string; fail?: Result }
interface Step {
  id: string
  kind: 'decision' | 'notice' | 'objective' | 'check' | 'then'
  speaker?: string | null
  title?: string | null
  text?: string | null
  options?: Option[]
  /** 通知（選択肢が1つの画面）の結果 */
  result?: Result
  met?: Result
  missed?: Result
  cond?: string
  yes?: Result
  no?: Result
}
interface Quest {
  guid: number
  /** 実機のクエストブックの題名 */
  name: string
  /** 受けるかどうかを選ぶ画面の見出し（題名と違うときだけ） */
  alt?: string
  dlc: string
  region: string
  giver: string | null
  series: string | null
  items: Reward[]
  steps: Step[]
  provisional?: boolean
  guide?: string
  /** 続き物の何番目か（例 "2/5"）と、前後のクエストの guid */
  stage?: string
  prev?: number
  nextQuest?: number
}

const quests = data as Quest[]
const DLCS = [...new Set(quests.map((q) => q.dlc))]
const REGIONS = ['ラティウム', 'アルビオン', 'アイギュプト', '地域の指定なし']

const selName = ref('')
const selDlc = ref('')
const selRegion = ref('')
const onlyItems = ref(false)
const opened = reactive(new Set<number>())

const filtered = computed(() => {
  const name = selName.value.trim()
  return quests.filter((q) => {
    if (name && !q.name.includes(name) && !(q.alt ?? '').includes(name) && !(q.giver ?? '').includes(name)
      && !q.items.some((r) => r.t.includes(name))) return false
    if (selDlc.value && q.dlc !== selDlc.value) return false
    if (selRegion.value && (q.region || '地域の指定なし') !== selRegion.value) return false
    if (onlyItems.value && q.items.length === 0) return false
    return true
  })
})

function resetFilters() {
  selName.value = ''
  selDlc.value = ''
  selRegion.value = ''
  onlyItems.value = false
}

/** アイテム一覧を、そのアイテム名で絞った状態で開く */
function itemHref(name: string) {
  return withBase(`/wiki/items.html?name=${encodeURIComponent(name)}`)
}

const byGuid = new Map(quests.map((q) => [q.guid, q]))

/** 続き物の前後のクエストへ移る。絞り込みで隠れていても出るように、絞り込みを外してから開く */
async function goQuest(guid: number) {
  resetFilters()
  opened.add(guid)
  await nextTick()
  const el = document.getElementById(`quest-${guid}`) as HTMLDetailsElement | null
  if (!el) return
  el.open = true
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onToggle(guid: number, e: Event) {
  if ((e.target as HTMLDetailsElement).open) opened.add(guid)
}

/** 選択肢の「次へ」が1つだけで、その先の目標がほかから参照されていないとき、目標を選択肢の下に入れ込む。
 *  byOption: `${選択の節id}:${選択肢の番号}` -> 入れ込む目標の節 / ids: 入れ込んだ目標の節id（単独の節としては出さない） */
interface Inlined { byOption: Map<string, Step>; ids: Set<string> }
const inlinedCache = new Map<number, Inlined>()
function inlined(q: Quest): Inlined {
  const hit = inlinedCache.get(q.guid)
  if (hit) return hit
  const steps = new Map(q.steps.map((s) => [s.id, s]))
  const refs = new Map<string, number>()
  const count = (r?: Result) => r?.next.forEach((n) => refs.set(n, (refs.get(n) ?? 0) + 1))
  for (const s of q.steps) {
    s.options?.forEach((o) => { count(o); count(o.fail) })
    count(s.met); count(s.missed); count(s.yes); count(s.no); count(s.result)
  }
  const byOption = new Map<string, Step>()
  const ids = new Set<string>()
  for (const s of q.steps) {
    s.options?.forEach((o, i) => {
      if (o.next.length !== 1 || o.fail) return
      const t = steps.get(o.next[0])
      if (t && t.kind === 'objective' && refs.get(t.id) === 1 && !ids.has(t.id)) {
        byOption.set(`${s.id}:${i}`, t)
        ids.add(t.id)
      }
    })
  }
  const out = { byOption, ids }
  inlinedCache.set(q.guid, out)
  return out
}

/** 単独の節として出す節（選択肢の下に入れ込んだ目標を除く） */
function visibleSteps(q: Quest): Step[] {
  const ids = inlined(q).ids
  return q.steps.filter((s) => !ids.has(s.id))
}

/** 目標は達成・未達成、分かれ道は満たす・満たさない。中身の無い側は出さない */
function branches(s: Step): [string, Result][] {
  const pairs: [string, Result | undefined][] = s.kind === 'objective'
    ? [['達成', s.met], ['未達成', s.missed]]
    : s.kind === 'then'
      ? [['', s.yes]]
      : [['満たす', s.yes], ['満たさない', s.no]]
  return pairs.filter((p): p is [string, Result] => !isEmpty(p[1]))
}

function isEmpty(r?: Result) {
  return !r || (r.rewards.length === 0 && r.next.length === 0)
}
</script>

<template>
  <div class="ql">
    <div class="ql-filters">
      <label><strong>名前:</strong>
        <input v-model="selName" type="text" placeholder="クエスト名・依頼人・報酬で検索" />
      </label>
      <label><strong>DLC:</strong>
        <select v-model="selDlc">
          <option value="">すべて</option>
          <option v-for="d in DLCS" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <label><strong>地域:</strong>
        <select v-model="selRegion">
          <option value="">すべて</option>
          <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label class="ql-check"><input v-model="onlyItems" type="checkbox" /> アイテムがもらえるものだけ</label>
      <div class="ql-footer">
        <button type="button" class="ql-reset" @click="resetFilters">リセット</button>
        <span class="ql-count">{{ filtered.length }} 件</span>
      </div>
    </div>

    <details v-for="q in filtered" :id="`quest-${q.guid}`" :key="q.guid" class="ql-quest" @toggle="onToggle(q.guid, $event)">
      <summary>
        <span class="ql-name">{{ q.name }}</span>
        <span v-if="q.alt" class="ql-alt">受ける画面の見出し: {{ q.alt }}</span>
        <span class="ql-tags">
          <span class="ql-tag">{{ q.dlc }}</span>
          <span v-if="q.region" class="ql-tag">{{ q.region }}</span>
          <span v-if="q.cat" class="ql-tag">{{ q.cat }}</span>
          <span v-if="q.giver" class="ql-tag">依頼人: {{ q.giver }}</span>
          <span v-if="q.series" class="ql-tag">続き物: {{ q.series }}<template v-if="q.stage">（{{ q.stage }}）</template></span>
          <span v-if="q.provisional" class="ql-tag ql-tag-warn">仮訳あり</span>
          <span v-if="q.auto" class="ql-tag ql-tag-warn">自動読み取り</span>
          <a v-if="q.guide" :href="withBase(q.guide)" class="ql-tag ql-tag-guide" @click.stop>詳しい説明（流れ図）</a>
        </span>
        <span v-if="q.items.length" class="ql-items">
          <template v-for="r in q.items" :key="r.t">
            <a v-if="r.link" :href="itemHref(r.t)" class="ql-item ql-item-link" @click.stop>{{ r.t }}</a>
            <span v-else class="ql-item">{{ r.t }}</span>
          </template>
        </span>
      </summary>

      <div v-if="opened.has(q.guid)" class="ql-body">
        <p v-if="!q.steps.length" class="ql-note">選択肢の無いクエストです。上の札のアイテムが報酬として手に入ります（入手先の情報から）。</p>
        <div v-if="q.prev || q.nextQuest" class="ql-chain">
          <button v-if="q.prev" type="button" class="ql-chain-btn" @click="goQuest(q.prev)">前: {{ byGuid.get(q.prev)?.name }}</button>
          <button v-if="q.nextQuest" type="button" class="ql-chain-btn" @click="goQuest(q.nextQuest)">次: {{ byGuid.get(q.nextQuest)?.name }}</button>
        </div>
        <p v-if="q.provisional" class="ql-note">このクエストは、ゲームのデータに日本語の文が無い所があり、その部分はこのサイトで仮に訳しています。</p>
        <div v-for="s in visibleSteps(q)" :key="s.id" class="ql-step">
          <template v-if="s.kind === 'decision'">
            <div class="ql-step-head">
              <span class="ql-id">{{ s.id }}</span>
              <span v-if="s.title" class="ql-title">{{ s.title }}</span>
              <span v-if="s.speaker" class="ql-speaker">（{{ s.speaker }}）</span>
            </div>
            <p v-if="s.text" class="ql-text">{{ s.text }}</p>
            <ul class="ql-opts">
              <li v-for="(o, i) in s.options" :key="i">
                <div class="ql-opt-text">「{{ o.text }}」</div>
                <div v-if="o.cost || o.chance || o.cond" class="ql-meta">
                  <span v-if="o.cost">費用: {{ o.cost }}</span>
                  <span v-if="o.chance">成功率 {{ o.chance }}</span>
                  <span v-if="o.cond">条件: {{ o.cond }}</span>
                </div>
                <div class="ql-result">
                  <span v-if="o.chance" class="ql-label">成功</span>
                  <span v-for="r in o.rewards" :key="r.t" class="ql-reward" :class="'ql-k-' + r.k">{{ r.t }}</span>
                  <template v-if="!inlined(q).byOption.has(s.id + ':' + i)">
                    <span v-for="n in o.next" :key="n" class="ql-next">{{ n }}へ</span>
                  </template>
                  <span v-if="isEmpty(o)" class="ql-none">報酬なし</span>
                </div>
                <div v-if="inlined(q).byOption.get(s.id + ':' + i)" class="ql-inline">
                  <div class="ql-step-head">
                    <span class="ql-id">{{ inlined(q).byOption.get(s.id + ':' + i)!.id }}</span>
                    <span class="ql-title">{{ inlined(q).byOption.get(s.id + ':' + i)!.text }}</span>
                  </div>
                  <div v-for="[label, r] in branches(inlined(q).byOption.get(s.id + ':' + i)!)" :key="label" class="ql-result">
                    <span v-if="label" class="ql-label">{{ label }}</span>
                    <span v-for="x in r.rewards" :key="x.t" class="ql-reward" :class="'ql-k-' + x.k">{{ x.t }}</span>
                    <span v-for="n in r.next" :key="n" class="ql-next">{{ n }}へ</span>
                  </div>
                </div>
                <div v-if="o.fail" class="ql-result">
                  <span class="ql-label">失敗</span>
                  <span v-for="r in o.fail.rewards" :key="r.t" class="ql-reward" :class="'ql-k-' + r.k">{{ r.t }}</span>
                  <span v-for="n in o.fail.next" :key="n" class="ql-next">{{ n }}へ</span>
                  <span v-if="isEmpty(o.fail)" class="ql-none">報酬なし</span>
                </div>
              </li>
            </ul>
          </template>

          <template v-else-if="s.kind === 'notice'">
            <div class="ql-step-head">
              <span class="ql-id">{{ s.id }}</span>
              <span v-if="s.title" class="ql-title">{{ s.title }}</span>
              <span v-if="s.speaker" class="ql-speaker">（{{ s.speaker }}）</span>
            </div>
            <p v-if="s.text" class="ql-text">{{ s.text }}</p>
            <div v-if="s.result && !isEmpty(s.result)" class="ql-result">
              <span v-for="r in s.result.rewards" :key="r.t" class="ql-reward" :class="'ql-k-' + r.k">{{ r.t }}</span>
              <span v-for="n in s.result.next" :key="n" class="ql-next">{{ n }}へ</span>
            </div>
          </template>

          <template v-else-if="s.kind === 'objective'">
            <div class="ql-step-head"><span class="ql-id">{{ s.id }}</span> <span class="ql-title">{{ s.text }}</span></div>
            <div v-for="[label, r] in branches(s)" :key="label" class="ql-result">
              <template v-if="r">
                <span v-if="label" class="ql-label">{{ label }}</span>
                <span v-for="x in r.rewards" :key="x.t" class="ql-reward" :class="'ql-k-' + x.k">{{ x.t }}</span>
                <span v-for="n in r.next" :key="n" class="ql-next">{{ n }}へ</span>
              </template>
            </div>
          </template>

          <template v-else>
            <div class="ql-step-head">
              <span class="ql-id">{{ s.id }}</span>
              <span v-if="s.kind === 'check'" class="ql-cond">条件: {{ s.cond }}</span>
            </div>
            <div v-for="[label, r] in branches(s)" :key="label" class="ql-result">
              <template v-if="r">
                <span v-if="label" class="ql-label">{{ label }}</span>
                <span v-for="x in r.rewards" :key="x.t" class="ql-reward" :class="'ql-k-' + x.k">{{ x.t }}</span>
                <span v-for="n in r.next" :key="n" class="ql-next">{{ n }}へ</span>
              </template>
            </div>
          </template>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.ql-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  margin: 16px 0;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.ql-filters label { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.ql-filters label strong { white-space: nowrap; }
.ql-filters input[type='text'], .ql-filters select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 6px;
  background: var(--vp-c-bg);
  max-width: 100%;
}
.ql-filters input[type='text'] { width: 15em; }
.ql-footer { display: flex; gap: 12px; align-items: center; margin-left: auto; }
.ql-reset {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 10px;
  background: var(--vp-c-bg);
}
.ql-count { color: var(--vp-c-text-2); font-size: 14px; }

.ql-quest {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 8px 0;
  background: var(--vp-c-bg);
}
.ql-quest > summary {
  cursor: pointer;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
}
.ql-quest[open] > summary { border-bottom: 1px solid var(--vp-c-divider); }
.ql-name { font-weight: 700; }
.ql-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.ql-tag {
  font-size: 12px;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 0 8px;
}
.ql-items { display: flex; flex-wrap: wrap; gap: 4px; width: 100%; }
.ql-item-link { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.ql-item-link:hover { color: var(--vp-c-brand-1); }
.ql-item, .ql-k-item {
  font-size: 12px;
  border: 1px solid var(--vp-c-green-2);
  background: var(--vp-c-green-soft);
  border-radius: 4px;
  padding: 0 6px;
}

.ql-body { padding: 8px 12px 12px; }
.ql-step { border-left: 3px solid var(--vp-c-divider); padding: 4px 0 4px 10px; margin: 8px 0; }
.ql-step-head { font-size: 14px; }
.ql-id { font-weight: 700; color: var(--vp-c-brand-1); margin-right: 4px; }
.ql-title { font-weight: 600; }
.ql-speaker, .ql-cond { color: var(--vp-c-text-2); font-size: 13px; }
.ql-text { font-size: 13px; color: var(--vp-c-text-2); margin: 4px 0 !important; line-height: 1.6; }
.ql-opts { list-style: none; margin: 4px 0 0 !important; padding: 0 !important; }
.ql-opts > li { margin: 6px 0 !important; padding: 6px 8px; border-radius: 6px; background: var(--vp-c-bg-soft); }
.ql-opt-text { font-size: 14px; font-weight: 600; }
.ql-inline { margin: 6px 0 0 8px; padding: 2px 0 2px 10px; border-left: 2px solid var(--vp-c-divider); }
.ql-meta { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--vp-c-text-2); }
.ql-result { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-top: 4px; font-size: 13px; }
.ql-label { font-size: 12px; color: var(--vp-c-text-2); }
.ql-reward {
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0 6px;
  background: var(--vp-c-bg);
}
.ql-next { font-size: 12px; color: var(--vp-c-brand-1); }
.ql-tag-guide { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); text-decoration: none; }
.ql-tag-guide:hover { background: var(--vp-c-brand-soft); }
.ql-tag-warn { color: var(--vp-c-warning-1); border-color: var(--vp-c-warning-2); }
.ql-note { font-size: 13px; color: var(--vp-c-text-2); margin: 4px 0 8px !important; }
.ql-none { font-size: 12px; color: var(--vp-c-text-3); }
.ql-alt { display: block; font-size: 12px; color: var(--vp-c-text-2); }
.ql-chain { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 8px; }
.ql-chain-btn {
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  text-align: left;
  overflow-wrap: anywhere;
}
.ql-chain-btn:hover { background: var(--vp-c-brand-soft); }

@media (max-width: 959px) {
  .ql-filters input[type='text'] { width: 100%; }
  .ql-filters label:first-child { width: 100%; }
  .ql-footer { margin-left: 0; }
}
</style>
