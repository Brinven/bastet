import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'
import { useEditor } from '../../state/EditorContext.jsx'
import { listUserTemplates, getUserTemplate, deleteUserTemplate } from '../../lib/userTemplatesApi.js'

// "Your templates" — a signed-in rescue's saved layouts (M7c), shown atop the Templates tab.
// Apply swaps the look + custom-field lanes while keeping the current animal's content. Renders
// nothing for signed-out users; a subtle hint when signed in with none yet.
export default function UserTemplates({ onApplied }) {
  const { user } = useAuth()
  const { applyUserTemplate } = useEditor()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [items, setItems] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const fetchList = useCallback(async () => {
    setStatus('loading')
    const r = await listUserTemplates()
    if (r.ok) {
      setItems(r.templates || [])
      setStatus('ready')
    } else {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user) fetchList()
  }, [user, fetchList])

  if (!user) return null

  const apply = async (id) => {
    setBusyId(id)
    const r = await getUserTemplate(id)
    setBusyId(null)
    if (r.ok && r.template?.template_data) {
      applyUserTemplate(r.template.template_data)
      onApplied?.()
    }
  }

  const remove = async (id) => {
    setBusyId(id)
    const r = await deleteUserTemplate(id)
    setBusyId(null)
    setConfirmId(null)
    if (r.ok) setItems((list) => list.filter((t) => t.id !== id))
  }

  if (status === 'loading') {
    return <p className="text-[13px] text-ink-faint">Loading your templates…</p>
  }
  if (status === 'error') return null

  return (
    <section className="grid gap-3">
      <h3 className="font-display text-[15px] font-semibold text-ink">Your templates</h3>

      {items.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-ink-faint">
          Found a look you like? Hit <strong>Save → Save as template</strong> to reuse it on your next flyer.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => apply(t.id)}
                disabled={busyId === t.id}
                className="block w-full"
                aria-label={`Apply ${t.name}`}
              >
                <span className="grid aspect-square place-items-center overflow-hidden bg-sunken">
                  {t.has_thumbnail ? (
                    <img
                      src={`/api/me/templates/${t.id}/thumb`}
                      alt={t.name}
                      className="h-full w-full object-contain transition hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden className="text-3xl opacity-40">🎨</span>
                  )}
                </span>
              </button>
              <div className="grid gap-2 p-2.5">
                <span className="truncate text-[13px] font-semibold text-ink" title={t.name}>
                  {t.name}
                </span>
                {confirmId === t.id ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      disabled={busyId === t.id}
                      className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 text-[12px] font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                      {busyId === t.id ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-sunken"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => apply(t.id)}
                      disabled={busyId === t.id}
                      className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-[12px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-60"
                    >
                      {busyId === t.id ? 'Applying…' : 'Use'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(t.id)}
                      aria-label={`Delete ${t.name}`}
                      className="grid place-items-center rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:bg-sunken hover:text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
