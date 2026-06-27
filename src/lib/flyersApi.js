// Tier 2 saved-flyers API (M7b). Plain fetch wrappers — flyers aren't global reactive state
// (the gallery fetches on open), so they live here rather than in AuthContext. All calls send the
// session cookie; the Worker scopes everything to the signed-in user. Returns { ok, ... }.

// Save a flyer. `snapshot` = the full editor state (minus image bytes); `thumbBlob` is required;
// `photoBlob` is the original animal photo bytes (optional — null when no photo was added).
export async function saveFlyer({ name, outputSize, snapshot, thumbBlob, photoBlob }) {
  try {
    const fd = new FormData()
    fd.append('name', name || 'Untitled Flyer')
    fd.append('output_size', outputSize || 'instagram_post')
    fd.append('flyer_data', JSON.stringify(snapshot))
    fd.append('thumb', thumbBlob, 'thumb.png')
    if (photoBlob) fd.append('photo', photoBlob, 'photo')
    const res = await fetch('/api/me/flyers', { method: 'POST', credentials: 'include', body: fd })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error — is the API running?' }
  }
}

export async function listFlyers() {
  try {
    const res = await fetch('/api/me/flyers', { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function getFlyer(id) {
  try {
    const res = await fetch(`/api/me/flyers/${id}`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

export async function deleteFlyer(id) {
  try {
    const res = await fetch(`/api/me/flyers/${id}`, { method: 'DELETE', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, ...data }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

// Fetch a saved flyer's original photo bytes (R2, owner-only) for restore.
export async function fetchFlyerPhotoBlob(id) {
  const res = await fetch(`/api/me/flyers/${id}/photo`, { credentials: 'include' })
  if (!res.ok) return null
  return await res.blob()
}
