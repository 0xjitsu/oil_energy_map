# PH Oil Intelligence Dashboard — Project Rules

## Architecture

- **Framework**: Next.js App Router (App directory at `src/app/`)
- **Map Engine**: deck.gl + MapLibre GL via `react-map-gl/maplibre`
- **Styling**: Tailwind CSS + CSS custom properties (dark theme)
- **Fonts**: IBM Plex Mono (monospace UI) + IBM Plex Sans (body text)
- **Package manager**: pnpm
- **Branch**: `main` — push only with explicit permission

---

## Design System

### Token Architecture

All visual values flow through CSS custom properties defined in `src/app/globals.css`, mapped to Tailwind tokens in `tailwind.config.ts`.

**IMPORTANT: Never hardcode color/spacing values.** Always use the design token system.

| Purpose | CSS Variable | Tailwind Token | DO NOT USE |
|---------|-------------|----------------|------------|
| Page background | `--bg-primary` | `bg-bg-primary` | `bg-[#060a10]` |
| Card background | `--bg-card` | `bg-bg-card` | `bg-[#0a0f1a]` |
| Elevated surface | `--bg-elevated` | `bg-bg-elevated` | `bg-[#111827]` |
| Hover surface | `--surface-hover` | `bg-surface-hover` | `bg-[rgba(255,255,255,0.03)]` |
| Primary text | `--text-primary` | `text-text-primary` | `text-[rgba(255,255,255,0.9)]` |
| Body text | `--text-body` | `text-text-body` | `text-[rgba(255,255,255,0.6)]` |
| Secondary text | `--text-secondary` | `text-text-secondary` | `text-[rgba(255,255,255,0.5)]` |
| Label text | `--text-label` | `text-text-label` | `text-[rgba(255,255,255,0.4)]` |
| Subtle text | `--text-subtle` | `text-text-subtle` | `text-[rgba(255,255,255,0.3)]` |
| Muted text | `--text-muted` | `text-text-muted` | `text-[rgba(255,255,255,0.25)]` |
| Dim text | `--text-dim` | `text-text-dim` | `text-[rgba(255,255,255,0.2)]` |
| Border | `--border` | `border-border` | `border-[rgba(255,255,255,0.04)]` |
| Border subtle | `--border-subtle` | `border-border-subtle` | `border-[rgba(255,255,255,0.06)]` |
| Border hover | `--border-hover` | `border-border-hover` | `border-[rgba(255,255,255,0.08)]` |

**Brand accent colors** (use for brand-specific highlights):
- `--accent-petron` / `text-petron` (blue #3b82f6)
- `--accent-shell` / `text-shell` (yellow #facc15)
- `--accent-chevron` / `text-chevron` (red #ef4444)
- `--accent-phoenix` / `text-phoenix` (orange #f97316)
- `--accent-seaoil` / `text-seaoil` (purple #8b5cf6)

**Status colors**: `text-status-green`, `text-status-yellow`, `text-status-red`

**Philippine flag**: `bg-ph-blue`, `bg-ph-red`, `bg-ph-yellow`

### Glass Morphism

Use the `.glass-card` utility class for glass surfaces. Do NOT duplicate its properties inline:
```css
/* Already defined — use the class, don't recreate */
.glass-card {
  background: rgba(10, 15, 26, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}
```

For interactive cards that lift on hover, add `.card-interactive` alongside `.glass-card`.

### Typography

- UI labels/badges: `font-mono text-[10px] uppercase tracking-widest`
- Large display numbers: `font-mono text-2xl sm:text-3xl font-bold`
- Body text: `font-sans text-sm`
- Coordinates/data: `font-mono text-xs`

### Shared Components

All pages MUST use the shared `<Header>` component from `@/components/layout/Header`:
```tsx
import { Header } from '@/components/layout/Header';

// Dashboard (with ticker)
<Header />

// Sub-pages (no ticker)
<Header showTicker={false} />
```

Do NOT create inline headers in page components.

---

## File Organization

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js routes + API endpoints |
| `src/components/layout/` | Shared layout (Header, SectionNav, MobileBottomNav) |
| `src/components/map/` | Map layers, controls, tooltips |
| `src/components/health/` | System health indicators |
| `src/components/prices/` | Price panels, impact cards |
| `src/components/primer/` | Oil Primer page components |
| `src/components/ui/` | Shared UI primitives (Ticker, ScrollProgress, Tooltip) |
| `src/components/onboarding/` | How-to guide and onboarding components |
| `src/data/` | Static data (stations, references, primer content) |
| `src/data/stations/` | Per-brand station JSON files |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Utilities and constants |
| `src/types/` | TypeScript interfaces |
| `scripts/` | Data processing scripts (Python/Shell) |
| `docs/superpowers/` | Specs and plans |

---

## Map Layer Conventions

All deck.gl layers are created via factory functions in `src/components/map/`:
- `createFacilityLayers()` — infrastructure (refinery, terminals, depots)
- `createRouteLayers()` — shipping lanes
- `createStationLayer()` — gas stations with clustering

Layer factories return `Layer[]` and MUST be spread (`...`) in the `useMemo` array:
```tsx
const deckLayers = useMemo(() => [
  ...createFacilityLayers(...),
  ...createRouteLayers(...),
  ...createStationLayer(...),
], [deps]);
```

---

## Station Data

- 10,469 stations from OpenStreetMap Overpass API (ODbL license)
- Stored as 7 JSON files in `src/data/stations/` (one per brand + others.json)
- Each station has: id, brand, name, coordinates, address, fuelTypes, region, source
- Regions assigned via bounding-box lookup (`src/data/regions.ts`)
- Clustering via `supercluster` at zoom < 8

---

## Code Patterns

### CSS-First Animations
- Accordions: `grid-template-rows: 0fr → 1fr` (not conditional render)
- Hover effects: CSS transitions, not JS state
- Scroll animations: `IntersectionObserver` with SSR-safe mount check
- Always include `@media (hover: none)` to disable hover on touch devices

### SSR Safety
- Never default `opacity: 0` with IntersectionObserver — check viewport on mount
- Use `useEffect` for DOM-dependent logic, not module scope
- Client components need `'use client'` directive
- `createPortal` must be gated behind a `mounted` state set in `useEffect`
- Never read `localStorage` in `useState` initializer — use `useEffect` sync with a `loaded` flag

### Tooltips
- `InfoTip` renders via React Portal (`createPortal` to `document.body`) to escape `overflow:hidden` and `contain:layout` on `.glass-card`
- Positioned with `getBoundingClientRect()` + `position: fixed` — do NOT add `window.scrollY`
- Mobile: tap-to-toggle via `onPointerDown` (only `pointerType === 'touch'`), close on outside tap
- Repositions on scroll/resize via event listeners

### Overflow & Sticky
- Use `overflow-x-clip` (NOT `overflow-x-hidden`) on page wrapper divs — `hidden` creates a scroll container per CSS spec, breaking `position: sticky`
- Header is `sticky top-0 z-50` — never wrap it in an `overflow-hidden` ancestor

### Data Fetching
- Prices: `usePrices` hook (5-min polling) — Brent via Yahoo Finance, forex via FloatRates, pump prices from DOE Oil Monitor weekly SRP
- Events: `useEvents` hook (3-min polling, retry with exponential backoff) — live RSS from PhilStar, Al Jazeera, DOE, Google News, Reddit
- Sentiment: `useSentiment` hook (15-min polling)
- Static data: direct imports from `@/data/`

### Price Source Transparency
- Brent Crude and PHP/USD are **live** feeds (Yahoo Finance, FloatRates)
- Pump gasoline and pump diesel are **DOE-sourced** (Oil Monitor weekly SRP) — updated in `src/data/prices.ts`
- Dubai, MOPS, and refining margin are **derived** from Brent + forex
- Derived prices show an "Est." badge (`bg-status-yellow/10 text-status-yellow/70`) — pump prices do NOT show this badge since they're DOE-sourced

---

## Build & Deploy

- Build: `pnpm build` — must pass clean before any commit
- Dev: `pnpm dev` (port 3007)
- Deploy target: Vercel (do NOT push without permission)
- No unused imports — ESLint enforces this
