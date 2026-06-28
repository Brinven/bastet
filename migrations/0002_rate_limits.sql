-- App-layer rate limiting counters (per IP / per time window), e.g. for POST /api/auth/request-link.
-- Cloudflare's free plan allows only ONE WAF rate-limit rule (already used by axly-wallpapers), and
-- the Workers Rate Limiting binding did not enforce on this account — so we count in D1 instead.
-- Rows are short-lived (one per key per window) and pruned by pruneExpiredAuth().
CREATE TABLE IF NOT EXISTS rate_limits (
  k          TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
