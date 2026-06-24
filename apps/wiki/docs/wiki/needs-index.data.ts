import raw from './needs-index.json'

export interface DemandEntry {
  region: string
  category: string
}

export interface NeedsByProduct {
  productGuid: string
  productNameEn: string
  productNameJa: string
  demands: DemandEntry[]
}

const CATEGORY_LABELS: Record<string, string> = {
  Food:       '食料',
  Fashion:    'ファッション',
  Household:  '家庭用品',
  Public:     '公共サービス',
  Culture:    '文化',
  Boardgames: '娯楽',
  Wonder:     '驚異',
}

const REGION_LABELS: Record<string, string> = {
  'Roman':        'ローマ',
  'Celtic':       'ケルト',
  'Roman Celtic': '共通',
}

const CAT_ORDER = ['Food', 'Fashion', 'Household', 'Public', 'Culture', 'Boardgames', 'Wonder']

export default {
  load(): {
    items: NeedsByProduct[]
    categories: string[]
    categoryLabels: Record<string, string>
    regionLabels: Record<string, string>
  } {
    const items = (raw as any).needsByProduct as NeedsByProduct[]

    const catSet = new Set<string>()
    for (const item of items) {
      for (const d of item.demands) catSet.add(d.category)
    }
    const categories = CAT_ORDER.filter(c => catSet.has(c))

    return { items, categories, categoryLabels: CATEGORY_LABELS, regionLabels: REGION_LABELS }
  },
}
