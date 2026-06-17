import effectsJson from './buildings-effects.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

interface BuildingEffect {
  id: string
  nameEn: string
  nameJa: string | null
  tier: string
  icon?: string
  category: string
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

function getCategory(icon?: string | null): string {
  if (!icon) return 'production'
  if (icon.startsWith('public_')) return 'public'
  if (icon.startsWith('wonder_')) return 'wonder'
  if (icon.startsWith('harbour_')) return 'harbour'
  if (icon.startsWith('military_')) return 'military'
  if (icon.startsWith('institution_')) return 'institution'
  if (icon.startsWith('base_')) return 'base'
  return 'production'
}

export default {
  load(): { buildings: BuildingEffect[] } {
    const tierNames = (jaJson as { populationTiers: Record<string, string> }).populationTiers
    const buildings = effectsJson.buildings.map((b) => ({
      ...b,
      tierJa: tierNames[b.tier] ?? b.tier,
      category: getCategory(b.icon),
    }))
    return { buildings }
  },
}
