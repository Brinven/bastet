import { useMemo, useRef } from 'react'
import { Group, Image as KonvaImage, Rect, Text, Circle } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import { resolveColor } from '../../lib/themes.js'

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function clamp(v, min, max) {
  // min may be > max when the image is barely larger than the frame; keep it centered then.
  if (min > max) return (min + max) / 2
  return Math.max(min, Math.min(max, v))
}

// The animal photo: an Image inside a clipped Group. Cover-fit, then the user drags to pan
// and zooms (slider/wheel) WITHIN the clip. We never crop programmatically — the whole photo
// stays reachable; the user decides the framing.
export default function FlyerPhoto({ element, interactive }) {
  const { photo, setPhotoTransform, selectedId, select, resolvedPalette } = useEditor()
  const imgRef = useRef(null)
  const { x, y, width: w, height: h, radius = 24 } = element
  const selected = selectedId === element.id

  const cover = useMemo(() => {
    if (!photo) return null
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight)
    const scale = base * (photo.scale ?? 1)
    const drawnW = photo.naturalWidth * scale
    const drawnH = photo.naturalHeight * scale
    const centerX = (w - drawnW) / 2
    const centerY = (h - drawnH) / 2
    const imgX = clamp(centerX + (photo.offsetX ?? 0), w - drawnW, 0)
    const imgY = clamp(centerY + (photo.offsetY ?? 0), h - drawnH, 0)
    return { drawnW, drawnH, centerX, centerY, imgX, imgY }
  }, [photo, w, h])

  const clip = (ctx) => roundRectPath(ctx, 0, 0, w, h, radius)

  return (
    <Group
      x={x}
      y={y}
      clipFunc={clip}
      onClick={() => interactive && select(element.id)}
      onTap={() => interactive && select(element.id)}
    >
      {photo && cover ? (
        <KonvaImage
          ref={imgRef}
          image={photo.image}
          width={cover.drawnW}
          height={cover.drawnH}
          x={cover.imgX}
          y={cover.imgY}
          draggable={interactive}
          onDragMove={(e) => {
            const node = e.target
            const nx = clamp(node.x(), w - cover.drawnW, 0)
            const ny = clamp(node.y(), h - cover.drawnH, 0)
            node.position({ x: nx, y: ny })
            setPhotoTransform({
              offsetX: nx - cover.centerX,
              offsetY: ny - cover.centerY,
            })
          }}
          onMouseEnter={(e) => {
            if (interactive) e.target.getStage().container().style.cursor = 'grab'
          }}
          onMouseLeave={(e) => {
            if (interactive) e.target.getStage().container().style.cursor = 'default'
          }}
        />
      ) : (
        <PhotoPlaceholder w={w} h={h} interactive={interactive} k={element._k ?? 1} palette={resolvedPalette} />
      )}

      {/* Selection hairline — drawn last so it sits above the image, clipped to the frame. */}
      {interactive && (
        <Rect
          x={1.5}
          y={1.5}
          width={w - 3}
          height={h - 3}
          cornerRadius={radius}
          stroke={selected ? resolveColor('role:accent', resolvedPalette) : 'rgba(43,33,26,0.10)'}
          strokeWidth={selected ? 5 : 2}
          listening={false}
        />
      )}
    </Group>
  )
}

function PhotoPlaceholder({ w, h, interactive, k = 1, palette }) {
  // Soft palette-tinted stand-in so an empty photo frame matches the active theme (warm by default).
  const tintA = palette?.chipBg || '#ece3d4'
  const tintB = palette?.chipBorder || '#d8cab2'
  // Read-only previews (template gallery) show just the tinted gradient, not the "tap to add" prompt.
  if (!interactive) {
    return (
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        listening={false}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: w, y: h }}
        fillLinearGradientColorStops={[0, tintA, 1, tintB]}
      />
    )
  }
  return (
    <Group listening={false}>
      <Rect x={0} y={0} width={w} height={h} fill={tintA} />
      <Circle x={w / 2} y={h / 2 - 36 * k} radius={48 * k} fill={tintB} />
      <Text text="🐾" x={0} y={h / 2 - 78 * k} width={w} align="center" fontSize={68 * k} />
      <Text
        text="Tap to add a photo"
        x={0}
        y={h / 2 + 40 * k}
        width={w}
        align="center"
        fontFamily="Poppins, sans-serif"
        fontStyle="600"
        fontSize={34 * k}
        fill={palette?.inkSoft || '#9b8e79'}
      />
    </Group>
  )
}
