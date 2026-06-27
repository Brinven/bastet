import Logo from './Logo.jsx'
import Menu from './ui/Menu.jsx'
import AccountButton from './auth/AccountButton.jsx'
import { OUTPUT_SIZES } from '../lib/outputSizes.js'
import { useEditor } from '../state/EditorContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'

const SIZE_HINTS = {
  instagram_post: 'Square · 1080×1080',
  instagram_story: 'Tall · 1080×1920',
  facebook_post: 'Wide · 1200×630',
  print_letter: 'Letter · 300 DPI',
}

// Sticky top bar: brand (left) + output-size picker and the primary Download action (right).
// Signed-in (Tier 2) users also get a Save menu (this flyer, or its look as a template).
export default function TopBar({ onDownload, downloading, onSaveFlyer, onSaveTemplate }) {
  const { doc, outputSize, setOutputSize } = useEditor()
  const { user } = useAuth()
  const sizeLabel = OUTPUT_SIZES[doc.outputSize]?.label ?? 'Flyer'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-md lg:px-6">
      <Logo />

      <div className="flex items-center gap-2.5">
        {/* Account (Tier 2 — optional sign-in) */}
        <AccountButton />

        {/* Output size picker */}
        <Menu
          align="right"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="Output size"
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-sunken sm:px-3.5"
            >
              <span aria-hidden>📐</span>
              <span className="hidden sm:inline">{sizeLabel}</span>
              <Caret open={open} />
            </button>
          )}
        >
          {(close) => (
            <div className="grid gap-0.5">
              {Object.entries(OUTPUT_SIZES).map(([key, s]) => {
                const active = key === outputSize
                return (
                  <button
                    key={key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setOutputSize(key)
                      close()
                    }}
                    className={
                      'flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-left transition ' +
                      (active ? 'bg-primary-soft' : 'hover:bg-sunken')
                    }
                  >
                    <span className="grid">
                      <span className="text-[14px] font-semibold text-ink">{s.label}</span>
                      <span className="text-[12px] text-ink-faint">{SIZE_HINTS[key]}</span>
                    </span>
                    {active && <Dot />}
                  </button>
                )
              })}
            </div>
          )}
        </Menu>

        {/* Save (Tier 2 only) — this flyer, or its look as a reusable template */}
        {user && (
          <Menu
            align="right"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="Save"
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-sunken sm:px-3.5"
              >
                <SaveIcon />
                <span className="hidden sm:inline">Save</span>
                <Caret open={open} />
              </button>
            )}
          >
            {(close) => (
              <div className="grid gap-0.5">
                <MenuAction
                  label="Save flyer"
                  hint="This animal, to reopen later"
                  onClick={() => { onSaveFlyer(); close() }}
                />
                <MenuAction
                  label="Save as template"
                  hint="Just the look, to reuse"
                  onClick={() => { onSaveTemplate(); close() }}
                />
              </div>
            )}
          </Menu>
        )}

        {/* Download (PNG / PDF) */}
        <Menu
          align="right"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              disabled={downloading}
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[15px] font-bold text-on-primary shadow-lift transition hover:bg-primary-hover active:bg-primary-press disabled:opacity-70"
            >
              {downloading ? <Spinner /> : <DownloadIcon />}
              {downloading ? 'Preparing…' : 'Download'}
            </button>
          )}
        >
          {(close) => (
            <div className="grid gap-0.5">
              <MenuAction label="Download PNG" hint="Best for social posts" onClick={() => { onDownload('png'); close() }} />
              <MenuAction label="Download PDF" hint="Best for printing" onClick={() => { onDownload('pdf'); close() }} />
            </div>
          )}
        </Menu>
      </div>
    </header>
  )
}

function MenuAction({ label, hint, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="grid rounded-xl px-3 py-2 text-left transition hover:bg-sunken"
    >
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <span className="text-[12px] text-ink-faint">{hint}</span>
    </button>
  )
}

function Caret({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className={'transition-transform ' + (open ? 'rotate-180' : '')}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Dot() {
  return <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.4" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
