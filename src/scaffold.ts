import * as fs from 'node:fs'
import * as path from 'node:path'
import { overlayList } from './overlays.ts'
import { composeViteConfig, type PluginName } from './vite-config.ts'

export interface ScaffoldOptions {
  dir: string
  name: string
  client: 'react' | 'vanilla'
  ui: 'tailwind' | 'none'
  shadcn: boolean
  gsquery: boolean
  gwsEmul: boolean
  timeZone: string
}

type Json = Record<string, unknown>

const MERGE_KEYS = ['scripts', 'dependencies', 'devDependencies'] as const

export function mergePackageJson(base: Json | undefined, incoming: Json): Json {
  if (!base) return { ...incoming }
  const result: Json = { ...base, ...incoming }
  for (const key of MERGE_KEYS) {
    const baseValue = base[key] as Json | undefined
    const incomingValue = incoming[key] as Json | undefined
    if (baseValue || incomingValue)
      result[key] = { ...baseValue, ...incomingValue }
  }
  return result
}

function sortKeys(obj: Json | undefined): Json | undefined {
  if (!obj) return obj
  const sorted: Json = {}
  for (const key of Object.keys(obj).sort()) sorted[key] = obj[key]
  return sorted
}

function renamedRelPath(rel: string): string {
  const dir = path.dirname(rel)
  const base = path.basename(rel)
  const renamed = base.startsWith('_') ? `.${base.slice(1)}` : base
  return dir === '.' ? renamed : path.join(dir, renamed)
}

function walkFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(full))
    else out.push(full)
  }
  return out
}

function applyDelete(overlayDir: string, outDir: string): void {
  const deleteFile = path.join(overlayDir, '_delete')
  if (!fs.existsSync(deleteFile)) return
  const rels = fs
    .readFileSync(deleteFile, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  for (const rel of rels) fs.rmSync(path.join(outDir, rel), { force: true })
}

function copyOverlay(
  overlayDir: string,
  outDir: string,
  pkg: Json | undefined,
): Json | undefined {
  for (const file of walkFiles(overlayDir)) {
    const rel = path.relative(overlayDir, file)
    if (rel === '_delete') continue
    if (path.basename(rel) === 'package.json') {
      const incoming = JSON.parse(fs.readFileSync(file, 'utf-8')) as Json
      pkg = mergePackageJson(pkg, incoming)
      continue
    }
    const dest = path.join(outDir, renamedRelPath(rel))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(file, dest)
  }
  applyDelete(overlayDir, outDir)
  return pkg
}

function writePackageJson(outDir: string, pkg: Json, name: string): void {
  pkg.name = name
  pkg.dependencies = sortKeys(pkg.dependencies as Json | undefined)
  pkg.devDependencies = sortKeys(pkg.devDependencies as Json | undefined)
  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`,
  )
}

function composeViteConfigFile(options: ScaffoldOptions): void {
  const file = path.join(options.dir, 'vite.config.ts')
  if (!fs.existsSync(file)) return
  const plugins: PluginName[] = []
  if (options.client === 'react') plugins.push('react')
  if (options.ui === 'tailwind') plugins.push('tailwind')
  if (options.gwsEmul) plugins.push('gwsEmul')
  fs.writeFileSync(
    file,
    composeViteConfig(fs.readFileSync(file, 'utf-8'), plugins),
  )
}

function replaceInFile(
  file: string,
  replace: (content: string) => string,
): void {
  if (!fs.existsSync(file)) return
  fs.writeFileSync(file, replace(fs.readFileSync(file, 'utf-8')))
}

function applyReplacements(options: ScaffoldOptions): void {
  replaceInFile(path.join(options.dir, 'index.html'), (content) => {
    content = content.replaceAll('__APP_NAME__', options.name)
    if (options.client === 'react')
      content = content.replace('/src/client/main.ts"', '/src/client/main.tsx"')
    return content
  })

  replaceInFile(path.join(options.dir, 'src/server/index.ts'), (content) =>
    content.replaceAll('__APP_NAME__', options.name),
  )

  replaceInFile(path.join(options.dir, 'appsscript.json'), (content) => {
    const json = JSON.parse(content) as Json
    json.timeZone = options.timeZone
    return `${JSON.stringify(json, null, 2)}\n`
  })
}

export function scaffold(options: ScaffoldOptions, templatesDir: string): void {
  fs.mkdirSync(options.dir, { recursive: true })

  let pkg: Json | undefined
  for (const overlay of overlayList(options)) {
    const overlayDir = path.join(templatesDir, overlay)
    if (!fs.existsSync(overlayDir)) continue
    pkg = copyOverlay(overlayDir, options.dir, pkg)
  }

  if (pkg) writePackageJson(options.dir, pkg, options.name)
  composeViteConfigFile(options)
  applyReplacements(options)
}
