// Admin auth (M8). Intentionally NOT session-based (CLAUDE.md gotcha #10): admin routes are gated
// by a static bearer token from the `ADMIN_BEARER_TOKEN` secret — simple and auditable.
//
// Dev fallback: when no token is configured AND email isn't set up (`RESEND_API_KEY` unset = local
// dev, the same signal auth.js uses), accept a well-known dev token so the flow is testable locally.
// In production RESEND_API_KEY is set, so the fallback is disabled — if ADMIN_BEARER_TOKEN is somehow
// unset there, admin is fully locked (every request 401s) rather than silently open.
export const DEV_ADMIN_TOKEN = 'dev-admin-token'

export async function requireAdmin(c, next) {
  const configured = c.env.ADMIN_BEARER_TOKEN
  const expected = configured || (!c.env.RESEND_API_KEY ? DEV_ADMIN_TOKEN : null)
  if (!expected) return c.json({ error: 'Admin is not configured.' }, 503)

  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token || token !== expected) return c.json({ error: 'Unauthorized' }, 401)

  await next()
}
