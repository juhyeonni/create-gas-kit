const ANCHOR = "import { defineConfig } from 'vite'"
const PLUGINS_LITERAL = 'plugins: [],'

export type PluginName =
  'react' | 'vue' | 'svelte' | 'preact' | 'tailwind' | 'gwsEmul'

const PLUGIN_TABLE: Record<PluginName, { importLine: string; call: string }> = {
  react: {
    importLine: "import react from '@vitejs/plugin-react'",
    call: 'react()',
  },
  vue: {
    importLine: "import vue from '@vitejs/plugin-vue'",
    call: 'vue()',
  },
  svelte: {
    importLine: "import { svelte } from '@sveltejs/vite-plugin-svelte'",
    call: 'svelte()',
  },
  preact: {
    importLine: "import preact from '@preact/preset-vite'",
    call: 'preact()',
  },
  tailwind: {
    importLine: "import tailwindcss from '@tailwindcss/vite'",
    call: 'tailwindcss()',
  },
  gwsEmul: {
    importLine: "import { gwsEmul } from '@gws-emul/vite'",
    call: "gwsEmul({ backend: { entry: './src/server/index.ts' }, persist: {} })",
  },
}

export function composeViteConfig(
  source: string,
  plugins: PluginName[],
): string {
  if (!source.includes(ANCHOR))
    throw new Error(`vite.config.ts is missing the anchor line: ${ANCHOR}`)
  if (!source.includes(PLUGINS_LITERAL))
    throw new Error(`vite.config.ts is missing: ${PLUGINS_LITERAL}`)

  const specs = plugins.map((name) => PLUGIN_TABLE[name])
  const withPlugins = source.replace(
    PLUGINS_LITERAL,
    `plugins: [${specs.map((s) => s.call).join(', ')}],`,
  )
  if (specs.length === 0) return withPlugins

  const imports = specs.map((s) => s.importLine).join('\n')
  return withPlugins.replace(ANCHOR, `${ANCHOR}\n${imports}`)
}
