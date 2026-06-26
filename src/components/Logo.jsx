// Subtle Bastet nod: a small, friendly geometric cat mark + the wordmark in Gabarito.
export default function Logo({ className = '' }) {
  return (
    <span className={'flex items-center gap-2.5 ' + className}>
      <CatMark />
      <span className="font-display text-[22px] font-bold leading-none text-ink">
        Bastet
      </span>
    </span>
  )
}

function CatMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden role="img">
      {/* ears */}
      <path d="M7.5 6.5 L12.5 12 L6 13.5 Z" fill="var(--gold)" />
      <path d="M24.5 6.5 L19.5 12 L26 13.5 Z" fill="var(--gold)" />
      {/* head */}
      <circle cx="16" cy="18" r="9.2" fill="var(--gold)" />
      {/* eyes */}
      <circle cx="12.6" cy="17.2" r="1.5" fill="#2b211a" />
      <circle cx="19.4" cy="17.2" r="1.5" fill="#2b211a" />
      {/* nose */}
      <path d="M14.6 20.4 L17.4 20.4 L16 22.1 Z" fill="#2b211a" />
      {/* whiskers */}
      <g stroke="#2b211a" strokeWidth="0.9" strokeLinecap="round" opacity="0.8">
        <path d="M16 21.6 V23.3" />
        <path d="M16 23.3 C 13.8 23.3 12.4 22.2 11.4 21.4" />
        <path d="M16 23.3 C 18.2 23.3 19.6 22.2 20.6 21.4" />
      </g>
    </svg>
  )
}
