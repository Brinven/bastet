import { useState } from 'react'
import { useEditor } from '../../state/EditorContext.jsx'

// Photo upload + reframe controls. Upload/replace/remove + a zoom slider; the actual
// pan happens by dragging the photo on the canvas (this just hints at it).
export default function PhotoControl({ onAddPhoto, onFile, onRemove, lowRes }) {
  const { photo, setPhotoTransform } = useEditor()
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  if (!photo) {
    return (
      <button
        type="button"
        onClick={onAddPhoto}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={
          'flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ' +
          (dragOver
            ? 'border-primary bg-primary-soft'
            : 'border-border-strong bg-sunken hover:border-primary hover:bg-primary-soft')
        }
      >
        <span aria-hidden className="text-4xl">🐾</span>
        <span className="font-display text-[16px] font-semibold text-ink">Add a photo</span>
        <span className="text-[13px] text-ink-faint">Tap to choose, or drop a JPG/PNG here</span>
      </button>
    )
  }

  return (
    <div className="grid gap-3.5">
      <div className="flex items-center gap-3">
        <img
          src={photo.src}
          alt="Selected animal"
          className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-border"
        />
        <div className="flex flex-1 gap-2">
          <button
            type="button"
            onClick={onAddPhoto}
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[14px] font-semibold text-ink transition hover:bg-sunken"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-[14px] font-semibold text-ink-soft transition hover:bg-sunken hover:text-ink"
          >
            Remove
          </button>
        </div>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold tracking-tight text-ink-soft">Zoom</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={photo.scale ?? 1}
          onChange={(e) => setPhotoTransform({ scale: parseFloat(e.target.value) })}
          className="bastet-range"
        />
      </label>

      <p className="text-[13px] text-ink-faint">
        Drag the photo on the canvas to reposition — we never auto-crop.
      </p>

      {lowRes && (
        <div className="rounded-xl bg-secondary-soft px-3.5 py-2.5 text-[13px] text-ink">
          <span className="mr-1" aria-hidden>💡</span>
          This photo is a little small — it may look soft if you print a large flyer. It’ll look
          great on social posts.
        </div>
      )}
    </div>
  )
}
