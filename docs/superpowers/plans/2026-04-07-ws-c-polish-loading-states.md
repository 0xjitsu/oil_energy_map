# WS-C: Polish & Loading States — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loading skeletons, error boundaries, staggered animations, empty states, and data source attribution — the finishing touches that separate "cool project" from "award submission."

**Architecture:** Reusable skeleton primitives, Next.js error boundary, IntersectionObserver-based stagger animations, and source attribution footers on all data cards.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, CSS custom properties

---

## Task 1: Create Skeleton Primitives

**File:** `src/components/ui/Skeleton.tsx` (NEW)

Create reusable skeleton building blocks that all loading components compose from. All primitives use `animate-pulse` with the project's glass-card aesthetic.

- [ ] Create `src/components/ui/Skeleton.tsx` with the following full content:

```tsx
'use client';

/**
 * Skeleton primitives for loading states.
 * Compose these to build component-specific skeleton loaders.
 */

function SkeletonBar({
  width = '100%',
  height = '12px',
  className = '',
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-border-subtle ${className}`}
      style={{ width, height }}
    />
  );
}

function SkeletonCircle({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-full bg-border-subtle ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function SkeletonCard({
  minH = '120px',
  className = '',
  children,
}: {
  minH?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`glass-card p-4 ${className}`}
      style={{ minHeight: minH }}
    >
      {children ?? (
        <div className="space-y-3">
          <SkeletonBar width="40%" height="10px" />
          <SkeletonBar width="60%" height="24px" />
          <SkeletonBar width="80%" height="10px" />
          <SkeletonBar width="100%" height="40px" />
        </div>
      )}
    </div>
  );
}

/* ─── Component-specific skeleton loaders ─── */

/** PricePanel: 6 benchmark cards in a 2x3 grid */
export function PricePanelSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ minHeight: '320px' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} minH="140px">
          <div className="space-y-3">
            <SkeletonBar width="50%" height="10px" />
            <SkeletonBar width="70%" height="28px" />
            <SkeletonBar width="40%" height="12px" />
            <SkeletonBar width="100%" height="48px" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/** ScenarioPlanner: 4 slider rows + result panel */
export function ScenarioPlannerSkeleton() {
  return (
    <div className="glass-card p-6 space-y-6" style={{ minHeight: '400px' }}>
      <SkeletonBar width="30%" height="14px" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBar width="25%" height="10px" />
            <SkeletonBar width="15%" height="10px" />
          </div>
          <SkeletonBar width="100%" height="4px" />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <SkeletonCard minH="80px" />
        <SkeletonCard minH="80px" />
      </div>
    </div>
  );
}

/** MarketShare: donut circle + legend */
export function MarketShareSkeleton() {
  return (
    <div className="glass-card p-4" style={{ minHeight: '300px' }}>
      <SkeletonBar width="40%" height="10px" className="mb-4" />
      <div className="flex flex-col items-center gap-4">
        <SkeletonCircle size={180} />
        <div className="w-full space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonCircle size={10} />
              <SkeletonBar width="60%" height="10px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** PlayerCards: 3 player cards */
export function PlayerCardsSkeleton() {
  return (
    <div className="space-y-3" style={{ minHeight: '300px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} minH="88px">
          <div className="flex items-center gap-3">
            <SkeletonCircle size={36} />
            <div className="flex-1 space-y-2">
              <SkeletonBar width="50%" height="14px" />
              <SkeletonBar width="80%" height="10px" />
              <SkeletonBar width="100%" height="6px" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/** ImpactCalculator: persona selector + result cards */
export function ImpactCalculatorSkeleton() {
  return (
    <div className="space-y-4" style={{ minHeight: '320px' }}>
      <div className="glass-card p-4">
        <SkeletonBar width="35%" height="10px" className="mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} minH="60px">
              <div className="space-y-2">
                <SkeletonBar width="50%" height="20px" />
                <SkeletonBar width="70%" height="10px" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
      <SkeletonCard minH="100px" />
    </div>
  );
}

/** StressTest: 4 risk category cards */
export function StressTestSkeleton() {
  return (
    <div className="space-y-4" style={{ minHeight: '320px' }}>
      <div className="glass-card p-4">
        <SkeletonBar width="30%" height="10px" className="mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} minH="72px">
              <div className="space-y-2">
                <SkeletonBar width="40%" height="10px" />
                <SkeletonBar width="60%" height="20px" />
                <SkeletonBar width="100%" height="6px" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/** TimelineScrubber: slider bar */
export function TimelineScrubberSkeleton() {
  return (
    <div className="glass-card p-4" style={{ minHeight: '80px' }}>
      <div className="flex items-center gap-3">
        <SkeletonBar width="15%" height="10px" />
        <SkeletonBar width="100%" height="4px" />
        <SkeletonBar width="15%" height="10px" />
      </div>
    </div>
  );
}

/** HowToGuide: overlay skeleton (low priority) */
export function HowToGuideSkeleton() {
  return null; // Guide appears on demand, no visible skeleton needed
}

export { SkeletonBar, SkeletonCircle, SkeletonCard };
```

- [ ] Verify the file has no TypeScript errors: `pnpm tsc --noEmit`

---

## Task 2: Add Skeleton Loaders to All dynamic() Imports

**File:** `src/app/page.tsx` (MODIFY)

Wire each skeleton into the `dynamic()` `loading` option so users see shaped placeholders instead of blank space during chunk load.

- [ ] Add import for skeleton components at the top of `page.tsx`:

**old_string:**
```tsx
import type { MapMode, ScenarioParams } from '@/types';
```

**new_string:**
```tsx
import type { MapMode, ScenarioParams } from '@/types';
import {
  PricePanelSkeleton,
  ScenarioPlannerSkeleton,
  MarketShareSkeleton,
  PlayerCardsSkeleton,
  ImpactCalculatorSkeleton,
  StressTestSkeleton,
  TimelineScrubberSkeleton,
  HowToGuideSkeleton,
} from '@/components/ui/Skeleton';
```

- [ ] Replace each `dynamic()` call to include a `loading` component:

**old_string:**
```tsx
const PricePanel = dynamic(
  () => import('@/components/prices/PricePanel').then((m) => m.PricePanel),
  { ssr: false },
);
```

**new_string:**
```tsx
const PricePanel = dynamic(
  () => import('@/components/prices/PricePanel').then((m) => m.PricePanel),
  { ssr: false, loading: () => <PricePanelSkeleton /> },
);
```

**old_string:**
```tsx
const ScenarioPlanner = dynamic(
  () => import('@/components/scenarios/ScenarioPlanner').then((m) => m.ScenarioPlanner),
  { ssr: false },
);
```

**new_string:**
```tsx
const ScenarioPlanner = dynamic(
  () => import('@/components/scenarios/ScenarioPlanner').then((m) => m.ScenarioPlanner),
  { ssr: false, loading: () => <ScenarioPlannerSkeleton /> },
);
```

**old_string:**
```tsx
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false },
);
```

**new_string:**
```tsx
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false, loading: () => <MarketShareSkeleton /> },
);
```

**old_string:**
```tsx
const PlayerCards = dynamic(
  () => import('@/components/players/PlayerCards').then((m) => m.PlayerCards),
  { ssr: false },
);
```

**new_string:**
```tsx
const PlayerCards = dynamic(
  () => import('@/components/players/PlayerCards').then((m) => m.PlayerCards),
  { ssr: false, loading: () => <PlayerCardsSkeleton /> },
);
```

**old_string:**
```tsx
const ImpactCalculator = dynamic(
  () => import('@/components/consumer/ImpactCalculator').then((m) => m.ImpactCalculator),
  { ssr: false },
);
```

**new_string:**
```tsx
const ImpactCalculator = dynamic(
  () => import('@/components/consumer/ImpactCalculator').then((m) => m.ImpactCalculator),
  { ssr: false, loading: () => <ImpactCalculatorSkeleton /> },
);
```

**old_string:**
```tsx
const StressTest = dynamic(
  () => import('@/components/scenarios/StressTest').then((m) => m.StressTest),
  { ssr: false },
);
```

**new_string:**
```tsx
const StressTest = dynamic(
  () => import('@/components/scenarios/StressTest').then((m) => m.StressTest),
  { ssr: false, loading: () => <StressTestSkeleton /> },
);
```

**old_string:**
```tsx
const TimelineScrubber = dynamic(
  () => import('@/components/timeline/TimelineScrubber').then((m) => m.TimelineScrubber),
  { ssr: false },
);
```

**new_string:**
```tsx
const TimelineScrubber = dynamic(
  () => import('@/components/timeline/TimelineScrubber').then((m) => m.TimelineScrubber),
  { ssr: false, loading: () => <TimelineScrubberSkeleton /> },
);
```

**old_string:**
```tsx
const HowToGuide = dynamic(
  () => import('@/components/onboarding/HowToGuide').then((m) => m.HowToGuide),
  { ssr: false },
);
```

**new_string:**
```tsx
const HowToGuide = dynamic(
  () => import('@/components/onboarding/HowToGuide').then((m) => m.HowToGuide),
  { ssr: false, loading: () => <HowToGuideSkeleton /> },
);
```

- [ ] Run `pnpm build` to verify no CLS regressions or import errors

---

## Task 3: Create Error Boundary

**File:** `src/app/error.tsx` (NEW)

Next.js App Router error boundary with glass-card styling and NERV-aesthetic messaging. This catches runtime errors in any route segment and provides a retry mechanism.

- [ ] Create `src/app/error.tsx` with the following full content:

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SYSTEM ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="glass-card max-w-lg w-full p-8 text-center space-y-6">
        {/* NERV-style status header */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-status-red">
            System Error — Pattern Blue
          </p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-status-red/30 to-transparent" />
        </div>

        {/* Error message */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-text-primary font-mono tracking-tight">
            Module Failed to Load
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            A dashboard section encountered an error and could not render.
            The rest of the system remains operational.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-text-muted">
              Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Retry button */}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                     bg-status-red/10 border border-status-red/20
                     text-status-red text-sm font-mono uppercase tracking-wider
                     transition-all duration-200
                     hover:bg-status-red/20 hover:border-status-red/30
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-red
                     min-h-[44px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          Retry Module
        </button>

        {/* Bottom divider with muted status */}
        <div className="space-y-2 pt-2">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
          <p className="text-[10px] font-mono text-text-dim">
            PH Oil Intelligence Dashboard — Graceful Degradation Active
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Verify the error boundary renders correctly by temporarily throwing in a component
- [ ] Confirm `pnpm build` passes

---

## Task 4: Add Staggered Scroll Animations

**Files:** `src/components/ui/FadeIn.tsx` (NEW), `src/app/globals.css` (MODIFY), `src/app/page.tsx` (MODIFY)

Create an IntersectionObserver-based `<FadeIn>` wrapper component that triggers entrance animations as sections scroll into view. SSR-safe: checks viewport on mount instead of defaulting to `opacity: 0`.

### 4a. Create the FadeIn component

- [ ] Create `src/components/ui/FadeIn.tsx` with the following full content:

```tsx
'use client';

import { useRef, useState, useEffect } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  /** Stagger delay in ms — only used for above-fold orchestrated sequence */
  delay?: number;
  className?: string;
}

/**
 * IntersectionObserver-based fade-in wrapper.
 *
 * SSR-safe: starts visible (opacity 1), then on mount checks if the element
 * is already in the viewport. If it IS in view, stays visible. If it is NOT
 * in view, sets pending state and waits for intersection to trigger animation.
 *
 * Respects prefers-reduced-motion — skips animation entirely.
 */
export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'pending' | 'visible'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion — show immediately
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setState('visible');
      return;
    }

    // Check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;

    if (inView) {
      // Above-fold: apply delay for orchestrated stagger
      if (delay > 0) {
        setState('pending');
        const timer = setTimeout(() => setState('visible'), delay);
        return () => clearTimeout(timer);
      }
      setState('visible');
      return;
    }

    // Below-fold: set pending and wait for intersection
    setState('pending');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`fade-in-section ${state === 'pending' ? 'pending' : state === 'visible' ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
```

### 4b. Add stagger CSS utilities to globals.css

- [ ] Append stagger utilities to `src/app/globals.css`:

**old_string:**
```css
/* Ensure main content doesn't hide behind bottom nav */
@media (max-width: 1279px) {
  main {
    padding-bottom: 80px;
  }
}
```

**new_string:**
```css
/* Skeleton pulse — uses design token bg */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Ensure main content doesn't hide behind bottom nav */
@media (max-width: 1279px) {
  main {
    padding-bottom: 80px;
  }
}
```

### 4c. Wrap page sections in FadeIn

- [ ] Add FadeIn import to `src/app/page.tsx`:

**old_string:**
```tsx
import {
  PricePanelSkeleton,
```

**new_string:**
```tsx
import { FadeIn } from '@/components/ui/FadeIn';
import {
  PricePanelSkeleton,
```

- [ ] Wrap the Executive Snapshot (LCP, 0ms delay):

**old_string:**
```tsx
        {/* Executive Snapshot — Hero KPIs */}
        <div id="snapshot" className="scroll-mt-20">
          <ExecutiveSnapshot scenarioParams={scenarioParams} />
        </div>
```

**new_string:**
```tsx
        {/* Executive Snapshot — Hero KPIs */}
        <FadeIn delay={0}>
          <div id="snapshot" className="scroll-mt-20">
            <ExecutiveSnapshot scenarioParams={scenarioParams} />
          </div>
        </FadeIn>
```

- [ ] Wrap the Map section (100ms delay):

**old_string:**
```tsx
        {/* Hero: Full-Width Map */}
        <section id="map" className="scroll-mt-20">
```

**new_string:**
```tsx
        {/* Hero: Full-Width Map */}
        <FadeIn delay={100}>
        <section id="map" className="scroll-mt-20">
```

And close the FadeIn after the `</section>`:

**old_string:**
```tsx
            <TimelineScrubber visible={mapMode === 'timeline'} />
          </div>
        </section>
```

**new_string:**
```tsx
            <TimelineScrubber visible={mapMode === 'timeline'} />
          </div>
        </section>
        </FadeIn>
```

- [ ] Wrap all Act Dividers and below-fold sections in `<FadeIn>` (no delay — triggered by IntersectionObserver):

**old_string:**
```tsx
        {/* ━━━ ACT 2: WHAT IT COSTS ━━━ */}
        <ActDivider
          number="02"
          title="What It Costs"
          description="Pump prices, price benchmarks, and where to fill up — the direct impact on your wallet and the stations near you."
        />
```

**new_string:**
```tsx
        {/* ━━━ ACT 2: WHAT IT COSTS ━━━ */}
        <FadeIn>
        <ActDivider
          number="02"
          title="What It Costs"
          description="Pump prices, price benchmarks, and where to fill up — the direct impact on your wallet and the stations near you."
        />
        </FadeIn>
```

**old_string:**
```tsx
        {/* ━━━ ACT 3: WHAT-IF ANALYSIS ━━━ */}
        <ActDivider
          number="03"
          title="What-If Analysis"
          description="Model disruption scenarios, stress-test the supply chain, and estimate the consumer impact of price shocks."
        />
```

**new_string:**
```tsx
        {/* ━━━ ACT 3: WHAT-IF ANALYSIS ━━━ */}
        <FadeIn>
        <ActDivider
          number="03"
          title="What-If Analysis"
          description="Model disruption scenarios, stress-test the supply chain, and estimate the consumer impact of price shocks."
        />
        </FadeIn>
```

**old_string:**
```tsx
        {/* ━━━ ACT 4: WHO'S INVOLVED ━━━ */}
        <ActDivider
          number="04"
          title="Who's Involved"
          description="Market players, system health indicators, sentiment analysis, and the latest intelligence from news and social feeds."
        />
```

**new_string:**
```tsx
        {/* ━━━ ACT 4: WHO'S INVOLVED ━━━ */}
        <FadeIn>
        <ActDivider
          number="04"
          title="Who's Involved"
          description="Market players, system health indicators, sentiment analysis, and the latest intelligence from news and social feeds."
        />
        </FadeIn>
```

- [ ] Run `pnpm build` to verify all wrappers work
- [ ] Visually verify: above-fold sections appear immediately, below-fold sections fade in on scroll
- [ ] Verify `prefers-reduced-motion` skips all animations (test in Chrome DevTools > Rendering)

---

## Task 5: Add Source Attribution Footers and Empty States

**Files:** Multiple component files (MODIFY), `src/components/ui/SourceAttribution.tsx` (NEW), `src/components/ui/EmptyState.tsx` (NEW)

### 5a. Create the SourceAttribution component

- [ ] Create `src/components/ui/SourceAttribution.tsx` with the following full content:

```tsx
'use client';

/**
 * Subtle data source footer for glass-card panels.
 * Matches the project's design-token label pattern.
 */
export function SourceAttribution({
  source,
  updated,
  derived,
}: {
  /** e.g. "Yahoo Finance", "DOE Oil Monitor" */
  source?: string;
  /** Recency string, e.g. "Updated 3m ago", "Week of Mar 24" */
  updated?: string;
  /** For calculated values, e.g. "Derived from Brent + Forex" */
  derived?: string;
}) {
  const label = derived
    ? derived
    : [source, updated].filter(Boolean).join(' \u00B7 ');

  if (!label) return null;

  return (
    <p className="text-[10px] font-mono text-text-muted mt-3 pt-2 border-t border-border-subtle">
      {derived ? label : `Source: ${label}`}
    </p>
  );
}

/**
 * Helper: format a Date into a relative "Updated Xm ago" string.
 */
export function formatRecency(date: Date | null | undefined): string {
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'Updated just now';
  if (diffMin < 60) return `Updated ${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Updated ${diffHr}h ago`;
  return `Updated ${Math.round(diffHr / 24)}d ago`;
}
```

### 5b. Create the EmptyState component

- [ ] Create `src/components/ui/EmptyState.tsx` with the following full content:

```tsx
'use client';

/**
 * Empty state placeholder for when data feeds are unavailable.
 * Maintains glass-card dimensions to prevent layout shift.
 */
export function EmptyState({
  icon,
  message,
  timestamp,
  minH = '120px',
}: {
  /** Muted icon character or emoji */
  icon?: string;
  /** Primary message */
  message: string;
  /** Optional timestamp for "last known" states */
  timestamp?: Date | null;
  /** Minimum height to prevent CLS */
  minH?: string;
}) {
  return (
    <div
      className="glass-card flex flex-col items-center justify-center gap-3 p-6 text-center"
      style={{ minHeight: minH }}
    >
      {icon && (
        <span className="text-2xl text-text-dim" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="text-sm text-text-secondary font-sans max-w-xs">
        {message}
      </p>
      {timestamp && (
        <p className="text-[10px] font-mono text-text-muted">
          Last known: {timestamp.toLocaleString()}
        </p>
      )}
    </div>
  );
}
```

### 5c. Add source attribution to PricePanel

- [ ] Modify `src/components/prices/PricePanel.tsx` — add import and attribution footer:

**old_string:**
```tsx
import { InfoTip } from '@/components/ui/Tooltip';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
```

**new_string:**
```tsx
import { InfoTip } from '@/components/ui/Tooltip';
import { SourceAttribution, formatRecency } from '@/components/ui/SourceAttribution';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
```

Then, find the component's return statement and add attribution footer inside the outermost container. The exact edit depends on PricePanel's structure, but the pattern is:

At the bottom of PricePanel's main wrapper (before the closing `</div>` or `</section>`), add:

```tsx
<SourceAttribution
  source={isLive ? 'Yahoo Finance + FloatRates' : 'Static fallback data'}
  updated={isLive ? formatRecency(lastUpdated) : undefined}
/>
```

**Note:** `usePrices()` already returns `{ isLive, lastUpdated }` — destructure these if not already.

### 5d. Add source attribution to EventTimeline

- [ ] Modify `src/components/health/EventTimeline.tsx`:

Add import:
```tsx
import { SourceAttribution, formatRecency } from '@/components/ui/SourceAttribution';
import { EmptyState } from '@/components/ui/EmptyState';
```

At the bottom of the main wrapper, add:
```tsx
<SourceAttribution
  source={isLive ? 'RSS Intelligence Feeds' : 'Cached events'}
  updated={isLive ? formatRecency(lastUpdated) : undefined}
/>
```

If events array is empty, render:
```tsx
<EmptyState
  icon="\u{1F4E1}"
  message="No intelligence feeds available — monitoring offline sources"
  minH="200px"
/>
```

### 5e. Add source attribution to SentimentGauge

- [ ] Modify `src/components/health/SentimentGauge.tsx`:

Add import:
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

At the bottom of the main wrapper, add:
```tsx
<SourceAttribution source="NLP Sentiment Analysis" updated="Polled every 15m" />
```

### 5f. Add source attribution to ImpactCards and PumpPrices

- [ ] Modify `src/components/prices/ImpactCards.tsx`:

Add:
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

At bottom of main wrapper:
```tsx
<SourceAttribution derived="Derived from Brent + Forex" />
```

- [ ] Modify `src/components/prices/PumpPrices.tsx`:

Add:
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

At bottom of main wrapper:
```tsx
<SourceAttribution source="DOE Oil Monitor" updated="Weekly SRP update" />
```

### 5g. Add source attribution to MarketShare and PlayerCards

- [ ] Modify `src/components/players/MarketShare.tsx`:

Add:
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

At bottom of wrapper:
```tsx
<SourceAttribution source="Industry estimates" updated="Annual market data" />
```

- [ ] Modify `src/components/players/PlayerCards.tsx`:

Add:
```tsx
import { SourceAttribution } from '@/components/ui/SourceAttribution';
```

At bottom of wrapper:
```tsx
<SourceAttribution source="Company filings + DOE data" />
```

### 5h. Add empty state for Station Tracker

- [ ] Modify `src/components/health/StationTrackerSection.tsx` — add empty state when station data is loading:

Add:
```tsx
import { EmptyState } from '@/components/ui/EmptyState';
```

If stations data is empty/loading, render:
```tsx
<EmptyState
  icon="\u{26FD}"
  message="Station data loading..."
  minH="200px"
/>
```

- [ ] Run `pnpm build` to verify all modifications compile
- [ ] Visually verify: each data card shows a subtle source line at the bottom
- [ ] Verify empty states appear when API endpoints are unreachable (e.g., disconnect network)

---

## Verification Checklist

After all 5 tasks are complete, verify the following acceptance criteria:

- [ ] **Loading states:** Navigating to the dashboard shows skeletons before dynamic components load (throttle network in DevTools to observe)
- [ ] **Error resilience:** Add `throw new Error('test')` inside a dynamic component — only that section breaks, the rest renders
- [ ] **Stagger animation:** Above-fold sections appear immediately with orchestrated delay; below-fold sections animate on scroll
- [ ] **Reduced motion:** Enable `prefers-reduced-motion: reduce` in DevTools Rendering — all animations skip, content appears instantly
- [ ] **Source attribution:** Every data card has a `text-[10px] font-mono text-text-muted` source footer
- [ ] **Empty states:** When events/prices/stations are unavailable, contextual empty messages appear
- [ ] **No CLS:** Skeleton `min-h` values prevent layout shifts (run Lighthouse performance audit)
- [ ] **Build passes:** `pnpm build` completes with zero errors
- [ ] **No new dependencies:** Only uses existing packages (React, Next.js, Tailwind)
