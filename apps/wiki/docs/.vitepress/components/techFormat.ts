// スキルツリー表示用の整形関数（SkillTreeBranch / SkillEffectList で共用）

/** 効果文・研究条件に含まれる HTML タグ（<b> 等）を除去する */
export function stripTags(s: string): string {
  return s ? s.replace(/<[^>]+>/g, '') : ''
}

/** 知識コストを 1.5k / 2M のような短い表記にする */
export function formatKnowledge(n: number): string {
  if (n >= 1_000_000) return parseFloat((n / 1_000_000).toFixed(1)) + 'M'
  if (n >= 1_000) return parseFloat((n / 1_000).toFixed(1)) + 'k'
  return String(n)
}
