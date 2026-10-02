import { expect, test } from 'claude-code/testing'

test('bun run build 単独は拒否され、実行されない', async ($, on) => {
  let ran = 0
  on('tool.call', { tool: 'Bash' }, async () => {
    ran += 1

    return { result: { stdout: '', stderr: '', interrupted: false } } as never
  })

  const result = await $.tool.call({ tool: 'Bash', command: 'bun run build' })

  expect(ran).toBe(0)
  expect(String(result.deny)).toContain('build:site')
})

test('build:site や build:wiki は通す', async ($, on) => {
  const seen: string[] = []
  on('tool.call', { tool: 'Bash' }, async (_$, e) => {
    seen.push(e.command)

    return { result: { stdout: '', stderr: '', interrupted: false } } as never
  })

  await $.tool.call({ tool: 'Bash', command: 'bun run build:wiki', run_in_background: true })
  await $.tool.call({ tool: 'Bash', command: 'bun run build:vite' })

  expect(seen).toEqual(['bun run build:wiki', 'bun run build:vite'])
})
