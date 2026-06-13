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
      // 計算機は別SPA。同タブ遷移で /calculator/ へ誘導。
      { text: '計算機', link: '/calculator/', target: '_self' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'ガイド',
          items: [
            { text: 'はじめに', link: '/guide/getting-started' },
          ],
        },
      ],
      '/wiki/': [
        {
          text: 'Wiki',
          items: [
            { text: '商品', link: '/wiki/goods' },
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
