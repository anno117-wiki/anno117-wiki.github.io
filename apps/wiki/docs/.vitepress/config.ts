import { defineConfig } from 'vitepress'
import type { HeadConfig, PageData } from 'vitepress'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { readFileSync } from 'fs'

// Anno 117攻略Wiki — VitePress 設定
// 配信規約: wiki = '/'（ルート）、calculator = '/calculator/'
// 計算機本体は別SPA。本wikiからは誘導リンクで案内する（フルUI埋め込みはしない）。

const SITE_HOSTNAME = 'https://anno117-wiki.github.io/'
const SITE_NAME = 'Anno 117攻略Wiki'
const SITE_DESCRIPTION = 'Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機'
// SNS共有カード用の画像（1200x630）。og:image は絶対URL必須
const OGP_IMAGE = SITE_HOSTNAME + 'images/ogp.png'

// sitemap の lastmod 用
const DOCS_DIR = fileURLToPath(new URL('../', import.meta.url))
const CALCULATOR_SRC = fileURLToPath(new URL('../../../calculator/src/', import.meta.url))

// DLC03のスキルツリーページ(wiki/techs-dlc03.md)は、techs.json に公開できるスキル
// （hidden でない dlc03 のエントリ）が入るまでビルド対象・サイドバーから外す。
// スキルを登録すれば、設定を触らなくてもページとサイドバー項目が出る。
function hasPublishedDlc03Techs(): boolean {
  try {
    const json = JSON.parse(readFileSync(DOCS_DIR + 'wiki/techs.json', 'utf8')) as {
      techs: { hidden?: boolean; branchOverride?: string; internalName?: string }[]
    }
    return json.techs.some(
      (t) => !t.hidden && (t.branchOverride ? t.branchOverride === 'dlc03' : (t.internalName ?? '').includes('DLC03')),
    )
  } catch (e) {
    console.warn('[config] techs.json を読めないため、DLC03スキルツリーページは非公開のままにします', e)
    return false
  }
}
const DLC03_TECHS_READY = hasPublishedDlc03Techs()

// sitemap の URL（例: 'wiki/goods.html'、トップは ''、入口ページは 'wiki/'）→ 元の .md ファイルの絶対パス
function sourcePathForUrl(url: string): string {
  const rel = url.replace(/^\//, '')
  if (rel === '' || rel.endsWith('/')) return DOCS_DIR + rel + 'index.md'
  return DOCS_DIR + rel.replace(/\.html$/, '.md')
}

// git の最終コミット日時（ISO 8601）。取得できなければ undefined（lastmod を出さない）
function gitLastModified(path: string): string | undefined {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], { encoding: 'utf8' }).trim()
    return out || undefined
  } catch (e) {
    console.warn(`[sitemap] lastmod 取得失敗: ${path}`, e)
    return undefined
  }
}

// ページの正規URL（og:url と canonical で共用）
// index.md はディレクトリURL（'/'、'/wiki/'）で表す
function pageUrl(relativePath: string): string {
  if (relativePath === 'index.md' || relativePath.endsWith('/index.md')) {
    return SITE_HOSTNAME + relativePath.replace(/index\.md$/, '')
  }
  return SITE_HOSTNAME + relativePath.replace(/\.md$/, '.html')
}

// 検索エンジン向けの正規URL指定。?target= 等のクエリ付きURLを同一ページとして扱わせる
function buildCanonicalTag(pageData: PageData): HeadConfig[] {
  if (pageData.isNotFound) return []
  return [['link', { rel: 'canonical', href: pageUrl(pageData.relativePath) }]]
}

// X / Discord / LINE 等でURLを共有したときのカード表示用メタタグ
function buildOgpTags(pageData: PageData): HeadConfig[] {
  const title = pageData.frontmatter.title || pageData.title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const description = pageData.description || SITE_DESCRIPTION
  const url = pageUrl(pageData.relativePath)

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

// トップページ用: 検索結果に表示されるサイト名を安定させる WebSite 構造化データ。
// alternateName は旧表記（ナビに使っていた略称）
function buildWebSiteJsonLd(): HeadConfig {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['Anno117DB', 'アノ117 攻略Wiki'],
    url: SITE_HOSTNAME,
    inLanguage: 'ja',
  }
  return ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)]
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

// データベース配下の各ページは入口ページ(/wiki/)を親とする
function breadcrumbParent(relativePath: string): { path: string; name: string } | undefined {
  if (relativePath.startsWith('wiki/') && relativePath !== 'wiki/index.md') {
    return { path: '/wiki/', name: 'データベース' }
  }
  return BREADCRUMB_PARENT[relativePath]
}

export default defineConfig({
  lang: 'ja-JP',
  title: SITE_NAME,
  titleTemplate: `:title | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  srcExclude: DLC03_TECHS_READY ? [] : ['wiki/techs-dlc03.md'],

  // Google検索向け sitemap.xml をビルド時に自動生成
  sitemap: {
    hostname: 'https://anno117-wiki.github.io/',
    // /calculator/ はVitePress外の別SPAビルドのため、自動収集対象に含まれない。手動で追加する
    // lastmod はソースの最終コミット日（VitePress の lastUpdated はページに表示も出るため使わない）
    transformItems: (items) => [
      ...items.map((item) => ({ ...item, lastmod: gitLastModified(sourcePathForUrl(item.url)) })),
      { url: '/calculator/', lastmod: gitLastModified(CALCULATOR_SRC) },
    ],
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/images/anno_icon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/images/anno_icon.png' }],
  ],

  // 全ページにcanonical・OGPを付与。加えて検索結果にパンくずを表示させるための BreadcrumbList 構造化データ
  transformHead: ({ pageData }) => {
    const ogp = [...buildCanonicalTag(pageData), ...buildOgpTags(pageData)]
    const path = pageData.relativePath
    const title = pageData.frontmatter.title || pageData.title
    if (path === 'index.md') return [...ogp, buildWebSiteJsonLd()]
    if (!title) return ogp

    const items: { name: string; url: string }[] = [{ name: 'ホーム', url: SITE_HOSTNAME }]

    const parent = breadcrumbParent(path)
    if (parent) {
      const parentFile = parent.path.endsWith('/') ? parent.path + 'index.md' : parent.path + '.md'
      items.push({ name: parent.name, url: pageUrl(parentFile.slice(1)) })
    }
    items.push({ name: title, url: pageUrl(path) })

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
          { text: 'データベース一覧', link: '/wiki/' },
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
        { text: 'データベース一覧', link: '/wiki/' },
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
                ...(DLC03_TECHS_READY ? [{ text: 'デルタの夜明け', link: '/wiki/techs-dlc03' }] : []),
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
