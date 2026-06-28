# Bastet — Production Deploy Plan (Option A: single Worker + Static Assets)

Target: **bastet.axly.com** — one `bastet-worker` serves the built SPA (`dist/`) AND `/api/*`
(Hono), same origin. CF account = privaterelay `6c92bbd5…`. axly.com is a CF zone (api.axly.com
is a Worker custom domain → precedent).

## Phase 1 — Wire + verify locally (no live changes)  ✅ DONE
- [x] Verify Workers Static Assets config knobs vs current CF docs (run_worker_first array needs
      wrangler >=4.20; we have 4.105; not_found_handling=single-page-application)
- [x] wrangler.toml: add `[assets]` (dir=./dist, SPA fallback, run_worker_first=/api/*)
- [x] wrangler.toml `[vars]`: add MAGIC_LINK_FROM + MAGIC_LINK_BASE_URL (non-secret)
- [x] Remove dead `public/_routes.json`; fix stale comments in vite.config.js + src/worker/index.js
      + README deploy section + stack table
- [x] `npm run build` (clean, 643 modules)
- [x] Local proof: `wrangler dev` → `/`=index.html, `/api/health`=Hono JSON, `/deep/link`=SPA
      fallback, `/api/templates`=D1 JSON, all on one port. Unified routing confirmed.

## Phase 2 — Deploy live
- [x] `npx wrangler deploy` → **bastet-worker live at https://bastet-worker.wkbp5f7wq2.workers.dev**;
      all bindings attached (DB, both R2, ENVIRONMENT=production, MAGIC_LINK_FROM/BASE_URL)
- [x] Confirm remote D1 schema present (tables verified: templates/users/user_templates/… populated)
- [x] Smoke-test workers.dev: /api/health env=production; /api/templates 200 []; admin no-token 401;
      /api/me no-cookie 401; notFound JSON. (Initial "error 1042" was a transient post-deploy edge
      state; clean on retry.) **Tier 1 anonymous flyer maker is production-ready now.**
- [ ] **USER:** Secrets (run in your own terminal so values never hit the transcript):
      - [ ] `ADMIN_BEARER_TOKEN` (gates /api/admin/*; generate strong, save for /#admin login)
      - [ ] `RESEND_API_KEY` (the fresh Bastet key) — ALSO closes the dev-link leak (see note)
- [ ] **USER:** Custom domain bastet.axly.com — CF dashboard → bastet-worker → Domains & Routes →
      Add Custom Domain (CLI OAuth token is zone-READ only, so dashboard is the reliable path;
      axly.com is your CF zone so DNS+cert auto-provision)
- [ ] Smoke test prod on bastet.axly.com: anonymous flyer + PNG/PDF export; real sign-in email
      round-trip; #admin queue with the bearer token

## ⚠️ Security note — close promptly
Until `RESEND_API_KEY` is set, `POST /api/auth/request-link` returns the magic link IN THE RESPONSE
(dev fallback) on the PUBLIC workers.dev URL — i.e. open sign-in for any email. URL is unadvertised
(low risk) but setting RESEND_API_KEY flips it to real-email-only and closes it. Do RESEND early.

## Notes / decisions
- MAGIC_LINK_FROM / MAGIC_LINK_BASE_URL kept as plain `[vars]` (not secrets) — not sensitive,
  nicer to have them version-controlled. RESEND_API_KEY + ADMIN_BEARER_TOKEN stay secrets.
- README/_routes.json described a Pages model that was never wired (no functions/ adapter). Option A
  replaces that with Workers Static Assets; README deploy section updated to match.
