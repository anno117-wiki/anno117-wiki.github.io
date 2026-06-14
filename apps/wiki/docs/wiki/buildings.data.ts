import effectsJson from './buildings-effects.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

interface BuildingEffect {
  id: string
  nameEn: string
  nameJa: string | null
  tier: string
  maintenance: number
  population: number
  income: number
  faith: number
  knowledge: number
  prestige: number
  health: number
  happiness: number
  fireSafety: number
}

export default {
  load(): { buildings: BuildingEffect[] } {
    const tierNames = (jaJson as { populationTiers: Record<string, string> }).populationTiers
    const buildings = effectsJson.buildings.map((b) => ({
      ...b,
      tierJa: tierNames[b.tier] ?? b.tier,
    }))
    return { buildings }
  },
}
