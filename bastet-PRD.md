# Bastet — Product Requirements Document
**Version:** 1.0  
**Date:** 2026-06-25  
**Author:** Axly's Customs  
**Status:** Approved for Development  
**License:** Open Source (MIT)

---

## 1. Overview

Bastet is a free, open-source, browser-based flyer and poster maker purpose-built for small volunteer animal rescue organizations. Named after the Egyptian goddess of cats and protection, Bastet removes the design friction that prevents under-resourced rescues from promoting adoptable animals effectively.

The guiding principle for every design and feature decision: **dead simple.** If a volunteer who has never opened Canva cannot complete a flyer in under three minutes on their first use, the UX has failed.

---

## 2. Problem Statement

Small volunteer rescues lack dedicated marketing staff. The people making adoption flyers are the same people cleaning kennels, doing transport runs, and managing vet appointments. Generic design tools (Canva, Photoshop) have learning curves and onboarding friction that are real barriers when you have fifteen minutes and a dog that needs a home tonight.

There is no purpose-built, free, open-source tool with rescue-specific fields, rescue-specific output sizes, and a community template library built by people who do this work.

---

## 3. Target Users

**Primary:** Volunteer coordinators at small-to-mid-size dog, cat, and general animal rescues. Non-technical. Mobile-first or aging laptop. Limited time per task.

**Secondary:** Foster families who promote their foster animals on personal social media. Rescue photographers who batch-produce flyers after adoption events.

---

## 4. Two-Tier Access Model

### Tier 1 — Anonymous (Primary Experience)
- No account. No login. No email.
- Go to the site, make a flyer, export it, done.
- Each session is ephemeral — nothing is saved server-side.
- Covers ~90% of use cases.

### Tier 2 — Magic Link (Power Users)
- Enter email → receive magic link → click → authenticated.
- Enables:
  - Saving flyers to account
  - Saving custom templates to account
  - **Rescue profile** (name, logo, phone, website) that auto-populates every new flyer
  - Community template submission
- No passwords. No OAuth. Simple token-based sessions.
- Cookie-stored session token, 30-day expiry.

---

## 5. Core Features

### 5.1 Must-Have (MVP)

**Canvas Editor**
- Drag-and-drop image upload; click to position/zoom animal photo within image frame
- Portrait phone photo → any canvas aspect ratio handled gracefully (pinch/drag to reframe, not auto-crop)
- Text fields: Animal Name, Bio/Description, Breed, Age, Gender, Weight
- "Good with" badge system: Kids, Dogs, Cats, Other Animals (toggle on/off)
- Spayed/Neutered status badge
- Contact block: Rescue Name, Phone, Website (manual entry or auto from Tier 2 profile)
- Rescue logo upload (manual or from Tier 2 profile)
- Adoption fee field (or "Sponsored!" toggle)
- Foster vs. Adopt toggle

**Template System**
- 5–8 built-in templates, bundled with the app (not fetched from D1)
- Templates load into the canvas editor with all field bindings pre-wired
- Community template browser (approved submissions from D1 + R2)
- Templates tagged by: species (dog, cat, general), mood (urgent, cheerful, elegant, minimal)

**Output Size Picker**
Human-readable labels, not pixel numbers:
- Instagram Post (1080 × 1080)
- Instagram Story (1080 × 1920)
- Facebook Post (1200 × 630)
- Print Flyer — Letter (2550 × 3300 @ 300 DPI equivalent)

**Export**
- PNG (primary — high-res, pixelRatio: 3)
- PDF (jsPDF wrapper around the PNG)

**Font Selection**
- Google Fonts picker — curated selection of ~20–30 rescue-appropriate fonts, not the full 1,500
- Applied per text element or globally

**Custom Fields (Settings Panel)**
- Add additional text fields beyond the built-in set
- Field types: Text, Badge/Boolean, Dropdown
- Tier 2: custom field definitions saved to rescue profile

### 5.2 Nice-to-Have (Post-MVP)

- Color theme picker (background, accent, text color presets)
- Multiple photo slots (before/after, action shots)
- QR code generator for rescue website or adoption listing URL
- "Urgent" banner overlay
- Watermark with rescue name
- Duplicate / tweak an exported flyer (Tier 2 only — load from saved)
- Admin dashboard (web UI for template approval queue)
- Download count leaderboard for community templates
- Dark mode UI

### 5.3 Non-Goals

- AI image generation or background removal
- Direct social media posting
- Video or animated output
- Real-time collaboration
- Paid tiers of any kind
- Multi-animal "litter" flyers (V1)
- Mobile native app

---

## 6. Critical Accuracy Requirements

> ⚠️ **These are hard constraints, not guidelines.**

1. **Export fidelity** — The exported PNG must be pixel-for-pixel identical to the canvas preview. No font substitution, no layout shift between preview and export. Fonts must be fully loaded before `toDataURL()` fires.

2. **Rescue profile data is never shared** — Tier 2 user email and rescue profile data are never exposed via any public API endpoint. Template submissions store only a display name and rescue name, not the submitting user's email, in the public-facing template record.

3. **Open source integrity** — No telemetry, no analytics, no tracking pixels of any kind. The repo must be clean enough that a technically literate rescue coordinator can audit what the app does with their data in an afternoon.

4. **Template content** — Community templates must pass admin approval before appearing in the public browser. No auto-publish.

---

## 7. Template Format

Templates are stored as JSON containing a Konva stage descriptor plus a field binding manifest. Every text and image element that should be populated by user input carries a `fieldBinding` property.

### Built-in Field IDs
```
animal_photo         — primary animal image
animal_name          — required text
bio                  — multi-line text
breed                — text
age                  — text
gender               — text
weight               — text
good_with_kids       — badge boolean
good_with_dogs       — badge boolean
good_with_cats       — badge boolean
spayed_neutered      — badge boolean
adoption_fee         — text
foster_vs_adopt      — badge/toggle
rescue_name          — text (auto from Tier 2 profile)
rescue_logo          — image (auto from Tier 2 profile)
rescue_phone         — text
rescue_website       — text
contact_block        — composite (name + phone + website)
```

Custom fields use UUID-prefixed IDs: `custom_<uuid>`.

---

## 8. Data Models

### D1 Schema

```sql
-- ============================================================
-- BASTET — D1 Schema v1
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Community template library
CREATE TABLE IF NOT EXISTS templates (
  id              TEXT PRIMARY KEY,               -- UUID
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  author_display  TEXT NOT NULL DEFAULT 'Anonymous',  -- public, not email
  rescue_name     TEXT,                           -- submitting rescue, optional display
  category        TEXT NOT NULL DEFAULT 'general', -- dog | cat | general | event
  mood_tags       TEXT NOT NULL DEFAULT '[]',     -- JSON array: ["urgent","cheerful"]
  thumbnail_key   TEXT,                           -- R2 object key
  template_data   TEXT NOT NULL,                  -- JSON: Konva stage + field bindings
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  download_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_status    ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_category  ON templates(category);

-- Tier 2 users
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,               -- UUID
  email           TEXT NOT NULL UNIQUE,
  rescue_name     TEXT,
  rescue_phone    TEXT,
  rescue_website  TEXT,
  rescue_logo_key TEXT,                           -- R2 object key
  custom_fields   TEXT NOT NULL DEFAULT '[]',     -- JSON array of field definitions
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Magic link tokens (pre-auth)
CREATE TABLE IF NOT EXISTS magic_links (
  id          TEXT PRIMARY KEY,                   -- UUID
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,               -- SHA-256 of the raw token
  expires_at  TEXT NOT NULL,                      -- ISO 8601
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash ON magic_links(token_hash);

-- Active sessions (post-auth)
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,                   -- UUID
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,               -- SHA-256 of the cookie token
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- Tier 2 saved flyers
CREATE TABLE IF NOT EXISTS saved_flyers (
  id            TEXT PRIMARY KEY,                 -- UUID
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Untitled Flyer',
  flyer_data    TEXT NOT NULL,                    -- JSON: Konva stage snapshot
  thumbnail_key TEXT,                             -- R2 object key
  output_size   TEXT NOT NULL DEFAULT 'instagram_post',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_flyers_user_id ON saved_flyers(user_id);

-- Tier 2 saved user templates (private, not in community library unless submitted)
CREATE TABLE IF NOT EXISTS user_templates (
  id            TEXT PRIMARY KEY,                 -- UUID
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  template_data TEXT NOT NULL,                    -- JSON
  thumbnail_key TEXT,
  submitted     INTEGER NOT NULL DEFAULT 0,       -- 1 = also submitted to community
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
```

### R2 Buckets
```
bastet-templates/      — community template thumbnails
bastet-user-assets/    — Tier 2 rescue logos, saved flyer thumbnails
```

---

## 9. API Surface (Cloudflare Workers)

```
GET    /api/templates                  — list approved community templates (paginated)
GET    /api/templates/:id              — single template (increments download_count)
POST   /api/templates                  — submit template (Tier 2 only)

POST   /api/auth/request-link          — send magic link email
GET    /api/auth/verify?token=...      — validate token, create session, set cookie
POST   /api/auth/logout                — clear session

GET    /api/me                         — Tier 2: current user + rescue profile
PATCH  /api/me                         — Tier 2: update rescue profile
POST   /api/me/logo                    — Tier 2: upload rescue logo to R2

GET    /api/me/flyers                  — Tier 2: list saved flyers
POST   /api/me/flyers                  — Tier 2: save flyer
GET    /api/me/flyers/:id              — Tier 2: get flyer
DELETE /api/me/flyers/:id              — Tier 2: delete flyer

GET    /api/me/templates               — Tier 2: list user's private templates
POST   /api/me/templates               — Tier 2: save private template

-- Admin (bearer token, not session-based)
GET    /api/admin/templates/pending    — list pending submissions
POST   /api/admin/templates/:id/approve
POST   /api/admin/templates/:id/reject
```

---

## 10. MVP Milestones

| # | Milestone | Deliverable | Notes |
|---|-----------|-------------|-------|
| M1 | Scaffold + CF Infrastructure | CF Pages + Workers wired, D1 schema applied, R2 buckets created, React+Vite+Tailwind+react-konva hello world | Establish wrangler.toml, env vars, local D1 |
| M2 | Canvas Editor Core | Image upload with reframe/zoom, all built-in text fields, font picker (curated Google Fonts list), badge toggles | Critical: font load before export |
| M3 | Template System | 5–8 bundled templates loadable into editor, field bindings wired, community template browser (reads D1) | Templates as local JSON files in repo |
| M4 | Output + Export | Size picker, PNG export (pixelRatio: 3), PDF export via jsPDF | Test all 4 sizes |
| M5 | Custom Fields | Settings panel to add/remove/reorder custom text+badge fields | Tier 1 only for MVP; Tier 2 persistence comes in M7 |
| M6 | Tier 2 Auth | Email input → Resend magic link → token verify → session cookie → user record creation | Hash tokens before D1 storage |
| M7 | Tier 2 Saving + Profile | Rescue profile (auto-populate), save/load flyers, save private templates, custom fields persisted | R2 thumbnail on save |
| M8 | Community Submissions | Template submit form (Tier 2), admin approval endpoint + minimal admin UI, submission appears in community browser after approval | Admin auth: env-var bearer token |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Font not loaded at export time | High | High | Await `document.fonts.ready` + 200ms safety buffer before calling `toDataURL()` |
| Low-res volunteer photos look bad on Print Flyer size | High | Medium | Warn if image natural resolution < 1000px on any axis; soft warning, not a block |
| Canvas touch UX is rough on mobile | Medium | High | Test react-konva touch events on real iOS/Android early in M2; pinch-zoom is known tricky |
| Spam/abuse in template submissions | Low (early) → Medium (at scale) | Medium | Tier 2 only + admin approval queue; add honeypot field if bot abuse appears |
| R2 storage costs from user uploads | Low | Low | 10MB cap per rescue logo, 2MB cap per flyer thumbnail; R2 free tier is generous |
| Community template quality control burden | Low (early) | Medium | Start with Michael as sole approver; document process for handing off to community maintainer |
| Resend email deliverability for magic links | Low | High | Use a proper From domain (bastet@axly.com or similar); configure SPF/DKIM |

---

## 12. Open Source Considerations

- MIT License
- GitHub repo: recommended name `bastet` under Axly's Customs org or standalone
- README must include: what it is, who it's for, one-click deploy to Cloudflare button, local dev setup in < 5 steps
- No analytics, no tracking, no telemetry — document this explicitly in README
- Resend API key is the only required external dependency (magic links); a `.env.example` must reflect this
- CONTRIBUTING.md should include the template submission guidelines (what makes a good template)
