import { useState } from 'react'

// A progressively-disclosed control group. Header toggles the body open/closed via a
// grid-template-rows transition (0fr → 1fr) — animates smoothly without animating height.
export default function Collapsible({ title, glyph, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition hover:bg-sunken"
      >
        <span className="flex items-center gap-2.5">
          {glyph && (
            <span aria-hidden className="text-[17px] opacity-80">
              {glyph}
            </span>
          )}
          <span className="font-display text-[16px] font-semibold text-ink">
            {title}
          </span>
        </span>
        <Chevron open={open} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out-quint"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3.5 px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </section>
  )
}

function Chevron({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={'shrink-0 text-ink-faint transition-transform duration-300 ease-out-quint ' + (open ? 'rotate-180' : '')}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
