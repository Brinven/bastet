import { useEditor } from '../../state/EditorContext.jsx'
import { Switch } from '../ui/Controls.jsx'

// M5 — Tier-1 custom fields. Add/rename/reorder/remove your own Text or Badge fields.
// Text fields render in a labeled block on the flyer; badges join the "good with" pill row.
// Values live in the editor's `fields`/`badges` maps (keyed by the field's custom_<uuid> id).
export default function CustomFields() {
  const {
    customFields, addCustomField, removeCustomField, renameCustomField, moveCustomField,
    fields, setField, badges, toggleBadge,
  } = useEditor()

  return (
    <div className="grid gap-3">
      {customFields.length === 0 && (
        <p className="text-[13px] leading-relaxed text-ink-faint">
          Add a field the built-ins don’t cover — a microchip number, an adoption-event date,
          a “hypoallergenic” tag. Text fields show in a labeled list on the flyer; badges join the
          “good with” pills.
        </p>
      )}

      {customFields.map((def, i) => (
        <CustomFieldCard
          key={def.id}
          def={def}
          index={i}
          count={customFields.length}
          value={def.type === 'badge' ? !!badges[def.id] : fields[def.id] || ''}
          onLabel={(v) => renameCustomField(def.id, v)}
          onValue={(v) => (def.type === 'badge' ? toggleBadge(def.id) : setField(def.id, v))}
          onMove={(dir) => moveCustomField(def.id, dir)}
          onRemove={() => removeCustomField(def.id)}
        />
      ))}

      <div className="flex gap-2">
        <AddButton glyph="🔤" label="Text field" onClick={() => addCustomField('text')} />
        <AddButton glyph="⭐" label="Badge" onClick={() => addCustomField('badge')} />
      </div>
    </div>
  )
}

function CustomFieldCard({ def, index, count, value, onLabel, onValue, onMove, onRemove }) {
  const isBadge = def.type === 'badge'
  return (
    <section className="grid gap-2.5 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-md bg-sunken px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          {isBadge ? 'Badge' : 'Text'}
        </span>
        <input
          value={def.label}
          onChange={(e) => onLabel(e.target.value)}
          placeholder={isBadge ? 'Badge name' : 'Field name'}
          aria-label="Field name"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg px-2.5 text-[14px] font-semibold text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]"
        />
        <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove('up')}>↑</IconBtn>
        <IconBtn label="Move down" disabled={index === count - 1} onClick={() => onMove('down')}>↓</IconBtn>
        <IconBtn label="Remove field" danger onClick={onRemove}>✕</IconBtn>
      </div>

      {isBadge ? (
        <Switch label="Show on flyer" glyph={def.glyph} checked={value} onChange={onValue} />
      ) : (
        <input
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder="Value (shown on the flyer)"
          aria-label={`${def.label || 'Custom field'} value`}
          className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-[15px] text-ink placeholder:text-ink-faint outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]"
        />
      )}
    </section>
  )
}

function IconBtn({ children, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={
        'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-[14px] transition ' +
        'disabled:cursor-not-allowed disabled:opacity-30 ' +
        (danger
          ? 'text-ink-faint hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
          : 'text-ink-soft hover:border-border-strong hover:bg-sunken')
      }
    >
      {children}
    </button>
  )
}

function AddButton({ glyph, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong bg-surface px-3 py-2.5 text-[14px] font-semibold text-ink-soft transition hover:border-primary hover:bg-sunken hover:text-ink"
    >
      <span aria-hidden>{glyph}</span>
      <span>{label}</span>
    </button>
  )
}
