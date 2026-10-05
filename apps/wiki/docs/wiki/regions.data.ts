import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

interface GoodEntry {
  id: string
  nameJa: string
  nameEn: string
  category: string
  // 生産できる地域の表示名（複数地域で作れる商品の一覧で使う）
  regionsJa: string
}

const CATEGORY_LABEL: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
}

// 地域の内部キー → 表示名。DLC03（アエギプトゥス）は商品データが入るまで該当0件で、ページには出ない
const REGION_LABEL: Record<string, string> = {
  Roman: 'ラティウム',
  Celtic: 'アルビオン',
  Egyptian: 'アエギプトゥス',
}

export default {
  load(): {
    roman: GoodEntry[]
    celtic: GoodEntry[]
    egyptian: GoodEntry[]
    both: GoodEntry[]
    romanCount: number
    celticCount: number
    egyptianCount: number
    bothCount: number
    // アエギプトゥスで作れる商品が1つでもあるか（3地域表示への切替に使う）
    hasEgyptian: boolean
  } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    const toEntry = (g: any, regions: string[]): GoodEntry => ({
      id: g.id,
      nameJa: jaGoods[g.id] ?? g.displayName,
      nameEn: g.displayName,
      category: g.category,
      regionsJa: regions.map((r) => REGION_LABEL[r]).join('・'),
    })

    const sort = (arr: GoodEntry[]) =>
      arr.sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'))

    // 1地域だけで作れる商品は地域ごと、2地域以上で作れる商品は both に入れる
    const exclusive: Record<string, GoodEntry[]> = { Roman: [], Celtic: [], Egyptian: [] }
    const both: GoodEntry[] = []
    let hasEgyptian = false

    for (const g of (listJson as { goods: any[] }).goods) {
      const all = (g.regions ?? []) as string[]
      const known = Object.keys(REGION_LABEL).filter((r) => all.includes(r))
      const unknown = all.filter((r) => !(r in REGION_LABEL))
      if (unknown.length > 0) {
        console.warn(`[regions] 未対応の地域キー: ${g.id} → ${unknown.join(', ')}`)
      }
      if (known.length === 0) {
        console.warn(`[regions] 地域が分からないため一覧から除外: ${g.id}`)
        continue
      }
      if (known.includes('Egyptian')) hasEgyptian = true
      if (known.length === 1) {
        exclusive[known[0]].push(toEntry(g, known))
      } else {
        both.push(toEntry(g, known))
      }
    }

    return {
      roman: sort(exclusive.Roman),
      celtic: sort(exclusive.Celtic),
      egyptian: sort(exclusive.Egyptian),
      both: sort(both),
      romanCount: exclusive.Roman.length,
      celticCount: exclusive.Celtic.length,
      egyptianCount: exclusive.Egyptian.length,
      bothCount: both.length,
      hasEgyptian,
    }
  },
}
