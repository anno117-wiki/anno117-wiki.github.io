import effectsJson from './buildings-effects.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
import itemsFullJson from '../../../../packages/shared/public/data/items-full.json'

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
  /** この建物を対象とするアイテムの件数 */
  itemCount: number
  /** スキルを取ると付近の建物に追加で付く効果（表の数値には含めない） */
  skillBonuses?: { skill: string; effects: Record<string, number> }[]
}

// 建物名(nameJa) -> この建物を対象とするアイテム件数。
// ビルド時に集計し、クライアントへ items-full.json 本体を送らないようにする。
function countItemsByTarget(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const it of itemsFullJson as { targets?: string }[]) {
    if (!it.targets) continue
    for (const name of it.targets.split('、')) {
      counts[name] = (counts[name] ?? 0) + 1
    }
  }
  return counts
}

function getCategory(icon?: string | null): string {
  if (!icon) return 'production'
  if (icon.startsWith('public_')) return 'public'
  if (icon.startsWith('wonder_')) return 'wonder'
  if (icon.startsWith('harbour_')) return 'harbour'
  if (icon.startsWith('military_')) return 'military'
  if (icon.startsWith('institution_')) return 'institution'
  if (icon.startsWith('shrine_')) return 'shrine'
  if (icon.startsWith('base_')) return 'base'
  return 'production'
}

export default {
  load(): { buildings: BuildingEffect[] } {
    const tierNames = (jaJson as { populationTiers: Record<string, string> }).populationTiers
    const itemCounts = countItemsByTarget()
    const buildings = effectsJson.buildings.map((b) => ({
      ...b,
      tierJa: tierNames[b.tier] ?? b.tier,
      category: getCategory(b.icon),
      itemCount: b.nameJa ? (itemCounts[b.nameJa] ?? 0) : 0,
    }))
    return { buildings }
  },
}
