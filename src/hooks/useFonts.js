import { useEffect, useState } from 'react'
import { FONTS, loadFontStylesheet } from '../lib/fonts.js'

// Loads the curated Google Fonts stylesheet and reports when the browser has
// finished loading fonts. Export must wait on this (document.fonts.ready) so
// the canvas never renders a system fallback into the exported PNG.
export function useFonts() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadFontStylesheet()
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { fonts: FONTS, ready }
}
