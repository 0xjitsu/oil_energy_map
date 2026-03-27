# Wave 3: Executive Snapshot + Gas Station Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dramatic Executive Snapshot KPI row above the map (Brent, Forex, Gas, Diesel, Risk, Disruptions with sparklines + deltas), and a nationwide gas station map layer (~7,000 stations) with brand-colored dots, clustering, and per-brand toggles.

**Architecture:** Executive Snapshot is a new `ExecutiveSnapshot` component consuming `usePrices` + `useEvents` hooks, placed between Header and map in `page.tsx`. Gas station layer uses a one-time Firecrawl scrape to seed `/data/stations/` JSON files, rendered as a deck.gl ScatterplotLayer with `radiusUnits: 'pixels'` (same pattern as FacilityLayer). LayerControls extended with per-brand toggles.

**Tech Stack:** Next.js App Router, React hooks, deck.gl ScatterplotLayer, Recharts (SparkChart), Firecrawl CLI, Tailwind CSS

---

## File Manifest

| # | Action | File | Task |
|---|--------|------|------|
| 1 | Create | `src/components/layout/ExecutiveSnapshot.tsx` | 1 |
| 2 | Modify | `src/app/page.tsx` | 1 |
| 3 | Create | `scripts/scrape-stations.ts` | 2 |
| 4 | Create | `src/data/stations/index.ts` | 3 |
| 5 | Create | `src/data/stations/petron.json` | 2 (output) |
| 6 | Create | `src/data/stations/shell.json` | 2 (output) |
| 7 | Create | `src/data/stations/phoenix.json` | 2 (output) |
| 8 | Create | `src/data/stations/caltex.json` | 2 (output) |
| 9 | Create | `src/data/stations/seaoil.json` | 2 (output) |
| 10 | Create | `src/data/stations/others.json` | 2 (output) |
| 11 | Create | `src/types/stations.ts` | 3 |
| 12 | Create | `src/components/map/StationLayer.tsx` | 3 |
| 13 | Modify | `src/components/map/IntelMap.tsx` | 4 |
| 14 | Modify | `src/components/map/LayerControls.tsx` | 4 |
| 15 | Commit | — | 5 |

---

## Task 1: Executive Snapshot KPI Row

**Why:** The dashboard currently goes Alert → Ticker → Header → Map. There's no "at a glance" summary. The Executive Snapshot adds a Bloomberg-style KPI row: 6 cards with live numbers, deltas, and sparklines. First thing a user reads after the headline ticker.

**Files:**
- Create: `src/components/layout/ExecutiveSnapshot.tsx`
- Modify: `src/app/page.tsx`

**Data mapping** (from existing `usePrices` hook — no new API needed):

| KPI | Source Benchmark ID | Display |
|-----|-------------------|---------|
| Brent Crude | `brent-crude` | `$108.10` + `↑6.5%` + sparkline |
| PHP/USD | `php-usd` | `₱58.85` + `↑1.7%` + sparkline |
| Gasoline | `pump-gasoline` | `₱80.20/L` + `↑₱5.50` + sparkline |
| Diesel | `pump-diesel` | `₱74.80/L` + `↑₱5.90` + sparkline |
| Supply Risk | derived from `scenarioParams` | `HIGH` badge (green/yellow/red) |
| Disruptions | from `useEvents` | count of critical events |

- [ ] **Step 1: Create ExecutiveSnapshot component**

Create `src/components/layout/ExecutiveSnapshot.tsx`:

```tsx
'use client';

import { usePrices } from '@/hooks/usePrices';
import { useEvents } from '@/hooks/useEvents';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { SparkChart } from '@/components/prices/SparkChart';
import type { ScenarioParams } from '@/types';

function getRiskLevel(params: ScenarioParams): { label: string; color: string } {
  const score = params.hormuzWeeks / 16 + (params.refineryOffline ? 0.3 : 0) +
    (params.brentPrice - 106) / 150;
  if (score > 0.6) return { label: 'CRITICAL', color: 'text-red-400' };
  if (score > 0.3) return { label: 'HIGH', color: 'text-amber-400' };
  if (score > 0.1) return { label: 'MODERATE', color: 'text-yellow-400' };
  return { label: 'LOW', color: 'text-emerald-400' };
}

function KPICard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number;
  deltaLabel: string;
  sparkData: number[];
  sparkColor: string;
}) {
  const animated = useAnimatedNumber(value);
  const isUp = delta > 0;
  const pctChange = ((delta / (value - delta)) * 100);

  return (
    <div className="glass-card p-4 flex flex-col justify-between min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 truncate">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-2xl lg:text-3xl font-mono font-bold text-[rgba(255,255,255,0.9)] tabular-nums">
            {unit === '$/bbl' ? `$${animated.toFixed(1)}` :
             unit === '₱/$' ? `₱${animated.toFixed(2)}` :
             `₱${animated.toFixed(2)}`}
          </span>
          {unit === '₱/liter' && (
            <span className="text-xs text-[rgba(255,255,255,0.2)] font-mono ml-0.5">/L</span>
          )}
        </div>
        {sparkData.length >= 2 && (
          <SparkChart data={sparkData} color={sparkColor} width={64} height={24} />
        )}
      </div>
      <p className={`mt-1.5 text-[11px] font-mono ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
        {isUp ? '▲' : '▼'} {deltaLabel} ({Math.abs(pctChange).toFixed(1)}%)
      </p>
    </div>
  );
}

function RiskBadge({ params }: { params: ScenarioParams }) {
  const { label, color } = getRiskLevel(params);
  return (
    <div className="glass-card p-4 flex flex-col justify-between">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1">
        Supply Risk
      </p>
      <span className={`text-2xl lg:text-3xl font-mono font-bold ${color}`}>
        {label}
      </span>
      <p className="mt-1.5 text-[11px] font-mono text-[rgba(255,255,255,0.2)]">
        Hormuz + Refinery
      </p>
    </div>
  );
}

function DisruptionCount() {
  const { events } = useEvents();
  const critical = events.filter((e) => e.severity === 'red').length;
  return (
    <div className="glass-card p-4 flex flex-col justify-between">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1">
        Active Disruptions
      </p>
      <span className={`text-2xl lg:text-3xl font-mono font-bold ${
        critical > 2 ? 'text-red-400' : critical > 0 ? 'text-amber-400' : 'text-emerald-400'
      }`}>
        {critical}
      </span>
      <p className="mt-1.5 text-[11px] font-mono text-[rgba(255,255,255,0.2)]">
        of {events.length} events
      </p>
    </div>
  );
}

interface ExecutiveSnapshotProps {
  scenarioParams: ScenarioParams;
}

export function ExecutiveSnapshot({ scenarioParams }: ExecutiveSnapshotProps) {
  const { prices, priceHistory } = usePrices();

  const brent = prices.find((p) => p.id === 'brent-crude');
  const forex = prices.find((p) => p.id === 'php-usd');
  const gasoline = prices.find((p) => p.id === 'pump-gasoline');
  const diesel = prices.find((p) => p.id === 'pump-diesel');

  if (!brent || !forex || !gasoline || !diesel) return null;

  const kpis = [
    {
      label: 'Brent Crude',
      benchmark: brent,
      unit: '$/bbl',
      sparkColor: '#3b82f6',
      deltaLabel: `$${Math.abs(brent.value - brent.previousWeek).toFixed(1)}`,
    },
    {
      label: 'PHP/USD',
      benchmark: forex,
      unit: '₱/$',
      sparkColor: '#a855f7',
      deltaLabel: `₱${Math.abs(forex.value - forex.previousWeek).toFixed(2)}`,
    },
    {
      label: 'Gasoline',
      benchmark: gasoline,
      unit: '₱/liter',
      sparkColor: '#ef4444',
      deltaLabel: `₱${Math.abs(gasoline.value - gasoline.previousWeek).toFixed(2)}`,
    },
    {
      label: 'Diesel',
      benchmark: diesel,
      unit: '₱/liter',
      sparkColor: '#f59e0b',
      deltaLabel: `₱${Math.abs(diesel.value - diesel.previousWeek).toFixed(2)}`,
    },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(({ label, benchmark, unit, sparkColor, deltaLabel }) => (
        <KPICard
          key={benchmark.id}
          label={label}
          value={benchmark.value}
          unit={unit}
          delta={benchmark.value - benchmark.previousWeek}
          deltaLabel={deltaLabel}
          sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
          sparkColor={sparkColor}
        />
      ))}
      <RiskBadge params={scenarioParams} />
      <DisruptionCount />
    </section>
  );
}
```

- [ ] **Step 2: Add ExecutiveSnapshot to page.tsx**

In `src/app/page.tsx`, add import and place between Header and the map section:

```tsx
import { ExecutiveSnapshot } from '@/components/layout/ExecutiveSnapshot';
```

Insert after `<Header />` and before the `<main>` tag's first `<section>`:

```tsx
<main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
  {/* Executive Snapshot — "Bloomberg at a glance" */}
  <ExecutiveSnapshot scenarioParams={scenarioParams} />

  {/* Hero: Map + Price Sidebar */}
  <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/bbmisa/oil_energy_map && pnpm build`
Expected: Clean build, no errors

- [ ] **Step 4: Visual verification**

Start dev server, screenshot the page. Confirm:
- 6 KPI cards render in a row below the header
- Numbers are large and monospace
- Delta arrows show ▲/▼ with percentage
- Sparklines render when history has ≥2 points
- Supply Risk shows correct level
- Disruption count shows red event count

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ExecutiveSnapshot.tsx src/app/page.tsx
git commit -m "feat: add Executive Snapshot KPI row above map

Bloomberg-style at-a-glance row with Brent, Forex, Gasoline,
Diesel prices, supply risk level, and active disruption count.
Each card shows animated number, delta arrow, percentage change,
and sparkline from price history."
```

---

## Task 2: Gas Station Data Scraping (One-Time Seed)

**Why:** The map currently shows 15 facilities (refineries, terminals, depots). Adding ~7,000 gas stations provides the "commercial layer" — where every brand's retail footprint lives. This is a one-time scrape to seed the data; stations don't open/close frequently.

**Files:**
- Create: `scripts/scrape-stations.ts`
- Output: `src/data/stations/*.json`

**Strategy:** Use Firecrawl to scrape station locator pages from each brand's website. Where Firecrawl can't extract structured coordinates, fall back to DOE public station registry data. Store results as JSON files in `src/data/stations/`.

- [ ] **Step 1: Create the scraping script**

Create `scripts/scrape-stations.ts`. This is a standalone Node/Bun script that:
1. Uses Firecrawl API to scrape each brand's station locator
2. Extracts station name, coordinates, address from the scraped content
3. Writes to `src/data/stations/<brand>.json`

```typescript
#!/usr/bin/env npx tsx
/**
 * One-time gas station scraper for Philippine fuel brands.
 *
 * Usage: npx tsx scripts/scrape-stations.ts
 *
 * Uses Firecrawl API to scrape station locator pages.
 * Output: src/data/stations/<brand>.json
 *
 * API key: stored in macOS Keychain under "firecrawl-api-key"
 * Retrieve: security find-generic-password -s "firecrawl-api-key" -w
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const FIRECRAWL_API = 'https://api.firecrawl.dev/v1';
const API_KEY = process.env.FIRECRAWL_API_KEY;

if (!API_KEY) {
  console.error('Set FIRECRAWL_API_KEY env var. Retrieve from Keychain:');
  console.error('  export FIRECRAWL_API_KEY=$(security find-generic-password -s "firecrawl-api-key" -w)');
  process.exit(1);
}

interface ScrapedStation {
  id: string;
  brand: string;
  name: string;
  coordinates: [number, number];
  address: string;
  fuelTypes?: string[];
  source: { url: string; scrapedAt: string };
}

const BRANDS = [
  { brand: 'petron', url: 'https://www.petron.com/station-locator/', label: 'Petron' },
  { brand: 'shell', url: 'https://www.shell.com.ph/motorists/shell-station-locator.html', label: 'Shell' },
  { brand: 'phoenix', url: 'https://www.phoenixfuels.ph/station-locator/', label: 'Phoenix' },
  { brand: 'caltex', url: 'https://www.caltex.com/ph/find-nearest-station.html', label: 'Caltex' },
  { brand: 'seaoil', url: 'https://www.seaoil.com.ph/station-locator/', label: 'SeaOil' },
  { brand: 'unioil', url: 'https://www.unioil.com/stations', label: 'Unioil' },
];

const OUTPUT_DIR = join(__dirname, '..', 'src', 'data', 'stations');

async function scrapeWithFirecrawl(url: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_API}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });
  if (!res.ok) throw new Error(`Firecrawl error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data?.markdown ?? '';
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const now = new Date().toISOString();

  for (const { brand, url, label } of BRANDS) {
    console.log(`Scraping ${label} from ${url}...`);
    try {
      const content = await scrapeWithFirecrawl(url);
      // Write raw scraped content for manual processing
      writeFileSync(
        join(OUTPUT_DIR, `${brand}-raw.md`),
        `# ${label} Station Locator Scrape\n\nSource: ${url}\nDate: ${now}\n\n${content}`
      );
      console.log(`  ✓ Saved ${brand}-raw.md (${content.length} chars)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }

  console.log('\nRaw scrapes saved. Run the parser next to extract structured station data.');
  console.log('If station locators use dynamic JS, use: firecrawl browser <url>');
}

main();
```

- [ ] **Step 2: Run the scrape**

```bash
export FIRECRAWL_API_KEY=$(security find-generic-password -s "firecrawl-api-key" -w)
cd /Users/bbmisa/oil_energy_map && npx tsx scripts/scrape-stations.ts
```

Review the raw markdown outputs. If station locators are JS-heavy (likely), use Firecrawl browser mode:
```bash
firecrawl browser "https://www.petron.com/station-locator/"
```

- [ ] **Step 3: Parse raw scrapes into structured JSON**

After reviewing the raw scrapes, create a parser that extracts station data into the target schema. This step may require manual curation for brands whose locators don't expose structured data. As a fallback, use DOE's public station registry.

Write each brand's stations to `src/data/stations/<brand>.json`:
```json
[
  {
    "id": "petron-edsa-mandaluyong",
    "brand": "Petron",
    "name": "Petron EDSA Mandaluyong",
    "coordinates": [14.5764, 121.0344],
    "address": "EDSA cor. Shaw Blvd, Mandaluyong City",
    "source": { "url": "https://petron.com/station-locator/", "scrapedAt": "2026-03-27T00:00:00Z" }
  }
]
```

- [ ] **Step 4: Commit scraped data**

```bash
git add scripts/scrape-stations.ts src/data/stations/
git commit -m "feat: add gas station scraping pipeline and seed data

One-time Firecrawl-based scrape of Philippine gas station locations
across Petron, Shell, Phoenix, Caltex, SeaOil, Unioil. Stores as
structured JSON in src/data/stations/ with source provenance."
```

---

## Task 3: Gas Station Map Layer

**Why:** Render the scraped station data on the map as a new deck.gl layer with brand-colored dots, following the same pattern as FacilityLayer (ScatterplotLayer, `radiusUnits: 'pixels'`).

**Files:**
- Create: `src/types/stations.ts`
- Create: `src/data/stations/index.ts`
- Create: `src/components/map/StationLayer.tsx`

- [ ] **Step 1: Create station types**

Create `src/types/stations.ts`:

```typescript
export interface GasStation {
  id: string;
  brand: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  address: string;
  fuelTypes?: string[];
  source: {
    url: string;
    scrapedAt: string;
  };
}

export const BRAND_COLORS: Record<string, string> = {
  Petron: '#3b82f6',    // blue — matches existing Petron color
  Shell: '#facc15',     // yellow
  Phoenix: '#f97316',   // orange
  Caltex: '#ef4444',    // red
  SeaOil: '#06b6d4',    // cyan — matches existing SeaOil color
  Unioil: '#22c55e',    // green
  Other: '#94a3b8',     // slate
};
```

- [ ] **Step 2: Create station data index**

Create `src/data/stations/index.ts`:

```typescript
import type { GasStation } from '@/types/stations';

// Import all brand JSON files
// These are populated by scripts/scrape-stations.ts
import petronStations from './petron.json';
import shellStations from './shell.json';
import phoenixStations from './phoenix.json';
import caltexStations from './caltex.json';
import seaoilStations from './seaoil.json';
import othersStations from './others.json';

export const allStations: GasStation[] = [
  ...(petronStations as GasStation[]),
  ...(shellStations as GasStation[]),
  ...(phoenixStations as GasStation[]),
  ...(caltexStations as GasStation[]),
  ...(seaoilStations as GasStation[]),
  ...(othersStations as GasStation[]),
];

export const stationsByBrand = {
  Petron: petronStations as GasStation[],
  Shell: shellStations as GasStation[],
  Phoenix: phoenixStations as GasStation[],
  Caltex: caltexStations as GasStation[],
  SeaOil: seaoilStations as GasStation[],
  Other: othersStations as GasStation[],
};

export const BRAND_LIST = Object.keys(stationsByBrand);
```

- [ ] **Step 3: Create StationLayer component**

Create `src/components/map/StationLayer.tsx`:

```typescript
import { ScatterplotLayer } from '@deck.gl/layers';
import { allStations } from '@/data/stations';
import { BRAND_COLORS } from '@/types/stations';
import type { GasStation } from '@/types/stations';
import type { Layer } from '@deck.gl/core';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function createStationLayer(
  visible: boolean,
  visibleBrands: Set<string>,
  onSelect: (station: GasStation) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
): Layer {
  const filtered = allStations.filter((s) => visibleBrands.has(s.brand));

  return new ScatterplotLayer<GasStation>({
    id: 'gas-stations',
    data: filtered,
    visible,
    pickable: true,
    getPosition: (d) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d) => (d.id === hoveredId ? 6 : 4),
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 2,
    radiusMaxPixels: 8,
    getFillColor: (d) => {
      const rgb = hexToRgb(BRAND_COLORS[d.brand] ?? BRAND_COLORS.Other);
      const alpha = d.id === hoveredId ? 255 : 180;
      return [...rgb, alpha] as [number, number, number, number];
    },
    onClick: ({ object }: { object?: GasStation }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: GasStation }) => {
      setHoveredId(object ? object.id : null);
    },
    updateTriggers: {
      getFillColor: [hoveredId],
      getRadius: [hoveredId],
      data: [visibleBrands],
    },
  });
}
```

- [ ] **Step 4: Commit station layer**

```bash
git add src/types/stations.ts src/data/stations/index.ts src/components/map/StationLayer.tsx
git commit -m "feat: add gas station map layer with brand colors

ScatterplotLayer rendering ~7,000 gas stations with brand-colored
dots (Petron blue, Shell yellow, Phoenix orange, etc). Uses pixel-
based radius for zoom-independent visibility. Filterable by brand."
```

---

## Task 4: Integrate Station Layer into Map

**Why:** Wire the new StationLayer into IntelMap and add per-brand toggles to LayerControls.

**Files:**
- Modify: `src/components/map/IntelMap.tsx`
- Modify: `src/components/map/LayerControls.tsx`

- [ ] **Step 1: Update IntelMap to include station layer**

In `src/components/map/IntelMap.tsx`:

1. Add import:
```typescript
import { createStationLayer } from './StationLayer';
import { BRAND_LIST } from '@/data/stations';
```

2. Add state for brand visibility:
```typescript
const [stationsVisible, setStationsVisible] = useState(true);
const [visibleBrands, setVisibleBrands] = useState<Set<string>>(new Set(BRAND_LIST));
```

3. Add station hover state:
```typescript
const [hoveredStation, setHoveredStation] = useState<string | null>(null);
```

4. Add station layer to `deckLayers` useMemo:
```typescript
const deckLayers = useMemo(
  () => [
    ...createFacilityLayers(
      layers.facilities, mapMode, scenarioParams, timelinePosition,
      handleSelect, hoveredFacility, setHoveredFacility,
    ),
    ...createRouteLayers(layers.routes, mapMode, effectiveTime, scenarioParams),
    createStationLayer(
      stationsVisible, visibleBrands,
      (station) => { /* TODO: station detail panel */ },
      hoveredStation, setHoveredStation,
    ),
  ],
  [layers.facilities, layers.routes, mapMode, scenarioParams,
   timelinePosition, effectiveTime, handleSelect, hoveredFacility,
   stationsVisible, visibleBrands, hoveredStation],
);
```

5. Pass station props to LayerControls:
```typescript
<LayerControls
  layers={layers}
  onToggle={handleToggle}
  mapMode={mapMode}
  onModeChange={onModeChange}
  stationsVisible={stationsVisible}
  onStationsToggle={() => setStationsVisible((v) => !v)}
  visibleBrands={visibleBrands}
  onBrandToggle={(brand) => {
    setVisibleBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }}
/>
```

- [ ] **Step 2: Update LayerControls with brand toggles**

In `src/components/map/LayerControls.tsx`:

1. Add new props:
```typescript
import { BRAND_COLORS } from '@/types/stations';
import { BRAND_LIST } from '@/data/stations';

interface LayerControlsProps {
  // ...existing props...
  stationsVisible: boolean;
  onStationsToggle: () => void;
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
}
```

2. Add a "Stations" master toggle + collapsible brand list below existing layer toggles:

```tsx
{/* Station layer toggle */}
<button
  onClick={onStationsToggle}
  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
    stationsVisible
      ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
      : 'text-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
  }`}
>
  <span className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
    stationsVisible
      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
      : 'bg-[rgba(255,255,255,0.1)]'
  }`} />
  Stations
</button>

{/* Brand filters (only shown when stations visible) */}
{stationsVisible && (
  <div className="flex flex-wrap gap-1 pl-4">
    {BRAND_LIST.map((brand) => {
      const isActive = visibleBrands.has(brand);
      const color = BRAND_COLORS[brand] ?? '#94a3b8';
      return (
        <button
          key={brand}
          onClick={() => onBrandToggle(brand)}
          className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all ${
            isActive
              ? 'text-white bg-[rgba(255,255,255,0.1)]'
              : 'text-[rgba(255,255,255,0.2)] bg-transparent'
          }`}
          style={{ borderLeft: `2px solid ${isActive ? color : 'transparent'}` }}
        >
          {brand}
        </button>
      );
    })}
  </div>
)}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/bbmisa/oil_energy_map && pnpm build`
Expected: Clean build

- [ ] **Step 4: Visual verification**

Screenshot the map. Confirm:
- Gas station dots visible at higher zoom levels
- Brand colors match (Petron blue, Shell yellow, etc.)
- LayerControls shows "Stations" toggle with brand sub-toggles
- Toggling brands hides/shows the correct dots
- Facilities (refineries/terminals) still render on top of stations

- [ ] **Step 5: Commit**

```bash
git add src/components/map/IntelMap.tsx src/components/map/LayerControls.tsx
git commit -m "feat: integrate station layer into map with brand toggles

Wire StationLayer into IntelMap deck.gl overlay. Add per-brand
filter toggles to LayerControls (Petron, Shell, Phoenix, Caltex,
SeaOil, Unioil). Stations render below facility layers."
```

---

## Task 5: Final Commit + Verification

- [ ] **Step 1: Full build check**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
```

- [ ] **Step 2: Visual walkthrough**

Start dev server, verify the full narrative flow:
1. Alert Banner → News Ticker → **Executive Snapshot KPIs** → Map
2. Map shows facilities (glow + dots + labels) + routes + station dots
3. LayerControls has Infrastructure, Routes, Labels, **Stations** toggles
4. Station brand sub-toggles filter correctly
5. Scroll down: Pump Prices, Impact Cards, Price Intelligence, Scenario Planner, Market Players, System Health, Sentiment, Events

- [ ] **Step 3: Do NOT push**

Per user instruction — all changes stay local on `feat/animated-map-modes`.

---

## Verification Checklist

1. `pnpm build` passes clean
2. Executive Snapshot: 6 KPI cards with large numbers, deltas, sparklines
3. Brent shows $/bbl with ▲/▼ arrow and % change
4. Supply Risk badge color-codes correctly (LOW/MODERATE/HIGH/CRITICAL)
5. Disruption count reflects critical event count from RSS feed
6. Gas station layer renders ~7,000 dots with correct brand colors
7. Brand toggles in LayerControls filter stations correctly
8. Facilities render ON TOP of stations (layer order correct)
9. Performance: map maintains 60fps with all layers on
10. No push to remote
