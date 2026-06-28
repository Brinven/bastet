// Color themes — one "Theme" drives BOTH the flyer and the app UI.
//
// • FLYER: each preset carries a `flyer` map of semantic color ROLES (bg/ink/accent/band…).
//   Templates reference roles via the sentinel string `role:<name>` (see resolveColor); literal
//   hex/rgba/gradients pass through untouched, so structurally-fixed colors (Spotlight's white
//   overlay, the urgent red banner, the photo scrim) are never themed. The active palette is
//   EDITOR STATE (like fonts) — it persists across template switches and saves with a flyer.
//
// • APP UI: each preset carries `app` = a HUE DELTA + CHROMA SCALE applied to the OKLCH design
//   tokens in index.css via the `--brand-hd` / `--brand-c` custom properties. OKLCH keeps
//   lightness fixed, so rotating hue preserves contrast in BOTH light and dark mode for free.
//   `Warm` (delta 0, chroma 1) reproduces the original look exactly.

export const DEFAULT_PRESET_ID = 'warm'

// role:<name> sentinel → palette color. Anything else (hex, rgba, gradient) returns unchanged.
export function resolveColor(value, palette) {
  if (typeof value === 'string' && value.startsWith('role:')) {
    const role = value.slice(5)
    return (palette && palette[role]) || DEFAULT_PALETTE[role] || '#000000'
  }
  return value
}

export const PRESETS = [
  {
    id: 'warm',
    label: 'Warm',
    app: { hueDelta: 0, chroma: 1 },
    flyer: {
      bg: '#faf5ec', ink: '#2b211a', inkSoft: '#6f6357', body: '#4a4038',
      accent: '#b3531a', tagBg: '#e8a33d', onTag: '#2b211a',
      chipBg: '#fdf0d8', chipBorder: '#f0d49a', onChip: '#7a5a1e',
      feeBg: '#2b211a', onFee: '#faf5ec', bandBg: '#2b211a', onBand: '#ffe6bf',
      placeholder: '#b6ab95',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    app: { hueDelta: -60, chroma: 1 },
    flyer: {
      bg: '#fdf1f2', ink: '#341c22', inkSoft: '#785560', body: '#4c2f36',
      accent: '#c33b56', tagBg: '#f07d92', onTag: '#341c22',
      chipBg: '#fde2e7', chipBorder: '#f5c3cd', onChip: '#9c3148',
      feeBg: '#341c22', onFee: '#fdf1f2', bandBg: '#341c22', onBand: '#ffdbe2',
      placeholder: '#c6a9b0',
    },
  },
  {
    id: 'berry',
    label: 'Berry',
    app: { hueDelta: 255, chroma: 1 },
    flyer: {
      bg: '#fbf0f7', ink: '#311d2c', inkSoft: '#74526a', body: '#472f41',
      accent: '#b23a82', tagBg: '#db6bae', onTag: '#311d2c',
      chipBg: '#f9e0f0', chipBorder: '#efbfdd', onChip: '#8d2f68',
      feeBg: '#311d2c', onFee: '#fbf0f7', bandBg: '#311d2c', onBand: '#ffddf2',
      placeholder: '#bfa1b7',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    app: { hueDelta: 175, chroma: 1 },
    flyer: {
      bg: '#eef3fb', ink: '#16263b', inkSoft: '#51647b', body: '#2c3d52',
      accent: '#2170b5', tagBg: '#6fb1e6', onTag: '#11263a',
      chipBg: '#dfecfa', chipBorder: '#bcd6f1', onChip: '#1d5a93',
      feeBg: '#16263b', onFee: '#eef3fb', bandBg: '#16263b', onBand: '#d7e8fb',
      placeholder: '#a7b4c4',
    },
  },
  {
    id: 'teal',
    label: 'Teal',
    app: { hueDelta: 125, chroma: 1 },
    flyer: {
      bg: '#ecf6f6', ink: '#10302f', inkSoft: '#4d6e6c', body: '#244745',
      accent: '#128a86', tagBg: '#4fc0ba', onTag: '#0c2b2a',
      chipBg: '#d6f0ee', chipBorder: '#b0e0db', onChip: '#11716d',
      feeBg: '#10302f', onFee: '#ecf6f6', bandBg: '#10302f', onBand: '#d2efec',
      placeholder: '#9fb8b6',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    app: { hueDelta: 75, chroma: 1 },
    flyer: {
      bg: '#eef6ef', ink: '#18301f', inkSoft: '#566e5b', body: '#2c4633',
      accent: '#2f8a4e', tagBg: '#6fc187', onTag: '#142b1b',
      chipBg: '#ddf0e1', chipBorder: '#bce0c4', onChip: '#2a6e44',
      feeBg: '#18301f', onFee: '#eef6f0', bandBg: '#18301f', onBand: '#d8efdd',
      placeholder: '#a8bcab',
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    app: { hueDelta: 180, chroma: 0.28 },
    flyer: {
      bg: '#f2f4f6', ink: '#1f2630', inkSoft: '#5c6675', body: '#333b47',
      accent: '#4a5568', tagBg: '#8a94a6', onTag: '#1b212b',
      chipBg: '#e4e8ee', chipBorder: '#cbd2dc', onChip: '#444e5e',
      feeBg: '#1f2630', onFee: '#f2f4f6', bandBg: '#1f2630', onBand: '#dce1e8',
      placeholder: '#aab2bd',
    },
  },
]

export const DEFAULT_PALETTE = PRESETS[0].flyer

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0]
}

// Resolve the editor's palette state `{ id, accent? }` into a full role→color map.
// A custom `accent` overrides just the accent-pop role (display names / hairlines).
export function resolvePalette(paletteState) {
  const base = getPreset(paletteState?.id).flyer
  if (paletteState?.accent) return { ...base, accent: paletteState.accent }
  return base
}

// ── App UI theme (CSS custom properties) ───────────────────────────────────────────────────
const STORAGE_KEY = 'bastet-theme'

// Apply a preset's hue rotation + chroma scale to the document root. A custom accent nudges the
// app hue toward that color (best-effort: derived from the hex), keeping app + flyer in sync.
export function applyAppTheme(presetId, accentHex) {
  if (typeof document === 'undefined') return
  const preset = getPreset(presetId)
  let { hueDelta, chroma } = preset.app
  if (accentHex) {
    const h = hueOfHex(accentHex)
    if (h != null) {
      hueDelta = h - 75 // base brand hue ≈ 75
      chroma = 1
    }
  }
  const root = document.documentElement
  root.style.setProperty('--brand-hd', String(hueDelta))
  root.style.setProperty('--brand-c', String(chroma))
}

export function persistThemeId(presetId) {
  try { localStorage.setItem(STORAGE_KEY, presetId) } catch { /* private mode */ }
}

export function getStoredThemeId() {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_PRESET_ID } catch { return DEFAULT_PRESET_ID }
}

// Apply the stored app theme on boot (call before first paint to avoid a flash).
export function initAppTheme() {
  applyAppTheme(getStoredThemeId())
}

// Approximate OKLCH-ish hue (degrees) of a hex color, for syncing the app to a custom accent.
function hueOfHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  if (d === 0) return 75 // gray → keep brand hue
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  // sRGB hue → rough OKLCH hue alignment (OKLCH oranges sit ~70–90 vs sRGB ~30–40).
  return (h + 38) % 360
}
