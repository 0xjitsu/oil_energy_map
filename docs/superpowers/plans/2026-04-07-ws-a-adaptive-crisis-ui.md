# WS-A: Adaptive Crisis UI System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a CSS custom property system that shifts the entire dashboard aesthetic based on aggregate risk score — from calm/professional to tense/alert to full NERV crisis mode.

**Architecture:** React context provider computes crisis score from events + scenario params, sets discrete CSS token overrides on `<html>`. CSS transitions handle smooth visual shifts. No JS animation libraries.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, CSS custom properties, React Context

---

## Task 1: Crisis Score Computation

**File:** `src/lib/crisisLevel.ts` (new file)

**What:** Pure function that computes a 0-100 crisis score from events and scenario params, plus a helper that maps score to discrete level.

- [ ] Create `src/lib/crisisLevel.ts` with the full code below
- [ ] Verify the file imports `TimelineEvent` and `ScenarioParams` from `@/types`
- [ ] Verify the function is pure (no side effects, no hooks, no DOM access)

### Full code for `src/lib/crisisLevel.ts`

```ts
import type { TimelineEvent, ScenarioParams } from '@/types';

export type CrisisLevel = 'CALM' | 'ELEVATED' | 'CRISIS';

export interface CrisisTokens {
  '--accent-primary': string;
  '--bg-card-crisis': string;
  '--border-crisis': string;
  '--scan-line-opacity': string;
}

const TOKEN_MAP: Record<CrisisLevel, CrisisTokens> = {
  CALM: {
    '--accent-primary': '#3b82f6',
    '--bg-card-crisis': 'rgba(10, 15, 26, 0.7)',
    '--border-crisis': 'rgba(255,255,255,0.06)',
    '--scan-line-opacity': '0',
  },
  ELEVATED: {
    '--accent-primary': '#f59e0b',
    '--bg-card-crisis': 'rgba(20, 15, 10, 0.7)',
    '--border-crisis': 'rgba(245,158,11,0.15)',
    '--scan-line-opacity': '0',
  },
  CRISIS: {
    '--accent-primary': '#ef4444',
    '--bg-card-crisis': 'rgba(30, 10, 10, 0.7)',
    '--border-crisis': 'rgba(239,68,68,0.2)',
    '--scan-line-opacity': '0.03',
  },
};

/**
 * Compute aggregate crisis score from events + scenario params.
 *
 * Formula:
 * - redEventCount x 8 (max 40)
 * - yellowEventCount x 2 (max 20)
 * - brentDelta as % change from previousWeek, clamped [0, 20]
 * - hormuzWeeks mapped linearly to [0, 20] (0 weeks = 0, 4+ weeks = 20)
 *
 * Total = min(100, sum). Default 25 on error.
 */
export function computeCrisisScore(
  events: TimelineEvent[],
  scenarioParams: ScenarioParams,
  brentPreviousWeek: number,
): number {
  try {
    const redCount = events.filter((e) => e.severity === 'red').length;
    const yellowCount = events.filter((e) => e.severity === 'yellow').length;

    const redPoints = Math.min(redCount * 8, 40);
    const yellowPoints = Math.min(yellowCount * 2, 20);

    // Brent delta: % change from previous week, clamped to [0, 20]
    const brentDelta =
      brentPreviousWeek > 0
        ? Math.abs((scenarioParams.brentPrice - brentPreviousWeek) / brentPreviousWeek) * 100
        : 0;
    const brentPoints = Math.min(brentDelta, 20);

    // Hormuz weeks: linear map 0-4+ weeks to 0-20
    const hormuzPoints = Math.min((scenarioParams.hormuzWeeks / 4) * 20, 20);

    return Math.min(100, Math.round(redPoints + yellowPoints + brentPoints + hormuzPoints));
  } catch {
    return 25; // CALM fallback
  }
}

export function getCrisisLevel(score: number): CrisisLevel {
  if (score >= 61) return 'CRISIS';
  if (score >= 31) return 'ELEVATED';
  return 'CALM';
}

export function getCrisisTokens(level: CrisisLevel): CrisisTokens {
  return TOKEN_MAP[level];
}
```

---

## Task 2: CrisisProvider Context

**File:** `src/lib/CrisisProvider.tsx` (new file)

**What:** React context provider that consumes events + scenario params, computes crisis level, and sets CSS custom property overrides on the `<html>` element. Exposes `crisisLevel` and `crisisScore` to descendants.

- [ ] Create `src/lib/CrisisProvider.tsx` with the full code below
- [ ] Verify it uses `'use client'` directive (required for hooks and DOM access)
- [ ] Verify it sets style properties on `document.documentElement`, not `document.body`
- [ ] Verify it exports both `CrisisProvider` and `useCrisis` hook

### Full code for `src/lib/CrisisProvider.tsx`

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { usePrices } from '@/hooks/usePrices';
import {
  computeCrisisScore,
  getCrisisLevel,
  getCrisisTokens,
  type CrisisLevel,
} from '@/lib/crisisLevel';
import type { ScenarioParams } from '@/types';

interface CrisisContextValue {
  crisisLevel: CrisisLevel;
  crisisScore: number;
}

const CrisisContext = createContext<CrisisContextValue>({
  crisisLevel: 'CALM',
  crisisScore: 25,
});

export function useCrisis() {
  return useContext(CrisisContext);
}

interface CrisisProviderProps {
  children: ReactNode;
  scenarioParams: ScenarioParams;
}

export function CrisisProvider({ children, scenarioParams }: CrisisProviderProps) {
  const { events } = useEvents();
  const { priceBenchmarks } = usePrices();

  // Find Brent previous week value from price benchmarks
  const brentPreviousWeek = useMemo(() => {
    const brent = priceBenchmarks.find((p) => p.id === 'brent-crude');
    return brent?.previousWeek ?? 0;
  }, [priceBenchmarks]);

  const crisisScore = useMemo(
    () => computeCrisisScore(events, scenarioParams, brentPreviousWeek),
    [events, scenarioParams, brentPreviousWeek],
  );

  const crisisLevel = useMemo(() => getCrisisLevel(crisisScore), [crisisScore]);

  // Apply token overrides to <html> element
  useEffect(() => {
    const tokens = getCrisisTokens(crisisLevel);
    const html = document.documentElement;

    Object.entries(tokens).forEach(([prop, value]) => {
      html.style.setProperty(prop, value);
    });

    // Set data attribute for CSS selectors (scan lines, angular accents)
    html.dataset.crisisLevel = crisisLevel.toLowerCase();

    return () => {
      // Clean up on unmount
      Object.keys(tokens).forEach((prop) => {
        html.style.removeProperty(prop);
      });
      delete html.dataset.crisisLevel;
    };
  }, [crisisLevel]);

  const value = useMemo(
    () => ({ crisisLevel, crisisScore }),
    [crisisLevel, crisisScore],
  );

  return (
    <CrisisContext.Provider value={value}>
      {children}
    </CrisisContext.Provider>
  );
}
```

**Important note:** The `CrisisProvider` accepts `scenarioParams` as a prop. Since the scenario state lives in `page.tsx` (via `useState`), the provider must be placed *inside* the page component tree, not in `layout.tsx`. However, the CSS transitions and `data-crisis-level` attribute must be set on `<html>`, which the provider does via `document.documentElement`. See Task 4 for how this is wired up.

**Alternative approach (chosen):** Wrap `CrisisProvider` in `layout.tsx` with *default* scenario params. The page-level `ScenarioPlanner` can update crisis score via a separate mechanism. But since the crisis system should react to the page's scenario params which change via user interaction, the provider needs to live where `scenarioParams` state is accessible.

**Final decision:** Place a `CrisisShell` wrapper client component in `layout.tsx` that provides default scenario params. The page component can override crisis params by rendering a nested `CrisisProvider` (React context nesting gives the inner provider precedence). However, this adds complexity. The simpler approach: place `CrisisProvider` in `page.tsx` where `scenarioParams` already lives, and have `layout.tsx` only add the CSS transition rule on `:root`. See Task 4 for the final wiring.

---

## Task 3: CSS Crisis Tokens + Scan Lines + Angular Accents

**Files:** `src/app/globals.css` (modify), `tailwind.config.ts` (modify)

**What:** Add new CSS custom properties with CALM defaults, CSS transition on `:root`, scan line overlay on `body`, angular accent pseudo-elements on `.glass-card`, and a global `prefers-reduced-motion` blanket rule.

### Step 3a: Add crisis tokens to `:root` in globals.css

- [ ] Add crisis token defaults to `:root` block

**Old string:**
```css
  --ph-yellow: #fcd116;
}
```

**New string:**
```css
  --ph-yellow: #fcd116;

  /* Crisis UI tokens — overridden by CrisisProvider */
  --accent-primary: #3b82f6;
  --bg-card-crisis: rgba(10, 15, 26, 0.7);
  --border-crisis: rgba(255, 255, 255, 0.06);
  --scan-line-opacity: 0;
}
```

### Step 3b: Add CSS transition on `:root` for smooth level shifts

- [ ] Add transition rule after the `:root` block closing brace, before the `*` reset block

**Old string:**
```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
```

**New string:**
```css
/* Smooth crisis level transitions — tokens are set by CrisisProvider on <html> */
:root {
  transition: --accent-primary 1.5s ease,
              --bg-card-crisis 1.5s ease,
              --border-crisis 1.5s ease,
              --scan-line-opacity 1.5s ease;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
```

**Note:** CSS custom property transitions require `@property` registration for interpolation. Since we are setting discrete color values (not interpolating numerically), the transition on the custom properties themselves won't interpolate. Instead, the components that *use* these tokens should transition their own computed properties. Update the transition approach:

**Revised new string:**
```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
```

(Keep this unchanged. The transitions are handled at the component level below.)

### Step 3c: Add scan line overlay on body

- [ ] Add scan line CSS after the `html, body` block

**Old string:**
```css
html,
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

**New string:**
```css
html,
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Scan line overlay — visible only at CRISIS level via --scan-line-opacity */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, var(--scan-line-opacity)) 2px,
    rgba(255, 255, 255, var(--scan-line-opacity)) 4px
  );
  transition: opacity 1.5s ease;
}
```

### Step 3d: Add angular accent pseudo-elements on `.glass-card`

- [ ] Add crisis-aware angular accents after the `.glass-card` block

**Old string:**
```css
.card-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

**New string:**
```css
/* Angular NERV-style corner accents on glass cards — driven by crisis level */
.glass-card {
  transition: border-color 1.5s ease, background 1.5s ease;
}

[data-crisis-level="elevated"] .glass-card,
[data-crisis-level="crisis"] .glass-card {
  border-color: var(--border-crisis);
  background: var(--bg-card-crisis);
}

.glass-card::before,
.glass-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--border-crisis);
  border-style: solid;
  opacity: 0;
  transition: opacity 1.5s ease;
  pointer-events: none;
}
.glass-card::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}
.glass-card::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

[data-crisis-level="elevated"] .glass-card::before,
[data-crisis-level="elevated"] .glass-card::after {
  opacity: 0.5;
}
[data-crisis-level="crisis"] .glass-card::before,
[data-crisis-level="crisis"] .glass-card::after {
  opacity: 1;
}

.card-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

**Important:** The `.glass-card` class must have `position: relative` for the pseudo-elements to work. Check the existing definition:

```css
.glass-card {
  background: rgba(10, 15, 26, 0.7);
  backdrop-filter: blur(16px);
  /* ... */
  contain: layout style;
}
```

The `contain: layout style` will establish a containing block for absolutely positioned children, so pseudo-elements will position correctly. However, to be safe, add `position: relative` to `.glass-card`:

- [ ] Add `position: relative` to `.glass-card`

**Old string:**
```css
.glass-card {
  background: rgba(10, 15, 26, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  contain: layout style;
}
```

**New string:**
```css
.glass-card {
  position: relative;
  background: rgba(10, 15, 26, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  contain: layout style;
}
```

### Step 3e: Add global `prefers-reduced-motion` blanket rule

- [ ] Replace the existing partial reduced-motion rule with a global blanket

**Old string:**
```css
/* Primer stage reduced-motion override */
@media (prefers-reduced-motion: reduce) {
  .primer-stage,
  .primer-stage *,
  .pipeline-animated {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
}
```

**New string:**
```css
/* Global reduced-motion blanket — disables ALL animations and transitions */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Step 3f: Add crisis tokens to tailwind.config.ts

- [ ] Add `accent` and crisis-specific tokens to the Tailwind colors config

**Old string:**
```ts
        petron: "var(--accent-petron)",
```

**New string:**
```ts
        accent: {
          primary: "var(--accent-primary)",
        },
        crisis: {
          card: "var(--bg-card-crisis)",
          border: "var(--border-crisis)",
        },
        petron: "var(--accent-petron)",
```

---

## Task 4: Layout + Page Integration

**Files:** `src/app/page.tsx` (modify)

**What:** Wrap the dashboard page content with `CrisisProvider`, passing in `scenarioParams` which already lives in page state.

- [ ] Add `CrisisProvider` import to `page.tsx`
- [ ] Wrap the main page content with `CrisisProvider`

Since `layout.tsx` is a Server Component and `CrisisProvider` is a Client Component that needs `scenarioParams` (which lives in page state), the provider goes in `page.tsx`, not `layout.tsx`. The provider sets tokens on `<html>` via `document.documentElement`, so it affects the entire page regardless of where it's mounted in the React tree.

### Modification to `src/app/page.tsx`

- [ ] Add import at the top of the file

Find the existing imports area and add:

```ts
import { CrisisProvider } from '@/lib/CrisisProvider';
```

- [ ] Wrap the return JSX with CrisisProvider

**Old string (from page.tsx, the opening of the return):**
```tsx
  return (
    <main className="min-h-screen overflow-x-clip">
```

**New string:**
```tsx
  return (
    <CrisisProvider scenarioParams={scenarioParams}>
    <main className="min-h-screen overflow-x-clip">
```

- [ ] Close the CrisisProvider at the end of the return

Find the closing `</main>` and add the closing tag after it:

**Old string (the closing of the return, approximate — find the exact `</main>` closing):**
```tsx
    </main>
```

**New string:**
```tsx
    </main>
    </CrisisProvider>
```

- [ ] Verify `pnpm build` passes after this change

**Note:** The `CrisisProvider` will call `useEvents()` and `usePrices()` internally. Since `page.tsx` also uses these hooks (or components that use them), the hooks already handle deduplication internally via their own state — no duplicate fetching occurs because they share the same component tree and React's hook memoization.

---

## Task 5: Header + AlertBanner Crisis Enhancements

**Files:** `src/components/layout/Header.tsx` (modify), `src/components/layout/AlertBanner.tsx` (modify)

**What:** Header shows warning chevrons flanking the title at CRISIS level. AlertBanner gets enhanced glow at CRISIS level.

### Step 5a: Header warning chevrons

- [ ] Add `useCrisis` import to Header.tsx
- [ ] Add chevron indicators at CRISIS level

**Old string:**
```tsx
import { AlertBell } from '@/components/alerts/AlertBell';
```

**New string:**
```tsx
import { AlertBell } from '@/components/alerts/AlertBell';
import { useCrisis } from '@/lib/CrisisProvider';
```

**Old string:**
```tsx
export function Header({ showTicker = true }: { showTicker?: boolean }) {
  const currentDate = useCurrentDate();
  const pathname = usePathname();
  const { isLive, lastUpdated } = useEvents();
  const updatedAgo = useRelativeTime(lastUpdated);
```

**New string:**
```tsx
export function Header({ showTicker = true }: { showTicker?: boolean }) {
  const currentDate = useCurrentDate();
  const pathname = usePathname();
  const { isLive, lastUpdated } = useEvents();
  const updatedAgo = useRelativeTime(lastUpdated);
  const { crisisLevel } = useCrisis();
```

**Old string:**
```tsx
          <Link href="/" className="group">
            <h1 className="text-sm font-mono tracking-widest text-text-primary uppercase group-hover:text-white transition-colors">
              Energy Intelligence Map
            </h1>
```

**New string:**
```tsx
          <Link href="/" className="group">
            <h1 className="text-sm font-mono tracking-widest text-text-primary uppercase group-hover:text-white transition-colors">
              {crisisLevel === 'CRISIS' && (
                <span className="inline-block text-status-red mr-1.5 animate-pulse" aria-hidden="true">&laquo;</span>
              )}
              Energy Intelligence Map
              {crisisLevel === 'CRISIS' && (
                <span className="inline-block text-status-red ml-1.5 animate-pulse" aria-hidden="true">&raquo;</span>
              )}
            </h1>
```

- [ ] Add crisis-level border accent to the Philippine flag bars

**Old string:**
```tsx
      {/* Philippine flag accent bars */}
      <div className="flex h-[3px]">
        <div className="flex-1 bg-ph-blue" />
        <div className="flex-1 bg-ph-red" />
        <div className="flex-1 bg-ph-yellow" />
      </div>
```

**New string:**
```tsx
      {/* Philippine flag accent bars */}
      <div className={`flex h-[3px] transition-all duration-1000 ${crisisLevel === 'CRISIS' ? 'h-[4px]' : ''}`}>
        <div className={`flex-1 ${crisisLevel === 'CRISIS' ? 'bg-status-red' : 'bg-ph-blue'} transition-colors duration-1000`} />
        <div className="flex-1 bg-ph-red" />
        <div className={`flex-1 ${crisisLevel === 'CRISIS' ? 'bg-status-red' : 'bg-ph-yellow'} transition-colors duration-1000`} />
      </div>
```

### Step 5b: AlertBanner enhanced glow at CRISIS level

- [ ] Add `useCrisis` import to AlertBanner.tsx
- [ ] Enhance the glow effect at CRISIS level

**Old string:**
```tsx
import { useEvents } from '@/hooks/useEvents';
```

**New string:**
```tsx
import { useEvents } from '@/hooks/useEvents';
import { useCrisis } from '@/lib/CrisisProvider';
```

**Old string:**
```tsx
export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { events } = useEvents();
```

**New string:**
```tsx
export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { events } = useEvents();
  const { crisisLevel } = useCrisis();
```

**Old string:**
```tsx
    <div className="relative flex items-center gap-3 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15 border border-red-500/20 px-4 py-2.5 sm:px-6 alert-glow">
```

**New string:**
```tsx
    <div className={`relative flex items-center gap-3 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15 border px-4 py-2.5 sm:px-6 alert-glow transition-all duration-1000 ${
      crisisLevel === 'CRISIS'
        ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        : 'border-red-500/20'
    }`}>
```

**Old string:**
```tsx
      <p className="flex-1 text-xs font-mono text-red-300/90 leading-relaxed">
        <span className="font-bold">{critical.source.toUpperCase()}</span> — {critical.event}
      </p>
```

**New string:**
```tsx
      <p className={`flex-1 font-mono leading-relaxed transition-all duration-1000 ${
        crisisLevel === 'CRISIS'
          ? 'text-sm text-red-200/95 font-semibold'
          : 'text-xs text-red-300/90'
      }`}>
        <span className="font-bold">{critical.source.toUpperCase()}</span> — {critical.event}
      </p>
```

- [ ] Verify `pnpm build` passes after all changes
- [ ] Verify WCAG AA contrast at CRISIS level (red-200 on red-tinted dark bg exceeds 4.5:1)

---

## Verification Checklist

- [ ] `pnpm build` passes clean with no type errors
- [ ] `pnpm dev` — dashboard loads at CALM level (default scenarioParams: brentPrice 106, hormuzWeeks 2)
- [ ] Adjusting scenario sliders (increasing hormuzWeeks to 4+, adding red events) shifts to ELEVATED/CRISIS
- [ ] Scan lines appear only at CRISIS level
- [ ] Angular corner accents fade in at ELEVATED, full opacity at CRISIS
- [ ] Header chevrons appear at CRISIS level
- [ ] AlertBanner glow intensifies at CRISIS level
- [ ] `prefers-reduced-motion` disables all animations
- [ ] No JS animation libraries added — all transitions are CSS
- [ ] No new dependencies added

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/crisisLevel.ts` | Create | Pure crisis score computation + level mapping + token lookup |
| `src/lib/CrisisProvider.tsx` | Create | React context provider, sets CSS tokens on `<html>` |
| `src/app/globals.css` | Modify | Add crisis tokens to `:root`, scan line overlay, angular accents, reduced-motion blanket |
| `tailwind.config.ts` | Modify | Map crisis tokens to Tailwind utilities |
| `src/app/page.tsx` | Modify | Wrap content with `CrisisProvider` |
| `src/components/layout/Header.tsx` | Modify | Warning chevrons + flag bar shift at CRISIS |
| `src/components/layout/AlertBanner.tsx` | Modify | Enhanced glow + typography scaling at CRISIS |
