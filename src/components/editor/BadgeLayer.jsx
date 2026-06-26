import { Group, Rect, Text } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import { BADGE_META } from '../../lib/defaultFlyer.js'

// Real text measurement so chips size to their label and wrap cleanly (no overflow).
let _measureCtx = null
function measureText(text, font) {
  if (typeof document === 'undefined') return text.length * 14
  if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d')
  _measureCtx.font = font
  return _measureCtx.measureText(text).width
}

// Composite renderers carry their own fixed pixel sizes; `element._k` (set by the size re-fit)
// scales them so badges/fee/tag stay proportional at any output size.

// "Good with…" + spayed/neutered as warm pills. Only enabled badges render; they flow
// left-to-right and wrap within the element's width.
export function FlyerBadges({ element }) {
  const { badges, customFields, fonts } = useEditor()
  const family = fonts.global
  const k = element._k ?? 1
  const CHIP_H = 58 * k
  const CHIP_GAP = 16 * k
  const CHIP_PAD = 28 * k
  const CHIP_FS = 26 * k
  const font = `600 ${CHIP_FS}px ${family}`

  // Built-in badges (in the template's order) followed by any toggled-on custom badge fields.
  const builtIn = element.items
    .filter((b) => badges[b])
    .map((b) => ({ key: b, label: BADGE_META[b].short || BADGE_META[b].label, glyph: BADGE_META[b].glyph }))
  const custom = (customFields || [])
    .filter((d) => d.type === 'badge' && badges[d.id])
    .map((d) => ({ key: d.id, label: (d.label || '').trim() || 'Badge', glyph: d.glyph || '⭐' }))
  const enabled = [...builtIn, ...custom]
  if (enabled.length === 0) return null

  const chips = []
  let cx = 0
  let cy = 0
  for (const entry of enabled) {
    const { key, label, glyph } = entry
    const textW = measureText(label, font)
    const glyphW = CHIP_FS + 8 * k
    const chipW = CHIP_PAD + glyphW + textW + CHIP_PAD
    if (cx + chipW > element.width && cx > 0) {
      cx = 0
      cy += CHIP_H + CHIP_GAP
    }
    chips.push({ key, label, glyph, chipW, x: cx, y: cy })
    cx += chipW + CHIP_GAP
  }

  return (
    <Group x={element.x} y={element.y} listening={false}>
      {chips.map((c) => (
        <Group key={c.key} x={c.x} y={c.y}>
          <Rect
            width={c.chipW}
            height={CHIP_H}
            cornerRadius={CHIP_H / 2}
            fill="#fdf0d8"
            stroke="#f0d49a"
            strokeWidth={2 * k}
          />
          <Text text={c.glyph} x={CHIP_PAD - 4 * k} y={0} height={CHIP_H} verticalAlign="middle" fontSize={CHIP_FS} />
          <Text
            text={c.label}
            x={CHIP_PAD + CHIP_FS + 4 * k}
            y={0}
            height={CHIP_H}
            verticalAlign="middle"
            fontFamily={`${family}, sans-serif`}
            fontStyle="600"
            fontSize={CHIP_FS}
            fill="#7a5a1e"
          />
        </Group>
      ))}
    </Group>
  )
}

// Adoption fee, or a celebratory "Sponsored!" when the rescue is covering it.
export function FlyerFee({ element }) {
  const { fields, feeMode, fonts } = useEditor()
  const family = fonts.global
  const k = element._k ?? 1
  const fs = 30 * k
  const font = `700 ${fs}px ${family}`

  let label
  let muted = false
  if (feeMode === 'sponsored') {
    label = 'Sponsored! 🎉'
  } else {
    const fee = (fields.adoption_fee || '').trim()
    if (!fee) {
      label = 'Adoption fee'
      muted = true
    } else {
      label = /^\$|free/i.test(fee) ? fee : `$${fee}`
    }
  }

  const textW = measureText(label, font)
  const padX = 24 * k
  const w = textW + padX * 2
  const h = 54 * k
  const x = element.align === 'right' ? element.x + element.width - w : element.x

  return (
    <Group x={x} y={element.y} listening={false}>
      <Rect width={w} height={h} cornerRadius={h / 2} fill={muted ? 'rgba(43,33,26,0.05)' : '#2b211a'} />
      <Text
        text={label}
        width={w}
        height={h}
        align="center"
        verticalAlign="middle"
        fontFamily={`${family}, sans-serif`}
        fontStyle="700"
        fontSize={fs}
        fill={muted ? '#b6ab95' : '#faf5ec'}
      />
    </Group>
  )
}

// "Adopt me" / "Foster me" — a small CTA pill that overlaps the photo.
export function FlyerStatusTag({ element }) {
  const { fosterVsAdopt, fonts } = useEditor()
  const family = fonts.global
  const k = element._k ?? 1
  const fs = 28 * k
  const label = fosterVsAdopt === 'foster' ? 'Foster me' : 'Adopt me'
  const font = `800 ${fs}px ${family}`
  const w = measureText(label, font) + 56 * k
  const h = 56 * k

  return (
    <Group x={element.x} y={element.y} listening={false}>
      <Rect
        width={w}
        height={h}
        cornerRadius={h / 2}
        fill="#e8a33d"
        shadowColor="rgba(43,33,26,0.35)"
        shadowBlur={18 * k}
        shadowOffsetY={6 * k}
        shadowOpacity={1}
      />
      <Text
        text={label}
        width={w}
        height={h}
        align="center"
        verticalAlign="middle"
        fontFamily={`${family}, sans-serif`}
        fontStyle="800"
        fontSize={fs}
        fill="#2b211a"
      />
    </Group>
  )
}
