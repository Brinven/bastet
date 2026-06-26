import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Tier 2 session state (M6). Tier 1 (anonymous) is the primary experience — auth is optional,
// so a failed /api/me (401, or the Worker not running in a frontend-only dev session) just means
// "signed out" and never blocks the editor.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Bumped on logo upload to cache-bust the (constant-URL) /api/me/logo image.
  const [logoVersion, setLogoVersion] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' })
      setUser(res.ok ? (await res.json()).user : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Clean the ?auth=... marker the verify redirect appends (success | invalid | error).
    const params = new URLSearchParams(window.location.search)
    if (params.has('auth')) {
      params.delete('auth')
      const qs = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
  }, [refresh])

  const requestLink = useCallback(async (email) => {
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, ...data }
    } catch {
      return { ok: false, error: 'Network error — is the API running?' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* clear locally regardless */
    }
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (patch) => {
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setUser(data.user)
      return { ok: res.ok, ...data }
    } catch {
      return { ok: false, error: 'Network error.' }
    }
  }, [])

  const uploadLogo = useCallback(async (file) => {
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch('/api/me/logo', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setUser(data.user)
        setLogoVersion((v) => v + 1)
      }
      return { ok: res.ok, ...data }
    } catch {
      return { ok: false, error: 'Network error.' }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, logoVersion, refresh, requestLink, logout, updateProfile, uploadLogo }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
