# CLAUDE.md — Bastet

Bastet is a free, open-source, browser-based flyer/poster maker for volunteer animal rescue organizations. Named after the Egyptian cat goddess. Built by Axly's Customs.

**Single governing constraint:** Dead simple. Every feature decision is filtered through "can a non-technical volunteer complete this in under three minutes on their first use?" If not, simplify or cut.

---

## ⚠️ As-Built Notes (Push 1, M1–M4) — read before "fixing" the spec

Some implementation realities intentionally diverge from the illustrative stubs below. Do **not**
revert these; the reasons are real. Full context in `tasks/handoff.md` + `tasks/todo.md` autopsies.

1. **Export `pixelRatio` is `1`, not `3`** (see Gotcha #2 / the `export.js` stub). The flyer
   document is authored at the TRUE output resolution (Print = 2550×3300), so `pixelRatio:3`
   oversamples 3× → a **227 MB** print PDF. `pixelRatio:1` yields the exact promised size.
   Font-load-before-export (Gotcha #1) remains mandatory.
2. **Template format = semantic field-bound elements**, not raw Konva primitives. A flyer doc is
   `{ outputSize, width, height, background, elements[] }` with element `type`s `photo | text |
   metaText | custom | badges | fee | tag | contact | rect` in 1080-output coordinates. The
   "Template JSON structure" section below was illustrative; this is the real format (and what D1
   stores as `template_data` in M8). (`custom` = M5 user custom-field lane.)
3. **Output sizes auto-refit** via `src/lib/refit.js` (a template scales to any of the 4 sizes).
   Facebook landscape is the known imperfect case.

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | React 18 + Vite | No Next.js — SSR incompatible with react-konva |
| Canvas editor | react-konva (Konva.js) | Only canvas library permitted |
| Styling | Tailwind CSS v3 | Utility-first; no component frameworks except shadcn if needed |
| Fonts | Google Fonts API | Curated list of ~25 fonts; do not expose all 1,500 |
| PDF export | jsPDF | Wrap PNG output; do not use a headless browser |
| Hosting | Cloudflare Pages | Frontend static build |
| API | Cloudflare Workers (Hono) | All `/api/*` routes |
| Database | Cloudflare D1 | SQLite; always use prepared statements |
| Storage | Cloudflare R2 | Two buckets: `bastet-templates`, `bastet-user-assets` |
| Email | Resend | Magic link delivery only; free tier sufficient |
| Auth | Custom magic link | No OAuth, no passwords, no third-party auth |

---

## Project Structure

```
bastet/
├── src/
│   ├── components/
│   │   ├── editor/          # Canvas editor components
│   │   │   ├── Stage.jsx    # react-konva Stage wrapper
│   │   │   ├── ImageLayer.jsx
│   │   │   ├── TextField.jsx
│   │   │   ├── BadgeLayer.jsx
│   │   │   └── ContactBlock.jsx
│   │   ├── templates/       # Template browser UI
│   │   ├── export/          # Size picker + export controls
│   │   ├── fields/          # Field panel + custom fields settings
│   │   └── auth/            # Magic link flow
│   ├── hooks/
│   │   ├── useCanvas.js     # Konva stage ref + export logic
│   │   ├── useAuth.js       # Session state
│   │   └── useFonts.js      # Google Fonts load + readiness tracking
│   ├── templates/           # Bundled template JSON files (not from D1)
│   │   ├── calm-dog-square.json
│   │   ├── urgent-cat-story.json
│   │   └── ...
│   ├── lib/
│   │   ├── export.js        # toDataURL + jsPDF wrappers
│   │   ├── fonts.js         # Font manifest + loader
│   │   └── fieldBindings.js # Built-in field ID constants
│   └── worker/              # Cloudflare Worker (Hono)
│       ├── index.js         # Route definitions
│       ├── routes/
│       │   ├── templates.js
│       │   ├── auth.js
│       │   ├── me.js
│       │   └── admin.js
│       └── lib/
│           ├── db.js        # D1 helpers
│           ├── r2.js        # R2 upload/URL helpers
│           ├── crypto.js    # SHA-256 token hashing (Web Crypto API)
│           └── email.js     # Resend wrapper
├── migrations/
│   └── 0001_initial.sql     # Full D1 schema
├── public/
├── wrangler.toml
├── vite.config.js
└── _routes.json             # CF Pages: route /api/* to Worker
```

---

## D1 Schema (Full)

Apply via `wrangler d1 migrations apply bastet-db --remote`

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS templates (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  author_display  TEXT NOT NULL DEFAULT 'Anonymous',
  rescue_name     TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  mood_tags       TEXT NOT NULL DEFAULT '[]',
  thumbnail_key   TEXT,
  template_data   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  download_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_status   ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  rescue_name     TEXT,
  rescue_phone    TEXT,
  rescue_website  TEXT,
  rescue_logo_key TEXT,
  custom_fields   TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS magic_links (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash ON magic_links(token_hash);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS saved_flyers (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Untitled Flyer',
  flyer_data    TEXT NOT NULL,
  thumbnail_key TEXT,
  output_size   TEXT NOT NULL DEFAULT 'instagram_post',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_flyers_user_id ON saved_flyers(user_id);

CREATE TABLE IF NOT EXISTS user_templates (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  template_data TEXT NOT NULL,
  thumbnail_key TEXT,
  submitted     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
```

---

## Output Sizes

Use these constants everywhere. Do not hardcode pixel values outside this object.

```js
// src/lib/outputSizes.js
export const OUTPUT_SIZES = {
  instagram_post:  { label: 'Instagram Post',  width: 1080, height: 1080 },
  instagram_story: { label: 'Instagram Story', width: 1080, height: 1920 },
  facebook_post:   { label: 'Facebook Post',   width: 1200, height: 630  },
  print_letter:    { label: 'Print Flyer',     width: 2550, height: 3300 },
};
```

---

## Built-in Field IDs

These are the only valid values for `fieldBinding` in template JSON. Never invent new built-in IDs. Custom fields use the prefix `custom_`.

```js
// src/lib/fieldBindings.js
export const FIELDS = {
  ANIMAL_PHOTO:     'animal_photo',
  ANIMAL_NAME:      'animal_name',
  BIO:              'bio',
  BREED:            'breed',
  AGE:              'age',
  GENDER:           'gender',
  WEIGHT:           'weight',
  GOOD_WITH_KIDS:   'good_with_kids',
  GOOD_WITH_DOGS:   'good_with_dogs',
  GOOD_WITH_CATS:   'good_with_cats',
  GOOD_WITH_OTHER:  'good_with_other',
  SPAYED_NEUTERED:  'spayed_neutered',
  ADOPTION_FEE:     'adoption_fee',
  FOSTER_VS_ADOPT:  'foster_vs_adopt',
  RESCUE_NAME:      'rescue_name',
  RESCUE_LOGO:      'rescue_logo',
  RESCUE_PHONE:     'rescue_phone',
  RESCUE_WEBSITE:   'rescue_website',
  CONTACT_BLOCK:    'contact_block',
};
```

---

## Critical Code Stubs

### Export with guaranteed font load

```js
// src/lib/export.js
export async function exportToPNG(stageRef, outputSize) {
  // CRITICAL: fonts must be fully loaded or text renders in system fallback
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 200)); // safety buffer

  const { width, height } = OUTPUT_SIZES[outputSize];
  const stage = stageRef.current;

  // Scale stage to target output resolution
  const scaleX = width / stage.width();
  const scaleY = height / stage.height();
  stage.scale({ x: scaleX, y: scaleY });
  stage.size({ width, height });

  const dataURL = stage.toDataURL({ pixelRatio: 3, mimeType: 'image/png' });

  // Restore preview dimensions
  stage.scale({ x: 1, y: 1 });
  stage.size({ width: stage.attrs._previewWidth, height: stage.attrs._previewHeight });

  return dataURL;
}
```

### Token hashing (Worker — Web Crypto API)

```js
// src/worker/lib/crypto.js
export async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(length = 48) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Session middleware (Hono)

```js
// src/worker/lib/session.js
export async function requireAuth(c, next) {
  const cookie = getCookie(c, 'bastet_session');
  if (!cookie) return c.json({ error: 'Unauthorized' }, 401);

  const tokenHash = await hashToken(cookie);
  const session = await c.env.DB.prepare(
    `SELECT s.user_id, u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  ).bind(tokenHash).first();

  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', session);
  await next();
}
```

### Template JSON structure

```json
{
  "version": 1,
  "name": "Calm Dog Square",
  "category": "dog",
  "moodTags": ["calm", "minimal"],
  "outputSize": "instagram_post",
  "stage": {
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "background",
        "type": "Rect",
        "fill": "#f5f0eb",
        "x": 0, "y": 0, "width": 1080, "height": 1080
      },
      {
        "id": "photo_frame",
        "type": "Image",
        "fieldBinding": "animal_photo",
        "x": 40, "y": 40, "width": 1000, "height": 700,
        "clipMode": "cover"
      },
      {
        "id": "name_label",
        "type": "Text",
        "fieldBinding": "animal_name",
        "x": 40, "y": 760,
        "fontSize": 72, "fontFamily": "Playfair Display",
        "fill": "#1a1a1a"
      },
      {
        "id": "bio_text",
        "type": "Text",
        "fieldBinding": "bio",
        "x": 40, "y": 860,
        "fontSize": 28, "fontFamily": "Inter",
        "fill": "#444444", "width": 1000
      }
    ]
  }
}
```

---

## wrangler.toml

```toml
name = "bastet-worker"
main = "src/worker/index.js"
compatibility_date = "2024-09-23"

[[d1_databases]]
binding = "DB"
database_name = "bastet-db"
database_id = "REPLACE_WITH_ACTUAL_ID"

[[r2_buckets]]
binding = "TEMPLATES_BUCKET"
bucket_name = "bastet-templates"

[[r2_buckets]]
binding = "USER_ASSETS_BUCKET"
bucket_name = "bastet-user-assets"

[vars]
ENVIRONMENT = "production"

# Secrets (set via `wrangler secret put`):
# RESEND_API_KEY
# ADMIN_BEARER_TOKEN
# MAGIC_LINK_BASE_URL
```

---

## _routes.json (CF Pages)

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

---

## Gotchas

1. **Font load before export (CRITICAL)** — Always `await document.fonts.ready` plus a 200ms buffer before calling `stage.toDataURL()`. If fonts aren't loaded, Konva silently falls back to the system default. The user sees correct fonts in preview but wrong fonts in the export. This is the #1 export bug.

2. **pixelRatio (CRITICAL)** — Always pass `{ pixelRatio: 3 }` to `toDataURL()`. The default is 1 (screen resolution). Forgetting this produces blurry exports on retina displays.

3. **react-konva and SSR** — react-konva does not work with server-side rendering. Do not use Next.js. Vite only.

4. **D1 prepared statements only** — Never concatenate SQL strings. Always use `.prepare().bind()`. D1 does not support multi-statement transactions the way SQLite does — check D1 docs for current transaction support.

5. **R2 CORS** — Must configure CORS on both R2 buckets for browser-direct uploads. Set in wrangler.toml or via dashboard. Without this, logo uploads from the browser will fail with a CORS error.

6. **Magic link tokens** — Raw tokens never touch D1. Always hash before storage. Always hash before lookup. The raw token is emailed and then discarded from server memory.

7. **CF Pages + Worker routing** — The `_routes.json` file at the project root tells CF Pages to send `/api/*` to the Worker. Without this, Pages tries to serve `/api/*` as static files and returns 404.

8. **Portrait photo UX** — Never auto-crop animal photos. Always let the user drag/zoom to reframe within the image element's bounds. Auto-crop cuts ears and tails, which breaks trust immediately.

9. **Image element "cover" mode** — The `animal_photo` element uses a clip region. Implement as Konva `Image` inside a `Group` with a `clipFunc` that clips to the element's bounding box. The image can be dragged within that clip region.

10. **Admin auth** — Admin routes use a simple `Authorization: Bearer <ADMIN_BEARER_TOKEN>` header check. Not session-based. The token is a wrangler secret. Document that this is intentional (simple, auditable) and not a security oversight.

11. **Resend "From" domain** — Magic link emails must come from a domain with configured SPF and DKIM or they will land in spam. Set up `bastet@axly.com` or a subdomain before any production testing.

12. **Session cookie** — Use `HttpOnly`, `Secure`, `SameSite=Lax`. Never expose session token to JavaScript.

---

## Scope Guard

Do not implement these without explicit PRD update:

- ❌ AI image generation or background removal
- ❌ Direct social media posting (OAuth to Instagram/Facebook)
- ❌ Video or animated GIF output
- ❌ Real-time collaboration / shared editing
- ❌ Paid tiers or subscription logic
- ❌ Multi-animal "litter" flyers
- ❌ Analytics, tracking pixels, or telemetry of any kind
- ❌ Any feature that requires a user account on Tier 1
- ❌ Auto-approval of community template submissions

---

## Build Checklist

Before considering any milestone complete:

- [ ] Exported PNG matches canvas preview exactly (no font substitution, no layout shift)
- [ ] Export tested at all 4 output sizes
- [ ] Portrait phone photo can be positioned/zoomed without auto-crop
- [ ] Font picker loads correctly and selected font appears in export
- [ ] Magic link token is hashed in D1 (verify in wrangler d1 console — plaintext token must not appear)
- [ ] Session cookie is HttpOnly and Secure in production
- [ ] Community template browser only shows `status = 'approved'` records
- [ ] Admin endpoint rejects requests without correct bearer token
- [ ] Rescue profile (Tier 2) auto-populates rescue_name, rescue_logo, rescue_phone, rescue_website on new flyer
- [ ] R2 upload size limits enforced (10MB logo, 2MB thumbnail)
- [ ] No console.log statements exposing user data or tokens in production build
- [ ] README includes what it is, who it's for, one-click CF deploy, local dev in ≤ 5 steps

---

## MEMORY

**Hindsight bank:** `axly-infra`  
**Tags:** `bastet`, `rescue`, `web-app`, `cloudflare`, `canvas`, `open-source`  
**Rationale:** No dedicated bank at MVP. Project is self-contained enough for axly-infra. Revisit if community template library grows to warrant its own bank.

**Ib:** Core project decisions, naming rationale, and architectural choices retained in session `ib-2026-06-25-rescue-flyer-app`.

---

## Axly's Customs Standards

- This is 100% free and open source. No paid features. No feature flags gating capabilities.
- No telemetry. No analytics. No tracking of any kind. Document this in README.
- MIT License. Clean enough to audit in an afternoon.
- All Axly's Customs apps follow Egyptian/ancient pantheon naming. This project: **Bastet**.
- PRD is the source of truth. Do not implement features not in the PRD without discussion.
- Port registry: N/A — this is a hosted web app. Local dev: Vite default (5173) + Worker dev (8787).
