import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { Field, TextArea } from '../ui/Controls.jsx'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'event', label: 'Event' },
]
const MOODS = ['calm', 'cheerful', 'urgent', 'elegant', 'minimal']

// Share the current layout with the community library (M8). Tier 2; lands as pending review. The
// parent (Editor) owns the stage ref and builds the layout snapshot + thumbnail.
export default function ShareTemplateModal({ open, onClose, defaultName, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [moods, setMoods] = useState([])
  const [status, setStatus] = useState('idle') // idle | saving | done | error
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (open) {
      setName(defaultName || '')
      setDescription('')
      setCategory('general')
      setMoods([])
      setStatus('idle')
      setMessage(null)
    }
  }, [open, defaultName])

  const toggleMood = (m) =>
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))

  const submit = async (e) => {
    e?.preventDefault()
    if (status === 'saving') return
    if (!name.trim()) {
      setStatus('error')
      setMessage('Please name your template.')
      return
    }
    setStatus('saving')
    setMessage(null)
    const r = await onSave({ name: name.trim(), description: description.trim(), category, moodTags: moods })
    if (r?.ok) {
      setStatus('done')
      setMessage(r.message || 'Thanks! Your template is pending review.')
    } else {
      setStatus('error')
      setMessage(r?.error || 'Could not submit. Please try again.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share with the community">
      {status === 'done' ? (
        <div className="grid gap-4 py-2 text-center">
          <p className="text-3xl" aria-hidden>🌱</p>
          <p className="text-[14px] leading-relaxed text-ink-soft">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="mx-auto h-10 rounded-xl bg-primary px-5 text-[14px] font-bold text-on-primary transition hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3.5">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Share your <strong>layout</strong> (not this animal’s details) so other rescues can use it.
            Submissions are reviewed before they appear. Only your rescue name is shown — never your email.
          </p>
          <Field label="Template name" value={name} onChange={setName} placeholder="Sunny adoption flyer" />

          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold tracking-tight text-ink-soft">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold tracking-tight text-ink-soft">Mood (optional)</span>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <Chip key={m} active={moods.includes(m)} onClick={() => toggleMood(m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>

          <TextArea
            label="Description (optional)"
            value={description}
            onChange={setDescription}
            placeholder="A warm, simple layout that works for most dogs."
            rows={2}
          />

          {status === 'error' && <span className="text-[12px] text-red-500">{message}</span>}
          <button
            type="submit"
            disabled={status === 'saving'}
            className="mt-1 h-11 rounded-xl bg-primary text-[15px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
          >
            {status === 'saving' ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      )}
    </Modal>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'rounded-full border px-3 py-1.5 text-[13px] font-semibold capitalize transition ' +
        (active
          ? 'border-primary bg-primary-soft text-ink'
          : 'border-border bg-surface text-ink-soft hover:bg-sunken')
      }
    >
      {children}
    </button>
  )
}
