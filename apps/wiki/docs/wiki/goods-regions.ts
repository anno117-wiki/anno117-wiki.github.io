/**
 * wiki の商品の「作れる地域」を決める。
 *
 * もとは計算機の list.json の regions。list.json は計算機と共用で、計算機側の表示を変えないために直さない。
 * そこで wiki だけ、ここで足りない地域を足す。
 *
 * 根拠: Planner 3.0.1 の工場データ（炭焼き師はラティウム・アルビオン・アイギュプトの3地域にある）。
 */
const EXTRA_REGIONS: Record<string, string[]> = {
  charcoal: ['Celtic'],
}

/** list.json の地域に、アイギュプト(alsoEgyptian)と上の表の地域を足して返す（重複なし） */
export function wikiRegions(id: string, listRegions: string[] | undefined, alsoEgyptian: Set<string>): string[] {
  return [...new Set([
    ...(listRegions ?? []),
    ...(alsoEgyptian.has(id) ? ['Egyptian'] : []),
    ...(EXTRA_REGIONS[id] ?? []),
  ])]
}
