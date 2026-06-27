import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { Field } from '../ui/Controls.jsx'

// Name-and-save dialog for private templates (M7c). A template saves the LAYOUT (the look + your
// custom-field lanes), not the animal's details — apply it to start the next flyer from your style.
// The parent (Editor) owns the stage ref and builds the snapshot + thumbnail.
export default function SaveTemplateModal({ open, onClose, defaultName, onSave }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setName(defaultName || 'My template')
      setStatus('idle')
      setError(null)
    }
  }, [open, defaultName])

  const submit = async (e) => {
    e?.preventDefault()
    if (status === 'saving') return
    setStatus('saving')
    setError(null)
    const r = await onSave(name.trim() || 'My template')
    if (r?.ok) {
      onClose()
    } else {
      setStatus('error')
      setError(r?.error || 'Could not save. Please try again.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Save as template">
      <form onSubmit={submit} className="grid gap-3.5">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Saves the <strong>look</strong> — layout, fonts, and your custom fields — not this animal’s
          details. Find it under <strong>Templates → Your templates</strong>.
        </p>
        <Field label="Template name" value={name} onChange={setName} placeholder="Our rescue’s standard flyer" />
        {error && <span className="text-[12px] text-red-500">{error}</span>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="mt-1 h-11 rounded-xl bg-primary text-[15px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
        >
          {status === 'saving' ? 'Saving…' : 'Save as template'}
        </button>
      </form>
    </Modal>
  )
}
