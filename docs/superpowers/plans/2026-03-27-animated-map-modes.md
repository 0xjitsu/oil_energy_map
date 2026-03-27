# Animated Map Visualization Modes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three togglable map visualization modes (LIVE, SCENARIO, TIMELINE) with animated tanker routes (TripsLayer), 3D facility columns (ColumnLayer), and bidirectional ScenarioPlanner integration.

**Architecture:** Lift map mode and scenario state to `page.tsx`. IntelMap receives mode/params props and configures deck.gl layers accordingly. ScenarioPlanner becomes a controlled component that can both emit and receive scenario parameters. A new TimelineSlider component drives temporal scrubbing.

**Tech Stack:** deck.gl 9 (TripsLayer from `@deck.gl/geo-layers`, ColumnLayer from `@deck.gl/layers`), MapLibre GL, React 18, Next.js 14, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-27-animated-map-modes-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | Type definitions: `MapMode`, extended `ShippingRoute`, extended `Facility` |
| `src/data/shipping-routes.ts` | Static shipping route data with timestamps |
| `src/data/facilities.ts` | Static facility data with productionBpd values |
| `src/components/map/ShippingLayer.tsx` | TripsLayer + ArcLayer factory, mode-aware animation |
| `src/components/map/FacilityLayer.tsx` | ColumnLayer factory, mode-aware elevation/color |
| `src/components/map/IntelMap.tsx` | Map orchestrator: rAF loop, layer composition, props interface |
| `src/components/map/MapWrapper.tsx` | Dynamic import wrapper, prop forwarding |
| `src/components/map/LayerControls.tsx` | Mode selector + layer toggle UI |
| `src/components/map/TimelineSlider.tsx` | Play/pause + range slider for TIMELINE mode |
| `src/app/page.tsx` | Root layout: lifted state, component wiring |
| `src/components/scenarios/ScenarioPlanner.tsx` | Controlled scenario params, timeline-driven read-only mode |

---

## Task 1: Add dependency and update types

**Files:**
- Modify: `package.json` (add `@deck.gl/geo-layers`)
- Modify: `src/types/index.ts` (add `MapMode`, extend `ShippingRoute`, extend `Facility`)

- [ ] **Step 1: Install `@deck.gl/geo-layers`**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm add @deck.gl/geo-layers@^9.2.11
```

Expected: Package added, lockfile updated.

- [ ] **Step 2: Add `MapMode` type and extend interfaces**

In `src/types/index.ts`, add after the existing type exports:

```typescript
export type MapMode = 'live' | 'scenario' | 'timeline';
```

Extend `ShippingRoute` — add `timestamps` field:

```typescript
export interface ShippingRoute {
  // ... existing fields remain unchanged
  timestamps: number[]; // array of numbers matching coordinates array length
}
```

Extend `Facility` — add `productionBpd` field:

```typescript
export interface Facility {
  // ... existing fields remain unchanged
  productionBpd: number; // numeric capacity for ColumnLayer height
}
```

- [ ] **Step 3: Verify build compiles (expect failures in data files)**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build 2>&1 | head -30
```

Expected: Type errors in `shipping-routes.ts` and `facilities.ts` (missing new required fields). This confirms the types are correctly enforced.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/types/index.ts
git commit -m "feat: add @deck.gl/geo-layers dep and extend types for animated map modes"
```

---

## Task 2: Update static data files

**Files:**
- Modify: `src/data/shipping-routes.ts` (add `timestamps` to all 4 routes)
- Modify: `src/data/facilities.ts` (add `productionBpd` to all 11 facilities)

- [ ] **Step 1: Add timestamps to shipping routes**

Each route's `timestamps` array must match its `coordinates` array length. Values are evenly spaced 0–1000:

```typescript
// Hormuz route (6 coordinates → 6 timestamps)
timestamps: [0, 200, 400, 600, 800, 1000],

// ESPO route (5 coordinates → 5 timestamps)
timestamps: [0, 250, 500, 750, 1000],

// Singapore route (5 coordinates → 5 timestamps)
timestamps: [0, 250, 500, 750, 1000],

// South Korea route (5 coordinates → 5 timestamps)
timestamps: [0, 250, 500, 750, 1000],
```

- [ ] **Step 2: Add productionBpd to all facilities**

Use values from the spec:

| Facility ID | productionBpd |
|-------------|---------------|
| `petron-bataan` | 180000 |
| `shell-tabangao-refinery` | 110000 |
| `shell-shift-tabangao` | 45000 |
| `chevron-batangas` | 40000 |
| `phoenix-calaca` | 8000 |
| `chevron-lapu-lapu` | 15000 |
| `shell-darong` | 12000 |
| `shell-north-luzon` | 3000 |
| `phoenix-davao` | 4000 |
| `phoenix-cdo` | 2500 |
| `metro-manila` | 50000 |

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
```

Expected: Clean build. Type errors from Task 1 Step 3 should be resolved.

- [ ] **Step 4: Commit**

```bash
git add src/data/shipping-routes.ts src/data/facilities.ts
git commit -m "feat: add timestamps to shipping routes and productionBpd to facilities"
```

---

## Task 3: Replace ShippingLayer with TripsLayer

**Files:**
- Modify: `src/components/map/ShippingLayer.tsx`

- [ ] **Step 1: Replace PathLayer with TripsLayer, update factory signature**

Replace the full file content. Key changes:
- Import `TripsLayer` from `@deck.gl/geo-layers`
- Keep `ArcLayer` from `@deck.gl/layers` as underlay
- New signature: `createRouteLayers(visible, mapMode, currentTime, scenarioParams)`
- TripsLayer uses `getPath: d => swapCoords(d.coordinates)` (preserving existing swap pattern)
- TripsLayer uses `getTimestamps: d => d.timestamps`
- In SCENARIO mode, Hormuz route (`id === 'hormuz'`) gets reduced opacity based on `scenarioParams.hormuzWeeks`
- ArcLayer opacity reduced to 40 in all modes (subtle underlay)

```typescript
import { ArcLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { shippingRoutes } from '@/data/shipping-routes';
import type { ShippingRoute, MapMode, ScenarioParams } from '@/types';

function swapCoords(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat]);
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function getRouteOpacity(
  route: ShippingRoute,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
): number {
  if (mapMode === 'live') {
    return route.status === 'disrupted' ? 220 : 180;
  }
  // SCENARIO and TIMELINE modes
  if (route.id === 'hormuz') {
    const disruption = scenarioParams.hormuzWeeks / 16; // 0 to 1
    return Math.round(220 * (1 - disruption * 0.8)); // dims to 20% at max disruption
  }
  return 200;
}

export function createRouteLayers(
  visible: boolean,
  mapMode: MapMode,
  currentTime: number,
  scenarioParams: ScenarioParams,
) {
  const tripsLayer = new TripsLayer<ShippingRoute>({
    id: 'tanker-trips',
    data: shippingRoutes,
    visible,
    getPath: (d: ShippingRoute) => swapCoords(d.coordinates),
    getTimestamps: (d: ShippingRoute) => d.timestamps,
    getColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      const alpha = getRouteOpacity(d, mapMode, scenarioParams);
      return [...rgb, alpha] as [number, number, number, number];
    },
    opacity: 0.8,
    widthMinPixels: 4,
    trailLength: 150,
    currentTime,
    shadowEnabled: false,
  });

  const arcLayer = new ArcLayer<ShippingRoute>({
    id: 'route-arcs',
    data: shippingRoutes,
    visible,
    pickable: false,
    getSourcePosition: (d: ShippingRoute) => {
      const first = d.coordinates[0];
      return [first[1], first[0]];
    },
    getTargetPosition: (d: ShippingRoute) => {
      const last = d.coordinates[d.coordinates.length - 1];
      return [last[1], last[0]];
    },
    getSourceColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 40] as [number, number, number, number];
    },
    getTargetColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 40] as [number, number, number, number];
    },
    getWidth: 1,
    getHeight: 0.3,
    greatCircle: true,
  });

  return [tripsLayer, arcLayer];
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build 2>&1 | head -30
```

Expected: Build errors in `IntelMap.tsx` because `createRouteLayers` signature changed. This is expected — we'll fix IntelMap in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/ShippingLayer.tsx
git commit -m "feat: replace PathLayer with TripsLayer for animated tanker routes"
```

---

## Task 4: Replace FacilityLayer with ColumnLayer

**Files:**
- Modify: `src/components/map/FacilityLayer.tsx`

- [ ] **Step 1: Replace ScatterplotLayer with ColumnLayer, update factory signature**

Replace the full file content. Key changes:
- Import `ColumnLayer` from `@deck.gl/layers`
- New signature adds `mapMode`, `scenarioParams`, `timelinePosition`
- `getElevation`: `productionBpd` scaled by mode-specific multiplier (height multiplier = 50 for visual impact)
- Status coloring: `operational` = full, `upgraded` = bright highlight, `closed` = 30% opacity grey
- In SCENARIO mode: Petron Bataan shrinks if `refineryOffline`, terminals grow slightly
- Coordinate swap preserved: `[d.coordinates[1], d.coordinates[0]]`

```typescript
import { ColumnLayer } from '@deck.gl/layers';
import { facilities } from '@/data/facilities';
import type { Facility, FacilityType, MapMode, ScenarioParams } from '@/types';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const TYPE_RADIUS: Record<FacilityType, number> = {
  refinery: 50000,
  terminal: 30000,
  depot: 15000,
};

const ELEVATION_SCALE = 50; // multiplier for productionBpd → visual height

function getElevationMultiplier(
  facility: Facility,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  timelinePosition: number,
): number {
  if (mapMode === 'live') return 1;

  const hormuzFactor = scenarioParams.hormuzWeeks / 16;

  if (facility.id === 'petron-bataan') {
    if (scenarioParams.refineryOffline) return 0.1;
    return 1 - hormuzFactor * 0.3; // shrinks as supply disrupted
  }

  if (facility.type === 'terminal') {
    // Terminals grow slightly as import dependency increases
    return 1 + (scenarioParams.refineryOffline ? 0.2 : hormuzFactor * 0.1);
  }

  return 1;
}

export function createFacilityLayer(
  visible: boolean,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  timelinePosition: number,
  onSelect: (facility: Facility) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
) {
  return new ColumnLayer<Facility>({
    id: 'facilities',
    data: facilities,
    visible,
    pickable: true,
    extruded: true,
    diskResolution: 20,
    radius: 30000, // scalar — ColumnLayer doesn't support accessor. Visual differentiation via elevation.
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getElevation: (d: Facility) => {
      const multiplier = getElevationMultiplier(d, mapMode, scenarioParams, timelinePosition);
      return d.productionBpd * ELEVATION_SCALE * multiplier;
    },
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      let alpha = 200;
      if (d.status === 'closed') alpha = 80;
      else if (d.status === 'upgraded') alpha = 240;
      if (d.id === hoveredId) alpha = Math.min(alpha + 55, 255);

      // In SCENARIO mode, dim Petron if offline
      if (mapMode !== 'live' && d.id === 'petron-bataan' && scenarioParams.refineryOffline) {
        alpha = 50;
      }

      return [...rgb, alpha] as [number, number, number, number];
    },
    material: { ambient: 0.6, diffuse: 0.8, shininess: 32 },
    onClick: ({ object }: { object?: Facility }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: Facility }) => {
      setHoveredId(object ? object.id : null);
    },
    transitions: {
      getElevation: 300,
      getFillColor: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredId, mapMode, scenarioParams.refineryOffline],
      getElevation: [mapMode, scenarioParams.hormuzWeeks, scenarioParams.refineryOffline, timelinePosition],
    },
  });
}
```

- [ ] **Step 2: Verify build (expect failures)**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build 2>&1 | head -20
```

Expected: Build errors in `IntelMap.tsx` because `createFacilityLayer` signature changed (same as ShippingLayer). Both will be fixed in Task 5. **Note:** Tasks 3, 4, 5 form an atomic unit — the branch is not deployable until Task 5 completes.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/FacilityLayer.tsx
git commit -m "feat(wip): replace ScatterplotLayer with ColumnLayer for 3D facility visualization"
```

---

## Task 5: Update IntelMap with mode support and animation loop

**Files:**
- Modify: `src/components/map/IntelMap.tsx`

- [ ] **Step 1: Add props interface, rAF animation loop, and mode-aware layer creation**

Replace the full file content. Key changes:
- Accept `IntelMapProps` with `mapMode`, `scenarioParams`, `timelinePosition`, `onModeChange`
- Manage `currentTime` via `useState` + `useRef` for rAF loop
- Start/stop rAF based on `mapMode` (LIVE = animate, SCENARIO/TIMELINE = freeze)
- Pass mode/params/time to updated `createRouteLayers` and `createFacilityLayer`
- Clean up rAF on unmount or mode switch

```typescript
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { useControl, NavigationControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapViewState, Layer } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Facility, MapMode, ScenarioParams } from '@/types';
import { createFacilityLayer } from './FacilityLayer';
import { createRouteLayers } from './ShippingLayer';
import LayerControls from './LayerControls';
import FacilityDetail from './FacilityDetail';

function DeckGLOverlay(props: { layers: Layer[] }) {
  const overlay = useControl(() => new MapboxOverlay({ layers: [] }));
  overlay.setProps({ layers: props.layers });
  return null;
}

interface LayerVisibility {
  facilities: boolean;
  routes: boolean;
  labels: boolean;
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 122,
  latitude: 12,
  zoom: 5.5,
  pitch: 30,
  bearing: 0,
};

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export interface IntelMapProps {
  mapMode: MapMode;
  scenarioParams: ScenarioParams;
  timelinePosition: number;
  onModeChange: (mode: MapMode) => void;
}

export default function IntelMap({
  mapMode,
  scenarioParams,
  timelinePosition,
  onModeChange,
}: IntelMapProps) {
  const [layers, setLayers] = useState<LayerVisibility>({
    facilities: true,
    routes: true,
    labels: true,
  });
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef<number>(0);

  // Animation loop for LIVE mode
  useEffect(() => {
    if (mapMode !== 'live') {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = () => {
      setCurrentTime((t) => (t + 1) % 1000);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [mapMode]);

  // In TIMELINE mode, currentTime is driven by timelinePosition
  const effectiveTime = mapMode === 'timeline' ? timelinePosition : currentTime;

  const handleToggle = useCallback((layer: string) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer as keyof LayerVisibility],
    }));
  }, []);

  const handleSelect = useCallback((facility: Facility) => {
    setSelectedFacility(facility);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFacility(null);
  }, []);

  const deckLayers = useMemo(
    () => [
      createFacilityLayer(
        layers.facilities,
        mapMode,
        scenarioParams,
        timelinePosition,
        handleSelect,
        hoveredFacility,
        setHoveredFacility,
      ),
      ...createRouteLayers(layers.routes, mapMode, effectiveTime, scenarioParams),
    ],
    [
      layers.facilities,
      layers.routes,
      mapMode,
      scenarioParams,
      timelinePosition,
      effectiveTime,
      handleSelect,
      hoveredFacility,
    ],
  );

  return (
    <div
      className="relative h-[600px] lg:h-[700px] w-full rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]"
      style={{ cursor: hoveredFacility ? 'pointer' : 'grab' }}
    >
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{}}
      >
        <DeckGLOverlay layers={deckLayers} />
        <NavigationControl position="top-left" showCompass={false} />
      </Map>
      <LayerControls
        layers={layers}
        onToggle={handleToggle}
        mapMode={mapMode}
        onModeChange={onModeChange}
      />
      <FacilityDetail facility={selectedFacility} onClose={handleClose} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build (expect errors from LayerControls props)**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build 2>&1 | head -20
```

Expected: Type error in `LayerControls` (doesn't accept `mapMode`/`onModeChange` yet). Fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/IntelMap.tsx
git commit -m "feat: add mode support and rAF animation loop to IntelMap"
```

---

## Task 6: Add mode selector to LayerControls

**Files:**
- Modify: `src/components/map/LayerControls.tsx`

- [ ] **Step 1: Add mode selector above existing layer toggles**

Replace the full file content:

```typescript
'use client';

import type { MapMode } from '@/types';

interface LayerControlsProps {
  layers: {
    facilities: boolean;
    routes: boolean;
    labels: boolean;
  };
  onToggle: (layer: string) => void;
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

const layerConfig: { key: string; label: string }[] = [
  { key: 'facilities', label: 'Infrastructure' },
  { key: 'routes', label: 'Routes' },
  { key: 'labels', label: 'Labels' },
];

const modeConfig: { key: MapMode; label: string }[] = [
  { key: 'live', label: 'LIVE' },
  { key: 'scenario', label: 'SCENARIO' },
  { key: 'timeline', label: 'TIMELINE' },
];

export default function LayerControls({
  layers,
  onToggle,
  mapMode,
  onModeChange,
}: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-50 rounded-xl p-3 flex flex-col gap-3 bg-[rgba(10,15,26,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] shadow-lg">
      {/* Mode selector */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-[rgba(255,255,255,0.04)]">
        {modeConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`flex-1 px-2 py-1.5 rounded-md transition-all duration-200 font-mono text-[9px] uppercase tracking-widest ${
              mapMode === key
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
                : 'text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.45)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(255,255,255,0.06)]" />

      {/* Layer toggles */}
      {layerConfig.map(({ key, label }) => {
        const isActive = layers[key as keyof typeof layers];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
              isActive
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
                : 'text-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/LayerControls.tsx
git commit -m "feat: add LIVE/SCENARIO/TIMELINE mode selector to LayerControls"
```

---

## Task 7: Create TimelineSlider component

**Files:**
- Create: `src/components/map/TimelineSlider.tsx`

- [ ] **Step 1: Create the TimelineSlider component**

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface TimelineSliderProps {
  position: number;
  onPositionChange: (position: number) => void;
  visible: boolean;
}

export default function TimelineSlider({
  position,
  onPositionChange,
  visible,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number>(0);
  const positionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);

  // Keep refs in sync to avoid stale closures in rAF
  positionRef.current = position;
  onPositionChangeRef.current = onPositionChange;

  const week = Math.round((position / 1000) * 16);

  // Play/pause animation — reads from refs to avoid stale closures
  useEffect(() => {
    if (!isPlaying || !visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // ~2 units per frame at 60fps → full timeline in ~8 seconds
      const increment = delta * 0.12;
      const next = Math.min(positionRef.current + increment, 1000);

      onPositionChangeRef.current(next);

      if (next >= 1000) {
        setIsPlaying(false);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, visible]);

  const handlePlayPause = useCallback(() => {
    if (positionRef.current >= 1000) {
      // Reset to start if at end
      onPositionChangeRef.current(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, []);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPlaying(false);
      onPositionChangeRef.current(Number(e.target.value));
    },
    [],
  );

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(10,15,26,0.75)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
      <button
        onClick={handlePlayPause}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] transition-all text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)]"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        value={position}
        onChange={handleSliderChange}
        className="flex-1 h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-cyan-500 cursor-pointer"
      />

      <span className="shrink-0 text-[10px] font-mono tracking-widest text-[rgba(255,255,255,0.5)] min-w-[60px] text-right">
        WEEK {week}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/TimelineSlider.tsx
git commit -m "feat: create TimelineSlider component for temporal scrubbing"
```

---

## Task 8: Update MapWrapper to forward props

**Files:**
- Modify: `src/components/map/MapWrapper.tsx`

- [ ] **Step 1: Update MapWrapper to accept and forward all props**

```typescript
'use client';

import dynamic from 'next/dynamic';
import type { MapMode, ScenarioParams } from '@/types';

const IntelMap = dynamic(() => import('./IntelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] lg:h-[700px] w-full rounded-xl bg-[#0a0f1a] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
      <div className="text-[rgba(255,255,255,0.25)] font-mono text-xs uppercase tracking-widest">
        Initializing MapLibre GL...
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  mapMode: MapMode;
  scenarioParams: ScenarioParams;
  timelinePosition: number;
  onModeChange: (mode: MapMode) => void;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <IntelMap {...props} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/MapWrapper.tsx
git commit -m "feat: forward map mode props through MapWrapper"
```

---

## Task 9: Convert ScenarioPlanner to controlled component

**Files:**
- Modify: `src/components/scenarios/ScenarioPlanner.tsx`

- [ ] **Step 1: Rewrite as controlled component with mode support**

Replace the full file content. Key changes from current implementation:
- Remove internal `useState` for brentPrice/hormuzWeeks/forexRate/refineryOffline
- Accept `params` + `onParamsChange` props instead
- In TIMELINE mode, sliders get `disabled` and show timeline-derived values
- `usePrices()` remains for initial sync — calls `onParamsChange` on mount
- Named export `ScenarioPlanner` preserved (required by dynamic import in page.tsx)

```typescript
'use client';

import { useMemo, useEffect } from 'react';
import { ScenarioParams, MapMode } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { usePrices } from '@/hooks/usePrices';
import { ResultPanel } from './ResultPanel';
import { RiskMatrix } from './RiskMatrix';
import { Tooltip } from '@/components/ui/Tooltip';

interface ScenarioPlannerProps {
  params: ScenarioParams;
  onParamsChange: (params: ScenarioParams) => void;
  mapMode: MapMode;
  timelinePosition: number;
}

export function ScenarioPlanner({
  params,
  onParamsChange,
  mapMode,
  timelinePosition,
}: ScenarioPlannerProps) {
  const { prices } = usePrices();
  const liveBrent = prices.find((b) => b.id === 'brent-crude')?.value ?? 106;
  const liveForex = prices.find((b) => b.id === 'php-usd')?.value ?? 58.42;

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

  // In TIMELINE mode, derive params from timeline position
  useEffect(() => {
    if (mapMode === 'timeline') {
      const week = (timelinePosition / 1000) * 16;
      onParamsChange({
        brentPrice: Math.round(106 + week * 4.6), // price rises with disruption
        hormuzWeeks: Math.round(week),
        forexRate: 58.42 + week * 0.4, // peso weakens
        refineryOffline: week >= 12,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, timelinePosition]);

  const isTimelineDriven = mapMode === 'timeline';

  const updateParam = <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const result = useMemo(() => calculatePumpPrice(params), [params]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-mono tracking-widest text-[rgba(255,255,255,0.9)] uppercase">
          Scenario Planner
        </h2>
        <p className="text-xs font-sans text-[rgba(255,255,255,0.4)] mt-1">
          {isTimelineDriven ? 'Driven by timeline — scrub to explore' : 'What happens if...'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className={`space-y-6 glass-card p-5 ${isTimelineDriven ? 'opacity-60' : ''}`}>
          {/* Brent Crude */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="The global benchmark crude oil price. PH imports are priced against this.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  Brent Crude
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                ${params.brentPrice}/bbl
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={params.brentPrice}
              onChange={(e) => updateParam('brentPrice', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>$60</span>
              <span>$180</span>
            </div>
          </div>

          {/* Hormuz Disruption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="Weeks the Strait of Hormuz is partially or fully blocked. 70% of PH crude transits here.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  Hormuz Disruption
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                {params.hormuzWeeks} {params.hormuzWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={params.hormuzWeeks}
              onChange={(e) => updateParam('hormuzWeeks', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>0 wk</span>
              <span>16 wk</span>
            </div>
          </div>

          {/* PHP/USD Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="The Philippine Peso to US Dollar exchange rate. Weaker peso = more expensive imports.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  PHP/USD Rate
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                ₱{params.forexRate.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={54}
              max={65}
              step={0.5}
              value={params.forexRate}
              onChange={(e) => updateParam('forexRate', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-yellow-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>₱54</span>
              <span>₱65</span>
            </div>
          </div>

          {/* Refinery Toggle */}
          <div className="flex items-center justify-between">
            <Tooltip text="Petron Bataan is the only refinery in the Philippines. If offline, the country goes to 100% import dependency.">
              <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                Bataan Refinery Offline
              </label>
            </Tooltip>
            <button
              type="button"
              role="switch"
              aria-checked={params.refineryOffline}
              onClick={() => !isTimelineDriven && updateParam('refineryOffline', !params.refineryOffline)}
              disabled={isTimelineDriven}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:cursor-not-allowed ${
                params.refineryOffline ? 'bg-red-500' : 'bg-[rgba(255,255,255,0.12)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                  params.refineryOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultPanel
            gasoline={result.gasoline}
            diesel={result.diesel}
            riskLevel={result.riskLevel}
          />
          <RiskMatrix params={params} riskLevel={result.riskLevel} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build 2>&1 | head -20
```

Expected: Build errors in `page.tsx` because `ScenarioPlanner` now requires new props. Fixed in Task 10.

- [ ] **Step 3: Commit**

```bash
git add src/components/scenarios/ScenarioPlanner.tsx
git commit -m "feat: convert ScenarioPlanner to controlled component with mode support"
```

---

## Task 10: Wire everything in page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx as client component with lifted state**

Replace the full file content. Key changes:
- Add `'use client'` directive
- Lift `mapMode`, `scenarioParams`, `timelinePosition` state
- Pass mode/params/callbacks to `MapWrapper` and `ScenarioPlanner`
- Import and render `TimelineSlider` inside map section
- All existing layout sections preserved exactly

```typescript
'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import MapWrapper from '@/components/map/MapWrapper';
import TimelineSlider from '@/components/map/TimelineSlider';
import { PumpPrices } from '@/components/prices/PumpPrices';
import { ImpactCards } from '@/components/prices/ImpactCards';
import { VitalSigns } from '@/components/health/VitalSigns';
import { EventTimeline } from '@/components/health/EventTimeline';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import type { MapMode, ScenarioParams } from '@/types';

const PricePanel = dynamic(
  () => import('@/components/prices/PricePanel').then((m) => m.PricePanel),
  { ssr: false },
);
const ScenarioPlanner = dynamic(
  () => import('@/components/scenarios/ScenarioPlanner').then((m) => m.ScenarioPlanner),
  { ssr: false },
);
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false },
);
const PlayerCards = dynamic(
  () => import('@/components/players/PlayerCards').then((m) => m.PlayerCards),
  { ssr: false },
);

export default function Home() {
  const [mapMode, setMapMode] = useState<MapMode>('live');
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    brentPrice: 106,
    hormuzWeeks: 2,
    forexRate: 58.42,
    refineryOffline: false,
  });
  const [timelinePosition, setTimelinePosition] = useState(0);

  const handleParamsChange = useCallback((params: ScenarioParams) => {
    setScenarioParams(params);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ScrollProgress />
      <AlertBanner />
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Hero: Map + Price Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Supply Chain Map
              </h2>
            </div>
            <div className="relative">
              <MapWrapper
                mapMode={mapMode}
                scenarioParams={scenarioParams}
                timelinePosition={timelinePosition}
                onModeChange={setMapMode}
              />
              <TimelineSlider
                position={timelinePosition}
                onPositionChange={setTimelinePosition}
                visible={mapMode === 'timeline'}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[var(--status-red)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Pump Prices
              </h2>
            </div>
            <PumpPrices />

            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-phoenix)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                What This Means For You
              </h2>
            </div>
            <ImpactCards />
          </div>
        </section>

        {/* Price Intelligence */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-shell)]" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Price Intelligence
            </h2>
          </div>
          <PricePanel />
        </section>

        {/* Scenario Planner */}
        <section>
          <ScenarioPlanner
            params={scenarioParams}
            onParamsChange={handleParamsChange}
            mapMode={mapMode}
            timelinePosition={timelinePosition}
          />
        </section>

        {/* Market Players + System Health */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-seaoil)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Market Players
              </h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
              <MarketShare />
              <PlayerCards />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--status-green)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                System Health
              </h2>
            </div>
            <VitalSigns />
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--status-yellow)]" />
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Event Timeline
                </h2>
              </div>
              <EventTimeline />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify full build passes**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
```

Expected: Clean build. All components compile. Bundle size should be ~200-210kB (slightly larger from geo-layers).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire map modes, scenario state, and timeline to page layout"
```

---

## Task 11: Integration smoke test and final build

**Files:**
- None new — verification only

- [ ] **Step 1: Run full build**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
```

Expected: Clean build, no type errors, no warnings.

- [ ] **Step 2: Start dev server and verify**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm dev
```

Manual verification checklist:
- [ ] Map renders with 3D columns (Petron Bataan tallest)
- [ ] Tanker trails animate in LIVE mode
- [ ] Mode selector shows LIVE / SCENARIO / TIMELINE
- [ ] Switching to SCENARIO mode — Hormuz slider dims Hormuz route
- [ ] Switching to TIMELINE mode — slider appears, scrubbing updates map
- [ ] Play/pause button works in TIMELINE mode
- [ ] Existing features unbroken (layer toggles, facility click, etc.)

- [ ] **Step 3: Final commit if any adjustments needed**

Stage any adjusted files by name, then commit:

```bash
git add src/components/map/IntelMap.tsx src/components/map/FacilityLayer.tsx src/components/map/ShippingLayer.tsx
git commit -m "fix: integration adjustments for animated map modes"
```
