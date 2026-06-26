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
