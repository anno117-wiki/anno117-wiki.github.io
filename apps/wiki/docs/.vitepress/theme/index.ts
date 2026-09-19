import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import StatBar from '../components/StatBar.vue'
import TechLinks from '../components/TechLinks.vue'
import SkillTreeBranch from '../components/SkillTreeBranch.vue'
import UpdateLog from '../components/UpdateLog.vue'
import BuildingsTable from '../components/BuildingsTable.vue'
import PatronDetail from '../components/PatronDetail.vue'
import GoodsProducers from '../components/GoodsProducers.vue'
import type { App } from 'vue'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: App }) {
    app.component('StatBar', StatBar)
    app.component('TechLinks', TechLinks)
    app.component('SkillTreeBranch', SkillTreeBranch)
    app.component('UpdateLog', UpdateLog)
    app.component('BuildingsTable', BuildingsTable)
    app.component('PatronDetail', PatronDetail)
    app.component('GoodsProducers', GoodsProducers)
  },
}
