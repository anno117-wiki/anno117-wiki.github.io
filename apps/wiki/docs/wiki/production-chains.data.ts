import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
// 100%効率の建物数の比率。tools/build-chain-ratios.py で生成
import ratiosJson from './chain-ratios.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRODUCTIONS_DIR = resolve(__dirname, '../../../../packages/shared/public/productions')

export interface GraphNode {
  id: string
  label: string
  time: string
  /** 100%効率での建物数の比率。無い場合は表示しない */
  count?: number
  /** 燃料(石炭)用に必要な炭焼き師の数。燃料が要る建物のみ */
  fuel?: number
}

export interface GraphEdge {
  from: string
  to: string
}

export interface ProductionGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface ChainRatio {
  counts: Record<string, number>
  fuel: Record<string, number>
}

const RATIOS = ratiosJson as Record<string, ChainRatio>

interface ProductionEntry {
  id: string
  nameJa: string
  nameEn: string
  icon: string
  category: string
  regions: string[]
  buildingType: string
  timeSeconds: number
  needsFuel: boolean
  inputs: string[]
  graph: ProductionGraph | null
}

const CATEGORY_ORDER = ['food', 'construction', 'fashion', 'culture']

function fmtTime(seconds: number): string {
  if (!seconds) return ''
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}分` : `${m}分${s}秒`
}

function buildProductionGraph(
  prod: any,
  jaGoods: Record<string, string>,
  ratio: ChainRatio | undefined,
): ProductionGraph | null {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  function traverse(node: any, childId?: string) {
    const id = node.id.replace(/[^a-zA-Z0-9_]/g, '_')
    const label = jaGoods[node.id] ?? node.name ?? node.id
    const time = fmtTime(node.time ?? 0)
    if (!seen.has(id)) {
      seen.add(id)
      const count = ratio?.counts[id]
      const fuel = ratio?.fuel[id]
      nodes.push({ id, label, time, ...(count ? { count } : {}), ...(fuel ? { fuel } : {}) })
    }
    if (childId) edges.push({ from: id, to: childId })
    for (const inp of (node.input ?? [])) {
      traverse(inp, id)
    }
  }

  traverse(prod)
  if (nodes.length <= 1) return null
  return { nodes, edges }
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
  load(): { byCategory: Record<string, ProductionEntry[]>; categories: string[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    const entries: ProductionEntry[] = []

    for (const good of (listJson as { goods: any[] }).goods) {
      if (!good.files) continue
      const firstFile = Object.values(good.files as Record<string, string>)[0]
      if (!firstFile) continue

      const prod = readProduction(firstFile as string)
      if (!prod) continue

      const inputs = (prod.input ?? []).map((inp: any) =>
        jaGoods[inp.id] ?? inp.name ?? inp.id
      )

      const nameJa = jaGoods[good.id] ?? good.displayName
      entries.push({
        id: good.id,
        nameJa,
        nameEn: good.displayName,
        icon: good.icon ?? '',
        category: good.category,
        regions: good.regions,
        buildingType: prod.type ?? '',
        timeSeconds: prod.time ?? 0,
        needsFuel: prod.needs_fuel ?? false,
        inputs,
        graph: buildProductionGraph(prod, jaGoods, RATIOS[firstFile as string]),
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
