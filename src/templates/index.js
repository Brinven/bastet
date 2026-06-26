import { FIELDS } from '../lib/fieldBindings.js'
import { getDefaultFlyer } from '../lib/defaultFlyer.js'

// Bundled templates. Each is a flyer document (elements authored in OUTPUT/1080-space) plus
// listing metadata. This is the same shape the community library (M8) stores as template_data.
// NOTE: the CLAUDE.md illustrative template JSON used raw Konva primitives; the real format
// uses higher-level field-bound element types (photo/text/metaText/badges/fee/tag/contact/rect)
// so the "fill a few fields → flyer" model works. Bundled here in repo, never fetched from D1.

const NAME_PH = 'Biscuit'
const META_PH = 'Spaniel mix  ·  2 yrs  ·  Female'
const BIO_PH = 'A gentle, people-loving sweetheart who loves leash walks and sunny windowsill naps.'
const META_PARTS = [FIELDS.BREED, FIELDS.AGE, FIELDS.GENDER, FIELDS.WEIGHT]
const BADGE_ITEMS = [
  FIELDS.GOOD_WITH_KIDS, FIELDS.GOOD_WITH_DOGS, FIELDS.GOOD_WITH_CATS,
  FIELDS.GOOD_WITH_OTHER, FIELDS.SPAYED_NEUTERED,
]

const photo = (x, y, width, height, radius = 28) => ({
  id: 'photo', type: 'photo', fieldBinding: FIELDS.ANIMAL_PHOTO, x, y, width, height, radius,
})
const tag = (x, y) => ({ id: 'status_tag', type: 'tag', fieldBinding: FIELDS.FOSTER_VS_ADOPT, x, y })
const name = (o) => ({
  id: 'name', type: 'text', fieldBinding: FIELDS.ANIMAL_NAME, role: 'display',
  placeholder: NAME_PH, fontWeight: 800, fill: '#2b211a', ...o,
})
const meta = (o) => ({
  id: 'meta', type: 'metaText', parts: META_PARTS, separator: '  ·  ',
  placeholder: META_PH, fontSize: 30, fill: '#6f6357', ...o,
})
const bio = (o) => ({
  id: 'bio', type: 'text', fieldBinding: FIELDS.BIO, placeholder: BIO_PH,
  fontSize: 29, lineHeight: 1.32, fill: '#4a4038', ...o,
})
const badges = (o) => ({ id: 'badges', type: 'badges', items: BADGE_ITEMS, ...o })
// Custom-field lane (M5): renders user text fields; invisible until used. `fill` = value color,
// `labelFill` = label color, tuned per template background.
const custom = (o) => ({ id: 'custom', type: 'custom', ...o })
const fee = (o) => ({ id: 'fee', type: 'fee', align: 'right', ...o })
const contact = (o) => ({
  id: 'contact', type: 'contact', fieldBinding: FIELDS.CONTACT_BLOCK,
  band: '#e8a33d', fill: '#2b211a', ...o,
})
const rect = (o) => ({ type: 'rect', ...o })
const label = (o) => ({ type: 'text', ...o }) // expects staticText

// 1 — Calm Cream (general · calm/minimal). The default editor layout.
const calmCream = {
  id: 'calm-cream',
  name: 'Calm Cream',
  category: 'general',
  moodTags: ['calm', 'minimal'],
  document: getDefaultFlyer('instagram_post'),
}

// 2 — Sunny Day (dog · cheerful). Rounder photo, warm rounded type, dark contact band.
const sunnyDay = {
  id: 'sunny-day',
  name: 'Sunny Day',
  category: 'dog',
  moodTags: ['cheerful'],
  document: {
    outputSize: 'instagram_post', width: 1080, height: 1080, background: '#fff4dd',
    elements: [
      photo(64, 72, 952, 476, 46),
      tag(96, 500),
      name({ x: 64, y: 584, width: 820, fontSize: 96, fill: '#b3531a', fontFamily: 'Fredoka' }),
      fee({ x: 720, y: 608, width: 296 }),
      meta({ x: 66, y: 702, width: 948, fill: '#8a6d4a' }),
      bio({ x: 66, y: 756, width: 948, fill: '#5b4a39' }),
      custom({ x: 66, y: 846, width: 948, fill: '#5b4a39', labelFill: '#9a7b50' }),
      badges({ x: 66, y: 896, width: 948 }),
      contact({ x: 0, y: 988, width: 1080, height: 92, band: '#2b211a', fill: '#ffe6bf' }),
    ],
  },
}

// 3 — Needs a Home (general · urgent). Bold red banner, condensed display face.
const urgent = {
  id: 'urgent',
  name: 'Needs a Home',
  category: 'general',
  moodTags: ['urgent'],
  document: {
    outputSize: 'instagram_post', width: 1080, height: 1080, background: '#fdeee6',
    elements: [
      rect({ id: 'banner', x: 0, y: 0, width: 1080, height: 104, fill: '#d6442a' }),
      label({
        id: 'banner_label', x: 0, y: 28, width: 1080, align: 'center',
        staticText: 'PLEASE HELP · NEEDS A HOME', fontFamily: 'Anton', fontSize: 46, fill: '#fff3ee',
      }),
      photo(64, 144, 952, 436, 22),
      tag(92, 532),
      name({ x: 64, y: 614, width: 700, fontSize: 96, fill: '#b3231a', fontFamily: 'Anton' }),
      fee({ x: 720, y: 630, width: 296 }),
      meta({ x: 66, y: 728, width: 948, fill: '#7a4a3f' }),
      bio({ x: 66, y: 780, width: 948, fontSize: 28, fill: '#5b3a32' }),
      custom({ x: 66, y: 858, width: 948, fill: '#5b3a32', labelFill: '#94584d' }),
      badges({ x: 66, y: 906, width: 948 }),
      contact({ x: 0, y: 988, width: 1080, height: 92, band: '#2b211a', fill: '#ffe1d6' }),
    ],
  },
}

// 4 — Quiet Elegance (cat · elegant). Serif name, gold hairline, refined dark band, no playful tag.
const elegant = {
  id: 'quiet-elegance',
  name: 'Quiet Elegance',
  category: 'cat',
  moodTags: ['elegant', 'calm'],
  document: {
    outputSize: 'instagram_post', width: 1080, height: 1080, background: '#f2efe8',
    elements: [
      photo(72, 72, 936, 466, 12),
      name({ x: 72, y: 576, width: 700, fontSize: 86, fontWeight: 700, fill: '#2c2925', fontFamily: 'Playfair Display' }),
      fee({ x: 740, y: 592, width: 936 - 740 + 72 }),
      rect({ id: 'hairline', x: 74, y: 694, width: 132, height: 4, fill: '#bfa45e' }),
      meta({ x: 74, y: 720, width: 940, fontSize: 30, fill: '#6b6358' }),
      bio({ x: 74, y: 774, width: 940, fill: '#4d473e', lineHeight: 1.34 }),
      custom({ x: 74, y: 864, width: 940, fill: '#4d473e', labelFill: '#897f6f' }),
      badges({ x: 74, y: 914, width: 940 }),
      contact({ x: 0, y: 992, width: 1080, height: 88, band: '#2c2925', fill: '#efe7d4' }),
    ],
  },
}

// 5 — Bold Story (general · cheerful). Instagram Story (portrait) — big top photo, content below.
const boldStory = {
  id: 'bold-story',
  name: 'Bold Story',
  category: 'general',
  moodTags: ['cheerful'],
  document: {
    outputSize: 'instagram_story', width: 1080, height: 1920, background: '#fff4dd',
    elements: [
      photo(0, 0, 1080, 1200, 0),
      tag(60, 1104),
      name({ x: 72, y: 1244, width: 940, fontSize: 124, fill: '#b3531a', fontFamily: 'Fredoka' }),
      fee({ x: 700, y: 1276, width: 320 }),
      meta({ x: 74, y: 1392, width: 940, fontSize: 40, fill: '#7a5a3a' }),
      bio({ x: 74, y: 1456, width: 940, fontSize: 38, fill: '#5b4a39' }),
      custom({ x: 74, y: 1572, width: 940, fill: '#5b4a39', labelFill: '#8a6a45' }),
      badges({ x: 74, y: 1626, width: 940 }),
      contact({ x: 0, y: 1804, width: 1080, height: 116, band: '#2b211a', fill: '#ffe6bf' }),
    ],
  },
}

// 6 — Spotlight (general · minimal/elegant). Full-bleed photo, bottom scrim, white overlay text.
const spotlight = {
  id: 'spotlight',
  name: 'Spotlight',
  category: 'general',
  moodTags: ['minimal', 'elegant'],
  document: {
    outputSize: 'instagram_post', width: 1080, height: 1080, background: '#221a14',
    elements: [
      photo(0, 0, 1080, 1080, 0),
      rect({
        id: 'scrim', x: 0, y: 476, width: 1080, height: 604,
        gradient: { stops: [0, 'rgba(20,14,10,0)', 0.5, 'rgba(20,14,10,0.72)', 1, 'rgba(20,14,10,0.94)'] },
      }),
      tag(72, 690),
      name({ x: 72, y: 772, width: 940, fontSize: 116, fontWeight: 400, fill: '#ffffff', fontFamily: 'Bebas Neue' }),
      meta({ x: 76, y: 892, width: 940, fontSize: 34, fill: '#f1e7d8' }),
      custom({ x: 76, y: 936, width: 940, fill: '#f1e7d8', labelFill: '#cdbfa8' }),
      contact({ x: 0, y: 992, width: 1080, height: 86, band: null, fill: '#f6efe3', padX: 76 }),
    ],
  },
}

export const TEMPLATES = [calmCream, sunnyDay, urgent, elegant, boldStory, spotlight]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null
}
