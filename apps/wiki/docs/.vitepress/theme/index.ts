import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import StatBar from '../components/StatBar.vue'
import TechLinks from '../components/TechLinks.vue'
import UpdateLog from '../components/UpdateLog.vue'
import BuildingsTable from '../components/BuildingsTable.vue'
import type { App } from 'vue'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: App }) {
    app.component('StatBar', StatBar)
    app.component('TechLinks', TechLinks)
    app.component('UpdateLog', UpdateLog)
    app.component('BuildingsTable', BuildingsTable)
  },
}
