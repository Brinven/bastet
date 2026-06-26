# Bastet — Handoff (Push 2 in progress — M5 done)

**Read this first when resuming.** Deeper detail lives in: `tasks/todo.md` (milestone status +
decision autopsies), `.impeccable.md` (design system), `tasks/lessons.md` (dev gotchas),
`bastet-PRD.md` + `CLAUDE.md` (spec).

## Where we are
- **Push 1 (M1–M4) COMPLETE, committed (`a44a337`), pushed.** **M5 (custom fields) COMPLETE,
  verified, NOT yet committed** (working-tree changes — commit when ready).
- Repo: **https://github.com/Brinven/bastet** (public, MIT). `origin` set, `main` ↔ `origin/main`.
- The **Tier 1 anonymous (no-account) flyer maker works end-to-end**: land → pick a template →
  add a photo (drag/zoom reframe, never auto-cropped) → fill fields → **add your own custom
  fields** → pick a size → download PNG/PDF. Light + dark, mobile + desktop, 6 templates, 4 sizes.

## Next: Push 2 (M6–M8)  *(M5 ✅ done)*
- **M5 Custom fields ✅** — "Your own fields" panel: add/rename/reorder/remove Text + Badge fields
  (`custom_<uuid>`). Custom badges → pill row; custom text → new `custom` element. Tier 1 only;
  Tier 2 persistence comes in M7. (Dropdown deferred per user.) See todo.md M5 review.
- **M6 Tier 2 auth** — email → Resend magic link → token verify → session cookie → user record.
  Stubs ready: `src/worker/lib/crypto.js` (hashToken/generateToken) + `session.js` (requireAuth).
  ⚠️ **USER PREREQ:** set up a Resend account + a sending domain (e.g. `bastet@axly.com` or a
  subdomain) with SPF/DKIM **before** this can be tested, or magic-link mail lands in spam.
- **M7 Tier 2 saving + profile** — rescue profile auto-populate, save/load flyers, save private
  templates, persist custom fields, R2 thumbnail on save. **Configure R2 CORS here** (deferred
  from M1 — now we'll know the production origin). 10 MB logo / 2 MB thumbnail caps.
- **M8 Community submissions + admin** — submit form (Tier 2), admin approval endpoints +
  minimal admin UI (bearer-token, not session), appears in community browser once approved.
  The community browser + `GET /api/templates` (approved-only) already exist and work.
- **Then:** CONTRIBUTING.md, one-click CF deploy button, production deploy.

## Infra / accounts (don't get this wrong)
- **CF account: `wkbp5f7wq2@privaterelay.appleid.com` (ID `6c92bbd56c48a14a3a9f3c532957dd1c`).**
  NOT the Bluefiles account (that's only for bluefilesreport.com).
- D1 `bastet-db` id `f342dd77-6e16-4634-996c-bb47a8681195` (in `wrangler.toml`); schema applied
  local + remote. R2 buckets `bastet-templates` + `bastet-user-assets` created (CORS pending M7).
- wrangler runs via `npx` (devDep). If its token expired: `npx wrangler login` — interactive, so
  ask the user to run it with a `!` prefix; confirm the **privaterelay** account before provisioning.
- The **Cloudflare MCP connector is on a different (empty) account** — use wrangler for CF unless
  the user re-authorizes the MCP to the privaterelay account.
- `gh` is authed as **Brinven**. The auto-mode classifier **blocks public `gh` push** → hand the
  command to the user (or add a Bash permission rule via `/update-config`).

## Architecture (as-built — do NOT regress these)
- A flyer is a **document**: `{ outputSize, width, height, background, elements[] }`, elements in
  **1080-output coordinates**. Element types: `photo, text, metaText, custom, badges, fee, tag,
  contact, rect`. **This is the real template format** — CLAUDE.md's raw-Konva-primitive "Template
  JSON structure" was illustrative only. M8 stores this JSON as `template_data` in D1.
- **Custom fields (M5):** `customFields` (ordered defs) live in `EditorContext`; their *values*
  reuse the `fields`/`badges` maps (keyed by `custom_<uuid>`). The `custom` element (`FlyerCustom`)
  renders user text as bounded `label  value` rows (ellipsized → can't overflow); custom badges
  append into `FlyerBadges`. Every template has a `custom` slot in its bio→badges lane (Spotlight
  = text-only, no pill row by design). Square templates fit ~1 custom text row cleanly (known
  limit, like FB landscape).
- State: `src/state/EditorContext.jsx`. `doc` is derived = `refitDocument(nativeDoc, outputSize)`.
  `loadTemplate` swaps `nativeDoc` and keeps the user's content (fields/photo/badges/fonts).
- Sizes: `src/lib/refit.js` proportionally scales a template to any of the 4 sizes (user chose
  "auto-refit all 4"). Composite renderers read `element._k` for internal scaling. Facebook
  landscape is the known rough case (sparse-but-clean, type shrinks via `min(sx,sy)`).
- ⚠️ **Export uses `pixelRatio: 1`, NOT 3** (contra CLAUDE.md gotcha #2). The canvas is authored
  at TRUE output resolution, so ×3 oversamples → a **227 MB** print PDF. `pixelRatio:1` = exact
  promised dimensions (IG 1080², Print 2550×3300@300DPI). `src/lib/export.js` documents why.
  **Do not revert to 3.** Font-load-before-export (gotcha #1) is still sacred.
- Fonts: UI chrome = **Gabarito + Hanken Grotesk** (`index.html`). Flyer fonts = curated ~25
  Google Fonts (`src/lib/fonts.js`), loaded via `useFonts`. Per-element font = override `??`
  `element.fontFamily` `??` global.
- Theme tokens: OKLCH CSS vars in `src/index.css` (light + dark via `prefers-color-scheme`),
  mapped in `tailwind.config.js`. **Don't use `/opacity` modifiers on these var colors** — use
  `color-mix` (see `TopBar.jsx`).

## Verification (how to "see" the app)
- **claude-in-chrome CANNOT reach this Windows dev server** — the connected browsers are macOS
  (different machines). Use **local Playwright** (installed as a devDep). Pattern that works
  around ESM module resolution: write the screenshot `.mjs` to scratchpad, `cp` it to the project
  root, `node script.mjs <outdir>`, then `rm` it. chromium is already installed on this machine
  (`npx playwright install chromium` if a fresh machine).
- Build check: `npm run build` (clean, ~626 modules).
- **Dev gotcha:** after substantial Tailwind/config edits, RESTART vite (clear
  `node_modules/.vite`) — a long-running dev server's JIT CSS goes stale and var-based color
  utilities render transparent (see `tasks/lessons.md`). The built CSS is always correct.

## Conventions in force
- npm hardening: exact pins + hardened `.npmrc`. jsPDF pinned to v4 (clears the dompurify
  advisory). The esbuild/vite **dev-server-only** advisory is accepted (not in prod build).
- bat-trio (`start`/`stop`/`restart.bat`) — CRLF, kill anchored to ports 5173/8787.
- No telemetry, no `console.log` of user data. D1: prepared statements only.

## Runtime note
- Dev servers (vite 5173 + wrangler dev 8787) were running this session; they end with the
  session. Next session: `start.bat` (or `npm run dev` + `npm run worker:dev`).

## Flagged to the user
- Set up a **Resend** sending domain (blocks M6 testing).
- Add a **Bash permission rule** for `gh` push (via `/update-config`) — "at some point today."
