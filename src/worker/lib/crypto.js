// Token hashing + generation using the Web Crypto API (available in Workers).
// Raw magic-link / session tokens NEVER touch D1 — always hash before storage
// and before lookup (CLAUDE.md gotcha #6).
export async function hashToken(token) {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateToken(length = 48) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}
