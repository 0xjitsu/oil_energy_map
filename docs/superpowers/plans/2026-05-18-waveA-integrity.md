# Wave A — Data Integrity & Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No fabricated or mislabeled number survives this wave. Sparklines show real weekly DOE/Brent history or say "history building…" — never an invented curve. Acts 1–2 compute from live prices; everything still scenario-driven carries a visible `SIMULATED` chip. The `/cascade` headline reads as a modeled scenario, not current fact. Alerts actually fire. Plus six bounded perf/bug fixes: skeleton/map height match (CLS), quantized map zoom state, the broken CRISIS scan-line fade, slider INP, and a content-hashed + slimmed stations payload with immutable caching.

**Architecture:** Three new pure, TDD'd modules carry the integrity layer — `src/lib/format.ts` (PHP/USD formatting + the canonical current-price selector), `src/data/price-history.ts` + `src/lib/price-history-validate.ts` (the hand-curated real weekly series and its build-time sanity gate), and `src/lib/weekly-series.ts` (benchmark-id → weekly series mapping for sparklines). A tiny `<SimChip />` marks scenario-driven surfaces. A new `AlertsProvider` context turns the existing-but-orphaned `checkPrices` into a live pipeline feeding the existing `AlertBell`. The perf fixes are surgical edits to `page.tsx`, `IntelMap.tsx`, `globals.css`, `ScenarioPlanner.tsx`, and `scripts/build-stations-json.mjs`. Wave A is the substrate Wave B's chart reads — `price-history.ts` ships here, chart consumers ship there.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind (design tokens — never hardcode colors in components), Vitest (+ @testing-library/react for `.test.tsx`).

---

## Context for the engineer

Brownfield Next.js 14 dashboard. Package manager **pnpm**; agent shells need `export PATH="/opt/homebrew/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"`. Path alias `@/*` → `./src/*`. Dev server runs on **port 3007** (`pnpm dev`); production preview is `pnpm build && pnpm start` (port 3000). `pnpm build`, `pnpm test`, `pnpm lint` must all pass before each commit. Commit messages: lowercase imperative. **Do NOT push to any remote.** Work on the **current branch** — do not switch or create branches.

**Design system:** Use design tokens — `text-text-primary/-body/-secondary/-label/-subtle/-muted/-dim`, `text-status-red/green/yellow`, `bg-bg-primary`, `bg-surface-hover`, `border-border-subtle`, `.glass-card` / `.card-interactive`. Mono eyebrows: `font-mono text-[10px] uppercase tracking-widest`. The established "Est." badge pattern (the model for `SimChip`) is at `src/components/layout/ExecutiveSnapshot.tsx:91-93`: `bg-status-yellow/10 text-status-yellow/70 text-[8px] px-1 py-0.5 rounded uppercase tracking-wider`.

**Component tests:** `.test.tsx` render tests work (PR #13). Use `@testing-library/react`'s `render`/`screen`/`fireEvent` and assert via the **async `findBy*` queries** — `render()` commits the DOM a tick later, so synchronous `getBy*` immediately after `render()` can miss it. Working example: `src/components/ui/__tests__/ShareButton.test.tsx`. If a render test ever fails with `Invalid hook call`, the cause is a stale duplicate-React `node_modules` — fix with `rm -rf node_modules && pnpm install --frozen-lockfile` (see project CLAUDE.md).

**Commit hygiene:** `git status` is dirty with pre-existing WIP (untracked `docs/` plans, `lighthouse-*` artifacts, `src/app/robots.ts`, `.claude/`, `.superpowers/`). **Every commit step stages only the files it names** — never `git add .` / `git add -A`. Run `git diff --cached --stat` before each commit to confirm nothing extra is staged.

**Key facts (every one verified against the codebase at plan time — if any has drifted when you read the file, adapt and report the discrepancy):**

- **Test baseline:** `pnpm test` → **8 files, 33 tests, all passing**. `src/components/layout/__tests__/CrisisHero.test.ts` exists and tests `composeDieselLine` — that export must survive any CrisisHero edit.
- **The only fabrication site** is `src/components/prices/PricePanel.tsx:11-19` (`generateSparkData`, a sine/cosine synthetic 7-point trend) used at `:33-36` whenever `history` has < 2 points (which is almost always — see next bullet). **The audit's claim that `ExecutiveSnapshot`, `PumpPrices`, `SentimentGauge` share the fabrication path is WRONG** — they instead *silently hide* the sparkline behind a `length >= 2` gate (`ExecutiveSnapshot.tsx:117`, `PumpPrices.tsx:51`, `SentimentGauge.tsx:123`), which is the CLAUDE.md "silent hide" anti-pattern, fixed in Task 3 with the "history building…" label.
- **`priceHistory`** is a session-only ring buffer of the last **7** five-minute polls (`MAX_HISTORY = 7`, `src/lib/DataProvider.tsx:18`, `accumulatePriceHistory` at `:24-34`). `usePrices()` (`src/hooks/usePrices.ts:9-12`) returns `{ prices, isLive, lastUpdated, priceHistory }` from the DataProvider context. `pricesUpdated` is set **only on poll success** (`DataProvider.tsx:95`).
- **`SparkChart`** (`src/components/prices/SparkChart.tsx:21-24`) already renders a fixed-size empty `<div style={{width,height}} aria-hidden>` when `data.length < 2`. Props: `{ data: number[]; color: string; width?; height?; unit? }`.
- **Hardcoded current prices:** `src/components/scenarios/ResultPanel.tsx:9-10` — `const CURRENT_GASOLINE = 78.5; const CURRENT_DIESEL = 72.3;`. These drive the "vs current" deltas and are **stale-wrong today**: the DOE static fallbacks are gasoline ₱63.20 / diesel ₱59.40 (`src/data/prices.ts:50,58`). `ScenarioPlanner.tsx:30-31` has benign `?? 106` / `?? 58.42` *fallbacks* (left alone). No other `78.5`-style pump constants exist (grep `78\.5` → only ResultPanel).
- **Scenario coupling (A2), verified per component:**
  - `ExecutiveSnapshot` (`src/app/page.tsx:144` passes `scenarioParams`): the four KPI cards are **already live**; only the **Supply Risk badge** is scenario-coupled via `getRiskLevel(params)` (`ExecutiveSnapshot.tsx:26-35`, used at `:234`).
  - `ImpactCards` (`page.tsx:186`): fully scenario-coupled — `calculatePumpPrice(scenarioParams)` at `ImpactCards.tsx:21,67`.
  - `VitalSigns` (`page.tsx:256`): **only scenario-coupled when `mapMode !== 'live'`** (`VitalSigns.tsx:113`); in live mode it shows static `VITAL_SIGNS` with an honest provenance line (`:117`). The audit overstated this one.
  - `StressTest` (`page.tsx:224`) and `ImpactCalculator` (`page.tsx:228`) are scenario-driven **by design** (Act 3) — they get the `SIMULATED` chip, not a rewrite.
  - `CrisisProvider` (`page.tsx:118`) is **also** scenario-coupled (`crisisLevel.ts:59,63` use `scenarioParams.brentPrice`/`hormuzWeeks`) — **deliberately out of Wave A scope** (changing the crisis formula re-tunes the whole adaptive UI; spec A2 does not list it). Report it forward for a later wave.
- **`/cascade` framing:** the headline at `src/app/cascade/CascadePage.tsx:60-65` renders "Filipino families pay `{cascadeHeadline.householdImpact}` more — traced from `{cascadeHeadline.crudePrice}` crude oil." with `householdImpact = '+₱3,200/mo'` and `crudePrice = '$107.8/bbl'` (`src/data/cascade.ts:193-201`, node values at `:29,156`). A pulsing "Live Cascade Tracker" badge sits above it (`CascadePage.tsx:50-59`). `CrisisHero.tsx:5,60` imports `criticalInsight` from cascade data and quotes its headline in the hero paragraph.
- **Alerts:** `checkPrices` is defined at `src/hooks/useAlerts.ts:70-123` — a `useCallback` with signature `(prices: PriceBenchmark[]) => void`; it evaluates enabled rules (30-min cooldown), pushes `AlertNotification`s, persists to localStorage, and fires browser Notifications. **Zero call sites** (grep confirms: only the definition, the return at `:143`, and a type-only import in `AlertDrawer.tsx:3`). `AlertBell` (`src/components/alerts/AlertBell.tsx:10`) instantiates its **own** `useAlerts()` (per-instance state), rendered in `Header.tsx:124`. **Dismissal persistence already exists** — `markRead`/`markAllRead` persist via `persistHistory` (`useAlerts.ts:22-24,125-139`); the audit's `useDismissable` suggestion is unnecessary (that hook is only used by `HowToGuide`).
- **Skeleton/map mismatch:** map skeleton `h-[clamp(350px,55vh,600px)] sm:h-[600px]` (`src/app/page.tsx:13`) vs real map `h-[500px] sm:h-[600px] lg:h-[75vh] lg:max-h-[900px]` (`src/components/map/IntelMap.tsx:244`).
- **Zoom state:** `onMove={(evt) => setCurrentZoom(evt.viewState.zoom)}` at `IntelMap.tsx:253` fires every camera frame. `currentZoom` is consumed ONLY by the `deckLayers` memo (dep at `:233`, passed into `createStationLayer` at `:215`) and inside `StationLayer.tsx:81-126`, where it is compared `>= CLUSTER_MAX_ZOOM` (8) and **floored** for `getClusters` — so floor-quantizing the state is semantics-preserving.
- **Scan-line bug (diagnosed):** `globals.css:61-69` —
  ```css
  body::after {
    /* … */
    background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, var(--scan-line-opacity)) 2px, rgba(255, 255, 255, var(--scan-line-opacity)) 4px);
    transition: opacity 1.5s ease;
  }
  ```
  The transition is declared on `opacity`, but the element's `opacity` **never changes** — the crisis shift changes `--scan-line-opacity` (CrisisProvider sets it on `documentElement`, `CrisisProvider.tsx:58-65`; values `0 / 0 / 0.03` in `crisisLevel.ts:17,23,29`), and that variable lives inside `background-image`, which is not an animatable property. Result: entering CRISIS snaps the scan lines in. Fix in Task 6: move the variable to the `opacity` property with full-alpha gradient lines (visually identical — uniform-color alpha composes multiplicatively).
- **Slider INP:** `ScenarioPlanner.tsx:86-88` `updateParam` calls `onParamsChange({ ...params, [key]: value })` on **every** `onChange` tick → `page.tsx:115` `setScenarioParams` → re-renders the whole page tree including `CrisisProvider` and `MapWrapper`, whose `deckLayers` memo depends on `scenarioParams` (`IntelMap.tsx:225`) and rebuilds all deck.gl layers per tick. **Must-preserve flows in `ScenarioPlanner.tsx`:** the `?s=` URL-restore gate (`urlScenarioRef` at `:38-41`, mount effect `:45-51`, live-sync skip `:55-68`), the timeline-drive effect (`:71-82`), `ScenarioSlots` load (`:127-133`), and the `ShareButton`/`buildScenarioUrl` flow (`:93-97,116-122`) — all Wave 4 features.
- **Stations payload:** `scripts/build-stations-json.mjs` concatenates 7 brand files from `src/data/stations/` into `public/data/stations.json` (gitignored; rebuilt by `predev`/`prebuild`), guarded `>= 10000` and brand-remapped. Current output: **2.9 MB raw / 335,676 B gzip** (measured). Station shape (`src/data/stations/petron.json[0]`): `{ id, brand, name, coordinates: [lat,lng] (6 decimals), address (often ""), fuelTypes, source: { url, scrapedAt }, region }`. `useStations` fetches `'/data/stations.json'` (`src/hooks/useStations.ts:43`). **No component reads `station.source`** (grep confirms); `StationTooltip.tsx:60-63` reads `station.address` behind a truthiness guard. `GasStation` (`src/types/stations.ts`) currently *requires* `address` and `source`. `vercel.json` **exists** (crons only — no `headers` key). `tsconfig.json` has `resolveJsonModule: true` (line 11), so a generated JSON manifest can be statically imported. `src/hooks/__tests__/useStations.test.ts` reads the **raw `src/data/stations/*.json`** files (mirroring the build script) — slimming the *built output* does not touch its inputs.
- **Real-history raw material:** `src/data/historical-prices.json` is a list of **18 sparse anchor points** (2022-01-07 → 2026-03-06), shape `{ date, brent, phpUsd, pumpGasoline, pumpDiesel }` — useful as cross-check anchors, **not** a weekly series. `src/data/prices.ts` carries the current DOE/market fallbacks and already has a module-load sanity guard (`prices.ts:74+`) — the precedent for Task 2's validator.
- **DataProvider mount:** `src/app/layout.tsx:148` — `<DataProvider>{children}</DataProvider>`.
- **Docs that name the stations path** (must be updated in Task 8): `docs/ARCHITECTURE.md:5,64`, `docs/COMPONENTS.md:186`, project `CLAUDE.md` (File Organization + Station Data + Data Fetching sections).
- **First Load JS baseline:** record the homepage figure from your first `pnpm build` (spec says ~129 kB; budget ≤ 135 kB) and keep it in your notes for Task 9's before/after.

**Scope discipline (deliberately NOT in Wave A):** no chart components from `price-history.ts` (Wave B), no crisis-formula change (CrisisProvider stays scenario-coupled — reported, not fixed), no Recharts removal on `/cascade`, no binary stations format, no localStorage persistence of the intraday poll buffer (spec mentions it under A4 as a secondary nicety — cut here: the weekly series is the honest substrate and the buffer adds a localStorage/SSR surface for near-zero user value; flag for Wave B if the chart wants intraday overlay).

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/format.ts` | `formatPHP` / `formatUSD` + canonical `getBenchmarkValue` / `getCurrentPumpPrices` selectors |
| Create | `src/lib/__tests__/format.test.ts` | TDD for formatting + selector fallback behavior |
| Modify | `src/components/scenarios/ResultPanel.tsx` | Kill hardcoded `78.5`/`72.3`; live "vs current" via selector; `formatPHP` (T1) + `SimChip` (T4) |
| Modify | `src/components/scenarios/ScenarioCompare.tsx` | `formatPHP` sweep |
| Create | `src/data/price-history.ts` | `WeeklyPricePoint`, real curated `PRICE_HISTORY` (≥ 26 weeks, target 52) |
| Create | `src/lib/price-history-validate.ts` | Pure validator: count, Monday weeks, monotonic dates, value bands |
| Create | `src/lib/__tests__/price-history.test.ts` | Validator unit tests + `PRICE_HISTORY` integration gate |
| Create | `src/lib/weekly-series.ts` + `src/lib/__tests__/weekly-series.test.ts` | benchmark-id → weekly number series for sparklines |
| Modify | `src/components/prices/SparkChart.tsx` | `emptyLabel` prop — "history building…" in the existing empty box |
| Modify | `src/components/prices/PricePanel.tsx` | **Delete `generateSparkData`**; weekly-first spark data; empty-label fallback |
| Modify | `src/components/prices/PumpPrices.tsx` | Weekly-first spark data; remove silent-hide gate; `formatPHP` |
| Modify | `src/components/layout/ExecutiveSnapshot.tsx` | Weekly-first spark data + label (T3); live Supply-Risk badge, drop `scenarioParams` (T4) |
| Create | `src/components/prices/__tests__/PricePanel.test.tsx` | Render test: no fabricated curve; label shows for series without history |
| Create | `src/components/ui/SimChip.tsx` + `src/components/ui/__tests__/SimChip.test.tsx` | Shared `SIMULATED` chip (Est.-badge pattern) |
| Create | `src/lib/impact-model.ts` + `src/lib/__tests__/impact-model.test.ts` | Pure live-pump-delta impact derivation for ImpactCards |
| Create | `src/components/layout/__tests__/ExecutiveSnapshot.test.ts` | Unit tests for the new pure `getLiveSupplyRisk` |
| Modify | `src/components/prices/ImpactCards.tsx` | Compute from live pump prices; drop `scenarioParams` prop |
| Modify | `src/components/health/VitalSigns.tsx` | `SimChip` when scenario-derived |
| Modify | `src/components/scenarios/StressTest.tsx`, `src/components/consumer/ImpactCalculator.tsx` | `SimChip` on headings |
| Modify | `src/app/cascade/CascadePage.tsx` | Modeled-scenario headline + badge copy |
| Modify | `src/components/layout/CrisisHero.tsx` | Stop quoting cascade's hypothetical headline |
| Modify | `src/app/page.tsx` | Drop `scenarioParams` from ExecutiveSnapshot/ImpactCards (T4); skeleton height match (T6) |
| Create | `src/lib/AlertsProvider.tsx` + `src/lib/__tests__/AlertsProvider.test.tsx` | Single shared alerts store; runs `checkPrices` on each successful poll |
| Modify | `src/app/layout.tsx` | Mount `AlertsProvider` inside `DataProvider` |
| Modify | `src/components/alerts/AlertBell.tsx` | Consume the shared context instead of a private `useAlerts()` |
| Modify | `src/components/map/IntelMap.tsx` | Quantize `setCurrentZoom` to integer zoom |
| Modify | `src/app/globals.css` | Fix the scan-line transition |
| Modify | `src/components/scenarios/ScenarioPlanner.tsx` | Local param state + rAF/`startTransition` propagation (INP) |
| Modify | `scripts/build-stations-json.mjs` | Slim fields, truncate coords, emit content-hashed `public/data/stations/<hash>.json` + manifest |
| Create | `src/data/stations-manifest.json` | Committed, build-regenerated pointer `{ file, count, hash }` |
| Modify | `src/hooks/useStations.ts`, `src/types/stations.ts`, `.gitignore`, `vercel.json` | Hashed fetch path; optional `address`/`source`; ignore hashed dir; immutable cache headers |
| Modify | `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `CLAUDE.md` | Documentation-as-code for the stations pipeline change |

**File-conflict ordering (unavoidable multi-task files):** `ResultPanel.tsx` (T1 then T4), `ExecutiveSnapshot.tsx` (T3 then T4), `page.tsx` (T4 then T6), `ScenarioPlanner.tsx` (T7 only — T1 deliberately avoids it). Tasks MUST run in order 1→9; do not parallelize tasks that share a file.

---

## Task 1: `format.ts` — formatting + the canonical current-price selector (A6)

`formatPHP`/`formatUSD` end the ad-hoc `₱${x.toFixed(2)}` sprawl, and `getCurrentPumpPrices` becomes the single source for "current diesel/gasoline" — killing `ResultPanel`'s stale `78.5`/`72.3` constants, whose "vs current" deltas are wrong by ~₱15/L against today's DOE values.

**Sweep scope (explicit, from grep):** this task converts `ResultPanel.tsx` and `ScenarioCompare.tsx`. Other user-visible price surfaces adopt `formatPHP`/`formatUSD` inside their own tasks to avoid double-editing files: `PumpPrices` + `ExecutiveSnapshot` in Task 3, `CrisisHero.composeDieselLine` in Task 4. NOT swept (deliberate): `SparkChart` path-d coordinates, `priceSources.ts`/API-route `Number(x.toFixed(2))` (numeric rounding, not display), `SavingsOpportunity`'s compact-₱ formatter (its own B/M/K format), `Ticker`/`AnimatedCounter` (percent/counter, not currency), map station/coord labels.

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/__tests__/format.test.ts`
- Modify: `src/components/scenarios/ResultPanel.tsx`
- Modify: `src/components/scenarios/ScenarioCompare.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  formatPHP,
  formatUSD,
  getBenchmarkValue,
  getCurrentPumpPrices,
} from '@/lib/format';
import type { PriceBenchmark } from '@/types';

describe('formatPHP', () => {
  it('formats with the peso sign and two decimals by default', () => {
    expect(formatPHP(63.2)).toBe('₱63.20');
  });
  it('groups thousands', () => {
    expect(formatPHP(1234.5)).toBe('₱1,234.50');
  });
  it('respects a custom decimal count', () => {
    expect(formatPHP(59.456, { decimals: 1 })).toBe('₱59.5');
  });
  it('handles zero and negatives honestly', () => {
    expect(formatPHP(0)).toBe('₱0.00');
    expect(formatPHP(-2.5)).toBe('₱-2.50');
  });
});

describe('formatUSD', () => {
  it('formats with the dollar sign and two decimals by default', () => {
    expect(formatUSD(107.9)).toBe('$107.90');
  });
  it('respects a custom decimal count', () => {
    expect(formatUSD(107.94, { decimals: 1 })).toBe('$107.9');
  });
});

const bench = (id: string, value: number): PriceBenchmark =>
  ({ id, name: id, value, previousWeek: value, unit: '₱/liter', tooltip: '' }) as PriceBenchmark;

describe('getBenchmarkValue', () => {
  it('returns the live value when the benchmark is present', () => {
    expect(getBenchmarkValue([bench('pump-diesel', 61.1)], 'pump-diesel')).toBe(61.1);
  });
  it('falls back to the static fallback benchmark when missing', () => {
    // src/data/prices.ts static fallback: pump-diesel = 59.40
    expect(getBenchmarkValue([], 'pump-diesel')).toBe(59.4);
  });
  it('throws on an unknown id — never invents a number', () => {
    expect(() => getBenchmarkValue([], 'no-such-benchmark')).toThrow();
  });
});

describe('getCurrentPumpPrices', () => {
  it('selects gasoline and diesel in one call', () => {
    const prices = [bench('pump-gasoline', 64.0), bench('pump-diesel', 60.0)];
    expect(getCurrentPumpPrices(prices)).toEqual({ gasoline: 64.0, diesel: 60.0 });
  });
});
```

> The `getBenchmarkValue([], 'pump-diesel') === 59.4` assertion pins the static fallback in `src/data/prices.ts:58`. If the DOE fallback has been legitimately updated since this plan was written, update the assertion to the current file value — do NOT change `prices.ts` to fit the test.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/__tests__/format.test.ts`
Expected: FAIL — cannot resolve `@/lib/format`.

- [ ] **Step 3: Implement `format.ts`**

Create `src/lib/format.ts`:
```ts
import { priceBenchmarks as staticPrices } from '@/data/prices';
import type { PriceBenchmark } from '@/types';

interface FormatOpts {
  /** Fraction digits (min = max). Default 2. */
  decimals?: number;
}

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Pure: `63.2` → `"₱63.20"`. The ONE way to render a peso amount. */
export function formatPHP(value: number, opts: FormatOpts = {}): string {
  return `₱${formatNumber(value, opts.decimals ?? 2)}`;
}

/** Pure: `107.9` → `"$107.90"`. The ONE way to render a dollar amount. */
export function formatUSD(value: number, opts: FormatOpts = {}): string {
  return `$${formatNumber(value, opts.decimals ?? 2)}`;
}

/**
 * Canonical current-value selector. Reads the live benchmark when present,
 * else the static DOE/market fallback from `src/data/prices.ts` (which is
 * itself guarded by a module-load sanity check). Throws on an unknown id —
 * a component must never invent a "current price" constant again.
 */
export function getBenchmarkValue(prices: PriceBenchmark[], id: string): number {
  const live = prices.find((b) => b.id === id);
  if (live) return live.value;
  const fallback = staticPrices.find((b) => b.id === id);
  if (!fallback) throw new Error(`format/getBenchmarkValue: unknown benchmark id "${id}"`);
  return fallback.value;
}

/** Canonical "current pump prices" — the only sanctioned source for ₱/L now-values. */
export function getCurrentPumpPrices(prices: PriceBenchmark[]): {
  gasoline: number;
  diesel: number;
} {
  return {
    gasoline: getBenchmarkValue(prices, 'pump-gasoline'),
    diesel: getBenchmarkValue(prices, 'pump-diesel'),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/__tests__/format.test.ts`
Expected: PASS — `11 passed`.

- [ ] **Step 5: Convert `ResultPanel` to the live selector**

Read `src/components/scenarios/ResultPanel.tsx` first. The current top of the file (verify, then edit):
```ts
import { RiskLevel } from '@/types';

interface ResultPanelProps {
  gasoline: number;
  diesel: number;
  riskLevel: RiskLevel;
}

const CURRENT_GASOLINE = 78.5;
const CURRENT_DIESEL = 72.3;
```
and inside the component:
```ts
export function ResultPanel({ gasoline, diesel, riskLevel }: ResultPanelProps) {
  const badge = RISK_BADGE[riskLevel];
  const gasDiff = gasoline - CURRENT_GASOLINE;
  const dieselDiff = diesel - CURRENT_DIESEL;
```

Replace with (component becomes a hook consumer — it is only ever rendered inside the client `ScenarioPlanner`, so add the directive for clarity):
```ts
'use client';

import { RiskLevel } from '@/types';
import { usePrices } from '@/hooks/usePrices';
import { formatPHP, getCurrentPumpPrices } from '@/lib/format';

interface ResultPanelProps {
  gasoline: number;
  diesel: number;
  riskLevel: RiskLevel;
}
```
```ts
export function ResultPanel({ gasoline, diesel, riskLevel }: ResultPanelProps) {
  const { prices } = usePrices();
  const current = getCurrentPumpPrices(prices);
  const badge = RISK_BADGE[riskLevel];
  const gasDiff = gasoline - current.gasoline;
  const dieselDiff = diesel - current.diesel;
```
Then convert the four display literals in the JSX (quote-verified at `ResultPanel.tsx:59,66,74,81`):
- `₱{gasoline.toFixed(2)}` → `{formatPHP(gasoline)}`
- `{gasDiff >= 0 ? '+' : ''}₱{gasDiff.toFixed(2)} vs current` → `{gasDiff >= 0 ? '+' : ''}{formatPHP(gasDiff)} vs current`
- `₱{diesel.toFixed(2)}` → `{formatPHP(diesel)}`
- `{dieselDiff >= 0 ? '+' : ''}₱{dieselDiff.toFixed(2)} vs current` → `{dieselDiff >= 0 ? '+' : ''}{formatPHP(dieselDiff)} vs current`

> Note: `formatPHP(-2.5)` renders `₱-2.50` (sign after the peso sign) — same convention the old string interpolation produced for the `+` case; negative diffs previously rendered like `₱-2.50` too (`₱{gasDiff.toFixed(2)}` with a negative number), so this is rendering-identical.

- [ ] **Step 6: Convert `ScenarioCompare`'s peso literals**

Read `src/components/scenarios/ScenarioCompare.tsx`. Verified current literals at `:42,53,57`:
```tsx
<p className="text-sm font-mono text-text-primary">₱{s.params.forexRate.toFixed(2)}</p>
…
<p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.gasoline.toFixed(2)}</p>
…
<p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.diesel.toFixed(2)}</p>
```
Add `import { formatPHP } from '@/lib/format';` and replace each `₱{x.toFixed(2)}` with `{formatPHP(x)}`.

- [ ] **Step 7: Verify suite, lint, build — record the First Load JS baseline**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all pass. **Record the `/` route's First Load JS figure** from the build output in your working notes (Task 9 needs the before/after).

- [ ] **Step 8: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/lib/format.ts src/lib/__tests__/format.test.ts src/components/scenarios/ResultPanel.tsx src/components/scenarios/ScenarioCompare.tsx
git diff --cached --stat   # expect: only the four files above
git commit -m "add formatPHP/formatUSD and canonical current-price selector"
```

---

## Task 2: `price-history.ts` — the real weekly series + validator (A4)

A hand-curated, committed weekly series of real DOE Metro Manila common SRPs and Brent closes — the substrate every honest sparkline (Task 3) and the Wave B chart will read. A pure validator hard-fails the test suite if the data ever goes missing, sparse, or implausible (the CLAUDE.md producer-side rule; precedent: the module-load guard already in `src/data/prices.ts`).

### DATA HONESTY RULE (non-negotiable)

Populate `PRICE_HISTORY` **only from real, verifiable sources**:

1. **Anchors from the repo:** `src/data/historical-prices.json` (18 real anchor points, 2022-01 → 2026-03, shape `{date, brent, phpUsd, pumpGasoline, pumpDiesel}`) and `src/data/prices.ts` current fallbacks (gasoline 63.20 / diesel 59.40 / brent 107.90 — note the brent fallback reflects a recent spike; cross-check it). Your curated weekly values for overlapping dates must be consistent with these anchors — if they conflict, trust the primary source and flag the discrepancy in your report.
2. **DOE Oil Monitor weekly price advisories** — https://doe.gov.ph/oil-monitor (weekly ₱/L adjustments + prevailing Metro Manila common/SRP ranges; advisories are typically effective Tuesdays). Use WebSearch/WebFetch to walk the weekly advisories backwards from the current week.
3. **Weekly Brent closes** — e.g. EIA's weekly Europe Brent spot series (https://www.eia.gov/dnav/pet/hist/RBRTED.htm) or another primary/near-primary source.

Rules: **NO invented, interpolated-beyond-one-gap, or "looks plausible" numbers.** Each contiguous batch of entries gets a `// source: <URL> (retrieved YYYY-MM-DD)` comment. Target **52 weeks**; the hard gate is **26**. If research can only verify N < 52 weeks, ship the real N (≥ 26), set `MIN_WEEKS` to that N, and report the real count. If you cannot verify even 26 weeks, STOP and report — do not pad.

**Week convention (the validator enforces it):** `week` is the **Monday (ISO date)** of the week the values belong to; pump values are the DOE advisory effective that week, `brent` is the closing value for that week. Entries strictly ascending; gaps of one-to-two skipped weeks are tolerated (DOE occasionally skips holiday weeks).

**Files:**
- Create: `src/data/price-history.ts`
- Create: `src/lib/price-history-validate.ts`
- Create: `src/lib/__tests__/price-history.test.ts`

- [ ] **Step 1: Write the failing validator tests**

Create `src/lib/__tests__/price-history.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validatePriceHistory } from '@/lib/price-history-validate';
import { PRICE_HISTORY, MIN_WEEKS, type WeeklyPricePoint } from '@/data/price-history';

const good = (week: string, over: Partial<WeeklyPricePoint> = {}): WeeklyPricePoint => ({
  week,
  brent: 70,
  pumpDiesel: 58,
  pumpGasoline: 64,
  ...over,
});

describe('validatePriceHistory (unit)', () => {
  // minWeeks=2 keeps fixtures small while testing every other rule.
  it('accepts a clean Monday-weekly series', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-01-12')], 2)).toEqual([]);
  });
  it('rejects too few entries', () => {
    expect(validatePriceHistory([good('2026-01-05')], 2)).not.toEqual([]);
  });
  it('rejects non-Monday weeks', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-01-13')], 2)).not.toEqual([]);
  });
  it('rejects non-increasing dates', () => {
    expect(validatePriceHistory([good('2026-01-12'), good('2026-01-05')], 2)).not.toEqual([]);
  });
  it('rejects gaps longer than two skipped weeks', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-02-09')], 2)).not.toEqual([]);
  });
  it('rejects out-of-band values', () => {
    expect(validatePriceHistory([good('2026-01-05', { pumpDiesel: 120 }), good('2026-01-12')], 2)).not.toEqual([]);
    expect(validatePriceHistory([good('2026-01-05', { pumpGasoline: 30 }), good('2026-01-12')], 2)).not.toEqual([]);
    expect(validatePriceHistory([good('2026-01-05', { brent: 250 }), good('2026-01-12')], 2)).not.toEqual([]);
  });
  it('rejects non-finite values', () => {
    expect(validatePriceHistory([good('2026-01-05', { brent: NaN }), good('2026-01-12')], 2)).not.toEqual([]);
  });
  it('rejects an empty event string (omit the field instead)', () => {
    expect(validatePriceHistory([good('2026-01-05', { event: '' }), good('2026-01-12')], 2)).not.toEqual([]);
  });
});

describe('PRICE_HISTORY (integration gate — the producer-side sanity check)', () => {
  it('is non-empty, ordered, in-band real data', () => {
    expect(validatePriceHistory(PRICE_HISTORY, MIN_WEEKS)).toEqual([]);
  });
  it(`carries at least ${26} weeks`, () => {
    expect(MIN_WEEKS).toBeGreaterThanOrEqual(26);
    expect(PRICE_HISTORY.length).toBeGreaterThanOrEqual(MIN_WEEKS);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/lib/__tests__/price-history.test.ts`
Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement the validator**

Create `src/lib/price-history-validate.ts`:
```ts
import type { WeeklyPricePoint } from '@/data/price-history';

/** Plausibility bands — a value outside these is a data error, not news. */
const BANDS = {
  pumpDiesel: { min: 40, max: 90 },   // ₱/L
  pumpGasoline: { min: 45, max: 95 }, // ₱/L
  brent: { min: 40, max: 140 },       // $/bbl
} as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Allow up to two consecutive skipped DOE weeks (holiday gaps). */
const MAX_GAP_MS = 3 * WEEK_MS;

/**
 * Pure producer-side sanity validator for the curated weekly price history.
 * Returns a list of human-readable violations — empty means valid. The test
 * suite asserts `[]`, so corrupt or thinned-out data fails the build.
 */
export function validatePriceHistory(
  points: readonly WeeklyPricePoint[],
  minWeeks: number,
): string[] {
  const violations: string[] = [];

  if (points.length < minWeeks) {
    violations.push(`expected >= ${minWeeks} weeks, got ${points.length}`);
  }

  let prevTime = -Infinity;
  points.forEach((p, i) => {
    const at = `entry ${i} (${p.week})`;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.week)) {
      violations.push(`${at}: week is not an ISO date`);
      return;
    }
    const time = Date.parse(`${p.week}T00:00:00Z`);
    if (!Number.isFinite(time)) {
      violations.push(`${at}: unparseable date`);
      return;
    }
    if (new Date(time).getUTCDay() !== 1) {
      violations.push(`${at}: week must be a Monday (ISO week start)`);
    }
    if (time <= prevTime) {
      violations.push(`${at}: weeks must be strictly increasing`);
    } else if (prevTime !== -Infinity && time - prevTime > MAX_GAP_MS) {
      violations.push(`${at}: gap from previous entry exceeds ${MAX_GAP_MS / WEEK_MS} weeks`);
    }
    prevTime = time;

    for (const key of ['brent', 'pumpDiesel', 'pumpGasoline'] as const) {
      const v = p[key];
      const band = BANDS[key];
      if (!Number.isFinite(v)) {
        violations.push(`${at}: ${key} is not finite`);
      } else if (v < band.min || v > band.max) {
        violations.push(`${at}: ${key}=${v} outside band ${band.min}-${band.max}`);
      }
    }

    if (p.event !== undefined && p.event.trim() === '') {
      violations.push(`${at}: event must be omitted, not empty`);
    }
  });

  return violations;
}
```

- [ ] **Step 4: Research and curate the data, then implement `price-history.ts`**

Do the web research per the DATA HONESTY RULE above (work backwards from the current week, 2026-06). Then create `src/data/price-history.ts` with this exact shape (values below are **format illustration only — replace every row with researched real data**):
```ts
/**
 * Real weekly price history — hand-curated, NOT generated.
 *
 * Convention: `week` is the Monday (ISO) of the week; `pumpDiesel` /
 * `pumpGasoline` are DOE Oil Monitor Metro Manila common SRPs (₱/L) effective
 * that week; `brent` is that week's closing Brent spot ($/bbl).
 * `event` flags a major disruption for chart annotations (Wave B).
 *
 * Validated by src/lib/price-history-validate.ts via
 * src/lib/__tests__/price-history.test.ts — the suite fails if this file
 * thins out, reorders, or drifts out of plausible bands.
 */
export interface WeeklyPricePoint {
  /** Monday of the ISO week, YYYY-MM-DD. */
  week: string;
  /** Weekly Brent close, $/bbl. */
  brent: number;
  /** DOE Metro Manila common diesel SRP, ₱/L. */
  pumpDiesel: number;
  /** DOE Metro Manila common gasoline (RON 95) SRP, ₱/L. */
  pumpGasoline: number;
  /** Optional disruption flag for chart annotation. */
  event?: string;
}

/** The validator's floor — set to the number of weeks actually verified (>= 26, target 52). */
export const MIN_WEEKS = 26; // ← adjust to the real verified count

export const PRICE_HISTORY: WeeklyPricePoint[] = [
  // source: https://doe.gov.ph/oil-monitor — advisories Jun–Aug 2025 (retrieved 2026-06-xx)
  // source: https://www.eia.gov/dnav/pet/hist/RBRTED.htm — weekly Brent (retrieved 2026-06-xx)
  { week: '2025-06-02', brent: 0, pumpDiesel: 0, pumpGasoline: 0 }, // ← REPLACE with real values
  // … one entry per verified week, chronological …
];
```
Cross-check at least three rows against the `historical-prices.json` anchors / `prices.ts` fallbacks where dates overlap. Record your verified week count and source URLs in your task report.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test src/lib/__tests__/price-history.test.ts`
Expected: PASS — `10 passed` (8 unit + 2 integration). If the integration gate fails, fix the **data** (or the honest `MIN_WEEKS`), never the validator bands.

- [ ] **Step 6: Verify suite, lint, build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all green (the data file is not imported by app code yet — no behavior change).

- [ ] **Step 7: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/data/price-history.ts src/lib/price-history-validate.ts src/lib/__tests__/price-history.test.ts
git diff --cached --stat   # expect: only the three files above
git commit -m "add curated real weekly price history with sanity validator"
```

---

## Task 3: Honest sparklines (A1)

Delete the synthetic-trend generator; wire sparklines to the real weekly series where the metric maps (`brent-crude`, `pump-diesel`, `pump-gasoline`); everywhere else, show the truth: the existing empty box plus a quiet "history building…" label instead of a silent hide. The intraday poll buffer remains the secondary fallback for metrics without a weekly series (it is already real data — just short).

**Reality check vs the audit:** only `PricePanel` fabricates (`generateSparkData`, `PricePanel.tsx:11-19`). `ExecutiveSnapshot:117`, `PumpPrices:51`, `SentimentGauge:123` silently hide instead. This task fixes PricePanel (fabrication), PumpPrices and ExecutiveSnapshot (silent hide → label, weekly wiring). `SentimentGauge` is left alone: its series is real sentiment history (not a price), has no weekly equivalent, and its hide also collapses the trend-arrow row — converting it is cosmetic, not integrity. Noted for Wave B.

**Files:**
- Modify: `src/components/prices/SparkChart.tsx`
- Create: `src/lib/weekly-series.ts`, `src/lib/__tests__/weekly-series.test.ts`
- Modify: `src/components/prices/PricePanel.tsx`
- Modify: `src/components/prices/PumpPrices.tsx`
- Modify: `src/components/layout/ExecutiveSnapshot.tsx`
- Create: `src/components/prices/__tests__/PricePanel.test.tsx`

- [ ] **Step 1: Write the failing `weekly-series` test**

Create `src/lib/__tests__/weekly-series.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { weeklySeriesFor } from '@/lib/weekly-series';
import { PRICE_HISTORY, MIN_WEEKS } from '@/data/price-history';

describe('weeklySeriesFor', () => {
  it.each(['brent-crude', 'pump-diesel', 'pump-gasoline'] as const)(
    'maps %s to a full-length weekly series',
    (id) => {
      const series = weeklySeriesFor(id);
      expect(series).not.toBeNull();
      expect(series!.length).toBe(PRICE_HISTORY.length);
      expect(series!.length).toBeGreaterThanOrEqual(MIN_WEEKS);
      expect(series!.every(Number.isFinite)).toBe(true);
    },
  );

  it('returns null for benchmarks without a weekly series', () => {
    expect(weeklySeriesFor('php-usd')).toBeNull();
    expect(weeklySeriesFor('dubai-crude')).toBeNull();
    expect(weeklySeriesFor('anything-else')).toBeNull();
  });

  it('preserves chronological order (last point is the latest week)', () => {
    const series = weeklySeriesFor('pump-diesel')!;
    expect(series[series.length - 1]).toBe(PRICE_HISTORY[PRICE_HISTORY.length - 1].pumpDiesel);
  });
});
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `pnpm test src/lib/__tests__/weekly-series.test.ts` → FAIL (module missing).

Create `src/lib/weekly-series.ts`:
```ts
import { PRICE_HISTORY } from '@/data/price-history';

/**
 * Pure: map a price-benchmark id to its real weekly series (chronological),
 * or null when no curated weekly history exists for that metric. Consumers
 * must render an honest "history building…" state for null — never a
 * synthetic curve (Wave A integrity rule).
 */
export function weeklySeriesFor(benchmarkId: string): number[] | null {
  switch (benchmarkId) {
    case 'brent-crude':
      return PRICE_HISTORY.map((p) => p.brent);
    case 'pump-diesel':
      return PRICE_HISTORY.map((p) => p.pumpDiesel);
    case 'pump-gasoline':
      return PRICE_HISTORY.map((p) => p.pumpGasoline);
    default:
      return null;
  }
}
```
Run the test again → PASS (`5 passed`).

- [ ] **Step 3: Add the `emptyLabel` prop to `SparkChart`**

Read `src/components/prices/SparkChart.tsx`. Current empty branch (verify at `:21-24`):
```tsx
  if (data.length < 2) {
    // Not enough points for a trend — render an empty, fixed-size box (no CLS).
    return <div style={{ width, height }} aria-hidden="true" />;
  }
```
Replace with:
```tsx
  if (data.length < 2) {
    // Not enough points for a trend. Same fixed-size box (no CLS) — but never
    // a silent hide: when the caller passes emptyLabel, say so out loud.
    // Missing ≠ zero ≠ fabricated (CLAUDE.md aggregate-honesty rule).
    if (emptyLabel) {
      return (
        <div
          style={{ width, height }}
          className="flex items-center justify-end font-mono text-[10px] text-text-dim whitespace-nowrap"
        >
          {emptyLabel}
        </div>
      );
    }
    return <div style={{ width, height }} aria-hidden="true" />;
  }
```
And extend the props (current interface at the top of the file):
```tsx
interface SparkChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  unit?: string;
  /** Rendered inside the fixed-size box when data has < 2 points. */
  emptyLabel?: string;
}

export function SparkChart({ data, color, width = 80, height = 24, unit, emptyLabel }: SparkChartProps) {
```
(Keep everything else — gradient, paths, dot — byte-identical.)

- [ ] **Step 4: Fix `PricePanel` — delete the fabrication**

Read `src/components/prices/PricePanel.tsx`. Delete this entire block (verified at `:11-19`):
```tsx
function generateSparkData(value: number): number[] {
  const points: number[] = [];
  const variance = value * 0.03;
  for (let i = 0; i < 7; i++) {
    const offset = (Math.sin(i * 1.2) + Math.cos(i * 0.7)) * variance * 0.5;
    points.push(value - variance + offset + variance * (i / 6));
  }
  return points;
}
```
Replace the `sparkData` memo (verified at `:33-36`):
```tsx
  const sparkData = useMemo(
    () => (history && history.length >= 2 ? history : generateSparkData(benchmark.value)),
    [history, benchmark.value],
  );
```
with the weekly-first, honest-fallback chain:
```tsx
  // Real data only: curated weekly series where the metric maps; else the
  // intraday poll buffer (real, just short); else SparkChart's labeled empty box.
  const sparkData = useMemo(() => {
    const weekly = weeklySeriesFor(benchmark.id);
    if (weekly) return weekly;
    return history && history.length >= 2 ? history : [];
  }, [history, benchmark.id]);
```
Add the import: `import { weeklySeriesFor } from '@/lib/weekly-series';`
And pass the label at the `SparkChart` call site (verified at `:92`):
```tsx
        <SparkChart data={sparkData} color={sparkColor} width={100} height={28} emptyLabel="history building…" />
```

- [ ] **Step 5: Fix `PumpPrices` — weekly wiring + remove the silent hide**

Read `src/components/prices/PumpPrices.tsx`. Replace the gated render (verified at `:51-53`):
```tsx
        {sparkData.length >= 2 && (
          <SparkChart data={sparkData} color={sparkColor} width={100} height={28} />
        )}
```
with an ungated, labeled one:
```tsx
        <SparkChart data={sparkData} color={sparkColor} width={100} height={28} emptyLabel="history building…" />
```
Replace the data source at the call site (verified at `:90`):
```tsx
              sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
```
with:
```tsx
              sparkData={weeklySeriesFor(benchmark.id) ?? priceHistory[benchmark.id] ?? []}
```
(both pump ids map to weekly series, so this is the real 26–52-week trend). Add the import. Also adopt Task 1's formatter for the two peso literals (verified at `:47` and `:56`): `₱{animatedValue.toFixed(2)}` → `{formatPHP(animatedValue)}` and `₱{Math.abs(change).toFixed(2)} vs prev week` → `{formatPHP(Math.abs(change))} vs prev week`, importing `formatPHP` from `@/lib/format`.

- [ ] **Step 6: Fix `ExecutiveSnapshot` — weekly wiring + label + formatter**

Read `src/components/layout/ExecutiveSnapshot.tsx`. Replace the gated sparkline (verified at `:117-121`):
```tsx
        {sparkData.length >= 2 && (
          <div className="shrink-0">
            <SparkChart data={sparkData} color={sparkColor} width={120} height={32} />
          </div>
        )}
```
with:
```tsx
        <div className="shrink-0">
          <SparkChart data={sparkData} color={sparkColor} width={120} height={32} emptyLabel="history building…" />
        </div>
```
Replace the data source at the `HeroKPI` call site (verified at `:271`):
```tsx
            sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
```
with:
```tsx
            sparkData={weeklySeriesFor(benchmark.id) ?? priceHistory[benchmark.id] ?? []}
```
(brent + both pumps get real weekly trends; `php-usd` falls to the intraday buffer or the label). Add the import. Also convert `formatValue` (verified at `:37-41`) to delegate to Task 1's util:
```tsx
import { formatPHP, formatUSD } from '@/lib/format';

function formatValue(value: number, unit: string): string {
  if (unit === '$/bbl') return formatUSD(value, { decimals: 1 });
  return formatPHP(value);
}
```

- [ ] **Step 7: Write the PricePanel render test**

Create `src/components/prices/__tests__/PricePanel.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricePanel } from '@/components/prices/PricePanel';

// PricePanel reads usePrices() — outside a DataProvider it gets the context
// DEFAULT_VALUE: static benchmarks, priceHistory = {} (src/lib/DataProvider.tsx:61-69).
// With an empty intraday buffer, benchmarks WITHOUT a curated weekly series
// (php-usd, dubai-crude, MOPS, refining margin) must show the honest
// "history building…" label — and never a fabricated curve.

describe('PricePanel', () => {
  it('labels missing history instead of fabricating a trend', async () => {
    render(<PricePanel />);
    const labels = await screen.findAllByText(/history building/i);
    // 8 benchmarks; brent-crude, pump-gasoline, pump-diesel have weekly series → 5 labeled.
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a real sparkline for benchmarks with weekly history', async () => {
    render(<PricePanel />);
    const sparks = await screen.findAllByRole('img', { name: /trend sparkline/i });
    expect(sparks.length).toBeGreaterThanOrEqual(3); // brent + 2 pumps
  });
});
```

Run: `pnpm test src/components/prices/__tests__/PricePanel.test.tsx`
Expected: PASS — `2 passed`. (If the exact label count differs from the comment, fix the comment, not the assertion — the assertions are deliberately threshold-based.)

- [ ] **Step 8: Verify suite, lint, build, and visually**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all green. Then `pnpm dev` (port 3007) and confirm on `/`: the four Executive Snapshot KPIs show real multi-week sparklines for Brent/Gasoline/Diesel, PHP/USD shows "history building…" (until ~10 min of polls accumulate), Price Intelligence derived benchmarks show the label, and no card layout shifts. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/components/prices/SparkChart.tsx src/lib/weekly-series.ts src/lib/__tests__/weekly-series.test.ts src/components/prices/PricePanel.tsx src/components/prices/PumpPrices.tsx src/components/layout/ExecutiveSnapshot.tsx src/components/prices/__tests__/PricePanel.test.tsx
git diff --cached --stat   # expect: only the seven files above
git commit -m "replace fabricated sparklines with real weekly history and honest empty states"
```

---

## Task 4: Live-vs-simulated separation (A2)

> **Amendment (2026-06-10, post-review):** Shipped code deviates from the listings below in two reviewed, test-locked ways (commit `5cd8a3d`): `getLiveSupplyRisk` counts only Brent *upside* as supply risk (`Math.max(0, …)`, not `Math.abs`), and `deriveImpactsFromPump` throws on unhandled impact labels instead of passing items through (fail-loud per CLAUDE.md). Tasks 1–6 are complete (commits `2e0a759`…`b507841`); `persistRules`/`persistHistory` in `useAlerts.ts` additionally gained storage-blocked try/catch guards in the Task 5 fast-follow.

Acts 1–2 surfaces compute from live prices; surfaces that legitimately remain scenario-driven get a visible `SIMULATED` chip; `/cascade` and the hero stop presenting a hypothetical $107.8/bbl world as current fact.

**Files:**
- Create: `src/components/ui/SimChip.tsx`, `src/components/ui/__tests__/SimChip.test.tsx`
- Create: `src/lib/impact-model.ts`, `src/lib/__tests__/impact-model.test.ts`
- Create: `src/components/layout/__tests__/ExecutiveSnapshot.test.ts`
- Modify: `src/components/layout/ExecutiveSnapshot.tsx`, `src/components/prices/ImpactCards.tsx`, `src/app/page.tsx`, `src/components/health/VitalSigns.tsx`, `src/components/scenarios/ResultPanel.tsx`, `src/components/scenarios/StressTest.tsx`, `src/components/consumer/ImpactCalculator.tsx`, `src/components/layout/CrisisHero.tsx`, `src/app/cascade/CascadePage.tsx`

- [ ] **Step 1: `SimChip` — test, then component**

Create `src/components/ui/__tests__/SimChip.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimChip } from '@/components/ui/SimChip';

describe('SimChip', () => {
  it('renders the default SIMULATED label', async () => {
    render(<SimChip />);
    expect(await screen.findByText(/simulated/i)).toBeTruthy();
  });
  it('renders a custom label', async () => {
    render(<SimChip label="Modeled scenario" />);
    expect(await screen.findByText(/modeled scenario/i)).toBeTruthy();
  });
});
```
Run: `pnpm test src/components/ui/__tests__/SimChip.test.tsx` → FAIL. Then create `src/components/ui/SimChip.tsx`:
```tsx
/**
 * Marks a number as scenario-derived, not live. Pattern follows the
 * established "Est." badge (ExecutiveSnapshot) — status-yellow, mono, tiny.
 */
export function SimChip({ label = 'Simulated' }: { label?: string }) {
  return (
    <span
      className="bg-status-yellow/10 text-status-yellow/70 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap"
      title="Derived from the scenario model, not live market data"
    >
      {label}
    </span>
  );
}
```
Run again → PASS (`2 passed`).

- [ ] **Step 2: ExecutiveSnapshot — live Supply-Risk badge, drop `scenarioParams`**

Read `src/components/layout/ExecutiveSnapshot.tsx` (post-Task-3 state). Replace the scenario-coupled risk function (verified pre-edit at `:26-35`):
```tsx
function getRiskLevel(params: ScenarioParams): { label: string; tone: RiskTone } {
  const score =
    params.hormuzWeeks / 16 +
    (params.refineryOffline ? 0.3 : 0) +
    (params.brentPrice - 106) / 150;
  if (score > 0.6) return { label: 'CRITICAL', tone: 'danger' };
  if (score > 0.3) return { label: 'HIGH', tone: 'warning' };
  if (score > 0.1) return { label: 'MODERATE', tone: 'caution' };
  return { label: 'LOW', tone: 'ok' };
}
```
with a live-signal version (exported for testing — the `composeDieselLine` precedent):
```tsx
/**
 * Pure: supply-risk from LIVE signals only — Brent week-over-week move and
 * live event severities. Replaces the old scenario-coupled formula so Act 1
 * never presents a hypothetical as current risk (Wave A integrity rule).
 */
export function getLiveSupplyRisk(
  brentValue: number,
  brentPreviousWeek: number,
  redEvents: number,
  yellowEvents: number,
): { label: string; tone: RiskTone } {
  const brentDeltaPct =
    brentPreviousWeek > 0
      ? Math.abs((brentValue - brentPreviousWeek) / brentPreviousWeek) * 100
      : 0;
  const score =
    Math.min(1, brentDeltaPct / 20) * 0.4 +
    Math.min(1, redEvents / 3) * 0.4 +
    Math.min(1, yellowEvents / 5) * 0.2;
  if (score > 0.6) return { label: 'CRITICAL', tone: 'danger' };
  if (score > 0.3) return { label: 'HIGH', tone: 'warning' };
  if (score > 0.1) return { label: 'MODERATE', tone: 'caution' };
  return { label: 'LOW', tone: 'ok' };
}
```
Then: delete the `ExecutiveSnapshotProps` interface and the `scenarioParams` parameter (`export function ExecutiveSnapshot()`), remove the now-unused `import type { ScenarioParams } from '@/types';`, and replace the call (verified at `:234`) `const risk = getRiskLevel(scenarioParams);` with:
```tsx
  const yellowCount = events.filter((e) => e.severity === 'yellow').length;
  const risk = getLiveSupplyRisk(brent.value, brent.previousWeek, criticalCount, yellowCount);
```
(`criticalCount` — the red count — already exists at `:235`; declare `yellowCount` beside it, before the JSX.) Update the badge subtitle (verified at `:288`) from `subtitle="Hormuz + Refinery"` to `subtitle="Brent Δ + live events"` — the old subtitle described the scenario inputs.

Create `src/components/layout/__tests__/ExecutiveSnapshot.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getLiveSupplyRisk } from '@/components/layout/ExecutiveSnapshot';

describe('getLiveSupplyRisk', () => {
  it('is LOW when brent is flat and no events', () => {
    expect(getLiveSupplyRisk(80, 80, 0, 0).label).toBe('LOW');
  });
  it('escalates with red events', () => {
    expect(getLiveSupplyRisk(80, 80, 3, 0).label).toBe('HIGH');
  });
  it('is CRITICAL on a big brent move plus red events', () => {
    expect(getLiveSupplyRisk(100, 80, 3, 5).label).toBe('CRITICAL');
  });
  it('never divides by zero', () => {
    expect(getLiveSupplyRisk(80, 0, 0, 0).label).toBe('LOW');
  });
});
```
> Heads-up: `ExecutiveSnapshot.tsx` has `'use client'`; importing a pure export into a `.ts` vitest file works (same pattern as `CrisisHero.test.ts`).

- [ ] **Step 3: ImpactCards — live pump deltas via a tested pure model**

Create `src/lib/__tests__/impact-model.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { deriveImpactsFromPump, pumpDeltaRisk } from '@/lib/impact-model';
import { IMPACT_ITEMS } from '@/lib/constants';

describe('pumpDeltaRisk', () => {
  it('is green when both pumps are at/below baseline', () => {
    expect(pumpDeltaRisk(0, 0)).toBe('green');
  });
  it('is yellow on a moderate delta', () => {
    expect(pumpDeltaRisk(6, 2)).toBe('yellow');
  });
  it('is red on a severe delta', () => {
    expect(pumpDeltaRisk(2, 16)).toBe('red');
  });
});

describe('deriveImpactsFromPump', () => {
  it('says "No change" at baseline prices', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 65, 59);
    const jeepney = impacts.find((i) => i.label === 'Jeepney Fare')!;
    expect(jeepney.change).toMatch(/no change/i);
  });
  it('derives positive impacts above baseline', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 85, 79);
    const jeepney = impacts.find((i) => i.label === 'Jeepney Fare')!;
    expect(jeepney.change).toMatch(/\+₱\d/);
  });
  it('never goes negative below baseline', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 50, 45);
    for (const i of impacts) expect(i.change).not.toMatch(/-₱/);
  });
});
```
Run → FAIL. Create `src/lib/impact-model.ts` by **moving** `deriveImpacts`'s body out of `ImpactCards.tsx` (read `ImpactCards.tsx:10-59` and port the existing case arithmetic verbatim — do not re-derive the coefficients):
```ts
import type { ImpactItem, RiskLevel } from '@/types';

// Baselines mirror the scenario-engine's calm base case (Brent $80, PHP 56,
// no disruption) — moved verbatim from ImpactCards.tsx.
export const BASELINE_GASOLINE = 65;
export const BASELINE_DIESEL = 59;

/** Pure: traffic-light for live pump deltas over the calm baseline (₱/L). */
export function pumpDeltaRisk(gasDelta: number, dieselDelta: number): RiskLevel {
  const worst = Math.max(gasDelta, dieselDelta);
  if (worst >= 15) return 'red';
  if (worst >= 5) return 'yellow';
  return 'green';
}

/**
 * Pure: everyday cost impacts from LIVE pump prices (₱/L), not a scenario.
 * Same per-item arithmetic the scenario version used — only the input source
 * changes (live DOE values instead of calculatePumpPrice(scenarioParams)).
 */
export function deriveImpactsFromPump(
  base: ImpactItem[],
  gasoline: number,
  diesel: number,
): ImpactItem[] {
  const gasDelta = Math.max(0, gasoline - BASELINE_GASOLINE);
  const dieselDelta = Math.max(0, diesel - BASELINE_DIESEL);

  return base.map((item) => {
    switch (item.label) {
      case 'Jeepney Fare': {
        const extra = Math.round(dieselDelta * 0.35);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1} per ride`;
        return { ...item, change };
      }
      case 'Grab Ride': {
        const extra = Math.round(gasDelta * 2.2);
        const change = extra <= 0 ? 'No surcharge' : `+₱${extra}–${extra + 4} surcharge`;
        return { ...item, change };
      }
      case 'Rice Delivery': {
        const extra = Math.round(dieselDelta * 0.25);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1}/kg`;
        return { ...item, change };
      }
      case 'LPG Cooking': {
        const extra = Math.round((gasDelta + dieselDelta) * 18);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 100}/month`;
        return { ...item, change };
      }
      default:
        return item;
    }
  });
}
```
Run → PASS (`6 passed`).

Then rewrite `src/components/prices/ImpactCards.tsx` to consume it (delete the old `deriveImpacts`, `BASELINE_*`, `calculatePumpPrice` import, `ScenarioParams` import, and the props interface):
```tsx
'use client';

import { useMemo } from 'react';
import { IMPACT_ITEMS } from '@/lib/constants';
import { usePrices } from '@/hooks/usePrices';
import { getCurrentPumpPrices } from '@/lib/format';
import { deriveImpactsFromPump, pumpDeltaRisk, BASELINE_GASOLINE, BASELINE_DIESEL } from '@/lib/impact-model';
import { InfoTip } from '@/components/ui/Tooltip';
import type { RiskLevel } from '@/types';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

function riskClasses(riskLevel: RiskLevel): { border: string; change: string } {
  if (riskLevel === 'green') return { border: 'border-l-status-green/40', change: 'text-status-green' };
  if (riskLevel === 'red') {
    return { border: 'border-l-status-red/40', change: 'text-status-red' };
  }
  return { border: 'border-l-status-yellow/40', change: 'text-status-yellow' };
}

export function ImpactCards() {
  const { prices } = usePrices();

  const { impacts, border, change } = useMemo(() => {
    const { gasoline, diesel } = getCurrentPumpPrices(prices);
    const risk = pumpDeltaRisk(gasoline - BASELINE_GASOLINE, diesel - BASELINE_DIESEL);
    const classes = riskClasses(risk);
    return {
      impacts: deriveImpactsFromPump(IMPACT_ITEMS, gasoline, diesel),
      border: classes.border,
      change: classes.change,
    };
  }, [prices]);
```
Keep the existing JSX grid verbatim, but update the footer (verified at `:97`) from
`<SourceAttribution derived="Modeled from scenario pump prices (scenario-engine)" />` to
`<SourceAttribution derived="Derived from live DOE pump prices vs calm baseline" />`.

- [ ] **Step 4: `page.tsx` — drop the two props**

Read `src/app/page.tsx`. Two one-line edits (verify before editing):
- `:144` `<ExecutiveSnapshot scenarioParams={scenarioParams} />` → `<ExecutiveSnapshot />`
- `:186` `<ImpactCards scenarioParams={scenarioParams} />` → `<ImpactCards />`

Do NOT touch anything else here — `MapWrapper`, `ScenarioPlanner`, `StressTest`, `ImpactCalculator`, `VitalSigns`, and `CrisisProvider` keep `scenarioParams` (the first five by design; CrisisProvider per the scope note in Context).

- [ ] **Step 5: SimChips on the legitimately simulated surfaces**

All four edits import `{ SimChip } from '@/components/ui/SimChip';`.

**`VitalSigns.tsx`** — read the file; immediately above the grid `<div className="grid grid-cols-2 gap-3">` (verified at `:122`) insert:
```tsx
      {mapMode !== 'live' && (
        <div className="mb-2">
          <SimChip />
        </div>
      )}
```
(in live mode VitalSigns shows static editorial baselines with its existing honest provenance line — no chip needed there).

**`ResultPanel.tsx`** (second touch after Task 1 — re-read it first) — the badge block (originally at `:44-50`):
```tsx
      <div className="mb-4">
        <span
          className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-mono tracking-widest ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
```
becomes:
```tsx
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-mono tracking-widest ${badge.className}`}
        >
          {badge.label}
        </span>
        <SimChip />
      </div>
```

**`StressTest.tsx`** — the heading block (verified at `:150-158`):
```tsx
        <div>
          <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
            Monte Carlo Stress Test
          </h2>
```
becomes:
```tsx
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
              Monte Carlo Stress Test
            </h2>
            <SimChip />
          </div>
```
(keep the `<p>` subtitle below it unchanged; close the new wrapper div correctly).

**`ImpactCalculator.tsx`** — the heading (verified at `:25-27`):
```tsx
      <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
        How Does This Affect You?
      </h2>
```
becomes:
```tsx
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
          How Does This Affect You?
        </h2>
        <SimChip />
      </div>
```

- [ ] **Step 6: CrisisHero — stop quoting the cascade hypothetical; adopt `formatPHP`**

Read `src/components/layout/CrisisHero.tsx`. Remove the import (verified `:5`): `import { criticalInsight } from '@/data/cascade';` and the headline quote in the paragraph (verified `:58-61`):
```tsx
      <p className="mt-4 text-text-body text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        {dieselLine ? `${dieselLine} ` : ''}
        {criticalInsight.headline} — here&apos;s why, and what it costs your family.
      </p>
```
becomes:
```tsx
      <p className="mt-4 text-text-body text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        {dieselLine ? `${dieselLine} ` : ''}
        Here&apos;s why, and what it costs your family.
      </p>
```
The hero's human line now derives from live diesel only (`composeDieselLine` already does — keep that export intact; `CrisisHero.test.ts` depends on it). Convert `composeDieselLine`'s literals (verified `:30-33`) to the formatter:
```tsx
import { formatPHP } from '@/lib/format';

export function composeDieselLine(value: number, delta: number): string {
  const price = `${formatPHP(value)}/L`;
  if (delta > 0.01) return `Diesel is ${price} — up ${formatPHP(delta)} this week.`;
  if (delta < -0.01) return `Diesel is ${price} — down ${formatPHP(Math.abs(delta))} this week.`;
  return `Diesel is ${price} — flat this week.`;
}
```
Run `pnpm test src/components/layout/__tests__/CrisisHero.test.ts` — if its assertions compare exact strings, the output is unchanged (`₱xx.xx` both ways); if one fails, inspect — it means the old test encoded different formatting, report it.

- [ ] **Step 7: `/cascade` — explicit modeled-scenario framing**

Read `src/app/cascade/CascadePage.tsx`. Two copy edits, exact:

**Badge** (verified `:50-59`) — currently a pulsing red "Live Cascade Tracker":
```tsx
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-status-red/20 bg-status-red/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-red" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-red">
              Live Cascade Tracker
            </span>
          </div>
```
becomes (no pulse — it is not live; status-yellow simulated framing):
```tsx
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-status-yellow/20 bg-status-yellow/5 px-4 py-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-status-yellow" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-yellow">
              Modeled Shock Scenario
            </span>
          </div>
```

**Headline** (verified `:60-65`):
```tsx
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-3 max-w-3xl">
            Filipino families pay{' '}
            <span className="text-status-red">{cascadeHeadline.householdImpact}</span>{' '}
            more — traced from{' '}
            <span className="text-status-red">{cascadeHeadline.crudePrice}</span> crude oil.
          </h1>
```
becomes:
```tsx
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-3 max-w-3xl">
            In a modeled{' '}
            <span className="text-status-red">{cascadeHeadline.crudePrice}</span> oil-shock
            scenario, Filipino families would pay{' '}
            <span className="text-status-red">{cascadeHeadline.householdImpact}</span> more.
          </h1>
```
And append one sentence to the existing intro paragraph below it (verified `:67-72`, ends "…across the Philippine economy."):
```
 Figures on this page model a sustained {cascadeHeadline.crudePrice} crude scenario — they are not today&apos;s prices.
```
(insert inside the same `<p>`, before `</p>`).

- [ ] **Step 8: Verify suite, lint, build, and visually**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all green (lint will catch any orphaned import you missed). `pnpm dev`: confirm Supply Risk badge now reads from live data (likely LOW/MODERATE — not the scenario's HIGH), ImpactCards show near-baseline "No change"-style values at today's prices, SIMULATED chips appear on Scenario Planner result, Stress Test, Consumer Impact, and on System Health only in scenario/timeline map mode, `/cascade` reads as a modeled scenario, and the hero no longer mentions "hidden multiplier". Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/components/ui/SimChip.tsx src/components/ui/__tests__/SimChip.test.tsx src/lib/impact-model.ts src/lib/__tests__/impact-model.test.ts src/components/layout/ExecutiveSnapshot.tsx src/components/layout/__tests__/ExecutiveSnapshot.test.ts src/components/prices/ImpactCards.tsx src/app/page.tsx src/components/health/VitalSigns.tsx src/components/scenarios/ResultPanel.tsx src/components/scenarios/StressTest.tsx src/components/consumer/ImpactCalculator.tsx src/components/layout/CrisisHero.tsx src/app/cascade/CascadePage.tsx
git diff --cached --stat   # expect: only the fourteen files above
git commit -m "separate live from simulated — live act 1-2 numbers, simulated chips, modeled cascade framing"
```

---

## Task 5: Real alerts (A3)

`checkPrices` exists, is fully implemented (rules, cooldown, persistence, browser Notifications — `useAlerts.ts:70-123`), and is **never called**. The catch: `useAlerts` is per-instance state, and `AlertBell` owns its own instance — so whoever calls `checkPrices` must share state with the bell. Fix: one `AlertsProvider` context owning the single `useAlerts()` instance, reacting to each successful price poll (`pricesUpdated` changes only on success — `DataProvider.tsx:95`), with `AlertBell` consuming the context. Dismissal persistence needs **no work** — `markRead`/`markAllRead` already persist to localStorage (verified; the audit's `useDismissable` pointer was a red herring).

**Files:**
- Create: `src/lib/AlertsProvider.tsx`
- Create: `src/lib/__tests__/AlertsProvider.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/alerts/AlertBell.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/AlertsProvider.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsProvider, useAlertsContext } from '@/lib/AlertsProvider';

function Probe() {
  const alerts = useAlertsContext();
  return <div>unread:{alerts.unreadCount}</div>;
}

describe('AlertsProvider', () => {
  it('provides the shared alerts store to consumers', async () => {
    render(
      <AlertsProvider>
        <Probe />
      </AlertsProvider>,
    );
    expect(await screen.findByText(/unread:0/)).toBeTruthy();
  });

  it('throws a clear error when used outside the provider', () => {
    // Suppress the expected console error noise from React.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AlertsProvider/);
    spy.mockRestore();
  });
});
```
Outside a `DataProvider`, `usePrices()` returns the context default (`pricesLive: false`, `pricesUpdated: null`), so the poll-reaction effect stays dormant in the test — which is exactly the behavior under test for the render path.

Run: `pnpm test src/lib/__tests__/AlertsProvider.test.tsx` → FAIL (module missing).

- [ ] **Step 2: Implement `AlertsProvider`**

Create `src/lib/AlertsProvider.tsx`:
```tsx
'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { usePrices } from '@/hooks/usePrices';

type AlertsStore = ReturnType<typeof useAlerts>;

const AlertsContext = createContext<AlertsStore | null>(null);

/**
 * Owns the SINGLE alerts store for the app and wires it to the price feed:
 * every successful poll (pricesUpdated changes only on success — see
 * DataProvider.fetchPrices) is evaluated against the user's alert rules via
 * checkPrices. Before this provider existed, checkPrices had zero call sites
 * and the AlertBell was decorative.
 *
 * Mounted in the root layout INSIDE DataProvider, so usePrices() reads the
 * real polling context.
 */
export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const alerts = useAlerts();
  const { prices, isLive, lastUpdated } = usePrices();
  const { checkPrices } = alerts;

  useEffect(() => {
    if (!isLive || !lastUpdated || prices.length === 0) return;
    checkPrices(prices);
    // checkPrices is a stable useCallback; rule cooldowns (30 min) prevent
    // notification spam across the 5-minute polls.
  }, [lastUpdated, isLive, prices, checkPrices]);

  return <AlertsContext.Provider value={alerts}>{children}</AlertsContext.Provider>;
}

export function useAlertsContext(): AlertsStore {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlertsContext must be used within AlertsProvider');
  return ctx;
}
```
Run the test → PASS (`2 passed`).

> Known pre-existing wart (do NOT fix here): `useAlerts` reads localStorage in its `useState` initializers (`useAlerts.ts:27-28`), against the CLAUDE.md SSR rule. `AlertBell` already had this exposure; the provider neither worsens nor fixes it. Report it forward.

- [ ] **Step 3: Mount it in the root layout**

Read `src/app/layout.tsx`. The body currently ends (verified at `:148`):
```tsx
        <DataProvider>{children}</DataProvider>
```
Replace with:
```tsx
        <DataProvider>
          <AlertsProvider>{children}</AlertsProvider>
        </DataProvider>
```
and add `import { AlertsProvider } from "@/lib/AlertsProvider";` next to the existing `DataProvider` import (verified at `:4`).

- [ ] **Step 4: Point `AlertBell` at the shared store**

Read `src/components/alerts/AlertBell.tsx`. Two-line change (verified `:4` and `:10`):
```tsx
import { useAlerts } from '@/hooks/useAlerts';
…
  const alerts = useAlerts();
```
becomes:
```tsx
import { useAlertsContext } from '@/lib/AlertsProvider';
…
  const alerts = useAlertsContext();
```
`AlertDrawer`'s prop type `ReturnType<typeof useAlerts>` (`AlertDrawer.tsx:3,8`) is structurally identical to the context value — no change needed there.

- [ ] **Step 5: Verify suite, lint, build, and manually fire an alert**

Run: `pnpm test && pnpm lint && pnpm build` → all green.
Manual: `pnpm dev`, open `http://localhost:3007`, click the bell → "Add rule" → create a rule that must trigger immediately (e.g. **Brent Crude above 10**). Within the first poll (it fires on mount), the bell badge should show `1` and the drawer should list the notification. Reload the page — the notification history persists (localStorage). Mark it read — the badge clears and stays cleared after reload. Delete the test rule. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/lib/AlertsProvider.tsx src/lib/__tests__/AlertsProvider.test.tsx src/app/layout.tsx src/components/alerts/AlertBell.tsx
git diff --cached --stat   # expect: only the four files above
git commit -m "wire checkPrices into the price poll via a shared alerts provider"
```

---

## Task 6: Quick fixes — skeleton height, zoom quantization, scan-line sweep (A5, part 1)

Three independent ≤10-line fixes, one commit.

**Files:**
- Modify: `src/app/page.tsx` (second touch after Task 4 — re-read first)
- Modify: `src/components/map/IntelMap.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Match `MapSkeleton` height to the real map**

In `src/app/page.tsx` the map-loading skeleton (verified pre-Task-4 at `:13`) is:
```tsx
      <div className="w-full h-[clamp(350px,55vh,600px)] sm:h-[600px] glass-card rounded-xl animate-pulse flex items-center justify-center">
```
The real map container (`IntelMap.tsx:244`) is `h-[500px] sm:h-[600px] lg:h-[75vh] lg:max-h-[900px]`. Make the skeleton match exactly:
```tsx
      <div className="w-full h-[500px] sm:h-[600px] lg:h-[75vh] lg:max-h-[900px] glass-card rounded-xl animate-pulse flex items-center justify-center">
```

- [ ] **Step 2: Quantize the zoom state**

In `src/components/map/IntelMap.tsx`, the per-frame setter (verified at `:253`):
```tsx
        onMove={(evt) => setCurrentZoom(evt.viewState.zoom)}
```
becomes:
```tsx
        onMove={(evt) => {
          // currentZoom is only consumed for clustering thresholds, which
          // floor it anyway (StationLayer) — re-render only on integer change.
          const next = Math.floor(evt.viewState.zoom);
          setCurrentZoom((prev) => (Math.floor(prev) === next ? prev : next));
        }}
```
Verified consumers: the `deckLayers` memo dep (`:233` → `createStationLayer` arg) and `StationLayer.tsx:81-126`, which compares `>= CLUSTER_MAX_ZOOM` and calls `getClusters(…, Math.floor(currentZoom))` — floor-quantized state is semantics-identical at every integer boundary. (`currentZoom` initializes to `5.5` from `INITIAL_VIEW_STATE`; the functional setter normalizes it on first move.)

- [ ] **Step 3: Fix the scan-line sweep**

In `src/app/globals.css`, the scan-line overlay (verified at `:60-69`):
```css
/* Scan line overlay — NERV crisis effect */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, var(--scan-line-opacity)) 2px, rgba(255, 255, 255, var(--scan-line-opacity)) 4px);
  transition: opacity 1.5s ease;
}
```
**Diagnosis:** the transition targets `opacity`, but `opacity` never changes — the crisis shift changes `--scan-line-opacity` *inside* `background-image`, which is not animatable, so entering CRISIS snaps instead of sweeping. **Fix:** render the gradient lines at full alpha and drive the element's `opacity` from the variable (visually identical — uniform-color alpha multiplies):
```css
/* Scan line overlay — NERV crisis effect.
   The gradient is full-alpha; visibility is driven by `opacity` (which IS
   animatable) via --scan-line-opacity, so the CRISIS sweep fades in/out. */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 1) 2px, rgba(255, 255, 255, 1) 4px);
  opacity: var(--scan-line-opacity);
  transition: opacity 1.5s ease;
}
```
(`--scan-line-opacity` is `0 / 0 / 0.03` per crisis level — `crisisLevel.ts:17,23,29` — set on `documentElement` by `CrisisProvider.tsx:58-65`; a custom-property change re-computes the descendant's `opacity`, which the declared transition then animates.)

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm lint && pnpm build` → all green.
Manual: `pnpm dev` →
1. Hard-reload `/` with DevTools Network throttled — the map skeleton must occupy exactly the final map height at 375 px, 768 px, and 1440 px widths (no jump when the map mounts).
2. Pan/zoom the map with React DevTools profiler on — `IntelMap` re-renders only when the integer zoom changes, clustering still flips around zoom 8.
3. In the console run `document.documentElement.style.setProperty('--scan-line-opacity', '0.03')` — the scan lines must **fade in over ~1.5 s**, not snap (then set back to `'0'` and watch them fade out).
Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/app/page.tsx src/components/map/IntelMap.tsx src/app/globals.css
git diff --cached --stat   # expect: only the three files above
git commit -m "fix map skeleton height, quantize zoom state, repair crisis scan-line fade"
```

---

## Task 7: Slider INP — local params with deferred propagation (A5, the delicate one)

Every slider `onChange` tick currently calls `onParamsChange` → `setScenarioParams` in `page.tsx` → re-renders the entire page (including `CrisisProvider` and the deck.gl layer rebuild via `IntelMap`'s `deckLayers` memo, dep at `IntelMap.tsx:225`). Fix: the planner keeps a **local mirror** of the params for instant slider/readout/result feedback, and propagates to the parent at most once per animation frame inside `startTransition` (React marks the heavy tree render non-urgent — the `rerender-transitions` pattern).

**READ `src/components/scenarios/ScenarioPlanner.tsx` IN FULL FIRST.** Task 4 did not touch it; Task 1 deliberately avoided it; if reality differs from the quotes below, adapt and report. The four flows that MUST keep working: (1) `?s=` URL restore + the `urlScenarioRef` live-sync skip, (2) live-price sync, (3) timeline drive, (4) `ScenarioSlots` load + `ShareButton` URL.

**Files:**
- Modify: `src/components/scenarios/ScenarioPlanner.tsx`

- [ ] **Step 1: Add the local mirror + deferred propagation**

Current code (verified at `:86-97`):
```tsx
  const updateParam = <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const result = useMemo(() => calculatePumpPrice(params), [params]);
  const { scenarios, saveScenario, removeScenario } = useScenarios();

  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(buildScenarioUrl(params, window.location.origin, '/'));
  }, [params]);
```
Replace with:
```tsx
  // ── Slider INP fix ─────────────────────────────────────────────────────
  // Local mirror of the parent's params: sliders, readouts, and the result
  // panel render from this immediately; propagation to page.tsx (which
  // re-renders CrisisProvider + the deck.gl map) is coalesced to one
  // animation frame and marked non-urgent via startTransition.
  const [localParams, setLocalParams] = useState<ScenarioParams>(params);
  // The last object we sent upward. When `params` echoes our own update
  // (same reference), skip the sync so a mid-drag local value is never
  // clobbered by a stale parent commit. External updates (live-price sync,
  // timeline drive, slot load, URL restore) produce NEW objects → sync runs.
  const lastSentRef = useRef<ScenarioParams>(params);
  const sendRafRef = useRef(0);

  useEffect(() => {
    if (params !== lastSentRef.current) setLocalParams(params);
  }, [params]);

  useEffect(() => () => cancelAnimationFrame(sendRafRef.current), []);

  const updateParam = <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => {
    setLocalParams((prev) => {
      const next = { ...prev, [key]: value };
      cancelAnimationFrame(sendRafRef.current);
      sendRafRef.current = requestAnimationFrame(() => {
        lastSentRef.current = next;
        startTransition(() => onParamsChange(next));
      });
      return next;
    });
  };
  // ───────────────────────────────────────────────────────────────────────

  const result = useMemo(() => calculatePumpPrice(localParams), [localParams]);
  const { scenarios, saveScenario, removeScenario } = useScenarios();

  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(buildScenarioUrl(localParams, window.location.origin, '/'));
  }, [localParams]);
```
Update the import line at the top (currently `import { useMemo, useEffect, useRef, useState } from 'react';`) to:
```tsx
import { useMemo, useEffect, useRef, useState, startTransition } from 'react';
```

- [ ] **Step 2: Point all planner-local reads at `localParams`**

Sweep the JSX (verified occurrences): the Brent readout `${params.brentPrice}/bbl` (`:147`), Brent slider `value={params.brentPrice}` (`:157`), Hormuz readout (`:176`), Hormuz slider (`:186`), forex readout `₱{params.forexRate.toFixed(2)}` (`:205`), forex slider (`:216`), refinery `aria-checked` / `onClick` / both class ternaries (`:236-246`), and `RiskMatrix params={params}` (`:259`) — replace every `params.` read in the render body with `localParams.`, and `updateParam('refineryOffline', !params.refineryOffline)` with `…!localParams.refineryOffline`. Also `onSave={(name) => saveScenario(name, params)}` (`:131`) → `saveScenario(name, localParams)`.

**Leave `params` (the prop) in place ONLY inside the three pre-existing effects** (URL restore `:45-51`, live-price sync `:55-68`, timeline drive `:71-82`) — they write upward via `onParamsChange` and don't read `params` anyway (the live-sync uses a functional updater). Do not modify those effects at all.

While in the forex readout, adopt Task 1's formatter: `₱{localParams.forexRate.toFixed(2)}` → `{formatPHP(localParams.forexRate)}` with `import { formatPHP } from '@/lib/format';`.

- [ ] **Step 3: Verify the flows — automated + manual (the Wave-4 regression gate)**

Run: `pnpm test && pnpm lint && pnpm build` → all green.

Manual, with `pnpm dev` on port 3007 (each of these is a Wave 4 / data-flow invariant):
1. **`?s=` deep-link restore:** open `http://localhost:3007/?s=150_14_63_1` in a fresh tab → sliders read Brent $150, Hormuz 14 wk, ₱63.00, refinery Offline, and the values are NOT clobbered by the first live-price sync (watch for ~2 s).
2. **Share round-trip:** drag Hormuz to 9, click "Share this view" → paste the URL in a new tab → Hormuz restores to 9 (proves `shareUrl` tracks the latest local value).
3. **Drag feel:** with the Performance panel recording, scrub the Brent slider rapidly — the readout and Est. prices update every frame; long tasks during the drag should be gone or ≪ 100 ms (was 300–600 ms INP).
4. **Live sync:** reload `/` plain — after the first poll, Brent/forex sliders snap to live values (sync effect still works through the mirror).
5. **Timeline mode:** switch the map to TIMELINE and scrub — sliders gray out and follow the timeline (parent-driven params still flow down into `localParams`).
6. **Slots:** save a scenario, change sliders, load the slot — sliders restore.
Stop the dev server. If ANY of the six fails, do not commit — debug the mirror/echo logic.

- [ ] **Step 4: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add src/components/scenarios/ScenarioPlanner.tsx
git diff --cached --stat   # expect: only the one file above
git commit -m "fix slider inp — local param mirror with raf-coalesced transition propagation"
```

---

## Task 8: stations.json — slim, content-hash, cache immutably (A5, part 2)

The 335 kB-gz payload re-downloads on every visit (no cache headers, mutable filename) and carries dead weight: a per-station `source` object **no component reads**, thousands of empty `address` strings, and 6-decimal coords (~11 cm precision is plenty at 5). Build emits `public/data/stations/<contenthash>.json` + a tiny committed manifest that `useStations` imports statically (zero extra fetch; `resolveJsonModule` is on), and `vercel.json` serves the hashed dir immutable.

**Files:**
- Modify: `scripts/build-stations-json.mjs`
- Create: `src/data/stations-manifest.json` (generated by the script, then committed)
- Modify: `src/hooks/useStations.ts`
- Modify: `src/types/stations.ts`
- Modify: `.gitignore`
- Modify: `vercel.json`
- Modify: `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `CLAUDE.md`

- [ ] **Step 1: Record the BEFORE size**

```bash
node scripts/build-stations-json.mjs
ls -l public/data/stations.json
gzip -c public/data/stations.json | wc -c
```
Expected: ~2.9 MB raw / ~335,676 B gzip. Record both numbers.

- [ ] **Step 2: Rewrite the build script**

Read `scripts/build-stations-json.mjs` (44 lines), then replace its output stage. Full new script (the read/validate/remap top half is preserved verbatim):
```js
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STATIONS_DIR = join(here, '../src/data/stations');
const OUT_DIR = join(here, '../public/data/stations');
const LEGACY_OUT = join(here, '../public/data/stations.json');
const MANIFEST = join(here, '../src/data/stations-manifest.json');

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

// The filter UI (BRAND_LIST in src/data/stations/index.ts) only exposes 6 named
// brands plus an "Other" bucket. Remap any other raw OSM brand to "Other" so the
// station-filter `visibleBrands.has(s.brand)` check can reach every station.
const NAMED_BRANDS = new Set(['Petron', 'Shell', 'Caltex', 'Phoenix', 'SeaOil', 'Unioil']);
let remapped = 0;
for (const s of all) {
  if (!NAMED_BRANDS.has(s.brand)) {
    if (s.brand !== 'Other') remapped += 1;
    s.brand = 'Other';
  }
}

// ── Slim the runtime payload ────────────────────────────────────────────────
// - drop `source` (provenance object — nothing in src/ reads station.source;
//   provenance stays in the committed src/data/stations/*.json originals)
// - drop empty `address` strings (StationTooltip renders address only when truthy)
// - truncate coordinates to 5 decimals (~1.1 m — far below marker precision)
const round5 = (n) => Math.round(n * 1e5) / 1e5;
for (const s of all) {
  delete s.source;
  if (!s.address) delete s.address;
  s.coordinates = [round5(s.coordinates[0]), round5(s.coordinates[1])];
}

// ── Content-hashed output + committed manifest ─────────────────────────────
// The hash is over the final payload, so the URL changes iff the data changes;
// vercel.json serves /data/stations/* with a 1-year immutable Cache-Control.
const json = JSON.stringify(all);
const hash = createHash('sha1').update(json).digest('hex').slice(0, 10);

rmSync(OUT_DIR, { recursive: true, force: true }); // clear stale hashed files
rmSync(LEGACY_OUT, { force: true });               // remove the old un-hashed output
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `${hash}.json`), json);
writeFileSync(
  MANIFEST,
  JSON.stringify({ file: `/data/stations/${hash}.json`, count: all.length, hash }, null, 2) + '\n',
);

console.log(
  `[build-stations] wrote ${all.length} stations to public/data/stations/${hash}.json ` +
    `(${remapped} non-canonical brands remapped to "Other"); manifest → src/data/stations-manifest.json`,
);
```
Run `node scripts/build-stations-json.mjs` — it creates the hashed file and `src/data/stations-manifest.json`.

> The manifest lives in `src/` and is **committed** (it changes only when station data changes) so `pnpm test` / editors typecheck without requiring a prior `predev` run. The hashed payloads in `public/data/stations/` are gitignored like the old output.

- [ ] **Step 3: `useStations` fetches the manifest path**

Read `src/hooks/useStations.ts`. One import + one line (verified at `:43`):
```ts
  stationsPromise = fetch('/data/stations.json')
```
becomes:
```ts
import stationsManifest from '@/data/stations-manifest.json';
…
  stationsPromise = fetch(stationsManifest.file)
```
(place the import with the others at the top; everything else — singleton promise, `buildStationsData`, status assignment — unchanged).

- [ ] **Step 4: Make `GasStation.address`/`source` optional**

In `src/types/stations.ts` (verified current shape requires both):
```ts
  address: string;
  …
  source: {
    url: string;
    scrapedAt: string;
  };
```
becomes:
```ts
  /** Omitted in the built runtime payload when empty. */
  address?: string;
  …
  /** Provenance — present in src/data source files, stripped from the runtime payload. */
  source?: {
    url: string;
    scrapedAt: string;
  };
```
Verified consumers stay green: `StationTooltip.tsx:60` already guards `station.address &&`; nothing reads `station.source`; the test helper in `useStations.test.ts:9-18` *provides* both fields (valid for optional fields).

- [ ] **Step 5: `.gitignore` + `vercel.json`**

`.gitignore` — replace the old entry (verified, last lines of the file):
```
# generated station data (built by scripts/build-stations-json.mjs via prebuild/predev)
/public/data/stations.json
```
with:
```
# generated station data (built by scripts/build-stations-json.mjs via prebuild/predev)
/public/data/stations.json
/public/data/stations/
```
(keep the legacy line so a stale local `stations.json` never gets committed).

`vercel.json` — currently crons-only (verified). Add the headers block:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 6 * * *"
    }
  ],
  "headers": [
    {
      "source": "/data/stations/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```
(Hashed filenames make immutability safe: new data ⇒ new URL. The `(.*)` source pattern is the documented Vercel headers syntax for a path subtree — if `vercel dev`/docs disagree at implementation time, verify against current Vercel headers docs and report.)

- [ ] **Step 6: Measure AFTER + verify tests/build**

```bash
node scripts/build-stations-json.mjs
ls -l public/data/stations/
gzip -c public/data/stations/*.json | wc -c
```
Expected: gzip in the **~180–220 kB** range (record the actual; the spec's estimate is ~180 kB — report the real number, don't force it). Then:
```bash
pnpm test    # useStations tests must stay green (they read src/data sources, not the built file)
pnpm lint && pnpm build
```
Manual: `pnpm dev` → map loads stations; DevTools Network shows the fetch hitting `/data/stations/<hash>.json`; hover a station that has an address — the tooltip still shows it.

- [ ] **Step 7: Documentation-as-code**

Update the three docs that name the old path (grep-verified): `docs/ARCHITECTURE.md` (intro paragraph at `:5` and the data-source table row at `:64`), `docs/COMPONENTS.md:186` (`useStations` row), and project `CLAUDE.md` (File Organization table's `public/data/` row, the Station Data bullet about `public/data/stations.json`, and the Data Fetching "Stations:" bullet) — describe the new pipeline: build emits content-hashed `public/data/stations/<hash>.json` + committed `src/data/stations-manifest.json` pointer; slimmed fields (`source` stripped, empty `address` dropped, 5-decimal coords); immutable Cache-Control via `vercel.json`. Read each file and edit the specific sentences — do not rewrite the docs wholesale.

- [ ] **Step 8: Commit**

```bash
git diff --cached --stat   # expect: nothing staged
git add scripts/build-stations-json.mjs src/data/stations-manifest.json src/hooks/useStations.ts src/types/stations.ts .gitignore vercel.json docs/ARCHITECTURE.md docs/COMPONENTS.md CLAUDE.md
git diff --cached --stat   # expect: only the nine files above
git commit -m "ship slimmed content-hashed stations payload with immutable caching"
```

---

## Task 9: Final verification

**Files:** none (verification only; Lighthouse artifacts land in the repo root, untracked — the established pattern, cf. existing `lighthouse-report*`).

- [ ] **Step 1: Full suite**

Run: `pnpm test`
Expected: all pass — the original 8 files / 33 tests plus the new test files from Tasks 1–5 (format, price-history, weekly-series, PricePanel, SimChip, impact-model, ExecutiveSnapshot, AlertsProvider ⇒ **16 files total**). Record the final counts.

- [ ] **Step 2: Build + bundle budget**

Run: `pnpm build`
Expected: clean. Record the homepage `/` First Load JS and compare with the Task 1 baseline — must be **≤ 135 kB** (Wave A adds only small pure modules + the curated data file; `price-history.ts` at 52 weeks is ~4 kB of source).

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors (unused-import violations from the prop removals would have surfaced per-task; this is the belt-and-braces pass).

- [ ] **Step 4: Lighthouse, mobile + desktop**

```bash
pnpm build && pnpm start &   # serves on :3000
sleep 5
npx lighthouse http://localhost:3000 --output html --output json --output-path ./lighthouse-waveA-mobile --quiet
npx lighthouse http://localhost:3000 --preset=desktop --output html --output json --output-path ./lighthouse-waveA-desktop --quiet
kill %1
```
Record Performance / Accessibility / Best-Practices / SEO for both, plus **CLS** specifically (the skeleton fix should show CLS ≈ 0 for the map) — into the wave report / PR description. Compare against the most recent pre-wave artifacts in the repo root (`lighthouse-final/`, `lighthouse-report4/`) if present. Leave the new artifacts untracked (do NOT commit them).

- [ ] **Step 5: Manual integrity walk-through**

`pnpm dev` (port 3007):
1. **Honest sparklines:** Brent/Gasoline/Diesel KPIs + pump cards show multi-week real trends; PHP/USD and derived benchmarks show "history building…" — no sine-wave anywhere.
2. **Live vs simulated:** Supply Risk badge reflects live data; ImpactCards near-baseline at today's prices; SIMULATED chips on ScenarioPlanner result, StressTest, ImpactCalculator, and System Health in scenario/timeline mode; `/cascade` headline reads "In a modeled $107.8/bbl oil-shock scenario…"; hero quotes live diesel only.
3. **Alerts:** a "Brent above 10" rule fires on the next poll; badge, drawer, persistence, mark-read all work; delete the rule.
4. **`?s=` restore (Wave 4 regression gate):** `/?s=150_14_63_1` restores all four params and survives the first live sync; Share button round-trips.
5. **Perf feel:** slider drag is smooth with the map visible; map skeleton doesn't jump; scan-line fades via the devtools variable trick (Task 6 step 4.3).
6. **Stations:** network shows `/data/stations/<hash>.json`; clustering and tooltips (with address where present) work.
Stop the dev server. Record any deviation.

---

## Self-Review Notes

- **Spec coverage (A1–A6 → tasks):** A6 → Task 1 (`format.ts`, canonical selector, `78.5`/`72.3` killed; sweep distributed to T3/T4/T7 for files those tasks already edit). A4 → Task 2 (`price-history.ts` + validator; DATA HONESTY rule, 26-week gate, 52-week target; localStorage intraday persistence cut — flagged). A1 → Task 3 (fabrication deleted, weekly wiring, "history building…" label; SentimentGauge consciously excluded with rationale). A2 → Task 4 (live Supply-Risk, live ImpactCards, SimChips, cascade + hero reword; CrisisProvider's scenario coupling explicitly reported as out of scope, not silently skipped). A3 → Task 5 (AlertsProvider; dismissal persistence found already done). A5 → Tasks 6–8 (all six audit fixes, each verified against real code). Cross-cutting verification → Task 9 (suite, build budget, lint, Lighthouse ×2, `?s=` gate, visual checklist).
- **Audit-vs-reality corrections baked in:** (1) only PricePanel fabricates — the other three sparkline hosts silently hide (different fix, same task); (2) ExecutiveSnapshot's KPIs are already live — only the risk badge is scenario-coupled; (3) VitalSigns is scenario-coupled only outside live map mode; (4) alert dismissals already persist — no `useDismissable` work; (5) `vercel.json` exists (crons) — modified, not created; (6) the hardcoded "current price" constants are ResultPanel's `78.5`/`72.3`, ~₱15/L stale against the DOE fallbacks.
- **No placeholders:** every code step is complete and runnable except the **deliberately** unpopulated `PRICE_HISTORY` rows, which the DATA HONESTY rule forbids this plan from inventing — the implementer fills them from cited primary sources, and the validator + integration test make shipping the placeholder row impossible (`brent: 0` is out of band, count < 26 fails the gate).
- **Type consistency:** `WeeklyPricePoint` is owned by `src/data/price-history.ts` and imported type-only by the validator; `weeklySeriesFor` returns `number[] | null` and every consumer coalesces `?? intraday ?? []`, matching `SparkChart`'s `data: number[]`. `getCurrentPumpPrices` returns plain numbers consumed by `ResultPanel`/`ImpactCards`; `pumpDeltaRisk` returns the existing `RiskLevel` union, keying the untouched `riskClasses` map. `ExecutiveSnapshot`/`ImpactCards` prop removals are paired with the `page.tsx` call-site edits in the same task/commit, so the tree never builds in a mismatched state. `GasStation.address/source` become optional in the same commit that strips them from the payload.
- **File-conflict ordering:** strictly sequential tasks; the four shared files are sequenced and called out: `ResultPanel` (T1→T4), `ExecutiveSnapshot` (T3→T4), `page.tsx` (T4→T6), `ScenarioPlanner` (T7 only — T1 deliberately avoided it so the delicate INP task starts from a known state). Every second-touch step says "re-read the file first."
- **Riskiest steps, mitigated:** the slider INP change carries an explicit echo-skip (`lastSentRef`) against mid-drag clobbering, leaves the three Wave-4 effects byte-untouched, and gates the commit on a 6-point manual flow check including the `?s=` deep link (spec §10 risk table). The stations pipeline keeps the manifest committed so tests/typecheck never depend on `predev`, keeps provenance in the source files, and cleans stale hashed outputs on every build.
- **Commit hygiene:** 8 code commits + none for Task 9; each stages only named files with a `git diff --cached --stat` guard before and after staging; no push anywhere.
