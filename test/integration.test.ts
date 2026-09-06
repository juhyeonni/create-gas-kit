import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const RUN = Boolean(process.env.INTEGRATION)
const SKIP_MESSAGE = 'set INTEGRATION=1 to run integration tests'
const TIMEOUT_MS = 10 * 60 * 1000

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CLI = path.join(ROOT, 'dist/index.js')

const COMBOS: { name: string; flags: string[] }[] = [
  {
    name: 'base',
    flags: [
      '--client',
      'vanilla',
      '--ui',
      'none',
      '--no-gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'react',
    flags: [
      '--client',
      'react',
      '--ui',
      'none',
      '--no-gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'tailwind',
    flags: [
      '--client',
      'vanilla',
      '--ui',
      'tailwind',
      '--no-gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'shadcn',
    flags: [
      '--client',
      'react',
      '--ui',
      'tailwind',
      '--shadcn',
      '--no-gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'gsquery',
    flags: [
      '--client',
      'vanilla',
      '--ui',
      'none',
      '--gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'gws-emul',
    flags: [
      '--client',
      'vanilla',
      '--ui',
      'none',
      '--no-gsquery',
      '--gws-emul',
    ],
  },
  {
    name: 'all',
    flags: [
      '--client',
      'react',
      '--ui',
      'tailwind',
      '--shadcn',
      '--gsquery',
      '--gws-emul',
    ],
  },
  {
    name: 'vue',
    flags: [
      '--client',
      'vue',
      '--ui',
      'tailwind',
      '--gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'svelte',
    flags: [
      '--client',
      'svelte',
      '--ui',
      'tailwind',
      '--gsquery',
      '--no-gws-emul',
    ],
  },
  {
    name: 'preact',
    flags: [
      '--client',
      'preact',
      '--ui',
      'tailwind',
      '--gsquery',
      '--no-gws-emul',
    ],
  },
]

let tmpRoot: string

before(() => {
  if (!RUN) return
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  assert.equal(build.status, 0, `npm run build failed:\n${tail(build)}`)
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cgk-'))
})

after(() => {
  if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true })
})

function tail(result: { stdout?: string; stderr?: string }): string {
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return out.slice(-2000)
}

function run(cmd: string, args: string[], cwd: string) {
  return spawnSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf-8' })
}

function assertOk(result: ReturnType<typeof run>, label: string): void {
  assert.equal(result.status, 0, `${label} failed:\n${tail(result)}`)
}

for (const combo of COMBOS) {
  test(combo.name, { skip: !RUN && SKIP_MESSAGE, timeout: TIMEOUT_MS }, () => {
    const start = Date.now()
    const dir = path.join(tmpRoot, combo.name)

    assertOk(
      run('node', [CLI, dir, ...combo.flags, '--no-git', '--no-install'], ROOT),
      'scaffold',
    )

    assertOk(run('pnpm', ['install', '--prefer-offline'], dir), 'pnpm install')
    assertOk(run('pnpm', ['typecheck'], dir), 'pnpm typecheck')
    assertOk(run('pnpm', ['lint'], dir), 'pnpm lint')
    assertOk(run('pnpm', ['test'], dir), 'pnpm test')
    assertOk(run('pnpm', ['build'], dir), 'pnpm build')

    const buildFile = (name: string) => path.join(dir, 'build', name)
    for (const name of ['Code.gs', 'index.html', 'app.html', 'appsscript.json'])
      assert.ok(fs.existsSync(buildFile(name)), `build/${name} is missing`)

    const codeGs = fs.readFileSync(buildFile('Code.gs'), 'utf-8')
    assert.match(codeGs, /function doGet/)
    assert.match(codeGs, /function rpc/)
    assert.ok(
      !codeGs.split('\n').some((line) => /^(import|export) /.test(line)),
      'Code.gs has a line starting with import/export',
    )

    const appHtml = fs.readFileSync(buildFile('app.html'), 'utf-8')
    assert.ok(!appHtml.includes('`'), 'app.html contains a backtick')

    const appsscript = JSON.parse(
      fs.readFileSync(buildFile('appsscript.json'), 'utf-8'),
    )
    assert.ok(appsscript.timeZone, 'appsscript.json is missing timeZone')

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`[integration] ${combo.name}: ${elapsed}s`)
  })
}
