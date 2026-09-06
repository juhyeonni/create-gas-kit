import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectPm, installCommand, runCommand } from '../src/pm.ts'

test('defaults to npm when no user agent is set', () => {
  assert.equal(detectPm(''), 'npm')
})

test('detects pnpm from the user agent', () => {
  assert.equal(detectPm('pnpm/9.1.0 npm/? node/v20.11.0 darwin arm64'), 'pnpm')
})

test('detects bun from the user agent', () => {
  assert.equal(detectPm('bun/1.1.0 npm/? node/v20.11.0 darwin arm64'), 'bun')
})

test('falls back to npm for an unrecognized user agent', () => {
  assert.equal(detectPm('yarn/4.0.0 npm/? node/v20.11.0 darwin arm64'), 'npm')
})

test('install command is "<pm> install" for every manager', () => {
  assert.equal(installCommand('npm'), 'npm install')
  assert.equal(installCommand('pnpm'), 'pnpm install')
  assert.equal(installCommand('bun'), 'bun install')
})

test('run command drops "run" only for pnpm', () => {
  assert.equal(runCommand('npm', 'dev'), 'npm run dev')
  assert.equal(runCommand('pnpm', 'dev'), 'pnpm dev')
  assert.equal(runCommand('bun', 'dev'), 'bun run dev')
})

test('run command passes multi-word scripts through verbatim', () => {
  assert.equal(runCommand('npm', 'push dev'), 'npm run push dev')
  assert.equal(runCommand('pnpm', 'push dev'), 'pnpm push dev')
})
