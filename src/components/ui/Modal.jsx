import { useEffect } from 'react'

// Centered overlay dialog. Closes on Escape or backdrop click. `open` gates rendering.
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md animate-pop-in rounded-3xl border border-border bg-surface p-5 shadow-lift">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-[18px] font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-sunken"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
