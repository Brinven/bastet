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

function emptyRecord(keys, value) {
  return keys.reduce((acc, k) => ((acc[k] = value), acc), {})
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
  const [selectedId, setSelectedId] = useState(null)
  const [templateId, setTemplateId] = useState('calm-cream')

  const setField = useCallback((binding, value) => {
    setFields((f) => ({ ...f, [binding]: value }))
  }, [])

  const toggleBadge = useCallback((binding) => {
    setBadges((b) => ({ ...b, [binding]: !b[binding] }))
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
      fields, setField,
      badges, toggleBadge,
      fosterVsAdopt, setFosterVsAdopt,
      feeMode, setFeeMode,
      photo, loadPhoto, setPhotoTransform, clearPhoto,
      fonts, setGlobalFont, setElementFont, fontFor,
      selectedId, select,
    }),
    [
      doc, loadTemplate, templateId, interactive, outputSize, setOutputSize,
      fields, setField, badges, toggleBadge,
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
