import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ITEMS_DIR = resolve(__dirname, '../../../../packages/shared/public/data/items')

interface TargetGood {
  name: string
  nameJa: string
}

interface ItemEntry {
  guid: string
  nameEn: string
  nameJa: string
  rarity: string
  niche: string
  productivityBonus: number
  targets: TargetGood[]
}

const NICHE_ORDER = ['Economy', 'Agriculture', 'Finance', 'Diplomacy', 'Culture', 'Military', 'Religion', 'Research']

export default {
  load(): { byNiche: Record<string, ItemEntry[]>; niches: string[] } {
    const jaSpecialists = (jaJson as { specialists: Record<string, string> }).specialists
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    // Build displayName (lowercase) → good id map for target goods resolution
    const goodsNameToId: Record<string, string> = {}
    for (const good of (listJson as { goods: any[] }).goods) {
      goodsNameToId[(good.displayName as string).toLowerCase()] = good.id as string
    }

    const items: ItemEntry[] = []

    const files = readdirSync(ITEMS_DIR).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      const content = readFileSync(resolve(ITEMS_DIR, file), 'utf-8')
      const item = JSON.parse(content)

      const guid: string = item.guid
      const productivityBonus: number = item.buffs?.[0]?.FactoryUpgrade?.ProductivityUpgrade ?? 0

      // Resolve target goods to Japanese names via list.json → ja.json.goods
      const seen = new Set<string>()
      const targets: TargetGood[] = []
      for (const target of item.targets ?? []) {
        for (const pg of target.producedGoods ?? []) {
          const engName: string = pg.name ?? ''
          if (!engName || seen.has(engName)) continue
          seen.add(engName)
          const goodId = goodsNameToId[engName.toLowerCase()]
          const nameJa = goodId ? (jaGoods[goodId] ?? engName) : engName
          targets.push({ name: engName, nameJa })
        }
      }

      items.push({
        guid,
        nameEn: item.displayName,
        nameJa: jaSpecialists[guid] ?? item.displayName,
        rarity: item.rarity ?? '',
        niche: item.niche ?? '',
        productivityBonus,
        targets,
      })
    }

    // Group by niche, sort by nameEn within each group
    const byNiche: Record<string, ItemEntry[]> = {}
    for (const item of items) {
      if (!byNiche[item.niche]) byNiche[item.niche] = []
      byNiche[item.niche].push(item)
    }
    for (const niche of Object.keys(byNiche)) {
      byNiche[niche].sort((a, b) => a.nameEn.localeCompare(b.nameEn))
    }

    const niches = NICHE_ORDER.filter((n) => byNiche[n])

    return { byNiche, niches }
  },
}
