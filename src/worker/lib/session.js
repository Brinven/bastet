import { getCookie } from 'hono/cookie'
import { hashToken } from './crypto.js'

// Hono middleware: require a valid Tier 2 session. Looks up the hashed cookie
// token against the sessions table. Used by /api/me/* and /api/me routes (M6+).
export async function requireAuth(c, next) {
  const cookie = getCookie(c, 'bastet_session')
  if (!cookie) return c.json({ error: 'Unauthorized' }, 401)

  const tokenHash = await hashToken(cookie)
  const session = await c.env.DB.prepare(
    `SELECT s.user_id, u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  )
    .bind(tokenHash)
    .first()

  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', session)
  await next()
}
