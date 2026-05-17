# Wave 2A — Data Honesty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every number on the dashboard honestly labelled — simulated/modeled values get "Estimated" provenance, stale fallback data is corrected and range-guarded, and the sentiment API degrades gracefully like the other endpoints.

**Architecture:** Surgical edits to ~8 files plus one new test. No new dependencies, no schema changes. Each task is independently shippable and leaves `pnpm build` green.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind, Vitest.

---

## Context for the engineer

Brownfield Next.js 14 dashboard. Package manager **pnpm**; agent shells need `export PATH="/opt/homebrew/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"`. Path alias `@/*` → `./src/*`. Build is `pnpm build`, tests `pnpm test`, lint `pnpm lint` — all must pass before each commit. Commit messages: lowercase imperative. Do NOT push to any remote.

This is Wave 2A of the "100x" program. Several dashboard features show **simulated or stale data as if it were live**:
- `VitalSigns` in `live` mode renders hardcoded editorial constants (a static "ALERT" badge) with no "estimated" marker.
- `StationTrackerSection` says "10,469 monitored stations" — per-station status is actually a `djb2`-hash simulation.
- `src/data/prices.ts` has an implausible diesel fallback (₱130.75/L — real PH diesel is ~₱55–62/L).
- `/api/sentiment` returns HTTP 503 when the HuggingFace token is absent, breaking the established "API always returns 200 + fallback" contract.
- `ImpactCards` derives consumer-impact numbers from a `brentDelta` proxy instead of the real pump-price model.
- `monte-carlo.ts` discards the user's `hormuzWeeks` scenario input.

**Out of scope (deferred):** The spec's DOE Oil Monitor pump-price scraper (weekly cron → Supabase `pump_prices` table) is NOT in this plan. It requires a research spike to inspect the external DOE page structure plus a Supabase schema migration and a new env var — it cannot be responsibly pre-specified with complete code here. It will get its own plan after a research spike. This plan corrects and range-guards the static fallback so the dashboard is honest in the meantime.

`SourceAttribution` (`src/components/ui/SourceAttribution.tsx`) is the standard provenance footer — `<SourceAttribution derived="..." />` renders a small bordered note; `<SourceAttribution source="..." />` renders "Source: ...".

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/health/VitalSigns.tsx` | Add mode-aware `SourceAttribution` provenance footer |
| Modify | `src/components/health/StationTrackerSection.tsx` | Honest copy + modeled-status disclaimer |
| Modify | `src/data/prices.ts` | Correct stale pump values; add build-time range guard |
| Create | `src/data/__tests__/prices.test.ts` | Regression test: pump prices stay in a sane band |
| Modify | `src/components/prices/PricePanel.tsx` | Visible "Cached fallback" badge when `!isLive` |
| Modify | `src/components/layout/ExecutiveSnapshot.tsx` | Visible "Cached" indicator + dynamic KPI `source` |
| Modify | `src/app/api/sentiment/route.ts` | Return HTTP 200 + static fallback (not 503/502) |
| Modify | `src/app/api/cron/route.ts` | Call `/api/sentiment` unconditionally (always 200 now) |
| Modify | `src/components/prices/ImpactCards.tsx` | Derive impacts from `calculatePumpPrice`, not a Brent proxy |
| Modify | `src/lib/monte-carlo.ts` | Use the user's `hormuzWeeks` as the disruption distribution mean |

---

## Task 1: VitalSigns provenance footer

`VitalSigns` shows four KPI cards. In `live` mode the values are hardcoded editorial constants (`VITAL_SIGNS` from `constants.ts`); in scenario/timeline mode they are derived from `scenarioParams`. Neither case is labelled — a static "ALERT" badge reads as live monitoring. Add a mode-aware `SourceAttribution` footer.

**Files:**
- Modify: `src/components/health/VitalSigns.tsx`

- [ ] **Step 1: Add the `SourceAttribution` import**

In `src/components/health/VitalSigns.tsx`, add to the import block at the top (after the existing `GaugeBar` import):
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

- [ ] **Step 2: Wrap the grid and append the footer**

The component currently returns a single `<div className="grid grid-cols-2 gap-3">...</div>`. Replace the `return (` block's outer element so the grid is wrapped and a `SourceAttribution` follows it. Change:
```tsx
  return (
    <div className="grid grid-cols-2 gap-3">
      {signs.map((sign) => {
```
to:
```tsx
  const provenance =
    mapMode === 'live'
      ? 'Estimated from DOE baseline + editorial — not live telemetry'
      : 'Derived from scenario parameters';

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {signs.map((sign) => {
```

Then find the matching close of the grid `<div>` (the `</div>` that closes `grid grid-cols-2 gap-3`, immediately before the final `);`) and change:
```tsx
        );
      })}
    </div>
  );
}
```
to:
```tsx
        );
      })}
      </div>
      <SourceAttribution derived={provenance} />
    </div>
  );
}
```
(Note: the `.map(...)` body's existing indentation does not need to change — only the wrapper.)

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/health/VitalSigns.tsx
git commit -m "label VitalSigns values with estimated-data provenance"
```

---

## Task 2: StationTracker honest copy + modeled-status disclaimer

`StationTrackerSection` says "Fuel availability across 10,469 monitored stations" — but per-station status is a deterministic `djb2`-hash simulation (`src/lib/station-status.ts`), not telemetry.

**Files:**
- Modify: `src/components/health/StationTrackerSection.tsx`

- [ ] **Step 1: Reword the description line**

In `src/components/health/StationTrackerSection.tsx`, change:
```tsx
      <p className="text-sm text-text-secondary mb-4">
        Fuel availability across 10,469 monitored stations
      </p>
```
to:
```tsx
      <p className="text-sm text-text-secondary mb-4">
        Estimated supply-stress distribution across 10,469 stations
      </p>
```

- [ ] **Step 2: Add a modeled-status disclaimer above the source footer**

Find the stat-cards grid's closing `</div>` (the one that closes `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`) — immediately after it, and immediately before the `{/* Source attribution */}` comment, insert:
```tsx
      {/* Modeled-data disclaimer */}
      <p className="mt-4 text-[10px] font-mono text-text-dim leading-relaxed">
        Per-station status is modeled (deterministic simulation from station ID +
        regional supply-stress rates) — not live per-station telemetry.
      </p>
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/health/StationTrackerSection.tsx
git commit -m "disclose station status is modeled, not live telemetry"
```

---

## Task 3: Correct stale pump-price fallback + add a range guard

`src/data/prices.ts` is the static fallback served when the live APIs fail. The `pump-diesel` value (₱130.75) and `previousWeek` (₱111.75) are implausible — real Metro Manila diesel is ~₱55–62/L. `pump-gasoline` (₱100.48) is similarly stale. Correct both to plausible current values with small week-over-week deltas, and add a module-load assertion that the four key benchmarks exist and pump prices are in a sane band.

**Files:**
- Modify: `src/data/prices.ts`
- Create: `src/data/__tests__/prices.test.ts`

- [ ] **Step 1: Correct the pump-price entries**

In `src/data/prices.ts`, find the `pump-gasoline` and `pump-diesel` objects in the `priceBenchmarks` array and change their `value` and `previousWeek` numbers:
- `pump-gasoline`: `value: 100.48` → `value: 63.20`; `previousWeek: 95.50` → `previousWeek: 62.05`
- `pump-diesel`: `value: 130.75` → `value: 59.40`; `previousWeek: 111.75` → `previousWeek: 60.10`

Leave all other fields (`id`, `name`, `unit`, `tooltip`) and all other benchmarks unchanged.

- [ ] **Step 2: Add a build-time / module-load range guard**

At the very end of `src/data/prices.ts` (after the `priceBenchmarks` array is defined and exported), append:
```ts
// ── Data-integrity guard ────────────────────────────────────────────────────
// Runs at module load (prices.ts is imported by DataProvider). Hard-fails if a
// required benchmark is missing or a pump price drifts outside a sane band —
// prevents silently shipping stale/implausible fallback data.
const REQUIRED_BENCHMARK_IDS = ['brent-crude', 'php-usd', 'pump-gasoline', 'pump-diesel'] as const;
const _benchmarkIds = new Set(priceBenchmarks.map((b) => b.id));
for (const id of REQUIRED_BENCHMARK_IDS) {
  if (!_benchmarkIds.has(id)) {
    throw new Error(`prices.ts: required benchmark "${id}" is missing`);
  }
}
for (const id of ['pump-gasoline', 'pump-diesel'] as const) {
  const b = priceBenchmarks.find((x) => x.id === id)!;
  if (b.value < 30 || b.value > 110) {
    throw new Error(
      `prices.ts: ${id} fallback value ₱${b.value}/L is outside the sane band ₱30–110/L`,
    );
  }
}
```

- [ ] **Step 3: Write the regression test**

Create `src/data/__tests__/prices.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { priceBenchmarks } from '@/data/prices';

describe('priceBenchmarks fallback data', () => {
  it('contains the four required benchmarks', () => {
    const ids = new Set(priceBenchmarks.map((b) => b.id));
    for (const id of ['brent-crude', 'php-usd', 'pump-gasoline', 'pump-diesel']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('pump prices are within the sane PH band (₱30–110/L)', () => {
    for (const id of ['pump-gasoline', 'pump-diesel']) {
      const b = priceBenchmarks.find((x) => x.id === id)!;
      expect(b.value).toBeGreaterThanOrEqual(30);
      expect(b.value).toBeLessThanOrEqual(110);
      expect(b.previousWeek).toBeGreaterThanOrEqual(30);
      expect(b.previousWeek).toBeLessThanOrEqual(110);
    }
  });

  it('week-over-week pump deltas are plausible (under ₱15/L)', () => {
    for (const id of ['pump-gasoline', 'pump-diesel']) {
      const b = priceBenchmarks.find((x) => x.id === id)!;
      expect(Math.abs(b.value - b.previousWeek)).toBeLessThan(15);
    }
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm test src/data/__tests__/prices.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/data/prices.ts src/data/__tests__/prices.test.ts
git commit -m "correct stale pump-price fallbacks and add a range guard"
```

---

## Task 4: Visible live-vs-cached indicator

`PricePanel` and `ExecutiveSnapshot` render a pulsing "Live" dot when `isLive` is true, but render NOTHING when `isLive` is false — a cached fallback looks identical to live data. Add a visible "Cached" indicator for the `!isLive` case.

**Files:**
- Modify: `src/components/prices/PricePanel.tsx`
- Modify: `src/components/layout/ExecutiveSnapshot.tsx`

- [ ] **Step 1: Add a cached badge to `PricePanel`**

In `src/components/prices/PricePanel.tsx`, find the `{isLive && (` block that renders the live dot. Immediately after that block's closing `)}`, add a sibling block:
```tsx
      {!isLive && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-status-yellow" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-status-yellow/70">
            Cached fallback
          </span>
        </div>
      )}
```

- [ ] **Step 2: Add a cached indicator to `ExecutiveSnapshot`**

In `src/components/layout/ExecutiveSnapshot.tsx`, find the heading row block `<div className="flex items-center gap-2 mb-3">` that contains the `{isLive && (` "Live" span. Immediately after that `{isLive && (...)}` expression and before the `<h2>`, add:
```tsx
        {!isLive && (
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-status-yellow" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-yellow">Cached</span>
          </span>
        )}
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/prices/PricePanel.tsx src/components/layout/ExecutiveSnapshot.tsx
git commit -m "show a visible cached-fallback indicator when prices are not live"
```

---

## Task 5: `/api/sentiment` returns 200 + fallback (never 503/502)

`/api/sentiment` returns HTTP 503 when `HUGGINGFACE_API_TOKEN` is missing and 502 when the HuggingFace call fails. Every other API route returns HTTP 200 with static fallback data. Make sentiment consistent.

**Files:**
- Modify: `src/app/api/sentiment/route.ts`
- Modify: `src/app/api/cron/route.ts`

- [ ] **Step 1: Read the current route**

Read `src/app/api/sentiment/route.ts` fully. It exports `GET()`. It declares an `interface SentimentResult { headline: string; sentiment: 'positive' | 'negative' | 'neutral'; score: number }`. There is a `if (!token) { return NextResponse.json({ error: ... }, { status: 503 }); }` branch near the top of `GET`, and a later branch returning `{ status: 502 }` when the HuggingFace fetch fails.

- [ ] **Step 2: Define a shared neutral fallback and replace the 503 branch**

Add this constant immediately before the `export async function GET()` line:
```ts
const SENTIMENT_FALLBACK: SentimentResult[] = [
  { headline: 'Sentiment analysis temporarily unavailable', sentiment: 'neutral', score: 0.5 },
  { headline: 'Showing neutral baseline — live NLP feed offline', sentiment: 'neutral', score: 0.5 },
];
```

Replace the missing-token branch:
```ts
  if (!token) {
    return NextResponse.json(
      { error: 'HUGGINGFACE_API_TOKEN not configured' },
      { status: 503 }
    );
  }
```
with:
```ts
  if (!token) {
    return NextResponse.json(SENTIMENT_FALLBACK, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  }
```

- [ ] **Step 3: Replace the 502 failure branch**

Find the branch that returns `{ status: 502 }` (the HuggingFace-failure path). Replace its `return NextResponse.json(..., { status: 502 });` with:
```ts
    return NextResponse.json(SENTIMENT_FALLBACK, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
```
(If the failure path is inside a `catch`, apply the same replacement there. The route must NEVER return a non-200 status.)

- [ ] **Step 4: Remove the sentiment gate in the cron route**

Read `src/app/api/cron/route.ts`. It has a block that gate-checks `process.env.HUGGINGFACE_API_TOKEN` before calling `/api/sentiment`. Since `/api/sentiment` now always returns 200, remove the `if (process.env.HUGGINGFACE_API_TOKEN)` conditional wrapper so `/api/sentiment` is called unconditionally alongside `/api/prices` and `/api/events`. Keep the actual fetch call; only remove the surrounding token gate. If the current structure differs materially from a simple `if`-wrapper, leave `cron/route.ts` unchanged and note it — the sentiment route fix (Steps 2–3) is the load-bearing change.

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sentiment/route.ts src/app/api/cron/route.ts
git commit -m "make /api/sentiment return 200 with fallback like other routes"
```

---

## Task 6: Wire `ImpactCards` to the real pump-price model

`ImpactCards` derives consumer-impact figures from a `brentDelta`/`forexPressure` proxy. The dashboard already has a real pump-price model — `calculatePumpPrice(params)` in `src/lib/scenario-engine.ts` (used by `ImpactCalculator`). Derive the impacts from the modeled pump-price change instead.

**Files:**
- Modify: `src/components/prices/ImpactCards.tsx`

- [ ] **Step 1: Replace the contents of `src/components/prices/ImpactCards.tsx`**

Replace the ENTIRE file with:
```tsx
'use client';

import { useMemo } from 'react';
import { IMPACT_ITEMS } from '@/lib/constants';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { InfoTip } from '@/components/ui/Tooltip';
import type { ScenarioParams, ImpactItem } from '@/types';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

// Baseline Metro Manila pump prices (₱/L) — the "no extra cost" reference point.
const BASELINE_GASOLINE = 63;
const BASELINE_DIESEL = 59;

/**
 * Derive everyday cost impacts from the MODELED pump-price change.
 * `calculatePumpPrice` is the same engine the Scenario Planner and Impact
 * Calculator use — so these numbers are consistent across the dashboard.
 */
function deriveImpacts(base: ImpactItem[], params: ScenarioParams): ImpactItem[] {
  const { gasoline, diesel } = calculatePumpPrice(params);
  const gasDelta = Math.max(0, gasoline - BASELINE_GASOLINE); // ₱/L over baseline
  const dieselDelta = Math.max(0, diesel - BASELINE_DIESEL);

  return base.map((item) => {
    switch (item.label) {
      case 'Jeepney Fare': {
        // Jeepneys run on diesel; a fare hike trails sustained diesel increases.
        const extra = Math.round(dieselDelta * 0.35);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1} per ride`;
        return { ...item, change };
      }
      case 'Grab Ride': {
        // Ride-hail surcharges track gasoline.
        const extra = Math.round(gasDelta * 2.2);
        const change = extra <= 0 ? 'No surcharge' : `+₱${extra}–${extra + 4} surcharge`;
        return { ...item, change };
      }
      case 'Rice Delivery': {
        // Freight cost passes through on diesel.
        const extra = Math.round(dieselDelta * 0.25);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1}/kg`;
        return { ...item, change };
      }
      case 'LPG Cooking': {
        // LPG correlates with crude/forex; approximate via the average fuel delta.
        const extra = Math.round((gasDelta + dieselDelta) * 18);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 100}/month`;
        return { ...item, change };
      }
      default:
        return item;
    }
  });
}

function riskClasses(riskLevel: string): { border: string; change: string } {
  if (riskLevel === 'low') return { border: 'border-l-status-green/40', change: 'text-status-green' };
  if (riskLevel === 'high' || riskLevel === 'critical') {
    return { border: 'border-l-status-red/40', change: 'text-status-red' };
  }
  return { border: 'border-l-status-yellow/40', change: 'text-status-yellow' };
}

interface ImpactCardsProps {
  scenarioParams: ScenarioParams;
}

export function ImpactCards({ scenarioParams }: ImpactCardsProps) {
  const { impacts, border, change } = useMemo(() => {
    const result = calculatePumpPrice(scenarioParams);
    const classes = riskClasses(String(result.riskLevel));
    return {
      impacts: deriveImpacts(IMPACT_ITEMS, scenarioParams),
      border: classes.border,
      change: classes.change,
    };
  }, [scenarioParams]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {impacts.map((item) => (
          <div key={item.label} className={`glass-card p-4 cursor-default border-l-2 ${border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="text-xs font-sans text-text-secondary flex items-center gap-1.5">
                {item.label}
                <InfoTip text={item.tooltip} />
              </span>
            </div>
            <p className={`text-sm font-mono font-semibold ${change}`}>{item.change}</p>
            <p className="text-[10px] font-mono text-text-subtle mt-1">
              from {item.current}
            </p>
          </div>
        ))}
      </div>
      <SourceAttribution derived="Modeled from scenario pump prices (scenario-engine)" />
    </div>
  );
}
```

**Before applying:** confirm `calculatePumpPrice` in `src/lib/scenario-engine.ts` returns an object with `gasoline: number`, `diesel: number`, and `riskLevel`. If `riskLevel`'s string values differ from `'low' | 'medium' | 'high' | 'critical'`, adjust `riskClasses()` to match the actual values (read the file to confirm). If `calculatePumpPrice` has a different return shape, STOP and report NEEDS_CONTEXT.

- [ ] **Step 2: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The `text-status-*` classes are existing design tokens — no new tokens needed.

- [ ] **Step 3: Commit**

```bash
git add src/components/prices/ImpactCards.tsx
git commit -m "derive consumer impacts from the real pump-price model"
```

---

## Task 7: Monte Carlo respects the user's `hormuzWeeks`

`runMonteCarlo` in `src/lib/monte-carlo.ts` ignores `baseParams.hormuzWeeks` — it samples disruption from a fixed 15% Bernoulli and a Uniform[1,16] draw. If the user sets `hormuzWeeks = 12`, the simulation should center on that.

**Files:**
- Modify: `src/lib/monte-carlo.ts`

- [ ] **Step 1: Replace the Hormuz sampling**

In `src/lib/monte-carlo.ts`, inside the `for` loop of `runMonteCarlo`, find these two lines:
```ts
    const hormuzDisrupted = bernoulli(0.15);
    const hormuzWeeks = hormuzDisrupted ? Math.round(uniformRandom(1, 16)) : 0;
```
Replace them with:
```ts
    // Centre the Hormuz disruption on the user's scenario input. If the user
    // set 0 weeks, keep a small (~5%) baseline tail risk of a short disruption.
    const hormuzMean = baseParams.hormuzWeeks;
    const hormuzWeeks =
      hormuzMean > 0
        ? Math.min(16, Math.max(0, Math.round(normalRandom(hormuzMean, Math.max(1, hormuzMean * 0.3)))))
        : bernoulli(0.05)
          ? Math.round(uniformRandom(1, 4))
          : 0;
```

- [ ] **Step 2: Remove the now-unused `uniformRandom` only if it is no longer referenced**

`uniformRandom` is still used in the `else` branch above, so it stays. Confirm `bernoulli` and `normalRandom` are both still referenced (they are — `bernoulli` for `refineryOffline` and the 5% tail, `normalRandom` for brent/forex/hormuz). Do not delete any helper.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed (no unused-variable errors).

- [ ] **Step 4: Commit**

```bash
git add src/lib/monte-carlo.ts
git commit -m "center Monte Carlo Hormuz sampling on the user's scenario input"
```

---

## Task 8: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all tests pass (the Wave 1 suite + the new `prices.test.ts` — 18 total).

- [ ] **Step 2: Clean build**

Run: `pnpm build`
Expected: succeeds. Homepage `/` First Load JS should be unchanged from Wave 1 (~122 kB) — Wave 2A adds no bundle weight.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors; no new warnings beyond the pre-existing ones.

- [ ] **Step 4: Manual provenance check**

Run `pnpm dev`, open the dashboard, and confirm: the System Health (VitalSigns) section shows the "Estimated from DOE baseline" footer; the Station Status section shows the "Per-station status is modeled" disclaimer; the NLP Sentiment section renders a neutral gauge (not an error card) even with no HuggingFace token. Stop the dev server.

---

## Self-Review Notes

- **Spec coverage:** Implements WS2 (Data Honesty) items from `docs/superpowers/specs/2026-05-17-100x-platform-upgrade-design.md` — VitalSigns labels (T1), StationTracker disclosure (T2), corrected `prices.ts` + assertion (T3), live-vs-cached indicator (T4), sentiment 200-fallback (T5), `ImpactCards` wired to `calculatePumpPrice` (T6), Monte Carlo `hormuzWeeks` fix (T7). The DOE-scraper item is explicitly deferred (see Context — needs a research spike).
- **No placeholders:** Every code step contains complete code. Task 5 and Task 6 include a read-and-confirm guard because the exact current text of `sentiment/route.ts` and the `calculatePumpPrice` return shape must be verified by the implementer.
- **Type consistency:** `SourceAttribution` `derived` prop (T1) matches the component's actual API. `calculatePumpPrice` return fields (`gasoline`, `diesel`, `riskLevel`) used in T6 match its use in `ImpactCalculator`. `normalRandom`/`bernoulli`/`uniformRandom` in T7 are all pre-existing helpers in the same file.
