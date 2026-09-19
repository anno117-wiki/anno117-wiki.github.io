import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
import producersJson from './goods-producers.json'

interface GoodEntry {
  id: string
  nameJa: string
  nameEn: string
  icon: string
  category: string
  regions: string[]
  // 生産元ごとに建物効果などが異なる商品（石炭・金鉱石）だけ持つ
  producers?: unknown[]
}

const CATEGORY_ORDER = ['food', 'construction', 'fashion', 'culture', 'intermediate', 'resource']

export default {
  load(): { byCategory: Record<string, GoodEntry[]>; categories: string[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    const goods: GoodEntry[] = (listJson as { goods: any[] }).goods.map((g) => ({
      id: g.id,
      nameJa: jaGoods[g.id] ?? g.displayName,
      nameEn: g.displayName,
      icon: g.icon ?? '',
      category: g.category,
      regions: g.regions as string[],
      producers: (producersJson as { goods: Record<string, unknown[]> }).goods[g.id],
    }))

    const byCategory: Record<string, GoodEntry[]> = {}
    for (const good of goods) {
      if (!byCategory[good.category]) byCategory[good.category] = []
      byCategory[good.category].push(good)
    }

    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'))
    }

    const categories = CATEGORY_ORDER.filter((c) => byCategory[c])

    return { byCategory, categories }
  },
}
