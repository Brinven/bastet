// D1 helpers. Always use prepared statements + .bind() — never string-concat SQL
// (CLAUDE.md gotcha #4). Public-facing reads must never leak Tier 2 user data.

// Public community library: approved templates only. Note this SELECT list is an
// allow-list — it intentionally excludes any user/email-linked columns.
export async function listApprovedTemplates(db, { limit = 50, category } = {}) {
  const where = category
    ? `WHERE status = 'approved' AND category = ?`
    : `WHERE status = 'approved'`
  const stmt = db
    .prepare(
      `SELECT id, name, description, author_display, rescue_name, category, mood_tags,
              thumbnail_key, download_count, created_at
         FROM templates
         ${where}
         ORDER BY created_at DESC
         LIMIT ?`
    )
  const bound = category ? stmt.bind(category, limit) : stmt.bind(limit)
  const { results } = await bound.all()
  return results ?? []
}

// Single approved template, and bump its download_count. Returns null if not found.
export async function getApprovedTemplate(db, id) {
  const row = await db
    .prepare(`SELECT * FROM templates WHERE id = ? AND status = 'approved'`)
    .bind(id)
    .first()
  if (!row) return null
  await db
    .prepare(`UPDATE templates SET download_count = download_count + 1 WHERE id = ?`)
    .bind(id)
    .run()
  return row
}

// ── Tier 2 auth (M6) ─────────────────────────────────────────────────────────────────────────
// Expiries are computed in SQL via datetime('now', ...) so they share the exact format and UTC
// basis of the `expires_at > datetime('now')` comparisons (mixing JS ISO strings would break the
// lexicographic compare — 'T'/'Z' vs the space-separated SQLite format).

export async function getOrCreateUserByEmail(db, email) {
  const existing = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first()
  if (existing) return existing
  const id = crypto.randomUUID()
  await db.prepare(`INSERT INTO users (id, email) VALUES (?, ?)`).bind(id, email).run()
  return await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first()
}

export async function createMagicLink(db, userId, tokenHash) {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO magic_links (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, datetime('now', '+15 minutes'))`
    )
    .bind(id, userId, tokenHash)
    .run()
  return id
}

// Validate + consume (single-use, unexpired) a magic link by token hash. Returns the user or null.
export async function consumeMagicLink(db, tokenHash) {
  const link = await db
    .prepare(
      `SELECT * FROM magic_links
         WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')`
    )
    .bind(tokenHash)
    .first()
  if (!link) return null
  await db.prepare(`UPDATE magic_links SET used = 1 WHERE id = ?`).bind(link.id).run()
  return await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(link.user_id).first()
}

export async function createSession(db, userId, tokenHash) {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, datetime('now', '+30 days'))`
    )
    .bind(id, userId, tokenHash)
    .run()
  return id
}

export async function deleteSession(db, tokenHash) {
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run()
}
