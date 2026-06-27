# Bastet — Handoff (Push 2 in progress — M5 ✅ · M6 ✅ · M7a ✅ · M7b ✅ · M7c ✅)

**Read this first when resuming.** Deeper detail lives in: `tasks/todo.md` (milestone status +
decision autopsies), `.impeccable.md` (design system), `tasks/lessons.md` (dev gotchas),
`bastet-PRD.md` + `CLAUDE.md` (spec).

## Where we are
- Commits on `main` (all pushed): Push 1 (M1–M4) `a44a337` · M5 custom fields `79a06bd` ·
  M6 magic-link auth `5522289` · M7a rescue profile + logo + auto-populate `e9801b5` ·
  M7b save/load flyers `f191da6` · **M7c private templates + custom-field persistence `c830e42`**.
- Repo: **https://github.com/Brinven/bastet** (public, MIT). `main` ↔ `origin/main`, clean tree.
- **Tier 1 (anonymous) flyer maker** works end-to-end: land → pick a template → add a photo
  (drag/zoom reframe, never auto-cropped) → fill fields → **add your own custom fields** → pick a
  size → download PNG/PDF. Light + dark, mobile + desktop, 6 templates, 4 sizes.
- **Tier 2 (magic link)** works: sign in → session; **rescue profile** (name/phone/website + logo)
  auto-fills new flyers' contact band on sign-in; **save flyers + reopen them** (My flyers gallery,
  photo+thumbnail in R2); **save the look as a private template + reuse it** (Your templates in the
  Templates tab); **custom-field definitions persist to the profile** and reload on sign-in.

## Next: finish M7, then M8 + release
- **M7b — Save / load flyers** ✅ DONE (`f191da6`). As-built: Worker `POST/GET/GET:id/
  GET:id/thumb/GET:id/photo/DELETE /api/me/flyers` (all `requireAuth`, scoped to the session user).
  `flyer_data` JSON in D1 = `{version,templateId,nativeDoc,outputSize,fields,badges,customFields,
  fosterVsAdopt,feeMode,fonts,photo:{transform+hasBytes}|null}`; the **original photo bytes** +
  a small **thumbnail** go to R2 `bastet-user-assets` (`flyers/<u>/<id>/{photo,thumb}`, worker-
  proxied → no CORS; caps 10 MB photo / 2 MB thumb; **per-user cap 50**). Frontend: TopBar **Save**
  button (signed-in only) → `SaveFlyerModal`; **My flyers** gallery (`MyFlyersModal`) from the
  account menu (load rebuilds the photo from R2 bytes via a data URL → no canvas taint; delete has
  inline confirm). `EditorContext.loadFlyer(snap, photoState)` swaps all state at once;
  `nativeDoc` now exposed. New: `src/lib/flyersApi.js`, `src/components/flyers/*`.
- **M7c — Private templates + persist custom fields** ✅ DONE (`c830e42`). Worker `POST/GET/
  GET:id/GET:id/thumb/DELETE /api/me/templates` (requireAuth, scoped; cap 50). `template_data` JSON =
  `{version,nativeDoc,outputSize,fonts,customFields(defs),templateId}` — **layout only, no animal
  content, no photo**; thumbnail (current canvas) → R2 `templates/<u>/<id>/thumb`. Frontend: TopBar
  **Save** is now a menu ("Save flyer" / "Save as template" → `SaveTemplateModal`); **Your templates**
  section (`UserTemplates`) atop the Templates tab applies (`EditorContext.applyUserTemplate` — swaps
  look + custom lanes, keeps animal content) / deletes. **Custom-field defs persist to the profile**:
  a `customFieldsRev` counter (bumped ONLY by user edits — add/remove/rename/move, NOT by programmatic
  loads) drives a debounced `CustomFieldsSync` bridge that `PATCH`es `{ custom_fields }`; defs load
  once per login (only if local is empty) so opening a flyer/template never clobbers saved defaults.
  New: `src/lib/userTemplatesApi.js`, `src/components/templates/{SaveTemplateModal,UserTemplates}.jsx`.
- **M7 follow-up — logo ON the flyer** *(still open)*: M7a stores/serves/shows the logo in the profile but it does
  NOT render on the flyer yet. Cleanest single spot = **`ContactBlock`** (covers all 6 templates at
  once): load `/api/me/logo` into an HTMLImageElement, add a `logo` to editor state (like `photo`),
  render a small Konva `Image` at the left of the contact band, shift the name right. Verify export
  (same-origin image → no canvas taint). Tracked in todo.md M7a.
- **M8 — Community submissions + admin**: submit form (Tier 2) `POST /api/templates`; admin approval
  (`/api/admin/templates/*`, **bearer token** `ADMIN_BEARER_TOKEN`, not session) + minimal admin UI;
  appears in the community browser once approved. The browser + `GET /api/templates` (approved-only)
  already exist and work.
- **Then:** README, CONTRIBUTING.md (template guidelines), one-click CF deploy button, prod deploy.

## API surface (as-built)
- Public: `GET /api/health`, `GET /api/templates` (approved-only), `GET /api/templates/:id`.
- Auth (M6): `POST /api/auth/request-link`, `GET /api/auth/verify?token=`, `POST /api/auth/logout`.
- Me (M6/M7a): `GET /api/me`, `PATCH /api/me`, `POST /api/me/logo`, `GET /api/me/logo`.
- Flyers (M7b): `POST /api/me/flyers`, `GET /api/me/flyers`, `GET /api/me/flyers/:id`,
  `GET /api/me/flyers/:id/thumb`, `GET /api/me/flyers/:id/photo`, `DELETE /api/me/flyers/:id`.
- Private templates (M7c): `POST /api/me/templates`, `GET /api/me/templates`, `GET /api/me/templates/:id`,
  `GET /api/me/templates/:id/thumb`, `DELETE /api/me/templates/:id`.
- TODO: `POST /api/templates` (submit) + `/api/admin/*` (M8).

## Architecture (as-built — do NOT regress)
- A flyer is a **document** `{ outputSize, width, height, background, elements[] }`, elements in
  **1080-output coordinates**. Element types: `photo, text, metaText, custom, badges, fee, tag,
  contact, rect`. This is the REAL format (CLAUDE.md's raw-Konva "Template JSON" was illustrative).
  M8 stores it as `template_data` in D1.
- State `src/state/EditorContext.jsx`: `doc = refitDocument(nativeDoc, outputSize)`. `loadTemplate`
  swaps `nativeDoc`, keeps user content. `src/lib/refit.js` scales to any of the 4 sizes; composite
  renderers read `element._k`. FB landscape is the known rough (sparse-but-clean) case.
- **Custom fields (M5):** `customFields` (ordered defs) in `EditorContext`; *values* reuse the
  `fields`/`badges` maps (keyed `custom_<uuid>`). `FlyerCustom` renders bounded `label  value` rows
  (ellipsized → can't overflow); custom badges append into `FlyerBadges`. Every template has a
  `custom` slot (Spotlight = text-only). Square templates fit ~1 custom text row (documented limit).
- **Auth (M6):** `src/state/AuthContext.jsx` (`useAuth`). Tokens **hashed** before D1 (SHA-256,
  raw never stored); magic link 15-min single-use; session 30-day HttpOnly `bastet_session` cookie,
  **Secure derived from request scheme** (not env). `requireAuth` (`worker/lib/session.js`) gates
  `/api/me*`. Magic-link **base URL** = `MAGIC_LINK_BASE_URL` || Worker origin (correct on CF Pages
  same-domain); in dev the Vite proxy injects `x-bastet-app-origin`, **trusted only when
  `RESEND_API_KEY` is unset** (client header must never aim a real emailed link — takeover risk).
- **Profile (M7a):** `PATCH /api/me` (partial), logo upload/serve via R2 (`worker/lib/r2.js`,
  worker-proxied → no CORS). `EditorContext.applyProfile` fills EMPTY contact fields only;
  `ProfileAutofill` bridge in `Editor.jsx` runs once per login. `ProfileModal` from the account menu.
- ⚠️ **Export uses `pixelRatio: 1`, NOT 3** (canvas authored at TRUE output resolution; ×3 → 227 MB
  PDF). Exact dims: IG 1080², Print 2550×3300@300DPI. Font-load-before-export stays sacred.
- Fonts: UI = Gabarito + Hanken (`index.html`); flyer = ~25 curated Google Fonts (`src/lib/fonts.js`
  via `useFonts`). Per-element font = override `??` `element.fontFamily` `??` global.
- Theme: OKLCH CSS vars (`src/index.css`, light+dark via `prefers-color-scheme`), mapped in
  `tailwind.config.js`. **No `/opacity` modifiers** on these var colors — use `color-mix`.

## Verification (how to "see" the app)
- **claude-in-chrome can't reach this Windows dev server** (connected browsers are macOS). Use
  **local Playwright** (devDep): write the screenshot `.mjs` to scratchpad, `cp` to project root,
  `node script.mjs <outdir>`, `rm` it (works around ESM resolution). chromium already installed.
- **Backend (auth/profile/M7) is fastest to test via `curl`** against the Worker (`:8787`) with a
  cookie jar — see this session's commands (sign in → verify → cookie → /api/me). For browser/UI,
  drive `:5173` (proxy injects the dev header so dev sign-in links land on `:5173`).
- Build check: `npm run build` (clean, ~631 modules). After big Tailwind/config edits, RESTART vite
  (stale JIT makes var-based color utilities render transparent — see `tasks/lessons.md`).

## Infra / accounts (don't get this wrong)
- **CF account: `wkbp5f7wq2@privaterelay.appleid.com` (ID `6c92bbd56c48a14a3a9f3c532957dd1c`).**
  NOT the Bluefiles account.
- D1 `bastet-db` id `f342dd77-6e16-4634-996c-bb47a8681195` (`wrangler.toml`); schema applied local +
  remote. R2 `bastet-templates` + `bastet-user-assets`. **R2 CORS is NOT needed** — uploads are
  worker-proxied (logo done; flyer/template thumbnails in M7b/c use the same pattern). Only needed
  if we ever do browser-direct R2 uploads (not planned).
- wrangler via `npx` (devDep). Expired token → `npx wrangler login` (interactive — have the user run
  it with `!`; confirm the **privaterelay** account). The **CF MCP connector is a different (empty)
  account** — use wrangler for CF.
- `gh` authed as **Brinven**. **`git push origin main` WORKS** in this environment (used 3× this
  session); the old "classifier blocks push" note no longer applies for `git push`.

## Conventions in force
- npm hardening: exact pins + hardened `.npmrc`. jsPDF pinned v4 (clears dompurify advisory). The
  esbuild/vite **dev-server-only** advisory is accepted (absent from prod build).
- bat-trio (`start`/`stop`/`restart.bat`) — CRLF, kill anchored to ports 5173/8787.
- No telemetry, no `console.log` of tokens/user data. D1: prepared statements only. Worker-proxied
  uploads (no CORS). Caps: logo 10 MB, thumbnail 2 MB.

## Runtime note (IMPORTANT after a context clear)
- The dev servers started this session (**vite `:5173` + wrangler dev `:8787`**) were launched
  detached and **may still be running** after the context clear. Check: `curl :5173` and
  `curl :8787/api/health`. If down, `start.bat` (or `npm run dev` + `npm run worker:dev`).
- **Auth + M7 need the Worker running** (`:8787`). With only Vite up, `/api/me` 401s and the app
  just shows "Sign in" (Tier 1 still fully works). Local D1 already has the schema.
- **`.dev.vars` is IGNORED by wrangler 4.105** here (prints "Using secrets defined in .dev.vars" but
  `c.env` keeps the toml `[vars]`). Don't rely on it — auth derives cookie-Secure from request scheme
  and link base from origin/proxy-header. Prod secrets go via `wrangler secret put` (unaffected).
- Stray test users/logos exist in the LOCAL D1 from this session's testing (harmless).

## Flagged to the user
- **PROD email (Resend):** Bastet reuses the same stack as **axly-wallpapers** (which uses Resend +
  Stripe) — likely an existing Resend account/domain. To enable prod sign-in email: verify a sending
  domain (SPF/DKIM, e.g. `bastet@axly.com`), then `wrangler secret put RESEND_API_KEY` (+ optional
  `MAGIC_LINK_FROM`, `MAGIC_LINK_BASE_URL`). **Dev sign-in is unblocked** (request-link returns the
  link when no key is set).
