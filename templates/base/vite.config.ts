import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/client', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  plugins: [],
})
