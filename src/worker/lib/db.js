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

// ── Tier 2 profile (M7) ──────────────────────────────────────────────────────────────────────
export async function getUserById(db, userId) {
  return await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(userId).first()
}

export async function updateUserProfile(db, userId, fields) {
  const { rescue_name, rescue_phone, rescue_website, custom_fields } = fields
  await db
    .prepare(
      `UPDATE users
          SET rescue_name = ?, rescue_phone = ?, rescue_website = ?, custom_fields = ?,
              updated_at = datetime('now')
        WHERE id = ?`
    )
    .bind(rescue_name ?? null, rescue_phone ?? null, rescue_website ?? null, custom_fields ?? '[]', userId)
    .run()
  return await getUserById(db, userId)
}

export async function setUserLogoKey(db, userId, key) {
  await db
    .prepare(`UPDATE users SET rescue_logo_key = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(key, userId)
    .run()
}

// ── Tier 2 saved flyers (M7b) ──────────────────────────────────────────────────────────────────
// Every read/write is scoped to the owning user_id — a session user can never touch another
// user's flyers. R2 keys (thumb/photo) are derived from user+flyer ids by the route.

export async function countSavedFlyers(db, userId) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM saved_flyers WHERE user_id = ?`)
    .bind(userId)
    .first()
  return row?.n ?? 0
}

export async function createSavedFlyer(db, userId, id, { name, flyer_data, thumbnail_key, output_size }) {
  await db
    .prepare(
      `INSERT INTO saved_flyers (id, user_id, name, flyer_data, thumbnail_key, output_size)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, userId, name, flyer_data, thumbnail_key ?? null, output_size)
    .run()
  return await getSavedFlyer(db, userId, id)
}

// List summaries for the gallery — never ships flyer_data (the bulky JSON) in the list payload.
export async function listSavedFlyers(db, userId) {
  const { results } = await db
    .prepare(
      `SELECT id, name, output_size, thumbnail_key, created_at, updated_at
         FROM saved_flyers
        WHERE user_id = ?
        ORDER BY updated_at DESC`
    )
    .bind(userId)
    .all()
  return results ?? []
}

export async function getSavedFlyer(db, userId, id) {
  return await db
    .prepare(`SELECT * FROM saved_flyers WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first()
}

export async function deleteSavedFlyer(db, userId, id) {
  await db
    .prepare(`DELETE FROM saved_flyers WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run()
}
