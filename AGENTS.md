# paulogdm.com

Single-page personal site for Paulo G. De Mitri (handle: **paulogdm**). One route, statically
rendered, no backend.

## Stack & commands

- **SvelteKit 2 + Svelte 5** (runes: `$state`, `$derived`, `$props` — no legacy `export let` / stores).
- **`@sveltejs/adapter-static`** — fully prerendered, deployed as static files.
- **pnpm** (`pnpm-lock.yaml`). Install with `pnpm install`.
- Scripts: `pnpm dev` · `pnpm build` · `pnpm preview` (all thin wrappers over Vite).
- **Main branch is `master`** (not `main`). Branch off `master` for new work.

## Where things live

- `src/routes/+page.svelte` — **the entire page.** Markup, all logic, and the canvas easter-egg
  engine live here. This is almost always the file to edit.
- `static/styles.css` — all global CSS, loaded via a `<link>` in `app.html` (not imported through
  Svelte). Design tokens + `h1`, `.social-links`, `.tl-*` timeline styles, etc.
- `src/app.html` — `<head>`, font preloads, and a blocking inline script that resolves the theme
  before first paint.
- `static/vendor/fonts.css` — self-hosted fonts. Add a preload in `app.html` for any new font.
- `static/agents.md`, `static/llms.txt` — **public** files served to external crawlers/LLMs. Not
  for build tooling. Keep career/identity facts here in sync when they change.

## Conventions & gotchas

- **Type system.** Display face is **Spectral** (a serif, weight `400`, used on `h1`); body is
  **Inter Variable**; **Geist** is also self-hosted and available. Root font-size is fluid: `clamp(13px, 1.4vw, 16px)`, so size
  everything in `rem` and it scales.
- **Color tokens** live in `:root` / `html.theme-dark` / `html.theme-light` in `styles.css`. Accent
  is `--accent: #FF6600`. Use the CSS variables, don't hardcode.
- **Theme** = light/dark via a `lights` cookie. The blocking script in `app.html` applies
  `theme-dark`/`theme-light` to `<html>` before paint; `+page.svelte` syncs its reactive state from
  that class on mount. Toggles broadcast over a `BroadcastChannel('theme')` for cross-tab sync.
  Canvas effects that depend on theme read the class **live** so a mid-animation toggle recolors.
- **Easter-egg renderer** (large block in `+page.svelte`): ONE canvas + ONE `requestAnimationFrame`
  loop driving an `effects[]` array. Triggers: click the timeline spark, type `sonar` / `matrix` /
  `vercel` / `clerk`, or the Konami code. Add new effects via `addEffect({ duration, render, ... })`
  rather than spawning a second canvas/RAF.
- **Accessibility floor — keep it.** All motion is gated on `prefersReducedMotion()`; keep visible
  keyboard focus and respect reduced motion in anything new.
- **Career timeline** at the bottom is computed from dates (`tlStart`, `tlNow`, `tlPct`). Tenure
  dates are duplicated in the schema.org `Person` JSON-LD (`personJsonLd`) and in `static/agents.md`
  — update all three together.
