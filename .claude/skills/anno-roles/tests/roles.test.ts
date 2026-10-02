import { expect, test } from 'claude-code/testing'

const ok = { result: { type: 'update', filePath: 'a.md' } } as never

const start = async ($: any, on: any) => {
  on('classic.SessionStart', async () => ({}))
  await $.classic.SessionStart({ source: 'startup' })
}

test('家老のあいだは Edit を拒否し、解除すれば通す', async ($, on) => {
  let edits = 0
  on('tool.call', { tool: 'Edit' }, async () => {
    edits += 1

    return ok
  })
  const edit = () =>
    $.tool.call({ tool: 'Edit', file_path: 'a.md', old_string: 'a', new_string: 'b' })

  await start($, on)
  await $.command.run({ command: 'role', args: '家老' })
  const denied = await edit()
  expect(String(denied.deny)).toContain('家老')
  expect(edits).toBe(0)

  await $.command.run({ command: 'role', args: '解除' })
  await edit()
  expect(edits).toBe(1)
})

test('侍は Edit を使える', async ($, on) => {
  let edits = 0
  on('tool.call', { tool: 'Edit' }, async () => {
    edits += 1

    return ok
  })

  await start($, on)
  await $.command.run({ command: 'role', args: '侍' })
  await $.tool.call({ tool: 'Edit', file_path: 'a.md', old_string: 'a', new_string: 'b' })

  expect(edits).toBe(1)
})

test('不明な役は受け付けない', async ($, on) => {
  await start($, on)
  const answer = await $.command.run({ command: 'role', args: '殿' })

  expect(String(answer.text)).toContain('不明な役')
})
