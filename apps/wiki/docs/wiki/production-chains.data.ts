import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRODUCTIONS_DIR = resolve(__dirname, '../../../../packages/shared/public/productions')

interface ProductionEntry {
  id: string
  nameJa: string
  nameEn: string
  category: string
  regions: string[]
  buildingType: string
  timeSeconds: number
  needsFuel: boolean
  inputs: string[]
}

const CATEGORY_ORDER = ['food', 'construction', 'fashion', 'culture']

function readProduction(filename: string): any | null {
  try {
    const content = readFileSync(resolve(PRODUCTIONS_DIR, `${filename}.json`), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export default {
  load(): { byCategory: Record<string, ProductionEntry[]>; categories: string[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    const entries: ProductionEntry[] = []

    for (const good of (listJson as { goods: any[] }).goods) {
      const firstFile = Object.values(good.files as Record<string, string>)[0]
      if (!firstFile) continue

      const prod = readProduction(firstFile as string)
      if (!prod) continue

      const inputs = (prod.input ?? []).map((inp: any) =>
        jaGoods[inp.id] ?? inp.name ?? inp.id
      )

      entries.push({
        id: good.id,
        nameJa: jaGoods[good.id] ?? good.displayName,
        nameEn: good.displayName,
        category: good.category,
        regions: good.regions,
        buildingType: prod.type ?? '',
        timeSeconds: prod.time ?? 0,
        needsFuel: prod.needs_fuel ?? false,
        inputs,
      })
    }

    const byCategory: Record<string, ProductionEntry[]> = {}
    for (const entry of entries) {
      if (!byCategory[entry.category]) byCategory[entry.category] = []
      byCategory[entry.category].push(entry)
    }

    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'))
    }

    return {
      byCategory,
      categories: CATEGORY_ORDER.filter((c) => byCategory[c]),
    }
  },
}
