// Resend wrapper — magic-link delivery only (CLAUDE.md gotcha #11: needs a verified
// From domain with SPF/DKIM in production or mail lands in spam). The raw token lives
// only inside the link; it is never logged. When RESEND_API_KEY is absent (local dev or
// not-yet-provisioned), this returns { delivered:false } and the route surfaces the link
// itself so the whole flow is testable without email.
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export async function sendMagicLink(env, email, link) {
  if (!env.RESEND_API_KEY) return { delivered: false, reason: 'no_api_key' }

  const from = env.MAGIC_LINK_FROM || 'Bastet <bastet@axly.com>'
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Bastet sign-in link',
        html: magicLinkHtml(link),
        text:
          `Sign in to Bastet by opening this link:\n\n${link}\n\n` +
          `It expires in 15 minutes. If you didn't request it, you can ignore this email.`,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { delivered: false, reason: `resend_${res.status}`, detail }
    }
    return { delivered: true }
  } catch (err) {
    return { delivered: false, reason: 'fetch_failed', detail: String(err) }
  }
}

function magicLinkHtml(link) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#faf5ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2b211a;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:22px;font-weight:800;color:#b3531a;margin-bottom:8px;">Bastet</div>
      <h1 style="font-size:24px;margin:16px 0 8px;">Sign in to Bastet</h1>
      <p style="font-size:15px;line-height:1.5;color:#4a4038;margin:0 0 24px;">
        Click the button below to sign in. This link expires in 15 minutes.
      </p>
      <a href="${link}"
         style="display:inline-block;background:#e8a33d;color:#2b211a;font-weight:700;
                text-decoration:none;padding:13px 26px;border-radius:999px;font-size:16px;">
        Sign in
      </a>
      <p style="font-size:13px;line-height:1.5;color:#6f6357;margin:28px 0 0;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="color:#8a6d4a;word-break:break-all;">${link}</span>
      </p>
      <p style="font-size:13px;color:#8a7d6b;margin:24px 0 0;">
        Didn't request this? You can safely ignore this email.
      </p>
    </div>
  </body>
</html>`
}
