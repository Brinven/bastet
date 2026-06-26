// Small, warm, accessible form primitives shared across the control panel.

const inputBase =
  'w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-faint outline-none transition ' +
  'focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]'

export function Field({ label, value, onChange, placeholder, hint, type = 'text', inputMode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-semibold tracking-tight text-ink-soft">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputBase} h-11`}
      />
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-semibold tracking-tight text-ink-soft">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${inputBase} resize-none py-2.5 leading-relaxed`}
      />
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}

// A pill switch. Track turns marigold when on; thumb slides with eased motion.
export function Switch({ label, glyph, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-sunken"
    >
      <span
        className={
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ' +
          (checked ? 'bg-primary' : 'bg-border-strong')
        }
      >
        <span
          className={
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-quint ' +
            (checked ? 'translate-x-6' : 'translate-x-1')
          }
        />
      </span>
      <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
        {glyph && <span aria-hidden className="text-base">{glyph}</span>}
        {label}
      </span>
    </button>
  )
}

// Segmented control for small, mutually-exclusive choices.
export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="grid gap-1.5">
      {label && (
        <span className="text-[13px] font-semibold tracking-tight text-ink-soft">{label}</span>
      )}
      <div className="inline-flex rounded-xl border border-border bg-sunken p-1">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={
                'flex-1 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition ' +
                (active
                  ? 'bg-surface text-ink shadow-panel'
                  : 'text-ink-soft hover:text-ink')
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
