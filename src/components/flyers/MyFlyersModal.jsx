import { useCallback, useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { useEditor } from '../../state/EditorContext.jsx'
import { OUTPUT_SIZES } from '../../lib/outputSizes.js'
import { listFlyers, getFlyer, deleteFlyer, fetchFlyerPhotoBlob } from '../../lib/flyersApi.js'
import { loadImageSrc, blobToDataURL } from '../../lib/image.js'

// "My flyers" gallery (M7b). Self-contained: fetches the user's saved flyers on open, loads one
// back into the editor (rebuilding the photo from its R2 bytes), or deletes one. Scoped server-side
// to the signed-in user. `onLoaded` lets the parent react (e.g. switch to the Edit view).
export default function MyFlyersModal({ open, onClose, onLoaded }) {
  const { loadFlyer } = useEditor()
  const [state, setState] = useState('loading') // loading | ready | error
  const [flyers, setFlyers] = useState([])
  const [busyId, setBusyId] = useState(null) // id being loaded or deleted
  const [confirmId, setConfirmId] = useState(null) // id pending delete confirm
  const [error, setError] = useState(null)

  const fetchList = useCallback(async () => {
    setState('loading')
    const r = await listFlyers()
    if (r.ok) {
      setFlyers(r.flyers || [])
      setState('ready')
    } else {
      setError(r.error || 'Could not load your flyers.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (open) {
      setConfirmId(null)
      setBusyId(null)
      fetchList()
    }
  }, [open, fetchList])

  const load = async (id) => {
    setBusyId(id)
    setError(null)
    const r = await getFlyer(id)
    if (!r.ok || !r.flyer?.flyer_data) {
      setError(r.error || 'Could not open that flyer.')
      setBusyId(null)
      return
    }
    const snap = r.flyer.flyer_data
    let photoState = null
    if (snap.photo?.hasBytes) {
      try {
        const blob = await fetchFlyerPhotoBlob(id)
        if (blob) {
          const src = await blobToDataURL(blob)
          const loaded = await loadImageSrc(src)
          photoState = {
            ...loaded,
            scale: snap.photo.scale ?? 1,
            offsetX: snap.photo.offsetX ?? 0,
            offsetY: snap.photo.offsetY ?? 0,
          }
        }
      } catch {
        // Photo failed to restore — load the rest; the user can re-add the photo.
        photoState = null
      }
    }
    loadFlyer(snap, photoState)
    setBusyId(null)
    onLoaded?.()
    onClose()
  }

  const remove = async (id) => {
    setBusyId(id)
    const r = await deleteFlyer(id)
    setBusyId(null)
    setConfirmId(null)
    if (r.ok) {
      setFlyers((list) => list.filter((f) => f.id !== id))
    } else {
      setError(r.error || 'Could not delete that flyer.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="My flyers">
      {state === 'loading' && <p className="py-6 text-center text-[14px] text-ink-soft">Loading…</p>}

      {state === 'error' && (
        <div className="py-6 text-center">
          <p className="text-[14px] text-red-500">{error}</p>
          <button
            type="button"
            onClick={fetchList}
            className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-sunken"
          >
            Try again
          </button>
        </div>
      )}

      {state === 'ready' && flyers.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-3xl" aria-hidden>🐾</p>
          <p className="mt-2 text-[14px] font-semibold text-ink">No saved flyers yet</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            Make a flyer, then hit <strong>Save</strong> to keep it here.
          </p>
        </div>
      )}

      {state === 'ready' && flyers.length > 0 && (
        <>
          {error && <p className="mb-3 text-[12px] text-red-500">{error}</p>}
          <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
            {flyers.map((f) => (
              <li key={f.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="grid aspect-square place-items-center overflow-hidden bg-sunken">
                  {f.has_thumbnail ? (
                    <img
                      src={`/api/me/flyers/${f.id}/thumb`}
                      alt={f.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden className="text-3xl opacity-40">🖼️</span>
                  )}
                </div>
                <div className="grid gap-2 p-2.5">
                  <div className="grid">
                    <span className="truncate text-[13px] font-semibold text-ink" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {OUTPUT_SIZES[f.output_size]?.label ?? f.output_size}
                    </span>
                  </div>

                  {confirmId === f.id ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => remove(f.id)}
                        disabled={busyId === f.id}
                        className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 text-[12px] font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                      >
                        {busyId === f.id ? 'Deleting…' : 'Delete'}
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
                        onClick={() => load(f.id)}
                        disabled={busyId === f.id}
                        className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-[12px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-60"
                      >
                        {busyId === f.id ? 'Opening…' : 'Open'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(f.id)}
                        aria-label={`Delete ${f.name}`}
                        className="grid place-items-center rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:bg-sunken hover:text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
