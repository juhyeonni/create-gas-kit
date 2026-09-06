import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { mergePackageJson, scaffold } from '../src/scaffold.ts'

test('mergePackageJson merges scripts/deps/devDeps, later wins per key', () => {
  const base = {
    name: 'placeholder',
    scripts: { dev: 'vite', build: 'old-build' },
    dependencies: { a: '1.0.0' },
  }
  const incoming = {
    scripts: { build: 'new-build', test: 'vitest' },
    devDependencies: { typescript: '5.0.0' },
  }
  const result = mergePackageJson(base, incoming)
  assert.deepEqual(result.scripts, {
    dev: 'vite',
    build: 'new-build',
    test: 'vitest',
  })
  assert.deepEqual(result.dependencies, { a: '1.0.0' })
  assert.deepEqual(result.devDependencies, { typescript: '5.0.0' })
})

test('mergePackageJson: other top-level keys, later wins', () => {
  const result = mergePackageJson(
    { private: true, type: 'commonjs' },
    { type: 'module' },
  )
  assert.equal(result.private, true)
  assert.equal(result.type, 'module')
})

test('mergePackageJson with no base returns the incoming object', () => {
  const incoming = { name: 'x', scripts: { dev: 'vite' } }
  assert.deepEqual(mergePackageJson(undefined, incoming), incoming)
})

function fixtureTemplates() {
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'create-gas-kit-templates-'),
  )

  fs.mkdirSync(path.join(dir, 'base', 'src', 'client'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'base', '_gitignore'), 'node_modules\n')
  fs.writeFileSync(
    path.join(dir, 'base', 'package.json'),
    JSON.stringify({
      name: 'placeholder',
      scripts: { dev: 'echo base' },
      dependencies: { 'b-lib': '^1.0.0', 'a-lib': '^1.0.0' },
    }),
  )
  fs.writeFileSync(
    path.join(dir, 'base', 'src', 'client', 'mock.ts'),
    'export const mock = true\n',
  )

  fs.mkdirSync(path.join(dir, 'client-vanilla'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'client-vanilla', 'package.json'),
    JSON.stringify({
      scripts: { build: 'echo build' },
      devDependencies: { vite: '^5.0.0' },
    }),
  )

  fs.mkdirSync(path.join(dir, 'gws-emul'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'gws-emul', '_delete'),
    'src/client/mock.ts\n',
  )
  fs.writeFileSync(
    path.join(dir, 'gws-emul', 'package.json'),
    JSON.stringify({ devDependencies: { '@gws-emul/vite': '^0.2.0' } }),
  )

  return dir
}

function tmpOutDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-gas-kit-out-'))
}

test('_gitignore is renamed to .gitignore', () => {
  const templatesDir = fixtureTemplates()
  const outDir = tmpOutDir()
  scaffold(
    {
      dir: outDir,
      name: 'my-app',
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: false,
      gwsEmul: false,
      timeZone: 'Asia/Tokyo',
    },
    templatesDir,
  )
  assert.ok(fs.existsSync(path.join(outDir, '.gitignore')))
  assert.ok(!fs.existsSync(path.join(outDir, '_gitignore')))
})

test('_delete in an overlay removes a file written by an earlier overlay', () => {
  const templatesDir = fixtureTemplates()
  const outDir = tmpOutDir()
  scaffold(
    {
      dir: outDir,
      name: 'my-app',
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: false,
      gwsEmul: true,
      timeZone: 'Asia/Tokyo',
    },
    templatesDir,
  )
  assert.ok(!fs.existsSync(path.join(outDir, 'src/client/mock.ts')))
})

test('without gws-emul selected, the file _delete would have removed stays', () => {
  const templatesDir = fixtureTemplates()
  const outDir = tmpOutDir()
  scaffold(
    {
      dir: outDir,
      name: 'my-app',
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: false,
      gwsEmul: false,
      timeZone: 'Asia/Tokyo',
    },
    templatesDir,
  )
  assert.ok(fs.existsSync(path.join(outDir, 'src/client/mock.ts')))
})

test('package.json is deep-merged across overlays, deps sorted, name overridden', () => {
  const templatesDir = fixtureTemplates()
  const outDir = tmpOutDir()
  scaffold(
    {
      dir: outDir,
      name: 'my-app',
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: false,
      gwsEmul: true,
      timeZone: 'Asia/Tokyo',
    },
    templatesDir,
  )
  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'package.json'), 'utf-8'),
  )
  assert.equal(pkg.name, 'my-app')
  assert.deepEqual(pkg.scripts, { dev: 'echo base', build: 'echo build' })
  assert.deepEqual(Object.keys(pkg.dependencies), ['a-lib', 'b-lib'])
  assert.deepEqual(Object.keys(pkg.devDependencies), ['@gws-emul/vite', 'vite'])
  assert.ok(
    fs.readFileSync(path.join(outDir, 'package.json'), 'utf-8').endsWith('\n'),
  )
})

test('an overlay dir that does not exist yet is skipped without error', () => {
  const templatesDir = fixtureTemplates()
  const outDir = tmpOutDir()
  scaffold(
    {
      dir: outDir,
      name: 'my-app',
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: true,
      gwsEmul: false,
      timeZone: 'Asia/Tokyo',
    },
    templatesDir,
  )
  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'package.json'), 'utf-8'),
  )
  assert.equal(pkg.name, 'my-app')
  assert.deepEqual(pkg.scripts, { dev: 'echo base', build: 'echo build' })
})
