# 🐾 Bastet

**A free, open-source flyer maker for volunteer animal rescues.**

Bastet helps under-resourced rescues make share-ready adoption flyers in under three minutes —
no design skills, no account, no cost. Named after the Egyptian goddess of cats and protection.
Built by [Axly's Customs](https://github.com/Brinven).

> **Status: early.** The Tier 1 (anonymous, no-account) flyer maker is working end-to-end —
> pick a template, add a photo, fill a few fields, and download. Accounts, saved flyers, rescue
> profiles, and community template sharing are in progress.

---

## What it does today

- **Pick a template** — 6 built-in designs (calm, cheerful, urgent, elegant, story, spotlight).
- **Add a photo** — drag and zoom to reframe; it never auto-crops (no cut-off ears or tails).
- **Fill in the details** — name, bio, breed/age/gender, "good with kids/dogs/cats", spayed/
  neutered, adoption fee or "Sponsored!", foster vs. adopt, and rescue contact info.
- **Choose a size** — Instagram Post, Instagram Story, Facebook Post, or a 300 DPI print flyer.
- **Download** — high-resolution PNG, or a print-ready PDF.

Curated Google Fonts, light **and** dark mode, and it works on a phone.

## Privacy

**No telemetry. No analytics. No tracking of any kind.** The anonymous flyer maker keeps nothing
server-side — your photo and details never leave your browser until you download the flyer. The
codebase is small enough to audit in an afternoon.

## Tech

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, [react-konva](https://konvajs.org/) canvas, Tailwind CSS v3 |
| Export | PNG via Konva, PDF via jsPDF (no headless browser) |
| API | Cloudflare Workers ([Hono](https://hono.dev/)) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Hosting | Cloudflare Pages |

## Local development

You need [Node.js](https://nodejs.org/) 20+ and a (free) [Cloudflare](https://cloudflare.com)
account for the API/database.

```bash
git clone https://github.com/Brinven/bastet.git
cd bastet
npm install
npx wrangler d1 migrations apply bastet-db --local   # set up the local database
npm run dev          # frontend at http://localhost:5173
npm run worker:dev   # API at http://localhost:8787 (separate terminal)
```

On Windows, `start.bat` launches both servers for you (`stop.bat` / `restart.bat` to manage them).

Copy `.env.example` to `.dev.vars` and fill in values when you start working on the
account/email features.

## License

[MIT](./LICENSE) © Axly's Customs.
