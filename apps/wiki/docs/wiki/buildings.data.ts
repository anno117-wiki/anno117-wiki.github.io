import effectsJson from './buildings-effects.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
import itemsFullJson from '../../../../packages/shared/public/data/items-full.json'
// アイギュプト(DLC03)の建物。tools/build-buildings-aegyptus.py で生成
import aegyptusJson from './buildings-aegyptus.json'
// DLC03のスキルが建物に付ける追加効果。tools/build-skill-bonuses-dlc03.py で生成（配信前のデータなので unverified）
import dlc03SkillsJson from './skill-bonuses-dlc03.json'

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
  /** アイギュプトでも同じ効果値の建物は、行を分けずに、アイギュプトの層をここに足す */
  extraTiers?: { tier: string; tierJa: string }[]
  /** この建物を対象とするアイテムの件数 */
  itemCount: number
  /** スキルを取ると付近の建物に追加で付く効果（表の数値には含めない） */
  skillBonuses?: { skill: string; effects: Record<string, number>; unverified?: boolean }[]
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

// アイギュプトの建物は、アイコンが無いので建物の種類(template)から分類を決める
const TEMPLATE_CATEGORY: Record<string, string> = {
  PublicServiceBuilding: 'public',
  Monument: 'wonder',
  MonumentEventBuilding: 'wonder',
  HarborWarehouse: 'harbour',
  HarborDepot: 'harbour',
  TradeBuilding: 'harbour',
  RepairCrane: 'harbour',
  RecruitmentBuilding: 'military',
  MiniInstitutionBuilding: 'institution',
  CityInstitutionBuilding: 'institution',
  ResidenceBuilding: 'base',
}

// 層の名前。ja.json に無いアイギュプトの層と、層が決まらない建物
const EXTRA_TIER_NAMES: Record<string, string> = {
  thresher: '麦打ち人',
  potter: '陶工',
  priestess: '奉唱巫女',
  scribe: '書記',
  gymnasiarch: 'ギムナシアリコス',
  none: '層なし',
}

// 効果値を比べる項目。全て同じなら、アイギュプトの建物は既存の建物と同じ行にまとめる
const EFFECT_KEYS = ['maintenance', 'population', 'income', 'faith', 'knowledge', 'prestige', 'health', 'happiness', 'fireSafety'] as const

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
      tierJa: tierNames[b.tier] ?? EXTRA_TIER_NAMES[b.tier] ?? b.tier,
      category: getCategory(b.icon),
      itemCount: b.nameJa ? (itemCounts[b.nameJa] ?? 0) : 0,
    }))
    // 既にある建物と同じ名前(市場・劇場など)には、地域を付けて区別する
    const existing = new Set(effectsJson.buildings.map((b) => b.nameJa))
    const byName = new Map<string, (typeof buildings)[number] & { extraTiers?: { tier: string; tierJa: string }[] }>()
    for (const b of buildings) if (b.nameJa && !byName.has(b.nameJa)) byName.set(b.nameJa, b)
    const aegyptus = []
    for (const b of aegyptusJson.buildings) {
      const tierJa = EXTRA_TIER_NAMES[b.tier] ?? b.tier
      const same = byName.get(b.nameJa)
      if (same && EFFECT_KEYS.every((k) => same[k] === b[k])) {
        // 既存と効果値が同じ建物は、行を分けず、アイギュプトの層だけを足す
        same.extraTiers = [...(same.extraTiers ?? []), { tier: b.tier, tierJa }]
        continue
      }
      aegyptus.push({
        ...b,
        nameEn: existing.has(b.nameJa) ? `${b.nameEn} (Aegyptus)` : b.nameEn,
        nameJa: existing.has(b.nameJa) ? `${b.nameJa}（アイギュプト）` : b.nameJa,
        tierJa,
        category: TEMPLATE_CATEGORY[b.template] ?? 'production',
        itemCount: itemCounts[b.nameJa] ?? 0,
      })
    }
    const all: (BuildingEffect | (typeof aegyptus)[number])[] = [...buildings, ...aegyptus]
    // DLC03のスキルの追加効果を、建物名が同じ行に足す（ゲームの配信前データ。画面に「未確認です」と出す）
    for (const bonus of dlc03SkillsJson.bonuses) {
      const rows = all.filter((b) => b.nameJa === bonus.building)
      if (!rows.length) throw new Error(`スキルの追加効果の建物が見つからない: ${bonus.building}`)
      for (const row of rows) {
        const r = row as { skillBonuses?: BuildingEffect['skillBonuses'] }
        r.skillBonuses = [...(r.skillBonuses ?? []), { skill: bonus.skill, effects: bonus.effects, unverified: true }]
      }
    }
    // 効果の補正値（スキルの追加効果を含む）も関連アイテムも無い建物は載せない
    const hasValue = (b: BuildingEffect) =>
      b.itemCount > 0 || (b.skillBonuses?.length ?? 0) > 0 || EFFECT_KEYS.some((k) => k !== 'maintenance' && b[k] !== 0)
    return { buildings: all.filter(hasValue) }
  },
}
