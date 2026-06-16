import itemsFull from '../../../../packages/shared/public/data/items-full.json'

const RARITY_JA: Record<string, string> = {
  Common: 'コモン',
  Uncommon: 'アンコモン',
  Rare: 'レア',
  Epic: 'エピック',
  Legendary: 'レジェンダリー',
  Unique: 'ユニーク',
  'Quest Item': 'クエストアイテム',
}

const NICHE_JA: Record<string, string> = {
  Civic: '社会',
  Culture: '文化',
  Economy: '経済',
  Finance: '財政',
  Military: '軍事',
  Nature: '自然',
  Religion: '宗教',
  Research: '研究',
  Seafaring: '航海',
}

const NICHE_ORDER = ['Economy', 'Finance', 'Civic', 'Military', 'Culture', 'Religion', 'Research', 'Nature', 'Seafaring']

interface ItemEntry {
  guid: string
  name: string
  rarityJa: string
  nicheJa: string
  buffs: string
  targets: string
  tradePrice: string
  isDlc: boolean
}

export default {
  load(): { byNiche: Record<string, ItemEntry[]>; niches: string[] } {
    const items: ItemEntry[] = (itemsFull as any[]).map((row) => ({
      guid: row.guid,
      name: row.name,
      rarityJa: RARITY_JA[row.rarity] ?? row.rarity,
      nicheJa: NICHE_JA[row.niche] ?? row.niche,
      buffs: row.buffs ?? '',
      targets: row.targets ?? '',
      tradePrice: row.trade_price ?? '',
      isDlc: row.version === 'DLC01',
    }))

    const byNiche: Record<string, ItemEntry[]> = {}
    for (const item of items) {
      if (!byNiche[item.nicheJa]) byNiche[item.nicheJa] = []
      byNiche[item.nicheJa].push(item)
    }
    for (const niche of Object.keys(byNiche)) {
      byNiche[niche].sort((a, b) => a.name.localeCompare(b.name))
    }

    const niches = NICHE_ORDER.map((n) => NICHE_JA[n]).filter((ja) => byNiche[ja])

    return { byNiche, niches }
  },
}
