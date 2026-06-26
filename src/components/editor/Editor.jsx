import { useEffect, useRef, useState } from 'react'
import { useEditor } from '../../state/EditorContext.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import { useFonts } from '../../hooks/useFonts.js'
import { loadImageFile, isLowRes } from '../../lib/image.js'
import { exportToPNG, exportToPDF } from '../../lib/export.js'
import TopBar from '../TopBar.jsx'
import EditorCanvas from './EditorCanvas.jsx'
import ControlPanel from '../fields/ControlPanel.jsx'
import TemplateGallery from '../templates/TemplateGallery.jsx'

// Fill contact fields from the signed-in rescue profile once per login (empties only).
function ProfileAutofill() {
  const { user } = useAuth()
  const { applyProfile } = useEditor()
  const appliedFor = useRef(null)
  useEffect(() => {
    if (user && appliedFor.current !== user.id) {
      applyProfile(user)
      appliedFor.current = user.id
    } else if (!user) {
      appliedFor.current = null
    }
  }, [user, applyProfile])
  return null
}

export default function Editor() {
  useFonts() // load the curated flyer fonts + track readiness for export
  const { doc, fields, loadPhoto, clearPhoto } = useEditor()
  const stageRef = useRef(null)
  const fileInputRef = useRef(null)
  const [lowRes, setLowRes] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [tab, setTab] = useState('edit') // 'edit' | 'templates'

  const openDialog = () => fileInputRef.current?.click()

  const handleFile = async (file) => {
    try {
      const loaded = await loadImageFile(file)
      loadPhoto(loaded)
      setLowRes(isLowRes(loaded.naturalWidth, loaded.naturalHeight))
    } catch {
      // Unsupported/corrupt file — keep the previous photo, do nothing destructive.
    }
  }

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // allow re-picking the same file
  }

  const remove = () => {
    clearPhoto()
    setLowRes(false)
  }

  const handleDownload = async (format = 'png') => {
    if (!stageRef.current) return
    setDownloading(true)
    try {
      const base =
        (fields.animal_name || 'bastet-flyer').trim().replace(/\s+/g, '-').toLowerCase() ||
        'bastet-flyer'
      if (format === 'pdf') {
        const pdf = await exportToPDF(stageRef, doc.outputSize)
        pdf.save(`${base}.pdf`)
      } else {
        const dataURL = await exportToPNG(stageRef, doc.outputSize)
        const a = document.createElement('a')
        a.href = dataURL
        a.download = `${base}.png`
        a.click()
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink lg:h-screen lg:overflow-hidden">
      <ProfileAutofill />
      <TopBar onDownload={handleDownload} downloading={downloading} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />

      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        {/* Canvas — the hero */}
        <section className="flex h-[48vh] items-center justify-center bg-gradient-to-b from-transparent to-black/[0.02] p-4 lg:h-auto lg:min-h-0 lg:flex-1 lg:p-8 dark:to-white/[0.02]">
          <div className="h-full w-full animate-pop-in">
            <EditorCanvas stageRef={stageRef} onRequestPhoto={openDialog} />
          </div>
        </section>

        {/* Controls */}
        <aside className="w-full shrink-0 border-t border-border bg-bg p-4 lg:w-[388px] lg:border-l lg:border-t-0 lg:overflow-y-auto lg:p-5">
          <div className="mb-4 flex rounded-xl border border-border bg-sunken p-1">
            {[
              { id: 'templates', label: 'Templates', glyph: '🎨' },
              { id: 'edit', label: 'Edit', glyph: '✏️' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ' +
                  (tab === t.id ? 'bg-surface text-ink shadow-panel' : 'text-ink-soft hover:text-ink')
                }
              >
                <span aria-hidden>{t.glyph}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="animate-rise-in" key={tab}>
            {tab === 'templates' ? (
              <TemplateGallery onApplied={() => setTab('edit')} />
            ) : (
              <ControlPanel photo={{ openDialog, handleFile, remove, lowRes }} />
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
