/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — defined as OKLCH CSS vars in src/index.css (light + dark).
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        sunken: 'var(--sunken)',
        raised: 'var(--raised)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-press': 'var(--primary-press)',
        'primary-soft': 'var(--primary-soft)',
        'on-primary': 'var(--on-primary)',
        secondary: 'var(--secondary)',
        'secondary-soft': 'var(--secondary-soft)',
        'on-secondary': 'var(--on-secondary)',
        gold: 'var(--gold)',
        success: 'var(--success)',
      },
      fontFamily: {
        display: ['Gabarito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        canvas: '0 24px 60px -24px var(--shadow-canvas), 0 4px 12px -6px var(--shadow-soft)',
        panel: '0 1px 2px var(--shadow-soft)',
        lift: '0 12px 28px -14px var(--shadow-canvas)',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // ease-out-quint for natural deceleration (no bounce/elastic)
        'rise-in': 'rise-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [],
}
