#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import {
  addEnv,
  loadEnvs,
  saveEnvs,
  editorUrl,
  webAppUrl,
  createUI,
} from 'gas-app-kit'

const ui = createUI('setup')
const DEFAULT_TYPE = existsSync('schema.gsq.yaml') ? 'sheets' : 'standalone'
const ACCESS = ['MYSELF', 'DOMAIN', 'ANYONE']
const ACCESS_PROMPT =
  'Web app access: [1] MYSELF (only you) / [2] DOMAIN (your Workspace) / [3] ANYONE (any Google account)'

function runCommand(script) {
  const agent = process.env.npm_config_user_agent ?? ''
  const pm = agent.startsWith('pnpm')
    ? 'pnpm'
    : agent.startsWith('bun')
      ? 'bun'
      : 'npm'
  return `${pm} run ${script}`
}

function readPackageName() {
  return JSON.parse(readFileSync('package.json', 'utf-8')).name
}

function readManifest() {
  return JSON.parse(readFileSync('appsscript.json', 'utf-8'))
}

async function promptAccess(rl) {
  const current = readManifest().webapp?.access
  const index = ACCESS.indexOf(current)
  const choice = await prompt(
    rl,
    ACCESS_PROMPT,
    String(index === -1 ? 1 : index + 1),
  )
  return ACCESS[Number(choice) - 1] ?? current
}

function writeAccess(access) {
  const manifest = readManifest()
  if (manifest.webapp?.access === access) return
  manifest.webapp = { ...manifest.webapp, access }
  writeFileSync('appsscript.json', `${JSON.stringify(manifest, null, 2)}\n`)
}

function claspLoggedIn() {
  const res = spawnSync('clasp', ['show-authorized-user', '--json'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (res.error || res.status !== 0) return false
  try {
    const parsed = JSON.parse(res.stdout)
    return Boolean(parsed && Object.keys(parsed).length > 0)
  } catch {
    return false
  }
}

function ensureLogin() {
  if (claspLoggedIn()) return
  ui.info('logging in to clasp...')
  const res = spawnSync('clasp', ['login'], { stdio: 'inherit' })
  if (res.status !== 0) ui.fail('clasp login failed.')
}

async function prompt(rl, question, defaultValue) {
  const suffix = defaultValue ? ` [${defaultValue}]` : ''
  const answer = await rl.question(`${question}${suffix}: `)
  return answer.trim() || defaultValue || ''
}

// gas-app-kit registers envs fail-closed; an env set up from a laptop is meant
// to be deployed from it.
function allowLocalDeploy(name) {
  const registry = loadEnvs()
  registry[name] = { ...registry[name], allowLocalDeploy: true }
  saveEnvs(registry)
}

function printUrls(entry) {
  ui.item(`editor  ${editorUrl(entry.scriptId)}`)
  ui.item(
    `web     ${entry.deploymentId ? webAppUrl(entry.deploymentId) : '(undeployed)'}`,
  )
  ui.item(`access  ${readManifest().webapp?.access}`)
}

async function envOptions(rl, mode) {
  if (mode === '2') {
    const scriptId = await prompt(rl, 'scriptId')
    if (!scriptId) ui.fail('scriptId is required.')
    return { scriptId }
  }
  const type = await prompt(
    rl,
    'Project type (standalone/sheets)',
    DEFAULT_TYPE,
  )
  return { title: readPackageName(), type }
}

async function main() {
  ui.banner()

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const name = await prompt(rl, 'Environment name', 'dev')
    const mode = await prompt(
      rl,
      '[1] Create new / [2] Connect existing / [3] Later',
      '1',
    )

    if (mode === '3') {
      ui.info(`Run "${runCommand('setup')}" later to finish.`)
      return
    }

    writeAccess(await promptAccess(rl))
    ensureLogin()

    const result = addEnv(name, await envOptions(rl, mode))
    allowLocalDeploy(name)
    printUrls(result.entry)
  } finally {
    rl.close()
  }
}

main().catch((err) => ui.fail(err.message || String(err)))
