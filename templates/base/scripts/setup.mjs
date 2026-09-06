#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { addEnv, editorUrl, webAppUrl, createUI } from 'gas-app-kit'

const ui = createUI('setup')
const DEFAULT_TYPE = existsSync('schema.gsq.yaml') ? 'sheets' : 'standalone'

function runCommand(script) {
  const agent = process.env.npm_config_user_agent ?? ''
  if (agent.startsWith('pnpm')) return `pnpm ${script}`
  if (agent.startsWith('bun')) return `bun run ${script}`
  return `npm run ${script}`
}

function readPackageName() {
  return JSON.parse(readFileSync('package.json', 'utf-8')).name
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

function printUrls(entry) {
  ui.item(`editor  ${editorUrl(entry.scriptId)}`)
  ui.item(
    `web     ${entry.deploymentId ? webAppUrl(entry.deploymentId) : '(undeployed)'}`,
  )
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

    ensureLogin()

    if (mode === '2') {
      const scriptId = await prompt(rl, 'scriptId')
      if (!scriptId) ui.fail('scriptId is required.')
      const result = addEnv(name, { scriptId })
      printUrls(result.entry)
      return
    }

    const type = await prompt(
      rl,
      'Project type (standalone/sheets)',
      DEFAULT_TYPE,
    )
    const result = addEnv(name, { title: readPackageName(), type })
    printUrls(result.entry)
  } finally {
    rl.close()
  }
}

main().catch((err) => ui.fail(err.message || String(err)))
