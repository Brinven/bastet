# Bastet — Color Themes (presets + custom accent; recolors flyer AND app)

User decisions (2026-06-28): **presets + optional custom accent**; recolor **both the flyer and the
app UI**. Goal: kill the "everything is brown" feeling — one tap retones the whole thing, stays
readable, can't be made ugly. This is the PRD's post-MVP "color theme picker".

## The two color systems (today)
- **App UI:** OKLCH CSS vars in `src/index.css` (light+dark via prefers-color-scheme), mapped to
  Tailwind tokens in `tailwind.config.js`. Warm hue ~75–82 baked into every token.
- **Flyer:** NO abstraction. Every template (`src/templates/index.js`) + the default
  (`src/lib/defaultFlyer.js`) hardcode warm hex per element; renderers also hardcode fallbacks
  (badge chips, fee pill, status tag, placeholder). Refit passes colors through untouched. Export
  reads the live Konva stage (so whatever the renderers draw IS the export).

## Design — one "Theme", two resolvers
A **theme/palette** drives both. A preset = `{ id, label, brandH, flyer:{roles…} }`:
- `brandH` → the **app** hue (CSS var rotation).
- `flyer` → an authored **role→hex** map for the flyer (hand-tuned per preset for contrast).
- **Custom accent:** a color input → sets flyer `accent` to the exact color + app hue to that color's hue.

### A. App UI theming (hue rotation, preserves the OKLCH tuning)
- Refactor `src/index.css`: every accent + neutral-tint OKLCH value's HUE becomes
  `calc(var(--brand-h) + Δ)` where Δ = (its current hue − 75). Default `--brand-h: 75` reproduces
  today's warm look EXACTLY. `--success` stays fixed green (not themed).
- `src/lib/themes.js` (new): preset list + a tiny `ThemeProvider`/hook that sets `--brand-h` on
  `document.documentElement`, persisted in `localStorage('bastet-theme')`, applied on boot (no flash).
- Light + dark keep their own lightness/chroma; only hue shifts → contrast stays correct in both.

### B. Flyer theming (semantic color roles)
- `src/lib/palette.js` (new): role set = `{ bg, ink, inkSoft, accent, onAccent, bandBg, onBand,
  chipBg, chipBorder, onChip, labelMuted }` + `resolveColor(value, palette)` (a `role:'accent'`
  ref → palette color; a literal hex passes through unchanged).
- `doc.palette` lives on the flyer document (default = Warm) → serializes with save/template/community
  + survives refit + exports for free (renderers draw resolved colors onto the stage).
- Refactor the 6 templates + default to tag their MAIN colors with roles (bg/accent/ink/inkSoft/band/
  onBand). **Leave structurally-fixed colors literal** (Spotlight white overlay text, urgent banner
  red, scrim gradient, photo placeholder) — themes don't touch those (keeps each template's character).
- Renderers (`EditorCanvas`, `FlyerText`, `BadgeLayer` chips/fee/tag, `ContactBlock`, `FlyerCustom`)
  resolve element colors through `doc.palette`; route their hardcoded chip/tag/fee fallbacks to roles.

### Presets (v1) — authored flyer palettes + brandH
Warm (default · 75) · Rose (15) · Berry (340) · Ocean (245) · Teal (195) · Forest (150).
(Hue-family themes; a neutral/gray "Slate" needs a chroma knob — defer unless wanted.)

### UI
- A **Colors** control in the editor (near size/font): a row of preset swatches + a custom-accent
  picker. Picking a preset sets app theme + current flyer palette together. Custom accent overrides.
- App theme persists (global preference); a loaded saved flyer restores ITS palette to the flyer
  without hijacking the app theme.

## Build order — ✅ DONE (2026-06-28)
1. [x] `src/lib/themes.js` — roles + resolveColor + resolvePalette + 7 PRESETS (flyer maps + app
       hueDelta/chroma) + applyAppTheme/initAppTheme/persist (folded palette+themes into one file)
2. [x] app hue boot — `initAppTheme()` in main.jsx (before paint)
3. [x] `src/index.css` — hues → `calc(BASE + var(--brand-hd))`, chroma → `calc(C * var(--brand-c))`
       (defaults 0/1 = identical Warm); --success stays green
4. [x] defaultFlyer.js + templates/index.js — main colors tagged `role:*`; structural colors
       (Spotlight overlay, urgent red banner #d6442a, scrim) left literal
5. [x] Renderers (EditorCanvas/FlyerText/BadgeLayer/ContactBlock/FlyerCustom/FlyerPhoto) — resolve
       via `resolvedPalette` from useEditor; chip/tag/fee/placeholder routed to roles
6. [x] EditorContext — `palette` state `{id,accent}` + `resolvedPalette` + setPaletteId/setCustomAccent;
       threaded through loadFlyer/applyUserTemplate + the 3 save snapshots (Editor.jsx)
7. [x] UI: `ColorThemePicker` (7 swatches + custom accent) in the Style panel; app retones globally
8. [x] Verified (Playwright): all 7 presets recolor flyer+app in light AND dark; placeholder themed;
       gallery intact; **export pixel-exact** (canvas band RGB == palette bandBg per theme); build clean
9. [ ] Update handoff + memory; commit + redeploy

## As-built notes
- Palette is EDITOR STATE (not on the doc), parallel to `fonts`. Old saved flyers (literal hex,
  pre-feature) render unchanged (resolveColor passes literals through) — back-compat for free.
- Per-template fine text shades were unified to roles (small look change in Warm; intended).
- The urgent template's red banner stays red in every theme (urgency convention).
- App theme persists (localStorage); a loaded flyer restores ITS palette without hijacking the app theme.

## Separate quick task (DONE)
axly.com `index.html`: Bastet link added to nav + mobile menu + footer Products (G:\AxlyGitHub\
axlyapps\axly-site — separate GitHub Pages repo; user commits/pushes that repo to publish).
