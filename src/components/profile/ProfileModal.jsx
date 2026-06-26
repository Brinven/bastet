import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { Field } from '../ui/Controls.jsx'
import { useAuth } from '../../state/AuthContext.jsx'

// Tier 2 rescue profile editor (M7). Saved once → auto-fills every new flyer's contact fields.
// Logo uploads immediately (worker-proxied to R2); name/phone/website save on "Save profile".
export default function ProfileModal({ open, onClose }) {
  const { user, updateProfile, uploadLogo, logoVersion } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoErr, setLogoErr] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open && user) {
      setName(user.rescue_name || '')
      setPhone(user.rescue_phone || '')
      setWebsite(user.rescue_website || '')
      setSaved(false)
      setLogoErr(null)
    }
  }, [open, user])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const r = await updateProfile({ rescue_name: name, rescue_phone: phone, rescue_website: website })
    setSaving(false)
    if (r.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoBusy(true)
    setLogoErr(null)
    const r = await uploadLogo(file)
    setLogoBusy(false)
    if (!r.ok) setLogoErr(r.error || 'Upload failed.')
  }

  return (
    <Modal open={open} onClose={onClose} title="Rescue profile">
      <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
        Saved once, then filled in automatically on every new flyer.
      </p>
      <div className="grid gap-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-sunken">
            {user?.has_logo ? (
              <img
                src={`/api/me/logo?v=${logoVersion}`}
                alt="Rescue logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span aria-hidden className="text-2xl opacity-50">🏷️</span>
            )}
          </div>
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoBusy}
              className="justify-self-start rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-sunken disabled:opacity-60"
            >
              {logoBusy ? 'Uploading…' : user?.has_logo ? 'Replace logo' : 'Upload logo'}
            </button>
            <span className="text-[11px] text-ink-faint">PNG or JPG, up to 10 MB.</span>
            {logoErr && <span className="text-[11px] text-red-500">{logoErr}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="sr-only" />
        </div>

        <Field label="Rescue name" value={name} onChange={setName} placeholder="Happy Tails Rescue" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" inputMode="tel" />
        <Field label="Website" value={website} onChange={setWebsite} placeholder="happytails.org" />

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-1 h-11 rounded-xl bg-primary text-[15px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
        </button>
      </div>
    </Modal>
  )
}
