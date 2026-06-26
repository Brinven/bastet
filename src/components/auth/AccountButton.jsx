import { useState } from 'react'
import Menu from '../ui/Menu.jsx'
import ProfileModal from '../profile/ProfileModal.jsx'
import { useAuth } from '../../state/AuthContext.jsx'

// TopBar account control. Tier 1 is the default — this is an unobtrusive optional sign-in.
export default function AccountButton() {
  const { user, loading } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  if (loading) return null
  if (!user) return <SignInMenu />
  return (
    <>
      <AccountMenu user={user} onOpenProfile={() => setProfileOpen(true)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

function SignInMenu() {
  const { requestLink } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim() || status === 'sending') return
    setStatus('sending')
    const r = await requestLink(email.trim())
    setResult(r)
    setStatus(r.ok ? 'sent' : 'error')
  }

  return (
    <Menu
      align="right"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-sunken"
        >
          <span aria-hidden>👋</span>
          <span className="hidden sm:inline">Sign in</span>
        </button>
      )}
    >
      {() => (
        <div className="w-72 p-2">
          {status === 'sent' ? (
            <div className="grid gap-2 px-1 py-1">
              <p className="text-[14px] font-semibold text-ink">Check your email 📬</p>
              <p className="text-[13px] leading-relaxed text-ink-soft">{result?.message}</p>
              {result?.devLink && (
                <a
                  href={result.devLink}
                  className="mt-1 inline-block rounded-lg bg-primary px-3 py-2 text-center text-[13px] font-bold text-on-primary transition hover:bg-primary-hover"
                >
                  Open dev sign-in link →
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-2">
              <p className="px-1 pt-1 text-[13px] leading-relaxed text-ink-soft">
                Save flyers, templates, and your rescue profile. We’ll email you a sign-in link —
                no password.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@rescue.org"
                autoFocus
                aria-label="Email address"
                className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-[15px] text-ink placeholder:text-ink-faint outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]"
              />
              {status === 'error' && (
                <p className="px-1 text-[12px] text-red-500">
                  {result?.error || 'Something went wrong. Please try again.'}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="h-10 rounded-lg bg-primary text-[14px] font-bold text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
              >
                {status === 'sending' ? 'Sending…' : 'Email me a link'}
              </button>
            </form>
          )}
        </div>
      )}
    </Menu>
  )
}

function AccountMenu({ user, onOpenProfile }) {
  const { logout } = useAuth()
  const display = user.rescue_name?.trim() || user.email
  const initial = (display || '?').trim().charAt(0).toUpperCase()

  return (
    <Menu
      align="right"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-[13px] font-semibold text-ink-soft transition hover:bg-sunken"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[13px] font-bold text-on-primary">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate sm:inline">{display}</span>
        </button>
      )}
    >
      {(close) => (
        <div className="w-60 p-1">
          <div className="grid gap-0.5 px-3 py-2">
            {user.rescue_name && (
              <span className="truncate text-[14px] font-semibold text-ink">{user.rescue_name}</span>
            )}
            <span className="truncate text-[12px] text-ink-faint">{user.email}</span>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              close()
              onOpenProfile()
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-ink transition hover:bg-sunken"
          >
            <span aria-hidden>🏷️</span> Rescue profile
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              logout()
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-ink transition hover:bg-sunken"
          >
            Sign out
          </button>
        </div>
      )}
    </Menu>
  )
}
