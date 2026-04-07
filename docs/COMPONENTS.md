# Components & Hooks Reference

All components use the `.glass-card` utility class for surfaces and design tokens from `src/app/globals.css`. See `CLAUDE.md` for token reference.

---

## Layout Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `Header` | `layout/Header.tsx` | `showTicker?: boolean` | All pages | Sticky top nav with Philippine flag accent bars, crisis-level color shift, `AlertBell`, live/static badge, and optional `Ticker`. Sub-pages pass `showTicker={false}`. |
| `Footer` | `layout/Footer.tsx` | — | All pages | Shows latest event date from `useEvents`; links to Roadmap and GitHub. |
| `AlertBanner` | `layout/AlertBanner.tsx` | — | Dashboard page | Dismissible red banner for most-recent `severity === 'red'` event. Reads from `useEvents` + `useCrisis`. |
| `ExecutiveSnapshot` | `layout/ExecutiveSnapshot.tsx` | `scenarioParams: ScenarioParams` | Dashboard page | 4-KPI hero grid (Brent, PHP/USD, Gasoline, Diesel) + 2 status badges. Reads live prices and events. |
| `MobileBottomNav` | `layout/MobileBottomNav.tsx` | — | Dashboard page | Fixed bottom nav for `xl:hidden`, scroll-spy driven, 5 sections. |
| `SectionNav` | `layout/SectionNav.tsx` | — | Dashboard page | Fixed right-side vertical nav for `xl:flex`, scroll-spy driven, 7 sections. |

---

## Map Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `MapWrapper` | `map/MapWrapper.tsx` | `mapMode: MapMode`, `scenarioParams: ScenarioParams`, `timelinePosition: number`, `onModeChange: (mode) => void` | Dashboard page | SSR-safe `dynamic()` wrapper around `IntelMap` with loading skeleton. |
| `IntelMap` | `map/IntelMap.tsx` | `mapMode`, `scenarioParams`, `timelinePosition`, `onModeChange` | `MapWrapper` | Core map — MapLibre GL + deck.gl via `DeckGLOverlay`. Manages all layer/filter state. Default center: Philippines (122, 12, zoom 5.5). |
| `FacilityLayer` | `map/FacilityLayer.tsx` | — (factory function) | `IntelMap` | Factory: `createFacilityLayers(visible, mode, params, timeline, onSelect, hoveredId, setHovered)` → `Layer[]`. `ScatterplotLayer` + `ColumnLayer` + `TextLayer`. |
| `ShippingLayer` | `map/ShippingLayer.tsx` | — (factory function) | `IntelMap` | Factory: `createRouteLayers(visible, mode, time, params)` → `Layer[]`. `ArcLayer` + `TripsLayer` (animated in LIVE mode). |
| `StationLayer` | `map/StationLayer.tsx` | — (factory function) | `IntelMap` | Factory: `createStationLayer(visible, brands, onClick, hoveredId, setHovered, setInfo, zoom, region, statusFilter)` → `Layer[]`. Clusters via `supercluster` at zoom < 8. |
| `CommandPalette` | `map/CommandPalette.tsx` | `open: boolean`, `onClose: () => void`, `onSelectStation?: (id) => void`, `onSelectRegion?: (r) => void`, `onToggleLayer?: (l) => void` | `IntelMap` | Full-screen search overlay (⌘K). Searches stations (cap 8), facilities (cap 5), regions (cap 5), and layer actions. Keyboard: Arrow Up/Down + Enter. |
| `FacilityDetail` | `map/FacilityDetail.tsx` | `facility: Facility \| null`, `onClose: () => void` | `IntelMap` | Slide-up panel at bottom-left showing facility name, status badge, location, operator, capacity, notes. |
| `LayerControls` | `map/LayerControls.tsx` | `layers`, `onToggle`, `mapMode`, `onModeChange`, `stationsVisible`, `onStationsToggle`, `visibleBrands`, `onBrandToggle`, `selectedRegion`, `onRegionChange` | Not used directly (superseded by `MapToolbar`) | Full layer + mode control panel. |
| `MapToolbar` | `map/MapToolbar.tsx` | `layers`, `onToggle`, `stationsVisible`, `onStationsToggle`, `visibleBrands`, `onBrandToggle`, `selectedRegion`, `onRegionChange`, `statusFilter`, `onStatusFilterChange`, `onCommandPalette: () => void` | `IntelMap` | Vertical icon strip (left-center). Single-click = toggle layer; double-click = expand `MapToolbarPanel`. Keyboard hints bar at bottom-right. |
| `MapToolbarPanel` | `map/MapToolbarPanel.tsx` | `activeLayer: string`, `layers`, `onClose: () => void` | `MapToolbar` | Expandable side panel showing legend for active layer (facilities, routes, or labels). |
| `RegionPanel` | `map/RegionPanel.tsx` | `region: string`, `onClose: () => void` | `IntelMap` | Right-side slide panel. Shows region station count, brand breakdown bar chart, nearest terminal/depot distances. Computed via `region-analytics`. |
| `StationFilterBar` | `map/StationFilterBar.tsx` | `visibleBrands: Set<string>`, `onBrandToggle`, `statusFilter: StationStatus \| 'all'`, `onStatusFilterChange`, `selectedRegion`, `onRegionChange`, `filteredCount: number`, `totalCount: number` | `IntelMap` | Horizontal filter bar below map mode tabs. Brand pills + status pills + region dropdown + station count readout. |
| `StationTooltip` | `map/StationTooltip.tsx` | `station: GasStation \| null`, `x: number`, `y: number` | `IntelMap` | Absolute-positioned tooltip at cursor; shows brand, status, name, address, fuel types, coordinates. |
| `TimelineSlider` | `map/TimelineSlider.tsx` | `position: number`, `onPositionChange: (n) => void`, `visible: boolean` | Dashboard page | Scrub bar for TIMELINE map mode; play/pause with `requestAnimationFrame`, 16-week range. |
| `ZoomControls` | `map/ZoomControls.tsx` | `onZoomIn: () => void`, `onZoomOut: () => void`, `onReset: () => void` | `IntelMap` | 3-button stack (bottom-left): +, −, PH (reset to Philippines view). |

---

## Price Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `PricePanel` | `prices/PricePanel.tsx` | — | Dashboard page | Grid of `BenchmarkCard` for all 8 price benchmarks from `usePrices`. Cards show animated value, WoW change %, sparkline, source badge. Derived benchmarks show "Est." badge. |
| `PumpPrices` | `prices/PumpPrices.tsx` | — | Dashboard page | Two large `PriceCard` components for pump gasoline and pump diesel (DOE weekly SRP). Includes `SourceAttribution`. |
| `ImpactCards` | `prices/ImpactCards.tsx` | `scenarioParams: ScenarioParams` | Dashboard page | 4 consumer impact cards (jeepney, Grab, rice, LPG) with scenario-derived `change` strings. Source: `IMPACT_ITEMS` from constants. |
| `SparkChart` | `prices/SparkChart.tsx` | `data: number[]`, `color: string`, `width?: number`, `height?: number`, `unit?: string` | `PricePanel`, `ExecutiveSnapshot`, `PumpPrices`, `SentimentGauge` | Recharts `AreaChart` with gradient fill. Default 80×24px. Interactive tooltip via Recharts. |

---

## Health & Intelligence Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `VitalSigns` | `health/VitalSigns.tsx` | `params: ScenarioParams`, `mapMode: MapMode` | Dashboard page | 4 vital sign cards (Days of Supply, Import Diversity, Refinery Utilization, Route Risk). Values derived from `ScenarioParams`. Uses `GaugeBar` + `InfoTip`. |
| `SentimentGauge` | `health/SentimentGauge.tsx` | — | Dashboard page | Market sentiment gauge from `useSentiment` (15-min poll). Shows per-headline sentiment list + overall BULLISH/NEUTRAL/BEARISH label + sparkline history. |
| `EventTimeline` | `health/EventTimeline.tsx` | — | Dashboard page | Filterable/expandable list of supply chain events from `useEvents`. Severity color coding (red/yellow/green). Source icons for press, government, social, AI. |
| `StationTrackerSection` | `health/StationTrackerSection.tsx` | — | Dashboard page | 5 stat cards for station status counts (total, out-of-stock, low-supply, closed, operational) from static `statusCounts`. Total: 10,469 stations. |

---

## Player Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `MarketShare` | `players/MarketShare.tsx` | — | Dashboard page | Recharts `PieChart` donut with active-shape expand on hover. Data from `marketPlayers`. Cross-highlights with `PlayerCards` via `HighlightContext`. |
| `PlayerCards` | `players/PlayerCards.tsx` | — | Dashboard page | Expandable accordion cards for each market player. Shows vulnerability score, risk level bar, strategy icon, import exposure. Syncs highlight state with `MarketShare`. |

---

## Scenario Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `ScenarioPlanner` | `scenarios/ScenarioPlanner.tsx` | `params: ScenarioParams`, `onParamsChange: (p) => void`, `mapMode: MapMode`, `timelinePosition: number` | Dashboard page | Main scenario control panel with 4 sliders (Brent, Forex, Hormuz weeks, Refinery offline toggle) + `ResultPanel`, `RiskMatrix`, `ScenarioSlots`, `ScenarioCompare`. Syncs live prices on mount. |
| `ResultPanel` | `scenarios/ResultPanel.tsx` | `gasoline: number`, `diesel: number`, `riskLevel: RiskLevel` | `ScenarioPlanner` | Shows computed pump prices vs current baseline with ₱ delta and risk badge (STABLE/ELEVATED/CRISIS). |
| `RiskMatrix` | `scenarios/RiskMatrix.tsx` | `params: ScenarioParams`, `riskLevel: RiskLevel` | `ScenarioPlanner` | 4-row risk category table (Supply Chain, Price Impact, Import Risk, Consumer Impact) with colored dot indicators. |
| `ScenarioSlots` | `scenarios/ScenarioSlots.tsx` | `scenarios: SavedScenario[]`, `onLoad: (p) => void`, `onRemove: (id) => void`, `onSave: (name) => void`, `disabled?: boolean` | `ScenarioPlanner` | Saved scenario chips (max 5) + inline name-and-save input. Uses `useScenarios` hook. |
| `ScenarioCompare` | `scenarios/ScenarioCompare.tsx` | `scenarios: SavedScenario[]` | `ScenarioPlanner` | Side-by-side comparison grid. Renders only when `scenarios.length >= 2`. |
| `StressTest` | `scenarios/StressTest.tsx` | `params: ScenarioParams` | Dashboard page | Monte Carlo simulation (1,000 runs via `runMonteCarlo`). Shows `RiskRadar` SVG + `ConfidenceFan` per fuel type + `Disclaimer`. |
| `ConfidenceFan` | `scenarios/ConfidenceFan.tsx` | `result: MonteCarloResult`, `fuelType: 'gasoline' \| 'diesel'` | `StressTest` | P10/P25/P50/P75/P90 price bands as colored column labels. |

---

## Cascade Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `CascadeSection` | `cascade/CascadeSection.tsx` | — | `/cascade` page | Page-level container. Shows stat pills (node count, link count, critical/high counts) + `CascadeFlow`. Data from `@/data/cascade`. |
| `CascadeFlow` | `cascade/CascadeFlow.tsx` | — | `CascadeSection` | Groups `CascadeNode[]` by category (energy → agriculture → transport → consumer) with `ArrowConnector` SVG between groups. |
| `CascadeCard` | `cascade/CascadeCard.tsx` | `node: CascadeNode` | `CascadeFlow` | Single cascade node card. Shows icon, label, current value, change %, `ImpactMeter`, affected sectors list, timeline of effects. Left border = category color. |
| `ImpactMeter` | `cascade/ImpactMeter.tsx` | `severity: SeverityLevel` | `CascadeCard` | Horizontal bar at 25/50/75/100% width for low/moderate/high/critical severity. |

---

## Alert Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `AlertBell` | `alerts/AlertBell.tsx` | — | `Header` | Bell icon button with unread count badge. Orchestrates `AlertDrawer` + `AlertRuleModal` state. No props (reads `useAlerts` internally). |
| `AlertDrawer` | `alerts/AlertDrawer.tsx` | `open: boolean`, `onClose: () => void`, `alerts: ReturnType<typeof useAlerts>`, `onAddRule: () => void` | `AlertBell` | Right-side slide drawer (360px). Lists notification history + active rules. Mark-all-read + delete-rule controls. |
| `AlertRuleModal` | `alerts/AlertRuleModal.tsx` | `open: boolean`, `onClose: () => void`, `onSave: (rule: Omit<AlertRule, 'id' \| 'createdAt' \| 'enabled'>) => void` | `AlertBell` | Centered modal. Form: benchmark selector, direction (above/below), threshold number input. |

---

## Primer Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `PrimerHero` | `primer/PrimerHero.tsx` | — | `/primer` page | Full-bleed hero with IntersectionObserver fade-in. No props. |
| `SupplyChainFlow` | `primer/SupplyChainFlow.tsx` | — | `/primer` page | Orchestrates `StageSection` list from `supplyChainStages` data with `PipelineConnector` separators and scroll-spy via `activeStage` state. |
| `StageSection` | `primer/StageSection.tsx` | `stage: SupplyChainStage`, `onInView: (n: number) => void` | `SupplyChainFlow` | One supply chain stage section. Uses IntersectionObserver to fire `onInView`. Renders `DataCallout`, `ProportionalBar`, `AnimatedCounter` sub-components from stage data. |
| `TimelineProgress` | `primer/TimelineProgress.tsx` | `activeStage: number` | `SupplyChainFlow` | Fixed left-side vertical stage nav (`lg:flex`). Dot + connector per stage, active = lit color, past = dimmed. |
| `AnimatedCounter` | `primer/AnimatedCounter.tsx` | `end: number`, `duration?: number`, `prefix?: string`, `suffix?: string`, `decimals?: number`, `color: string`, `label: string`, `source?: string` | `StageSection` | `requestAnimationFrame` counter with IntersectionObserver trigger. Ease-out cubic. |
| `DataCallout` | `primer/DataCallout.tsx` | `value: string`, `label: string`, `source?: string`, `color: string`, `delay?: number` | `StageSection` | Highlighted stat callout box with IntersectionObserver fade-in and optional delay. |
| `ProportionalBar` | `primer/ProportionalBar.tsx` | `value: number`, `label: string`, `color: string`, `suffix?: string` | `StageSection` | Animated horizontal bar (CSS width transition on IntersectionObserver trigger). 0–100 scale. |
| `PipelineConnector` | `primer/PipelineConnector.tsx` | `fromColor: string`, `toColor: string`, `label?: string` | `SupplyChainFlow` | Animated gradient arrow connector between supply chain stage sections. |
| `CrudeOilTypes` | `primer/CrudeOilTypes.tsx` | — | `/primer` page | Comparison cards for crude oil types (Dubai, Brent, WTI) + properties table. Data from `@/data/primer`. IntersectionObserver fade-in. |

---

## Consumer Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `ImpactCalculator` | `consumer/ImpactCalculator.tsx` | `scenarioParams: ScenarioParams` | Dashboard page | Grid of `PersonaCard` + selected `ImpactResult`. Personas: jeepney commuter, car owner, small business, farmer, tricycle driver. |
| `PersonaCard` | `consumer/PersonaCard.tsx` | `persona: ConsumerPersona`, `impact: ImpactResultData`, `selected: boolean`, `onClick: () => void` | `ImpactCalculator` | Selectable card showing persona icon, label, pain index bar, monthly cost delta. |
| `ImpactResult` | `consumer/ImpactResult.tsx` | `persona: ConsumerPersona`, `impact: ImpactResultData` | `ImpactCalculator` | Expanded detail panel: baseline vs scenario monthly spend, income impact %, itemized cost breakdown. |

---

## Timeline Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `TimelineScrubber` | `timeline/TimelineScrubber.tsx` | `visible: boolean` | Dashboard page | Historical price playback. Uses `useHistoricalData`. Shows date range, play/pause, speed selector (1×/2×/4×), progress bar, nearby events, and price snapshot readout. |

---

## Onboarding Components

| Component | File | Key Props | Used By | Notes |
|-----------|------|-----------|---------|-------|
| `HowToGuide` | `onboarding/HowToGuide.tsx` | — | Dashboard page | Modal overlay triggered by `?` button in `Header` (via `CustomEvent('open-how-to-guide')`) or auto-opens for first-time visitors (via `useDismissable`). Renders `GuideStep` per step. |
| `GuideStep` | `onboarding/GuideStep.tsx` | `icon: string`, `title: string`, `description: string`, `stepNumber: number`, `totalSteps: number`, `isActive: boolean`, `onNavigate?: () => void` | `HowToGuide` | Single step card. Returns `null` when not active. Displays step counter, icon, title, description, navigate button. |

---

## UI Primitives

| Component | File | Key Props | Usage Pattern |
|-----------|------|-----------|---------------|
| `Badge` | `ui/Badge.tsx` | `status: 'green' \| 'yellow' \| 'red'`, `label?: string` | Status indicator pill (default labels: NORMAL / WARNING / CRITICAL). Used in `FacilityDetail`. |
| `Disclaimer` | `ui/Disclaimer.tsx` | `showRoadmap?: boolean` | Monte Carlo simulation disclaimer with accordion roadmap. Used in `StressTest`. |
| `EmptyState` | `ui/EmptyState.tsx` | `icon?: ReactNode`, `message: string`, `timestamp?: string`, `minH?: string` | Centered empty/loading placeholder. Used in `EventTimeline`. |
| `FadeIn` | `ui/FadeIn.tsx` | `children: ReactNode`, `delay?: number`, `className?: string` | IntersectionObserver wrapper. State machine: `idle → pending → visible`. SSR-safe; respects `prefers-reduced-motion`. Wrap any scroll-animated section. |
| `FadeSection` | `ui/FadeSection.tsx` | `children: ReactNode`, `className?: string` | Thin wrapper over `useFadeIn` hook with `.fade-in-section` CSS class. Simpler alternative to `FadeIn` for section-level animations. |
| `GaugeBar` | `ui/GaugeBar.tsx` | `value: number`, `label?: string`, `zones?: ThresholdZone[]`, `height?: number`, `showMarkers?: boolean`, `className?: string` | Horizontal bar with red/yellow/green threshold zones. Default zones: 0–33 red, 33–66 yellow, 66–100 green. Used in `VitalSigns`. |
| `ScrollProgress` | `ui/ScrollProgress.tsx` | — | Fixed-top progress bar. Uses `useScrollProgress`. Attach to layout root. |
| `SkeletonBar` / `SkeletonCircle` | `ui/Skeleton.tsx` | `width?`, `height?`, `className?` / `size?`, `className?` | `animate-pulse` placeholders. 8 compound skeletons exported: `PricePanelSkeleton`, `ScenarioPlannerSkeleton`, `MarketShareSkeleton`, `PlayerCardsSkeleton`, `ImpactCalculatorSkeleton`, `StressTestSkeleton`, `TimelineScrubberSkeleton`, `HowToGuideSkeleton`. Wire to `dynamic()` imports. |
| `SourceAttribution` | `ui/SourceAttribution.tsx` | `source?: string`, `updated?: string`, `derived?: string` | Footer source line for data cards. Three modes: plain source, source + recency timestamp, derived label. All data cards must include this. |
| `Ticker` | `ui/Ticker.tsx` | — | Scrolling marquee of live prices + event headlines. Used in `Header` (bottom strip). Consumes `usePrices` + `useEvents`. |
| `Tooltip` | `ui/Tooltip.tsx` | `text: string`, `children: ReactNode` | Hover tooltip rendered via `createPortal` to `document.body` (escapes `overflow:hidden`). Positioned with `getBoundingClientRect` + `position:fixed`. |
| `InfoTip` | `ui/Tooltip.tsx` | `text: string` | Convenience wrapper — renders `<Info>` icon as the trigger child. Exported from same file as `Tooltip`. Used widely in `ExecutiveSnapshot`, `VitalSigns`, `ImpactCards`. |

> **Glass card pattern:** Always use `.glass-card` for surfaces. Add `.card-interactive` for hover-lift on clickable cards. Use `.glass-static` override for full-width containers that should not lift.

---

## Hooks Reference

| Hook | File | Returns | Polling | Notes |
|------|------|---------|---------|-------|
| `useAlerts` | `useAlerts.ts` | `{ rules, history, unreadCount, addRule, removeRule, toggleRule, checkPrices, markAllRead, markRead }` | None (event-driven) | Persists to `localStorage`. Browser `Notification` API with 30-min cooldown per rule. Max 50 history entries. |
| `useAnimatedNumber` | `useAnimatedNumber.ts` | `number` | None | `requestAnimationFrame` ease-out cubic tween. `duration` default 800ms. Updates on `target` change. Used in all KPI cards. |
| `useDismissable` | `useDismissable.ts` | `{ dismissed: boolean, dismiss: () => void, reset: () => void, loaded: boolean }` | None | `localStorage` persistence with `oil-intel-dismissed-{key}` prefix. SSR-safe: `loaded` is `false` until after mount. |
| `useEvents` | `useEvents.ts` | `{ events: TimelineEvent[], isLive: boolean, lastUpdated: Date \| null }` | 3 minutes | Falls back to `@/data/events` static data. Retries up to 3× with exponential backoff. Source: `/api/events` (RSS aggregator). |
| `useFadeIn` | `useFadeIn.ts` | `{ ref: RefObject<T>, isVisible: boolean, hasMounted: boolean }` | None | Generic `IntersectionObserver` hook. Threshold 0.05. SSR-safe: checks viewport on mount before attaching observer. |
| `useHistoricalData` | `useHistoricalData.ts` | `{ prices, events, currentIndex, currentSnapshot, nearbyEvents, playing, speed, togglePlay, setSpeed, setIndex, totalSnapshots, dateRange }` | None (user-driven playback) | Loads from `historical-prices.json` + `historical-events.json`. Play uses `setInterval`. Speed: 1×/2×/4×. Nearby events window: ±30 days. |
| `useKeyboardShortcuts` | `useKeyboardShortcuts.ts` | `void` | None | Registers `keydown` listener. Ignores shortcuts when focused in `INPUT`/`TEXTAREA`/`SELECT`/`contentEditable`. ⌘K always captured; single-key shortcuts require no modifier. |
| `usePrices` | `usePrices.ts` | `{ prices: PriceBenchmark[], isLive: boolean, lastUpdated: Date \| null, priceHistory: Record<string, number[]> }` | 5 minutes | Falls back to `@/data/prices` static data. Accumulates last 7 readings (~35 min) per benchmark for sparklines. Source: `/api/prices` (Yahoo Finance + FloatRates + DOE). |
| `useScenarios` | `useScenarios.ts` | `{ scenarios: SavedScenario[], saveScenario: (name, params) => void, removeScenario: (id) => void }` | None | `localStorage` persistence. Max 5 saved scenarios. Each scenario stores derived `gasoline`/`diesel`/`riskLevel` at save time. |
| `useScrollProgress` | `useScrollProgress.ts` | `number` (0–100) | None | Passive scroll listener. Returns page scroll percentage. Used by `ScrollProgress` component. |
| `useScrollSpy` | `useScrollSpy.ts` | `string` (active section id) | None | `IntersectionObserver` with `rootMargin: -100px 0px -60% 0px`. Accepts `offset` param. Used by `SectionNav` and `MobileBottomNav`. |
| `useSentiment` | `useSentiment.ts` | `{ sentiments: SentimentResult[], overallScore: number, isLoading: boolean, error: string \| null }` | 15 minutes | Source: `/api/sentiment`. `overallScore` is mean of per-headline scores. Sentiment values: `'positive' \| 'negative' \| 'neutral'`. |
