import { EditorProvider } from '../../state/EditorContext.jsx'
import EditorCanvas from '../editor/EditorCanvas.jsx'
import { FIELDS } from '../../lib/fieldBindings.js'

// Representative content so previews read as finished flyers (no faint placeholders).
const SAMPLE_SEED = {
  fields: {
    [FIELDS.ANIMAL_NAME]: 'Biscuit',
    [FIELDS.BIO]: 'A gentle, people-loving sweetheart who loves leash walks and sunny naps.',
    [FIELDS.BREED]: 'Spaniel mix',
    [FIELDS.AGE]: '2 yrs',
    [FIELDS.GENDER]: 'Female',
    [FIELDS.WEIGHT]: '',
    [FIELDS.ADOPTION_FEE]: '$95',
    [FIELDS.RESCUE_NAME]: 'Happy Tails Rescue',
    [FIELDS.RESCUE_PHONE]: '(555) 123-4567',
    [FIELDS.RESCUE_WEBSITE]: 'happytails.org',
  },
  badges: {
    [FIELDS.GOOD_WITH_KIDS]: true,
    [FIELDS.GOOD_WITH_DOGS]: true,
    [FIELDS.GOOD_WITH_CATS]: false,
    [FIELDS.GOOD_WITH_OTHER]: false,
    [FIELDS.SPAYED_NEUTERED]: true,
  },
  fosterVsAdopt: 'adopt',
  feeMode: 'fee',
  photo: null,
  fonts: { global: 'Poppins', perElement: {} },
}

// A read-only thumbnail of a template, rendered with the SAME element renderers as the editor
// (via a seeded, non-interactive EditorProvider) so previews always match reality. Letterboxed
// within a fixed box so cards stay uniform across differing flyer aspect ratios.
export default function TemplatePreview({ template, boxW = 152, boxH = 192 }) {
  const d = template.document
  const aspect = d.width / d.height
  const w = Math.min(boxW, boxH * aspect)
  return (
    <div className="flex items-center justify-center" style={{ width: boxW, height: boxH }}>
      <EditorProvider initialDoc={d} seed={SAMPLE_SEED} interactive={false}>
        <EditorCanvas interactive={false} fixedWidth={w} />
      </EditorProvider>
    </div>
  )
}
