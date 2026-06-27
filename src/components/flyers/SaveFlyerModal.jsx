import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { Field } from '../ui/Controls.jsx'

// Name-and-save dialog (M7b). The heavy lifting (snapshot + thumbnail + photo capture) lives in
// the parent (Editor) which owns the stage ref; this just collects a name and reports status.
export default function SaveFlyerModal({ open, onClose, defaultName, onSave }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setName(defaultName || 'Untitled Flyer')
      setStatus('idle')
      setError(null)
    }
  }, [open, defaultName])

  const submit = async (e) => {
    e?.preventDefault()
    if (status === 'saving') return
    setStatus('saving')
    setError(null)
    const r = await onSave(name.trim() || 'Untitled Flyer')
    if (r?.ok) {
      onClose()
    } else {
      setStatus('error')
      setError(r?.error || 'Could not save. Please try again.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Save flyer">
      <form onSubmit={submit} className="grid gap-3.5">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Saved to your account — reopen and tweak it any time from <strong>My flyers</strong>.
        </p>
        <Field label="Flyer name" value={name} onChange={setName} placeholder="Biscuit — adoption flyer" />
        {error && <span className="text-[12px] text-red-500">{error}</span>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="mt-1 h-11 rounded-xl bg-primary text-[15px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
        >
          {status === 'saving' ? 'Saving…' : 'Save flyer'}
        </button>
      </form>
    </Modal>
  )
}
