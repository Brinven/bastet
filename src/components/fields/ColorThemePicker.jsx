import { useEditor } from '../../state/EditorContext.jsx'
import { PRESETS, getPreset, applyAppTheme, persistThemeId } from '../../lib/themes.js'

// Color theme control: a row of one-tap preset swatches + an optional custom accent. Picking a
// preset retones BOTH the flyer (editor palette state) and the app UI (applyAppTheme → CSS hue),
// and persists the app choice. A custom accent overrides the flyer's accent-pop and nudges the
// app hue to match (in-session; it saves with the flyer).
export default function ColorThemePicker() {
  const { palette, setPaletteId, setCustomAccent } = useEditor()

  const pickPreset = (id) => {
    setCustomAccent(null)
    setPaletteId(id)
    applyAppTheme(id)
    persistThemeId(id)
  }
  const pickAccent = (hex) => {
    setCustomAccent(hex)
    applyAppTheme(palette.id, hex)
  }
  const clearAccent = () => {
    setCustomAccent(null)
    applyAppTheme(palette.id)
  }

  const accentValue = palette.accent || getPreset(palette.id).flyer.accent

  return (
    <div className="grid gap-3.5">
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink-soft">Color theme</div>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((p) => {
            const active = !palette.accent && palette.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPreset(p.id)}
                aria-pressed={active}
                title={p.label}
                className={
                  'relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface transition ' +
                  (active ? 'ring-ink' : 'ring-transparent hover:ring-border-strong')
                }
                style={{ background: p.flyer.bg }}
              >
                <span className="absolute inset-[7px] rounded-full" style={{ background: p.flyer.accent }} />
                <span className="sr-only">{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-ink-soft">
          Custom accent{palette.accent && <span className="ml-1 font-normal text-ink-faint">(on)</span>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Custom accent color"
            value={accentValue}
            onChange={(e) => pickAccent(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded-md border border-border bg-surface p-0.5"
          />
          {palette.accent && (
            <button
              type="button"
              onClick={clearAccent}
              className="text-[12px] font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
