# PH Oil Intelligence v2 — Feature Expansion Design Spec

> **Date:** 2026-03-31
> **Author:** Berna (0xJitsu) + Claude
> **Status:** Approved (brainstorming complete)
> **Repo:** `0xjitsu/oil_energy_map`

---

## Overview

Transform the PH Oil Intelligence dashboard from a visualization tool into a **policy-grade intelligence platform** serving both policymakers (DOE, NEDA, LGU officials) and everyday Filipinos (jeepney drivers, households, SMEs).

**Design philosophy:** Progressive disclosure — single interface where complexity reveals itself as users go deeper. Bloomberg Terminal density for power users, clean headline numbers for casual visitors.

**Modeling approach:** Client-side Monte Carlo simulation (Option B) with simplified probability distributions. A disclaimer badge is mandatory on all simulation outputs. A roadmap to server-side simulation (Phase C) is documented but not built.

---

## Phasing

| Phase | Features | Why This Order |
|-------|----------|----------------|
| **Phase 1** | Map Controls Overhaul, ⌘K Command Palette, Keyboard Shortcuts | Foundation — changes how users interact with everything else |
| **Phase 2** | Price Alerts, Scenario Comparison, Regional Drill-Down, Consumer Impact Calculator | Intelligence layer — the features that make this a platform, not a dashboard |
| **Phase 3** | Monte Carlo Stress Test, Historical Playback | Advanced analysis — depends on Phase 1/2 UI patterns being stable |
| **Future** | Backend Simulation Engine (Phase C roadmap) | Requires Supabase, historical data pipeline, API design |

---

## Feature 1: Map Controls Overhaul

### Problem
Current `LayerControls` is a fixed top-right panel that obscures map real estate and doesn't scale for additional layers/features. No keyboard navigation. Not mobile-optimized.

### Solution
Hybrid icon strip + expandable panel (Option C from brainstorming).

### Architecture

**New files:**
- `src/components/map/MapToolbar.tsx` — vertical icon strip (replaces LayerControls positioning)
- `src/components/map/MapToolbarPanel.tsx` — expandable detail panel per layer
- `src/components/map/CommandPalette.tsx` — ⌘K search overlay
- `src/hooks/useKeyboardShortcuts.ts` — global keyboard handler

**Modified files:**
- `src/components/map/LayerControls.tsx` — refactor into MapToolbar + MapToolbarPanel
- `src/components/map/IntelMap.tsx` — integrate new toolbar, add keyboard event handling
- `src/app/globals.css` — add toolbar animation utilities

### UI Specification

**Icon strip (always visible):**
- Position: fixed left side of map, vertically centered
- Glass card background: `rgba(10, 15, 26, 0.85)`, `backdrop-filter: blur(16px)`
- Icons: 36×36px buttons with emoji or lucide icons
- Active state: accent color bg + border (e.g., `rgba(59,130,246,0.15)` + `border-color: rgba(59,130,246,0.3)`)
- Inactive state: `rgba(255,255,255,0.03)` bg
- Separator line between layer toggles and utility buttons

**Layer buttons:**
| Icon | Label | Shortcut | Action |
|------|-------|----------|--------|
| 🏭 / Factory | Infra | `I` | Toggle infrastructure layer |
| ⛽ / Fuel | Stations | `S` | Toggle stations + expand brand filter panel |
| 🚢 / Ship | Routes | `R` | Toggle shipping routes |
| 🏷️ / Tag | Labels | `L` | Toggle text labels |
| ◀▶ / PanelLeft | Expand | `[` | Toggle panel open/close |

**Expandable panel:**
- Slides out from icon strip (left→right), 220px wide
- Content varies per active layer:
  - **Stations:** brand filter chips (with station counts), region dropdown
  - **Infrastructure:** facility type legend, status colors
  - **Routes:** route list with disruption status
- Auto-closes when clicking map or pressing `Escape`

**Mode tabs:**
- Move from inside LayerControls to **top center** of map as floating pills
- Same LIVE / SCENARIO / TIMELINE options
- Glass card background, same styling

**Command Palette (⌘K):**
- Full-screen dark overlay with centered search input
- Search categories: Stations (by name/brand), Facilities (by name), Regions, Layers, Actions
- Results as selectable rows with icons and keyboard nav (↑↓ Enter)
- Selecting a station → map flies to it + opens tooltip
- Selecting a region → triggers regional drill-down
- Selecting a layer → toggles it

**Keyboard shortcut hint bar:**
- Position: bottom-right corner of map
- Shows: `⌘K search · I infra · S stations · R routes · L labels · ? help`
- Fades in on first load, can be dismissed
- `?` opens a full help overlay with all shortcuts

**Mobile adaptation:**
- Icon strip becomes bottom bar (horizontal)
- Command palette opens full-screen
- Panel opens as bottom sheet (slides up from bottom)

### Constraints
- No new dependencies — keyboard handling via `useEffect` + `keydown`
- Must preserve all existing layer toggle logic and supercluster behavior
- `⌘K` must not conflict with browser's native shortcut on some OSes — use `Ctrl+K` as fallback

---

## Feature 2: Price Alert System

### Problem
Users have no way to be notified when prices cross important thresholds. They must manually check the dashboard.

### Solution
Browser-native notification system with localStorage-persisted alert rules.

### Architecture

**New files:**
- `src/hooks/useAlerts.ts` — alert rule management, threshold checking, notification dispatch
- `src/components/alerts/AlertBell.tsx` — header bell icon with badge count
- `src/components/alerts/AlertDrawer.tsx` — notification history panel
- `src/components/alerts/AlertRuleModal.tsx` — create/edit alert rules

**Modified files:**
- `src/components/layout/Header.tsx` — add AlertBell
- `src/hooks/usePrices.ts` — call alert checker after each price update

### Data Model

```typescript
interface AlertRule {
  id: string;
  benchmarkId: string; // e.g., 'brent-crude', 'pump-gasoline'
  direction: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

interface AlertNotification {
  id: string;
  ruleId: string;
  benchmarkId: string;
  value: number;
  threshold: number;
  direction: 'above' | 'below';
  timestamp: string;
  read: boolean;
}
```

**Storage:** `localStorage` keys `oil-intel-alert-rules` and `oil-intel-alert-history`.

### Behavior
- On each `usePrices` poll (5 min), compare current values against active rules
- If threshold crossed AND rule hasn't triggered in the last 30 minutes → fire notification
- Browser `Notification.requestPermission()` on first rule creation
- Alert history capped at 50 entries (FIFO)
- SparkCharts show alert threshold as dashed horizontal line when rule exists for that benchmark

---

## Feature 3: Scenario Comparison

### Problem
Users can adjust scenario parameters but can't save or compare scenarios. No way to answer "what's worse — Hormuz blockade or peso devaluation?"

### Solution
Save scenario snapshots to localStorage, compare up to 3 side-by-side.

### Architecture

**New files:**
- `src/hooks/useScenarios.ts` — scenario CRUD, localStorage persistence
- `src/components/scenarios/ScenarioSlots.tsx` — pill tabs for saved scenarios
- `src/components/scenarios/ScenarioCompare.tsx` — side-by-side comparison view

**Modified files:**
- `src/components/scenarios/ScenarioPlanner.tsx` — add save button, integrate ScenarioSlots
- `src/app/page.tsx` — add compare view toggle

### Data Model

```typescript
interface SavedScenario {
  id: string;
  name: string;
  params: ScenarioParams;
  derived: {
    pumpGasoline: number;
    pumpDiesel: number;
    riskLevel: string;
    supplyDays: number;
    impacts: { label: string; change: string }[];
  };
  savedAt: string;
}
```

**Storage:** `localStorage` key `oil-intel-scenarios`, max 5 slots.

### UI
- **Scenario slots:** horizontal pill row below ScenarioPlanner header: `[Baseline ✕] [Hormuz Crisis ✕] [+ Save Current]`
- Clicking a slot loads those params into the planner
- **Compare mode:** "Compare" button appears when 2+ scenarios saved → opens full-width section with columns
- Each column: scenario name, all 4 params, pump prices, impact cards, risk badge
- Diff highlighting: cells where values differ get `border-left: 2px solid` (green if better, red if worse)

---

## Feature 4: Regional Drill-Down

### Problem
The map shows national data but policymakers and LGU officials need regional intelligence. "How many stations serve Region V? How far is the nearest terminal?"

### Solution
Clickable regions on map that fly-to and show a regional intelligence panel.

### Architecture

**New files:**
- `src/components/map/RegionLayer.ts` — deck.gl GeoJsonLayer for region polygons
- `src/components/map/RegionPanel.tsx` — regional detail sidebar
- `src/data/regions-geo.json` — GeoJSON polygons for PH regions (derived from existing bounding boxes)
- `src/lib/region-analytics.ts` — compute station density, nearest infrastructure, supply metrics

**Modified files:**
- `src/components/map/IntelMap.tsx` — add RegionLayer, handle region click → fly-to + panel
- `src/components/map/MapToolbar.tsx` — add region toggle icon

### Regional Analytics (computed client-side)

```typescript
interface RegionAnalytics {
  regionName: string;
  stationCount: number;
  brandBreakdown: { brand: string; count: number }[];
  nearestTerminal: { name: string; distanceKm: number };
  nearestDepot: { name: string; distanceKm: number };
  estimatedSupplyDays: number; // based on station density + infrastructure proximity
  priceEstimate: { gasoline: number; diesel: number }; // national + distance premium
  populationServed?: number; // future: from census data
}
```

### UI
- Region polygons: subtle fill on hover (`rgba(59,130,246,0.1)`), border highlight
- Click → map `flyTo` region centroid at zoom 8–9
- RegionPanel slides in from right (320px wide), glass card
- Station brand breakdown as horizontal stacked bar
- "Back to National View" button → fly back to default viewport

---

## Feature 5: Monte Carlo Stress Test

### Problem
The current scenario planner uses single-point estimates. Policymakers need probabilistic analysis: "What's the chance gasoline exceeds ₱80/L?"

### Solution
Client-side Monte Carlo simulation (1,000 runs) via Web Worker with confidence fan visualization.

### Architecture

**New files:**
- `src/lib/monte-carlo.worker.ts` — Web Worker for simulation runs
- `src/lib/monte-carlo.ts` — typed interface for worker communication
- `src/components/scenarios/StressTest.tsx` — stress test UI with controls and results
- `src/components/scenarios/ConfidenceFan.tsx` — Recharts AreaChart with P10–P90 bands
- `src/components/ui/Disclaimer.tsx` — reusable disclaimer badge component

**Modified files:**
- `src/app/page.tsx` — add StressTest section after ScenarioPlanner
- `src/types/index.ts` — add Monte Carlo types

### Simulation Model

**Input distributions:**
| Variable | Distribution | Parameters |
|----------|-------------|-----------|
| Brent crude | Normal | μ = current price, σ = price × 0.15 (annualized vol) |
| Hormuz disruption | Bernoulli × Uniform | P(disruption) = 0.15; if disrupted, duration ~ Uniform(1, 16) weeks |
| PHP/USD forex | Normal | μ = current rate, σ = rate × 0.05 |
| Refinery offline | Bernoulli | P(offline) = 0.05 (base), 0.15 (typhoon season Jun–Nov) |

**Output:**
```typescript
interface MonteCarloResult {
  runs: number;
  pumpGasoline: { p10: number; p25: number; p50: number; p75: number; p90: number };
  pumpDiesel: { p10: number; p25: number; p50: number; p75: number; p90: number };
  probabilityAbove: { threshold: number; gasoline: number; diesel: number }[];
  rawDistribution: number[]; // for histogram
  computeTimeMs: number;
}
```

### Disclaimer (MANDATORY)

```
⚠️ SIMULATION DISCLAIMER
These projections use simplified Monte Carlo modeling with assumed probability
distributions. They are for educational and discussion purposes only — not
investment, policy, or operational advice. Real-world outcomes depend on factors
not captured in this model including geopolitical events, weather, regulatory
changes, and market speculation.

For production-grade forecasting, a backend simulation engine with historical
correlation data is planned (see Phase C Roadmap below).
```

- Displayed as a glass card with `border-left: 3px solid #f59e0b` (amber)
- Always visible when stress test results are shown — cannot be dismissed
- Includes a collapsible "Phase C Roadmap" section within the disclaimer

### UI
- "Run Stress Test" button in the scenario section
- While running: spinner + "Simulating 1,000 scenarios..."
- Results: confidence fan chart (AreaChart with gradient bands), key percentiles as hero numbers
- "Probability gasoline exceeds ₱X/L" slider → live probability readout
- Histogram toggle for raw distribution view

---

## Feature 6: Historical Playback

### Problem
The Timeline mode exists but has no real historical data. Users can't see how past events (Ukraine war, Hormuz tensions, typhoons) actually affected prices.

### Solution
Static historical dataset + enhanced timeline scrubber that drives all dashboard components.

### Architecture

**New files:**
- `src/data/historical-prices.json` — weekly price snapshots 2022–2026 (~200 entries)
- `src/data/historical-events.json` — key events with dates, severity, price impact
- `src/components/timeline/TimelineScrubber.tsx` — full-width scrubber with event markers
- `src/hooks/useHistoricalData.ts` — manages playback state, interpolation

**Modified files:**
- `src/components/map/IntelMap.tsx` — route opacity responds to historical date
- `src/components/layout/ExecutiveSnapshot.tsx` — shows historical prices when in playback mode
- `src/components/health/EventTimeline.tsx` — highlights events near the selected date

### Data Format

```typescript
interface HistoricalSnapshot {
  date: string; // ISO date, weekly
  brent: number;
  dubai: number;
  phpUsd: number;
  pumpGasoline: number;
  pumpDiesel: number;
}

interface HistoricalEvent {
  date: string;
  title: string;
  severity: 'red' | 'yellow' | 'green';
  priceImpact: number; // percentage
  description: string;
}
```

### UI
- **Timeline scrubber:** full-width bar below the map section
- Date range: 2022-01-01 to present
- Event markers: colored dots on the timeline (red/yellow/green)
- Hover a marker → tooltip with event title + price impact
- Play/pause button: auto-advances 1 week per second
- Speed control: 1×, 2×, 4×
- Current date displayed as large mono text
- All dashboard KPIs, sparklines, and event timeline update reactively

### Data Curation
Historical price data to be curated from:
- Yahoo Finance historical CSV for Brent (publicly available)
- BSP historical forex data
- DOE weekly price monitoring archives
- Reuters/AP event timeline for Philippine energy events

Data is static JSON — no live API calls. Can be updated periodically by running a curation script.

---

## Feature 7: Consumer Impact Calculator

### Problem
The dashboard speaks in $/bbl and ₱/L — abstractions that don't connect to daily life. A jeepney driver needs to know "how much more will I spend this month?"

### Solution
Persona-based impact calculator that translates scenario parameters into personal cost impact.

### Architecture

**New files:**
- `src/components/consumer/ImpactCalculator.tsx` — persona selector + results
- `src/components/consumer/PersonaCard.tsx` — individual persona card component
- `src/components/consumer/ImpactResult.tsx` — shareable result card
- `src/lib/consumer-models.ts` — calculation formulas per persona

**Modified files:**
- `src/app/page.tsx` — add ImpactCalculator section after Scenario Planner
- `src/types/index.ts` — add consumer persona types

### Persona Models

```typescript
interface ConsumerPersona {
  id: string;
  icon: string;
  label: string;
  description: string;
  monthlyBaseline: number; // ₱ monthly fuel cost at baseline prices
  fuelType: 'gasoline' | 'diesel' | 'both';
  dailyLiters: number;
  workDaysPerMonth: number;
  incomeEstimate: number; // ₱ monthly income (for % impact calculation)
}

const PERSONAS: ConsumerPersona[] = [
  {
    id: 'jeepney',
    icon: '🚐',
    label: 'Jeepney Driver',
    description: 'Public utility vehicle, daily operations in Metro Manila',
    monthlyBaseline: 7800,
    fuelType: 'diesel',
    dailyLiters: 15,
    workDaysPerMonth: 26,
    incomeEstimate: 18000,
  },
  {
    id: 'household',
    icon: '🏠',
    label: 'Household',
    description: 'Family of 4, 2 vehicles, monthly LPG for cooking',
    monthlyBaseline: 6400,
    fuelType: 'gasoline',
    dailyLiters: 4,
    workDaysPerMonth: 30,
    incomeEstimate: 45000,
  },
  {
    id: 'sme',
    icon: '🏪',
    label: 'SME Owner',
    description: 'Small business with 3 delivery vehicles + generator',
    monthlyBaseline: 24000,
    fuelType: 'diesel',
    dailyLiters: 30,
    workDaysPerMonth: 26,
    incomeEstimate: 80000,
  },
  {
    id: 'fleet',
    icon: '🚛',
    label: 'Logistics Fleet',
    description: '20-truck fleet, bulk diesel purchasing, nationwide routes',
    monthlyBaseline: 480000,
    fuelType: 'diesel',
    dailyLiters: 600,
    workDaysPerMonth: 26,
    incomeEstimate: 2000000,
  },
];
```

### Calculation

```typescript
function calculateImpact(persona: ConsumerPersona, scenarioParams: ScenarioParams, currentPumpPrice: number, baselinePumpPrice: number): ImpactResult {
  const priceDelta = currentPumpPrice - baselinePumpPrice;
  const monthlyLiters = persona.dailyLiters * persona.workDaysPerMonth;
  const monthlyCostDelta = monthlyLiters * priceDelta;
  const percentOfIncome = (monthlyCostDelta / persona.incomeEstimate) * 100;
  const painIndex = Math.min(10, Math.max(1, Math.round(percentOfIncome * 2)));

  return {
    monthlyCostDelta,
    percentOfIncome,
    painIndex,
    monthlyLiters,
    newMonthlyTotal: persona.monthlyBaseline + monthlyCostDelta,
  };
}
```

### UI
- Section title: "How Does This Affect You?"
- 4 persona cards in a 2×2 grid (mobile: single column)
- Click a persona → card expands to show:
  - Monthly cost delta (₱) — large mono number, red if increase
  - % of income impact
  - Pain index (1–10 scale with color gradient bar)
  - "New monthly fuel cost: ₱X,XXX"
- **Shareable card:** "Copy as image" button → generates a styled card (canvas → clipboard) with persona, impact numbers, and dashboard URL
- Results update live as scenario params change

---

## Phase C Roadmap: Backend Simulation Engine

> This section documents the upgrade path from client-side Monte Carlo (Phase 3) to a production-grade server-side simulation engine. **Not implemented in v2 — planned for future development.**

### Why Upgrade

| Client-Side (current) | Server-Side (future) |
|----------------------|---------------------|
| Assumed probability distributions | Historical correlation matrices |
| 1,000 runs in browser | 10,000+ runs on server |
| No back-testing | Historical accuracy scoring |
| No data persistence | Time-series database |
| No API for third parties | REST API for DOE/NEDA integration |

### Architecture (Planned)

1. **Supabase tables:**
   - `daily_prices` — Brent, Dubai, PHP/USD, pump gasoline, pump diesel (2020–present)
   - `events` — curated event timeline with tagged price impacts
   - `simulation_runs` — saved simulation results for sharing/comparison

2. **API endpoints:**
   - `POST /api/simulate` — runs Monte Carlo with historical correlations
   - `GET /api/historical?from=&to=` — returns price time series
   - `GET /api/backtest?scenario=` — compares past predictions to outcomes

3. **Correlation engine:**
   - Compute rolling 90-day correlation between Brent, forex, and pump prices
   - Use Cholesky decomposition for correlated random variable sampling
   - Seasonal adjustment for typhoon risk (Jun–Nov)

4. **Back-testing:**
   - For any date range, run the simulation model and compare to actual outcomes
   - Compute MAPE (Mean Absolute Percentage Error) as accuracy metric
   - Display calibration chart: predicted ranges vs actual prices

5. **Third-party API:**
   - Authenticated API endpoints for DOE, NEDA, academic researchers
   - Rate limiting, usage tracking, API key management
   - OpenAPI spec for documentation

### Prerequisites
- Supabase project with billing (for storage + compute)
- Historical price data pipeline (Yahoo Finance + BSP + DOE archives)
- Vercel Pro or Team plan (for longer serverless execution times)

---

## File Manifest

| # | Action | File | Feature | Phase |
|---|--------|------|---------|-------|
| 1 | Create | `src/components/map/MapToolbar.tsx` | Map Controls | 1 |
| 2 | Create | `src/components/map/MapToolbarPanel.tsx` | Map Controls | 1 |
| 3 | Create | `src/components/map/CommandPalette.tsx` | Map Controls | 1 |
| 4 | Create | `src/hooks/useKeyboardShortcuts.ts` | Map Controls | 1 |
| 5 | Modify | `src/components/map/LayerControls.tsx` | Map Controls | 1 |
| 6 | Modify | `src/components/map/IntelMap.tsx` | Map Controls + Regional | 1, 2 |
| 7 | Create | `src/hooks/useAlerts.ts` | Price Alerts | 2 |
| 8 | Create | `src/components/alerts/AlertBell.tsx` | Price Alerts | 2 |
| 9 | Create | `src/components/alerts/AlertDrawer.tsx` | Price Alerts | 2 |
| 10 | Create | `src/components/alerts/AlertRuleModal.tsx` | Price Alerts | 2 |
| 11 | Modify | `src/components/layout/Header.tsx` | Price Alerts | 2 |
| 12 | Create | `src/hooks/useScenarios.ts` | Scenario Comparison | 2 |
| 13 | Create | `src/components/scenarios/ScenarioSlots.tsx` | Scenario Comparison | 2 |
| 14 | Create | `src/components/scenarios/ScenarioCompare.tsx` | Scenario Comparison | 2 |
| 15 | Modify | `src/components/scenarios/ScenarioPlanner.tsx` | Scenario Comparison | 2 |
| 16 | Create | `src/components/map/RegionLayer.ts` | Regional Drill-Down | 2 |
| 17 | Create | `src/components/map/RegionPanel.tsx` | Regional Drill-Down | 2 |
| 18 | Create | `src/data/regions-geo.json` | Regional Drill-Down | 2 |
| 19 | Create | `src/lib/region-analytics.ts` | Regional Drill-Down | 2 |
| 20 | Create | `src/components/consumer/ImpactCalculator.tsx` | Consumer Impact | 2 |
| 21 | Create | `src/components/consumer/PersonaCard.tsx` | Consumer Impact | 2 |
| 22 | Create | `src/components/consumer/ImpactResult.tsx` | Consumer Impact | 2 |
| 23 | Create | `src/lib/consumer-models.ts` | Consumer Impact | 2 |
| 24 | Create | `src/lib/monte-carlo.worker.ts` | Stress Test | 3 |
| 25 | Create | `src/lib/monte-carlo.ts` | Stress Test | 3 |
| 26 | Create | `src/components/scenarios/StressTest.tsx` | Stress Test | 3 |
| 27 | Create | `src/components/scenarios/ConfidenceFan.tsx` | Stress Test | 3 |
| 28 | Create | `src/components/ui/Disclaimer.tsx` | Stress Test | 3 |
| 29 | Create | `src/data/historical-prices.json` | Historical Playback | 3 |
| 30 | Create | `src/data/historical-events.json` | Historical Playback | 3 |
| 31 | Create | `src/components/timeline/TimelineScrubber.tsx` | Historical Playback | 3 |
| 32 | Create | `src/hooks/useHistoricalData.ts` | Historical Playback | 3 |
| 33 | Modify | `src/app/page.tsx` | All features | 1–3 |
| 34 | Modify | `src/types/index.ts` | All features | 1–3 |
| 35 | Modify | `src/app/globals.css` | All features | 1–3 |

**New dependencies:** None (Web Worker is native, all charts use existing Recharts)

---

## Verification

### Per-Phase
1. **Phase 1:** Keyboard shortcuts work (I/S/R/L), ⌘K opens palette, icon strip toggles layers, panel expands/collapses
2. **Phase 2:** Alert fires when price crosses threshold, scenarios save/load/compare, region click → fly-to + panel, persona calculator shows personalized impact
3. **Phase 3:** Monte Carlo completes in <2s, confidence fan renders, disclaimer always visible, timeline scrub updates all KPIs

### End-to-End
- `pnpm build` passes clean after each phase
- All 3 map modes (LIVE/SCENARIO/TIMELINE) still work
- Mobile responsive: 375px, 768px, 1440px breakpoints
- No hardcoded rgba values (design token discipline)
- Dashboard falls back gracefully when APIs unreachable
- Disclaimer badge cannot be dismissed on stress test results
