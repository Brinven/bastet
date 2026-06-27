import { useEffect, useRef, useState } from 'react'
import { useEditor } from '../../state/EditorContext.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import { useFonts } from '../../hooks/useFonts.js'
import { loadImageFile, isLowRes, loadImageSrc, blobToDataURL } from '../../lib/image.js'
import { exportToPNG, exportToPDF, exportThumbnailBlob } from '../../lib/export.js'
import { saveFlyer } from '../../lib/flyersApi.js'
import { saveUserTemplate } from '../../lib/userTemplatesApi.js'
import { submitTemplate } from '../../lib/communityApi.js'
import TopBar from '../TopBar.jsx'
import EditorCanvas from './EditorCanvas.jsx'
import ControlPanel from '../fields/ControlPanel.jsx'
import TemplateGallery from '../templates/TemplateGallery.jsx'
import SaveFlyerModal from '../flyers/SaveFlyerModal.jsx'
import SaveTemplateModal from '../templates/SaveTemplateModal.jsx'
import ShareTemplateModal from '../templates/ShareTemplateModal.jsx'

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

// Tier 2 custom-field definitions ↔ rescue profile (M7c). Load the saved defs once per login (only
// if the volunteer hasn't already made some this session), and persist defs back to the profile
// when they EDIT them in the panel (debounced; gated on the rev counter so loading a flyer/template
// never overwrites their saved defaults).
function CustomFieldsSync() {
  const { user, updateProfile } = useAuth()
  const { customFields, customFieldsRev, setCustomFieldsFromProfile } = useEditor()
  const loadedFor = useRef(null)
  const savedRev = useRef(0)

  useEffect(() => {
    if (user && loadedFor.current !== user.id) {
      loadedFor.current = user.id
      savedRev.current = customFieldsRev // baseline: the load below is programmatic (no rev bump)
      if (user.custom_fields?.length && customFields.length === 0) {
        setCustomFieldsFromProfile(user.custom_fields)
      }
    } else if (!user) {
      loadedFor.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setCustomFieldsFromProfile])

  useEffect(() => {
    if (!user) return
    if (customFieldsRev === savedRev.current) return
    const t = setTimeout(() => {
      savedRev.current = customFieldsRev
      updateProfile({ custom_fields: customFields })
    }, 800)
    return () => clearTimeout(t)
  }, [user, customFields, customFieldsRev, updateProfile])

  return null
}

// Load the signed-in rescue's logo into editor state so it renders on the flyer (M7 follow-up).
// Fetched as a data URL (same-origin → no canvas taint on export). Re-runs when the logo is
// replaced (logoVersion) and clears on sign-out / when no logo is set.
function LogoSync() {
  const { user, logoVersion } = useAuth()
  const { setLogo } = useEditor()
  useEffect(() => {
    let alive = true
    if (!user?.has_logo) {
      setLogo(null)
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/me/logo', { credentials: 'include' })
        if (!res.ok) throw new Error('no logo')
        const src = await blobToDataURL(await res.blob())
        const loaded = await loadImageSrc(src)
        if (alive) setLogo(loaded)
      } catch {
        if (alive) setLogo(null)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, logoVersion, setLogo])
  return null
}

export default function Editor() {
  useFonts() // load the curated flyer fonts + track readiness for export
  const editor = useEditor()
  const {
    doc, nativeDoc, templateId, fields, badges, customFields, fosterVsAdopt, feeMode, fonts, photo,
    loadPhoto, clearPhoto,
  } = editor
  const stageRef = useRef(null)
  const fileInputRef = useRef(null)
  const [lowRes, setLowRes] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
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

  // Capture the full editor state + a thumbnail + the original photo bytes, then save to the
  // account (M7b). Photo bytes go to R2 (via the Worker) so a later load round-trips exactly.
  const handleSaveFlyer = async (name) => {
    if (!stageRef.current) return { ok: false, error: 'Canvas not ready.' }
    const snapshot = {
      version: 1,
      templateId,
      nativeDoc,
      outputSize: doc.outputSize,
      fields,
      badges,
      customFields,
      fosterVsAdopt,
      feeMode,
      fonts,
      photo: photo
        ? {
            naturalWidth: photo.naturalWidth,
            naturalHeight: photo.naturalHeight,
            scale: photo.scale ?? 1,
            offsetX: photo.offsetX ?? 0,
            offsetY: photo.offsetY ?? 0,
            hasBytes: true,
          }
        : null,
    }
    const thumbBlob = await exportThumbnailBlob(stageRef, doc.outputSize)
    const photoBlob = photo?.src ? await (await fetch(photo.src)).blob() : null
    return await saveFlyer({ name, outputSize: doc.outputSize, snapshot, thumbBlob, photoBlob })
  }

  // Save the LAYOUT only (look + custom-field lanes) as a reusable private template (M7c) — no
  // animal content, no photo bytes. Thumbnail captures the current canvas as a preview.
  const handleSaveTemplate = async (name) => {
    if (!stageRef.current) return { ok: false, error: 'Canvas not ready.' }
    const snapshot = {
      version: 1,
      templateId,
      nativeDoc,
      outputSize: doc.outputSize,
      fonts,
      customFields,
    }
    const thumbBlob = await exportThumbnailBlob(stageRef, doc.outputSize)
    return await saveUserTemplate({ name, snapshot, thumbBlob })
  }

  // Share the current layout with the community library (M8). Same layout snapshot as a private
  // template, plus the metadata from the form. Lands as pending review; only the rescue name is
  // attached server-side (never the email).
  const handleShareTemplate = async ({ name, description, category, moodTags }) => {
    if (!stageRef.current) return { ok: false, error: 'Canvas not ready.' }
    const snapshot = {
      version: 1,
      templateId,
      nativeDoc,
      outputSize: doc.outputSize,
      fonts,
      customFields,
    }
    const thumbBlob = await exportThumbnailBlob(stageRef, doc.outputSize)
    return await submitTemplate({ name, description, category, moodTags, snapshot, thumbBlob })
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
      <CustomFieldsSync />
      <LogoSync />
      <TopBar
        onDownload={handleDownload}
        downloading={downloading}
        onSaveFlyer={() => setSaveOpen(true)}
        onSaveTemplate={() => setSaveTemplateOpen(true)}
        onShareTemplate={() => setShareOpen(true)}
      />

      <SaveFlyerModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        defaultName={fields.animal_name ? `${fields.animal_name} — flyer` : 'Untitled Flyer'}
        onSave={handleSaveFlyer}
      />

      <SaveTemplateModal
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        defaultName="My template"
        onSave={handleSaveTemplate}
      />

      <ShareTemplateModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        defaultName=""
        onSave={handleShareTemplate}
      />

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
