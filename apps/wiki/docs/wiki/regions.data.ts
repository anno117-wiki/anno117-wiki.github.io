import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'

interface GoodEntry {
  id: string
  nameJa: string
  nameEn: string
  category: string
}

const CATEGORY_LABEL: Record<string, string> = {
  food: '食料',
  construction: '建設',
  fashion: 'ファッション',
  culture: '文化',
}

export default {
  load(): {
    roman: GoodEntry[]
    celtic: GoodEntry[]
    both: GoodEntry[]
    romanCount: number
    celticCount: number
    bothCount: number
  } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    const toEntry = (g: any): GoodEntry => ({
      id: g.id,
      nameJa: jaGoods[g.id] ?? g.displayName,
      nameEn: g.displayName,
      category: g.category,
    })

    const sort = (arr: GoodEntry[]) =>
      arr.sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'))

    const roman: GoodEntry[] = []
    const celtic: GoodEntry[] = []
    const both: GoodEntry[] = []

    for (const g of (listJson as { goods: any[] }).goods) {
      const r = g.regions as string[]
      if (r.includes('Roman') && r.includes('Celtic')) {
        both.push(toEntry(g))
      } else if (r.includes('Roman')) {
        roman.push(toEntry(g))
      } else {
        celtic.push(toEntry(g))
      }
    }

    return {
      roman: sort(roman),
      celtic: sort(celtic),
      both: sort(both),
      romanCount: roman.length,
      celticCount: celtic.length,
      bothCount: both.length,
    }
  },
}
