import type { EngineInterface, Register } from 'claude-code'

// `bun run build` 単独（build:site / build:wiki 等は対象外）
const BARE_BUILD = /\bbun\s+run\s+build(?![\w:-])/
const BUILD_SITE = /\bbun\s+run\s+build:site\b/

// build:site が正常なら docs/ に必ず存在するもの
const EXPECTED_OUTPUTS = ['docs/index.html', 'docs/wiki', 'docs/calculator']

const DENY_MESSAGE =
  'anno-build-guard: `bun run build` は計算機のみをビルドし、docs/ から wiki が消えます。' +
  '`bun run build:site` を使ってください。'

async function findMissingOutputs($: EngineInterface): Promise<string[]> {
  const cwd = (await $.session.cwd()).replace(/\\/g, '/')
  const missing: string[] = []
  for (const path of EXPECTED_OUTPUTS) {
    if (!(await $.fs.exists(`${cwd}/${path}`))) missing.push(path)
  }

  return missing
}

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    if (e.tool !== 'Bash' && e.tool !== 'PowerShell') return next(e)
    if (BARE_BUILD.test(e.command)) return { deny: DENY_MESSAGE }

    const ran = await next(e)
    const isFinishedBuild =
      BUILD_SITE.test(e.command) && !e.run_in_background && ran.deny === undefined && !ran.isError
    if (!isFinishedBuild) return ran

    try {
      const missing = await findMissingOutputs($)
      if (missing.length === 0) {
        $.ui.toast('build:site 点検: docs/ の wiki・計算機出力を確認しました')

        return ran
      }

      const warning = `build:site 点検: docs/ に ${missing.join(', ')} がありません。コミット前に確認してください。`
      $.ui.toast(warning, { timeoutMs: 10000 })

      return { ...ran, context: [...(ran.context ?? []), warning] }
    } catch (error) {
      $.ui.toast(`build:site 点検に失敗しました: ${String(error)}`, { timeoutMs: 10000 })

      return ran
    }
  })
}
