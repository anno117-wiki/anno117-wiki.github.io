import raw from './production-chains-official.json'

export interface OfficialChain {
  guid: string
  nameEn: string
  nameJa: string
  region: string
  buildingGuid: string
  buildingNameEn: string
  buildingNameJa: string
  inputBuildingGuids: string[]
}

const REGION_LABELS: Record<string, string> = {
  'Roman':       'ローマ',
  'Celtic':      'ケルト',
  'Roman Celtic': '共通',
}

const REGION_ORDER = ['Roman', 'Celtic', 'Roman Celtic']

export default {
  load(): {
    regions: string[]
    regionLabels: Record<string, string>
    byRegion: Record<string, OfficialChain[]>
  } {
    const byRegion: Record<string, OfficialChain[]> = {}

    for (const c of (raw as any).chains as OfficialChain[]) {
      const r = c.region || 'Roman'
      if (!byRegion[r]) byRegion[r] = []
      byRegion[r].push(c)
    }

    const regions = REGION_ORDER.filter(r => byRegion[r])

    return { regions, regionLabels: REGION_LABELS, byRegion }
  },
}
