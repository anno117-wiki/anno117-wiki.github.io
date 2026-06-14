import { defineConfig } from 'vitepress'

// Anno 117 統合Wiki — VitePress 設定
// 配信規約: wiki = '/'（ルート）、calculator = '/calculator/'
// 計算機本体は別SPA。本wikiからは誘導リンクで案内する（フルUI埋め込みはしない）。
export default defineConfig({
  lang: 'ja-JP',
  title: 'Anno 117 統合Wiki',
  description: 'Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機',

  // 配信規約: wiki はルート配信
  base: '/',

  // '/calculator/' は別SPA（VitePress 管理外）。
  // 内部リンク判定で dead-link 扱いされるのを避けるため除外する。
  ignoreDeadLinks: [/^\/calculator/],

  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'ガイド', link: '/guide/getting-started' },
      { text: '商品', link: '/wiki/goods' },
      { text: '生産品', link: '/wiki/production-chains' },
      { text: '建物', link: '/wiki/buildings' },
      { text: '住民', link: '/wiki/population' },
      { text: 'アイテム', link: '/wiki/items' },
      // 計算機は別SPA。同タブ遷移で /calculator/ へ誘導。
      { text: '計算機', link: '/calculator/', target: '_self' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'ガイド',
          items: [
            { text: 'はじめに', link: '/guide/getting-started' },
            { text: '計算機の使い方', link: '/guide/calculator-guide' },
            { text: '用語集', link: '/guide/glossary' },
          ],
        },
      ],
      '/wiki/': [
        {
          text: '商品',
          items: [
            { text: '商品一覧', link: '/wiki/goods' },
            { text: '地域別商品', link: '/wiki/regions' },
          ],
        },
        {
          text: '生産品',
          items: [
            { text: '生産チェーン一覧', link: '/wiki/production-chains' },
            { text: '建物一覧', link: '/wiki/buildings' },
          ],
        },
        {
          text: '住民',
          items: [
            { text: '住民層', link: '/wiki/population' },
          ],
        },
        {
          text: 'アイテム',
          items: [
            { text: 'アイテム一覧', link: '/wiki/items' },
          ],
        },
      ],
    },

    docFooter: {
      prev: false,
      next: false,
    },
  },
})
