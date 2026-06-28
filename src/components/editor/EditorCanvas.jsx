import { useLayoutEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Rect } from 'react-konva'
import { useEditor } from '../../state/EditorContext.jsx'
import FlyerPhoto from './FlyerPhoto.jsx'
import FlyerText from './FlyerText.jsx'
import FlyerCustom from './FlyerCustom.jsx'
import ContactBlock from './ContactBlock.jsx'
import { FlyerBadges, FlyerFee, FlyerStatusTag } from './BadgeLayer.jsx'
import { resolveColor } from '../../lib/themes.js'

// Elements are authored in OUTPUT (1080-based) coordinates. We render the Stage at a preview
// size that fits the container and scale a single Layer by (preview / output). The provided
// export.js scales the Stage from preview → output at export time, so the on-screen canvas and
// the exported PNG share one coordinate system and stay pixel-identical.
//
// `interactive=false` + `fixedWidth` render a read-only thumbnail (used by the template gallery),
// reusing the exact same element renderers so previews match the editor.
export default function EditorCanvas({ stageRef, onRequestPhoto, interactive = true, fixedWidth = null }) {
  const { doc, select, resolvedPalette } = useEditor()
  const boxRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    if (fixedWidth) return
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect
      setSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fixedWidth])

  const aspect = doc.width / doc.height
  let previewW = 0
  if (fixedWidth) {
    previewW = fixedWidth
  } else if (size.w > 0 && size.h > 0) {
    previewW = Math.max(0, Math.min(size.w, size.h * aspect))
  }
  const previewH = previewW / aspect
  const scale = previewW > 0 ? previewW / doc.width : 0

  const deselect = (e) => {
    if (!interactive) return
    if (e.target === e.target.getStage() || e.target.attrs?.['data-bg']) select(null)
  }

  const wrapClass = fixedWidth
    ? 'overflow-hidden rounded-lg ring-1 ring-black/10'
    : 'overflow-hidden rounded-3xl shadow-canvas ring-1 ring-black/5'

  const stageEl = previewW > 1 && (
    <div className={wrapClass} style={{ width: previewW, height: previewH }}>
      <Stage
        ref={stageRef}
        width={previewW}
        height={previewH}
        listening={interactive}
        onMouseDown={deselect}
        onTouchStart={deselect}
      >
        <Layer scaleX={scale} scaleY={scale} listening={interactive}>
          <Rect
            data-bg
            x={0}
            y={0}
            width={doc.width}
            height={doc.height}
            fill={resolveColor(doc.background, resolvedPalette)}
            onClick={interactive ? () => select(null) : undefined}
            onTap={interactive ? () => select(null) : undefined}
          />
          {doc.elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              interactive={interactive}
              onRequestPhoto={onRequestPhoto}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )

  // Fixed-size previews render inline; the editor canvas fills + centers in its box.
  if (fixedWidth) return stageEl

  return (
    <div ref={boxRef} className="flex h-full w-full items-center justify-center" style={{ minHeight: 0 }}>
      {stageEl}
    </div>
  )
}

function CanvasElement({ element, interactive, onRequestPhoto }) {
  switch (element.type) {
    case 'rect':
      return <FlyerRect element={element} />
    case 'photo':
      return <PhotoWithUpload element={element} interactive={interactive} onRequestPhoto={onRequestPhoto} />
    case 'text':
    case 'metaText':
      return <FlyerText element={element} interactive={interactive} />
    case 'custom':
      return <FlyerCustom element={element} />
    case 'badges':
      return <FlyerBadges element={element} />
    case 'fee':
      return <FlyerFee element={element} />
    case 'tag':
      return <FlyerStatusTag element={element} />
    case 'contact':
      return <ContactBlock element={element} />
    default:
      return null
  }
}

// Generic decorative rectangle: solid fill, or a linear gradient (for color bands / photo scrims).
function FlyerRect({ element }) {
  const { x, y, width, height, radius = 0, fill, gradient } = element
  const grad = gradient
    ? {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: gradient.horizontal ? width : 0, y: gradient.horizontal ? 0 : height },
        fillLinearGradientColorStops: gradient.stops,
      }
    : {}
  return (
    <Rect x={x} y={y} width={width} height={height} cornerRadius={radius} fill={fill} listening={false} {...grad} />
  )
}

function PhotoWithUpload({ element, interactive, onRequestPhoto }) {
  const { photo } = useEditor()
  return (
    <Group
      onClick={() => interactive && !photo && onRequestPhoto?.()}
      onTap={() => interactive && !photo && onRequestPhoto?.()}
    >
      <FlyerPhoto element={element} interactive={interactive} />
    </Group>
  )
}
