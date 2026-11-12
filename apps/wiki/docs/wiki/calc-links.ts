import listJson from '../../../../packages/shared/public/productions/list.json'

/** 計算機を開くリンク。query は `/calculator/?` の後ろ、label は作り方が複数あるときの建物名 */
export interface CalcLink {
  query: string
  label: string
}

// 計算機のアイギュプト分のチェーンID（list.json の aegyptus_*）
const AEGYPTUS_CALC_IDS: string[] = (listJson as { goods: { id: string }[] }).goods
  .map((g) => g.id)
  .filter((id) => id.startsWith('aegyptus_'))

// 作り方（建物）ごとにチェーンが分かれた商品は「<商品ID>_<建物>」のIDになる（象牙の小箱・コール）
const BUILDING_LABELS: Record<string, string> = {
  gold_mine: '金鉱',
  gold_washer: '金選鉱',
  coal_mine: '炭鉱',
  charcoal_burner: '炭焼き師',
}

// 計算機は選んでいる地域でチェーンを読むので、アイギュプトの商品は地域も指定する
const AEGYPTUS_REGION = 'region=egyptian'

/** 商品IDから、計算機を開くリンクを作る。計算機にチェーンが無ければ空 */
export function calcLinksFor(id: string): CalcLink[] {
  if (!id.startsWith('aegyptus_')) return [{ query: `good=${id}`, label: '' }]
  if (AEGYPTUS_CALC_IDS.includes(id)) return [{ query: `good=${id}&${AEGYPTUS_REGION}`, label: '' }]
  return Object.entries(BUILDING_LABELS)
    .filter(([key]) => AEGYPTUS_CALC_IDS.includes(`${id}_${key}`))
    .map(([key, label]) => ({ query: `good=${id}_${key}&${AEGYPTUS_REGION}`, label }))
}

/** 計算機のアイギュプト分のチェーンが、どれも wiki の商品につながっているか確かめる */
export function assertAegyptusCalcLinked(wikiIds: string[]): void {
  const linked = new Set(
    wikiIds.flatMap((id) => calcLinksFor(id)).map((link) => new URLSearchParams(link.query).get('good')),
  )
  const missing = AEGYPTUS_CALC_IDS.filter((id) => !linked.has(id))
  if (missing.length) throw new Error(`計算機のアイギュプトのチェーンが wiki の商品につながっていない: ${missing.join(', ')}`)
}
