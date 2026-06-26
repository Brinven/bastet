# Design Brief — Bastet Canvas Editor (M2)

Source of design context: `.impeccable.md`. Governing rule: **dead simple, <3 min, first use.**

## 1. Feature Summary
The editor is Bastet's whole product: one screen where a rushed, non-technical rescue
volunteer turns a phone photo + a few facts into a share-ready adoption flyer. M2 builds the
editor *core* (canvas + fields + photo reframe + fonts + badges); the template picker (M3) and
size-picker/export (M4) slot into the same shell.

## 2. Primary User Action
**Get an animal's photo and name onto a good-looking flyer, fast.** Everything else (bio,
badges, contact, fonts) is secondary and must never get in the way of that core path.

## 3. Design Direction
Bright, warm, hopeful, with a subtle Bastet gold nod (see `.impeccable.md`). The chrome
recedes; **the flyer canvas is the hero** with light and space. Gabarito (display/wordmark) +
Hanken Grotesk (UI). Match-device light/dark. Lively-but-not-bouncy motion; warm, encouraging
microcopy.

## 4. Layout Strategy
**Mobile-first, single column:**
- **Top bar** (compact, sticky): cat-glyph + "Bastet" wordmark · output-size chip · **Download** (primary).
- **Canvas** directly below, fit to viewport width, on a warm surface with a soft shadow — the focal point. A real-aspect frame for the chosen output size.
- **Control panel** scrolls beneath the canvas, organized as progressively-disclosed groups:
  1. **Photo** (upload → reframe) — first, because it's the hero input.
  2. **The basics** — Animal Name (required, prominent), Bio. Always open.
  3. **Details** (collapsible) — Breed, Age, Gender, Weight.
  4. **Good with** (collapsible) — Kids / Dogs / Cats / Other toggles; Spayed-Neutered.
  5. **Status** (collapsible) — Adoption fee *or* "Sponsored!"; Foster vs Adopt.
  6. **Contact** (collapsible) — Rescue name / phone / website.
  7. **Style** (collapsible) — font picker (global + per-selected-element).
- A sticky bottom action bar on mobile keeps **Download** always reachable.

**Desktop (≥ lg):** canvas centered in a generous stage; the same control groups become a
right-hand scrolling panel (≈360–400px). Top bar spans full width. Asymmetric, not boxed-in.

Tapping a text element on the canvas selects it and scrolls its field into view (and editing a
field highlights its element). Selection drives the per-element font control.

## 5. Key States
- **First run / empty:** canvas shows a friendly placeholder flyer (silhouette photo frame,
  "Tap to add a photo", sample name) that teaches the layout — not a blank rectangle.
- **Photo uploading:** subtle progress shimmer in the frame.
- **Photo reframing:** the active state — drag to pan, zoom slider/pinch; a quiet "drag to
  reposition" hint that fades after first interaction. **Never auto-crops.**
- **Low-res photo:** soft, dismissible warning ("This photo may look fuzzy on a printed
  flyer") when natural resolution < 1000px on an axis — informs, never blocks.
- **Editing a field:** live canvas update; empty optional fields simply hide their element.
- **Fonts loading:** canvas text renders in the chosen font once loaded (readiness tracked so
  export is never premature).
- **Element selected:** clear but soft selection affordance on canvas + matching field focus.
- **Error (e.g. unsupported file):** inline, friendly, recoverable.

## 6. Interaction Model
- **Two-way binding:** field input ↔ Konva element via `fieldBinding` (`src/lib/fieldBindings.js`).
- **Photo:** drag-drop or tap-to-pick → image loads into a `Group` with a `clipFunc` clipped to
  the frame box; draggable + zoomable *inside* the clip (CLAUDE.md gotchas #8/#9).
- **Badges:** tap toggles on/off; "off" removes the element from the flyer entirely.
- **Fonts:** picker applies globally by default; with an element selected, applies to just that
  element. Curated ~25 from `src/lib/fonts.js`, grouped by category, each rendered in its own face.
- **Motion:** one tasteful staggered reveal on load; group expand/collapse via
  grid-template-rows; ease-out (quart/expo), respect reduced-motion. No bounce/elastic.

## 7. Content Requirements
- Encouraging, plain-language labels ("Animal's name", "A little about them", "Good with…").
- Empty-state teaching copy on the canvas, not "nothing here".
- Soft warning copy (low-res photo) — reassuring, dismissible.
- Friendly error copy for bad uploads.
- Primary action labeled **Download** (not "Export") — non-technical-friendly.

## 8. Recommended impeccable references for the craft build
- `interaction-design.md` — form-heavy panel, focus, progressive disclosure, optimistic updates.
- `spatial-design.md` — canvas-hero + panel composition, rhythm, mobile→desktop.
- `responsive-design.md` — mobile-first, container queries for the panel, touch targets.
- `motion-design.md` — the load reveal, group expand/collapse, reduced-motion.

## 9. Open Questions (resolve during build)
- Control panel on desktop: right side (recommended) vs left. → default right.
- Per-element font selection in M2, or global-only for v1 and per-element later? → ship both;
  per-element is cheap once selection exists.
- Canvas↔field tap-to-select: full two-way in M2, or one-way (field→canvas) first? → start
  one-way, add canvas→field selection if it doesn't threaten the 3-minute path.
