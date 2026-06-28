// Upload validation + safe serving for user-supplied images (rescue logos, flyer/template
// thumbnails, photos). Security: the client-supplied Content-Type is NOT trusted — we sniff the
// real magic bytes and allow ONLY non-scriptable raster formats. SVG is rejected because it can
// carry <script> and is served same-origin (stored-XSS vector). Served objects also get
// `nosniff` + a sandbox CSP so a hypothetical bad object can't execute on direct navigation.

// Magic-byte signatures for the allow-listed raster formats.
const SIGNATURES = [
  { type: 'image/png',  match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/jpeg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif',  match: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    type: 'image/webp',
    match: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  },
]

// Validate a multipart file part. Returns { ok:true, buffer, contentType } (contentType derived
// from the SNIFFED bytes, never the client's header) or { ok:false, status, error }.
export async function readImageUpload(file, maxSize) {
  if (!file || typeof file === 'string') return { ok: false, status: 400, error: 'No file uploaded.' }
  if (file.size > maxSize) {
    return { ok: false, status: 413, error: `File too large (max ${Math.round(maxSize / 1024 / 1024)} MB).` }
  }
  const buffer = await file.arrayBuffer()
  const head = new Uint8Array(buffer.slice(0, 16))
  const sig = SIGNATURES.find((s) => s.match(head))
  if (!sig) {
    return { ok: false, status: 400, error: 'Please upload a PNG, JPEG, WebP, or GIF image.' }
  }
  return { ok: true, buffer, contentType: sig.type }
}

// Build response headers for serving a stored user image: the object's own (verified) content-type
// plus hardening so it can never be interpreted as an active document.
export function imageHeaders(obj, cacheControl) {
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', cacheControl)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
  return headers
}
