# Award-Grade Upgrade Program — Design Spec

**Date:** 2026-05-18
**Status:** Approved
**Predecessor:** `2026-05-17-100x-platform-upgrade-design.md` (all 5 workstreams shipped — PRs #6–#13)

---

## 1. Goal

Take the dashboard from "good" to award-grade and industry-grade across four dimensions: **data integrity**, **data visualization**, **motion & interaction design**, and **insight reporting** — with performance improvements woven into each wave where they touch the same files.

The bar: a first-time visitor should trust every number, grasp the year's price story in one chart, *feel* a crisis-level change, and leave with an editorial takeaway — on a homepage that stays near its current 129 kB First Load JS.

## 2. How we got here

Four parallel audit agents reviewed the post-100x codebase (main @ `9dbfe97`) across data visualization, interaction/motion, data layout/insight reporting, and performance. ~40 findings synthesized; four strategic decisions made by the owner:

| Decision | Choice |
|----------|--------|
| Program structure | **Integrity first, then 3 waves** (A → B → C → D, foundation-gated) |
| Motion technology | **Rive for hero moments** (lazy-loaded), native CSS/WAAPI everywhere else |
| Historical price data | **Curate a static real DOE/Brent weekly series** (committed data file) |
| Map scope | **Full analytical suite** (choropleth + hexbin + clusters + arcs + tour) |

### Cross-cutting critical findings (the integrity floor)

1. **Fabricated sparklines** — `PricePanel` synthesizes a sine-wave trend when price history is missing (almost always), rendered identically to real data. Flagged independently by two audits.
2. **Simulated numbers presented as live** — Acts 1–2 (Supply Risk badge, ImpactCards, VitalSigns) compute from the *hypothetical* scenario default (Brent $106), not live prices (~$68). The `/cascade` headline quotes hardcoded `+₱3,200/mo` / `$107.8/bbl` as if current.
3. **No real history** — `priceHistory` holds ~35 minutes of 5-minute polls, session-only, on a dashboard whose pump prices change weekly. A real 2022–2026 `historical-prices.json` exists but is only used by the map timeline.
4. **Alerts never fire** — `checkPrices` has zero call sites; the AlertBell UI is decorative.

## 3. Program architecture

Four waves, each its own plan → branch → subagent-driven execution → PR → merge (the proven 100x cadence). Wave A gates B/C/D. B, C, D are sequenced (B → C → D) because they share files (`page.tsx`, map components, `DataProvider`); within each wave, tasks parallelize via subagents.

```
Wave A (Integrity & Quick Wins)  ──gates──▶  Wave B (Visualization)
                                              └─▶ Wave C (Motion & Interaction)
                                                   └─▶ Wave D (Insight Layer)
```

Performance work is distributed, not a separate wave: quick wins in A; map-perf in B (same files as map features); animation-perf and blur-overdraw in C; context-split in D (pairs with insight wiring).

---

## 4. Wave A — Data Integrity & Quick Wins

**Why first:** no award-grade visualization can sit on fabricated or mislabeled data. Everything here is bounded and high-yield.

### A1. Honest sparklines
Remove the synthetic-trend generator in `PricePanel`. When real history < 2 points, render the existing fixed-size empty box with a quiet "history building…" label (`text-text-dim`, mono eyebrow style). Never render invented curves. Consumer-side rule per CLAUDE.md: missing ≠ zero ≠ fabricated.

### A2. Live-vs-simulated separation
- Acts 1–2 components (`ExecutiveSnapshot` supply-risk badge, `ImpactCards`, `VitalSigns`) compute from **live** prices via `usePrices()`, not `scenarioParams`.
- Any surface still scenario-driven (ScenarioPlanner results, StressTest) carries a visible `SIMULATED` chip (mono 10px uppercase, `bg-status-yellow/10 text-status-yellow/70` — the established "Est." badge pattern).
- `/cascade`: the headline becomes explicitly a *modeled scenario* ("In a $107.8/bbl shock scenario, Filipino families would pay…"); the dashboard `CrisisHero` stops quoting cascade's hypothetical numbers — its human line derives from live diesel only.

### A3. Real alerts
Call `checkPrices` from `DataProvider`'s price-poll success path. Fired alerts feed the existing AlertBell state (single shared store — context or module store, matching `DataProvider` patterns). Dismissals persist via the existing `useDismissable` localStorage pattern.

### A4. Real weekly history (the Wave B substrate)
New `src/data/price-history.ts`: ~52 weeks of real data, hand-curated —
- `pumpDiesel`, `pumpGasoline`: DOE Oil Monitor weekly common SRP (Metro Manila), and
- `brent`: weekly Friday closes,
- each entry `{ week: 'YYYY-MM-DD', brent, pumpDiesel, pumpGasoline }`, plus optional `event?: string` flags for major disruptions.
Producer-side sanity validator (build-time test): entry count ≥ the curated target minus a small tolerance (the plan fixes the exact numbers — 48 at the full 52-week target, proportionally lower if we start at 26 weeks), all fields finite, within plausible bands (diesel ₱40–₱90, Brent $40–$140). Sparklines and the Wave B chart read this file; the live polling buffer additionally persists to localStorage so intraday context survives reloads (clearly secondary to the weekly series).

### A5. Quick perf & bug fixes (each ≤ ~10 lines)
| Fix | Detail | Impact |
|-----|--------|--------|
| Skeleton/map height match | copy the map's exact responsive height classes to `MapSkeleton` | kills main CLS source (~0.05–0.1) |
| Quantize zoom state | `setCurrentZoom` only when `Math.floor(zoom)` changes | ~60 → ~0 re-renders/s while panning |
| Scan-line CSS bug | transition was declared on a property that never changes; fix so the CRISIS sweep actually animates in | restores the signature effect |
| Slider INP | local slider state in `ScenarioPlanner`, propagate to `page.tsx` via rAF-throttle/`useDeferredValue` | drag INP 300–600 ms → <100 ms; prerequisite for Wave C slider feedback |
| stations.json caching | content-hash filename from `build-stations-json.mjs` + `Cache-Control: public, max-age=31536000, immutable` (vercel.json) | zero re-transfer on repeat visits |
| stations.json slimming | drop per-station `source` object + empty `address`, truncate coords to 5 decimals | ~335 → ~180 kB gz |

### A6. Single source of truth for current prices + formatting
`formatPHP()` / `formatUSD()` in `src/lib/format.ts` (pure, tested); sweep ad-hoc `₱${x.toFixed(2)}` call sites. One canonical "current diesel/gasoline" selector so no component hardcodes `78.5`-style constants.

---

## 5. Wave B — Visualization

**The centerpiece + encoding corrections + the map as an analysis tool.** No new chart library on the homepage — everything follows the hand-rolled SVG `SparkChart` pattern.

### B1. The annotated price chart (centerpiece)
New `PriceStoryChart` (Act 1, full-width): 12-month dual-series line chart — Brent (USD axis, left) and pump diesel/gasoline (PHP axis, right) from `price-history.ts`.
- FT-style direct line labels (no legend), event flags from the history file's `event` entries (Hormuz, refinery outages) as vertical markers with mono labels, shaded disruption bands, a dashed pre-Ukraine reference line.
- The existing TimelineScrubber acts as its brush — selecting a window crops the chart domain (shared state, not a new control).
- Hand-rolled SVG: pure helper module `src/lib/chart-scale.ts` (domain/ticks/path-d generation — fully unit-tested), presentational component on top.
- Responsive (375 px → 1440 px), `role="img"` + generated `aria-label` summarizing the trend, reduced-motion safe (no draw-on animation when `prefers-reduced-motion`).

### B2. Encoding corrections
| Component | Problem | Fix |
|-----------|---------|-----|
| ConfidenceFan | band hardcoded to full width — encodes nothing | nested P10–P25–P75–P90 bands from the existing Monte Carlo output, absolute shared ₱ axis, today-price reference line |
| MarketShare donut | angle comparison is weak; hover-dependent values | sorted horizontal labeled bars, values always visible; keep brand colors |
| 4-axis radar | unreadable shape, axes share no scale | bullet bars on the existing `GaugeBar` with threshold zones |
| Sentiment bar | left-anchored bar for a diverging quantity | center-anchored diverging bar (neutral midline) |
| SparkCharts | no baseline, unclamped domain, no min/max | dotted week-ago baseline, min/max labels, clamped sane y-domain |
| Color semantics | brand hues double as status colors | fuel-identity hues (diesel/gasoline) separated from status red/yellow/green; tokens added to globals + tailwind config |

### B3. Map analytical suite
All using the already-computed `region-analytics.ts` aggregates:
- **Choropleth mode** — regional fill by avg pump price or station density (PolygonLayer over region bounds), toggled from the existing mode control; legend with class breaks.
- **Hexbin brand-dominance mode** — HexagonLayer colored by dominant brand per cell.
- **Cluster upgrades** — clusters colored by brand composition (donut-style ring or dominant-brand fill), click-to-zoom expands a cluster.
- **Animated supply arcs** — volume-scaled custom PathLayer dash-offset animation replacing TripsLayer (drops `@deck.gl/geo-layers` ≈ 50–80 kB gz).
- **Camera** — `flyTo` on region select.

### B4. Map performance (same files, same wave)
- Split the monolithic `deckLayers` memo so only route layers depend on the animation clock (kills the 10×/s full-layer rebuild in LIVE mode).
- O(1) hover: dedicated 1-item highlight layer instead of `updateTriggers` re-evaluating 10k accessors.
- Lazy-load the map bundle when the map section approaches the viewport (`rootMargin: '800px'`) — −450 kB gz for visitors who never scroll to it.

---

## 6. Wave C — Motion & Interaction

**Native-first motion language + Rive at the two emotional peaks.**

### C1. Motion-token system
`globals.css` tokens: `--dur-1` (120 ms) / `--dur-2` (200 ms) / `--dur-3` (320 ms) / `--dur-4` (560 ms); easings `--ease-out-soft`, `--ease-out-expo`, `--ease-spring`; `--stagger-1` (40 ms). Sweep every ad-hoc `0.2s ease` literal. Documented in CLAUDE.md. All timing-sensitive code respects a new `usePrefersReducedMotion` hook (single source; replaces scattered media-query checks).

### C2. Crisis transitions become events
On crisis-level change: one-shot WAAPI accent flash on the accent-colored elements, staggered NERV corner draw-in, the (Wave-A-fixed) scan-line sweep, a CrisisHero headline cross-fade, and an `aria-live="polite"` announcement ("Crisis level rose to ELEVATED"). Pure helper decides the choreography; WAAPI executes; reduced-motion collapses to an instant swap + announcement.

### C3. Rive hero moments
- Dependency: `@rive-app/react-canvas` — **lazy-loaded on scroll-into-view only** (dynamic import inside an IntersectionObserver gate); never in the initial bundle. Budget: ≤ ~100 kB gz, paid only by visitors who reach the moment.
- **Moment 1 — crisis-state hero glyph** in `CrisisHero`: a state-machine animation with CALM / ELEVATED / CRISIS states + transition animations, driven by `useCrisis()` via Rive state-machine inputs.
- **Moment 2 — onboarding/tour accent** in the HowTo flow.
- **Every Rive composition ships a poster-frame fallback** (static SVG/PNG shown until loaded, on error, and under reduced-motion) — the standing shader-lab rule applied to Rive.
- **Asset constraint (explicit):** `.riv` files are authored in the Rive editor, which cannot be driven from this environment. Wave C ships the complete integration harness (lazy loader component, state-machine input wiring, poster fallback, tests for the wiring logic) using a sourced community/placeholder `.riv`. The bespoke crisis-glyph asset is an owner task (Rive editor or commission); swapping the file is a drop-in.

### C4. Scenario planner feel
- `ResultPanel` numbers animate via an extracted `useAnimatedNumber` (rAF + ease-out cubic — generalizing the existing counter pattern), with an increase/decrease color flash and magnitude-scaled glow.
- Sliders: filled-track styling (WebKit + Firefox `::-moz-range-*`), thumb scale on active, ≥ 44 px touch targets, step detents. Builds on Wave A's INP fix.

### C5. Liveness & choreography
- Price-tick flash when a poll actually changes a value (ties into Wave D's deep-equal work; in C, flash on value change only).
- **Map tour mode** — "Play the story": chained `flyTo` waypoints through the acts (Hormuz → import terminals → refinery → Metro Manila pumps), synced to the timeline scrubber; skippable; keyboard accessible.
- Focus traps for command palette / how-to guide / mobile bottom sheet (existing primitives, audited and fixed).
- Backdrop-blur overdraw fallback: solid card backgrounds below `md` breakpoint and in CRISIS mode (where the scan-line overlay compounds GPU cost).

---

## 7. Wave D — Insight Layer

**From numbers to editorial.** All insight generation is pure and tested; rendering is thin.

### D1. `src/lib/insights.ts`
Pure generator: `(prices, history, events) → Insight[]` ranked by salience. Detectors: N-week streaks, threshold breaches (e.g., diesel > ₱60), biggest weekly mover, event–price correlation ("prices rose the week of the Hormuz closure"), 52-week high/low. Each `Insight` = `{ id, severity, headline, body?, metric, sourceIds }`. Fully unit-tested with fixture histories (the Wave A validator guarantees fixture realism).

### D2. Insight surfaces
- **"This Week" strip** under ExecutiveSnapshot: top 2–3 insights as one-line bullets.
- **Per-KPI context line** on each price card ("vs Jan 2022: +38%", from `historical-prices.json` baselines).
- **Auto-lede** above the EventTimeline (the highest-salience event-correlated insight).
- **Lead-metric hierarchy**: ExecutiveSnapshot promotes the biggest mover to a double-width lead card (layout reflow, not new data).

### D3. Persona lens
Persisted persona selection (existing `consumer-models.ts` personas + `useDismissable`-style localStorage). Live-price-driven impact lines in CrisisHero, Act 2, and WhatToDo ("diesel's ₱0.70 drop saves a jeepney driver ≈ ₱273/mo"). Computed via existing `consumer-models` math from live prices — never the scenario.

### D4. Returning-visitor diff
"Since your last visit" banner: price deltas + count of new red/yellow events since the stored last-visit timestamp. Quietly absent on first visit. localStorage, SSR-safe (`loaded` flag pattern).

### D5. Weekly digest
`/digest` page composed from prices + events + top insights (server component, static-friendly), with its own OG card reusing the Wave 4 `/embed/scenario/og` pattern. Shareable, AI-agent documented (llms.txt entry).

### D6. DataProvider hardening (perf pairing)
Split price/event contexts; deep-equal bailout so unchanged polls don't produce new context values (also what makes C5's "flash only on real change" trivially correct).

---

## 8. Cross-cutting verification

- Every pure module (chart-scale, insights, format, history validator, crisis choreography decision logic) gets unit tests in the same task that creates it. Component render tests now work (PR #13) — interactive components get at least a smoke render test.
- `pnpm test`, `pnpm build`, `pnpm lint` green before every commit; per-task spec + code-quality reviews; final whole-wave review before each PR (the 100x regime).
- **Lighthouse before/after** for Waves A and B (mobile + desktop, homepage); record scores in the PR description.
- Homepage First Load JS budget: **≤ 135 kB** (current 129 kB) — Rive and map stay out of the initial bundle by construction.
- A11y checks per wave: heading order, aria-live for dynamic content, reduced-motion paths, 44 px targets, focus traps.

## 9. Deliberately out of scope (YAGNI)

- Recharts → SVG swap on `/cascade` (route-scoped 88 kB; low traffic; revisit if cascade becomes a landing surface).
- ASEAN price comparison, live jeepney-fare matrices (new external data sources — future cycle).
- Binary stations format (flatgeobuf/arrow) — JSON slimming + immutable caching captures most of the win.
- WS5b community features (station reports, corrections) — still the deferred phase from the 100x program.
- Authoring bespoke `.riv` assets in-session (impossible — flagged as owner task in C3).

## 10. Risks

| Risk | Mitigation |
|------|------------|
| DOE weekly history curation is manual and slow | Start with 26 weeks if 52 proves heavy; the validator enforces a floor of 48 only at full target — plan sets the real gate |
| Rive asset quality depends on sourced/commissioned file | Harness + poster fallback ship regardless; glyph is drop-in |
| Map modes balloon `IntelMap` complexity | Each mode is a separate layer-factory module behind the existing mode-control pattern |
| Slider INP fix changes param-flow timing for ScenarioPlanner's URL restore (Wave 4 feature) | Wave A task explicitly re-verifies the `?s=` deep-link restore + share flow |
