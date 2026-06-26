import { useEditor } from '../../state/EditorContext.jsx'
import { TEMPLATES } from '../../templates/index.js'
import TemplateCard from './TemplateCard.jsx'
import CommunityTemplates from './CommunityTemplates.jsx'

// The template chooser. Picking a template keeps the user's content and reflows it into the
// new layout, then returns to the Edit tab so they see it live on the canvas.
export default function TemplateGallery({ onApplied }) {
  const { loadTemplate, templateId } = useEditor()

  const pick = (t) => {
    loadTemplate(t)
    onApplied?.()
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
        <p className="text-[13px] text-ink-soft">
          Pick a starting point — your photo and details carry over.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              active={t.id === templateId}
              onSelect={() => pick(t)}
            />
          ))}
        </div>
      </div>

      <CommunityTemplates onApplied={onApplied} />
    </div>
  )
}
