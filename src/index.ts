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
  multiselect,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts'
import pkg from '../package.json' with { type: 'json' }
import { scaffold } from './scaffold.ts'
import { CLIENTS } from './overlays.ts'
import { detectPm, installCommand, runCommand } from './pm.ts'

const EXIT_OK = 0
const EXIT_FAIL = 1
const EXIT_USAGE = 2

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/

function usage(): string {
  return `Usage: create-gas-kit [dir] [flags]

  --client <${CLIENTS.join('|')}>    client framework (default react)
  --ui <tailwind|none>        styling (default tailwind)
  --shadcn / --no-shadcn      shadcn/ui, react + tailwind only (default on)
  --gsquery / --no-gsquery    gas-sheets-query example (default off)
  --gws-emul / --no-gws-emul  local GWS emulator (default off)
  --no-git                    skip git init
  --no-install                skip dependency install
  --setup / --no-setup        set up the Apps Script project after install (default on)
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
  hints: Record<T, string>,
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
    options: choices.map((value) => ({
      value,
      label: value,
      hint: hints[value],
    })),
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
  setupDone: boolean,
): void {
  const lines = [`cd ${dir}`]
  if (!installed) lines.push(installCommand(pm))
  if (!setupDone) lines.push(runCommand(pm, 'setup'))
  lines.push(runCommand(pm, 'dev'))
  lines.push(runCommand(pm, 'deploy dev'))
  process.stdout.write(`${lines.join('\n')}\n`)
  process.stdout.write(
    `\ndev runs locally with mocked server calls — deploy dev is what puts it on Google.\n`,
  )
  if (setupDone) return
  process.stdout.write(
    `setup creates or connects the Apps Script project and writes envs.json.\n` +
      `You can also write envs.json by hand: { "dev": { "scriptId": "<scriptId>", "deploymentId": "" } }\n`,
  )
}

interface Flags {
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
  setup?: boolean
  'no-setup'?: boolean
  help?: boolean
  version?: boolean
}

type ExtraKey = 'tailwind' | 'shadcn' | 'gsquery' | 'gwsEmul'

interface Extras {
  ui: 'tailwind' | 'none'
  shadcn: boolean
  gsquery: boolean
  gwsEmul: boolean
}

/** One multiselect for everything optional; flags still win and skip their row. */
async function resolveExtras(values: Flags, client: string): Promise<Extras> {
  if (
    values.ui !== undefined &&
    values.ui !== 'tailwind' &&
    values.ui !== 'none'
  )
    usageError(
      `Invalid value "${values.ui}" for --ui — expected tailwind or none`,
    )

  const fixed: Partial<Record<ExtraKey, boolean>> = {}
  if (values.ui !== undefined) fixed.tailwind = values.ui === 'tailwind'
  if (values.shadcn) fixed.shadcn = true
  if (values['no-shadcn']) fixed.shadcn = false
  if (values.gsquery) fixed.gsquery = true
  if (values['no-gsquery']) fixed.gsquery = false
  if (values['gws-emul']) fixed.gwsEmul = true
  if (values['no-gws-emul']) fixed.gwsEmul = false

  const offerShadcn = client === 'react' && fixed.tailwind !== false
  const catalog: {
    value: ExtraKey
    label: string
    hint: string
    on: boolean
  }[] = [
    {
      value: 'tailwind',
      label: 'Tailwind CSS',
      hint: 'v4, via the Vite plugin',
      on: true,
    },
    ...(offerShadcn
      ? [
          {
            value: 'shadcn' as const,
            label: 'shadcn/ui',
            hint: 'React components — turns Tailwind on',
            on: true,
          },
        ]
      : []),
    {
      value: 'gsquery',
      label: 'gas-sheets-query example',
      hint: 'typed Sheets access generated from a schema',
      on: false,
    },
    {
      value: 'gwsEmul',
      label: 'Local GWS emulator',
      hint: 'run server calls locally instead of pushing to Google',
      on: false,
    },
  ]
  const options = catalog.filter((entry) => fixed[entry.value] === undefined)

  let chosen: ExtraKey[] = []
  if (options.length > 0) {
    const result = await multiselect<ExtraKey>({
      message: 'Extras',
      options: options.map(({ value, label, hint }) => ({
        value,
        label,
        hint,
      })),
      initialValues: options
        .filter((entry) => entry.on)
        .map((entry) => entry.value),
      required: false,
    })
    if (isCancel(result)) return cancelled()
    chosen = result
  }

  const picked = (key: ExtraKey): boolean => fixed[key] ?? chosen.includes(key)
  const wantsShadcn = offerShadcn && picked('shadcn')
  const tailwind =
    fixed.tailwind ?? (wantsShadcn || chosen.includes('tailwind'))
  return {
    ui: tailwind ? 'tailwind' : 'none',
    shadcn: wantsShadcn && tailwind,
    gsquery: picked('gsquery'),
    gwsEmul: picked('gwsEmul'),
  }
}

async function main(): Promise<void> {
  let values: Flags
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
        setup: { type: 'boolean' },
        'no-setup': { type: 'boolean' },
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
    failure(
      `Directory "${dir}" already exists and is not empty — remove it or pick another name`,
    )
  }

  const client = await resolveChoice(
    values.client,
    'client',
    'Client',
    CLIENTS,
    'react',
    {
      react: 'React 19',
      vanilla: 'no framework, plain TypeScript',
      vue: 'Vue 3',
      svelte: 'Svelte 5',
      preact: 'Preact 10',
    },
  )
  const { ui, shadcn, gsquery, gwsEmul } = await resolveExtras(values, client)
  const git = !values['no-git']
  const install = !values['no-install']
  const setup = install
    ? await resolveBoolean(
        values.setup,
        values['no-setup'],
        'Set up the Apps Script project now? (signs in to Google in a browser and creates a real Apps Script project)',
        true,
      )
    : false

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
  if (installed && gsquery)
    spawnSync(pm, ['run', 'generate'], { cwd: dir, stdio: 'inherit' })
  let setupDone = false
  if (installed && setup) {
    const result = spawnSync(pm, ['run', 'setup'], {
      cwd: dir,
      stdio: 'inherit',
    })
    setupDone =
      result.status === 0 && fs.existsSync(path.join(dir, 'envs.json'))
  }

  printNextSteps(dir, pm, installed, setupDone)
  outro('Done')
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(EXIT_FAIL)
})
