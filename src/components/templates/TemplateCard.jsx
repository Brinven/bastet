import TemplatePreview from './TemplatePreview.jsx'

const MOOD_LABELS = {
  calm: 'Calm', minimal: 'Minimal', cheerful: 'Cheerful',
  urgent: 'Urgent', elegant: 'Elegant',
}

export default function TemplateCard({ template, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={
        'group flex flex-col items-center gap-2.5 rounded-2xl border p-3 text-center transition ' +
        (active
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-surface hover:border-border-strong hover:bg-sunken')
      }
    >
      <div className="rounded-lg p-1 transition ease-out-quint group-hover:-translate-y-0.5">
        <TemplatePreview template={template} />
      </div>
      <div className="grid gap-0.5">
        <span className="font-display text-[14px] font-semibold leading-tight text-ink">
          {template.name}
        </span>
        <span className="text-[11px] text-ink-faint">
          {template.moodTags.map((m) => MOOD_LABELS[m] || m).join(' · ')}
        </span>
      </div>
    </button>
  )
}
