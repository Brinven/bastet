-- ============================================================
-- BASTET — D1 Schema v1
-- Apply: wrangler d1 migrations apply bastet-db --local   (then --remote)
-- ============================================================
-- Note: D1 enforces foreign keys by default and rejects PRAGMA
-- journal_mode / foreign_keys. Tables are ordered so dependents
-- (magic_links, sessions, saved_flyers, user_templates) are created
-- after the `users` table they reference — no defer_foreign_keys needed.
-- ============================================================

-- Community template library
CREATE TABLE IF NOT EXISTS templates (
  id              TEXT PRIMARY KEY,                  -- UUID
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  author_display  TEXT NOT NULL DEFAULT 'Anonymous', -- public, not email
  rescue_name     TEXT,                              -- submitting rescue, optional display
  category        TEXT NOT NULL DEFAULT 'general',   -- dog | cat | general | event
  mood_tags       TEXT NOT NULL DEFAULT '[]',        -- JSON array: ["urgent","cheerful"]
  thumbnail_key   TEXT,                              -- R2 object key
  template_data   TEXT NOT NULL,                     -- JSON: Konva stage + field bindings
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  download_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_status   ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Tier 2 users
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                  -- UUID
  email           TEXT NOT NULL UNIQUE,
  rescue_name     TEXT,
  rescue_phone    TEXT,
  rescue_website  TEXT,
  rescue_logo_key TEXT,                              -- R2 object key
  custom_fields   TEXT NOT NULL DEFAULT '[]',        -- JSON array of field definitions
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Magic link tokens (pre-auth)
CREATE TABLE IF NOT EXISTS magic_links (
  id          TEXT PRIMARY KEY,                      -- UUID
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,                  -- SHA-256 of the raw token
  expires_at  TEXT NOT NULL,                         -- ISO 8601
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash ON magic_links(token_hash);

-- Active sessions (post-auth)
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,                      -- UUID
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,                  -- SHA-256 of the cookie token
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- Tier 2 saved flyers
CREATE TABLE IF NOT EXISTS saved_flyers (
  id            TEXT PRIMARY KEY,                    -- UUID
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Untitled Flyer',
  flyer_data    TEXT NOT NULL,                       -- JSON: Konva stage snapshot
  thumbnail_key TEXT,                                -- R2 object key
  output_size   TEXT NOT NULL DEFAULT 'instagram_post',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_flyers_user_id ON saved_flyers(user_id);

-- Tier 2 saved user templates (private unless submitted to community)
CREATE TABLE IF NOT EXISTS user_templates (
  id            TEXT PRIMARY KEY,                    -- UUID
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  template_data TEXT NOT NULL,                       -- JSON
  thumbnail_key TEXT,
  submitted     INTEGER NOT NULL DEFAULT 0,          -- 1 = also submitted to community
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
