import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local dev, the frontend (5173) proxies /api/* to the Worker (wrangler dev :8787).
// In production this routing is handled by _routes.json on Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
