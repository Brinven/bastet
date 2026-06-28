import { Hono } from 'hono'
import templates from './routes/templates.js'
import auth from './routes/auth.js'
import me from './routes/me.js'
import admin from './routes/admin.js'

// Bastet API. All routes live under /api/*. In production one Worker serves both the SPA and
// the API: wrangler.toml's `assets.run_worker_first = ["/api/*"]` routes /api/* here before the
// static-asset layer. In local dev the Vite proxy forwards /api -> :8787.
const app = new Hono()

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'bastet-worker', env: c.env?.ENVIRONMENT ?? 'unknown' })
)

app.route('/api/templates', templates)
app.route('/api/auth', auth)
app.route('/api/me', me)
app.route('/api/admin', admin)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
