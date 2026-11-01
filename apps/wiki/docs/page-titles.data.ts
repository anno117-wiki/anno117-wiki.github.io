import { createContentLoader } from 'vitepress'

// ページのパス（例: guide/dlc02-hippodrome）→ 表示タイトル。更新履歴でコメント先を名前で出すために使う
export default createContentLoader('**/*.md', {
  transform(pages) {
    const titles: Record<string, string> = {}
    for (const p of pages) {
      const key = p.url.replace(/^\//, '').replace(/\.html$/, '')
      titles[key] = p.frontmatter.title ?? key
    }
    return titles
  },
})
