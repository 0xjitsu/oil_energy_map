# Wave 2B — Design System & Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore design-token discipline so the crisis-adaptive color system works end-to-end, and bring the dashboard to WCAG AA — global focus ring, keyboard-accessible controls, an uncramped mobile nav, and no hardcoded colors.

**Architecture:** A `globals.css` foundation pass, a systematic replacement of ~180 hardcoded color values with the existing `status-*` design tokens, plus targeted accessibility fixes. No new dependencies — `lucide-react` is already installed; the existing `status-green` / `status-red` / `status-yellow` tokens already cover every semantic color.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, lucide-react, Vitest.

---

## Context for the engineer

Brownfield Next.js 14 dashboard. Package manager **pnpm**; agent shells need `export PATH="/opt/homebrew/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"`. Path alias `@/*` → `./src/*`. Build is `pnpm build`, lint `pnpm lint`, tests `pnpm test` — all must pass before each commit. Commit messages: lowercase imperative. Do NOT push to any remote.

**Why hardcoded colors are a real bug, not just style:** `globals.css` defines `--accent-primary` and the crisis tokens in `:root`. `CrisisProvider` overrides them at runtime on `document.documentElement` based on a computed risk level (blue → amber → red). Components that use `var(--...)` or token classes shift color during a crisis; components that hardcode `text-red-400` / `bg-emerald-500` never shift. The `CLAUDE.md` token table is the law: **never hardcode color values.**

**Token mapping — use throughout this plan.** The existing tokens in `tailwind.config.ts` already cover every case; **no new tokens are needed.**

| Hardcoded class (any opacity suffix) | Replace with |
|--------------------------------------|--------------|
| `text-red-400`, `text-red-300`, `text-red-500` | `text-status-red` |
| `bg-red-400`, `bg-red-500`, `bg-red-400/10`, `bg-red-500/8`, `bg-red-500/20` | `bg-status-red` (keep the `/NN` opacity suffix) |
| `border-red-500/30`, `border-red-500/20` | `border-status-red/30` etc. |
| `text-emerald-400`, `text-emerald-300`, `text-green-400` | `text-status-green` |
| `bg-emerald-400`, `bg-emerald-500`, `bg-emerald-500/20`, `bg-green-500/10` | `bg-status-green` (keep `/NN`) |
| `border-emerald-500/30` | `border-status-green/30` |
| `text-yellow-400`, `text-amber-400`, `text-amber-300` | `text-status-yellow` |
| `bg-yellow-400`, `bg-yellow-500`, `bg-amber-400`, `bg-amber-500`, `bg-yellow-500/20`, `bg-amber-400/10` | `bg-status-yellow` (keep `/NN`) |
| `border-yellow-500/30`, `border-amber-500/20` | `border-status-yellow/30` etc. |
| `text-blue-400`, `bg-blue-500`, `bg-blue-600`, `bg-blue-500/20` | `text-petron` / `bg-petron` (the existing brand-blue token) |
| Raw `rgba(255,255,255,0.NN)` in SVG `fill`/`stroke` | the matching `var(--text-*)` / `var(--border*)` CSS variable |
| Hex passed as a prop (e.g. `sparkColor: '#34d399'`) | `'var(--status-green)'` / `'var(--status-red)'` etc. |

Opacity suffixes are preserved: `bg-red-500/8` → `bg-status-red/8`.

**Wave ordering:** This wave shares three files with Wave 2A (`ExecutiveSnapshot.tsx`, `VitalSigns.tsx`, `PricePanel.tsx`). **Run Wave 2A to completion and merge it before starting Wave 2B**, so the color sweep operates on the final version of those files and there are no merge conflicts.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/app/globals.css` | Remove duplicate `.fade-in-section`; add global `:focus-visible` ring + `::selection` |
| Modify | `src/components/layout/ActDivider.tsx` | Move parallax transform to an inner background layer |
| Modify | `src/components/layout/MobileBottomNav.tsx` | Replace emoji icons with lucide-react icons |
| Modify | `src/components/layout/SectionNav.tsx` | Replace emoji icons with lucide-react icons |
| Modify | `src/app/layout.tsx` + 6 page files | Per-page-correct skip-link target |
| Modify | `src/components/layout/ExecutiveSnapshot.tsx` | HeroKPI `<div>`→`<button>`; color sweep; `getRiskLevel` lookup table |
| Modify | `src/components/layout/Header.tsx` | Hamburger mobile nav; color sweep of the live/static badge |
| Modify | ~14 files (cluster sweeps) | Replace hardcoded color classes with `status-*` tokens |

---

## Task 1: `globals.css` foundation — dedupe, focus ring, selection

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove the duplicate `.fade-in-section` block**

`globals.css` defines `.fade-in-section` twice. The first definition (under the comment `/* Section fade-in animation */`, using `translateY(20px)` and `ease`) is dead — the later definition wins. Delete the FIRST block entirely — these 11 lines:
```css
/* Section fade-in animation */
.fade-in-section {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in-section.pending {
  opacity: 0;
  transform: translateY(20px);
}
.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}
```
Leave the SECOND definition (under `/* Fade-in stagger animation */`, `translateY(12px)`, `ease-out`) intact.

- [ ] **Step 2: Add a global `:focus-visible` ring**

Find the CSS reset block (the `*, *::before, *::after { box-sizing: border-box; }` rule near the top). Immediately after that rule, add:
```css
/* Global keyboard-focus ring — crisis-aware via --accent-primary */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Add dark-theme `::selection` styling**

After the scrollbar rules (search for `scrollbar` or `::-webkit-scrollbar`; add this after that group, or at the end of the base layer if no scrollbar rules exist):
```css
/* Text selection — subtle brand-blue tint for the dark theme */
::selection {
  background: rgba(59, 130, 246, 0.25);
  color: var(--text-primary);
}
```

- [ ] **Step 4: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "dedupe fade-in-section, add global focus ring and selection styling"
```

---

## Task 2: Fix the `ActDivider` parallax jank

`ActDivider` applies a `transform: translateY()` parallax to the OUTER container — which holds the gradient background AND the text content AND the `ref`. This shifts content in document flow and janks adjacent sections. The transform must move to an inner absolutely-positioned background layer.

**Files:**
- Modify: `src/components/layout/ActDivider.tsx`

- [ ] **Step 1: Read the file**

Read `src/components/layout/ActDivider.tsx`. The outer `<div ref={ref}>` currently has `style={{ background: linear-gradient(...), transform: translateY(${bgOffset}px) }}` and `className` includes `relative ... overflow-hidden`.

- [ ] **Step 2: Move the gradient + transform to an inner layer**

Change the outer `<div ref={ref}>` so it KEEPS `ref`, `relative`, `overflow-hidden`, layout/spacing classes — but drops both the `background` and `transform` from its `style` (the outer `style` prop becomes empty / can be removed). Then insert, as the FIRST child of that div, an absolutely-positioned background layer:
```tsx
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          transform: `translateY(${bgOffset}px)`,
        }}
      />
```
All existing children (the `::before`/`::after` border lines via className, the `<section>` text content) stay exactly as they are, after this new background layer. The text content now sits in normal flow with no transform, while only the background parallaxes within the `overflow-hidden` clip.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, scroll the dashboard past an Act divider — confirm the divider's gradient shifts subtly while the heading text stays put and adjacent sections do not jump. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ActDivider.tsx
git commit -m "fix ActDivider parallax jank by isolating the background layer"
```

---

## Task 3: Replace emoji nav icons with lucide-react

`MobileBottomNav` and `SectionNav` use raw emoji as navigation icons — inconsistent rendering, verbose screen-reader output, off-brand. Replace with `lucide-react` icons (already a dependency).

**Files:**
- Modify: `src/components/layout/MobileBottomNav.tsx`
- Modify: `src/components/layout/SectionNav.tsx`

Icon mapping (lucide-react component names): Overview/Home → `BarChart3`, Map → `Map`, Prices → `TrendingUp`, Stations/tracker → `Fuel`, Scenario/Plan → `SlidersHorizontal`, Analysis/stress-test → `Activity`, Market/players → `Building2`.

- [ ] **Step 1: Update `MobileBottomNav.tsx`**

Read the file. It has a `MOBILE_SECTIONS` array where each entry has `{ id, label, icon }` with `icon` a string emoji, and renders `<span className="text-base">{icon}</span>`.

Add at the top: `import { BarChart3, Map, TrendingUp, SlidersHorizontal, Building2, type LucideIcon } from 'lucide-react';`

Change the `MOBILE_SECTIONS` array so each `icon` is a `LucideIcon` component reference instead of an emoji string — e.g. `{ id: 'snapshot', label: 'Home', icon: BarChart3 }`, `{ id: 'map', label: 'Map', icon: Map }`, `{ id: 'prices', label: 'Prices', icon: TrendingUp }`, `{ id: 'scenario', label: 'Plan', icon: SlidersHorizontal }`, `{ id: 'players', label: 'Market', icon: Building2 }`. Type the array element's `icon` field as `LucideIcon`.

In the render, replace `<span className="text-base">{icon}</span>` with `<Icon className="w-4 h-4" aria-hidden="true" />` where `Icon` is the destructured component (rename the map variable from `icon` to `Icon` so JSX treats it as a component, e.g. `const { id, label, icon: Icon } = section;`).

- [ ] **Step 2: Update `SectionNav.tsx`**

Read the file. Same pattern — a sections array with emoji `icon` strings, rendered as `<span className="text-xs">{icon}</span>`. Add a lucide import covering its sections (it has 7: includes a `Fuel`/⛽ and `Activity`/🎲 in addition to the five above — use `import { BarChart3, Map, TrendingUp, Fuel, SlidersHorizontal, Activity, Building2, type LucideIcon } from 'lucide-react';`). Replace each emoji with the matching component reference, render as `<Icon className="w-3.5 h-3.5" aria-hidden="true" />`. Keep the existing `title={label}` attribute on the `<a>`.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileBottomNav.tsx src/components/layout/SectionNav.tsx
git commit -m "replace emoji nav icons with lucide-react icons"
```

---

## Task 4: Per-page-correct skip link

`layout.tsx` hardcodes the skip-link target as `#snapshot`, which exists only on the dashboard. On `/cascade`, `/primer`, `/references`, `/roadmap`, `/services` the skip link goes nowhere. Fix: target a stable `#main-content` id present on every page.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`, `src/app/cascade/page.tsx` (or its client component), `src/app/primer/page.tsx`, `src/app/references/page.tsx`, `src/app/roadmap/page.tsx`, `src/app/services/page.tsx`

- [ ] **Step 1: Point the skip link at `#main-content`**

In `src/app/layout.tsx`, change the skip link `href="#snapshot"` to `href="#main-content"`.

- [ ] **Step 2: Add `id="main-content"` to each page's main landmark**

For each of the 6 routes, locate the primary content landmark — the `<main>` element if present, otherwise the outermost content wrapper `<div>`/`<section>` after the `<Header>`. Add `id="main-content"` to it (and `tabIndex={-1}` so it can receive focus when jumped to). For the dashboard `src/app/page.tsx`, the `<main className="max-w-[1600px] ...">` element gets `id="main-content" tabIndex={-1}`.

For each route, read the page file first. If a route renders its content through a separate client component (e.g. `CascadePage`), add the id to the `<main>` (or top wrapper) inside that component. Every route must end up with exactly one `id="main-content"` element. Do not remove the dashboard's existing `id="snapshot"` — keep it; just additionally ensure the `<main>` has `id="main-content"`.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, visit `/primer`, press Tab once — the "Skip to main content" link appears; activate it and confirm focus jumps into the page body. Stop the dev server.

- [ ] **Step 5: Commit**

Stage `src/app/layout.tsx` plus each specific page/component file you modified in Step 2 — name them explicitly (do not use `git add -A` or directory adds). Example:
```bash
git add src/app/layout.tsx src/app/page.tsx src/app/cascade/CascadePage.tsx src/app/primer/page.tsx src/app/references/page.tsx src/app/roadmap/page.tsx src/app/services/page.tsx
git commit -m "make the skip link target a per-page main-content landmark"
```
Adjust the exact filenames to match what you actually edited (a route may use `page.tsx` directly or a separate client component).

---

## Task 5: `ExecutiveSnapshot` — accessible KPI cards + token sweep

This task owns the entire `ExecutiveSnapshot.tsx` file: convert the clickable HeroKPI `<div>` to a `<button>`, replace the dynamic class-string `getRiskLevel()` with a token lookup, and sweep all hardcoded colors.

**Files:**
- Modify: `src/components/layout/ExecutiveSnapshot.tsx`

- [ ] **Step 1: Convert the HeroKPI `<div onClick>` to a `<button>`**

The `HeroKPI` component renders a `<div className="glass-card ... cursor-pointer ..." onClick={...}>`. Convert that `<div>` to a `<button type="button">`:
- Move the `style={{ borderTop: ... }}` to the button.
- Add `aria-label={`View details for ${label}`}` (use the component's `label` prop).
- Add `className` additions `text-left w-full` so the button does not inherit centered/inline button defaults.
- Keep the existing `onClick`. Remove the `cursor-pointer` class (a `<button>` is already a pointer; keep it only if other elements rely on it — harmless either way).
- The closing tag becomes `</button>`.

- [ ] **Step 2: Replace `getRiskLevel()` dynamic class strings with a token lookup**

`getRiskLevel()` returns hardcoded Tailwind class strings (`'text-red-400'`, `'text-amber-400'`, `'text-yellow-400'`, `'text-emerald-400'`). Change it to return a semantic key, and add a lookup object mapping that key to a token class:
```tsx
type RiskTone = 'danger' | 'warning' | 'caution' | 'ok';

const RISK_TONE_CLASS: Record<RiskTone, string> = {
  danger: 'text-status-red',
  warning: 'text-status-red',
  caution: 'text-status-yellow',
  ok: 'text-status-green',
};
```
Refactor `getRiskLevel()` to return a `RiskTone`, and at each call site use `RISK_TONE_CLASS[tone]`. (Map the old four classes: `red`→`danger`, `amber`→`warning`, `yellow`→`caution`, `emerald`→`ok`. `amber` and `red` both map to `text-status-red` since there is no distinct amber token — that is acceptable; the crisis system handles intensity.)

- [ ] **Step 3: Sweep the remaining hardcoded colors**

Apply the token-mapping table from the Context section to every remaining hardcoded color in the file — the delta badge (`text-red-400 bg-red-400/10` / `text-emerald-400 bg-emerald-400/10`), the live-dot `bg-emerald-400`, the `StatusBadge` disruptions colors, and any others. After this task, `grep -n "red-4\|emerald-4\|amber-4\|yellow-4\|green-4\|blue-[456]" src/components/layout/ExecutiveSnapshot.tsx` must return nothing.

- [ ] **Step 4: Verify lint, build, and the grep**

Run: `pnpm lint && pnpm build` (both succeed) and the grep above (no output).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ExecutiveSnapshot.tsx
git commit -m "make ExecutiveSnapshot KPI cards keyboard-accessible and token-driven"
```

---

## Task 6: `Header` — hamburger mobile nav + token sweep

This task owns the entire `Header.tsx` file: replace the cramped 6-link mobile nav (six `text-[9px]` links) with a hamburger button + slide-down panel, and sweep the live/static badge colors.

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Read the file and add imports**

Read `Header.tsx`. It is `'use client'`, has a `NAV_LINKS` array (6 entries), a desktop `<nav className="hidden sm:flex ...">`, and a mobile `<nav className="sm:hidden flex ...">` (the cramped one). Add `useState` to the existing React import, and add `import { Menu, X } from 'lucide-react';`.

- [ ] **Step 2: Add mobile-menu state**

Inside the `Header` component, add: `const [mobileMenuOpen, setMobileMenuOpen] = useState(false);`

- [ ] **Step 3: Replace the cramped mobile `<nav>` with a hamburger toggle + panel**

Delete the entire `<nav className="sm:hidden flex items-center gap-1 px-4 pb-2">...</nav>` block. In its place, add a hamburger button in the header's right-hand control cluster (the `<div className="flex items-center gap-3">` that holds the help button / AlertBell / badge) — add as the first child of that cluster:
```tsx
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="sm:hidden p-2 -m-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
```
Then, after the header's main row (and after the `Ticker`, or wherever is structurally the end of the `<header>` content), add the slide-down panel:
```tsx
      {mobileMenuOpen && (
        <nav className="sm:hidden border-t border-border-subtle bg-bg-card/95 backdrop-blur-xl">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 min-h-[44px] font-mono text-xs uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'text-text-primary bg-border-hover'
                    : 'text-text-secondary hover:text-text-body hover:bg-surface-hover'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
```
Each link is a full-width 44px-tall row — no more 9px cramming.

- [ ] **Step 4: Sweep the live/static badge colors**

The LIVE/STATIC badge uses `border-emerald-500/20 bg-emerald-500/10 text-emerald-400` and `border-amber-500/20 bg-amber-500/10 text-amber-400`, and the ping dot uses `bg-emerald-400` / `bg-amber-400`. Replace per the token table: emerald → `status-green`, amber → `status-yellow`. After this task, `grep -n "emerald-\|amber-\|red-4\|blue-[456]" src/components/layout/Header.tsx` must return nothing.

- [ ] **Step 5: Verify lint, build, and the grep**

Run: `pnpm lint && pnpm build` (both succeed) and the grep above (no output).

- [ ] **Step 6: Manual check**

Run `pnpm dev`, narrow the viewport to 375px — confirm the 6 nav links are gone from the header row, the hamburger appears, tapping it reveals a clean stacked menu with 44px rows, and tapping a link navigates and closes the menu. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "replace cramped mobile nav with an accessible hamburger menu"
```

---

## Task 7: Color token sweep — health & prices cluster

Replace hardcoded color classes with `status-*` tokens, per the Context mapping table, in the health and prices components.

**Files:**
- Modify: `src/components/health/EventTimeline.tsx`
- Modify: `src/components/health/SentimentGauge.tsx`
- Modify: `src/components/health/VitalSigns.tsx`
- Modify: `src/components/prices/PricePanel.tsx`
- Modify: `src/components/ui/Ticker.tsx`

- [ ] **Step 1: Apply the mapping to each file**

For each file above, read it and replace every hardcoded Tailwind color class (`text-red-400`, `bg-emerald-500/8`, `border-yellow-500/30`, `text-amber-400`, `text-blue-400`, etc.) with the matching `status-*` / `petron` token from the Context mapping table, preserving every opacity suffix. For `SentimentGauge.tsx`, the `sparkColor` hex strings passed as props (`'#34d399'`, `'#f87171'`) become `'var(--status-green)'` / `'var(--status-red)'`. For `VitalSigns.tsx`, the `STATUS_STYLES` object's badge classes get swept; the existing `var(--status-*, #hex)` fallbacks inside `getGaugeConfig` are already correct CSS-variable usage — leave those.

- [ ] **Step 2: Verify the sweep**

Run: `grep -rn "red-3\|red-4\|red-5\|emerald-3\|emerald-4\|emerald-5\|green-4\|green-5\|yellow-4\|yellow-5\|amber-3\|amber-4\|amber-5\|blue-4\|blue-5\|blue-6" src/components/health/EventTimeline.tsx src/components/health/SentimentGauge.tsx src/components/health/VitalSigns.tsx src/components/prices/PricePanel.tsx src/components/ui/Ticker.tsx`
Expected: no output.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/health/EventTimeline.tsx src/components/health/SentimentGauge.tsx src/components/health/VitalSigns.tsx src/components/prices/PricePanel.tsx src/components/ui/Ticker.tsx
git commit -m "replace hardcoded colors with design tokens in health and prices components"
```

---

## Task 8: Color token sweep — scenarios, consumer & players cluster

**Files:**
- Modify: `src/components/scenarios/ResultPanel.tsx`
- Modify: `src/components/scenarios/ConfidenceFan.tsx`
- Modify: `src/components/scenarios/StressTest.tsx`
- Modify: `src/components/timeline/TimelineScrubber.tsx`
- Modify: `src/components/consumer/PersonaCard.tsx`
- Modify: `src/components/consumer/ImpactResult.tsx`
- Modify: `src/components/players/PlayerCards.tsx`

- [ ] **Step 1: Apply the mapping to each file**

For each file, replace hardcoded color classes per the Context mapping table, preserving opacity suffixes. Notes:
- `ConfidenceFan.tsx` uses percentile-shade colors `text-emerald-300` / `text-amber-300`; map both to the nearest token (`text-status-green` / `text-status-yellow`) — exact percentile shading is not worth a custom token.
- `StressTest.tsx` and `MarketShare.tsx`-style raw `rgba(255,255,255,0.NN)` in SVG `fill`/`stroke` attributes: replace with the matching `var(--text-*)` / `var(--border*)` CSS variable (e.g. `rgba(255,255,255,0.4)` ≈ `var(--text-label)` — pick the closest existing variable; if none is close, leave the rgba but add a `// TODO` is NOT allowed — instead use `var(--text-subtle)` as the general-purpose faint-white token).
- `PlayerCards.tsx` does dynamic class generation via `color.replace('text-', 'bg-')` on hardcoded class strings. Replace that pattern with an explicit lookup: define a small `const TONE: Record<string, { text: string; bg: string }>` keyed by a semantic tone, and select from it rather than string-manipulating class names.

- [ ] **Step 2: Verify the sweep**

Run `grep -rn "red-3\|red-4\|red-5\|emerald-3\|emerald-4\|emerald-5\|green-4\|green-5\|yellow-4\|yellow-5\|amber-3\|amber-4\|amber-5\|blue-4\|blue-5\|blue-6"` against the 7 files above — expect no output.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/scenarios src/components/timeline/TimelineScrubber.tsx src/components/consumer/PersonaCard.tsx src/components/consumer/ImpactResult.tsx src/components/players/PlayerCards.tsx
git commit -m "replace hardcoded colors with design tokens in scenario, consumer and player components"
```

---

## Task 9: Color token sweep — map, services & shared primitives cluster

**Files:**
- Modify: `src/components/map/MapToolbarPanel.tsx`
- Modify: `src/components/services/BeforeAfter.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/players/MarketShare.tsx`
- Plus: any remaining file flagged by the final grep in Step 2.

- [ ] **Step 1: Apply the mapping**

Sweep the listed files per the Context mapping table. `Badge.tsx` is a shared primitive — fixing it cascades to every consumer, so be precise. `MarketShare.tsx` SVG `fill="rgba(255,255,255,0.NN)"` → matching `var(--text-*)` variable. `BeforeAfter.tsx` uses `bg-blue-500/10 text-blue-400` → `bg-petron/10 text-petron`.

- [ ] **Step 2: Whole-codebase sweep verification**

Run: `grep -rn "text-red-[345]\|text-emerald-[345]\|text-green-[45]\|text-yellow-[45]\|text-amber-[345]\|text-blue-[456]\|bg-red-[45]\|bg-emerald-[45]\|bg-green-[45]\|bg-yellow-[45]\|bg-amber-[45]\|bg-blue-[456]" src/components/ --include="*.tsx"`
Expected: no output. If any file still appears, sweep it too and re-run. (The `/services` page CTA may legitimately keep a `bg-blue-600` button if it predates the token system — if so, map it to `bg-petron` for consistency.)

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

Stage each file you swept by explicit name (do not use `git add -A` or directory adds). Start with the four named files, and append any additional files the Step 2 grep forced you to sweep:
```bash
git add src/components/map/MapToolbarPanel.tsx src/components/services/BeforeAfter.tsx src/components/ui/Badge.tsx src/components/players/MarketShare.tsx
git commit -m "complete the design-token color sweep across remaining components"
```

---

## Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite + build + lint**

Run: `pnpm test && pnpm build && pnpm lint`
Expected: all tests pass; build clean; lint shows no errors and no new warnings.

- [ ] **Step 2: Whole-codebase color-violation grep**

Run the Step 2 grep from Task 9 again across all of `src/`. Expected: no output — zero hardcoded status colors remain in components.

- [ ] **Step 3: Accessibility manual check**

Run `pnpm dev`. Confirm: tabbing through the dashboard shows a visible focus ring on every interactive element (nav links, KPI cards, buttons, sliders); the KPI cards are reachable by keyboard and activate on Enter; the mobile hamburger menu works at 375px; the skip link works on a sub-page. Optionally run Lighthouse — Accessibility should be ≥ 95.

- [ ] **Step 4: Crisis-color cascade check**

With the dev server running, confirm that status-colored elements (badges, deltas) use the token system — they should now visually respond when the crisis level changes (the `data-crisis-level` attribute on `<html>` drives `--accent-primary`). A spot-check: no status element should be a "dead" color that ignores the crisis shift.

---

## Self-Review Notes

- **Spec coverage:** Implements WS3 (Design System & Accessibility) from `docs/superpowers/specs/2026-05-17-100x-platform-upgrade-design.md` — token sweep (T5–T9), global focus ring (T1), `<button>` KPI cards (T5), mobile nav redesign (T6), `globals.css` dedupe + `::selection` (T1), emoji→SVG icons (T3), `ActDivider` parallax fix (T2), per-page skip link (T4).
- **No new tokens:** The research confirmed the existing `status-green` / `status-red` / `status-yellow` tokens cover every semantic color — the spec's proposed `status-success`/`danger`/`warning` aliases would be redundant, so they are deliberately NOT added (YAGNI).
- **File ownership:** Each file is owned by exactly one task — `ExecutiveSnapshot` (T5) and `Header` (T6) each get a single task that does BOTH their accessibility fix AND their color sweep, so no two tasks edit the same file.
- **Wave ordering:** Wave 2A must merge before Wave 2B starts — they share `ExecutiveSnapshot.tsx`, `VitalSigns.tsx`, `PricePanel.tsx`. Sweeping after 2A merges avoids conflicts and ensures the sweep covers 2A's additions.
- **Placeholder check:** The color-sweep tasks (T7–T9) are mapping-driven rather than line-by-line — that is the honest form for a ~180-occurrence mechanical sweep: the complete "code" is the exact mapping table plus the verification grep that proves zero violations remain.
