import { FIELDS } from './fieldBindings.js'
import { OUTPUT_SIZES } from './outputSizes.js'

// A built-in flyer document, authored in OUTPUT (1080-based) coordinates — the same
// element shape M3 templates will produce. Used as the starting layout before the user
// picks a template. Element `type`s map to renderers in EditorCanvas.
//
// Text elements carry a `placeholder` so a first-run flyer reads as a teaching example
// (faint sample text) rather than a blank rectangle.

const PAPER = '#faf5ec'
const INK = '#2b211a'
const INK_SOFT = '#6f6357'
const INK_BODY = '#4a4038'
const BAND = '#e8a33d' // marigold footer band (matches brand gold)
const ON_BAND = '#2b211a'

// Square (Instagram Post) — the default canvas for M2.
function squareFlyer() {
  const { width, height } = OUTPUT_SIZES.instagram_post // 1080 x 1080
  return {
    outputSize: 'instagram_post',
    width,
    height,
    background: PAPER,
    elements: [
      {
        id: 'photo',
        type: 'photo',
        fieldBinding: FIELDS.ANIMAL_PHOTO,
        x: 64, y: 64, width: 952, height: 520, radius: 30,
      },
      {
        id: 'status_tag',
        type: 'tag',
        fieldBinding: FIELDS.FOSTER_VS_ADOPT,
        x: 88, y: 528, // overlaps lower-left of the photo
      },
      {
        id: 'name',
        type: 'text',
        fieldBinding: FIELDS.ANIMAL_NAME,
        role: 'display',
        x: 64, y: 612, width: 632,
        fontSize: 92, fontWeight: 800, fill: INK,
        placeholder: 'Biscuit',
      },
      {
        id: 'fee',
        type: 'fee',
        x: 720, y: 632, width: 296,
        align: 'right',
      },
      {
        id: 'meta',
        type: 'metaText',
        parts: [FIELDS.BREED, FIELDS.AGE, FIELDS.GENDER, FIELDS.WEIGHT],
        x: 66, y: 730, width: 948,
        fontSize: 30, fill: INK_SOFT, separator: '  ·  ',
        placeholder: 'Spaniel mix  ·  2 yrs  ·  Female',
      },
      {
        id: 'bio',
        type: 'text',
        fieldBinding: FIELDS.BIO,
        x: 66, y: 784, width: 948,
        fontSize: 29, lineHeight: 1.32, fill: INK_BODY,
        placeholder:
          'A gentle, people-loving sweetheart who loves leash walks and sunny windowsill naps.',
      },
      {
        id: 'badges',
        type: 'badges',
        x: 66, y: 884, width: 948,
        items: [
          FIELDS.GOOD_WITH_KIDS,
          FIELDS.GOOD_WITH_DOGS,
          FIELDS.GOOD_WITH_CATS,
          FIELDS.GOOD_WITH_OTHER,
          FIELDS.SPAYED_NEUTERED,
        ],
      },
      {
        id: 'contact',
        type: 'contact',
        fieldBinding: FIELDS.CONTACT_BLOCK,
        x: 0, y: 984, width: 1080, height: 96,
        band: BAND, fill: ON_BAND,
      },
    ],
  }
}

export function getDefaultFlyer(outputSize = 'instagram_post') {
  // M2 ships the square layout; other sizes arrive with templates (M3) + the size picker (M4).
  return squareFlyer()
}

// Friendly labels for the control panel, plus short labels for on-flyer chips.
export const BADGE_META = {
  [FIELDS.GOOD_WITH_KIDS]:  { label: 'Good with kids',  short: 'Kids',  glyph: '🧒' },
  [FIELDS.GOOD_WITH_DOGS]:  { label: 'Good with dogs',  short: 'Dogs',  glyph: '🐕' },
  [FIELDS.GOOD_WITH_CATS]:  { label: 'Good with cats',  short: 'Cats',  glyph: '🐈' },
  [FIELDS.GOOD_WITH_OTHER]: { label: 'Good with other animals', short: 'Other animals', glyph: '🐾' },
  [FIELDS.SPAYED_NEUTERED]: { label: 'Spayed / neutered', short: 'Spayed / neutered', glyph: '✓' },
}
