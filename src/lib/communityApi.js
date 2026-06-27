// Community templates API (M8). Submission is Tier 2 (session cookie); admin calls use a bearer
// token entered in the admin page (never a session).

// Submit the current layout to the community library (lands as pending review).
export async function submitTemplate({ name, description, category, moodTags, snapshot, thumbBlob }) {
  try {
    const fd = new FormData()
    fd.append('name', name || 'Untitled')
    fd.append('description', description || '')
    fd.append('category', category || 'general')
    fd.append('mood_tags', JSON.stringify(moodTags || []))
    fd.append('template_data', JSON.stringify(snapshot))
    fd.append('thumb', thumbBlob, 'thumb.png')
    const res = await fetch('/api/templates', { method: 'POST', credentials: 'include', body: fd })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error — is the API running?' }
  }
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` })

export async function adminListPending(token) {
  try {
    const res = await fetch('/api/admin/templates/pending', { headers: authHeader(token) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function adminApprove(token, id) {
  try {
    const res = await fetch(`/api/admin/templates/${id}/approve`, { method: 'POST', headers: authHeader(token) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function adminReject(token, id) {
  try {
    const res = await fetch(`/api/admin/templates/${id}/reject`, { method: 'POST', headers: authHeader(token) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}
