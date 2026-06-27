// Tier 2 private-templates API (M7c). A private template is a reusable LAYOUT (no animal content).
// Plain fetch wrappers, session-cookie auth, scoped server-side to the signed-in user.

export async function saveUserTemplate({ name, snapshot, thumbBlob }) {
  try {
    const fd = new FormData()
    fd.append('name', name || 'Untitled Template')
    fd.append('template_data', JSON.stringify(snapshot))
    fd.append('thumb', thumbBlob, 'thumb.png')
    const res = await fetch('/api/me/templates', { method: 'POST', credentials: 'include', body: fd })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error — is the API running?' }
  }
}

export async function listUserTemplates() {
  try {
    const res = await fetch('/api/me/templates', { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function getUserTemplate(id) {
  try {
    const res = await fetch(`/api/me/templates/${id}`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function deleteUserTemplate(id) {
  try {
    const res = await fetch(`/api/me/templates/${id}`, { method: 'DELETE', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}
