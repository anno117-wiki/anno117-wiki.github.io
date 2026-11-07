/**
 * wiki の商品分類を、ゲーム3.0の「需要のカテゴリー」に合わせる上書き表。
 *
 * list.json の分類は計算機（categories.json の4分類）と共用で、ここの値に変えると計算機の一覧から商品が消える。
 * そのため list.json は直さず、wiki だけがこの表で上書きする。
 *
 * 根拠: Planner 3.0 の needs.json（需要の商品とカテゴリー）。2026-11-07 時点で実機確認済みなのは、
 * エクィテスの「家庭」のアンフォラ・オリーブオイル・馬・筆記板・高級ガラス・小像。
 * ほかはデータだけが根拠で、食い違いがあれば実機を優先して直す。
 */
const CATEGORY_OVERRIDE: Record<string, string> = {
  amphorae: 'household',
  fine_glass: 'household',
  statuettes: 'household',
  writing_tablets: 'household',
  loungers: 'household',
  olive_oil: 'household',
  horses: 'household',
  drinking_horns: 'household',
  handmirrors: 'household',
  soap: 'fashion',
}

/** 商品IDに上書きがあればそれを、なければ元の分類を返す */
export function wikiCategory(id: string, category: string): string {
  return CATEGORY_OVERRIDE[id] ?? category
}
