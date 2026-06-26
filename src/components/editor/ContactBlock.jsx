import { Group, Rect, Text } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import { FIELDS } from '../../lib/fieldBindings.js'

// Composite footer: rescue name (left) + phone · website (right). Usually on a warm band,
// but `band` may be omitted (e.g. overlaying a photo scrim). Empty fields show faint sample
// copy (via opacity, so it reads correctly on any band color) so the flyer looks finished.
export default function ContactBlock({ element }) {
  const { fields, fonts } = useEditor()
  const family = fonts.global
  const { x, y, width, height, band, fill = '#2b211a' } = element
  const k = element._k ?? 1
  const padX = element.padX ?? 64 * k

  const name = (fields[FIELDS.RESCUE_NAME] || '').trim()
  const phone = (fields[FIELDS.RESCUE_PHONE] || '').trim()
  const website = (fields[FIELDS.RESCUE_WEBSITE] || '').trim()

  const nameEmpty = !name
  const nameText = nameEmpty ? 'Happy Tails Rescue' : name

  const contactParts = [phone, website].filter(Boolean)
  const contactEmpty = contactParts.length === 0
  const contactText = contactEmpty ? '(555) 123-4567  ·  happytails.org' : contactParts.join('  ·  ')

  return (
    <Group x={x} y={y} listening={false}>
      {band && <Rect width={width} height={height} fill={band} />}
      <Text
        text={nameText}
        x={padX}
        y={0}
        height={height}
        verticalAlign="middle"
        fontFamily={`${family}, sans-serif`}
        fontStyle="800"
        fontSize={38 * k}
        fill={fill}
        opacity={nameEmpty ? 0.45 : 1}
      />
      <Text
        text={contactText}
        x={width / 2}
        y={0}
        width={width / 2 - padX}
        height={height}
        align="right"
        verticalAlign="middle"
        fontFamily={`${family}, sans-serif`}
        fontStyle="600"
        fontSize={28 * k}
        fill={fill}
        opacity={contactEmpty ? 0.5 : 1}
      />
    </Group>
  )
}
