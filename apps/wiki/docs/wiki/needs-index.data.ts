import raw from './needs-index.json'

export interface TierEntry {
  tier: string
  region: string
}

export interface NeedsByProduct {
  productGuid: string
  productNameEn: string
  productNameJa: string
  demands: { region: string; category: string }[]
  tiers: TierEntry[]
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

const TIER_LABELS: Record<string, Record<string, string>> = {
  Roman:       { libertus: 'リベルトゥス', plebeian: 'プレブス', equites: 'エクィテス', patrician: 'パトリキ' },
  Celtic:      { libertus: 'ウェーダー',   plebeian: 'スミス',   equites: 'アルダー' },
  RomanCeltic: { plebeian: 'メルカトル',   equites: 'ノビレス' },
}

const CAT_ORDER = ['Food', 'Fashion', 'Household', 'Public', 'Culture', 'Boardgames', 'Wonder']

export default {
  load(): {
    items: NeedsByProduct[]
    categories: string[]
    categoryLabels: Record<string, string>
    tierLabels: Record<string, Record<string, string>>
  } {
    const items = (raw as any).needsByProduct as NeedsByProduct[]

    const catSet = new Set<string>()
    for (const item of items) {
      for (const d of item.demands) catSet.add(d.category)
    }
    const categories = CAT_ORDER.filter(c => catSet.has(c))

    return { items, categories, categoryLabels: CATEGORY_LABELS, tierLabels: { ...TIER_LABELS } }
  },
}
