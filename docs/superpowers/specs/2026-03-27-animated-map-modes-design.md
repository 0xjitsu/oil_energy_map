# Animated Map Visualization Modes — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Branch:** `feat/animated-map-modes`

---

## Problem Statement

The IntelMap currently renders shipping routes as static lines (`PathLayer` + `ArcLayer`) and facilities as 2D dots (`ScatterplotLayer`). There is no visual connection between the map and the ScenarioPlanner — users adjust sliders but the map doesn't react. The "pandemic for energy" story is told through numbers, not through the visceral experience of watching supply chains move, slow down, and collapse.

The Energy Nexus demo (deck.gl TripsLayer + ColumnLayer) proves that animated supply chain maps are dramatically more compelling and informative than static ones.

## Goal

Add three togglable visualization modes to IntelMap that progressively connect the map to live data and scenario modeling. Uses `ColumnLayer` from the installed `@deck.gl/layers` and adds `@deck.gl/geo-layers` for `TripsLayer` (the only new dependency).

---

## Design

### Mode System

Three modes, selectable via segmented control in the existing `LayerControls` panel:

| Mode | Label | Description |
|------|-------|-------------|
| **LIVE** | `LIVE` | Tankers animate continuously along routes. Facility columns show current capacity. Default mode. |
| **SCENARIO** | `SCENARIO` | Map reacts to ScenarioPlanner parameters. Routes dim/pulse based on Hormuz disruption. Facility columns shrink as supply drops. |
| **TIMELINE** | `TIMELINE` | Shared time slider scrubs the map + scenario calculations simultaneously. Full temporal control. |

### Mode Behavior Matrix

| Behavior | LIVE | SCENARIO | TIMELINE |
|----------|------|----------|----------|
| Tanker animation | Continuous loop | Speed varies by disruption | Scrubbed by slider |
| Route opacity | Status-based (active/disrupted) | Dims with Hormuz weeks | Interpolated over time |
| Facility column height | Static capacity | Adjusted by scenario params | Animated over timeline |
| Facility column color | Status-based | Risk-level coloring (green/yellow/red) | Interpolated |
| Time slider visible | No | No | Yes |
| ScenarioPlanner linked | No | Yes (reads params) | Yes (bidirectional) |

### Architecture

#### State Management

```
page.tsx (lifted state)
├── mapMode: 'live' | 'scenario' | 'timeline'
├── scenarioParams: ScenarioParams (from ScenarioPlanner)
├── timelinePosition: number (0-1000, TIMELINE mode only)
│
├── IntelMap
│   ├── receives: mapMode, scenarioParams, timelinePosition
│   ├── renders: TripsLayer, ColumnLayer, ArcLayer
│   └── LayerControls (mode selector + layer toggles)
│
├── ScenarioPlanner
│   ├── emits: scenarioParams via callback
│   └── in TIMELINE mode: params driven by timelinePosition
│
└── TimelineSlider (new, TIMELINE mode only)
    ├── visible only when mapMode === 'timeline'
    └── controls timelinePosition state
```

#### Component Changes

**`page.tsx`** — Becomes `'use client'`. Lifts `mapMode`, `scenarioParams`, and `timelinePosition` state. Wraps `ScenarioPlanner` with controlled props pattern. Passes mode/params/timeline through `MapWrapper` to `IntelMap`.

```tsx
// New state in page.tsx
const [mapMode, setMapMode] = useState<MapMode>('live');
const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
  brentPrice: 106, hormuzWeeks: 2, forexRate: 58.42, refineryOffline: false,
});
const [timelinePosition, setTimelinePosition] = useState(0);
```

**`IntelMap.tsx`** — Accept new props via `IntelMapProps` interface:

```tsx
interface IntelMapProps {
  mapMode: MapMode;
  scenarioParams: ScenarioParams;
  timelinePosition: number;
  onModeChange: (mode: MapMode) => void;
}
```

Manages the `requestAnimationFrame` loop internally for LIVE mode. Cancels rAF on mode switch or unmount to prevent memory leaks. Passes mode-specific config to layer factories.

**`MapWrapper.tsx`** — Accepts and forwards all `IntelMapProps` through the `dynamic()` import:

```tsx
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

**`ShippingLayer.tsx`** — Replace `PathLayer` with `TripsLayer` (from `@deck.gl/geo-layers`). New factory signature:

```tsx
export function createRouteLayers(
  visible: boolean,
  mapMode: MapMode,
  currentTime: number,
  scenarioParams: ScenarioParams,
): Layer[]
```

- LIVE: continuous animation via `requestAnimationFrame` (currentTime increments in IntelMap)
- SCENARIO: animation speed modulated by `hormuzWeeks` (0 = full speed, 16 = near-stopped for Hormuz route). Non-Hormuz routes unaffected.
- TIMELINE: `currentTime` driven by `timelinePosition`
- Coordinate handling: existing `swapCoords()` pattern preserved — `getPath` calls `swapCoords(d.coordinates)` to convert `[lat, lng]` → `[lng, lat]` for deck.gl
- `ArcLayer` retained as subtle underlay in all modes (shows full route arc at low opacity)

**`FacilityLayer.tsx`** — Replace `ScatterplotLayer` with `ColumnLayer`. New factory signature:

```tsx
export function createFacilityLayer(
  visible: boolean,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  timelinePosition: number,
  onSelect: (facility: Facility) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
): Layer
```

- `getElevation`: uses `productionBpd` scaled by mode-specific multiplier
- `getFillColor`: status-based in LIVE, risk-colored in SCENARIO/TIMELINE
- Status mapping: `operational` = full opacity, `upgraded` = slightly brighter (highlight), `closed` = 30% opacity + grey tint
- Coordinate handling: existing swap `[d.coordinates[1], d.coordinates[0]]` preserved

**`ScenarioPlanner.tsx`** — Becomes a controlled component in SCENARIO and TIMELINE modes:

```tsx
interface ScenarioPlannerProps {
  params: ScenarioParams;
  onParamsChange: (params: ScenarioParams) => void;
  mapMode: MapMode;
  timelinePosition: number;
}
```

- In LIVE mode: behaves as before (user controls sliders freely), syncs initial values from `usePrices()` on mount
- In SCENARIO mode: same as LIVE but emits `onParamsChange` on every slider change so map reacts
- In TIMELINE mode: sliders are driven by `timelinePosition` — `hormuzWeeks` = `Math.round(timelinePosition / 1000 * 16)`, other params derived similarly. Sliders become read-only (visual feedback of timeline state). `usePrices()` still provides initial values for non-timeline params.
- `ResultPanel` and `RiskMatrix` render inside ScenarioPlanner and automatically react because they consume `params` — no additional wiring needed.

**`LayerControls.tsx`** — Add mode selector (segmented 3-button toggle) above existing layer toggles. Receives `mapMode` and `onModeChange` callback.

**`TimelineSlider.tsx`** (new) — Horizontal slider overlay at bottom of map container. Only visible in TIMELINE mode. Includes play/pause button and time labels (Week 0 → Week 16). Auto-pauses when position reaches 1000. Play restarts from 0 if at end.

**`shipping-routes.ts`** — Add `timestamps` array to each route for TripsLayer compatibility. Each route's `timestamps` array length matches its `coordinates` array length (varies per route: 6 for Hormuz, 5 for others).

#### Data Changes

Each `ShippingRoute` gets a `timestamps` field (array of numbers matching `coordinates` length):

```typescript
// Before
coordinates: [[26.5, 56.5], [20.0, 65.0], ...]

// After — timestamps added for TripsLayer
coordinates: [[26.5, 56.5], [20.0, 65.0], ...]
timestamps: [0, 200, 400, 600, 800, 1000]
```

The `Facility` type gets `productionBpd` (numeric capacity for column height):

```typescript
// Added to Facility interface
productionBpd: number; // numeric capacity for ColumnLayer height (required, not optional)
```

**productionBpd values** (normalized to barrels-per-day equivalent for consistent column heights):

| Facility | Type | productionBpd | Rationale |
|----------|------|---------------|-----------|
| Petron Bataan | refinery | 180000 | Actual refinery capacity |
| Shell Tabangao (CLOSED) | refinery | 110000 | Former capacity (column renders at low opacity) |
| Shell SHIFT Tabangao | terminal | 45000 | ~263M liters/year ÷ 365 ÷ 159L/bbl |
| Chevron Batangas | terminal | 40000 | 2.5M barrel storage, estimated throughput |
| Phoenix Calaca | terminal | 8000 | ~50M liters/year ÷ 365 ÷ 159L/bbl |
| Chevron Lapu-Lapu | terminal | 15000 | Upgraded, mid-range Visayas terminal |
| Shell Darong | terminal | 12000 | ~67M liters/year equivalent |
| Shell North Luzon | depot | 3000 | Regional depot, small throughput |
| Phoenix Davao | depot | 4000 | Flagship Mindanao depot |
| Phoenix CDO | depot | 2500 | Northern Mindanao regional |
| Metro Manila | depot | 50000 | Demand center aggregate (not a single facility) |

### Visual Design

#### TripsLayer Tanker Trails

- Trail color: matches route color (red for disrupted Hormuz, green for active Singapore)
- Trail length: 150 units (configurable)
- Width: 4px minimum
- Glow effect: achieved via `widthMinPixels` and semi-transparent trail

#### ColumnLayer Facility Bars

- Height: proportional to `productionBpd` (Petron Bataan = tallest at 180k bpd)
- Radius: 50,000m for refineries, 30,000m for terminals, 15,000m for depots
- Color: facility's existing `color` field with alpha based on status
- Material: `{ ambient: 0.6, diffuse: 0.8, shininess: 32 }` (subtle 3D lighting)
- Extruded: true (3D columns rising from the map surface)

#### Mode Selector UI

Three-button segmented control in `LayerControls`:
```
┌──────┬──────────┬──────────┐
│ LIVE │ SCENARIO │ TIMELINE │
└──────┴──────────┴──────────┘
```
- Active mode: `bg-[rgba(255,255,255,0.08)]` + `text-[rgba(255,255,255,0.9)]`
- Inactive: `text-[rgba(255,255,255,0.25)]`
- Consistent with existing layer toggle styling

#### Timeline Slider (TIMELINE mode only)

- Position: absolute bottom of map container, full width with padding
- Glass morphism background matching existing panels
- Play/pause button (left) + slider (center) + week label (right)
- Labels: `WEEK 0` to `WEEK 16`

### Scenario Integration Details

#### SCENARIO Mode — How ScenarioParams Affect the Map

| Param | Map Effect |
|-------|------------|
| `hormuzWeeks` (0-16) | Hormuz route: opacity decreases, animation slows, trail turns red. Other routes: unaffected. |
| `brentPrice` (60-180) | No direct map effect (prices shown in sidebar) |
| `forexRate` (54-65) | No direct map effect |
| `refineryOffline` (bool) | Petron Bataan column: dims to 20% opacity, height collapses to 10%. Terminal columns: grow slightly (increased import dependency). |

#### TIMELINE Mode — Temporal Interpolation

Timeline position 0-1000 maps to a simulated 16-week disruption scenario:

| Position | Week | Hormuz Route | Petron Bataan | Other Routes |
|----------|------|-------------|---------------|-------------|
| 0 | 0 | Full capacity | Full height | Normal |
| 250 | 4 | 75% capacity | 90% height | Normal |
| 500 | 8 | 50% capacity | 70% height | Increased brightness |
| 750 | 12 | 25% capacity | 40% height | Max brightness |
| 1000 | 16 | Near-zero | 10% height (offline) | Max brightness |

---

## Type Changes

```typescript
// types/index.ts additions

export type MapMode = 'live' | 'scenario' | 'timeline';

// ShippingRoute — add timestamps
export interface ShippingRoute {
  // ... existing fields
  timestamps: number[]; // NEW — matches coordinates array length
}

// Facility — add numeric capacity
export interface Facility {
  // ... existing fields
  productionBpd: number; // NEW — numeric capacity for ColumnLayer height (required)
}
```

---

## Dependency Analysis

### Build vs. Buy Decision

| Need | Decision | Rationale |
|------|----------|-----------|
| TripsLayer | **Add `@deck.gl/geo-layers`** | Lives in `@deck.gl/geo-layers`, NOT `@deck.gl/layers`. Must be added. The alternative (custom animation on PathLayer via dashArray/offset) is fragile and doesn't produce the trailing-glow effect. TripsLayer is purpose-built for this. |
| ColumnLayer | **Use existing** | Already in `@deck.gl/layers@9.2.11` — installed, just not imported |
| Animation loop | **Build in-house** | Simple `requestAnimationFrame` + `useRef` — no library needed |
| Time slider | **Build in-house** | HTML `<input type="range">` styled to match existing Ticker/ScenarioPlanner sliders |
| State lifting | **Build in-house** | React `useState` + prop drilling — app is small enough, no state library needed |

**One new dependency:** `@deck.gl/geo-layers@^9.2.11` (pinned to match existing deck.gl version). All other needs are satisfied by existing packages or vanilla React + browser APIs.

---

## Test Scenarios

### Unit Tests

#### T1: Mode Switching

```
GIVEN the map is in LIVE mode
WHEN the user clicks SCENARIO
THEN mapMode changes to 'scenario'
AND TripsLayer receives scenario-adjusted currentTime
AND ColumnLayer receives scenario-adjusted elevations
```

#### T2: TripsLayer Animation (LIVE)

```
GIVEN mapMode is 'live'
THEN tanker trails animate continuously (currentTime increments via rAF)
AND all routes animate at full speed regardless of disruption status
```

#### T3: Scenario-Linked Route Dimming

```
GIVEN mapMode is 'scenario'
AND hormuzWeeks is 8
THEN Hormuz route opacity is ~50% (scaled from hormuzWeeks/16)
AND Hormuz route animation speed is ~50%
AND non-Hormuz routes remain at full opacity and speed
```

#### T4: Scenario-Linked Facility Columns

```
GIVEN mapMode is 'scenario'
AND refineryOffline is true
THEN Petron Bataan column height drops to 10% of max
AND Petron Bataan column opacity drops to 20%
AND terminal columns grow by ~20% (import dependency increase)
```

#### T5: Timeline Scrubbing

```
GIVEN mapMode is 'timeline'
AND user drags slider to position 500 (Week 8)
THEN TripsLayer currentTime is 500
AND Hormuz route shows 50% capacity visual
AND Petron Bataan column is at 70% height
```

#### T6: Timeline Play/Pause

```
GIVEN mapMode is 'timeline'
AND user clicks play
THEN timelinePosition auto-increments from current value to 1000
AND map layers update in real-time
WHEN user clicks pause
THEN timelinePosition freezes at current value
```

#### T7: Timestamps Data Integrity

```
GIVEN shipping-routes.ts data
THEN every route has timestamps array
AND timestamps.length === coordinates.length
AND timestamps are monotonically increasing
```

#### T8: ColumnLayer 3D Rendering

```
GIVEN facilities data with productionBpd values
THEN ColumnLayer renders extruded columns
AND Petron Bataan (180000 bpd) is tallest
AND depot columns are shortest
AND closed facilities have reduced opacity
```

### Integration Tests

#### T9: ScenarioPlanner → Map Sync

```
GIVEN mapMode is 'scenario'
WHEN user adjusts Hormuz slider from 0 to 16
THEN Hormuz route progressively dims on map
AND Petron Bataan column progressively shrinks
AND other route columns remain stable
```

#### T10: Timeline → ScenarioPlanner Sync

```
GIVEN mapMode is 'timeline'
WHEN user scrubs timeline to Week 12
THEN ScenarioPlanner sliders update to match (hormuzWeeks=12)
AND ResultPanel shows corresponding pump price prediction
AND RiskMatrix shows corresponding risk level
```

### Visual Regression Tests

#### T11: Mode Transition Smoothness

```
GIVEN any mode transition (LIVE → SCENARIO → TIMELINE)
THEN deck.gl layers transition smoothly (no flash/flicker)
AND column heights animate via deck.gl transitions (300ms)
AND route opacities fade via deck.gl transitions
```

#### T12: Mobile Responsiveness

```
GIVEN viewport width < 768px
THEN mode selector stacks or uses icons instead of labels
AND timeline slider remains usable (44px touch targets)
AND map pitch reduces for mobile viewing
```

---

## Edge Cases & Error Handling

### Mode Transitions

- **rAF cleanup**: IntelMap stores the rAF ID in a `useRef`. On mode switch or unmount, `cancelAnimationFrame(rafRef.current)` is called. This prevents memory leaks and ghost animations.
- **LIVE → SCENARIO**: currentTime freezes at last rAF value. Scenario params take over layer configuration.
- **LIVE → TIMELINE**: currentTime resets to `timelinePosition`. rAF loop stops.
- **SCENARIO → TIMELINE**: Slider values animate to match timeline-derived values (smooth transition via deck.gl `transitions`).
- **Any → LIVE**: rAF loop restarts from 0.

### Timeline Bounds

- `currentTime` loops in LIVE mode: `(currentTime + 1) % 1000`
- `timelinePosition` clamps in TIMELINE mode: `0 ≤ position ≤ 1000`
- Play auto-pauses at 1000. Pressing play again restarts from 0.

### TripsLayer currentTime Overflow

- TripsLayer handles `currentTime > max(timestamps)` gracefully — trail disappears. No crash or error.
- TripsLayer handles `currentTime < min(timestamps)` — trail hasn't appeared yet.

---

## Performance Considerations

- **rAF budget**: Target 60fps. TripsLayer + ColumnLayer are GPU-accelerated — CPU overhead is minimal for 4 routes + 11 facilities.
- **Mobile**: Reduce `diskResolution` on ColumnLayer from default 20 to 12 for devices with `devicePixelRatio > 2` (retina mobile). Use `navigator.hardwareConcurrency < 4` as heuristic.
- **Layer transitions**: deck.gl's built-in `transitions` property (300ms) handles smooth height/color changes. No manual `requestAnimationFrame` needed for column animations.
- **WebGL fallback**: MapLibre GL requires WebGL. If unavailable, the existing `MapWrapper` loading state shows "Initializing MapLibre GL..." — this is acceptable as the dashboard's other panels still render.

---

## File Manifest

| # | Action | File | Changes |
|---|--------|------|---------|
| 1 | Modify | `src/types/index.ts` | Add `MapMode`, `timestamps` to ShippingRoute, `productionBpd` to Facility |
| 2 | Modify | `src/data/shipping-routes.ts` | Add `timestamps` arrays to all 4 routes |
| 3 | Modify | `src/data/facilities.ts` | Add `productionBpd` values to all 11 facilities |
| 4 | Modify | `src/components/map/ShippingLayer.tsx` | Replace PathLayer with TripsLayer (from `@deck.gl/geo-layers`), keep ArcLayer as underlay, add mode-aware config |
| 5 | Modify | `src/components/map/FacilityLayer.tsx` | Replace ScatterplotLayer with ColumnLayer, add mode-aware config with `upgraded` status handling |
| 6 | Modify | `src/components/map/IntelMap.tsx` | Accept `IntelMapProps`, manage rAF loop with cleanup, pass mode config to layer factories |
| 7 | Modify | `src/components/map/LayerControls.tsx` | Add mode selector segmented control, receive `mapMode` + `onModeChange` |
| 8 | Modify | `src/components/map/MapWrapper.tsx` | Accept and forward `MapWrapperProps` through dynamic import |
| 9 | Create | `src/components/map/TimelineSlider.tsx` | Timeline control (play/pause + range slider + week label) |
| 10 | Modify | `src/app/page.tsx` | `'use client'`, lift mapMode/scenarioParams/timelinePosition state, wire all components |
| 11 | Modify | `src/components/scenarios/ScenarioPlanner.tsx` | Controlled component pattern, accept props, emit onChange, read-only in TIMELINE mode |

**One new dependency:** `@deck.gl/geo-layers@^9.2.11`

---

## Out of Scope

- Web3/wallet integration (irrelevant gamification)
- Global refinery data beyond PH focus
- Real-time tanker AIS tracking (future: AIS API integration)
- Price history playback (future: requires historical price API)
- Sound effects or haptic feedback
