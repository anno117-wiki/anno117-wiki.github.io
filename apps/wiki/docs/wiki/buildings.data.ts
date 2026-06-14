import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRODUCTIONS_DIR = resolve(__dirname, '../../../../packages/shared/public/productions')

const BUILDING_LABELS: Record<string, string> = {
  armoury: '武器庫',
  artisanal_studio: '工芸スタジオ',
  clothier: '仕立て屋',
  fishery: '漁場',
  gatherer: '採取場',
  kitchen: '台所',
  livestock_farm: '畜産農場',
  refinery: '精製所',
  upholsterer: '家具工房',
  victualler: '食料商',
  workshop: '工房',
}

const WORKER_LABELS: Record<string, string> = {
  plebeian: '平民',
  libertus: '解放奴隷',
  equites: '騎士',
  patrician: '貴族',
  alderman: '長老',
  wader: '漁師',
  mercators: '商人',
  smith: '鍛冶師',
  nobles: '族長',
}

interface GoodRef {
  id: string
  nameJa: string
  regions: string[]
}

interface BuildingEntry {
  type: string
  label: string
  goods: GoodRef[]
  needsFuel: boolean
  moneyCost: number
  workers: { label: string; count: number }[]
  buildingCost: Record<string, number>
}

function readProduction(filename: string): any | null {
  try {
    const content = readFileSync(resolve(PRODUCTIONS_DIR, `${filename}.json`), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export default {
  load(): { buildings: BuildingEntry[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods
    const byType: Record<string, BuildingEntry> = {}

    for (const good of (listJson as { goods: any[] }).goods) {
      const firstFile = Object.values(good.files as Record<string, string>)[0]
      if (!firstFile) continue
      const prod = readProduction(firstFile as string)
      if (!prod || !prod.type) continue

      const t = prod.type as string

      if (!byType[t]) {
        const mc = prod.maintanance_cost ?? {}
        const workers = Object.entries(mc)
          .filter(([k, v]) => k !== 'money' && (v as number) > 0)
          .map(([k, v]) => ({ label: WORKER_LABELS[k] ?? k, count: v as number }))

        const bc = prod.building_cost ?? {}
        const buildingCost: Record<string, number> = {}
        for (const [k, v] of Object.entries(bc)) {
          if (k !== 'money' && (v as number) > 0) buildingCost[k] = v as number
        }

        byType[t] = {
          type: t,
          label: BUILDING_LABELS[t] ?? t,
          goods: [],
          needsFuel: prod.needs_fuel ?? false,
          moneyCost: mc.money ?? 0,
          workers,
          buildingCost,
        }
      }

      byType[t].goods.push({
        id: good.id,
        nameJa: jaGoods[good.id] ?? good.displayName,
        regions: good.regions,
      })
    }

    const buildings = Object.values(byType).sort((a, b) =>
      a.label.localeCompare(b.label, 'ja')
    )

    return { buildings }
  },
}
