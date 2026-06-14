import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRODUCTIONS_DIR = resolve(__dirname, '../../../../packages/shared/public/productions')

interface BuildingCost {
  money: number
  [key: string]: number
}

interface BuildingEntry {
  type: string
  nameEn: string
  goods: string[]
  romanCost: BuildingCost | null
  celticCost: BuildingCost | null
  romanMaintenance: BuildingCost | null
  celticMaintenance: BuildingCost | null
}

const BUILDING_ORDER = [
  'fishery',
  'gatherer',
  'livestock_farm',
  'kitchen',
  'victualler',
  'clothier',
  'artisanal_studio',
  'upholsterer',
  'refinery',
  'workshop',
  'armoury',
]

const BUILDING_NAMES: Record<string, string> = {
  fishery: 'Fishery',
  gatherer: 'Gatherer',
  livestock_farm: 'Livestock Farm',
  kitchen: 'Kitchen',
  victualler: 'Victualler',
  clothier: 'Clothier',
  artisanal_studio: 'Artisanal Studio',
  upholsterer: 'Upholsterer',
  refinery: 'Refinery',
  workshop: 'Workshop',
  armoury: 'Armoury',
}

export default {
  load(): { buildings: BuildingEntry[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods
    const goodsList = (listJson as { goods: any[] }).goods

    const byType = new Map<string, BuildingEntry>()

    for (const file of readdirSync(PRODUCTIONS_DIR)) {
      if (!file.endsWith('.json') || file === 'list.json') continue
      const isAlbion = file.includes('albion')
      const prod = JSON.parse(readFileSync(resolve(PRODUCTIONS_DIR, file), 'utf-8'))
      if (!prod.type) continue

      const type = prod.type as string
      if (!byType.has(type)) {
        byType.set(type, {
          type,
          nameEn: BUILDING_NAMES[type] ?? type,
          goods: [],
          romanCost: null,
          celticCost: null,
          romanMaintenance: null,
          celticMaintenance: null,
        })
      }
      const entry = byType.get(type)!

      const goodId = prod.id as string
      const nameJa = jaGoods[goodId] ?? prod.name ?? goodId
      if (!entry.goods.includes(nameJa)) entry.goods.push(nameJa)

      if (isAlbion) {
        if (!entry.celticCost) entry.celticCost = prod.building_cost ?? null
        if (!entry.celticMaintenance) entry.celticMaintenance = prod.maintanance_cost ?? null
      } else {
        if (!entry.romanCost) entry.romanCost = prod.building_cost ?? null
        if (!entry.romanMaintenance) entry.romanMaintenance = prod.maintanance_cost ?? null
      }
    }

    const buildings = BUILDING_ORDER
      .filter((t) => byType.has(t))
      .map((t) => byType.get(t)!)

    return { buildings }
  },
}
