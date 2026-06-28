import { useEffect } from 'react'
import Logo from '../Logo.jsx'

// Friendly, non-technical how-to guide. Reached via the URL hash `#help` (same lightweight pattern
// as `#admin` — no router, no SPA fallback needed; index.html always serves). Rendered outside the
// editor/auth providers (it's static content) but still inherits the app color theme, which is
// applied to documentElement before paint in main.jsx.
export default function HelpPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-md lg:px-6">
        <a href="#" onClick={navHome} className="rounded-lg">
          <Logo />
        </a>
        <a
          href="#"
          onClick={navHome}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-on-primary shadow-lift transition hover:bg-primary-hover"
        >
          <BackArrow />
          Back to editor
        </a>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6">
        {/* Hero */}
        <div className="animate-rise-in text-center">
          <p className="text-4xl" aria-hidden>🐾</p>
          <h1 className="mt-3 font-display text-[30px] font-extrabold leading-tight sm:text-[36px]">
            How to make your flyer
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
            No design experience needed. Most volunteers finish their first flyer in about three
            minutes. Here’s the whole thing, step by step.
          </p>
        </div>

        {/* The four steps */}
        <h2 className="mb-3 mt-10 font-display text-[15px] font-bold uppercase tracking-wide text-ink-faint">
          Four simple steps
        </h2>
        <div className="grid gap-3">
          <Step
            n={1}
            glyph="🎨"
            title="Pick a starting design"
            body={
              <>
                Open the <Pill>Templates</Pill> tab and tap any design you like. Don’t overthink it —
                you can change the photo, the words, and the colors afterwards. The template is just a
                head start.
              </>
            }
          />
          <Step
            n={2}
            glyph="📸"
            title="Add your animal’s photo"
            body={
              <>
                Tap the picture area on the flyer and choose a photo from your phone or computer.
                Then <strong>drag the photo to move it</strong> and use the{' '}
                <strong>zoom slider</strong> to frame the face. We never auto-crop — ears and tails
                stay where they belong, and you’re always in control of the framing.
              </>
            }
          />
          <Step
            n={3}
            glyph="✏️"
            title="Fill in the details"
            body={
              <>
                Go to the <Pill>Edit</Pill> tab and type the name, a short bio, breed, age, and so on.
                Flip the “good with kids / dogs / cats” switches on or off. Scroll down to add your
                rescue’s name, phone, and website so adopters know how to reach you.
              </>
            }
          />
          <Step
            n={4}
            glyph="⬇️"
            title="Choose a size and download"
            body={
              <>
                Use the <Pill>📐 size</Pill> button at the top right to pick where it’s going. Then tap
                the <Pill>Download</Pill> button and choose <strong>PNG</strong> for posting online or{' '}
                <strong>PDF</strong> for printing. That’s it — your flyer saves to your device, ready
                to share.
              </>
            }
          />
        </div>

        {/* Good to know */}
        <h2 className="mb-3 mt-10 font-display text-[15px] font-bold uppercase tracking-wide text-ink-faint">
          Good to know
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tip glyph="📐" title="The four sizes">
            <strong>Instagram Post</strong> (square) and <strong>Story</strong> (tall) for Instagram,{' '}
            <strong>Facebook Post</strong> (wide), and <strong>Print Flyer</strong> for a paper page
            you can hang up. Switch any time — your flyer re-fits automatically.
          </Tip>
          <Tip glyph="🖼️" title="Use a clear photo">
            If a photo is small or blurry we’ll gently warn you. Pick the largest, sharpest picture
            you have — it matters most for printed flyers, which need extra detail.
          </Tip>
          <Tip glyph="🌈" title="Change the colors & fonts">
            In the <Pill>Edit</Pill> tab’s <strong>Style</strong> section, one tap recolors the whole
            flyer. You can also choose a font that fits the mood — playful, calm, or bold.
          </Tip>
          <Tip glyph="➕" title="Add your own fields">
            Need something the built-in fields don’t cover, like “Microchipped” or “Special diet”?
            Add your own text or badge in the <strong>Your own fields</strong> section.
          </Tip>
        </div>

        {/* Optional: accounts */}
        <h2 className="mb-3 mt-10 font-display text-[15px] font-bold uppercase tracking-wide text-ink-faint">
          Want to save your work? (optional)
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[15px] leading-relaxed text-ink-soft">
            You don’t need an account to make and download flyers — that always works for free. But if
            you’d like to save your work, tap <Pill>👋 Sign in</Pill> at the top and enter your email.
            We’ll send you a sign-in link — <strong>no password to remember</strong>. Once you’re in,
            you can:
          </p>
          <ul className="mt-3 grid gap-2 text-[15px] leading-relaxed text-ink">
            <Bullet>Save flyers and reopen them later to tweak or re-download.</Bullet>
            <Bullet>
              Set up a <strong>Rescue profile</strong> (name, phone, website, logo) that fills itself
              in on every new flyer.
            </Bullet>
            <Bullet>Save a look you love as your own reusable template.</Bullet>
            <Bullet>Share a great template with the whole rescue community.</Bullet>
          </ul>
        </div>

        {/* Privacy reassurance */}
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong bg-sunken px-5 py-5 text-center">
          <p className="text-2xl" aria-hidden>🔒</p>
          <p className="mt-1.5 text-[15px] font-semibold text-ink">Your privacy comes first</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] leading-relaxed text-ink-soft">
            Bastet is 100% free and open source. No ads, no tracking, no analytics of any kind. Your
            photos and details stay yours.
          </p>
        </div>

        {/* Closing CTA */}
        <div className="mt-10 text-center">
          <a
            href="#"
            onClick={navHome}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[16px] font-bold text-on-primary shadow-lift transition hover:bg-primary-hover"
          >
            <BackArrow />
            Start making your flyer
          </a>
          <p className="mt-4 text-[13px] text-ink-faint">
            Still stuck? Ask whoever shared Bastet with you — or your rescue’s coordinator.
          </p>
        </div>
      </main>
    </div>
  )
}

// Leave the help route and return to the editor. Removes the hash entirely (so we land back on the
// plain editor, not a lingering `#`) and notifies App's hashchange listener.
function navHome(e) {
  e.preventDefault()
  history.pushState('', document.title, window.location.pathname + window.location.search)
  window.dispatchEvent(new Event('hashchange'))
}

function Step({ n, glyph, title, body }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-[18px] font-extrabold text-ink">
        {n}
      </div>
      <div className="grid content-start gap-1">
        <h3 className="flex items-center gap-2 text-[16px] font-bold text-ink">
          <span aria-hidden>{glyph}</span>
          {title}
        </h3>
        <p className="text-[15px] leading-relaxed text-ink-soft">{body}</p>
      </div>
    </article>
  )
}

function Tip({ glyph, title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
        <span aria-hidden>{glyph}</span>
        {title}
      </h3>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  )
}

function Bullet({ children }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="mt-0.5 text-primary">✓</span>
      <span>{children}</span>
    </li>
  )
}

// An inline reference to a UI control, styled like a small chip so the instruction "tap X" is
// visually unmistakable.
function Pill({ children }) {
  return (
    <span className="mx-0.5 inline-flex items-center whitespace-nowrap rounded-md border border-border bg-sunken px-1.5 py-0.5 text-[13px] font-semibold text-ink">
      {children}
    </span>
  )
}

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 12H5m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
