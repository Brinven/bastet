import { Hono } from 'hono'
import { requireAuth } from '../lib/session.js'

// Tier 2 "current user" routes (M6 = read profile). PATCH profile, logo upload, and saved
// flyers/templates arrive in M7. Everything here is behind requireAuth.
const me = new Hono()
me.use('*', requireAuth)

// GET /api/me — current user + rescue profile. Never exposes session/token data; the users
// table holds no secrets, but we still return an explicit allow-list, not the raw row.
me.get('/', (c) => {
  const u = c.get('user')
  return c.json({
    user: {
      id: u.id,
      email: u.email,
      rescue_name: u.rescue_name,
      rescue_phone: u.rescue_phone,
      rescue_website: u.rescue_website,
      rescue_logo_key: u.rescue_logo_key,
      custom_fields: safeJsonArray(u.custom_fields),
    },
  })
})

function safeJsonArray(s) {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default me
