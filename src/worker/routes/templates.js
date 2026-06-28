import { Hono } from 'hono'
import {
  listApprovedTemplates, getApprovedTemplate, createPendingTemplate, getTemplateAnyStatus,
} from '../lib/db.js'
import { requireAuth } from '../lib/session.js'
import { putObject, getObject } from '../lib/r2.js'
import { readImageUpload, imageHeaders } from '../lib/upload.js'

// Community template library. Public read (approved only) + Tier 2 submission (M8). Submissions
// land as status='pending' and only appear in the browser after an admin approves them
// (see routes/admin.js). The public row stores only a display name + rescue name, never the email.
const templates = new Hono()

const MAX_THUMB = 2 * 1024 * 1024 // 2 MB (PRD)
const CATEGORIES = new Set(['dog', 'cat', 'general', 'event'])
const communityThumbKey = (id) => `community/${id}/thumb`

// GET /api/templates?category=dog — approved templates (metadata only).
templates.get('/', async (c) => {
  const category = c.req.query('category') || undefined
  const rows = await listApprovedTemplates(c.env.DB, { category })
  const out = rows.map((r) => ({
    ...r,
    mood_tags: safeJsonArray(r.mood_tags),
    has_thumbnail: !!r.thumbnail_key,
  }))
  return c.json({ templates: out })
})

// POST /api/templates — submit a template to the community (Tier 2 only). multipart:
// name, description?, category, mood_tags (JSON), template_data (JSON), thumb (file).
templates.post('/', requireAuth, async (c) => {
  const u = c.get('user')
  const form = await c.req.parseBody()

  const name = clampStr(form['name'], 120)
  if (!name) return c.json({ error: 'Please name your template.' }, 400)
  const description = clampStr(form['description'], 300) || ''
  const category = CATEGORIES.has(form['category']) ? form['category'] : 'general'

  let moodTags = []
  try {
    const parsed = JSON.parse(typeof form['mood_tags'] === 'string' ? form['mood_tags'] : '[]')
    if (Array.isArray(parsed)) moodTags = parsed.filter((t) => typeof t === 'string').slice(0, 6)
  } catch {
    /* ignore — default to no mood tags */
  }

  const dataRaw = form['template_data']
  if (typeof dataRaw !== 'string' || !dataRaw) return c.json({ error: 'Missing template data.' }, 400)
  let parsedData
  try {
    parsedData = JSON.parse(dataRaw)
  } catch {
    return c.json({ error: 'Invalid template data.' }, 400)
  }

  const thumbImg = await readImageUpload(form['thumb'], MAX_THUMB)
  if (!thumbImg.ok) return c.json({ error: thumbImg.error }, thumbImg.status)

  const id = crypto.randomUUID()
  const tKey = communityThumbKey(id)
  await putObject(c.env.TEMPLATES_BUCKET, tKey, thumbImg.buffer, thumbImg.contentType)

  // Public author info ONLY — never the submitting user's email (PRD critical accuracy #2).
  await createPendingTemplate(c.env.DB, id, {
    name,
    description,
    author_display: clampStr(u.rescue_name, 120) || 'A fellow rescue',
    rescue_name: clampStr(u.rescue_name, 120) || null,
    category,
    mood_tags: JSON.stringify(moodTags),
    thumbnail_key: tKey,
    template_data: JSON.stringify(parsedData),
  })

  return c.json({ ok: true, message: 'Thanks! Your template is pending review.' }, 201)
})

// GET /api/templates/:id/thumb — public thumbnail (approved templates only).
templates.get('/:id/thumb', async (c) => {
  const row = await getTemplateAnyStatus(c.env.DB, c.req.param('id'))
  if (!row || row.status !== 'approved' || !row.thumbnail_key) {
    return c.json({ error: 'Not found' }, 404)
  }
  const obj = await getObject(c.env.TEMPLATES_BUCKET, row.thumbnail_key)
  if (!obj) return c.json({ error: 'Not found' }, 404)
  return new Response(obj.body, { headers: imageHeaders(obj, 'public, max-age=3600') })
})

// GET /api/templates/:id — full template_data, increments download_count (approved only).
templates.get('/:id', async (c) => {
  const row = await getApprovedTemplate(c.env.DB, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...row,
    mood_tags: safeJsonArray(row.mood_tags),
    template_data: safeJson(row.template_data),
  })
})

function clampStr(v, max) {
  if (v == null || typeof v !== 'string') return null
  const s = v.trim()
  return s.length > max ? s.slice(0, max) : s
}

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
