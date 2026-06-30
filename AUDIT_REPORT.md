# Code Audit Report — Bastet
PRD: bastet-PRD.md
CLAUDE.md: CLAUDE.md
Files scanned: 42 (src/**/*.js(x), src/worker/**/*.js, migrations/*.sql, root configs + bats; excluded node_modules, dist, package-lock, .wrangler tmp, tasks internals)
Checked: 2026-06-29

---

## Part A — PRD / CLAUDE.md Alignment

### ✅ Aligned
- Canvas editor core (drag/zoom photo reframing without auto-crop, built-in text fields, badge toggles, adoption fee, foster-vs-adopt, contact block, rescue logo) → src/components/editor/FlyerPhoto.jsx:1, Editor.jsx:100, state/EditorContext.jsx:180 (loadPhoto/setPhotoTransform), BadgeLayer.jsx, ContactBlock.jsx, FlyerText.jsx, ControlPanel.jsx
- 4 output sizes with human labels + auto-refit across sizes → src/lib/outputSizes.js:3 (instagram_post/story, facebook_post, print_letter), src/lib/refit.js:1
- Export PNG (with font load) + PDF via jsPDF wrapper (no headless) → src/lib/export.js:15 (exportToPNG + exportToPDF), exportThumbnailBlob
- Curated Google Fonts list (~25, not full catalog) + stylesheet + readiness → src/lib/fonts.js:5 (FONTS), hooks/useFonts.js:1
- Bundled templates (6) using semantic field-bound elements (photo|text|metaText|custom|badges|fee|tag|contact|rect) → src/templates/index.js:172 (TEMPLATES), src/lib/defaultFlyer.js:20 (squareFlyer)
- Community template browser (approved only) + Tier 2 submission → src/components/templates/CommunityTemplates.jsx, TemplateGallery.jsx, src/lib/communityApi.js:5, worker/routes/templates.js:20 (listApprovedTemplates + POST pending)
- Magic link auth (Tier 2), hashed tokens only, 30-day sessions → src/worker/routes/auth.js:40 (request-link + verify), lib/crypto.js:4, lib/session.js:1
- Rescue profile auto-populate + custom fields persist for Tier 2 → src/components/editor/Editor.jsx:20 (ProfileAutofill, CustomFieldsSync), state/EditorContext.jsx:82 (applyProfile), worker/routes/me.js:50
- Admin approval queue (bearer, not session) + pending list → src/worker/routes/admin.js:10, lib/admin.js:10 (requireAdmin), src/components/admin/AdminPage.jsx
- No telemetry/analytics/tracking of any kind in source — documented in README
- D1 always uses prepared statements + .bind() → worker/lib/db.js throughout
- R2 upload size limits + magic-byte validation (no SVG) → worker/lib/upload.js:20 (readImageUpload + SIGNATURES), MAX_* in routes/me.js and templates.js
- Session cookies: httpOnly + SameSite=Lax + conditional Secure → src/worker/routes/auth.js:106
- Font load before any toDataURL — enforced in export paths → src/lib/export.js:15, hooks/useFonts.js
- Portrait photo UX: user drag/zoom inside clip, never auto-crop → src/components/editor/FlyerPhoto.jsx:30 (clipFunc + draggable pan/scale)

### ⚠️ Deviations
**[Custom field "Dropdown" type]** — Confidence: Confirmed
- Spec says: PRD §5.1 Must-Have and §7: custom fields support "Text, Badge/Boolean, Dropdown". Custom fields use prefix `custom_`.
- Code does: addCustomField only branches on 'text' | 'badge'; no dropdown/select handling, storage, or renderer. See src/state/EditorContext.jsx:100 (`if (type === 'badge') ... else text`), src/components/fields/CustomFields.jsx:1 and EditorContext seed/rename logic. FIELDS and CUSTOM_FIELD_PREFIX exist (src/lib/fieldBindings.js:25).
- No evidence of planned dropdowns in current renderers (FlyerCustom.jsx handles text/badge only).

**[Outdated project structure and file references in CLAUDE.md]** — Confidence: Confirmed
- Spec says: CLAUDE.md "Project Structure" and "Critical Code Stubs" reference non-existent paths (Stage.jsx, ImageLayer.jsx, TextField.jsx, BadgeLayer.jsx as top-level, useCanvas.js, useAuth.js, src/components/export/, etc.).
- Code does: actual structure uses EditorCanvas.jsx + FlyerPhoto/FlyerText/FlyerCustom/ContactBlock/BadgeLayer (semantic), state/EditorContext + AuthContext, lib/refit + themes + export. The As-Built notes section acknowledges some format changes but the full structure table was not updated.
- Relevant: CLAUDE.md:50 (structure), src/components/editor/ (actual), src/state/ (actual).

**[_routes.json and Pages routing]** — Confidence: Confirmed
- Spec says: CLAUDE.md shows _routes.json example and wrangler.toml stub for CF Pages + Worker routing of /api/*.
- Code does: no _routes.json at root. wrangler.toml:9 uses `[assets] directory = "./dist"`, `not_found_handling`, `run_worker_first = ["/api/*"]` (modern single-Worker static assets model). Vite proxy in dev (vite.config.js:10). Works, but documented mechanism is obsolete.

**[Export pixelRatio and restore logic]** — Confidence: Confirmed
- Spec says: CLAUDE.md critical stub (and Gotcha #2) shows `pixelRatio: 3` + stage restore via `stage.attrs._previewWidth`.
- Code does: src/lib/export.js:15 uses `pixelRatio: 1` (with long comment explaining why: native authoring at target res makes 3x oversample produce ~227 MB print PDFs). Restore uses local `previewWidth/Height` vars. As-Built notes (CLAUDE:10) explicitly call out this intentional change.
- Same pattern in exportThumbnailBlob.

**[Data model extensions not in PRD/CLAUDE schema]** — Confidence: Confirmed
- Spec says: D1 schema in PRD §8 and CLAUDE.md (templates, users, magic_links, sessions, saved_flyers, user_templates). No rate_limits.
- Code does: migrations/0002_rate_limits.sql adds `rate_limits` table. Used for per-IP (auth request-link) and per-email throttling. db.js exposes bumpRateLimit, countRecentMagicLinks, pruneExpiredAuth. Also, saved flyers now carry separate photo bytes in R2 (photoKey) alongside flyer_data — not reflected as a schema column change but an additive storage pattern (routes/me.js:130, 180).
- Comments in 0002 and auth.js explain the practical reason (CF plan limits on WAF + no rate limit binding).

**[Build Checklist state vs reality]** — Confidence: Confirmed
- Spec says: CLAUDE.md "Build Checklist" is entirely `[ ]` unchecked. Many items describe M4/M7/M8 functionality.
- Code does: features for M5 (custom fields), M6 (auth), M7 (profile + save flyers/templates + logo + custom persist), M8 (submit + admin UI) are implemented and wired. Color themes (Nice-to-Have) also shipped. Checklist was not maintained as a living document.

**[PRD API surface is incomplete vs implementation]** — Confidence: Likely
- Spec says: PRD §9 lists core routes. No /api/health, no /me/flyers/:id/{thumb,photo}, no thumb serving for admin review, some DELETE variants.
- Code does: implements the listed + pragmatic additions (health in worker/index.js:10, photo endpoints in me.js, etc.). These are additive and do not contradict security/scope.

### 🚫 Scope Creep
- Color theme system (7 presets + per-flyer custom accent, synced to both flyer roles and app UI hue via OKLCH) — listed as Nice-to-Have (PRD §5.2) and not prohibited by Scope Guard, but is a complete, persisted, cross-cutting feature. src/lib/themes.js:1 (PRESETS + resolvePalette + applyAppTheme), ColorThemePicker.jsx:1, integrated into EditorContext state + ControlPanel + persisted in localStorage + flyer snapshots.
- Other implemented Nice-to-Haves: admin web UI (#admin hash), user private templates, per-flyer photo storage, My Flyers gallery with round-trip fidelity, ShareTemplateModal.

No violations of hard Non-Goals (PRD §5.3 / CLAUDE Scope Guard):
- No AI image gen / background removal
- No direct social posting
- No video/animated output
- No real-time collab
- No paid tiers / feature flags
- No multi-animal litter flyers
- No analytics/tracking pixels/telemetry (verified by grep + README)
- Community submissions require Tier 2 + land pending (no auto-approval)

### ❓ Unverifiable
- "Complete a flyer in under three minutes on first use" (governing constraint) — UX claim, not a static code property. No instrumentation present (correct per no-telemetry rule).
- Exact field type coverage for Dropdown was explicit in PRD but implementation chose a subset; unclear if intentional simplification or incomplete.
- Some PRD risk mitigations (e.g. low-res photo warning) are implemented softly (isLowRes) but UI surface not exhaustively audited here.
- Full Tier 2 end-to-end (Resend deliverability, R2 in prod) cannot be verified from static files alone.

---

## Part B — Code Quality

### 🟠 Orphan Code
None found.
- All major exports are referenced: TEMPLATES/getTemplate, getDefaultFlyer/BADGE_META, FIELDS/CUSTOM_PREFIX, OUTPUT_SIZES, export* functions, useEditor/useAuth/useFonts, all Editor subcomponents (Flyer*, BadgeLayer*, ContactBlock), all field controls, all modals, all api wrappers, all worker routes + lib helpers, theme PRESETS etc.
- Entry points (main.jsx → App → EditorProvider + hash routes for admin/help) cover admin/help surfaces.
- Worker: Hono routes mounted; no stray handlers.
- Confidence: High (cross-checked via multiple greps for import paths + direct identifier references across src + worker).

### 🟠 Over-Engineering
- EditorContext.jsx is a single large provider (~280 lines) holding 15+ pieces of state + derived doc (via refit), many useCallbacks, a heavy useMemo dependency array, and several side-effect sync components (ProfileAutofill, CustomFieldsSync, LogoSync). It works and is well-commented, but centralizes nearly all editor behavior. Simpler alternative: split into smaller focused contexts/hooks (e.g. usePhoto, useCustomFields, usePalette) composed in EditorProvider. (src/state/EditorContext.jsx:1)
- refit + role-based theming + custom field value seeding + per-element font overrides + palette state is sophisticated machinery for "dead simple" goal. Necessary for the reflow + theme + M5/M7 features, but the abstraction surface is wide for a single-canvas tool.

### 🟡 Duplicate Logic
- Stage scaling, font-wait, toDataURL, and size restore is duplicated (with small differences in target sizing) between exportToPNG and exportThumbnailBlob. src/lib/export.js:15-35 vs 41-60.
- Snapshot construction for persistence is repeated three times with near-identical shape + minor omissions (handleSaveFlyer vs handleSaveTemplate vs handleShareTemplate). src/components/editor/Editor.jsx:140 (flyer includes photo state + fields), 170 (layout only), 190 (layout only for community).
- The three Tier-2 api wrapper files (communityApi.js, flyersApi.js, userTemplatesApi.js) are near-identical boilerplate: try { FormData + fetch + json catch } catch { return {ok:false} }.

### 🟡 Inconsistent Patterns
- Error strings are mostly consistent ("Network error...") but vary in exact wording and punctuation across api files and some routes.
- Form handling: some endpoints use parseBody + manual field extraction; others use json(). Correct per content type, but no shared request helpers.
- Most code follows "always prepared statements" and "no console in src" strictly. One place (auth) does opportunistic background prune via executionCtx on 5% of requests — documented.
- UI components use Tailwind + a small custom Controls set (Field, TextArea, Switch, Segmented) — consistent within the app.

### 🔵 Unused Dependencies
- playwright@1.61.1 (devDependencies) — declared but never imported or required anywhere in the tree (no test script, no test/ dir, no references outside package-lock). package.json:28

### 🔵 Dead Code
- No large commented-out blocks or unreachable branches in src/.
- CLAUDE.md contains illustrative "stubs" that are intentionally outdated (As-Built section calls this out).
- dist/ and .wrangler/ are build artifacts.
- Some tasks/*.md files contain historical notes (expected).

---

## Summary

The codebase is in good shape relative to its spec. Core Must-Haves (canvas editor, templates, export fidelity, Tier 2 auth/profile/save flows, community with admin gate, no tracking) are implemented and match the updated "as-built" reality more than the literal early stubs. The architecture (semantic elements + refit + role palettes + client-side state) is coherent and the Worker/D1/R2/auth details follow the security rules in the docs.

The single biggest thing to look at first: the custom-fields implementation only covers Text + Badge while the PRD explicitly requires Dropdown support as part of Must-Have M5. Secondary: bring CLAUDE.md structure, stubs, checklist, and routing notes in line with what actually shipped (or explicitly mark the divergences as permanent).

## For the build agent (e.g. Claude Code)
This report identifies gaps — it does not resolve them. For each Deviation in Part A, decide whether:
(a) the code is wrong and should be brought in line with the spec, or
(b) the spec is stale and CLAUDE.md/PRD should be updated to reflect what was actually (correctly) built.
Do not assume (a) by default. For Part B findings, use judgment on priority — not everything flagged needs immediate action. The color theme feature and rate-limit table are pragmatic additions with clear rationale in comments; treat them as candidates for spec update rather than rollback.