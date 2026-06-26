import { FONTS } from '../../lib/fonts.js'
import { useEditor } from '../../state/EditorContext.jsx'

const ELEMENT_LABELS = {
  name: 'the name',
  meta: 'the details line',
  bio: 'the description',
}

const CATEGORY_LABELS = {
  sans: 'Clean & simple',
  rounded: 'Soft & rounded',
  serif: 'Classic',
  display: 'Bold headline',
  hand: 'Handwritten',
}

const CATEGORY_ORDER = ['rounded', 'sans', 'serif', 'display', 'hand']

// Curated flyer fonts. Applies to the whole flyer by default; with a text element selected
// on the canvas, applies to just that element (with a one-tap reset to the overall font).
export default function FontPicker() {
  const { fonts, setGlobalFont, selectedId, fontFor, setElementFont, doc } = useEditor()

  const selectedEl = doc.elements.find(
    (e) => e.id === selectedId && (e.type === 'text' || e.type === 'metaText')
  )
  const scoped = Boolean(selectedEl)
  const current = scoped
    ? fonts.perElement[selectedEl.id] ?? selectedEl.fontFamily ?? fonts.global
    : fonts.global
  const overridden = scoped && Boolean(fonts.perElement[selectedEl.id])

  const apply = (family) =>
    scoped ? setElementFont(selectedEl.id, family) : setGlobalFont(family)

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-soft">
          {scoped ? (
            <>
              Font for <span className="font-semibold text-ink">{ELEMENT_LABELS[selectedEl.id] || 'this text'}</span>
            </>
          ) : (
            <>Overall flyer font</>
          )}
        </p>
        {scoped && overridden && (
          <button
            type="button"
            onClick={() => setElementFont(selectedEl.id, null)}
            className="text-[13px] font-semibold text-primary-press hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto pr-1">
        {CATEGORY_ORDER.map((cat) => {
          const items = FONTS.filter((f) => f.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} className="mb-2">
              <p className="px-1 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid gap-1.5">
                {items.map((f) => {
                  const active = f.family === current
                  return (
                    <button
                      key={f.family}
                      type="button"
                      onClick={() => apply(f.family)}
                      className={
                        'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ' +
                        (active
                          ? 'border-primary bg-primary-soft'
                          : 'border-border bg-surface hover:bg-sunken')
                      }
                    >
                      <span
                        className="text-[18px] text-ink"
                        style={{ fontFamily: `'${f.family}', sans-serif` }}
                      >
                        {f.family}
                      </span>
                      {active && <Check />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-primary-press">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
