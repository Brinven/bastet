import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { getDefaultFlyer } from '../lib/defaultFlyer.js'
import { FIELDS } from '../lib/fieldBindings.js'
import { refitDocument } from '../lib/refit.js'

const EditorContext = createContext(null)

const TEXT_FIELDS = [
  FIELDS.ANIMAL_NAME, FIELDS.BIO, FIELDS.BREED, FIELDS.AGE, FIELDS.GENDER,
  FIELDS.WEIGHT, FIELDS.ADOPTION_FEE, FIELDS.RESCUE_NAME, FIELDS.RESCUE_PHONE,
  FIELDS.RESCUE_WEBSITE,
]

const BADGE_FIELDS = [
  FIELDS.GOOD_WITH_KIDS, FIELDS.GOOD_WITH_DOGS, FIELDS.GOOD_WITH_CATS,
  FIELDS.GOOD_WITH_OTHER, FIELDS.SPAYED_NEUTERED,
]

// Friendly default flyer font (warm, readable on a flyer — distinct from the UI chrome font).
const DEFAULT_FLYER_FONT = 'Poppins'

// Default chip glyph for a user-created badge field (built-in badges carry their own).
const DEFAULT_CUSTOM_GLYPH = '⭐'

function emptyRecord(keys, value) {
  return keys.reduce((acc, k) => ((acc[k] = value), acc), {})
}

// Custom-field IDs use the `custom_` prefix (PRD §7). UUID where available; the fallback keeps
// IDs unique in any non-secure context without pulling in a dependency.
function newCustomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `custom_${crypto.randomUUID()}`
  return `custom_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

// `initialDoc` — start from a specific flyer document (e.g. a template preview).
// `seed` — preset content (used by gallery previews to show a representative flyer).
// `interactive` — false for read-only previews (no select/drag/upload affordances).
export function EditorProvider({ children, initialDoc, seed, interactive = true }) {
  // The flyer is stored at its template's NATIVE size; the live `doc` is that document re-fit
  // to the currently-chosen output size (identity when they match).
  const [nativeDoc, setNativeDoc] = useState(() => initialDoc || getDefaultFlyer('instagram_post'))
  const [outputSize, setOutputSizeState] = useState(() => (initialDoc || getDefaultFlyer('instagram_post')).outputSize)
  const doc = useMemo(() => refitDocument(nativeDoc, outputSize), [nativeDoc, outputSize])
  const [fields, setFields] = useState(() => seed?.fields ?? emptyRecord(TEXT_FIELDS, ''))
  const [badges, setBadges] = useState(() => seed?.badges ?? emptyRecord(BADGE_FIELDS, false))
  const [fosterVsAdopt, setFosterVsAdopt] = useState(seed?.fosterVsAdopt ?? 'adopt')
  const [feeMode, setFeeMode] = useState(seed?.feeMode ?? 'fee')
  const [photo, setPhoto] = useState(seed?.photo ?? null)
  const [fonts, setFonts] = useState(seed?.fonts ?? { global: DEFAULT_FLYER_FONT, perElement: {} })
  // Tier-1 custom fields (M5): ordered definitions; their VALUES live in `fields`/`badges`
  // (both maps are keyed by arbitrary id, so custom_<uuid> ids slot in alongside built-ins).
  const [customFields, setCustomFields] = useState(() => seed?.customFields ?? [])
  const [selectedId, setSelectedId] = useState(null)
  const [templateId, setTemplateId] = useState('calm-cream')

  const setField = useCallback((binding, value) => {
    setFields((f) => ({ ...f, [binding]: value }))
  }, [])

  // Auto-populate contact fields from a Tier 2 rescue profile (M7). Fills ONLY empty fields —
  // never clobbers what the volunteer already typed.
  const applyProfile = useCallback((profile) => {
    if (!profile) return
    setFields((f) => ({
      ...f,
      [FIELDS.RESCUE_NAME]: f[FIELDS.RESCUE_NAME] || profile.rescue_name || '',
      [FIELDS.RESCUE_PHONE]: f[FIELDS.RESCUE_PHONE] || profile.rescue_phone || '',
      [FIELDS.RESCUE_WEBSITE]: f[FIELDS.RESCUE_WEBSITE] || profile.rescue_website || '',
    }))
  }, [])

  const toggleBadge = useCallback((binding) => {
    setBadges((b) => ({ ...b, [binding]: !b[binding] }))
  }, [])

  // ── Custom fields (M5) ───────────────────────────────────────────────────────────────────
  const addCustomField = useCallback((type = 'text', label = '') => {
    const id = newCustomId()
    const def = { id, type, label: label || (type === 'badge' ? 'New badge' : 'New field') }
    if (type === 'badge') {
      def.glyph = DEFAULT_CUSTOM_GLYPH
      setBadges((b) => ({ ...b, [id]: false }))
    } else {
      setFields((f) => ({ ...f, [id]: '' }))
    }
    setCustomFields((list) => [...list, def])
    return id
  }, [])

  const removeCustomField = useCallback((id) => {
    setCustomFields((list) => list.filter((d) => d.id !== id))
    setFields((f) => {
      if (!(id in f)) return f
      const next = { ...f }
      delete next[id]
      return next
    })
    setBadges((b) => {
      if (!(id in b)) return b
      const next = { ...b }
      delete next[id]
      return next
    })
  }, [])

  const renameCustomField = useCallback((id, label) => {
    setCustomFields((list) => list.map((d) => (d.id === id ? { ...d, label } : d)))
  }, [])

  // Reorder one step; the new order drives both the on-flyer custom block and the badge row.
  const moveCustomField = useCallback((id, dir) => {
    setCustomFields((list) => {
      const i = list.findIndex((d) => d.id === id)
      if (i < 0) return list
      const j = dir === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const loadPhoto = useCallback((next) => {
    setPhoto({ ...next, scale: 1, offsetX: 0, offsetY: 0 })
  }, [])

  const setPhotoTransform = useCallback((patch) => {
    setPhoto((p) => (p ? { ...p, ...patch } : p))
  }, [])

  const clearPhoto = useCallback(() => setPhoto(null), [])

  const setGlobalFont = useCallback((family) => {
    setFonts((s) => ({ ...s, global: family }))
  }, [])

  const setElementFont = useCallback((elementId, family) => {
    setFonts((s) => {
      const perElement = { ...s.perElement }
      if (!family) delete perElement[elementId]
      else perElement[elementId] = family
      return { ...s, perElement }
    })
  }, [])

  const fontFor = useCallback(
    (elementId) => fonts.perElement[elementId] ?? fonts.global,
    [fonts]
  )

  const select = useCallback((id) => setSelectedId(id), [])

  const setOutputSize = useCallback((size) => setOutputSizeState(size), [])

  // Swap the flyer layout while keeping the user's content. Picking a template adopts its
  // native size; drop per-element font overrides since element IDs differ across templates.
  const loadTemplate = useCallback((template) => {
    setNativeDoc(template.document)
    setOutputSizeState(template.document.outputSize)
    setTemplateId(template.id)
    setSelectedId(null)
    setFonts((s) => ({ ...s, perElement: {} }))
  }, [])

  const value = useMemo(
    () => ({
      doc, loadTemplate, templateId, interactive,
      outputSize, setOutputSize,
      fields, setField, applyProfile,
      badges, toggleBadge,
      customFields, addCustomField, removeCustomField, renameCustomField, moveCustomField,
      fosterVsAdopt, setFosterVsAdopt,
      feeMode, setFeeMode,
      photo, loadPhoto, setPhotoTransform, clearPhoto,
      fonts, setGlobalFont, setElementFont, fontFor,
      selectedId, select,
    }),
    [
      doc, loadTemplate, templateId, interactive, outputSize, setOutputSize,
      fields, setField, applyProfile, badges, toggleBadge,
      customFields, addCustomField, removeCustomField, renameCustomField, moveCustomField,
      fosterVsAdopt, feeMode, photo, loadPhoto, setPhotoTransform, clearPhoto,
      fonts, setGlobalFont, setElementFont, fontFor, selectedId, select,
    ]
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within <EditorProvider>')
  return ctx
}

export { TEXT_FIELDS, BADGE_FIELDS }
