import techsJson from './techs.json'

function parseBranch(internalName: string, annoNodeId?: string): string {
  if (annoNodeId) {
    if (annoNodeId.startsWith('m')) return 'military'
    if (annoNodeId.startsWith('s')) return 'civic'
    if (annoNodeId.startsWith('w')) return 'economy'
  }
  if (internalName.includes('Economy')) return 'economy'
  if (internalName.includes('Civic')) return 'civic'
  if (internalName.includes('Military')) return 'military'
  if (internalName.includes('DLC01')) return 'dlc01'
  return 'other'
}

function parseLabel(internalName: string): string {
  let s = internalName
  s = s.replace(/^(Tech|Gate)\s+(Economy|Civic|Military|DLC01)\s+/, '')
  s = s.replace(/^-?\d+\s+-?\d+\s+/, '')
  return s.trim() || internalName
}

const BRANCH_LABELS: Record<string, string> = {
  economy: '経済',
  civic: '市民',
  military: '軍事',
  dlc01: 'DLC',
  other: 'その他',
}

export interface TechEntry {
  guid: string
  internalName: string
  label: string
  branch: string
  branchLabel: string
  descJa: string
  descEn: string
  effectJa: string
  effectEn: string
  iconKey: string | null
  techIconPath: string
  isGate: boolean
  color: string
  knowledgeCost: number | null
  gridX: number
  gridY: number
  annoNodeId: string
  connections: string[]
}

const BRANCH_ORDER = ['economy', 'civic', 'military', 'dlc01', 'other']

export default {
  load(): {
    branches: string[]
    byBranch: Record<string, TechEntry[]>
    branchMeta: Record<string, { minX: number; minY: number; maxX: number; maxY: number }>
  } {
    const techs: TechEntry[] = (techsJson as { techs: any[] }).techs.map((t: any) => ({
      guid: t.guid,
      internalName: t.internalName ?? '',
      label: t.nameJa || parseLabel(t.internalName ?? t.guid),
      branch: parseBranch(t.internalName ?? '', t.annoNodeId),
      branchLabel: BRANCH_LABELS[parseBranch(t.internalName ?? '')] ?? 'その他',
      descJa: t.descJa ?? '',
      descEn: t.descEn ?? '',
      effectJa: t.effectJa ?? '',
      effectEn: t.effectEn ?? '',
      iconKey: t.iconKey ?? null,
      techIconPath: t.techIconPath ?? '',
      isGate: t.isGate ?? false,
      color: t.color ?? '',
      knowledgeCost: t.knowledgeCost ?? null,
      gridX: t.gridX ?? 0,
      gridY: t.gridY ?? 0,
      annoNodeId: t.annoNodeId ?? '',
      connections: t.connections ?? [],
    }))

    const byBranch: Record<string, TechEntry[]> = {}
    for (const tech of techs) {
      if (!byBranch[tech.branch]) byBranch[tech.branch] = []
      byBranch[tech.branch].push(tech)
    }

    const branchMeta: Record<string, { minX: number; minY: number; maxX: number; maxY: number }> = {}
    for (const [branch, items] of Object.entries(byBranch)) {
      const xs = items.map((i) => i.gridX)
      const ys = items.map((i) => i.gridY)
      branchMeta[branch] = {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      }
    }

    const branches = BRANCH_ORDER.filter((b) => byBranch[b])
    return { branches, byBranch, branchMeta }
  },
}
