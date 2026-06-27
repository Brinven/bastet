# Bastet — Lessons

## Dev: stale Vite/Tailwind JIT after a long session (2026-06-26)
**Symptom:** custom Tailwind color utilities backed by CSS vars (`bg-surface`, `bg-primary`,
etc.) rendered **transparent** in the browser — most visible on the size dropdown, whose panel
you could see straight through. Text colors still looked right (they inherit `--ink` from the
`body` rule, so the broken `text-*` utilities were masked).

**Root cause:** a Vite dev server left running across many `tailwind.config.js` / `index.css`
edits accumulated a stale JIT CSS cache. The **built** CSS was correct
(`.bg-surface{background-color:var(--surface)}`), so production was never affected.

**Fix / rule:** after substantial Tailwind theme/config changes in a long session, restart the
dev server (and clear `node_modules/.vite` if needed) rather than trusting HMR:
`stop.bat` → `start.bat`, or kill port 5173 and `npm run dev`. When a utility "doesn't work,"
diff the **built** CSS against the dev DOM's computed style before assuming a code bug.

**Note on var-based oklch colors:** the `colors: { x: 'var(--x)' }` pattern in tailwind.config
emits raw `background-color: var(--x)` (opaque) — it does NOT wrap in `rgb(var(--x)/alpha)`, so
oklch CSS vars are safe here. Just don't use `/opacity` modifiers on them (use `color-mix` —
see TopBar's translucent header bg).

## Design: adding optional content to a full fixed-layout canvas (M5, 2026-06-26)
**Context:** M5 added custom fields that must appear on the flyer. The flyer templates are
absolutely-positioned and already vertically full (photo → name → meta → bio → badges → contact
band). A *dedicated* lane for new content has to take space from something — it can't reflow.

**Trap:** reserving a fixed empty lane for the new content makes the **common case** (most flyers
use NO custom fields) look gappy/broken, even though the *used* case looks fine. It's easy to
verify only the populated state and ship an ugly empty state.

**Rule:** when adding optional content to a full fixed canvas, (1) make the new renderer **bounded
by design** (fixed-height rows + ellipsis) so it can never overflow a layout; (2) make it render
**nothing when empty** so an unused slot is invisible; (3) buy its space from the most flexible
element (here: trim the hero photo ~30–55px) rather than over-reserving; (4) **screenshot the
UNUSED state too**, not just the populated one. Accept a documented limit for the extreme combo
(square templates fit ~1 custom text row; portrait has room) rather than wrecking the common case.

## Worker: wrangler 4.105 doesn't apply `.dev.vars`; derive security values from the request (M6)
**Symptom:** `.dev.vars` (clean LF/UTF-8, no BOM) was printed by wrangler as "Using secrets defined
in .dev.vars" and listed in the bindings panel, but `c.env.ENVIRONMENT` stayed `production` (the
`wrangler.toml [vars]` value) and `MAGIC_LINK_BASE_URL` came through empty. So both `ENVIRONMENT`-
and `MAGIC_LINK_BASE_URL`-gated logic silently used the wrong values in local dev.

**Fixes (don't depend on `.dev.vars` for runtime correctness):**
- **Cookie `Secure`** → derive from the request scheme: `new URL(c.req.url).protocol === 'https:'`.
  Correct in dev (http://localhost → not Secure, so the cookie isn't dropped) and prod (https →
  Secure). Never gate Secure on an env var that might not load.
- **Magic-link base URL** → fall back to the Worker's own request origin (on CF Pages the API
  shares the site domain, so origin is already right in prod). For dev, the Vite proxy injects an
  `x-bastet-app-origin` header so links/redirects land on :5173 — but **trust that header ONLY in
  dev** (`!env.RESEND_API_KEY`); trusting a client header to build a *real emailed* link is an
  account-takeover vector (attacker aims a victim's link at any host).

**Rule:** security-relevant runtime values (cookie flags, redirect/link origins) must come from
trustworthy request/server signals, never from local-only tooling (`.dev.vars`) that may not load
and never from spoofable client headers in production. Verify env-dependent branches actually see
the value you think (`/api/health` echoing `env` caught this immediately).

## Testing: PowerShell `Invoke-WebRequest -Form` produces multipart the Workers runtime rejects (M7b, 2026-06-26)
**Symptom:** `POST /api/me/flyers` (multipart: text fields + thumb/photo files) **500'd only from
PowerShell** with `TypeError: Content-Disposition header in FormData part is missing a name` (thrown
inside Hono's `c.req.parseBody()` → the Workers `parseFormData`). The handler was correct; a real
browser's `FormData` and `curl.exe -F` both worked first try.

**Root cause:** PS7 `Invoke-WebRequest -Form @{ file = Get-Item path }` emits file parts whose
`Content-Disposition` lacks a usable `name=` the way the WHATWG/Workers parser expects — a
test-harness artifact, not a server bug.

**Rule:** when a multipart endpoint 500s **only** under PowerShell `-Form`, suspect the harness
before the handler. Re-test with `curl.exe -F "field=@file;type=..."` (and `-F "json=<file"` to
pass a JSON field value from a file, avoiding shell-quoting hell) and/or a real browser via
Playwright before changing working code. Also: PS `-o $null` expands to an EMPTY string → curl
errors with "option -o requires parameter"; use a real sink path (or `NUL`).

## Design: store-the-bytes round-trip for saved flyers (M7b, 2026-06-26)
**Decision (user):** save the original animal photo bytes to R2 with the flyer so a load restores
EXACTLY (the volunteer never re-adds the photo). Cost guard = a **per-user cap (50 flyers)** since
this could get popular; worst case ~50×10 MB/user, tunable in one constant (`MAX_FLYERS` in
`worker/routes/me.js`).
- `flyer_data` JSON (D1) holds everything **except** image bytes — including the photo *transform*
  (`scale/offsetX/offsetY/naturalWidth/naturalHeight` + `hasBytes`). Bytes (photo + thumbnail) live
  in R2, worker-proxied (no CORS), keys derived from `user+flyer` ids.
- **Restore without canvas taint:** fetch the photo bytes → `FileReader` → **data URL** → `new Image`.
  A data URL is same-origin, so `stage.toDataURL()` export stays clean. (Serving the R2 object URL
  directly would be same-origin too here, but data URL is the belt-and-suspenders choice.)
- The HTMLImageElement is non-serializable — store only `photo.src`'s *transform* in JSON and rebuild
  the element on load; never try to JSON a live `Image`/`File`.
