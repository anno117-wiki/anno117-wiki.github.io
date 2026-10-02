export type Role = '家老' | '侍' | '忍者' | '隠密'

declare module 'claude-code' {
  interface PluginState {
    'anno-roles': { role: Role | null }
  }
}
