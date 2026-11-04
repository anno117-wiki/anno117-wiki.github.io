import raw from './needs-index.json'
// アイギュプト(DLC03)の需要。tools/build-aegyptus-needs.py で生成
import aegyptusJson from './population-aegyptus.json'

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
  Egyptian:    { thresher: '麦打ち人', potter: '陶工', priestess: '奉唱巫女', scribe: '書記', gymnasiarch: 'ギムナシアリコス' },
}

const CAT_ORDER = ['Food', 'Fashion', 'Household', 'Public', 'Culture', 'Boardgames', 'Wonder']

export default {
  load(): {
    items: NeedsByProduct[]
    categories: string[]
    categoryLabels: Record<string, string>
    tierLabels: Record<string, Record<string, string>>
  } {
    // 既存の商品に、アイギュプトの需要を足す（既存に無い商品は新しい行にする）
    const items: NeedsByProduct[] = ((raw as any).needsByProduct as NeedsByProduct[]).map((i) => ({
      ...i,
      demands: [...i.demands],
      tiers: [...i.tiers],
    }))
    for (const e of aegyptusJson.needsIndex as NeedsByProduct[]) {
      const found = items.find((i) => i.productGuid === e.productGuid)
      if (found) {
        found.demands.push(...e.demands)
        found.tiers.push(...e.tiers)
      } else {
        items.push(e)
      }
    }

    const catSet = new Set<string>()
    for (const item of items) {
      for (const d of item.demands) catSet.add(d.category)
    }
    const categories = CAT_ORDER.filter(c => catSet.has(c))

    return { items, categories, categoryLabels: CATEGORY_LABELS, tierLabels: { ...TIER_LABELS } }
  },
}
