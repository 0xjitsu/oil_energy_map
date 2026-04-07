# Architecture — PH Oil Intelligence Dashboard

## Overview

The PH Oil Intelligence Dashboard is a Next.js 14 App Router application that runs as a client-heavy single-page app with no database. The root layout (`src/app/layout.tsx`) handles fonts and JSON-LD structured data; all interactive logic lives inside a single `'use client'` page component (`src/app/page.tsx`). External data enters through two Next.js API route handlers that proxy live third-party APIs (Yahoo Finance, FloatRates, RSS feeds, Reddit) and fall back to static seed data on failure. There is no authentication, no session store, and no persistent backend — all state is ephemeral React state within the browser session.

---

## Page Structure

The page renders a single scroll document divided into four narrative acts. Provider nesting wraps the entire page content; `HighlightProvider` is scoped narrowly to Act 4's market players section only.

```
CrisisProvider (scenarioParams)
  └── <div> root
        ├── ScrollProgress
        ├── AlertBanner
        ├── Header
        ├── SectionNav
        ├── <main>
        │     ├── Act 01 — What's Happening Now
        │     │     ├── ExecutiveSnapshot   (#snapshot)
        │     │     ├── MapWrapper          (#map)   ← dynamic()
        │     │     └── TimelineSlider / TimelineScrubber
        │     ├── Act 02 — What It Costs
        │     │     ├── PumpPrices
        │     │     ├── ImpactCards
        │     │     ├── PricePanel          (#prices) ← dynamic()
        │     │     └── StationTrackerSection (#tracker)
        │     ├── Act 03 — What-If Analysis
        │     │     ├── ScenarioPlanner     (#scenario) ← dynamic()
        │     │     ├── StressTest          (#stress-test) ← dynamic()
        │     │     └── ImpactCalculator    ← dynamic()
        │     └── Act 04 — Who's Involved
        │           ├── HighlightProvider
        │           │     ├── MarketShare   (#players) ← dynamic()
        │           │     └── PlayerCards   ← dynamic()
        │           ├── VitalSigns
        │           ├── SentimentGauge
        │           └── EventTimeline
        ├── MobileBottomNav
        ├── HowToGuide  ← dynamic()
        └── Footer
```

All section anchor IDs use `scroll-mt-20` to account for the sticky header offset (`src/app/page.tsx:144–267`).

---

## Data Flow

| Data | Source | API Route | Hook | Polling Interval | Fallback |
|------|--------|-----------|------|-----------------|---------|
| Brent Crude ($/bbl) | Yahoo Finance (`BZ=F`) | `GET /api/prices` | `usePrices` | 5 min | `src/data/prices.ts` static seed |
| Dubai Crude ($/bbl) | Derived from Brent (`Brent × 0.97`) | `GET /api/prices` | `usePrices` | 5 min | Static seed |
| MOPS Gasoline 95 ($/bbl) | Derived (`Brent + 13.5`) | `GET /api/prices` | `usePrices` | 5 min | Static seed |
| MOPS Diesel ($/bbl) | Derived (`Brent + 17`) | `GET /api/prices` | `usePrices` | 5 min | Static seed |
| PHP/USD exchange rate | FloatRates API | `GET /api/prices` | `usePrices` | 5 min | Static seed |
| Pump Gasoline (₱/liter) | DOE Oil Monitor SRP (static) | `GET /api/prices` | `usePrices` | N/A (static) | `src/data/prices.ts` |
| Pump Diesel (₱/liter) | DOE Oil Monitor SRP (static) | `GET /api/prices` | `usePrices` | N/A (static) | `src/data/prices.ts` |
| SG Refining Margin ($/bbl) | Hardcoded constant (15.3) | `GET /api/prices` | `usePrices` | N/A | Same constant |
| Timeline events | RSS: PhilStar, Al Jazeera, Google News ×2, DOE PH; Social: r/Philippines, r/energy | `GET /api/events` | `useEvents` | 3 min | `src/data/events.ts` static seed |
| NLP Sentiment | `GET /api/sentiment` | `GET /api/sentiment` | `useSentiment` | 15 min | Empty array (error state shown) |
| Gas station locations (10,469) | OpenStreetMap Overpass (one-time build) | None | Direct import | Static | Always present |

The prices API caches at `s-maxage=900, stale-while-revalidate=1800` (`src/app/api/prices/route.ts:97`).
The events API caches at `s-maxage=300, stale-while-revalidate=600` (`src/app/api/events/route.ts:154`).

`useEvents` retries up to 3 times with exponential backoff (1 s, 2 s delays) before falling back to static data (`src/hooks/useEvents.ts:16–31`).

---

## State Management

No global store. All state is React Context or `useState` local to `page.tsx`. Components subscribe to context values directly; no prop drilling beyond immediate children.

### CrisisContext (`src/lib/CrisisProvider.tsx`)

Provided by `<CrisisProvider>` which wraps the entire page. Consumes both `usePrices` and `useEvents` internally to compute the crisis score.

| Value | Type | Description |
|-------|------|-------------|
| `crisisLevel` | `'CALM' \| 'ELEVATED' \| 'CRISIS'` | Derived from `crisisScore` via thresholds |
| `crisisScore` | `number` (0–100) | Weighted sum of live signals (see Crisis UI System) |

Consumed via `useCrisis()` hook anywhere inside the tree.

### HighlightContext (`src/lib/HighlightContext.tsx`)

Scoped to Act 4's market players grid only (not page-level). Enables hover linking between the `MarketShare` donut chart and `PlayerCards` grid.

| Value | Type | Description |
|-------|------|-------------|
| `highlightedPlayer` | `string \| null` | Brand name of the currently hovered player |
| `setHighlightedPlayer` | `(player: string \| null) => void` | Setter, wrapped in `useCallback` |

### Local State in `page.tsx` (`src/app/page.tsx:115–122`)

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `mapMode` | `MapMode` | `'live'` | Controls map rendering mode; shared across `MapWrapper`, `ScenarioPlanner`, `VitalSigns` |
| `scenarioParams` | `ScenarioParams` | `{ brentPrice: 106, hormuzWeeks: 2, forexRate: 58.42, refineryOffline: false }` | What-if inputs; fed into `CrisisProvider`, `ExecutiveSnapshot`, `ImpactCards`, `StressTest`, `ImpactCalculator`, `VitalSigns`, `MapWrapper` |
| `timelinePosition` | `number` | `0` | 0–1 scrubber value for timeline mode; drives `TimelineSlider`, `TimelineScrubber`, `MapWrapper` |

---

## Crisis UI System

### Score Formula (`src/lib/crisisLevel.ts:45–68`)

```
crisisScore = min(100,
    min(40, redEventCount × 8)       // red-severity events
  + min(20, yellowEventCount × 2)    // yellow-severity events
  + min(20, |ΔBrent%|)               // Brent week-over-week % change
  + min(20, (hormuzWeeks / 4) × 20)  // Strait of Hormuz closure duration
)
```

Returns `25` (safe CALM) on any computation error.

### Level Thresholds

| Score Range | Level | Meaning |
|-------------|-------|---------|
| 0–30 | `CALM` | Normal operations |
| 31–60 | `ELEVATED` | Supply pressure, monitoring warranted |
| 61–100 | `CRISIS` | Active disruption, emergency posture |

### CSS Token Injection

`CrisisProvider` calls `document.documentElement.style.setProperty()` and sets `data-crisis-level` on `<html>` whenever the level changes. On unmount, all tokens are removed (`src/lib/CrisisProvider.tsx:58–73`).

| Token | CALM | ELEVATED | CRISIS |
|-------|------|----------|--------|
| `--accent-primary` | `#3b82f6` (blue) | `#f59e0b` (amber) | `#ef4444` (red) |
| `--bg-card-crisis` | `rgba(10,15,26,0.7)` | `rgba(20,15,10,0.7)` | `rgba(30,10,10,0.7)` |
| `--border-crisis` | `rgba(255,255,255,0.06)` | `rgba(245,158,11,0.15)` | `rgba(239,68,68,0.2)` |
| `--scan-line-opacity` | `0` | `0` | `0.03` |

The `data-crisis-level` attribute (`calm`, `elevated`, or `crisis`) is set on `document.documentElement` and can be targeted by CSS selectors such as `[data-crisis-level="crisis"] .my-card`.

---

## Rendering Pipeline

### Static vs Dynamic Imports

Components above the fold (Executive Snapshot, header chrome, pump prices grid) are static imports rendered on the server. Heavy, chart-heavy, or WebGL components are lazy-loaded via `next/dynamic` with `ssr: false`.

| Component | Import Strategy | Skeleton |
|-----------|----------------|---------|
| `ExecutiveSnapshot` | Static import | None (renders immediately) |
| `PumpPrices`, `ImpactCards`, `VitalSigns`, `SentimentGauge`, `EventTimeline` | Static import | None |
| `MapWrapper` → `IntelMap` | `dynamic()` inside `MapWrapper.tsx` | "Initializing MapLibre GL..." placeholder div |
| `PricePanel` | `dynamic()` in `page.tsx` | `<PricePanelSkeleton />` |
| `ScenarioPlanner` | `dynamic()` in `page.tsx` | `<ScenarioPlannerSkeleton />` |
| `MarketShare` | `dynamic()` in `page.tsx` | `<MarketShareSkeleton />` |
| `PlayerCards` | `dynamic()` in `page.tsx` | `<PlayerCardsSkeleton />` |
| `ImpactCalculator` | `dynamic()` in `page.tsx` | `<ImpactCalculatorSkeleton />` |
| `StressTest` | `dynamic()` in `page.tsx` | `<StressTestSkeleton />` |
| `TimelineScrubber` | `dynamic()` in `page.tsx` | `<TimelineScrubberSkeleton />` |
| `HowToGuide` | `dynamic()` in `page.tsx` | `<HowToGuideSkeleton />` |

Skeleton components live in `src/components/ui/Skeleton.tsx` and use `animate-pulse` with fixed `min-h` to prevent CLS.

### FadeIn Scroll Animation (`src/components/ui/FadeIn.tsx`)

`FadeIn` wraps act dividers and the map section. It implements a three-phase state machine (`idle → pending → visible`) using `IntersectionObserver`. SSR safety is handled by checking `getBoundingClientRect()` on mount — if the element is already in the viewport, it transitions to `visible` immediately without waiting for an intersection event. If `prefers-reduced-motion` is set, the component renders with no transform and skips all animation.

### SSR Safety Rules

- Page component is `'use client'` — no server rendering of interactive state.
- All `dynamic()` imports have `ssr: false` — no WebGL or chart code runs on the server.
- DOM-dependent logic (portals, `localStorage`, `IntersectionObserver`) is gated behind `useEffect`.
- `FadeIn` never defaults to `opacity: 0` at module scope; initial phase is `'idle'` with no styles applied until the `useEffect` runs.

---

## Map Engine

The map is implemented in `src/components/map/IntelMap.tsx` using `react-map-gl/maplibre` for the base map and `@deck.gl/mapbox` (`MapboxOverlay`) for the deck.gl overlay.

| Property | Value |
|----------|-------|
| Base map style | CartoCDN Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) |
| Initial view | `longitude: 122, latitude: 12, zoom: 5.5, pitch: 30°` |
| deck.gl integration | `DeckGLOverlay` component via `useControl(() => new MapboxOverlay())` |
| Station clustering | `supercluster` at zoom < 8 |

### Layer Factory Pattern

All layers are created by factory functions and spread into a single `deckLayers` `useMemo` array (`src/components/map/IntelMap.tsx:169–211`):

| Factory | File | Output | Mode-aware |
|---------|------|--------|------------|
| `createFacilityLayers()` | `src/components/map/FacilityLayer.ts` | Refinery, terminal, depot icons + `ColumnLayer` for capacity height | Yes — shows disruption state in scenario/timeline |
| `createRouteLayers()` | `src/components/map/ShippingLayer.ts` | Animated `PathLayer` shipping lanes | Yes — disrupted routes styled differently in scenario mode |
| `createStationLayer()` | `src/components/map/StationLayer.ts` | `ScatterplotLayer` + cluster layer for 10,469 stations | No mode changes — filtered by brand, region, status |

### Map Modes

| Mode | `MapMode` value | Behavior |
|------|----------------|---------|
| Live | `'live'` | `currentTime` incremented via `requestAnimationFrame` loop; routes animate continuously |
| Scenario | `'scenario'` | RAF loop stopped; layers receive `scenarioParams` to alter visual state (disrupted routes, offline facilities) |
| Timeline | `'timeline'` | RAF loop stopped; `effectiveTime` driven by `timelinePosition` prop from the `TimelineSlider` scrubber |

Mode is lifted to `page.tsx` state and passed down to `MapWrapper`, `ScenarioPlanner`, and `VitalSigns`.

---

## Scenario Engine

Defined in `src/lib/scenario-engine.ts`. A pure function — no side effects, no I/O.

### `ScenarioParams` Shape (`src/types/index.ts:65–70`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `brentPrice` | `number` | `106` | Brent crude price in USD/barrel |
| `hormuzWeeks` | `number` | `2` | Strait of Hormuz closure duration in weeks |
| `forexRate` | `number` | `58.42` | PHP/USD exchange rate |
| `refineryOffline` | `boolean` | `false` | Whether the Bataan refinery is offline |

### `calculatePumpPrice(params)` → `ScenarioResult`

Computes projected Philippine pump prices using a linear model with non-linear Hormuz premium:

```
gasoline = 65 + (brentPrice − 80) × 0.18 + (forexRate − 56) × 0.9 + hormuzPremium + refineryPremium
diesel   = 59 + same deltas

hormuzPremium:
  0 weeks  → 0
  1–4 wks  → weeks × 1.5
  5–8 wks  → 6 + (weeks − 4) × 2.5
  > 8 wks  → 16 + (weeks − 8) × 4

refineryPremium: +₱3.0/L if refineryOffline
```

### Risk Level Assignment

| Condition | `riskLevel` |
|-----------|-------------|
| `gasoline > 95` OR `hormuzWeeks > 8` OR (`refineryOffline && hormuzWeeks > 4`) | `'red'` |
| `gasoline > 75` OR `hormuzWeeks > 4` OR `brentPrice > 100` | `'yellow'` |
| Otherwise | `'green'` |

### How `ScenarioParams` Flows Through the App

`scenarioParams` is initialized in `page.tsx` and updated by `ScenarioPlanner` via `handleParamsChange` (`useCallback(setScenarioParams)`). It then flows to:

- `CrisisProvider` — used in `computeCrisisScore()` via `hormuzWeeks` and `brentPrice`
- `ExecutiveSnapshot` — displays projected KPIs
- `ImpactCards` — derives consumer cost impacts
- `MapWrapper` / `IntelMap` — triggers layer re-render in scenario/timeline modes
- `StressTest` — Monte Carlo simulation input
- `ImpactCalculator` — consumer household impact calculator
- `VitalSigns` — system health status badges
