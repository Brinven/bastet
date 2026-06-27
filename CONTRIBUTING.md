# Contributing to Bastet

Thanks for helping rescues promote adoptable animals! Bastet is free and open source, and
contributions — bug reports, fixes, features, and **community templates** — are all welcome.

Two guiding principles shape every contribution:

1. **Dead simple.** A non-technical volunteer should finish a flyer in under three minutes on their
   first try. Features that add steps, settings, or jargon need a strong justification.
2. **No tracking, ever.** No analytics, telemetry, tracking pixels, or third-party beacons — in any
   form, for any reason. This is a hard rule, not a preference.

---

## Reporting bugs & requesting features

Open an issue with:

- What you expected vs. what happened
- Steps to reproduce (and the output size / template if relevant)
- Browser + OS, and a screenshot if it's visual

For export problems, please note whether the **exported file** differs from the **canvas preview** —
that's the single most important detail (see the font-load gotcha below).

---

## Code contributions

1. Fork, branch, and read [`README.md`](README.md) for local setup and [`CLAUDE.md`](CLAUDE.md) for
   the as-built architecture and the list of gotchas. The PRD (`bastet-PRD.md`) is the source of
   truth for scope.
2. Make your change and run `npm run build` (it must stay clean).
3. Open a PR describing the change and how you verified it.

**House rules:**

- **No telemetry/analytics/tracking.** (Yes, it's worth repeating.)
- **No secrets in code or logs** — ever. Use environment variables / Worker secrets. Never
  `console.log` a token, email, or other user data.
- **D1: prepared statements only** (`.prepare().bind()`), never string-concatenated SQL.
- **User uploads are worker-proxied to R2** — keep that pattern (it avoids R2 CORS entirely).
- **Fonts must be loaded before export.** Always `await document.fonts.ready` (+ the safety buffer)
  before `toDataURL()`, or text silently exports in a fallback font. This is the #1 export bug.
- **Don't auto-crop the animal photo.** The user always frames it themselves.
- **New dependencies need a reason.** Flag any addition in your PR and explain the tradeoff; this
  project favors a small, auditable footprint.
- **Respect the scope guard** in `CLAUDE.md` (no AI image generation, no direct social posting, no
  paid tiers, no tracking, etc.). Propose a PRD change first if you want to go beyond it.
- Match the surrounding code's style — comment the *why*, not the obvious.

---

## Community template guidelines

Anyone signed in can share a template: build a layout you like, then **Save → Share with the
community**. Submissions are **reviewed by a maintainer before they appear** for everyone — nothing
auto-publishes.

A template is a **layout only**. It captures the design (placement, fonts, colors, your custom-field
lanes) — **not** a specific animal's photo or details, and **not** your contact info (that fills in
from each user's own rescue profile). Only your **rescue name** is shown as the credit; your email is
never attached or exposed.

### What makes a good template

- **Clear hierarchy** — the animal photo and name read first, at a glance.
- **Legible at thumbnail size** — it should still make sense small, in a social feed.
- **Room for real content** — leave space for a realistic name, a few lines of bio, and the badges.
  Don't design around one specific animal's text length.
- **Works across sizes** — it'll be refit to square, story, and print; check it doesn't fall apart.
- **Tasteful type & contrast** — use the curated fonts; keep text readable on its background.
- **Honest, useful metadata** — pick the right **category** (dog / cat / general / event) and
  **mood** tags so others can find it.

### What gets rejected

- Broken or unreadable layouts, or near-duplicates of an existing template
- Another organization's branding, logos, watermarks, or copyrighted artwork
- A specific animal's details baked into the design
- Offensive, off-topic, or non-family-friendly content
- Anything that bakes in personal contact info (contact comes from each user's profile)

Keep it warm, simple, and reusable — the kind of flyer you'd be glad to grab when you've got fifteen
minutes and a dog that needs a home tonight.

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
