# Bastet — Lessons

## Dev: stale Vite/Tailwind JIT after a long session (2026-06-26)
**Symptom:** custom Tailwind color utilities backed by CSS vars (`bg-surface`, `bg-primary`,
etc.) rendered **transparent** in the browser — most visible on the size dropdown, whose panel
you could see straight through. Text colors still looked right (they inherit `--ink` from the
`body` rule, so the broken `text-*` utilities were masked).

**Root cause:** a Vite dev server left running across many `tailwind.config.js` / `index.css`
edits accumulated a stale JIT CSS cache. The **built** CSS was correct
(`.bg-surface{background-color:var(--surface)}`), so production was never affected.

**Fix / rule:** after substantial Tailwind theme/config changes in a long session, restart the
dev server (and clear `node_modules/.vite` if needed) rather than trusting HMR:
`stop.bat` → `start.bat`, or kill port 5173 and `npm run dev`. When a utility "doesn't work,"
diff the **built** CSS against the dev DOM's computed style before assuming a code bug.

**Note on var-based oklch colors:** the `colors: { x: 'var(--x)' }` pattern in tailwind.config
emits raw `background-color: var(--x)` (opaque) — it does NOT wrap in `rgb(var(--x)/alpha)`, so
oklch CSS vars are safe here. Just don't use `/opacity` modifiers on them (use `color-mix` —
see TopBar's translucent header bg).
