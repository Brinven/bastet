# 🐾 Bastet

**A free, open-source flyer maker for volunteer animal rescues.**

Bastet helps under-resourced rescues make a clean adoption flyer in under three minutes — no design
skills, no account, no cost. Pick a template, drop in a photo, fill a few fields, and download a
print- or social-ready image. Named after the Egyptian goddess of cats and protection. Built by
[Axly's Customs](https://github.com/Brinven).

> **Dead simple is the whole point.** If a volunteer who has never opened Canva can't finish a flyer
> on their first try, the design has failed.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Brinven/bastet)
&nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp; No accounts required &nbsp;·&nbsp; **No tracking, ever**

---

## What you can do

**Anyone — no sign-in (covers ~90% of use):**
- Start from a bundled template and reflow your content into it (6 designs: calm, cheerful, urgent,
  elegant, story, spotlight)
- Add an animal photo and drag/zoom to frame it — **never auto-cropped** (no cut-off ears or tails)
- Fill the rescue fields: name, bio, breed, age, gender, weight, adoption fee / "Sponsored!",
  foster vs. adopt, and contact info
- Toggle "good with kids / dogs / cats / other" + spayed/neutered badges
- Add **your own custom fields** (a microchip number, an event date, a "hypoallergenic" tag)
- Pick a curated rescue-appropriate font (per element or for the whole flyer)
- Choose an output size — Instagram Post, Instagram Story, Facebook Post, or a 300-DPI print flyer
- Download a high-resolution **PNG** or **PDF**

Curated Google Fonts, light **and** dark mode, and it works on a phone.

**With a magic-link sign-in (optional, for power users):**
- A **rescue profile** (name, phone, website, logo) that auto-fills every new flyer — the logo even
  renders right on the flyer
- **Save flyers** to your account and reopen them exactly as they were
- **Save your layout as a private template** and reuse it on the next animal
- Your custom fields **persist** and load on every new flyer
- **Share a template with the community** (reviewed by an admin before it appears for everyone)

No passwords. No OAuth. Just a one-time email link.

---

## No tracking. Really.

There is **no analytics, no telemetry, and no tracking of any kind** anywhere in this app — no
pixels, no third-party scripts, no "anonymous usage" beacons. The anonymous flyer maker keeps
nothing server-side; your photo and details never leave your browser until you download. The only
data ever stored is what a signed-in user explicitly saves (their profile, flyers, and templates),
and magic-link / session tokens are **hashed** before they touch the database. The codebase is small
enough that a technically literate rescue coordinator can audit it in an afternoon.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Canvas editor | [react-konva](https://konvajs.org/) (Konva.js) |
| Styling | Tailwind CSS v3 |
| Fonts | Curated ~25 Google Fonts |
| Export | `toDataURL` → PNG, wrapped to PDF via jsPDF (no headless browser) |
| Hosting | Cloudflare Pages (static frontend) |
| API | Cloudflare Workers ([Hono](https://hono.dev/)) — all `/api/*` routes |
| Database | Cloudflare D1 (SQLite) — prepared statements only |
| Storage | Cloudflare R2 — `bastet-templates`, `bastet-user-assets` |
| Email | Resend (magic-link delivery only) |
| Auth | Custom magic link — no OAuth, no passwords |

The only required external service is **Resend**, and only for production sign-in email. In local
dev the sign-in link is returned in the API response, so the whole app runs with zero external
accounts.

---

## Run it locally (5 steps)

You'll need **Node 20+**. Cloudflare's `wrangler` ships as a dev dependency — no global install.

```bash
# 1. Install
npm install

# 2. Create the local database schema (one time)
npm run d1:migrate:local

# 3. Start the API (Cloudflare Worker) on http://localhost:8787
npm run worker:dev

# 4. In a second terminal, start the app on http://localhost:5173
npm run dev
```

**5.** Open <http://localhost:5173>. The anonymous flyer maker works immediately. To try sign-in,
click **Sign in**, enter any email, and use the dev link returned right in the popup (no Resend
account needed — that fallback is active whenever `RESEND_API_KEY` is unset).

> On Windows, `start.bat` launches both servers for you (`stop.bat` / `restart.bat` to manage them).
>
> Tier 1 (anonymous) works even with only Vite running. The Worker (step 3) is needed for sign-in,
> saving, and the community browser.

To review community submissions locally, open <http://localhost:5173/#admin> and use the dev admin
token `dev-admin-token` (valid only in dev — see [Deploy](#deploy-to-cloudflare)).

---

## Project structure

```
src/
  components/   editor, fields, templates, flyers, profile, auth, admin, ui
  hooks/        useFonts, useAuth, useCanvas
  lib/          export, fonts, refit, image, outputSizes, fieldBindings, *Api
  state/        EditorContext, AuthContext
  templates/    bundled template documents (not from D1)
  worker/       Cloudflare Worker (Hono): index, routes/, lib/
migrations/     D1 schema
public/         _routes.json (CF Pages → /api/* to the Worker)
wrangler.toml   Worker + D1 + R2 bindings
```

A flyer is a **document** of field-bound elements authored in 1080-px output space and refit to the
chosen size — see [`CLAUDE.md`](CLAUDE.md) for the full as-built architecture and gotchas.

---

## Deploy to Cloudflare

Bastet is a static frontend (CF Pages) plus a Worker API (D1 + R2). The "Deploy to Cloudflare"
button bootstraps the repo; the data resources and secrets are provisioned once with `wrangler`:

```bash
# 1. Authenticate (interactive)
npx wrangler login

# 2. Create the database, then copy the printed id into wrangler.toml (database_id)
npx wrangler d1 create bastet-db

# 3. Create the two storage buckets
npx wrangler r2 bucket create bastet-templates
npx wrangler r2 bucket create bastet-user-assets

# 4. Apply the schema to the remote database
npm run d1:migrate:remote

# 5. Set production secrets
npx wrangler secret put ADMIN_BEARER_TOKEN     # gates the community approval queue
npx wrangler secret put RESEND_API_KEY         # production sign-in email (see below)
npx wrangler secret put MAGIC_LINK_FROM        # e.g. "Bastet <bastet@yourdomain.org>"
npx wrangler secret put MAGIC_LINK_BASE_URL    # your production URL, e.g. https://bastet.yourdomain.org

# 6. Build the frontend
npm run build
```

Then deploy the built `dist/` to **Cloudflare Pages** and the Worker (`npx wrangler deploy`), with
`/api/*` routed to the Worker on the same domain (handled by `public/_routes.json`). Uploads are
proxied through the Worker, so **no R2 CORS configuration is needed**.

**Production email (Resend):** magic-link delivery needs a Resend account with a **verified sending
domain** (SPF + DKIM) — otherwise sign-in mail lands in spam. Until `RESEND_API_KEY` is set,
production sign-in can't email (local dev is unaffected).

**Admin:** community submissions are reviewed at `https://your-domain/#admin` with the
`ADMIN_BEARER_TOKEN` you set above. Admin access is a simple bearer token by design (auditable, not
session-based); with no token set in production, the admin routes stay locked.

### Environment variables

All configuration lives in environment variables / Worker secrets — never in code. Copy
[`.env.example`](.env.example) to `.dev.vars` for local Worker dev, or set each in production with
`wrangler secret put`. Nothing is required for the anonymous flyer maker.

---

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md), which also covers
**community template submission guidelines** (what makes a good, reusable flyer template).

## License

[MIT](LICENSE) © Axly's Customs. Free forever — no paid tiers, no feature gates.
