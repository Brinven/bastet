import { useEffect, useState } from 'react'
import { useEditor } from '../../state/EditorContext.jsx'

// Approved community templates from the Worker (GET /api/templates). Empty until rescues submit
// (M8) and an admin approves them — so the common case here is a warm empty state.
export default function CommunityTemplates({ onApplied }) {
  const { applyUserTemplate } = useEditor()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [items, setItems] = useState([])
  const [busyId, setBusyId] = useState(null)

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
    setBusyId(id)
    try {
      const r = await fetch(`/api/templates/${id}`)
      const d = await r.json()
      const td = d?.template_data
      // Accept the layout-snapshot shape ({nativeDoc,...}) and a legacy raw document ({elements}).
      const snap = td?.nativeDoc
        ? td
        : td?.elements
          ? { nativeDoc: td, outputSize: td.outputSize }
          : null
      if (snap) {
        applyUserTemplate(snap)
        onApplied?.()
      }
    } catch {
      /* ignore — the editor keeps its current flyer */
    } finally {
      setBusyId(null)
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
            Rescues can share their best flyers here — try <strong>Save → Share with community</strong>.
          </p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => apply(t.id)}
                disabled={busyId === t.id}
                className="block w-full"
                aria-label={`Use ${t.name}`}
              >
                <span className="grid aspect-square place-items-center overflow-hidden bg-sunken">
                  {t.has_thumbnail ? (
                    <img
                      src={`/api/templates/${t.id}/thumb`}
                      alt={t.name}
                      className="h-full w-full object-contain transition hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden className="text-3xl opacity-40">🎨</span>
                  )}
                </span>
              </button>
              <div className="grid gap-1.5 p-2.5">
                <span className="truncate text-[13px] font-semibold text-ink" title={t.name}>
                  {t.name}
                </span>
                <span className="truncate text-[11px] text-ink-faint">
                  {[t.rescue_name, t.author_display].filter(Boolean)[0] || 'Community'}
                </span>
                <button
                  type="button"
                  onClick={() => apply(t.id)}
                  disabled={busyId === t.id}
                  className="mt-0.5 rounded-lg bg-primary px-2 py-1.5 text-[12px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {busyId === t.id ? 'Applying…' : 'Use'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
