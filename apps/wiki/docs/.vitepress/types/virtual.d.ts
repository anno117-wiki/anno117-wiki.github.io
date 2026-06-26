declare module 'virtual:git-history' {
  export const gitHistory: Array<{
    date: string
    text: string
    type: 'post' | 'fix'
  }>
}
