# Bastet — Build Tasks

Plan: Push 1 = **M1–M4** (Tier 1 anonymous flyer maker). M5–M8 deferred to Push 2.
Full plan: `C:\Users\zwolf\.claude\plans\snug-napping-map.md`

---

## M1 — Scaffold + CF Infrastructure  *(in progress)*

- [x] Hardened `.npmrc` (save-exact, min-release-age)
- [x] `package.json` + scripts
- [x] Vite + Tailwind v3 + PostCSS config
- [x] `.gitignore`, `.env.example`
- [x] `wrangler.toml`, `public/_routes.json`
- [x] `migrations/0001_initial.sql` (full D1 schema; dropped D1-incompatible PRAGMAs)
- [x] Source tree: lib stubs (`outputSizes`, `fieldBindings`, `export`, `fonts`)
- [x] Worker: Hono `index.js` + `/api/health` + `/api/templates`, lib (`crypto`, `session`, `db`)
- [x] Hello-world react-konva canvas (`App.jsx`)
- [x] bat-trio (`start`/`stop`/`restart.bat`, CRLF, port-anchored kill)
- [x] `npm install` (exact-pinned deps; jsPDF→4 to clear dompurify advisory)
- [x] `git init` (no commit)
- [x] Frontend builds clean; worker/lib syntax-checked
- [x] **CF account gate**: confirmed `wkbp5f7wq2@privaterelay.appleid.com` (6c92bbd5…)
- [x] `wrangler d1 create bastet-db` → id `f342dd77-…` wired into `wrangler.toml`
- [x] Apply migration (`--local` ✅ 14 cmds, `--remote` ✅ — 6 tables verified remote)
- [x] `r2 bucket create` ×2 (CORS deferred → M7, when the upload flow + prod origin exist)
- [x] Verify: Worker `/api/health` 200, `/api/templates` [] (D1 ok), Vite serves + proxy ok, build clean

> **Accepted advisory:** esbuild/Vite dev-server GHSA-67mh-4wv8-2f99 — affects only the
> local dev server, never the production static build. Fix requires Vite 8 (3-major break);
> deferred. Revisit if/when the project moves to Vite 7+.

## M2 — Canvas Editor Core (high-craft)  *(done)*
- [x] `shape` brief (`tasks/editor-design-brief.md`) + `.impeccable.md` design context
- [x] Canvas: EditorCanvas (responsive scaled Layer) / FlyerPhoto (clip + reframe, no auto-crop) / FlyerText / BadgeLayer / ContactBlock
- [x] Field panel two-way bound (all built-in fields) via EditorContext
- [x] Curated Google Fonts picker (global + per-element) + readiness tracking
- [x] Photo upload + drag/zoom reframe + low-res warning
- [x] Bright/warm/hopeful UI, subtle gold Bastet nod, Gabarito+Hanken, light+dark, lively motion
- [x] Verified via Playwright: empty/filled, light/dark, mobile; export PNG 3240² with fonts loaded

## M3 — Template System  *(done)*
- [x] 6 bundled templates (`src/templates/index.js`) — calm/sunny/urgent/elegant/story/spotlight
- [x] Template loader = `loadTemplate` swaps layout, keeps user content; per-element template fonts
- [x] Template gallery UI with live mini-previews (reuse real renderers via seeded provider)
- [x] Templates/Edit tab toggle; multi-size (story portrait) + dynamic size chip
- [x] Community browser via `GET /api/templates` (approved-only) + friendly empty state
- [x] Verified via Playwright: gallery + all template switches + content carry-over + community empty

## M4 — Output + Export  *(done)*
- [x] Size picker (OUTPUT_SIZES) — TopBar popover, all 4 sizes, dynamic label
- [x] Auto-refit engine (`src/lib/refit.js`) — template scales to any size (per user's choice)
- [x] PNG export (fonts.ready + 200ms) at native output resolution
- [x] PDF export (lazy jsPDF, compressed) — print PDF 234 KB (was 227 MB before pixelRatio fix)
- [x] Verified all 4 sizes: IG Post 1080², Story 1080×1920, FB 1200×630, Print 2550×3300 (300 DPI)
- [x] No console.log leaking data (grep clean)

---

# Push 2 (M5–M8)

## M5 — Custom Fields  *(done)*

Decisions (user, 2026-06-26): custom **text** → a **dedicated labeled block** on the flyer
(not folded into the meta line); types = **Text + Badge** only (Dropdown deferred). Tier 1 only
for MVP — Tier 2 persistence lands in M7.

- [x] **Data model + state** (`EditorContext`): `customFields` ordered array of defs
  `{ id:'custom_<uuid>', type:'text'|'badge', label, glyph? }`. Values **piggyback on the
  existing `fields`/`badges` maps** (already keyed by arbitrary id). Actions: `addCustomField`,
  `removeCustomField` (also strips its value), `renameCustomField`, `moveCustomField` (up/down).
  Carried through `loadTemplate` (separate state — content is kept, like fields/photo).
- [x] **Control panel** `CustomFields.jsx` in a "Your own fields" collapsible: `+ Text` /
  `+ Badge` buttons, per-field card (editable label + value control [text input | switch] +
  ↑/↓/remove). No DnD dep — up/down only.
- [x] **Render — custom badges**: `FlyerBadges` appends toggled-on custom badge chips after the
  built-ins (default glyph ⭐; unified entry list `{key,label,glyph}`).
- [x] **Render — custom text**: new `custom` element type (`FlyerCustom.jsx`). Bounded by design —
  fixed-height rows (`label  value`), value single-line + ellipsis, scales via `_k`. Empty fields
  don't render (unused block invisible → no collision).
- [x] `custom` slot in default flyer + all 6 templates (trimmed photo heights to open a lane;
  Spotlight = text-only, it has no pill row by design so custom badges don't apply there).
- [x] **Verified (Playwright)**: custom text + badge across calm/sunny/urgent/elegance/story/
  spotlight; Facebook refit (`_k` scaling); **Print PNG export = 2550×3300** with custom content.
- [x] Build clean (`npm run build`, 630 modules); grep — no console.log of user data.
- [x] todo + handoff + lessons updated; M5 retained to Ib/Hindsight.

## M6 — Tier 2 Auth (magic link)  *(done)*

Scope = auth only (sign in, know who you are, sign out). Profile editing + saving = M7.
**Resend domain blocks only production email DELIVERABILITY** — built so the whole flow is
locally testable now: when `RESEND_API_KEY` is unset, `request-link` returns the link in the
response (dev) instead of emailing; with the key set (prod), it emails and never leaks the link.

- [x] **Worker `lib/email.js`** — `sendMagicLink(env, email, link)` via Resend API (warm branded
  HTML). No key → `{ delivered:false }` so the route surfaces the dev link.
- [x] **Worker `lib/db.js`** — `getOrCreateUserByEmail`, `createMagicLink` (hashed, 15-min),
  `consumeMagicLink` (valid+unused+unexpired → mark used → user), `createSession` (30-day),
  `deleteSession`. Expiries via SQL `datetime('now','+N …')` (format matches the comparison).
- [x] **Worker `routes/auth.js`**: `POST /request-link` (validate→get/create→mint+hash→email or
  dev-link, always 200), `GET /verify?token=` (consume→session→`bastet_session` cookie HttpOnly/
  SameSite=Lax/Secure-by-scheme/30-day→302), `POST /logout` (delete session + clear cookie).
- [x] **Worker `routes/me.js`** — `GET /api/me` (requireAuth) → profile allow-list. Mounted both.
- [x] **Frontend** `state/AuthContext.jsx` (provider+`useAuth`: /api/me, requestLink, logout,
  cleans `?auth=` marker) + `components/auth/AccountButton.jsx` (TopBar sign-in popover →
  "check your email"+dev link; signed-in → avatar/email + Sign out). Wrapped `App`.
- [x] **Config**: `.dev.vars` + `.env.example` updated. **wrangler 4.105 ignored `.dev.vars`
  values** → robust base-URL handling instead: prod uses `MAGIC_LINK_BASE_URL`||worker-origin
  (same domain on CF); dev uses a Vite-proxy `x-bastet-app-origin` header (trusted ONLY in dev —
  see autopsy). Cookie Secure derived from request scheme, not env.
- [x] **Verified**: curl flow (request-link→verify Set-Cookie→/api/me 200→logout→401; magic token
  single-use → `invalid` on reuse) + **token HASHED in D1** (64-char SHA-256, raw was 96). Browser
  (Playwright): sign-in popover → dev link → lands signed in, `?auth` cleaned, account menu.
- [x] Build clean; no console.log of tokens/user data; todo/handoff/lessons updated; M6 retained.

> **USER PREREQ for production email:** set up a **Resend** account + verified sending domain
> (SPF/DKIM, e.g. `bastet@axly.com`), then `wrangler secret put RESEND_API_KEY` (+ optionally
> `MAGIC_LINK_FROM`, `MAGIC_LINK_BASE_URL`). Until then, prod sign-in can't email; dev is unblocked.

## M7 — Tier 2 Saving + Profile  *(in progress)*

**Architecture call:** logo + flyer-thumbnail uploads go **through the Worker → R2** (same-origin
to `/api`), NOT browser-direct. This avoids R2 CORS config + the prod-origin dependency entirely
(both stay deferred — not needed with worker-proxied uploads). Caps enforced server-side:
**10 MB logo, 2 MB thumbnail** (PRD). R2 objects are served back through authed Worker routes.

### M7a — Rescue profile + auto-populate  *(done)*
- [x] Worker `PATCH /api/me` — partial update of rescue_name/phone/website (+ custom_fields ready
  for M7c); `clampStr` validation; prepared statements; `updated_at`.
- [x] Worker `POST /api/me/logo` (multipart → R2 `bastet-user-assets`, ≤10 MB, image-only, stable
  key `logos/<userId>`) + `GET /api/me/logo` (serve from R2, authed). `lib/r2.js` helpers.
- [x] Frontend: `ProfileModal` (from the account menu → "🏷️ Rescue profile") — name/phone/website
  + logo upload/preview; `ui/Modal.jsx` primitive. `AuthContext` gains `updateProfile`/`uploadLogo`.
- [x] **Auto-populate:** `EditorContext.applyProfile` fills EMPTY contact fields only; `ProfileAutofill`
  bridge in `Editor.jsx` runs once per login (resets on logout). Never clobbers typed values.
- [x] Verified: curl (PATCH persists; logo round-trips R2 byte-for-byte 77→77; GET /api/me shows
  saved profile) + Playwright (sign in → contact band auto-fills "Paws & Claws Rescue" + phone/web;
  profile modal shows saved fields + logo).
- [ ] **Follow-up (not yet):** render the logo ON the flyer (cleanest single spot = `ContactBlock`,
  covers all templates) + auto-load it into the editor. Deferred — M7a stores/serves/shows the logo
  in the profile; it doesn't appear on the flyer yet.

### M7b — Save / load flyers  *(chunk 2 — done ✅)*

**Decision (user, 2026-06-26):** store the photo bytes in R2 so a save round-trips EXACTLY
(volunteer doesn't re-add the photo on load). Watch storage if this gets popular → per-user
cap of **50 saved flyers** as the guard (bounded worst case; tunable).

**Storage shape:**
- D1 `saved_flyers`: `flyer_data` JSON (full editor state, NO image bytes), `thumbnail_key`,
  `output_size`, `name`. `flyer_data` = `{ version, templateId, nativeDoc, outputSize, fields,
  badges, customFields, fosterVsAdopt, feeMode, fonts, photo:{transform + hasBytes}|null }`.
- R2 `bastet-user-assets` (worker-proxied, no CORS): `flyers/<u>/<id>/thumb` (≤2 MB) +
  `flyers/<u>/<id>/photo` (original bytes, ≤10 MB, only if a photo exists). Keys derived from
  user+flyer ids; delete removes both.

**Worker (me.js, behind requireAuth, all scoped to session user):**
- [x] db.js: `createSavedFlyer`, `listSavedFlyers`, `getSavedFlyer`, `deleteSavedFlyer`, `countSavedFlyers`.
- [x] `POST /api/me/flyers` — multipart (`name`, `output_size`, `flyer_data` JSON, `thumb` file,
  optional `photo` file). Enforce caps + 50-flyer per-user limit (409). Generate id → put R2 → insert.
- [x] `GET /api/me/flyers` — list summaries (id, name, output_size, has_thumbnail, timestamps).
- [x] `GET /api/me/flyers/:id` — full row + parsed flyer_data (owner only).
- [x] `GET /api/me/flyers/:id/thumb` + `GET /api/me/flyers/:id/photo` — serve from R2 (owner only).
- [x] `DELETE /api/me/flyers/:id` — fetch row (scoped) → delete R2 thumb+photo → delete D1 row.

**Frontend:**
- [x] export.js: `exportThumbnailBlob(stageRef, outputSize, maxDim)` (small PNG; same font-load path).
- [x] image.js: `loadImageSrc(src)` + `blobToDataURL(blob)` (rebuild photo from R2 bytes, dataURL → no taint).
- [x] lib/flyersApi.js: `saveFlyer`, `listFlyers`, `getFlyer`, `deleteFlyer`, `fetchFlyerPhotoBlob`.
- [x] EditorContext: expose `nativeDoc` + add `loadFlyer(snap, photoState)` (sets all state at once).
- [x] `SaveFlyerModal` (name input → capture snapshot+thumb+photo → save). TopBar "Save" button (signed-in only).
- [x] `MyFlyersModal` (gallery: thumbnails, load / delete w/ inline confirm). Opened from account menu ("📁 My flyers").
- [x] Wire: Editor owns Save (has stageRef); AccountButton owns My flyers (self-contained via useEditor).

**Verified:** curl flow save(201)→list→get(flyer_data round-trips)→thumb/photo(200 image/png from R2)→
no-cookie 401→delete→list empty→thumb 404. Playwright: sign in → Save visible → add photo+name →
save → My flyers thumbnail loads → mutate name → Open restores name (ZephyrTest) + photo + size. Build clean.

**Bug autopsy:** the curl test first 500'd with "Content-Disposition … missing a name" — a PowerShell
`-Form` multipart artifact (its file parts omit a usable name), NOT a worker bug. `curl.exe -F`
(standards-compliant multipart) and real browser FormData both work. Lesson: when a multipart route
500s only from PowerShell `Invoke-WebRequest -Form`, suspect the test harness, not the handler —
re-test with `curl.exe` before "fixing" working code.

### M7c — Private templates + persist custom fields  *(chunk 3)*
- [ ] Worker `POST /api/me/templates` (template_data + thumbnail), `GET /api/me/templates`.
- [ ] Frontend: "Save as template" (layout, no animal content) + private templates in the gallery.
- [ ] Custom-field definitions persist to the profile (covered by M7a custom_fields) + load on sign in.
- [ ] Verify; build clean; update todo/handoff/lessons; retain M7 closeout.

---

## Review

### M1 — Scaffold + CF Infrastructure ✅ (2026-06-26)
Vite+React18+Tailwind3+react-konva scaffold built, all deps exact-pinned (jsPDF→4 to
clear the dompurify advisory), lockfile present. D1 `bastet-db` created in the correct
Axly account, schema applied local + remote (6 tables verified on remote). Both R2 buckets
created. Worker + Vite boot; `/api/health` and the 5173→8787 proxy verified; production
build clean.

**Decisions / deviations from plan:**
- jsPDF pinned to 4.2.1 (plan said 2.5.x) — eliminates the critical dompurify advisory;
  API-compatible with our `addImage`-only usage.
- R2 CORS deferred to M7 — no browser→R2 uploads exist until then, and correct config needs
  the production origin (not yet chosen).
- esbuild/Vite dev-server advisory accepted — dev-only, absent from production build; the
  only fix is a 3-major Vite 8 jump.

**Gotchas hit:**
- D1 rejects `PRAGMA journal_mode`/`foreign_keys` — both removed; tables ordered so FKs
  resolve without `defer_foreign_keys`. (D1 enforces FKs by default.)
- Cloudflare **MCP connector is bound to a different (empty) account** than wrangler — it
  can't see `bastet-db`. CF work goes through wrangler until the MCP is re-authorized to
  the privaterelay account.

### M2 — Canvas Editor Core ✅ (2026-06-26)
High-craft editor built via shape→impeccable. Flyer document model (1080-space elements,
the shape M3 templates will produce) rendered on a responsive react-konva Stage with a scaled
Layer; the provided export.js scales preview→output so canvas and PNG share one coordinate
system. Photo cover-fits + clips + drags to reframe (aspect preserved, never auto-cropped),
low-res soft warning, badge toggles, curated font picker (global + per-element). Bright/warm
aesthetic, subtle gold cat-glyph, Gabarito+Hanken, light+dark, lively motion.

**Verified (Playwright, local — connected browsers are macOS so claude-in-chrome can't reach
this Windows dev server):** empty/filled/dark/mobile screenshots all clean; uploaded a portrait
photo → cover/clip correct; low-res warning fired; font change applied; **exported PNG is
3240×3240 with the chosen font loaded** (the #1 export gotcha) — matches the canvas.

**Decisions:** added `playwright` as a **dev-only** dep for local screenshot verification (ships
nothing to prod). Wired a basic PNG Download in M2 (instagram_post); the size picker + PDF +
all-4-sizes land in M4. Default square flyer layout ships now; M3 templates supersede it.

**Bug autopsy:** the placeholder bio wrapped mid-word at the flyer edge — cause was a too-long
default string near the element width, not a wrap bug (real bios wrapped fine). Fixed by
shortening the placeholder. Prevention: keep placeholder copy comfortably under one line at the
element's width.

### M3 — Template System ✅ (2026-06-26)
6 bundled templates as flyer documents (same shape D1 will store for community templates):
Calm Cream, Sunny Day, Needs a Home (urgent banner), Quiet Elegance (serif), Bold Story
(portrait), Spotlight (full-bleed + scrim). `loadTemplate` swaps the layout while keeping the
user's photo/fields/badges; templates carry per-element font hints (Fredoka/Anton/Playfair/Bebas)
and a generic `rect` element type (bands, scrims). Gallery shows live mini-previews built from
the real renderers (seeded, non-interactive provider) so previews match the editor. Community
browser hits GET /api/templates (approved-only) → friendly empty state for now.

**Verified (Playwright):** gallery grid, every template applied with content carried over,
portrait story size + dynamic size chip, community empty state.

**Bug autopsy:** Spotlight got a stray marigold contact band — the `contact()` builder defaults
`band:'#e8a33d'` and Spotlight didn't override it. Fixed by passing `band:null`. Prevention:
builders with "on by default" decoration need explicit opt-out and a glance at each consumer.

### M4 — Output Size + Export ✅ (2026-06-26)
Size picker (TopBar popover) + proportional auto-refit (`refit.js`): the flyer is stored at its
template's native size and re-fit to the chosen output size on the fly. Glyph/composite sizes
scale by `min(sx,sy)` (= width-scale for the portrait family; shrinks type for FB landscape to
avoid overlap). Export: PNG at the true output resolution + lazy, compressed PDF. Download is a
PNG/PDF menu.

**Verified (Playwright):** all 4 sizes refit cleanly (FB landscape is sparse-but-clean, as
flagged); IG Post PNG 1080² (135 KB), Print PNG 2550×3300, Print PDF 234 KB.

**Bug autopsy:** first Print PDF was **227 MB**. Cause: the stub's `pixelRatio:3` assumed a
preview-resolution canvas, but this app authors the doc at the TRUE output resolution, so ×3
oversampled to 7650×9900. Fix: `pixelRatio:1` (doc already = output pixels) + PDF compression.
Lesson: a "always do X" constant is only valid within the architecture it was written for —
re-derive it when the surrounding model changes.

### M5 — Custom Fields ✅ (2026-06-26)
Tier-1 custom fields. A "Your own fields" panel (`CustomFields.jsx`) lets a volunteer add/rename/
reorder/remove their own **Text** or **Badge** fields. Values piggyback on the existing
`fields`/`badges` maps (keyed by `custom_<uuid>`), so `setField`/`toggleBadge` already handle
them and `removeCustomField` strips the orphan value. Custom **badges** flow into the existing
pill row (`FlyerBadges`); custom **text** renders in a new `custom` element type (`FlyerCustom.jsx`)
as a labeled, bounded block — one fixed-height `label  value` row per filled field, value
single-line + ellipsis, so it can never blow out a layout. Empty fields render nothing, so an
unused lane is invisible. Each of the 6 templates + the default got a `custom` slot (photos
trimmed ~30–55px to open the lane).

**User decisions:** dedicated labeled block (not folded into the meta line); Text + Badge only
(Dropdown deferred — a dropdown's chosen value renders identically to text on a flyer anyway).

**Verified (Playwright):** custom text + custom badge across all 6 templates (calm/sunny/urgent/
elegance/story/spotlight) — clean in the common case; Facebook landscape refit (`_k` scaling
correct); **Print PNG export = 2550×3300** with the custom row present (same render path → export
fidelity inherited). Spotlight is text-only by design (no pill row → built-in *and* custom badges
both absent there — consistent, not a bug).

**Known limit (documented, like FB landscape):** on the dense **square** templates there is only
room for ~1 custom *text* row before the badge row; 2+ rows + a full badge set gets tight. The
portrait Story has ample room. Real use is a few short fields, so this is acceptable for MVP;
M7's save/profile work could later make the lower stack reflow if it proves annoying.

**Bug autopsy:** none shipped. The one real tension was spatial — the square flyer is already
full (photo+name+meta+bio+badges+contact), so a *dedicated* custom lane has to take space from
something. Reserving a fixed empty lane made the no-custom common case look gappy; the fix was to
trim the photo a little and keep the lane modest (clean for 0–1 rows). Lesson: when a fixed-layout
canvas is full, new optional content trades against either the common-case look or the photo —
pick deliberately and verify the *unused* state, not just the used one.

### M6 — Tier 2 Auth (magic link) ✅ (2026-06-26)
Passwordless magic-link auth. `POST /api/auth/request-link` validates the email, get-or-creates the
user, mints a token, stores its SHA-256 hash (15-min, single-use), and emails a link via Resend —
or, when `RESEND_API_KEY` is unset, returns the link in the response so dev works without email.
`GET /api/auth/verify` consumes the token, opens a 30-day session, sets an HttpOnly `bastet_session`
cookie, and 302s back to the app. `GET /api/me` (requireAuth) returns the rescue-profile allow-list;
`POST /api/auth/logout` deletes the session + clears the cookie. Frontend: an unobtrusive TopBar
sign-in popover (Tier 1 stays the default) and a signed-in account menu, backed by `AuthContext`.

**Verified:** full curl flow (cookie set → /api/me 200 → logout → 401; reused magic token → invalid)
+ **token hashed in D1** (64-char hash, 96-char raw never stored) + Playwright browser sign-in.

**Bug autopsy / decisions:**
- **`.dev.vars` ignored by wrangler 4.105** — `ENVIRONMENT` stayed `production` and
  `MAGIC_LINK_BASE_URL` came through empty despite wrangler printing "Using secrets defined in
  .dev.vars". Rather than depend on it: (a) the **Secure** cookie flag is derived from the request
  scheme (`https:` → Secure), correct in both dev (http) and prod (https); (b) the **base URL** for
  links/redirects falls back to the Worker's own origin (correct on CF Pages, same domain) and, in
  dev only, reads an `x-bastet-app-origin` header injected by the Vite proxy so links land on :5173.
- **Security:** the dev-origin header is trusted **only when `RESEND_API_KEY` is unset** (dev). In
  prod, trusting a client header to build the *emailed* link would let an attacker aim a victim's
  magic link at any host (account-takeover) — so prod uses server config / origin only.
- Lesson: don't let local tooling quirks (`.dev.vars`) leak into runtime correctness — derive
  security-relevant values (cookie Secure, link origin) from trustworthy request/server signals.

---

## 🎉 Push 1 (M1–M4) COMPLETE — Tier 1 anonymous flyer maker is usable end-to-end.
Land → pick a template → add photo (reframe, no auto-crop) → fill fields → pick size →
download PNG/PDF. No account needed. Light + dark, mobile + desktop, 6 templates, 4 sizes.

### Deferred to Push 2 (M5–M8)
M5 custom fields · M6 magic-link auth (needs Resend domain) · M7 Tier 2 saving + rescue profile
+ R2 uploads/CORS · M8 community submissions + admin. Plus README/CONTRIBUTING + CF deploy.
