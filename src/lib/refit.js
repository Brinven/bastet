import { OUTPUT_SIZES } from './outputSizes.js'

// Proportionally re-fit a flyer document from its native size to a target output size.
// Geometry scales per-axis (x/width by width-ratio, y/height by height-ratio). Glyph-ish
// sizes (fontSize, radius) and composite internals scale by the WIDTH ratio `k`, carried on
// each element as `_k` (composite renderers — badges/fee/tag/contact — multiply their fixed
// pixel sizes by it). Portrait sizes (Post/Story/Print share or scale width cleanly) look great;
// Facebook's landscape aspect is the known rough case (see M4 notes).
export function refitDocument(native, targetSize) {
  if (!native) return native
  if (native.outputSize === targetSize) return native // identity — no work

  const target = OUTPUT_SIZES[targetSize]
  if (!target) return native

  const sx = target.width / native.width
  const sy = target.height / native.height
  // Uniform internal scale for glyph/composite sizes. min(sx,sy) equals sx for the portrait
  // family (Post/Story/Print, where height grows at least as fast as width) but shrinks type
  // for landscape (Facebook), reducing the vertical overlap that pure width-scaling causes.
  const k = Math.min(sx, sy)

  return {
    outputSize: targetSize,
    width: target.width,
    height: target.height,
    background: native.background,
    elements: native.elements.map((el) => scaleElement(el, sx, sy, k)),
  }
}

function scaleElement(el, sx, sy, k) {
  const out = { ...el, _k: k }
  if (el.x != null) out.x = el.x * sx
  if (el.y != null) out.y = el.y * sy
  if (el.width != null) out.width = el.width * sx
  if (el.height != null) out.height = el.height * sy
  if (el.radius != null) out.radius = el.radius * k
  if (el.fontSize != null) out.fontSize = el.fontSize * k
  if (el.padX != null) out.padX = el.padX * sx
  return out
}
