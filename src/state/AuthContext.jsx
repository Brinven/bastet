import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Tier 2 session state (M6). Tier 1 (anonymous) is the primary experience — auth is optional,
// so a failed /api/me (401, or the Worker not running in a frontend-only dev session) just means
// "signed out" and never blocks the editor.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <AuthContext.Provider value={{ user, loading, refresh, requestLink, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
