import { useLayoutEffect, useRef, useState } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import { resolveColor } from '../../lib/themes.js'

// Renders both bound text ('text') and the joined meta line ('metaText').
// Empty fields fall back to faint placeholder copy so the flyer always reads as a complete
// example (teaching empty state), and empty optional values simply disappear once typed over.
export default function FlyerText({ element, interactive }) {
  const { fields, fonts, selectedId, select, resolvedPalette } = useEditor()
  const ref = useRef(null)
  const [height, setHeight] = useState(0)

  let display = ''
  let isEmpty = true
  if (element.staticText != null) {
    // A fixed template label (e.g. an "URGENT" banner) — always shown, never faint.
    display = element.staticText
    isEmpty = false
  } else if (element.type === 'metaText') {
    const parts = element.parts
      .map((b) => (fields[b] || '').trim())
      .filter(Boolean)
    isEmpty = parts.length === 0
    display = isEmpty ? element.placeholder || '' : parts.join(element.separator || ' · ')
  } else {
    const value = (fields[element.fieldBinding] || '').trim()
    isEmpty = !value
    display = isEmpty ? element.placeholder || '' : value
  }

  // Font priority: user's per-element override → template's element font → overall flyer font.
  const family = fonts.perElement[element.id] ?? element.fontFamily ?? fonts.global
  const fill = resolveColor(isEmpty ? 'role:placeholder' : element.fill, resolvedPalette)
  const weight = String(element.fontWeight || (element.role === 'display' ? 700 : 400))
  const selected = selectedId === element.id

  useLayoutEffect(() => {
    if (ref.current) setHeight(ref.current.height())
  }, [display, family, element.fontSize, element.width, weight])

  // Nothing to show and nothing to teach → render nothing.
  if (!display) return null

  return (
    <Group
      x={element.x}
      y={element.y}
      onClick={() => interactive && select(element.id)}
      onTap={() => interactive && select(element.id)}
    >
      {interactive && selected && (
        <Rect
          x={-14}
          y={-10}
          width={element.width + 28}
          height={height + 20}
          cornerRadius={16}
          fill="rgba(232,163,61,0.12)"
          stroke="#e8a33d"
          strokeWidth={2}
          listening={false}
        />
      )}
      <Text
        ref={ref}
        text={display}
        width={element.width}
        align={element.align || 'left'}
        fontFamily={`${family}, sans-serif`}
        fontStyle={weight}
        fontSize={element.fontSize}
        lineHeight={element.lineHeight || 1.18}
        fill={fill}
        listening={interactive}
      />
    </Group>
  )
}
