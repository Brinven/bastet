import { useEffect, useRef, useState } from 'react'

// Lightweight popover menu (not a modal). Closes on outside click or Escape.
// `children` is a render-prop receiving a `close` fn.
export default function Menu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={
            'absolute top-[calc(100%+8px)] z-30 min-w-[200px] origin-top animate-pop-in rounded-2xl border border-border bg-surface p-1.5 shadow-lift ' +
            (align === 'right' ? 'right-0' : 'left-0')
          }
          role="menu"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
