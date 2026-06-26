// Curated Google Fonts for Bastet — a rescue-appropriate subset, NOT the full
// 1,500 (CLAUDE.md). Mix of friendly sans, warm serif, and a few display faces.
// `weights` feeds the Google Fonts CSS2 request and the picker UI.

export const FONTS = [
  // Friendly / rounded sans — the default voice of most rescue flyers
  { family: 'Inter',            category: 'sans',    weights: [400, 600, 700, 800] },
  { family: 'Poppins',          category: 'sans',    weights: [400, 500, 600, 700, 800] },
  { family: 'Nunito',           category: 'sans',    weights: [400, 600, 700, 800] },
  { family: 'Quicksand',        category: 'sans',    weights: [400, 500, 600, 700] },
  { family: 'Montserrat',       category: 'sans',    weights: [400, 600, 700, 800] },
  { family: 'Work Sans',        category: 'sans',    weights: [400, 500, 600, 700] },
  { family: 'Rubik',            category: 'sans',    weights: [400, 500, 600, 700] },
  { family: 'Lato',             category: 'sans',    weights: [400, 700, 900] },
  { family: 'Mulish',           category: 'sans',    weights: [400, 600, 700, 800] },
  { family: 'Fredoka',          category: 'rounded', weights: [400, 500, 600, 700] },
  { family: 'Baloo 2',          category: 'rounded', weights: [400, 500, 600, 700] },
  { family: 'Comfortaa',        category: 'rounded', weights: [400, 500, 600, 700] },

  // Warm / elegant serif — for "elegant" and "calm" moods
  { family: 'Playfair Display', category: 'serif',   weights: [400, 600, 700, 800] },
  { family: 'Merriweather',     category: 'serif',   weights: [400, 700, 900] },
  { family: 'Lora',             category: 'serif',   weights: [400, 500, 600, 700] },
  { family: 'Bitter',           category: 'serif',   weights: [400, 600, 700] },
  { family: 'DM Serif Display', category: 'serif',   weights: [400] },

  // Display / hand — for "urgent" and "cheerful" headline accents
  { family: 'Bebas Neue',       category: 'display', weights: [400] },
  { family: 'Anton',            category: 'display', weights: [400] },
  { family: 'Pacifico',         category: 'hand',    weights: [400] },
  { family: 'Lobster',          category: 'hand',    weights: [400] },
  { family: 'Caveat',           category: 'hand',    weights: [400, 600, 700] },
  { family: 'Patrick Hand',     category: 'hand',    weights: [400] },
  { family: 'Amatic SC',        category: 'hand',    weights: [400, 700] },
  { family: 'Permanent Marker', category: 'hand',    weights: [400] },
]

export const DEFAULT_FONT = 'Inter'

// Build the single Google Fonts CSS2 URL covering every curated family/weight.
export function googleFontsHref() {
  const families = FONTS.map((f) => {
    const fam = f.family.replace(/ /g, '+')
    const wghts = [...f.weights].sort((a, b) => a - b).join(';')
    return `family=${fam}:wght@${wghts}`
  }).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

// Inject the stylesheet once (idempotent). Returns the <link> element.
export function loadFontStylesheet(doc = document) {
  const id = 'bastet-google-fonts'
  let link = doc.getElementById(id)
  if (link) return link

  // Preconnect for faster first paint of fonts.
  for (const [href, crossorigin] of [
    ['https://fonts.googleapis.com', false],
    ['https://fonts.gstatic.com', true],
  ]) {
    const pre = doc.createElement('link')
    pre.rel = 'preconnect'
    pre.href = href
    if (crossorigin) pre.crossOrigin = 'anonymous'
    doc.head.appendChild(pre)
  }

  link = doc.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = googleFontsHref()
  doc.head.appendChild(link)
  return link
}
