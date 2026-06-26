import { Hono } from 'hono'
import { listApprovedTemplates, getApprovedTemplate } from '../lib/db.js'

// Community template library (public, read-only here). Submission (POST) and
// admin approval arrive in M8. The browser shows only status='approved'.
const templates = new Hono()

// GET /api/templates?category=dog — approved templates (metadata only).
templates.get('/', async (c) => {
  const category = c.req.query('category') || undefined
  const rows = await listApprovedTemplates(c.env.DB, { category })
  const out = rows.map((r) => ({ ...r, mood_tags: safeJsonArray(r.mood_tags) }))
  return c.json({ templates: out })
})

// GET /api/templates/:id — full template_data, increments download_count.
templates.get('/:id', async (c) => {
  const row = await getApprovedTemplate(c.env.DB, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...row,
    mood_tags: safeJsonArray(row.mood_tags),
    template_data: safeJson(row.template_data),
  })
})

function safeJsonArray(s) {
  const v = safeJson(s)
  return Array.isArray(v) ? v : []
}

function safeJson(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

export default templates
