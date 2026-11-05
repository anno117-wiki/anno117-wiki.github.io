import listJson from '../../../../packages/shared/public/productions/list.json'
import jaJson from '../../../../packages/shared/public/i18n/locales/ja.json'
import producersJson from './goods-producers.json'
// アイギュプト(DLC03)で作れる商品。tools/build-regions-aegyptus.py で生成
import aegyptusJson from './regions-aegyptus.json'

interface GoodEntry {
  id: string
  nameJa: string
  nameEn: string
  icon: string
  category: string
  regions: string[]
  // 生産元ごとに建物効果などが異なる商品（石炭・金鉱石）だけ持つ
  producers?: unknown[]
  /** 計算機で開けるか。アイギュプトの新商品は計算機が未対応なので false */
  calc: boolean
}

const CATEGORY_ORDER = ['food', 'construction', 'fashion', 'culture', 'household', 'intermediate', 'resource']

export default {
  load(): { byCategory: Record<string, GoodEntry[]>; categories: string[] } {
    const jaGoods = (jaJson as { goods: Record<string, string> }).goods

    // 既存の商品のうち、アイギュプトでも作れるもの
    const alsoEgyptian = new Set<string>(aegyptusJson.shared)

    // 計算機の一覧(list.json)に入ったアイギュプト分(aegyptus_*)は、wikiでは専用データから足しているので除く
    const goods: GoodEntry[] = (listJson as { goods: any[] }).goods.filter((g) => !g.id.startsWith('aegyptus_')).map((g) => ({
      id: g.id,
      nameJa: jaGoods[g.id] ?? g.displayName,
      nameEn: g.displayName,
      icon: g.icon ?? '',
      category: g.category,
      regions: [...new Set([...(g.regions as string[]), ...(alsoEgyptian.has(g.id) ? ['Egyptian'] : [])])],
      producers: (producersJson as { goods: Record<string, unknown[]> }).goods[g.id],
      calc: true,
    }))

    // アイギュプト専用の新商品（計算機には無いので、wiki専用のデータから足す）
    for (const e of aegyptusJson.exclusive) {
      goods.push({
        id: e.id,
        nameJa: e.nameJa,
        nameEn: e.nameEn,
        icon: e.icon,
        category: e.category,
        regions: ['Egyptian'],
        calc: false,
      })
    }

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
