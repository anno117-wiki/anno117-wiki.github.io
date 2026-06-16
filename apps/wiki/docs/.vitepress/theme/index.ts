import DefaultTheme from 'vitepress/theme'
import './custom.css'
import StatBar from '../components/StatBar.vue'
import type { App } from 'vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }: { app: App }) {
    app.component('StatBar', StatBar)
  },
}
