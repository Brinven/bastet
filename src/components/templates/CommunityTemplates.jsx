import { useEffect, useState } from 'react'
import { useEditor } from '../../state/EditorContext.jsx'

// Approved community templates from the Worker (GET /api/templates). Empty until rescues start
// submitting (M8) and an admin approves them — so the common case here is a warm empty state.
export default function CommunityTemplates({ onApplied }) {
  const { loadTemplate } = useEditor()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [items, setItems] = useState([])

  useEffect(() => {
    let alive = true
    fetch('/api/templates')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && (setItems(d.templates || []), setStatus('ready')))
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [])

  const apply = async (id) => {
    try {
      const r = await fetch(`/api/templates/${id}`)
      const d = await r.json()
      if (d?.template_data?.elements) {
        loadTemplate({ id: `community-${id}`, document: d.template_data })
        onApplied?.()
      }
    } catch {
      /* ignore — the editor keeps its current flyer */
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[15px] font-semibold text-ink">From the community</h3>
        {status === 'ready' && items.length > 0 && (
          <span className="text-[12px] text-ink-faint">{items.length} shared</span>
        )}
      </div>

      {status === 'loading' && <p className="text-[13px] text-ink-faint">Loading…</p>}

      {status === 'error' && (
        <p className="text-[13px] text-ink-faint">Couldn’t reach the community library right now.</p>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-strong bg-sunken px-4 py-6 text-center">
          <p className="text-2xl" aria-hidden>🌱</p>
          <p className="mt-1 text-[14px] font-semibold text-ink">No community templates yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            Rescues will be able to share their best flyers here soon.
          </p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="grid gap-2">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => apply(t.id)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition hover:bg-sunken"
            >
              <span className="grid">
                <span className="text-[14px] font-semibold text-ink">{t.name}</span>
                <span className="text-[12px] text-ink-faint">
                  {[t.rescue_name, t.author_display].filter(Boolean).join(' · ') || 'Community'}
                </span>
              </span>
              <span className="text-[13px] font-semibold text-primary-press">Use</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
