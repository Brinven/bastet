import { useCallback, useEffect, useState } from 'react'
import { adminListPending, adminApprove, adminReject } from '../../lib/communityApi.js'

const TOKEN_KEY = 'bastet_admin_token'

// Minimal community-template approval queue (M8). Reached via the URL hash `#admin` (no router /
// SPA fallback needed). Bearer-token auth — the token is entered here and kept in localStorage;
// it is never a session and never leaves as anything but an Authorization header.
export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [authed, setAuthed] = useState(false)
  const [items, setItems] = useState([])
  const [thumbs, setThumbs] = useState({}) // id -> object URL
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadThumb = useCallback(async (id, tok) => {
    try {
      const res = await fetch(`/api/admin/templates/${id}/thumb`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) return
      const url = URL.createObjectURL(await res.blob())
      setThumbs((m) => ({ ...m, [id]: url }))
    } catch {
      /* skip thumbnail */
    }
  }, [])

  const load = useCallback(
    async (tok) => {
      setStatus('loading')
      setError(null)
      const r = await adminListPending(tok)
      if (r.ok) {
        localStorage.setItem(TOKEN_KEY, tok)
        setAuthed(true)
        setItems(r.templates || [])
        setStatus('idle')
        ;(r.templates || []).forEach((t) => t.has_thumbnail && loadThumb(t.id, tok))
      } else {
        setAuthed(false)
        setStatus('error')
        setError(r.status === 401 ? 'Wrong admin token.' : r.error || 'Could not load the queue.')
      }
    },
    [loadThumb]
  )

  // Auto-load if a token is already saved.
  useEffect(() => {
    if (token) load(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const act = async (id, kind) => {
    setBusyId(id)
    const r = kind === 'approve' ? await adminApprove(token, id) : await adminReject(token, id)
    setBusyId(null)
    if (r.ok) setItems((list) => list.filter((t) => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border px-6 py-4">
        <h1 className="font-display text-[20px] font-bold">Bastet — template review</h1>
        <p className="text-[13px] text-ink-soft">Approve or reject community submissions.</p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            load(token)
          }}
          className="mb-6 flex gap-2"
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin bearer token"
            aria-label="Admin bearer token"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-primary px-4 text-[14px] font-bold text-on-primary transition hover:bg-primary-hover"
          >
            {status === 'loading' ? 'Loading…' : 'Load queue'}
          </button>
        </form>

        {error && <p className="mb-4 text-[13px] text-red-500">{error}</p>}

        {authed && items.length === 0 && status !== 'loading' && (
          <div className="rounded-2xl border border-dashed border-border-strong bg-sunken px-4 py-10 text-center">
            <p className="text-3xl" aria-hidden>✅</p>
            <p className="mt-2 text-[14px] font-semibold">Queue is clear</p>
            <p className="mt-1 text-[13px] text-ink-faint">No templates waiting for review.</p>
          </div>
        )}

        <div className="grid gap-3">
          {items.map((t) => (
            <article key={t.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-3">
              <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-sunken">
                {thumbs[t.id] ? (
                  <img src={thumbs[t.id]} alt={t.name} className="h-full w-full object-contain" />
                ) : (
                  <span aria-hidden className="text-2xl opacity-40">🎨</span>
                )}
              </div>
              <div className="grid flex-1 content-start gap-1">
                <h2 className="text-[15px] font-bold text-ink">{t.name}</h2>
                <p className="text-[12px] text-ink-faint">
                  {[t.rescue_name, `category: ${t.category}`].filter(Boolean).join(' · ')}
                  {t.mood_tags?.length ? ` · ${t.mood_tags.join(', ')}` : ''}
                </p>
                {t.description && <p className="text-[13px] text-ink-soft">{t.description}</p>}
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(t.id, 'approve')}
                    disabled={busyId === t.id}
                    className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => act(t.id, 'reject')}
                    disabled={busyId === t.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:border-red-300 hover:text-red-500 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
