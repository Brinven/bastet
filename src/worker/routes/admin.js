import { Hono } from 'hono'
import { requireAdmin } from '../lib/admin.js'
import { listTemplatesByStatus, getTemplateAnyStatus, setTemplateStatus } from '../lib/db.js'
import { getObject, deleteObject } from '../lib/r2.js'
import { imageHeaders } from '../lib/upload.js'

// Admin routes (M8) — community template approval queue. Bearer-token auth (not session); see
// lib/admin.js. Mounted at /api/admin.
const admin = new Hono()
admin.use('*', requireAdmin)

// GET /api/admin/templates/pending — the review queue.
admin.get('/templates/pending', async (c) => {
  const rows = await listTemplatesByStatus(c.env.DB, 'pending')
  const out = rows.map((r) => ({ ...r, mood_tags: safeJsonArray(r.mood_tags), has_thumbnail: !!r.thumbnail_key }))
  return c.json({ templates: out })
})

// GET /api/admin/templates/:id/thumb — serve a thumbnail for review (any status).
admin.get('/templates/:id/thumb', async (c) => {
  const row = await getTemplateAnyStatus(c.env.DB, c.req.param('id'))
  if (!row?.thumbnail_key) return c.json({ error: 'Not found' }, 404)
  const obj = await getObject(c.env.TEMPLATES_BUCKET, row.thumbnail_key)
  if (!obj) return c.json({ error: 'Not found' }, 404)
  return new Response(obj.body, { headers: imageHeaders(obj, 'private, no-cache') })
})

// POST /api/admin/templates/:id/approve — publish to the community browser.
admin.post('/templates/:id/approve', async (c) => {
  const row = await getTemplateAnyStatus(c.env.DB, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  await setTemplateStatus(c.env.DB, row.id, 'approved')
  return c.json({ ok: true })
})

// POST /api/admin/templates/:id/reject — mark rejected + drop its thumbnail.
admin.post('/templates/:id/reject', async (c) => {
  const row = await getTemplateAnyStatus(c.env.DB, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  await setTemplateStatus(c.env.DB, row.id, 'rejected')
  await deleteObject(c.env.TEMPLATES_BUCKET, row.thumbnail_key)
  return c.json({ ok: true })
})

function safeJsonArray(s) {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default admin
