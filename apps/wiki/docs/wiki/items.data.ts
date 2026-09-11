import itemsFull from '../../../../packages/shared/public/data/items-full.json'
import productionListJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
import buildingsEffectsJson from './buildings-effects.json'

// 対象名 -> リンク先の解決に使う対応表
const GOOD_ID_BY_NAME_JA: Record<string, string> = {}
{
  const jaGoods = (jaJson as { goods: Record<string, string> }).goods
  for (const good of (productionListJson as { goods: any[] }).goods) {
    const nameJa = jaGoods[good.id]
    if (nameJa) GOOD_ID_BY_NAME_JA[nameJa] = good.id
  }
}

const BUILDING_ID_BY_NAME_JA: Record<string, string> = {}
for (const b of (buildingsEffectsJson as { buildings: any[] }).buildings) {
  if (b.nameJa && !(b.nameJa in BUILDING_ID_BY_NAME_JA)) {
    BUILDING_ID_BY_NAME_JA[b.nameJa] = b.id
  }
}

const RESIDENCE_TIERS = new Set([
  'リベルトゥス', 'プレブス', 'エクィテス', 'パトリキ',
  'ウェーダー', 'スミス', 'アルダー', 'メルカトル', 'ノビレス',
])

interface TargetLink {
  name: string
  href: string | null
}

function resolveTargetLink(name: string): TargetLink {
  if (name.endsWith('の生産チェーン')) {
    const goodId = GOOD_ID_BY_NAME_JA[name.slice(0, -'の生産チェーン'.length)]
    if (goodId) return { name, href: `/wiki/production-chains.html#${goodId}` }
  } else if (name.endsWith('の住居')) {
    const tier = name.slice(0, -'の住居'.length)
    if (RESIDENCE_TIERS.has(tier)) return { name, href: `/wiki/population.html#${encodeURIComponent(tier)}` }
  } else if (BUILDING_ID_BY_NAME_JA[name]) {
    return { name, href: `/wiki/buildings.html#${BUILDING_ID_BY_NAME_JA[name]}` }
  }
  return { name, href: null }
}

const RARITY_JA: Record<string, string> = {
  Common: 'コモン',
  Uncommon: 'アンコモン',
  Rare: 'レア',
  Epic: 'エピック',
  Legendary: 'レジェンダリー',
  Mythic: 'ミシック',
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
  Mythic: 0,
  Legendary: 1,
  Unique: 2,
  Epic: 3,
  Rare: 4,
  Uncommon: 5,
  Common: 6,
  'Quest Item': 7,
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
  targets: string
  targetLinks: TargetLink[]
}

export default {
  load(): { items: ItemEntry[]; niches: string[]; rarities: string[]; targets: string[] } {
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
        targets: row.targets ?? '',
        targetLinks: (row.targets ? row.targets.split('、') : []).map(resolveTargetLink),
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

    const targetSet = new Set<string>()
    for (const item of items) {
      if (!item.targets) continue
      for (const name of item.targets.split('、')) {
        targetSet.add(name)
      }
    }
    const targets = Array.from(targetSet).sort((a, b) => a.localeCompare(b, 'ja'))

    return { items, niches, rarities, targets }
  },
}
