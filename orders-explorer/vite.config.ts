import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Serve everything in /public at the root.
  // orders.json lives here and is fetched at runtime (not bundled).
  publicDir: 'public',

  server: {
    port: 5173,
  },

  build: {
    // orders.json is fetched at runtime and is NOT in the bundle,
    // so this limit only applies to JS chunks. Raise it slightly to
    // avoid false warnings during development builds.
    chunkSizeWarningLimit: 1000,
  },
})
