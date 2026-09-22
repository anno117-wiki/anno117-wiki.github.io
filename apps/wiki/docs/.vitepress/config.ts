import { defineConfig } from 'vitepress'
import type { HeadConfig, PageData } from 'vitepress'
import { fileURLToPath } from 'url'

// Anno 117 統合Wiki — VitePress 設定
// 配信規約: wiki = '/'（ルート）、calculator = '/calculator/'
// 計算機本体は別SPA。本wikiからは誘導リンクで案内する（フルUI埋め込みはしない）。

const SITE_HOSTNAME = 'https://anno117-wiki.github.io/'
const SITE_NAME = 'Anno 117攻略Wiki'
const SITE_DESCRIPTION = 'Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機'
// SNS共有カード用の画像（1200x630）。og:image は絶対URL必須
const OGP_IMAGE = SITE_HOSTNAME + 'images/ogp.png'

// X / Discord / LINE 等でURLを共有したときのカード表示用メタタグ
function buildOgpTags(pageData: PageData): HeadConfig[] {
  const path = pageData.relativePath
  const title = pageData.frontmatter.title || pageData.title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const description = pageData.description || SITE_DESCRIPTION
  const url = path === 'index.md' ? SITE_HOSTNAME : SITE_HOSTNAME + path.replace(/\.md$/, '.html')

  return [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:locale', content: 'ja_JP' }],
    ['meta', { property: 'og:title', content: fullTitle }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:image', content: OGP_IMAGE }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: fullTitle }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: OGP_IMAGE }],
  ]
}

// パンくずJSON-LD用: サイドバー階層のうち「親ページ」を持つページだけ登録する。
// 未登録ページは「ホーム > 自ページ」の2階層になる。
const BREADCRUMB_PARENT: Record<string, { path: string; name: string }> = {
  'guide/early-game-strategy.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/economy-guide.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/research-guide.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/trade-guide.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/military-guide.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/dlc01-ashes-of-prophecy.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/dlc02-hippodrome.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/dlc03-dawn-of-delta.md': { path: '/guide/strategy', name: '攻略ガイド' },
  'guide/calculator-guide.md': { path: '/guide/getting-started', name: 'はじめに' },
}

export default defineConfig({
  lang: 'ja-JP',
  title: 'Anno117DB',
  titleTemplate: ':title | Anno 117攻略Wiki',
  description: SITE_DESCRIPTION,

  // Google検索向け sitemap.xml をビルド時に自動生成
  sitemap: {
    hostname: 'https://anno117-wiki.github.io/',
    // /calculator/ はVitePress外の別SPAビルドのため、自動収集対象に含まれない。手動で追加する
    transformItems: (items) => [...items, { url: '/calculator/' }],
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/images/anno_icon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/images/anno_icon.png' }],
  ],

  // 全ページにOGPを付与。加えて検索結果にパンくずを表示させるための BreadcrumbList 構造化データ
  transformHead: ({ pageData }) => {
    const ogp = buildOgpTags(pageData)
    const path = pageData.relativePath
    const title = pageData.frontmatter.title || pageData.title
    if (path === 'index.md' || !title) return ogp

    const items: { name: string; url: string }[] = [{ name: 'ホーム', url: SITE_HOSTNAME }]

    const parent = BREADCRUMB_PARENT[path]
    if (parent) {
      items.push({ name: parent.name, url: SITE_HOSTNAME + parent.path.slice(1) + '.html' })
    }
    items.push({ name: title, url: SITE_HOSTNAME + path.replace(/\.md$/, '.html') })

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    }

    return [...ogp, ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)]]
  },

  // 配信規約: wiki はルート配信
  base: '/',

  vite: {
    // VitePressのsrcDir(apps/wiki/docs)とpackage.jsonのあるワークスペースルート(apps/wiki)がズレているため、
    // .env.production(apps/wiki直下に置く慣習)をViteが見つけられるよう明示する。
    // 未指定だとVITE_WORKER_URL等が常にundefinedになり、UserComments.vueのfetch先が壊れる。
    envDir: fileURLToPath(new URL('../../', import.meta.url)),
  },

  // '/calculator/' は別SPA（VitePress 管理外）。
  // 内部リンク判定で dead-link 扱いされるのを避けるため除外する。
  ignoreDeadLinks: [/^\/calculator/],

  search: {
    provider: 'local',
  },

  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '攻略ガイド', link: '/guide/strategy' },
      {
        text: 'データベース',
        activeMatch: '^/wiki/',
        items: [
          {
            text: '生産',
            items: [
              { text: '商品一覧', link: '/wiki/goods' },
              { text: '生産チェーン一覧', link: '/wiki/production-chains' },
              { text: '地域別商品', link: '/wiki/regions' },
              { text: '商品需要逆引き', link: '/wiki/needs-index' },
            ],
          },
          {
            text: '建物・住民',
            items: [
              { text: '建物効果', link: '/wiki/buildings' },
              { text: '住民層', link: '/wiki/population' },
            ],
          },
          {
            text: '成長・信仰',
            items: [
              { text: 'スキルツリー', link: '/wiki/techs' },
              { text: '信仰神', link: '/wiki/patrons' },
              { text: 'モニュメントの輝き', link: '/wiki/splendor' },
            ],
          },
          {
            text: 'アイテム',
            items: [{ text: 'アイテム一覧', link: '/wiki/items' }],
          },
        ],
      },
      { text: '更新履歴', link: '/updates' },
      // 計算機は別SPA。同タブ遷移で /calculator/ へ誘導。
      { text: '計算機', link: '/calculator/', target: '_self' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '攻略ガイド',
          items: [
            {
              text: '攻略ガイド一覧',
              link: '/guide/strategy',
              items: [
                { text: '序盤攻略・基本戦略', link: '/guide/early-game-strategy' },
                { text: '経済・収入最適化', link: '/guide/economy-guide' },
                { text: '研究・スキルツリー・専門家', link: '/guide/research-guide' },
                { text: '交易・交易ルート', link: '/guide/trade-guide' },
                { text: '軍事・戦闘', link: '/guide/military-guide' },
              ],
            },
            {
              text: 'DLC要素',
              items: [
                { text: 'DLC01・灰の予言', link: '/guide/dlc01-ashes-of-prophecy' },
                { text: 'DLC02・競馬場', link: '/guide/dlc02-hippodrome' },
                { text: 'DLC03・デルタの夜明け', link: '/guide/dlc03-dawn-of-delta' },
              ],
            },
          ],
        },
        {
          text: 'このWikiについて',
          items: [
            {
              text: 'はじめに',
              link: '/guide/getting-started',
              items: [
                { text: '計算機の使い方', link: '/guide/calculator-guide' },
              ],
            },
          ],
        },
      ],
      '/wiki/': [
        {
          text: '生産',
          items: [
            { text: '商品一覧', link: '/wiki/goods' },
            { text: '生産チェーン一覧', link: '/wiki/production-chains' },
            { text: '地域別商品', link: '/wiki/regions' },
            { text: '商品需要逆引き', link: '/wiki/needs-index' },
          ],
        },
        {
          text: '建物・住民',
          items: [
            { text: '建物効果', link: '/wiki/buildings' },
            { text: '住民層', link: '/wiki/population' },
          ],
        },
        {
          text: '成長・信仰',
          items: [
            {
              text: 'スキルツリー',
              link: '/wiki/techs',
              items: [
                { text: '経済', link: '/wiki/techs-economy' },
                { text: '市民', link: '/wiki/techs-civic' },
                { text: '軍事', link: '/wiki/techs-military' },
                { text: '灰の予言', link: '/wiki/techs-dlc01' },
                { text: '競馬場', link: '/wiki/techs-dlc02' },
              ],
            },
            { text: '信仰神', link: '/wiki/patrons' },
            { text: 'モニュメントの輝き', link: '/wiki/splendor' },
          ],
        },
        {
          text: 'アイテム',
          items: [{ text: 'アイテム一覧', link: '/wiki/items' }],
        },
      ],
    },

    docFooter: {
      prev: false,
      next: false,
    },
  },
})
