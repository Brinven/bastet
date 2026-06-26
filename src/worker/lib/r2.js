// R2 helpers for user assets (rescue logos, flyer/template thumbnails). Uploads are proxied
// through the Worker (same-origin to /api), so no bucket CORS config is needed (CLAUDE.md
// gotcha #5 is sidestepped for the worker-proxied path).
export async function putObject(bucket, key, data, contentType) {
  await bucket.put(key, data, { httpMetadata: { contentType } })
  return key
}

export async function getObject(bucket, key) {
  if (!key) return null
  return await bucket.get(key) // R2ObjectBody | null
}

export async function deleteObject(bucket, key) {
  if (key) await bucket.delete(key)
}
