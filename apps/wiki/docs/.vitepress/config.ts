import { defineConfig } from 'vitepress'

// Anno 117 統合Wiki — VitePress 設定
// 配信規約: wiki = '/'（ルート）、calculator = '/calculator/'
// 計算機本体は別SPA。本wikiからは誘導リンクで案内する（フルUI埋め込みはしない）。
export default defineConfig({
  lang: 'ja-JP',
  title: 'Anno117DB',
  titleTemplate: ':title | Anno117DB',
  description: 'Anno 117（PS5/Steam）の日本語情報Wiki + 生産チェーン計算機',

  // Google検索向け sitemap.xml をビルド時に自動生成
  sitemap: {
    hostname: 'https://anno117-wiki.github.io/',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/images/anno_icon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/images/anno_icon.png' }],
  ],

  // 配信規約: wiki はルート配信
  base: '/',

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
      { text: '商品', link: '/wiki/goods' },
      { text: '生産品', link: '/wiki/production-chains' },
      { text: '建物効果', link: '/wiki/buildings' },
      { text: '住民', link: '/wiki/population' },
      { text: 'アイテム', link: '/wiki/items' },
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
        { text: '生産品一覧', link: '/wiki/goods' },
        { text: '生産チェーン一覧', link: '/wiki/production-chains' },
        { text: '建物効果', link: '/wiki/buildings' },
        { text: 'スキルツリー', link: '/wiki/techs' },
        { text: '住民層', link: '/wiki/population' },
        { text: '生産品需要逆引き', link: '/wiki/needs-index' },
        { text: 'アイテム一覧', link: '/wiki/items' },
      ],
    },

    docFooter: {
      prev: false,
      next: false,
    },
  },
})
