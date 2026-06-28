import { Hono } from 'hono'
import { requireAuth } from '../lib/session.js'
import {
  updateUserProfile, setUserLogoKey, getUserById,
  countSavedFlyers, createSavedFlyer, listSavedFlyers, getSavedFlyer, deleteSavedFlyer,
  countUserTemplates, createUserTemplate, listUserTemplates, getUserTemplate, deleteUserTemplate,
} from '../lib/db.js'
import { putObject, getObject, deleteObject } from '../lib/r2.js'
import { readImageUpload, imageHeaders } from '../lib/upload.js'

// Tier 2 "current user" routes. M6 = read profile; M7a adds profile edit + rescue logo (R2);
// M7b adds saved flyers (flyer_data JSON in D1 + thumbnail/photo bytes in R2); M7c adds private
// templates (layout-only). Everything here is behind requireAuth and scoped to the session user.
const me = new Hono()
me.use('*', requireAuth)

const MAX_LOGO = 10 * 1024 * 1024 // 10 MB (PRD)
const MAX_THUMB = 2 * 1024 * 1024 // 2 MB (PRD)
const MAX_PHOTO = 10 * 1024 * 1024 // 10 MB — original animal photo bytes stored with the flyer
const MAX_FLYERS = 50 // per-user storage guard (worst case ~50 × ~10 MB; tune if it grows)
const MAX_TEMPLATES = 50 // per-user private-template guard

// Deterministic R2 keys for a flyer's assets, scoped under the owning user.
const thumbKey = (userId, flyerId) => `flyers/${userId}/${flyerId}/thumb`
const photoKey = (userId, flyerId) => `flyers/${userId}/${flyerId}/photo`
// Private-template thumbnail key (layout-only → thumbnail, no photo).
const tplThumbKey = (userId, tplId) => `templates/${userId}/${tplId}/thumb`

// Public-facing user shape — explicit allow-list, never the raw row.
function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    rescue_name: u.rescue_name,
    rescue_phone: u.rescue_phone,
    rescue_website: u.rescue_website,
    rescue_logo_key: u.rescue_logo_key,
    has_logo: !!u.rescue_logo_key,
    custom_fields: safeJsonArray(u.custom_fields),
  }
}

// GET /api/me — current user + rescue profile.
me.get('/', (c) => c.json({ user: publicUser(c.get('user')) }))

// PATCH /api/me — update rescue profile (partial: omitted fields keep their current value).
me.patch('/', async (c) => {
  const u = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const updated = await updateUserProfile(c.env.DB, u.id, {
    rescue_name: clampStr(body.rescue_name ?? u.rescue_name, 120),
    rescue_phone: clampStr(body.rescue_phone ?? u.rescue_phone, 40),
    rescue_website: clampStr(body.rescue_website ?? u.rescue_website, 200),
    custom_fields:
      body.custom_fields != null ? JSON.stringify(body.custom_fields) : u.custom_fields,
  })
  return c.json({ user: publicUser(updated) })
})

// POST /api/me/logo — upload the rescue logo to R2 (multipart 'logo'). Worker-proxied → no CORS.
me.post('/logo', async (c) => {
  const u = c.get('user')
  const form = await c.req.parseBody()
  const img = await readImageUpload(form['logo'], MAX_LOGO)
  if (!img.ok) return c.json({ error: img.error }, img.status)

  const key = `logos/${u.id}` // one logo per rescue → stable key, overwrite on re-upload
  await putObject(c.env.USER_ASSETS_BUCKET, key, img.buffer, img.contentType)
  await setUserLogoKey(c.env.DB, u.id, key)
  const updated = await getUserById(c.env.DB, u.id)
  return c.json({ user: publicUser(updated) })
})

// GET /api/me/logo — serve the current user's logo from R2 (authed; only the owner can fetch).
me.get('/logo', async (c) => {
  const u = c.get('user')
  const obj = await getObject(c.env.USER_ASSETS_BUCKET, u.rescue_logo_key)
  if (!obj) return c.json({ error: 'No logo' }, 404)
  return new Response(obj.body, { headers: imageHeaders(obj, 'private, no-cache') })
})

// ── Saved flyers (M7b) ─────────────────────────────────────────────────────────────────────────

// Gallery summary — never includes the bulky flyer_data; thumbnail_key stays internal.
function flyerSummary(row) {
  return {
    id: row.id,
    name: row.name,
    output_size: row.output_size,
    has_thumbnail: !!row.thumbnail_key,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// POST /api/me/flyers — save a flyer. multipart: name, output_size, flyer_data (JSON string),
// thumb (file), photo (optional file). flyer_data carries the full editor state minus image bytes;
// the original photo + a small thumbnail go to R2 so a load round-trips exactly.
me.post('/flyers', async (c) => {
  const u = c.get('user')

  if ((await countSavedFlyers(c.env.DB, u.id)) >= MAX_FLYERS) {
    return c.json(
      { error: `You can save up to ${MAX_FLYERS} flyers. Delete one to make room.` },
      409
    )
  }

  const form = await c.req.parseBody()
  const name = clampStr(form['name'], 120) || 'Untitled Flyer'
  const output_size = clampStr(form['output_size'], 40) || 'instagram_post'
  const flyerDataRaw = form['flyer_data']
  if (typeof flyerDataRaw !== 'string' || !flyerDataRaw) {
    return c.json({ error: 'Missing flyer data.' }, 400)
  }
  // Validate it parses (and re-serialize a normalized form so we never store garbage).
  let parsed
  try {
    parsed = JSON.parse(flyerDataRaw)
  } catch {
    return c.json({ error: 'Invalid flyer data.' }, 400)
  }

  const thumbImg = await readImageUpload(form['thumb'], MAX_THUMB)
  if (!thumbImg.ok) return c.json({ error: thumbImg.error }, thumbImg.status)

  const photoPart = form['photo']
  const hasPhoto = photoPart && typeof photoPart !== 'string'
  let photoImg = null
  if (hasPhoto) {
    photoImg = await readImageUpload(photoPart, MAX_PHOTO)
    if (!photoImg.ok) return c.json({ error: photoImg.error }, photoImg.status)
  }

  const id = crypto.randomUUID()
  const tKey = thumbKey(u.id, id)
  await putObject(c.env.USER_ASSETS_BUCKET, tKey, thumbImg.buffer, thumbImg.contentType)
  if (photoImg) {
    await putObject(c.env.USER_ASSETS_BUCKET, photoKey(u.id, id), photoImg.buffer, photoImg.contentType)
  }

  const row = await createSavedFlyer(c.env.DB, u.id, id, {
    name,
    flyer_data: JSON.stringify(parsed),
    thumbnail_key: tKey,
    output_size,
  })
  return c.json({ flyer: flyerSummary(row) }, 201)
})

// GET /api/me/flyers — list the user's saved flyers (summaries only).
me.get('/flyers', async (c) => {
  const u = c.get('user')
  const rows = await listSavedFlyers(c.env.DB, u.id)
  return c.json({ flyers: rows.map(flyerSummary) })
})

// GET /api/me/flyers/:id — full flyer incl. parsed flyer_data (owner only).
me.get('/flyers/:id', async (c) => {
  const u = c.get('user')
  const row = await getSavedFlyer(c.env.DB, u.id, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({
    flyer: { ...flyerSummary(row), flyer_data: safeJsonObject(row.flyer_data) },
  })
})

// GET /api/me/flyers/:id/thumb — serve the thumbnail from R2 (owner only).
me.get('/flyers/:id/thumb', async (c) => {
  const u = c.get('user')
  const row = await getSavedFlyer(c.env.DB, u.id, c.req.param('id'))
  if (!row?.thumbnail_key) return c.json({ error: 'Not found' }, 404)
  return serveObject(c, row.thumbnail_key)
})

// GET /api/me/flyers/:id/photo — serve the original photo bytes from R2 (owner only).
me.get('/flyers/:id/photo', async (c) => {
  const u = c.get('user')
  const row = await getSavedFlyer(c.env.DB, u.id, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  return serveObject(c, photoKey(u.id, row.id))
})

// DELETE /api/me/flyers/:id — remove the flyer + its R2 assets (owner only).
me.delete('/flyers/:id', async (c) => {
  const u = c.get('user')
  const id = c.req.param('id')
  const row = await getSavedFlyer(c.env.DB, u.id, id)
  if (!row) return c.json({ error: 'Not found' }, 404)
  await deleteObject(c.env.USER_ASSETS_BUCKET, thumbKey(u.id, id))
  await deleteObject(c.env.USER_ASSETS_BUCKET, photoKey(u.id, id))
  await deleteSavedFlyer(c.env.DB, u.id, id)
  return c.json({ ok: true })
})

// ── Private templates (M7c) ────────────────────────────────────────────────────────────────────
// A user's reusable layout (no animal content, no photo). Mirrors the saved-flyer shape minus the
// photo object.

function templateSummary(row) {
  return {
    id: row.id,
    name: row.name,
    has_thumbnail: !!row.thumbnail_key,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// POST /api/me/templates — save a private template. multipart: name, template_data (JSON), thumb.
me.post('/templates', async (c) => {
  const u = c.get('user')

  if ((await countUserTemplates(c.env.DB, u.id)) >= MAX_TEMPLATES) {
    return c.json(
      { error: `You can save up to ${MAX_TEMPLATES} templates. Delete one to make room.` },
      409
    )
  }

  const form = await c.req.parseBody()
  const name = clampStr(form['name'], 120) || 'Untitled Template'
  const dataRaw = form['template_data']
  if (typeof dataRaw !== 'string' || !dataRaw) return c.json({ error: 'Missing template data.' }, 400)
  let parsed
  try {
    parsed = JSON.parse(dataRaw)
  } catch {
    return c.json({ error: 'Invalid template data.' }, 400)
  }

  const thumbImg = await readImageUpload(form['thumb'], MAX_THUMB)
  if (!thumbImg.ok) return c.json({ error: thumbImg.error }, thumbImg.status)

  const id = crypto.randomUUID()
  const tKey = tplThumbKey(u.id, id)
  await putObject(c.env.USER_ASSETS_BUCKET, tKey, thumbImg.buffer, thumbImg.contentType)

  const row = await createUserTemplate(c.env.DB, u.id, id, {
    name,
    template_data: JSON.stringify(parsed),
    thumbnail_key: tKey,
  })
  return c.json({ template: templateSummary(row) }, 201)
})

// GET /api/me/templates — list the user's private templates (summaries only).
me.get('/templates', async (c) => {
  const u = c.get('user')
  const rows = await listUserTemplates(c.env.DB, u.id)
  return c.json({ templates: rows.map(templateSummary) })
})

// GET /api/me/templates/:id — full template incl. parsed template_data (owner only).
me.get('/templates/:id', async (c) => {
  const u = c.get('user')
  const row = await getUserTemplate(c.env.DB, u.id, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({
    template: { ...templateSummary(row), template_data: safeJsonObject(row.template_data) },
  })
})

// GET /api/me/templates/:id/thumb — serve the template thumbnail from R2 (owner only).
me.get('/templates/:id/thumb', async (c) => {
  const u = c.get('user')
  const row = await getUserTemplate(c.env.DB, u.id, c.req.param('id'))
  if (!row?.thumbnail_key) return c.json({ error: 'Not found' }, 404)
  return serveObject(c, row.thumbnail_key)
})

// DELETE /api/me/templates/:id — remove the template + its R2 thumbnail (owner only).
me.delete('/templates/:id', async (c) => {
  const u = c.get('user')
  const id = c.req.param('id')
  const row = await getUserTemplate(c.env.DB, u.id, id)
  if (!row) return c.json({ error: 'Not found' }, 404)
  await deleteObject(c.env.USER_ASSETS_BUCKET, tplThumbKey(u.id, id))
  await deleteUserTemplate(c.env.DB, u.id, id)
  return c.json({ ok: true })
})

// Stream an R2 object back through the authed Worker (no bucket CORS; only the owner reaches here).
async function serveObject(c, key) {
  const obj = await getObject(c.env.USER_ASSETS_BUCKET, key)
  if (!obj) return c.json({ error: 'Not found' }, 404)
  return new Response(obj.body, { headers: imageHeaders(obj, 'private, no-cache') })
}

function clampStr(v, max) {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > max ? s.slice(0, max) : s
}

function safeJsonArray(s) {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function safeJsonObject(s) {
  try {
    const v = JSON.parse(s)
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

export default me
