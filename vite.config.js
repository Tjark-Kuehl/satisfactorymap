import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: '/satisfactorymap/', // Base path for GitHub Pages
  build: {
    minify: true,
    sourcemap: false,
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
  server: {
    port: 5173,
    open: false
  }
})
