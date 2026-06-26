import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import ProductionMermaid from '../components/ProductionMermaid.vue'
import MermaidDiagram from '../components/MermaidDiagram.vue'
import StatBar from '../components/StatBar.vue'
import TechLinks from '../components/TechLinks.vue'
import type { App } from 'vue'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: App }) {
    app.component('ProductionMermaid', ProductionMermaid)
    app.component('MermaidDiagram', MermaidDiagram)
    app.component('StatBar', StatBar)
    app.component('TechLinks', TechLinks)
  },
}
