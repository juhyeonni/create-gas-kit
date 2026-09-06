import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../src/scaffold.ts'

const TEMPLATES_DIR = fileURLToPath(new URL('../templates', import.meta.url))
const BASE_READY = fs.existsSync(
  path.join(TEMPLATES_DIR, 'base', 'package.json'),
)

test(
  'scaffolds a vanilla/no-ui project from the real templates directory',
  { skip: !BASE_READY && 'templates/base/package.json does not exist yet' },
  () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-gas-kit-e2e-'))
    const name = path.basename(outDir)

    scaffold(
      {
        dir: outDir,
        name,
        client: 'vanilla',
        ui: 'none',
        shadcn: false,
        gsquery: false,
        gwsEmul: false,
        timeZone: 'Asia/Tokyo',
      },
      TEMPLATES_DIR,
    )

    const pkg = JSON.parse(
      fs.readFileSync(path.join(outDir, 'package.json'), 'utf-8'),
    )
    assert.equal(pkg.name, name)
    assert.ok(fs.existsSync(path.join(outDir, '.gitignore')))
    assert.match(
      fs.readFileSync(path.join(outDir, 'vite.config.ts'), 'utf-8'),
      /plugins: \[\],/,
    )
    assert.match(
      fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8'),
      new RegExp(name),
    )
    assert.match(
      fs.readFileSync(path.join(outDir, 'README.md'), 'utf-8'),
      new RegExp(`^# ${name}`),
    )
    const kit = fs.readFileSync(path.join(outDir, 'src/client/kit.ts'), 'utf-8')
    assert.match(kit, new RegExp(`name: '${name}'`))
    assert.match(kit, /specs: \['vanilla'\],/)
  },
)
