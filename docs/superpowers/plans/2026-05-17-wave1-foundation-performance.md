# Wave 1 — Foundation & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the PH Oil Intelligence dashboard's homepage First Load JS from 447 kB toward ≤200 kB, collapse 11 concurrent polling loops to 2, and fix known render bugs — without changing any visible behavior.

**Architecture:** Two structural shifts. (1) The 3.7 MB of station JSON stops being statically imported into the bundle — it is served as a static `public/data/stations.json` file and fetched after mount via a singleton-promise `useStations` hook. (2) A single `DataProvider` (mounted in the root layout) owns the price and event polling; `usePrices`/`useEvents` are rewritten as thin context readers so every existing consumer keeps working unchanged. Plus targeted bug fixes and dead-code removal.

**Tech Stack:** Next.js 14 App Router, React 18, deck.gl + MapLibre, Recharts, Tailwind CSS, pnpm, Vitest (added in Task 1).

---

## Context for the engineer

This is a brownfield Next.js 14 dashboard. Key facts:

- Package manager is **pnpm**. Dev server runs on port 3007 via `pnpm dev`. Build is `pnpm build`. Lint is `pnpm lint`.
- Path alias: `@/*` → `./src/*` (see `tsconfig.json`).
- There is **no test runner yet** — Task 1 adds Vitest.
- The design-token rule (see `CLAUDE.md`): never hardcode colors. This plan does not touch styling, so it is not a concern here.
- `pnpm build` must pass clean before every commit. ESLint forbids unused imports.
- Do **not** push to git remote — commits only.

### The station-data problem

`src/data/stations/index.ts` statically imports 7 brand JSON files (`petron.json`, `shell.json`, `caltex.json`, `phoenix.json`, `seaoil.json`, `unioil.json`, `others.json` — 3.7 MB total) and runs `assignStationStatus()` over all ~10,469 rows at module-import time. Seven modules import from `@/data/stations`, so this 3.7 MB lands in the client JS bundle. After this wave, the JSON is served as a static file and fetched at runtime.

### The polling problem

`usePrices()` and `useEvents()` each contain a `setInterval`. They are called 5–6 times each across the component tree (`Ticker`, `Header`, `Footer`, `AlertBanner`, `EventTimeline`, `ExecutiveSnapshot`, `PricePanel`, `PumpPrices`, `ScenarioPlanner`, `CrisisProvider`). That is 11 concurrent polling loops per browser. After this wave, one `DataProvider` polls once; the hooks read from its context.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `vitest.config.ts` | Vitest configuration with `@` alias + jsdom |
| Create | `vitest.setup.ts` | jest-dom matchers |
| Create | `scripts/build-stations-json.mjs` | Merge 7 brand JSONs → `public/data/stations.json` |
| Create | `src/lib/station-filter.ts` | Pure `filterStations()` predicate (shared by map + count) |
| Create | `src/lib/__tests__/station-filter.test.ts` | Tests for `filterStations` |
| Create | `src/hooks/useStations.ts` | Singleton-promise station fetch + status assignment |
| Create | `src/hooks/__tests__/useStations.test.ts` | Tests for `buildStationsData` |
| Create | `src/lib/DataProvider.tsx` | Centralized price/event polling + React context |
| Modify | `src/data/stations/index.ts` | Drop static JSON imports; keep `BRAND_LIST` as a const |
| Modify | `src/lib/region-analytics.ts` | `computeRegionAnalytics` takes `stations` as a parameter |
| Modify | `src/components/map/RegionPanel.tsx` | Source stations from `useStations()` |
| Modify | `src/components/map/StationLayer.tsx` | Take pre-filtered stations + an instance-scoped cluster cache |
| Modify | `src/components/map/IntelMap.tsx` | Consume `useStations()`; throttle RAF; de-dup the filter |
| Modify | `src/components/map/CommandPalette.tsx` | Source stations from `useStations()` |
| Modify | `src/components/health/StationTrackerSection.tsx` | Source status counts from `useStations()` |
| Modify | `src/hooks/usePrices.ts` | Rewrite as a `DataProvider` context reader |
| Modify | `src/hooks/useEvents.ts` | Rewrite as a `DataProvider` context reader |
| Modify | `src/app/layout.tsx` | Wrap `{children}` in `<DataProvider>` |
| Modify | `src/app/page.tsx` | Import `IntelMap` directly via `dynamic()` |
| Delete | `src/components/map/MapWrapper.tsx` | Redundant dynamic-import indirection |
| Modify | `src/components/prices/SparkChart.tsx` | Replace Recharts with a hand-rolled SVG sparkline |
| Modify | `next.config.mjs` | Add `recharts` to `optimizePackageImports` |
| Modify | `src/components/scenarios/ScenarioPlanner.tsx` | Fix stale-closure bug in the live-price sync effect |
| Modify | `src/app/api/prices/route.ts` | Add `Cache-Control` to the `catch` fallback |
| Modify | `src/app/api/events/route.ts` | Add `Cache-Control` to the `catch` fallback |
| Delete | `src/components/map/LayerControls.tsx` | Dead code — superseded by `MapToolbar` |
| Delete | `src/pages/_error.tsx` | Stray Pages-Router artifact, unused in App Router |
| Modify | `package.json` | Add Vitest deps + `test`/`prebuild`/`predev` scripts |
| Modify | `.gitignore` | Ignore the generated `public/data/stations.json` |

---

## Task 1: Set up Vitest test infrastructure

The project has no test runner. Vitest is needed for this plan's pure-logic tests and for every later wave's regression tests.

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/lib/__tests__/smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest dev dependencies**

Run:
```bash
pnpm add -D vitest@^2 @vitejs/plugin-react@^4 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```
Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` block, add `test` and `test:watch` (keep existing scripts):

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 5: Write a smoke test**

Create `src/lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the test to verify the runner works**

Run: `pnpm test`
Expected: PASS — `1 passed`.

- [ ] **Step 7: Verify lint and build still pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed (Vitest config is excluded from the Next.js build; no impact).

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts vitest.setup.ts src/lib/__tests__/smoke.test.ts package.json pnpm-lock.yaml
git commit -m "add Vitest test infrastructure"
```

---

## Task 2: Generate static station data file

Merge the 7 brand JSON files into one `public/data/stations.json` served statically (not bundled). A `prebuild`/`predev` script regenerates it automatically.

**Files:**
- Create: `scripts/build-stations-json.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create the build script**

Create `scripts/build-stations-json.mjs`:
```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STATIONS_DIR = join(here, '../src/data/stations');
const OUT = join(here, '../public/data/stations.json');

const BRAND_FILES = ['petron', 'shell', 'caltex', 'phoenix', 'seaoil', 'unioil', 'others'];

const all = [];
for (const brand of BRAND_FILES) {
  const raw = readFileSync(join(STATIONS_DIR, `${brand}.json`), 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) {
    throw new Error(`[build-stations] ${brand}.json is not a JSON array`);
  }
  all.push(...arr);
}

if (all.length < 10000) {
  throw new Error(`[build-stations] expected >=10000 stations, got ${all.length}`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(all));
console.log(`[build-stations] wrote ${all.length} stations to public/data/stations.json`);
```

- [ ] **Step 2: Add `prebuild` and `predev` scripts to `package.json`**

In `"scripts"`, add `prebuild` and `predev` (these run automatically before `build`/`dev`):

```json
  "scripts": {
    "predev": "node scripts/build-stations-json.mjs",
    "dev": "next dev",
    "prebuild": "node scripts/build-stations-json.mjs",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Run the script and verify output**

Run: `node scripts/build-stations-json.mjs`
Expected: `[build-stations] wrote 10469 stations to public/data/stations.json`

- [ ] **Step 4: Ignore the generated file in git**

Append to `.gitignore`:
```
# generated station data (built by scripts/build-stations-json.mjs via prebuild/predev)
/public/data/stations.json
```

- [ ] **Step 5: Verify the build still passes**

Run: `pnpm build`
Expected: build succeeds; console shows the `[build-stations]` line before Next.js compiles.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-stations-json.mjs package.json .gitignore
git commit -m "generate static stations.json via prebuild script"
```

---

## Task 3: Pure `filterStations` helper

Both `IntelMap` (for the count display) and `StationLayer` (for the dots/clusters) currently run the same `allStations.filter(...)`. Extract one shared, tested predicate so the filter runs once.

**Files:**
- Create: `src/lib/station-filter.ts`
- Create: `src/lib/__tests__/station-filter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/station-filter.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { filterStations } from '@/lib/station-filter';
import type { GasStation } from '@/types/stations';

const station = (over: Partial<GasStation>): GasStation => ({
  id: 'x',
  brand: 'Petron',
  name: 'Test',
  coordinates: [12, 122],
  address: '',
  fuelTypes: [],
  region: 'Region V (Bicol)',
  source: { url: '', scrapedAt: '' },
  status: 'operational',
  ...over,
});

const ALL = [
  station({ id: 'a', brand: 'Petron', region: 'Region V (Bicol)', status: 'operational' }),
  station({ id: 'b', brand: 'Shell', region: 'Region V (Bicol)', status: 'low-supply' }),
  station({ id: 'c', brand: 'Petron', region: 'NCR', status: 'closed' }),
];

describe('filterStations', () => {
  it('filters by visible brand', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron']),
      selectedRegion: null,
      statusFilter: 'all',
    });
    expect(result.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('filters by selected region', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: 'NCR',
      statusFilter: 'all',
    });
    expect(result.map((s) => s.id)).toEqual(['c']);
  });

  it('filters by status when not "all"', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: null,
      statusFilter: 'low-supply',
    });
    expect(result.map((s) => s.id)).toEqual(['b']);
  });

  it('returns everything when brands cover all and filters are open', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: null,
      statusFilter: 'all',
    });
    expect(result).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/__tests__/station-filter.test.ts`
Expected: FAIL — cannot resolve `@/lib/station-filter`.

- [ ] **Step 3: Implement `filterStations`**

Create `src/lib/station-filter.ts`:
```ts
import type { GasStation, StationStatus } from '@/types/stations';

export interface StationFilterCriteria {
  visibleBrands: Set<string>;
  selectedRegion: string | null;
  statusFilter: StationStatus | 'all';
}

/** Single source of truth for station filtering — used by the map layer and the count display. */
export function filterStations(
  stations: GasStation[],
  { visibleBrands, selectedRegion, statusFilter }: StationFilterCriteria,
): GasStation[] {
  return stations.filter(
    (s) =>
      visibleBrands.has(s.brand) &&
      (!selectedRegion || s.region === selectedRegion) &&
      (statusFilter === 'all' || s.status === statusFilter),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/__tests__/station-filter.test.ts`
Expected: PASS — `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/station-filter.ts src/lib/__tests__/station-filter.test.ts
git commit -m "extract shared filterStations predicate with tests"
```

---

## Task 4: `useStations` hook

A client hook that fetches `/data/stations.json` exactly once (shared module-level promise), assigns deterministic status, and exposes stations + status counts. The status-assignment + counting logic is extracted as a pure `buildStationsData` function so it can be tested.

**Files:**
- Create: `src/hooks/useStations.ts`
- Create: `src/hooks/__tests__/useStations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useStations.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildStationsData } from '@/hooks/useStations';
import type { GasStation } from '@/types/stations';

const raw = (id: string, region: string): GasStation => ({
  id,
  brand: 'Petron',
  name: 'Test',
  coordinates: [12, 122],
  address: '',
  fuelTypes: [],
  region,
  source: { url: '', scrapedAt: '' },
});

describe('buildStationsData', () => {
  it('assigns a status to every station', () => {
    const { stations } = buildStationsData([raw('a', 'NCR'), raw('b', 'Region V (Bicol)')]);
    expect(stations).toHaveLength(2);
    expect(stations.every((s) => typeof s.status === 'string')).toBe(true);
  });

  it('status counts sum to the input length', () => {
    const input = Array.from({ length: 50 }, (_, i) => raw(`s${i}`, 'NCR'));
    const { statusCounts } = buildStationsData(input);
    const total =
      statusCounts.operational +
      statusCounts['low-supply'] +
      statusCounts['out-of-stock'] +
      statusCounts.closed;
    expect(total).toBe(50);
  });

  it('is deterministic — same input yields same counts', () => {
    const input = Array.from({ length: 30 }, (_, i) => raw(`s${i}`, 'NCR'));
    expect(buildStationsData(input).statusCounts).toEqual(
      buildStationsData(input).statusCounts,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/hooks/__tests__/useStations.test.ts`
Expected: FAIL — cannot resolve `@/hooks/useStations`.

- [ ] **Step 3: Implement `useStations`**

Create `src/hooks/useStations.ts`:
```ts
'use client';

import { useState, useEffect } from 'react';
import type { GasStation, StationStatus } from '@/types/stations';
import { assignStationStatus } from '@/lib/station-status';

export interface StationsData {
  stations: GasStation[];
  statusCounts: Record<StationStatus, number>;
}

const EMPTY_COUNTS: Record<StationStatus, number> = {
  operational: 0,
  'low-supply': 0,
  'out-of-stock': 0,
  closed: 0,
};

/** Pure: assign a deterministic status to each station and tally the counts. */
export function buildStationsData(raw: GasStation[]): StationsData {
  const stations = raw.map((s) => ({
    ...s,
    status: assignStationStatus(s.id, s.region ?? ''),
  }));
  const statusCounts: Record<StationStatus, number> = { ...EMPTY_COUNTS };
  for (const s of stations) {
    if (s.status) statusCounts[s.status]++;
  }
  return { stations, statusCounts };
}

/** Module-level singleton — the fetch runs once and every caller shares the result. */
let stationsPromise: Promise<StationsData> | null = null;

function loadStations(): Promise<StationsData> {
  if (stationsPromise) return stationsPromise;
  stationsPromise = fetch('/data/stations.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((raw: GasStation[]) => buildStationsData(raw))
    .catch((err) => {
      // Reset so a later mount can retry.
      stationsPromise = null;
      throw err;
    });
  return stationsPromise;
}

/** Fetch the station dataset once on mount. Returns empty data while loading or on error. */
export function useStations() {
  const [data, setData] = useState<StationsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadStations()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    stations: data?.stations ?? [],
    statusCounts: data?.statusCounts ?? EMPTY_COUNTS,
    loading: data === null && !error,
    error,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/hooks/__tests__/useStations.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Verify build passes**

Run: `pnpm build`
Expected: succeeds. `useStations` is not imported anywhere yet — no behavior change.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useStations.ts src/hooks/__tests__/useStations.test.ts
git commit -m "add useStations hook with singleton-promise fetch"
```

---

## Task 5: Refactor `region-analytics.ts` to receive stations

`computeRegionAnalytics` currently imports `allStations` directly. Make it take `stations` as a parameter; update its only caller, `RegionPanel`.

**Files:**
- Modify: `src/lib/region-analytics.ts`
- Modify: `src/components/map/RegionPanel.tsx`

- [ ] **Step 1: Change `computeRegionAnalytics` to take a `stations` parameter**

In `src/lib/region-analytics.ts`, delete line 1 (`import { allStations } from '@/data/stations';`) and change the function signature + first line of the body. Replace:
```ts
export function computeRegionAnalytics(regionName: string): RegionAnalytics {
  const stations = allStations.filter((s) => s.region === regionName);
```
with:
```ts
export function computeRegionAnalytics(
  regionName: string,
  allStations: GasStation[],
): RegionAnalytics {
  const stations = allStations.filter((s) => s.region === regionName);
```

Add the `GasStation` type import at the top (alongside the existing `Facility` import):
```ts
import type { Facility } from '@/types';
import type { GasStation } from '@/types/stations';
```

- [ ] **Step 2: Update `RegionPanel` to source stations from `useStations`**

In `src/components/map/RegionPanel.tsx`, replace the import block and the `analytics` memo. Change:
```tsx
import { useMemo } from 'react';
import { computeRegionAnalytics } from '@/lib/region-analytics';
```
to:
```tsx
import { useMemo } from 'react';
import { computeRegionAnalytics } from '@/lib/region-analytics';
import { useStations } from '@/hooks/useStations';
```

And change:
```tsx
  const analytics = useMemo(() => computeRegionAnalytics(region), [region]);
```
to:
```tsx
  const { stations } = useStations();
  const analytics = useMemo(
    () => computeRegionAnalytics(region, stations),
    [region, stations],
  );
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/lib/region-analytics.ts src/components/map/RegionPanel.tsx
git commit -m "make region-analytics accept stations as a parameter"
```

---

## Task 6: Refactor `StationLayer` + wire `IntelMap` to `useStations`

The biggest task. `StationLayer.createStationLayer` stops importing `allStations` and stops filtering — it receives pre-filtered stations and an instance-scoped cluster cache (fixing the module-global cache bug). `IntelMap` consumes `useStations()`, runs the filter once via `filterStations` (fixing the double-filter), passes the result to the layer factory, and throttles the 60 fps RAF state commits.

**Files:**
- Modify: `src/components/map/StationLayer.tsx`
- Modify: `src/components/map/IntelMap.tsx`

- [ ] **Step 1: Rewrite `StationLayer.tsx`**

Replace the entire contents of `src/components/map/StationLayer.tsx` with:
```tsx
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { GasStation } from '@/types/stations';
import { BRAND_COLORS, STATUS_COLORS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';
import type { Layer } from '@deck.gl/core';
import Supercluster from 'supercluster';
import type { PointFeature } from 'supercluster';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Zoom threshold: below this, stations are clustered */
const CLUSTER_MAX_ZOOM = 8;

/** Instance-scoped cluster cache. Created with `createClusterCache()` and held in a ref by IntelMap. */
export interface ClusterCache {
  key: string;
  index: Supercluster<GasStation> | null;
}

export function createClusterCache(): ClusterCache {
  return { key: '', index: null };
}

function getClusterIndex(
  filtered: GasStation[],
  cacheKey: string,
  cache: ClusterCache,
): Supercluster<GasStation> {
  if (cache.index && cache.key === cacheKey) return cache.index;

  const index = new Supercluster<GasStation>({
    radius: 60,
    maxZoom: CLUSTER_MAX_ZOOM,
  });

  const features: PointFeature<GasStation>[] = filtered.map((s) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [s.coordinates[1], s.coordinates[0]],
    },
    properties: s,
  }));

  index.load(features);
  cache.key = cacheKey;
  cache.index = index;
  return index;
}

interface ClusterPoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  count: number;
  isCluster: boolean;
}

/**
 * Build the station deck.gl layers.
 * `filteredStations` must already be filtered by the caller (see `filterStations`).
 * `cacheKey` uniquely identifies that filtered set; `cache` is an instance-scoped object.
 */
export function createStationLayer(
  filteredStations: GasStation[],
  visible: boolean,
  onSelect: (station: GasStation) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
  onHoverInfo: ((info: { station: GasStation; x: number; y: number } | null) => void) | undefined,
  zoom: number | undefined,
  statusFilter: StationStatus | 'all',
  cacheKey: string,
  cache: ClusterCache,
): Layer[] {
  const filtered = filteredStations;
  const currentZoom = zoom ?? 10; // default to unclustered if zoom not provided

  // When zoomed in enough, render individual dots
  if (currentZoom >= CLUSTER_MAX_ZOOM) {
    const dotLayer = new ScatterplotLayer<GasStation>({
      id: 'station-dots',
      data: filtered,
      visible,
      pickable: true,
      getPosition: (d: GasStation) => [d.coordinates[1], d.coordinates[0]],
      getRadius: (d: GasStation) => (d.id === hoveredId ? 6 : 4),
      radiusUnits: 'pixels' as const,
      radiusMinPixels: 2,
      radiusMaxPixels: 8,
      getFillColor: (d: GasStation) => {
        const colorSource =
          statusFilter && statusFilter !== 'all'
            ? STATUS_COLORS[d.status ?? 'operational']
            : (BRAND_COLORS[d.brand] ?? BRAND_COLORS.Other);
        const rgb = hexToRgb(colorSource);
        const alpha = d.id === hoveredId ? 255 : 180;
        return [...rgb, alpha] as [number, number, number, number];
      },
      onClick: ({ object }: { object?: GasStation }) => {
        if (object) onSelect(object);
      },
      onHover: ({ object, x, y }: { object?: GasStation; x: number; y: number }) => {
        setHoveredId(object ? object.id : null);
        onHoverInfo?.(object ? { station: object, x, y } : null);
      },
      transitions: {
        getFillColor: 300,
        getRadius: 300,
      },
      updateTriggers: {
        getFillColor: [hoveredId, statusFilter],
        getRadius: [hoveredId],
        data: [cacheKey],
      },
    });
    return [dotLayer];
  }

  // Clustered view for low zoom levels
  const index = getClusterIndex(filtered, cacheKey, cache);
  const rawClusters = index.getClusters([-180, -85, 180, 85], Math.floor(currentZoom));

  const clusterData: ClusterPoint[] = rawClusters.map((c) => {
    const props = c.properties as Record<string, unknown>;
    const isCluster = props.cluster === true;
    return {
      id: isCluster
        ? `cluster-${props.cluster_id}`
        : (props as unknown as GasStation).id,
      coordinates: c.geometry.coordinates as [number, number],
      count: isCluster ? ((props.point_count as number) ?? 1) : 1,
      isCluster,
    };
  });

  const hoveredClusterId = hoveredId;

  const clusterCircleLayer = new ScatterplotLayer<ClusterPoint>({
    id: 'station-clusters',
    data: clusterData,
    visible,
    pickable: true,
    getPosition: (d) => d.coordinates,
    getRadius: (d) => {
      const base = d.isCluster
        ? Math.min(Math.max(Math.sqrt(d.count) * 3, 12), 40)
        : 4;
      return d.id === hoveredClusterId ? base * 1.2 : base;
    },
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 3,
    radiusMaxPixels: 50,
    getFillColor: (d) => {
      if (!d.isCluster) {
        return d.id === hoveredClusterId
          ? ([59, 130, 246, 255] as [number, number, number, number])
          : ([59, 130, 246, 160] as [number, number, number, number]);
      }
      return d.id === hoveredClusterId
        ? ([59, 130, 246, 230] as [number, number, number, number])
        : ([59, 130, 246, 160] as [number, number, number, number]);
    },
    onHover: ({ object }: { object?: ClusterPoint }) => {
      setHoveredId(object ? object.id : null);
      onHoverInfo?.(null);
    },
    onClick: () => {
      // Future: zoom into cluster on click
    },
    transitions: {
      getFillColor: 300,
      getRadius: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredClusterId],
      getRadius: [hoveredClusterId],
      data: [cacheKey, currentZoom],
    },
  });

  const labelData = clusterData.filter((d) => d.isCluster && d.count > 1);

  const clusterLabelLayer = new TextLayer<ClusterPoint>({
    id: 'station-cluster-labels',
    data: labelData,
    visible,
    pickable: false,
    getPosition: (d) => d.coordinates,
    getText: (d) => (d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : String(d.count)),
    getSize: (d) => (d.count > 100 ? 14 : 12),
    getColor: [255, 255, 255, 255],
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'center' as const,
    fontWeight: 700,
    fontFamily: 'Inter, system-ui, sans-serif',
    sizeUnits: 'pixels' as const,
    updateTriggers: {
      data: [cacheKey, currentZoom],
    },
  });

  return [clusterCircleLayer, clusterLabelLayer];
}
```

- [ ] **Step 2: Update `IntelMap.tsx` imports**

In `src/components/map/IntelMap.tsx`, change the import block. Replace:
```tsx
import { createStationLayer } from './StationLayer';
import { BRAND_LIST, allStations } from '@/data/stations';
```
with:
```tsx
import { createStationLayer, createClusterCache } from './StationLayer';
import { BRAND_LIST } from '@/data/stations';
import { useStations } from '@/hooks/useStations';
import { filterStations } from '@/lib/station-filter';
```

- [ ] **Step 3: Add the `useStations` call and the cluster-cache ref**

In `IntelMap`, immediately after the existing `const mapRef = useRef<MapRef>(null);` line, add:
```tsx
  const { stations } = useStations();
  const clusterCacheRef = useRef(createClusterCache());
```

- [ ] **Step 4: Throttle the RAF animation loop**

Replace the existing animation `useEffect` (the block that starts `// Animation loop for LIVE mode`) with:
```tsx
  // Animation loop for LIVE mode — commit state at ~10fps, not 60fps,
  // so the deckLayers memo rebuilds 6x less often.
  const frameRef = useRef(0);
  useEffect(() => {
    if (mapMode !== 'live') {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = () => {
      frameRef.current += 1;
      if (frameRef.current % 6 === 0) {
        setCurrentTime((t) => (t + 6) % 1000);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [mapMode]);
```

- [ ] **Step 5: Compute the filtered set once, and the cache key**

Immediately before the `const deckLayers = useMemo(` block, add:
```tsx
  const stationCacheKey = useMemo(
    () =>
      Array.from(visibleBrands).sort().join(',') +
      '|' + (selectedRegion ?? '') +
      '|' + statusFilter,
    [visibleBrands, selectedRegion, statusFilter],
  );

  const filteredStations = useMemo(
    () => filterStations(stations, { visibleBrands, selectedRegion, statusFilter }),
    [stations, visibleBrands, selectedRegion, statusFilter],
  );
```

- [ ] **Step 6: Update the `createStationLayer` call inside `deckLayers`**

Inside the `deckLayers` `useMemo`, replace the `...createStationLayer(...)` call with:
```tsx
      ...createStationLayer(
        filteredStations,
        stationsVisible,
        () => {
          /* future: station detail panel */
        },
        hoveredStation,
        setHoveredStation,
        setHoveredStationInfo,
        currentZoom,
        statusFilter,
        stationCacheKey,
        clusterCacheRef.current,
      ),
```

And update the `deckLayers` dependency array — replace it with:
```tsx
    [
      layers.facilities,
      layers.routes,
      mapMode,
      scenarioParams,
      timelinePosition,
      effectiveTime,
      handleSelect,
      hoveredFacility,
      stationsVisible,
      filteredStations,
      hoveredStation,
      currentZoom,
      statusFilter,
      stationCacheKey,
    ],
```

- [ ] **Step 7: Replace the count computations**

Replace these two blocks:
```tsx
  const totalStationCount = allStations.length;

  const filteredStationCount = useMemo(() => {
    return allStations.filter(
      (s) =>
        visibleBrands.has(s.brand) &&
        (!selectedRegion || s.region === selectedRegion) &&
        (!statusFilter || statusFilter === 'all' || s.status === statusFilter),
    ).length;
  }, [visibleBrands, selectedRegion, statusFilter]);
```
with:
```tsx
  const totalStationCount = stations.length;
  const filteredStationCount = filteredStations.length;
```

- [ ] **Step 8: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. `allStations` is no longer imported in `IntelMap` or `StationLayer`.

- [ ] **Step 9: Manually verify the map renders**

Run: `pnpm dev`, open `http://localhost:3007`, and confirm: the map loads, station dots/clusters appear after a moment (fetched), brand/region/status filters work, the count in the filter bar updates, and switching map modes (LIVE/SCENARIO/TIMELINE) works. Stop the dev server when done.

- [ ] **Step 10: Commit**

```bash
git add src/components/map/StationLayer.tsx src/components/map/IntelMap.tsx
git commit -m "wire map to fetched stations, fix cluster cache and RAF throttling"
```

---

## Task 7: Wire `CommandPalette` and `StationTrackerSection` to `useStations`

The last two `@/data/stations` consumers of `allStations`/`statusCounts`.

**Files:**
- Modify: `src/components/map/CommandPalette.tsx`
- Modify: `src/components/health/StationTrackerSection.tsx`

- [ ] **Step 1: Update `CommandPalette` to use `useStations`**

In `src/components/map/CommandPalette.tsx`, replace:
```tsx
import { allStations } from '@/data/stations';
```
with:
```tsx
import { useStations } from '@/hooks/useStations';
```

Inside the component body, immediately after `const inputRef = useRef<HTMLInputElement>(null);`, add:
```tsx
  const { stations } = useStations();
```

In the `results` `useMemo`, change `allStations` to `stations`:
```tsx
    const stationMatches = stations
```
And add `stations` to that `useMemo`'s dependency array — change `}, [query]);` to `}, [query, stations]);`.

- [ ] **Step 2: Update `StationTrackerSection` to use `useStations`**

Replace the entire contents of `src/components/health/StationTrackerSection.tsx` with:
```tsx
'use client';

import { useStations } from '@/hooks/useStations';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';

const STAT_CARDS: { label: string; status: StationStatus | null }[] = [
  { label: 'Total Tracked', status: null },
  { label: STATUS_LABELS['out-of-stock'], status: 'out-of-stock' },
  { label: STATUS_LABELS['low-supply'], status: 'low-supply' },
  { label: STATUS_LABELS.closed, status: 'closed' },
  { label: STATUS_LABELS.operational, status: 'operational' },
];

export function StationTrackerSection() {
  const { stations, statusCounts } = useStations();
  const total = stations.length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-petron" />
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Station Status
        </h2>
        <div className="flex-1 h-px bg-border-subtle ml-2" />
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Fuel availability across 10,469 monitored stations
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, status }) => {
          const count = status ? statusCounts[status] : total;
          const color = status ? STATUS_COLORS[status] : undefined;

          return (
            <div
              key={label}
              className="glass-card p-4"
              style={color ? { borderLeft: `3px solid ${color}` } : undefined}
            >
              <div
                className="font-mono text-2xl font-bold"
                style={color ? { color } : undefined}
              >
                {count.toLocaleString()}
              </div>
              <div className="text-xs text-text-secondary mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Source attribution */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-text-dim">
        <span>Sources:</span>
        <a
          href="https://wiki.openstreetmap.org/wiki/Philippines"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          OpenStreetMap (ODbL)
        </a>
        <span>·</span>
        <a
          href="https://legacy.doe.gov.ph/downstream-oil/lfro-with-valid-coc-lfo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          DOE LFRO Registry
        </a>
        <span>·</span>
        <a
          href="https://doe.gov.ph/articles/group/reports-information-resources"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          DOE Oil Supply Reports
        </a>
      </div>
    </div>
  );
}
```

Note: the "10,469 monitored stations" copy is intentionally left unchanged here — the data-honesty rewording is Wave 2's job. The `count` for "Total Tracked" now reads `total` from the fetched dataset; before the fetch resolves it briefly shows `0`.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/map/CommandPalette.tsx src/components/health/StationTrackerSection.tsx
git commit -m "wire command palette and station tracker to fetched stations"
```

---

## Task 8: Clean `src/data/stations/index.ts`

No module imports `allStations`, `statusCounts`, or `stationsByBrand` anymore — only `BRAND_LIST`. Remove the static JSON imports so 3.7 MB stops entering the bundle.

**Files:**
- Modify: `src/data/stations/index.ts`

- [ ] **Step 1: Confirm nothing still imports the removed exports**

Run:
```bash
grep -rn "allStations\|statusCounts\|stationsByBrand" src/ --include="*.ts" --include="*.tsx" | grep -v "src/data/stations/index.ts" | grep -v "src/hooks/useStations.ts"
```
Expected: no output. (If anything appears, migrate that file to `useStations()` before continuing.)

- [ ] **Step 2: Replace `src/data/stations/index.ts`**

Replace the entire contents of `src/data/stations/index.ts` with:
```ts
/**
 * Station brand registry.
 *
 * The full 10,469-station dataset is NOT imported here — it would add ~3.7 MB
 * to the client bundle. It is served as a static file (`public/data/stations.json`,
 * generated by `scripts/build-stations-json.mjs`) and fetched at runtime via the
 * `useStations` hook (`src/hooks/useStations.ts`).
 */

/** Canonical brand list — used for filter UIs. Order matches the brand JSON files. */
export const BRAND_LIST: string[] = [
  'Petron',
  'Shell',
  'Caltex',
  'Phoenix',
  'SeaOil',
  'Unioil',
  'Other',
];
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. Note the homepage First Load JS in the build's route table — it should be substantially lower than 447 kB.

- [ ] **Step 4: Commit**

```bash
git add src/data/stations/index.ts
git commit -m "remove 3.7MB static station JSON from the bundle"
```

---

## Task 9: Centralize price/event polling with `DataProvider`

Create one provider that polls `/api/prices` and `/api/events` once. Rewrite `usePrices`/`useEvents` as thin context readers returning the identical shapes — so no consumer component changes. Mount the provider in the root layout so every page (including sub-pages with `Header`/`Footer`) shares the single poll.

**Files:**
- Create: `src/lib/DataProvider.tsx`
- Modify: `src/hooks/usePrices.ts`
- Modify: `src/hooks/useEvents.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/lib/DataProvider.tsx`**

```tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { priceBenchmarks as staticPrices } from '@/data/prices';
import { timelineEvents as staticEvents } from '@/data/events';
import type { PriceBenchmark, TimelineEvent } from '@/types';

const PRICE_POLL = 5 * 60 * 1000; // 5 minutes
const EVENT_POLL = 3 * 60 * 1000; // 3 minutes
const MAX_HISTORY = 7; // ~35 min of price points at 5-min intervals

interface DataContextValue {
  prices: PriceBenchmark[];
  pricesLive: boolean;
  pricesUpdated: Date | null;
  priceHistory: Record<string, number[]>;
  events: TimelineEvent[];
  eventsLive: boolean;
  eventsUpdated: Date | null;
}

const DEFAULT_VALUE: DataContextValue = {
  prices: staticPrices,
  pricesLive: false,
  pricesUpdated: null,
  priceHistory: {},
  events: staticEvents,
  eventsLive: false,
  eventsUpdated: null,
};

const DataContext = createContext<DataContextValue>(DEFAULT_VALUE);

/**
 * Owns the single price + event polling loop for the whole app.
 * Mounted once in the root layout. `usePrices`/`useEvents` read from this context.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<PriceBenchmark[]>(staticPrices);
  const [pricesLive, setPricesLive] = useState(false);
  const [pricesUpdated, setPricesUpdated] = useState<Date | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const historyRef = useRef<Record<string, number[]>>({});

  const [events, setEvents] = useState<TimelineEvent[]>(staticEvents);
  const [eventsLive, setEventsLive] = useState(false);
  const [eventsUpdated, setEventsUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(() => {
    fetch('/api/prices')
      .then((r) => (r.ok ? r.json() : staticPrices))
      .then((data: PriceBenchmark[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrices(data);
          setPricesLive(true);
          setPricesUpdated(new Date());

          const updated = { ...historyRef.current };
          for (const b of data) {
            const prev = updated[b.id] ?? [];
            updated[b.id] = [...prev, b.value].slice(-MAX_HISTORY);
          }
          historyRef.current = updated;
          setPriceHistory(updated);
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks.
      });
  }, []);

  const fetchEvents = useCallback(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch('/api/events');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const list = Array.isArray(data) ? data : data.events;
        if (Array.isArray(list) && list.length > 0) {
          setEvents(list);
          setEventsLive(true);
          setEventsUpdated(new Date());
          return;
        }
      } catch {
        if (attempt < 2) await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      }
    }
    // Keep static fallback after all retries.
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, PRICE_POLL);
    return () => clearInterval(id);
  }, [fetchPrices]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, EVENT_POLL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  const value = useMemo<DataContextValue>(
    () => ({
      prices,
      pricesLive,
      pricesUpdated,
      priceHistory,
      events,
      eventsLive,
      eventsUpdated,
    }),
    [prices, pricesLive, pricesUpdated, priceHistory, events, eventsLive, eventsUpdated],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
```

- [ ] **Step 2: Rewrite `src/hooks/usePrices.ts` as a context reader**

Replace the entire contents of `src/hooks/usePrices.ts` with:
```ts
'use client';

import { useData } from '@/lib/DataProvider';

/**
 * Reads price data from the app-wide DataProvider context.
 * Returns the same shape it always has — no consumer changes needed.
 */
export function usePrices() {
  const { prices, pricesLive, pricesUpdated, priceHistory } = useData();
  return { prices, isLive: pricesLive, lastUpdated: pricesUpdated, priceHistory };
}
```

- [ ] **Step 3: Rewrite `src/hooks/useEvents.ts` as a context reader**

Replace the entire contents of `src/hooks/useEvents.ts` with:
```ts
'use client';

import { useData } from '@/lib/DataProvider';

/**
 * Reads event data from the app-wide DataProvider context.
 * Returns the same shape it always has — no consumer changes needed.
 */
export function useEvents() {
  const { events, eventsLive, eventsUpdated } = useData();
  return { events, isLive: eventsLive, lastUpdated: eventsUpdated };
}
```

- [ ] **Step 4: Mount `DataProvider` in the root layout**

In `src/app/layout.tsx`, add the import after the `globals.css` import:
```tsx
import "./globals.css";
import { DataProvider } from "@/lib/DataProvider";
```

Then wrap `{children}` with `<DataProvider>`. Change:
```tsx
        <a
          href="#snapshot"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-petron focus:text-white focus:rounded-lg focus:text-sm focus:font-mono"
        >
          Skip to main content
        </a>
        {children}
```
to:
```tsx
        <a
          href="#snapshot"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-petron focus:text-white focus:rounded-lg focus:text-sm focus:font-mono"
        >
          Skip to main content
        </a>
        <DataProvider>{children}</DataProvider>
```

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 6: Manually verify live data still flows**

Run: `pnpm dev`, open `http://localhost:3007`. Confirm the header "LIVE" badge appears once `/api/events` responds, the ticker shows prices, and the event timeline populates. Open the browser DevTools Network tab and confirm `/api/prices` and `/api/events` are each requested **once** on load (not 5–6×). Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/DataProvider.tsx src/hooks/usePrices.ts src/hooks/useEvents.ts src/app/layout.tsx
git commit -m "centralize price/event polling in a single DataProvider"
```

---

## Task 10: Collapse the double `dynamic()` map import

`page.tsx` dynamically imports `MapWrapper`, which itself dynamically imports `IntelMap` — two chunk round-trips. Import `IntelMap` directly and delete `MapWrapper`.

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/map/MapWrapper.tsx`

- [ ] **Step 1: Point the `page.tsx` dynamic import at `IntelMap`**

In `src/app/page.tsx`, replace:
```tsx
const MapWrapper = dynamic(
  () => import('@/components/map/MapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[clamp(350px,55vh,600px)] sm:h-[600px] glass-card rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-text-dim font-mono text-xs">Loading map...</span>
      </div>
    ),
  },
);
```
with:
```tsx
const MapWrapper = dynamic(
  () => import('@/components/map/IntelMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[clamp(350px,55vh,600px)] sm:h-[600px] glass-card rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-text-dim font-mono text-xs">Loading map...</span>
      </div>
    ),
  },
);
```
(The local name `MapWrapper` stays — `IntelMap` is a default export, so the dynamic import resolves it directly. The JSX usage `<MapWrapper ... />` is unchanged; `IntelMap`'s props are identical to `MapWrapper`'s.)

- [ ] **Step 2: Delete the redundant wrapper**

Run: `git rm src/components/map/MapWrapper.tsx`

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "collapse double dynamic import for the map"
```

---

## Task 11: Replace Recharts in `SparkChart` with a hand-rolled SVG

`SparkChart` is rendered inside the above-the-fold `ExecutiveSnapshot`, pulling Recharts into the initial bundle. Replace it with a pure SVG sparkline. Recharts stays a dependency (still used by `MarketShare`, which is below-the-fold and dynamically imported) but is added to `optimizePackageImports`.

**Files:**
- Modify: `src/components/prices/SparkChart.tsx`
- Modify: `next.config.mjs`

- [ ] **Step 1: Replace `SparkChart.tsx` with an SVG implementation**

Replace the entire contents of `src/components/prices/SparkChart.tsx` with:
```tsx
'use client';

import { useId } from 'react';

interface SparkChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  unit?: string;
}

/**
 * Lightweight SVG sparkline — area fill + line + last-point dot.
 * Replaces the Recharts AreaChart to keep Recharts out of the initial bundle.
 */
export function SparkChart({ data, color, width = 80, height = 24, unit }: SparkChartProps) {
  // useId() is SSR-safe; strip colons so the value is a valid SVG fragment id.
  const gradientId = `spark${useId().replace(/:/g, '')}`;

  if (data.length < 2) {
    // Not enough points for a trend — render an empty, fixed-size box (no CLS).
    return <div style={{ width, height }} aria-hidden="true" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const lastValue = data[data.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend sparkline, latest value ${lastValue.toFixed(2)}${unit ?? ''}`}
    >
      <title>
        {lastValue.toFixed(2)}
        {unit ?? ''}
      </title>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}
```
The props interface (`data`, `color`, `width`, `height`, `unit`) is unchanged, so the four call sites (`PricePanel`, `PumpPrices`, `ExecutiveSnapshot`, `SentimentGauge`) need no edits.

- [ ] **Step 2: Add `recharts` to `optimizePackageImports`**

Replace the entire contents of `next.config.mjs` with:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'd3-sankey',
      'd3-selection',
      'd3-shape',
      'recharts',
      'lucide-react',
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The homepage First Load JS in the route table should drop further (Recharts no longer in the initial chunk).

- [ ] **Step 4: Manually verify sparklines render**

Run: `pnpm dev`, open `http://localhost:3007`. Confirm the Executive Snapshot KPI cards and the price panels show their small trend sparklines (they appear once price history accumulates after the first poll). Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/prices/SparkChart.tsx next.config.mjs
git commit -m "replace Recharts sparkline with hand-rolled SVG"
```

---

## Task 12: Fix the `ScenarioPlanner` stale-closure bug

The live-price sync effect spreads a stale `params` closure, so a slider change made during a price poll can be silently overwritten. Use a functional updater and drop the eslint suppression.

**Files:**
- Modify: `src/components/scenarios/ScenarioPlanner.tsx`

- [ ] **Step 1: Fix the live-price sync effect**

In `src/components/scenarios/ScenarioPlanner.tsx`, replace this effect:
```tsx
  // Sync initial slider values with live prices once loaded (LIVE/SCENARIO only)
  useEffect(() => {
    if (mapMode !== 'timeline') {
      onParamsChange({
        ...params,
        brentPrice: Math.round(liveBrent),
        forexRate: liveForex,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveBrent, liveForex]);
```
with:
```tsx
  // Sync slider values with live prices when they change (LIVE/SCENARIO only).
  // Functional updater avoids overwriting a concurrent slider edit with a stale closure.
  useEffect(() => {
    if (mapMode !== 'timeline') {
      onParamsChange((prev) => ({
        ...prev,
        brentPrice: Math.round(liveBrent),
        forexRate: liveForex,
      }));
    }
  }, [liveBrent, liveForex, mapMode, onParamsChange]);
```

- [ ] **Step 2: Widen the `onParamsChange` prop type to accept an updater**

In the same file, change the `ScenarioPlannerProps` interface field:
```tsx
  onParamsChange: (params: ScenarioParams) => void;
```
to:
```tsx
  onParamsChange: (params: ScenarioParams | ((prev: ScenarioParams) => ScenarioParams)) => void;
```

This is satisfied by `page.tsx` — `handleParamsChange` is `useCallback(setScenarioParams, [])`, and React's `setState` already accepts both a value and an updater function. The other call sites in this file (`updateParam`, `onLoad`, the timeline effect) pass plain `ScenarioParams` objects, which remain valid.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed, with no `react-hooks/exhaustive-deps` warnings for this file.

- [ ] **Step 4: Commit**

```bash
git add src/components/scenarios/ScenarioPlanner.tsx
git commit -m "fix stale-closure bug in scenario planner price sync"
```

---

## Task 13: Add `Cache-Control` to API error fallbacks

The `catch` branches of `/api/prices` and `/api/events` return fallback data with no cache header — an upstream outage lets every polling browser bypass the CDN and hammer the function.

**Files:**
- Modify: `src/app/api/prices/route.ts`
- Modify: `src/app/api/events/route.ts`

- [ ] **Step 1: Add the header in `/api/prices`**

In `src/app/api/prices/route.ts`, replace the `catch` block:
```ts
  } catch {
    return NextResponse.json(priceBenchmarks);
  }
```
with:
```ts
  } catch {
    return NextResponse.json(priceBenchmarks, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  }
```

- [ ] **Step 2: Add the header in `/api/events`**

In `src/app/api/events/route.ts`, replace the `catch` block:
```ts
  } catch {
    // Fallback to static data on any error
    return NextResponse.json({ events: timelineEvents, lastChecked: null });
  }
```
with:
```ts
  } catch {
    // Fallback to static data on any error
    return NextResponse.json(
      { events: timelineEvents, lastChecked: null },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } },
    );
  }
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/prices/route.ts src/app/api/events/route.ts
git commit -m "add Cache-Control to API error fallback responses"
```

---

## Task 14: Delete dead code

`LayerControls.tsx` is exported but never imported (superseded by `MapToolbar`). `src/pages/_error.tsx` is a stray Pages-Router file unused by the App Router.

**Files:**
- Delete: `src/components/map/LayerControls.tsx`
- Delete: `src/pages/_error.tsx`

- [ ] **Step 1: Confirm `LayerControls` is unreferenced**

Run:
```bash
grep -rn "LayerControls" src/ --include="*.ts" --include="*.tsx" | grep -v "src/components/map/LayerControls.tsx"
```
Expected: no output.

- [ ] **Step 2: Delete both files**

Run:
```bash
git rm src/components/map/LayerControls.tsx src/pages/_error.tsx
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git commit -m "delete dead LayerControls and stray pages/_error"
```

---

## Task 15: Final verification

Confirm the wave's gate criteria.

- [ ] **Step 1: Clean build + record bundle size**

Run: `pnpm build`
Expected: build succeeds. In the route table, record the `/` row's First Load JS. It should be well below the original 447 kB (target ≤200 kB; if deck.gl + maplibre alone push it to ~250 kB, that is acceptable per the spec). Note the number in the commit message of Step 5.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass (smoke + `filterStations` + `buildStationsData`).

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no errors, no `react-hooks/exhaustive-deps` warnings.

- [ ] **Step 4: Manual smoke test of the dashboard**

Run: `pnpm dev`, open `http://localhost:3007`, and confirm:
- The map renders; station dots/clusters appear after the fetch resolves.
- All 3 map modes (LIVE / SCENARIO / TIMELINE) render correctly.
- Brand/region/status filters work and the station count updates.
- The header "LIVE" badge, ticker, price panels, and event timeline populate.
- In DevTools Network: `/api/prices` and `/api/events` are each requested once on load; `/data/stations.json` is fetched once.
- The Scenario Planner sliders work and drive the result panel.

Stop the dev server.

- [ ] **Step 5: Commit the verification note**

If `pnpm build` produced no file changes, there is nothing to commit — skip. Otherwise:
```bash
git add -A
git commit -m "Wave 1 complete — homepage First Load JS now <measured> kB"
```

---

## Self-Review Notes

- **Spec coverage:** This plan implements every Wave 1 row of the spec's "Wave 1 — Foundation & Performance" table: station JSON out of the bundle (Tasks 2, 4–8), centralized polling (Task 9), collapsed double `dynamic()` (Task 10), `recharts` optimization + SVG sparkline (Task 11), `StationLayer` cache fix (Task 6), `ScenarioPlanner` stale closure (Task 12), RAF throttle (Task 6), de-duplicated `filteredStationCount` (Tasks 3, 6), `Cache-Control` on API error paths (Task 13), dead-code deletion (Task 14). Vitest setup (Task 1) is added as foundation for this wave's tests and every later wave's regression tests.
- **Gate criteria** (from the spec): build green ✓ (every task), First Load JS measured ✓ (Task 15), exactly 2 polling loops ✓ (Task 9 + manual check), no `exhaustive-deps` suppressions ✓ (Task 12 removes the only ones touched here), all 3 map modes render ✓ (Task 15).
- **Type consistency:** `filterStations`/`StationFilterCriteria` (Task 3) are used identically in Task 6. `ClusterCache`/`createClusterCache` (Task 6, `StationLayer.tsx`) are imported and used in `IntelMap`. `buildStationsData`/`StationsData` (Task 4) are consumed by `useStations` in the same file. `DataContextValue` (Task 9) field names (`pricesLive`, `pricesUpdated`, `eventsLive`, `eventsUpdated`) are mapped back to the original `isLive`/`lastUpdated` names inside `usePrices`/`useEvents`, so consumer components are untouched.
- **Build stays green between tasks:** the static exports in `src/data/stations/index.ts` are removed (Task 8) only after all six consumers are migrated (Tasks 5–7).
