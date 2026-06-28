import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { hashToken, generateToken } from '../lib/crypto.js'
import {
  getOrCreateUserByEmail,
  createMagicLink,
  countRecentMagicLinks,
  consumeMagicLink,
  createSession,
  deleteSession,
} from '../lib/db.js'
import { sendMagicLink } from '../lib/email.js'

// Tier 2 magic-link auth (M6). No passwords, no OAuth. Raw tokens are emailed and then
// discarded — only their SHA-256 hashes touch D1 (CLAUDE.md gotcha #6).
const auth = new Hono()

const SESSION_COOKIE = 'bastet_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days (PRD §4)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Base URL for building magic links + redirects.
// PRODUCTION (email configured): trust ONLY server config (MAGIC_LINK_BASE_URL) or the Worker's
// own request origin — on CF Pages the API shares the site's domain, so origin is already correct.
// We must NOT trust a client-supplied header here: it would let an attacker point a victim's
// emailed magic link at an arbitrary host (account-takeover).
// DEV (no RESEND_API_KEY → link is returned in the response, never emailed): the Vite proxy passes
// the real app origin (:5173) so the link/redirect lands on the app, not the Worker's :8787.
function baseUrl(c) {
  const origin = new URL(c.req.url).origin
  if (c.env.RESEND_API_KEY) {
    return (c.env.MAGIC_LINK_BASE_URL || origin).replace(/\/$/, '')
  }
  const devOrigin = c.req.header('x-bastet-app-origin')
  return (devOrigin || c.env.MAGIC_LINK_BASE_URL || origin).replace(/\/$/, '')
}

// POST /api/auth/request-link  { email }
auth.post('/request-link', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: 'Please enter a valid email address.' }, 400)
  }

  const user = await getOrCreateUserByEmail(c.env.DB, email)

  // Per-email throttle: cap sign-in emails per address per hour. Over the cap we return the SAME
  // generic response without creating/sending — stops email bombing + token-table growth without
  // revealing whether the address exists. (Pair with a per-IP Cloudflare Rate Limiting rule.)
  if ((await countRecentMagicLinks(c.env.DB, user.id)) >= 5) {
    return c.json({ ok: true, message: 'Check your email for your sign-in link.' })
  }

  const rawToken = generateToken()
  await createMagicLink(c.env.DB, user.id, await hashToken(rawToken))

  const link = `${baseUrl(c)}/api/auth/verify?token=${rawToken}`
  const result = await sendMagicLink(c.env, email, link)

  const res = { ok: true, message: 'Check your email for your sign-in link.' }
  if (result.delivered) return c.json(res)

  // No API key configured → surface the link so the flow works locally. This branch is
  // impossible in a properly configured production (RESEND_API_KEY would be set).
  if (!c.env.RESEND_API_KEY) {
    res.devLink = link
    res.message = 'Email isn’t set up yet — use the dev sign-in link below.'
    return c.json(res)
  }
  // Key present but the send failed → a real error; never leak the link.
  return c.json({ error: 'Could not send the email right now. Please try again.' }, 502)
})

// GET /api/auth/verify?token=...  (opened from the email link — a top-level navigation)
auth.get('/verify', async (c) => {
  const base = baseUrl(c)
  const token = c.req.query('token') || ''
  if (!token) return c.redirect(`${base}/?auth=error`)

  const user = await consumeMagicLink(c.env.DB, await hashToken(token))
  if (!user) return c.redirect(`${base}/?auth=invalid`)

  const sessionToken = generateToken()
  await createSession(c.env.DB, user.id, await hashToken(sessionToken))

  // Secure derived from the request scheme: https in production (Cloudflare), http in local dev —
  // a Secure cookie would be dropped over plain http://localhost, breaking dev sign-in.
  setCookie(c, SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return c.redirect(`${base}/?auth=success`)
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const cookie = getCookie(c, SESSION_COOKIE)
  if (cookie) await deleteSession(c.env.DB, await hashToken(cookie))
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

export default auth
