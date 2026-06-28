import { Group, Rect, Text, Image as KonvaImage } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import { FIELDS } from '../../lib/fieldBindings.js'
import { resolveColor } from '../../lib/themes.js'

// Composite footer: optional rescue logo (left) + rescue name + phone · website (right). Usually on
// a warm band, but `band` may be omitted (e.g. overlaying a photo scrim). Empty fields show faint
// sample copy (via opacity, so it reads correctly on any band color) so the flyer looks finished.
export default function ContactBlock({ element }) {
  const { fields, fonts, logo, resolvedPalette } = useEditor()
  const family = fonts.global
  const { x, y, width, height } = element
  const band = resolveColor(element.band, resolvedPalette)
  const fill = resolveColor(element.fill ?? 'role:onBand', resolvedPalette)
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

  // Logo badge — most bands are dark, so the logo sits on a clean white rounded chip for reliable
  // contrast across templates. Aspect-preserved inside the chip; the name shifts right to make room.
  const hasLogo = !!logo?.image
  const chip = hasLogo ? logoChip(logo.image, height, padX, k) : null
  const nameX = chip ? chip.x + chip.size + 18 * k : padX

  return (
    <Group x={x} y={y} listening={false}>
      {band && <Rect width={width} height={height} fill={band} />}

      {chip && (
        <>
          <Rect
            x={chip.x}
            y={chip.y}
            width={chip.size}
            height={chip.size}
            cornerRadius={chip.size * 0.18}
            fill="#ffffff"
            shadowColor="rgba(0,0,0,0.25)"
            shadowBlur={6 * k}
            shadowOffsetY={1 * k}
          />
          <KonvaImage image={logo.image} x={chip.imgX} y={chip.imgY} width={chip.imgW} height={chip.imgH} />
        </>
      )}

      <Text
        text={nameText}
        x={nameX}
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

// Geometry for the logo chip + the aspect-fit image inside it, given the band height.
function logoChip(image, bandH, padX, k) {
  const size = Math.min(bandH * 0.66, bandH - 16 * k)
  const cy = (bandH - size) / 2
  const inset = size * 0.14
  const innerBox = size - inset * 2
  const iw = image.naturalWidth || 1
  const ih = image.naturalHeight || 1
  const ar = iw / ih
  let imgW = innerBox
  let imgH = innerBox
  if (ar >= 1) imgH = innerBox / ar
  else imgW = innerBox * ar
  return {
    x: padX,
    y: cy,
    size,
    imgX: padX + inset + (innerBox - imgW) / 2,
    imgY: cy + inset + (innerBox - imgH) / 2,
    imgW,
    imgH,
  }
}
