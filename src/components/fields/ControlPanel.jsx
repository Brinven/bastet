import { useEditor } from '../../state/EditorContext.jsx'
import { FIELDS } from '../../lib/fieldBindings.js'
import { BADGE_META } from '../../lib/defaultFlyer.js'
import { Field, TextArea, Switch, Segmented } from '../ui/Controls.jsx'
import Collapsible from '../ui/Collapsible.jsx'
import PhotoControl from './PhotoControl.jsx'
import FontPicker from './FontPicker.jsx'
import CustomFields from './CustomFields.jsx'

const BADGE_ORDER = [
  FIELDS.GOOD_WITH_KIDS,
  FIELDS.GOOD_WITH_DOGS,
  FIELDS.GOOD_WITH_CATS,
  FIELDS.GOOD_WITH_OTHER,
  FIELDS.SPAYED_NEUTERED,
]

export default function ControlPanel({ photo }) {
  const {
    fields, setField, badges, toggleBadge,
    fosterVsAdopt, setFosterVsAdopt, feeMode, setFeeMode,
  } = useEditor()

  return (
    <div className="grid gap-3">
      <StaticGroup title="Photo" glyph="📷">
        <PhotoControl
          onAddPhoto={photo.openDialog}
          onFile={photo.handleFile}
          onRemove={photo.remove}
          lowRes={photo.lowRes}
        />
      </StaticGroup>

      <StaticGroup title="The basics" glyph="✏️">
        <Field
          label="Animal's name"
          value={fields[FIELDS.ANIMAL_NAME]}
          onChange={(v) => setField(FIELDS.ANIMAL_NAME, v)}
          placeholder="Biscuit"
        />
        <TextArea
          label="A little about them"
          value={fields[FIELDS.BIO]}
          onChange={(v) => setField(FIELDS.BIO, v)}
          placeholder="Gentle, people-loving, and great on a leash…"
          rows={3}
        />
      </StaticGroup>

      <Collapsible title="Details" glyph="🐶">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Breed" value={fields[FIELDS.BREED]} onChange={(v) => setField(FIELDS.BREED, v)} placeholder="Spaniel mix" />
          <Field label="Age" value={fields[FIELDS.AGE]} onChange={(v) => setField(FIELDS.AGE, v)} placeholder="2 years" />
          <Field label="Gender" value={fields[FIELDS.GENDER]} onChange={(v) => setField(FIELDS.GENDER, v)} placeholder="Female" />
          <Field label="Weight" value={fields[FIELDS.WEIGHT]} onChange={(v) => setField(FIELDS.WEIGHT, v)} placeholder="45 lbs" />
        </div>
      </Collapsible>

      <Collapsible title="Good with" glyph="💛">
        <div className="grid gap-1">
          {BADGE_ORDER.map((b) => (
            <Switch
              key={b}
              label={BADGE_META[b].label}
              glyph={BADGE_META[b].glyph}
              checked={badges[b]}
              onChange={() => toggleBadge(b)}
            />
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Status" glyph="🏠">
        <Segmented
          label="Looking for"
          value={fosterVsAdopt}
          onChange={setFosterVsAdopt}
          options={[
            { value: 'adopt', label: 'Adoption' },
            { value: 'foster', label: 'Foster' },
          ]}
        />
        <Segmented
          label="Adoption fee"
          value={feeMode}
          onChange={setFeeMode}
          options={[
            { value: 'fee', label: 'Has a fee' },
            { value: 'sponsored', label: 'Sponsored!' },
          ]}
        />
        {feeMode === 'fee' && (
          <Field
            label="Fee amount"
            value={fields[FIELDS.ADOPTION_FEE]}
            onChange={(v) => setField(FIELDS.ADOPTION_FEE, v)}
            placeholder="$250"
            inputMode="numeric"
          />
        )}
      </Collapsible>

      <Collapsible title="Contact" glyph="📞">
        <Field label="Rescue name" value={fields[FIELDS.RESCUE_NAME]} onChange={(v) => setField(FIELDS.RESCUE_NAME, v)} placeholder="Happy Tails Rescue" />
        <Field label="Phone" value={fields[FIELDS.RESCUE_PHONE]} onChange={(v) => setField(FIELDS.RESCUE_PHONE, v)} placeholder="(555) 123-4567" inputMode="tel" />
        <Field label="Website" value={fields[FIELDS.RESCUE_WEBSITE]} onChange={(v) => setField(FIELDS.RESCUE_WEBSITE, v)} placeholder="happytails.org" />
      </Collapsible>

      <Collapsible title="Your own fields" glyph="🏷️">
        <CustomFields />
      </Collapsible>

      <Collapsible title="Style" glyph="🎨">
        <FontPicker />
      </Collapsible>
    </div>
  )
}

// Always-visible group (no collapse) for the core fields.
function StaticGroup({ title, glyph, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-panel">
      <header className="flex items-center gap-2.5 px-4 pb-1 pt-3.5">
        {glyph && <span aria-hidden className="text-[17px] opacity-80">{glyph}</span>}
        <h2 className="font-display text-[16px] font-semibold text-ink">{title}</h2>
      </header>
      <div className="grid gap-3.5 px-4 pb-4 pt-2">{children}</div>
    </section>
  )
}
