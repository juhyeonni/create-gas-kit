import { test } from 'node:test'
import assert from 'node:assert/strict'
import { composeViteConfig } from '../src/vite-config.ts'

const SOURCE = `import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
})
`

test('no plugins leaves the source untouched', () => {
  assert.equal(composeViteConfig(SOURCE, []), SOURCE)
})

test('inserts one import after the anchor and one call in the plugin list', () => {
  const result = composeViteConfig(SOURCE, ['react'])
  assert.match(
    result,
    /import \{ defineConfig \} from 'vite'\nimport react from '@vitejs\/plugin-react'\n/,
  )
  assert.match(result, /plugins: \[react\(\)\],/)
})

test('composes imports and plugin calls in the given order', () => {
  const result = composeViteConfig(SOURCE, ['react', 'tailwind', 'gwsEmul'])
  const importLines = result
    .split('\n')
    .filter((line) => line.startsWith('import'))
  assert.deepEqual(importLines, [
    "import { defineConfig } from 'vite'",
    "import react from '@vitejs/plugin-react'",
    "import tailwindcss from '@tailwindcss/vite'",
    "import { gwsEmul } from '@gws-emul/vite'",
  ])
  assert.match(
    result,
    /plugins: \[react\(\), tailwindcss\(\), gwsEmul\(\{ backend: \{ entry: '\.\/src\/server\/index\.ts' \}, persist: \{\} \}\)\],/,
  )
})

test('composes the vue plugin with tailwind', () => {
  const result = composeViteConfig(SOURCE, ['vue', 'tailwind'])
  assert.match(
    result,
    /import \{ defineConfig \} from 'vite'\nimport vue from '@vitejs\/plugin-vue'\nimport tailwindcss from '@tailwindcss\/vite'\n/,
  )
  assert.match(result, /plugins: \[vue\(\), tailwindcss\(\)\],/)
})

test('throws when the anchor import line is missing', () => {
  assert.throws(
    () => composeViteConfig('export default {}', ['react']),
    /anchor/,
  )
})

test('throws when the plugins literal is missing', () => {
  const source =
    "import { defineConfig } from 'vite'\nexport default defineConfig({})\n"
  assert.throws(() => composeViteConfig(source, ['react']), /plugins: \[\]/)
})
