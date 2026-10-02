import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Role } from '../types'

const ROLES: readonly Role[] = ['家老', '侍', '忍者', '隠密']
const CLEAR_WORD = '解除'

// 家老が使ってはならない実作業ツール
const KARO_FORBIDDEN_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'Bash', 'PowerShell'])

const role = atom({ plugin: 'anno-roles', key: 'role' } as const, null)

const isRole = (text: string): text is Role => (ROLES as readonly string[]).includes(text)
const statusText = (current: Role | null) => (current ? `役: ${current}` : undefined)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'role',
      description: `このセッションの役を設定（${ROLES.join(' / ')} / ${CLEAR_WORD}）`,
    })
    // ホットリロード後もステータス表示を復元する
    $.ui.status(statusText(await read($, role)))

    return next(e)
  })

  on('command.run', { command: 'role' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === '') {
      const current = await read($, role)

      return { text: current ? `現在の役: ${current}` : '役は未設定です' }
    }

    if (arg === CLEAR_WORD) {
      await update($, role, () => null)
      $.ui.status(undefined)

      return { text: '役を解除しました', context: ['このセッションの役は解除された。'] }
    }

    if (!isRole(arg)) {
      return { text: `不明な役です: ${arg}（${ROLES.join(' / ')} / ${CLEAR_WORD} のいずれか）` }
    }

    await update($, role, () => arg)
    $.ui.status(statusText(arg))

    return { text: `役を「${arg}」に設定しました`, context: [`このセッションの役は${arg}である。`] }
  })

  on('tool.call', async ($, e, next) => {
    if (!KARO_FORBIDDEN_TOOLS.has(e.tool)) return next(e)
    if ((await read($, role)) !== '家老') return next(e)

    return {
      deny:
        `anno-roles: 家老役のため ${e.tool} による直接作業は禁止です。` +
        '侍・忍者へ send_message で委譲してください（役の解除は /role 解除）。',
    }
  })
}
