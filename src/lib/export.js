import { OUTPUT_SIZES } from './outputSizes.js'

// CRITICAL export path.
//
// Gotcha #1 (fonts) — STILL NON-NEGOTIABLE: fonts must be fully loaded before toDataURL()
// or Konva silently falls back to a system font (preview right, export wrong).
//
// Gotcha #2 (pixelRatio) — adapted to this app's architecture: the flyer document is authored
// at the TRUE output resolution (e.g. Print = 2550×3300 = 300 DPI letter; IG Post = 1080×1080,
// the native upload size). The stage is scaled up to that resolution at export, so pixelRatio:1
// already yields a crisp image at exactly the promised dimensions. pixelRatio:3 here would NOT
// improve a fixed-size raster target — it would 3× oversample every export (a Print PDF balloons
// to ~227 MB). So we render at the output resolution (pixelRatio:1) and ship exactly the size
// the user picked.
export async function exportToPNG(stageRef, outputSize) {
  await document.fonts.ready
  await new Promise((r) => setTimeout(r, 200)) // safety buffer

  const { width, height } = OUTPUT_SIZES[outputSize]
  const stage = stageRef.current

  const previewWidth = stage.width()
  const previewHeight = stage.height()

  // Scale the stage from its on-screen preview size up to the full output resolution.
  stage.scale({ x: width / previewWidth, y: height / previewHeight })
  stage.size({ width, height })

  const dataURL = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })

  // Restore preview dimensions.
  stage.scale({ x: 1, y: 1 })
  stage.size({ width: previewWidth, height: previewHeight })

  return dataURL
}

// Small thumbnail PNG for the "My flyers" gallery (M7b). Same font-load discipline as the full
// export (so the thumbnail matches the preview), but rendered at a capped longest-edge so the
// stored object stays tiny (well under the 2 MB cap — typically a few tens of KB). Returns a Blob.
export async function exportThumbnailBlob(stageRef, outputSize, maxDim = 480) {
  await document.fonts.ready
  await new Promise((r) => setTimeout(r, 200)) // safety buffer (match the export path)

  const { width, height } = OUTPUT_SIZES[outputSize]
  const stage = stageRef.current

  const previewWidth = stage.width()
  const previewHeight = stage.height()

  // Fit the output aspect into a maxDim box.
  const fit = Math.min(maxDim / width, maxDim / height, 1)
  const outW = Math.round(width * fit)
  const outH = Math.round(height * fit)

  stage.scale({ x: outW / previewWidth, y: outH / previewHeight })
  stage.size({ width: outW, height: outH })

  const dataURL = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })

  stage.scale({ x: 1, y: 1 })
  stage.size({ width: previewWidth, height: previewHeight })

  return await (await fetch(dataURL)).blob()
}

// PDF export wraps the PNG (no headless browser — CLAUDE.md stack rule). jsPDF is imported
// lazily so the editor bundle stays lean until the user actually exports a PDF. Stream + image
// compression keep print PDFs to a sane size.
export async function exportToPDF(stageRef, outputSize) {
  const dataURL = await exportToPNG(stageRef, outputSize)
  const { width, height } = OUTPUT_SIZES[outputSize]
  const { jsPDF } = await import('jspdf')

  const orientation = width >= height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height], compress: true })
  pdf.addImage(dataURL, 'PNG', 0, 0, width, height, undefined, 'FAST')
  return pdf
}
