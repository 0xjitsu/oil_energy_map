# Contributing to PH Oil Intelligence Dashboard

## Quick Setup

**Prerequisites**

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| pnpm | Latest stable (`npm install -g pnpm`) |

**Steps**

```bash
git clone <repo-url>
cd oil_energy_map
pnpm install
cp .env.example .env          # fill in your values
pnpm dev                      # starts on http://localhost:3007
```

**Environment variables** — copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `HUGGINGFACE_API_TOKEN` | Yes | Sentiment analysis via `/api/sentiment` |
| `CRON_SECRET` | Yes | Authenticates Vercel cron calls to `/api/cron` |

---

## Project Structure

```
oil_energy_map/
├── src/
│   ├── app/                    # Next.js App Router routes + API endpoints
│   ├── components/
│   │   ├── layout/             # Header, SectionNav, MobileBottomNav
│   │   ├── map/                # deck.gl layers, controls, tooltips
│   │   ├── health/             # System health indicators
│   │   ├── prices/             # Price panels and impact cards
│   │   ├── primer/             # Oil Primer page components
│   │   ├── ui/                 # Shared primitives (Ticker, ScrollProgress, Tooltip)
│   │   └── onboarding/         # How-to guide and onboarding components
│   ├── data/                   # Static data (stations, references, primer content)
│   │   └── stations/           # Per-brand station JSON files (7 files, 10,469 stations)
│   ├── hooks/                  # Custom React hooks (usePrices, useEvents, useSentiment)
│   ├── lib/                    # Utilities and constants
│   └── types/                  # TypeScript interfaces
├── scripts/                    # Data processing scripts (Python/Shell)
├── docs/                       # Architecture docs and specs
└── public/                     # Static assets
```

For a deeper walkthrough of data flows and layer architecture, see `docs/` (if available).

---

## Development Conventions

### Design Tokens

All visual values flow through CSS custom properties defined in `src/app/globals.css` and mapped to Tailwind tokens in `tailwind.config.ts`. **Never hardcode `rgba()`, `hex`, or pixel values directly in components.**

| Purpose | Tailwind Token | Do NOT write |
|---------|---------------|--------------|
| Page background | `bg-bg-primary` | `bg-[#060a10]` |
| Card background | `bg-bg-card` | `bg-[#0a0f1a]` |
| Elevated surface | `bg-bg-elevated` | `bg-[#111827]` |
| Primary text | `text-text-primary` | `text-[rgba(255,255,255,0.9)]` |
| Body text | `text-text-body` | `text-[rgba(255,255,255,0.6)]` |
| Secondary text | `text-text-secondary` | `text-[rgba(255,255,255,0.5)]` |
| Label text | `text-text-label` | `text-[rgba(255,255,255,0.4)]` |
| Default border | `border-border` | `border-[rgba(255,255,255,0.04)]` |
| Subtle border | `border-border-subtle` | `border-[rgba(255,255,255,0.06)]` |

**Brand accent tokens** — use only for brand-specific highlights:

| Brand | Token |
|-------|-------|
| Petron | `text-petron` |
| Shell | `text-shell` |
| Chevron | `text-chevron` |
| Phoenix | `text-phoenix` |
| SeaOil | `text-seaoil` |

**Status tokens**: `text-status-green`, `text-status-yellow`, `text-status-red`

**Philippine flag**: `bg-ph-blue`, `bg-ph-red`, `bg-ph-yellow`

### Glass Morphism

Use the `.glass-card` utility class for all glass surfaces. Do not duplicate its properties inline — the class is already defined in `globals.css`.

```tsx
// Correct
<div className="glass-card p-4">...</div>

// For interactive cards that lift on hover, add .card-interactive
<div className="glass-card card-interactive p-4">...</div>

// Never do this — inline duplication
<div style={{ backdropFilter: 'blur(16px)', background: 'rgba(10,15,26,0.7)' }}>...</div>
```

The `.card-interactive` hover lift is automatically suppressed on touch devices via `@media (hover: none)` — you do not need to add that guard yourself.

### Typography

| Use case | Classes |
|----------|---------|
| UI labels / badges | `font-mono text-[10px] uppercase tracking-widest` |
| Large display numbers | `font-mono text-2xl sm:text-3xl font-bold` |
| Body text | `font-sans text-sm` |
| Coordinates / raw data | `font-mono text-xs` |

### Shared Components

Every page must use the shared `<Header>` from `@/components/layout/Header`. Never create inline headers.

```tsx
import { Header } from '@/components/layout/Header';

// Dashboard page (with scrolling ticker)
<Header />

// Sub-pages (no ticker)
<Header showTicker={false} />
```

### Component Patterns

**Dynamic imports with loading skeletons** — use `dynamic()` with a skeleton `fallback` for non-critical sections to avoid blocking the initial render.

```tsx
const MyPanel = dynamic(() => import('@/components/MyPanel'), {
  loading: () => <div className="glass-card animate-pulse min-h-[200px]" />,
});
```

**Scroll-triggered fade-ins** — wrap sections in `.fade-in-section` and drive visibility with `IntersectionObserver`. Do not default to `opacity: 0` on mount in SSR — check viewport state on mount first to avoid a flash of invisible content.

**Data attribution** — add a source attribution element on all data cards. Live feeds (Brent, PHP/USD) and derived estimates show an `"Est."` badge (`bg-status-yellow/10 text-status-yellow/70`). DOE-sourced pump prices do not get the `"Est."` badge.

### CSS Conventions

| Rule | Correct | Wrong |
|------|---------|-------|
| Accordion open/close | `grid-template-rows: 0fr → 1fr` | Conditional render |
| Page wrapper overflow | `overflow-x-clip` | `overflow-x-hidden` (breaks `position: sticky`) |
| Hover effects | CSS transitions | JS state toggle |
| Animation libraries | CSS keyframes | Framer Motion / GSAP |
| Scroll animations | `IntersectionObserver` | `onScroll` listeners |

`prefers-reduced-motion` support is required on all animations:

```css
@media (prefers-reduced-motion: reduce) {
  .fade-in-section { transition: none; opacity: 1; transform: none; }
}
```

### SSR Safety Checklist

Before using browser-only APIs, check this list:

- [ ] Client components have `'use client'` at the top
- [ ] DOM-dependent logic is inside `useEffect`, not module scope
- [ ] `createPortal` is gated behind a `mounted` state set in `useEffect`
- [ ] `localStorage` is never read in a `useState` initializer — use a `useEffect` with a `loaded` flag
- [ ] `IntersectionObserver` callbacks check viewport on mount, not only on trigger

### Tooltip Pattern

`InfoTip` renders via `createPortal` to `document.body` to escape `overflow: hidden` and `contain: layout` on `.glass-card`. Positioning uses `getBoundingClientRect()` + `position: fixed`. Do **not** add `window.scrollY` — it is intentionally omitted.

### Map Layer Conventions

All deck.gl layers are created via factory functions in `src/components/map/` and must be spread into the `useMemo` array:

```tsx
const deckLayers = useMemo(() => [
  ...createFacilityLayers(...),
  ...createRouteLayers(...),
  ...createStationLayer(...),
], [deps]);
```

Each factory returns `Layer[]`. Never push individual layers imperatively.

---

## Adding a New Component

1. Create the file at the appropriate path under `src/components/<domain>/MyComponent.tsx`
2. Add `'use client'` if the component uses hooks or browser APIs
3. Export a named export (not default): `export function MyComponent(...)`
4. If the component will be dynamically imported, add a skeleton with a fixed `min-h` to prevent layout shift
5. Wire it into the relevant page in `src/app/`
6. Use only Tailwind tokens from the design system table above — no hardcoded values

---

## Adding a New Data Source

1. Create a fetcher function in `src/lib/` (e.g., `src/lib/fetchMySource.ts`)
2. Expose it via an API route in `src/app/api/` if it needs server-side execution (CORS, secrets)
3. Create or extend a hook in `src/hooks/` to poll the API route from the client
4. Add a static fallback value so the UI renders even when the fetch fails
5. If the data is an estimate or derived, render an `"Est."` badge next to the value
6. Document the data source, refresh cadence, and any license restrictions in an inline comment

---

## Git Workflow

```bash
# 1. Branch from main
git checkout -b feat/my-feature main

# 2. Make changes, then run the build gate
pnpm build          # must pass clean — no TypeScript errors, no unused imports

# 3. Stage specific files — never git add -A or git add .
git add src/components/MyComponent.tsx src/app/page.tsx

# 4. Commit with a present-tense imperative message that explains the why
git commit -m "Add price volatility badge to distinguish estimated vs DOE-sourced figures"

# 5. Push and open a PR targeting main
git push origin feat/my-feature
```

**Commit message rules:**
- Present tense, imperative mood: "Add", "Fix", "Remove", "Update"
- Explain the *why*, not just the *what*
- One logical change per commit

**Do not push to `main` directly.** The branch is protected — always go through a PR.

---

## Code Quality

| Check | Command | When to run |
|-------|---------|-------------|
| Type check + build | `pnpm build` | Before every commit |
| Lint | `pnpm lint` | Before every commit |

**TypeScript rules:**
- Strict mode is on — fix all type errors, do not use `any`
- Optional fields in sortable interfaces must use nullish coalescing: `a[sortKey] ?? ""` (prevents `.localeCompare()` errors on `undefined`)
- Add optional fields to interfaces rather than modifying existing required fields (additive schema evolution)

**ESLint rules:**
- No unused imports — ESLint will error on them
- Fix warnings, do not suppress them with `eslint-disable` comments unless there is no other option (and leave a comment explaining why)

**`pnpm build` is the quality gate.** If it does not pass, the PR will not be merged.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** for open-source use. A commercial license is available for proprietary or paid deployments — contact the maintainer.

### Contributor License Agreement (CLA)

By submitting a pull request to this repository, you agree to the following:

1. You grant the maintainer a **perpetual, worldwide, non-exclusive, royalty-free license** to use, reproduce, modify, distribute, and sublicense your contribution under any license, including commercial licenses.
2. This grant is irrevocable and survives any termination of your use of the project.
3. You confirm that you have the right to grant this license (i.e., the contribution is your original work or you have the necessary rights).

This CLA is required to keep dual-licensing viable. Without it, the maintainer cannot offer commercial licenses to organizations that cannot use AGPL.

If your contribution includes third-party code, note the source and license in your PR description.
