import { Hono } from 'hono'
import templates from './routes/templates.js'

// Bastet API. All routes live under /api/* (Cloudflare Pages routes /api/* here
// via _routes.json; in local dev the Vite proxy forwards /api -> :8787).
const app = new Hono()

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'bastet-worker', env: c.env?.ENVIRONMENT ?? 'unknown' })
)

app.route('/api/templates', templates)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
