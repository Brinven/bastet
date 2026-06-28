import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local dev, the frontend (5173) proxies /api/* to the Worker (wrangler dev :8787).
// In production a single Worker serves the built SPA + /api/* on one origin via Workers Static
// Assets (assets.run_worker_first = ["/api/*"] in wrangler.toml).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Tell the Worker the real app origin so dev magic links/redirects land on :5173, not the
      // Worker's :8787. The Worker only trusts this header in dev (no RESEND_API_KEY); see auth.js.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: false,
        headers: { 'x-bastet-app-origin': 'http://localhost:5173' },
      },
    },
  },
})
