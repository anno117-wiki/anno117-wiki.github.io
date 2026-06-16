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
  Agriculture: '農業',
  Culture: '文化',
  Diplomacy: '外交',
  Economy: '経済',
  Finance: '財政',
  Military: '軍事',
  Nautics: '航海',
  Religion: '宗教',
  Research: '研究',
}

const NICHE_ORDER = ['Economy', 'Agriculture', 'Finance', 'Diplomacy', 'Culture', 'Religion', 'Research', 'Military', 'Nautics']

const RARITY_RANK: Record<string, number> = {
  Legendary: 0,
  Unique: 1,
  Epic: 2,
  Rare: 3,
  Uncommon: 4,
  Common: 5,
  'Quest Item': 6,
}

interface ItemEntry {
  guid: string
  nameJa: string
  nameEn: string
  rarityJa: string
  nicheJa: string
  price: string
  effects: string[]
  description: string
}

export default {
  load(): { byNiche: Record<string, ItemEntry[]>; niches: string[] } {
    const items: ItemEntry[] = (itemsFull as any[]).map((row) => ({
      guid: row.guid,
      nameJa: row.nameJa ?? row.nameEn,
      nameEn: row.nameEn ?? '',
      rarityJa: RARITY_JA[row.rarity] ?? row.rarity,
      nicheJa: NICHE_JA[row.niche] ?? row.niche,
      price: row.price ?? '',
      effects: Array.isArray(row.effects) ? row.effects : [],
      description: row.description ?? '',
    }))

    const byNiche: Record<string, ItemEntry[]> = {}
    for (const item of items) {
      if (!byNiche[item.nicheJa]) byNiche[item.nicheJa] = []
      byNiche[item.nicheJa].push(item)
    }
    for (const niche of Object.keys(byNiche)) {
      byNiche[niche].sort((a, b) => {
        const ra = RARITY_RANK[Object.keys(RARITY_JA).find((k) => RARITY_JA[k] === a.rarityJa) ?? ''] ?? 99
        const rb = RARITY_RANK[Object.keys(RARITY_JA).find((k) => RARITY_JA[k] === b.rarityJa) ?? ''] ?? 99
        if (ra !== rb) return ra - rb
        return a.nameJa.localeCompare(b.nameJa, 'ja')
      })
    }

    const niches = NICHE_ORDER.map((n) => NICHE_JA[n]).filter((ja) => byNiche[ja])

    return { byNiche, niches }
  },
}
