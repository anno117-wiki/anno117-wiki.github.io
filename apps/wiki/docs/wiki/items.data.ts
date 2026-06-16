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

const RARITY_EN_FROM_JA: Record<string, string> = Object.fromEntries(
  Object.entries(RARITY_JA).map(([en, ja]) => [ja, en])
)

interface ItemEntry {
  guid: string
  nameJa: string
  rarityJa: string
  nicheJa: string
  price: string
  effects: string[]
  description: string
}

export default {
  load(): { items: ItemEntry[]; niches: string[]; rarities: string[] } {
    const nicheIndex = Object.fromEntries(NICHE_ORDER.map((n, i) => [n, i]))

    const items: ItemEntry[] = (itemsFull as any[])
      .map((row) => ({
        guid: row.guid,
        nameJa: row.nameJa ?? row.nameEn,
        rarityJa: RARITY_JA[row.rarity] ?? row.rarity,
        nicheJa: NICHE_JA[row.niche] ?? row.niche,
        price: row.price ?? '',
        effects: Array.isArray(row.effects) ? row.effects : [],
        description: row.description ?? '',
        _nicheRank: nicheIndex[row.niche] ?? 99,
        _rarityRank: RARITY_RANK[row.rarity] ?? 99,
      }))
      .sort((a: any, b: any) => {
        if (a._nicheRank !== b._nicheRank) return a._nicheRank - b._nicheRank
        if (a._rarityRank !== b._rarityRank) return a._rarityRank - b._rarityRank
        return a.nameJa.localeCompare(b.nameJa, 'ja')
      })
      .map(({ _nicheRank: _n, _rarityRank: _r, ...item }: any) => item)

    const niches = NICHE_ORDER.map((n) => NICHE_JA[n]).filter((ja) =>
      items.some((i) => i.nicheJa === ja)
    )

    const seenRarities = new Set<string>()
    const rarities: string[] = []
    for (const rank of Object.keys(RARITY_RANK).sort((a, b) => RARITY_RANK[a] - RARITY_RANK[b])) {
      const ja = RARITY_JA[rank]
      if (!seenRarities.has(ja) && items.some((i) => i.rarityJa === ja)) {
        seenRarities.add(ja)
        rarities.push(ja)
      }
    }

    return { items, niches, rarities }
  },
}
