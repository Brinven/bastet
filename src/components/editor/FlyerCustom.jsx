import { Group, Text } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'

// Renders user-created TEXT custom fields (M5) as a labeled, bounded block: one fixed-height
// row per filled field — `Label   value`, the value single-line + ellipsis so the block can
// never blow out a template's layout. Empty fields (and an all-empty block) render nothing,
// so an unused slot is invisible. Badge-type custom fields render in FlyerBadges instead.
export default function FlyerCustom({ element }) {
  const { customFields, fields, fonts } = useEditor()
  const family = fonts.global
  const k = element._k ?? 1

  const rows = (customFields || [])
    .filter((d) => d.type === 'text')
    .map((d) => ({ id: d.id, label: (d.label || '').trim(), value: (fields[d.id] || '').trim() }))
    .filter((r) => r.value)

  if (rows.length === 0) return null

  const ROW_H = 44 * k
  const labelFS = 22 * k
  const valueFS = 26 * k
  const labelW = Math.round(element.width * 0.34)
  const valueX = labelW + 14 * k
  const valueW = element.width - valueX
  const labelFill = element.labelFill || '#94876f'
  const valueFill = element.fill || '#3f362d'

  return (
    <Group x={element.x} y={element.y} listening={false}>
      {rows.map((r, i) => (
        <Group key={r.id} y={i * ROW_H}>
          <Text
            text={r.label}
            width={labelW}
            height={ROW_H}
            verticalAlign="middle"
            fontFamily={`${family}, sans-serif`}
            fontStyle="600"
            fontSize={labelFS}
            fill={labelFill}
            wrap="none"
            ellipsis
          />
          <Text
            x={valueX}
            text={r.value}
            width={valueW}
            height={ROW_H}
            verticalAlign="middle"
            fontFamily={`${family}, sans-serif`}
            fontStyle="500"
            fontSize={valueFS}
            fill={valueFill}
            wrap="none"
            ellipsis
          />
        </Group>
      ))}
    </Group>
  )
}
