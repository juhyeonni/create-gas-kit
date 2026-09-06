import { parseArgs } from 'node:util'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  intro,
  outro,
  text,
  select,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts'
import pkg from '../package.json' with { type: 'json' }
import { scaffold } from './scaffold.ts'
import { detectPm, installCommand, runCommand } from './pm.ts'

const EXIT_OK = 0
const EXIT_FAIL = 1
const EXIT_USAGE = 2

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/

function usage(): string {
  return `Usage: create-gas-kit [dir] [flags]

  --client <react|vanilla>    client framework (default react)
  --ui <tailwind|none>        styling (default tailwind)
  --shadcn / --no-shadcn      shadcn/ui, react + tailwind only (default on)
  --gsquery / --no-gsquery    gas-sheets-query example (default off)
  --gws-emul / --no-gws-emul  local GWS emulator (default off)
  --no-git                    skip git init
  --no-install                skip dependency install
  -h, --help                  print this help
  -v, --version               print the version
`
}

function usageError(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(EXIT_USAGE)
}

function failure(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(EXIT_FAIL)
}

async function cancelled(): Promise<never> {
  cancel('Cancelled')
  process.exit(EXIT_FAIL)
}

async function resolveDir(positional: string | undefined): Promise<string> {
  if (positional) return positional
  const result = await text({
    message: 'Project name',
    placeholder: 'gas-app',
    defaultValue: 'gas-app',
  })
  if (isCancel(result)) return cancelled()
  return result || 'gas-app'
}

async function resolveChoice<T extends string>(
  flagValue: string | undefined,
  flag: string,
  message: string,
  choices: readonly T[],
  defaultValue: T,
): Promise<T> {
  if (flagValue !== undefined) {
    if (!choices.includes(flagValue as T))
      usageError(
        `Invalid value "${flagValue}" for --${flag} — expected ${choices.join(' or ')}`,
      )
    return flagValue as T
  }
  const result = await select<string>({
    message,
    initialValue: defaultValue,
    options: choices.map((value) => ({ value, label: value })),
  })
  if (isCancel(result)) return cancelled()
  return result as T
}

async function resolveBoolean(
  positiveFlag: boolean | undefined,
  negativeFlag: boolean | undefined,
  message: string,
  defaultValue: boolean,
): Promise<boolean> {
  if (positiveFlag) return true
  if (negativeFlag) return false
  const result = await confirm({ message, initialValue: defaultValue })
  if (isCancel(result)) return cancelled()
  return result
}

function printNextSteps(
  dir: string,
  pm: ReturnType<typeof detectPm>,
  installed: boolean,
): void {
  const lines = [`cd ${dir}`]
  if (!installed) {
    lines.push(installCommand(pm))
    lines.push(runCommand(pm, 'setup'))
  }
  lines.push(runCommand(pm, 'dev'))
  lines.push(runCommand(pm, 'push dev'))
  process.stdout.write(`${lines.join('\n')}\n`)
}

async function main(): Promise<void> {
  let values: {
    client?: string
    ui?: string
    shadcn?: boolean
    'no-shadcn'?: boolean
    gsquery?: boolean
    'no-gsquery'?: boolean
    'gws-emul'?: boolean
    'no-gws-emul'?: boolean
    'no-git'?: boolean
    'no-install'?: boolean
    help?: boolean
    version?: boolean
  }
  let positionals: string[]

  try {
    ;({ values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        client: { type: 'string' },
        ui: { type: 'string' },
        shadcn: { type: 'boolean' },
        'no-shadcn': { type: 'boolean' },
        gsquery: { type: 'boolean' },
        'no-gsquery': { type: 'boolean' },
        'gws-emul': { type: 'boolean' },
        'no-gws-emul': { type: 'boolean' },
        'no-git': { type: 'boolean' },
        'no-install': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
      strict: true,
      allowPositionals: true,
    }))
  } catch (err) {
    usageError(err instanceof Error ? err.message : String(err))
  }

  if (values.help) {
    process.stdout.write(usage())
    process.exit(EXIT_OK)
  }
  if (values.version) {
    process.stdout.write(`${pkg.version}\n`)
    process.exit(EXIT_OK)
  }

  intro('create-gas-kit')

  const dir = await resolveDir(positionals[0])
  const name = path.basename(path.resolve(dir))
  if (!NAME_RE.test(name))
    usageError(`Invalid project name "${name}" — must match ${NAME_RE}`)
  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
    failure(`Directory "${dir}" already exists and is not empty`)
  }

  const client = await resolveChoice(
    values.client,
    'client',
    'Client',
    ['react', 'vanilla'],
    'react',
  )
  const ui = await resolveChoice(
    values.ui,
    'ui',
    'Styling',
    ['tailwind', 'none'],
    'tailwind',
  )
  const shadcn =
    client === 'react' && ui === 'tailwind'
      ? await resolveBoolean(
          values.shadcn,
          values['no-shadcn'],
          'Use shadcn/ui?',
          true,
        )
      : false
  const gsquery = await resolveBoolean(
    values.gsquery,
    values['no-gsquery'],
    'Include the gas-sheets-query example?',
    false,
  )
  const gwsEmul = await resolveBoolean(
    values['gws-emul'],
    values['no-gws-emul'],
    'Include the local GWS emulator?',
    false,
  )
  const git = !values['no-git']
  const install = !values['no-install']

  const templatesDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'templates',
  )
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  scaffold(
    { dir, name, client, ui, shadcn, gsquery, gwsEmul, timeZone },
    templatesDir,
  )

  const pm = detectPm()

  if (git) {
    const result = spawnSync('git', ['init'], { cwd: dir, stdio: 'ignore' })
    if (result.error || result.status !== 0)
      process.stderr.write('Warning: git init failed\n')
  }

  let installed = false
  if (install) {
    const result = spawnSync(pm, ['install'], { cwd: dir, stdio: 'inherit' })
    installed = result.status === 0
    if (!installed) process.stderr.write('Warning: install failed\n')
  }
  if (installed) {
    if (gsquery)
      spawnSync(pm, ['run', 'generate'], { cwd: dir, stdio: 'inherit' })
    spawnSync(pm, ['run', 'setup'], { cwd: dir, stdio: 'inherit' })
  }

  printNextSteps(dir, pm, installed)
  outro('Done')
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(EXIT_FAIL)
})
