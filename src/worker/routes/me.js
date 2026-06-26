import { Hono } from 'hono'
import { requireAuth } from '../lib/session.js'
import { updateUserProfile, setUserLogoKey, getUserById } from '../lib/db.js'
import { putObject, getObject } from '../lib/r2.js'

// Tier 2 "current user" routes. M6 = read profile; M7 adds profile edit + rescue logo (R2).
// Saved flyers + private templates arrive in M7b/M7c. Everything here is behind requireAuth.
const me = new Hono()
me.use('*', requireAuth)

const MAX_LOGO = 10 * 1024 * 1024 // 10 MB (PRD)

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
  const file = form['logo']
  if (!file || typeof file === 'string') return c.json({ error: 'No file uploaded.' }, 400)
  if (!file.type?.startsWith('image/')) return c.json({ error: 'Please upload an image file.' }, 400)
  if (file.size > MAX_LOGO) return c.json({ error: 'Logo must be under 10 MB.' }, 413)

  const key = `logos/${u.id}` // one logo per rescue → stable key, overwrite on re-upload
  await putObject(c.env.USER_ASSETS_BUCKET, key, await file.arrayBuffer(), file.type)
  await setUserLogoKey(c.env.DB, u.id, key)
  const updated = await getUserById(c.env.DB, u.id)
  return c.json({ user: publicUser(updated) })
})

// GET /api/me/logo — serve the current user's logo from R2 (authed; only the owner can fetch).
me.get('/logo', async (c) => {
  const u = c.get('user')
  const obj = await getObject(c.env.USER_ASSETS_BUCKET, u.rescue_logo_key)
  if (!obj) return c.json({ error: 'No logo' }, 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'private, no-cache')
  return new Response(obj.body, { headers })
})

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

export default me
