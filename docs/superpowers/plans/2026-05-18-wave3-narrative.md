# Wave 3 — Narrative & Storytelling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the dashboard from "a wall of charts" into a story — open with a crisis-driven headline a first-timer understands in 10 seconds, sharpen the act-divider copy, fix the cascade headline bug, replace the intrusive onboarding modal, cross-link the explainer pages, and close with a "what you can do" section.

**Architecture:** Two new presentational components (`CrisisHero`, `WhatToDo`) read existing context (`useCrisis`, `usePrices`) and static data — no new data layer. The rest is targeted copy/markup edits to `page.tsx`, `CascadePage.tsx`, `PrimerPage.tsx`, and `HowToGuide.tsx`. No new dependencies.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind (design tokens — never hardcode colors), Vitest.

---

## Context for the engineer

Brownfield Next.js 14 dashboard. Package manager **pnpm**; agent shells need `export PATH="/opt/homebrew/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"`. Path alias `@/*` → `./src/*`. `pnpm build`, `pnpm test`, `pnpm lint` must all pass before each commit. Commit messages: lowercase imperative. Do NOT push to any remote.

**Design system:** Use design tokens — `text-text-primary`, `text-text-body`, `text-text-secondary`, `text-text-label`, `text-status-red/green/yellow`, `text-petron`, `bg-bg-card`, `border-border-subtle`, `glass-card` utility. Never hardcode hex/rgb/raw Tailwind palette colors. Typography: display headings `font-bold`, mono eyebrows `font-mono text-[10px] uppercase tracking-widest text-text-label`.

**Key APIs (verified):**
- `useCrisis()` (from `@/lib/CrisisProvider`) → `{ crisisLevel: 'CALM' | 'ELEVATED' | 'CRISIS', crisisScore: number }`. Available anywhere inside `<CrisisProvider>` — which already wraps the whole dashboard page.
- `usePrices()` (from `@/hooks/usePrices`) → `{ prices: PriceBenchmark[], isLive, lastUpdated, priceHistory }`. `PriceBenchmark` = `{ id, name, value, previousWeek, unit, tooltip }`. Diesel: `prices.find(p => p.id === 'pump-diesel')`.
- `src/data/cascade.ts` exports `cascadeHeadline` (`{ crudePrice: '$107.8/bbl', crudeChange: 43.7, householdImpact: '+₱3,200/mo', householdChange: 18, foodInflation: '+8.2%', dieselPrice, ricePrice }`) and `criticalInsight` (`{ headline: 'Diesel is the hidden multiplier', body: string, severity, ... }`).
- `CrisisLevel` type is exported from `@/lib/crisisLevel`.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/layout/CrisisHero.tsx` | Act-0 crisis-driven hero headline (the 10-second "so what") |
| Create | `src/components/layout/__tests__/CrisisHero.test.ts` | Tests for the pure headline-composition helpers |
| Create | `src/components/layout/WhatToDo.tsx` | Act-5 closing "what you can do" section |
| Modify | `src/app/page.tsx` | Insert `CrisisHero` (Act 0) + `WhatToDo` (Act 5); sharpen the 4 `ActDivider` hooks; render the onboarding inline hint |
| Modify | `src/app/cascade/CascadePage.tsx` | Fix the `nth` headline bug; add a primer cross-link |
| Modify | `src/app/primer/PrimerPage.tsx` | Add a cascade cross-link CTA |
| Modify | `src/components/onboarding/HowToGuide.tsx` | Remove the 2s auto-modal; export a dismissible inline `HowToHint` |

---

## Task 1: `CrisisHero` component

A new full-width hero that opens the dashboard with one crisis-driven sentence. It reads `useCrisis()` for the level and `usePrices()` for the diesel figure, and pulls a human-impact line from `cascade.ts`.

**Files:**
- Create: `src/components/layout/CrisisHero.tsx`
- Create: `src/components/layout/__tests__/CrisisHero.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/__tests__/CrisisHero.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { composeDieselLine } from '@/components/layout/CrisisHero';

describe('composeDieselLine', () => {
  it('reports a rise when diesel is up week-over-week', () => {
    expect(composeDieselLine(59.4, 1.2)).toBe('Diesel is ₱59.40/L — up ₱1.20 this week.');
  });

  it('reports a drop when diesel is down', () => {
    expect(composeDieselLine(58.0, -0.75)).toBe('Diesel is ₱58.00/L — down ₱0.75 this week.');
  });

  it('reports flat when the weekly move is negligible', () => {
    expect(composeDieselLine(59.4, 0.004)).toBe('Diesel is ₱59.40/L — flat this week.');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/layout/__tests__/CrisisHero.test.ts`
Expected: FAIL — cannot resolve `@/components/layout/CrisisHero`.

- [ ] **Step 3: Implement `CrisisHero`**

Create `src/components/layout/CrisisHero.tsx`:
```tsx
'use client';

import { useCrisis } from '@/lib/CrisisProvider';
import { usePrices } from '@/hooks/usePrices';
import { criticalInsight } from '@/data/cascade';
import type { CrisisLevel } from '@/lib/crisisLevel';

interface LevelFraming {
  lead: string;
  tone: string;
}

const LEVEL_FRAMING: Record<CrisisLevel, LevelFraming> = {
  CALM: {
    lead: 'Philippine energy supply is steady — for now.',
    tone: 'text-status-green',
  },
  ELEVATED: {
    lead: 'Philippine energy is under elevated stress.',
    tone: 'text-status-yellow',
  },
  CRISIS: {
    lead: 'Philippine energy is in crisis.',
    tone: 'text-status-red',
  },
};

/** Pure: compose the week-over-week diesel sentence. */
export function composeDieselLine(value: number, delta: number): string {
  const price = `₱${value.toFixed(2)}/L`;
  if (delta > 0.01) return `Diesel is ${price} — up ₱${delta.toFixed(2)} this week.`;
  if (delta < -0.01) return `Diesel is ${price} — down ₱${Math.abs(delta).toFixed(2)} this week.`;
  return `Diesel is ${price} — flat this week.`;
}

/**
 * Act 0 — the dashboard's narrative opener. A first-time visitor should grasp
 * "is this a crisis, and should I care?" within ten seconds of landing here.
 */
export function CrisisHero() {
  const { crisisLevel } = useCrisis();
  const { prices } = usePrices();

  const framing = LEVEL_FRAMING[crisisLevel];
  const diesel = prices.find((p) => p.id === 'pump-diesel');
  const dieselLine = diesel
    ? composeDieselLine(diesel.value, diesel.value - diesel.previousWeek)
    : '';

  return (
    <section className="glass-card px-6 py-10 sm:px-10 sm:py-14 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-4">
        PH Energy Intelligence · Live
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
        <span className={framing.tone}>{framing.lead}</span>
      </h1>
      <p className="mt-4 text-text-body text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        {dieselLine ? `${dieselLine} ` : ''}
        {criticalInsight.headline} — here&apos;s why, and what it costs your family.
      </p>
      <a
        href="#snapshot"
        className="inline-flex items-center gap-1.5 mt-6 font-mono text-xs uppercase tracking-widest text-petron hover:text-text-primary transition-colors"
      >
        See the numbers ↓
      </a>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/components/layout/__tests__/CrisisHero.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed (`CrisisHero` is not imported anywhere yet — no behavior change).

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/CrisisHero.tsx src/components/layout/__tests__/CrisisHero.test.ts
git commit -m "add CrisisHero — a crisis-driven dashboard opener"
```

---

## Task 2: Mount `CrisisHero` as Act 0 in `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import `CrisisHero`**

In `src/app/page.tsx`, add to the static (non-`dynamic`) import block near the other layout imports (e.g. after the `ActDivider` import):
```tsx
import { CrisisHero } from '@/components/layout/CrisisHero';
```
`CrisisHero` must be a STATIC import (it is above-the-fold / the LCP narrative element — do not wrap it in `dynamic()`).

- [ ] **Step 2: Render `CrisisHero` at the very top of `<main>`**

Find the opening `<main className="max-w-[1600px] ...">` tag. The first child currently is the Act 01 `ActDivider` (`<ActDivider number="01" ... />`). Insert `CrisisHero` as the new first child, wrapped in a `FadeIn`, immediately after the `<main ...>` opening tag and before the Act 01 `ActDivider`:
```tsx
        <FadeIn delay={0}>
          <CrisisHero />
        </FadeIn>

```
(The existing Act 01 `ActDivider` and everything else stays exactly as-is, now following the hero.)

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, open `http://localhost:3007` — confirm the dashboard now opens with the crisis hero headline (not the Act 01 divider), and "See the numbers ↓" scrolls to the snapshot. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "mount CrisisHero as the dashboard's Act 0 opener"
```

---

## Task 3: Fix the cascade headline `nth` bug

`src/app/cascade/CascadePage.tsx` line ~61 renders `{cascadeHeadline.householdImpact}nth` inside the `<h1>`. `householdImpact` is `'+₱3,200/mo'`, so the stray `nth` literal makes it render `'+₱3,200/month'` — a leftover bug. The headline should be a clean human sentence.

**Files:**
- Modify: `src/app/cascade/CascadePage.tsx`

- [ ] **Step 1: Read the `<h1>` block**

Read `src/app/cascade/CascadePage.tsx`. Locate the `<h1>` containing `{cascadeHeadline.householdImpact}nth`. Note the surrounding markup (the `<h1>` className, any `<span>` wrappers, sibling lines).

- [ ] **Step 2: Replace the headline with a clean sentence**

Remove the stray `nth` literal. Recompose the `<h1>` content so it reads as a complete human sentence using `cascadeHeadline` fields — keep the existing `<h1>` element, its className, and any highlight `<span>` styling; only fix the text. The headline should read exactly:

> Filipino families pay **{cascadeHeadline.householdImpact}** more — traced from **{cascadeHeadline.crudePrice}** crude oil.

Concretely, the `<h1>`'s children become (preserve the file's existing `<h1>` tag/className and adapt the highlight `<span>` className to whatever the file already uses for emphasis):
```tsx
        Filipino families pay{' '}
        <span className="text-status-red">{cascadeHeadline.householdImpact}</span>{' '}
        more — traced from{' '}
        <span className="text-status-red">{cascadeHeadline.crudePrice}</span> crude oil.
```
If the existing `<h1>` already has a highlight-span className (e.g. a token class), reuse that exact className instead of `text-status-red`. The one hard requirement: the literal `nth` is gone and the headline is a grammatical sentence. Do not touch anything else in the file in this task.

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/cascade/CascadePage.tsx
git commit -m "fix cascade headline — remove stray 'nth', use a clean sentence"
```

---

## Task 4: Sharpen the `ActDivider` hook copy

The four `ActDivider` "hook" subtitles in `page.tsx` read like descriptive section labels. Rewrite them as consequence-driven one-liners. Only the `hook` string values change — the `ActDivider` component and the `question`/`number`/gradient props are untouched.

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the four `hook` strings**

In `src/app/page.tsx`, find each `<ActDivider ... />` and replace ONLY its `hook=` value:

- Act `number="01"` — replace its `hook` with:
  `"Crude, forex, pump prices, and the infrastructure moving oil right now — every figure here moves what you pay tomorrow."`
- Act `number="02"` — replace its `hook` with:
  `"The supply chain above becomes a line in your budget. Here is that line."`
- Act `number="03"` — replace its `hook` with:
  `"One closed strait, one offline refinery. Model the shock before it reaches the pump."`
- Act `number="04"` — replace its `hook` with:
  `"Five companies, one refinery, and the global events that move them all."`

Leave `number`, `question`, `gradientFrom`, `gradientTo` exactly as they are.

- [ ] **Step 2: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "sharpen act-divider copy into consequence-driven hooks"
```

---

## Task 5: Replace the onboarding auto-modal with a dismissible inline hint

`HowToGuide.tsx` auto-opens a full-screen modal ~2s after load (the `AutoOpen` sub-component + the conditional block that renders it). Replace that intrusion with a quiet, dismissible inline hint. The modal itself, the fixed `?` trigger, the `open-how-to-guide` event listener, and the step navigation all stay — only the *auto-open* behavior is removed and an inline hint is added.

**Files:**
- Modify: `src/components/onboarding/HowToGuide.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read `HowToGuide.tsx`**

Read `src/components/onboarding/HowToGuide.tsx` fully. Identify: the `AutoOpen` sub-component (a `useEffect` with `setTimeout(onOpen, 2000)`), the conditional block that renders `<AutoOpen>` (gated on `!dismissed && !open && !autoOpened`), the `autoOpened` state, the `useDismissable('how-to-guide')` hook (`{ dismissed, dismiss, loaded }`), the `handleOpen` handler, and the `open-how-to-guide` window-event listener.

- [ ] **Step 2: Remove the auto-open**

Delete the `AutoOpen` sub-component definition entirely, and delete the conditional block that renders `<AutoOpen onOpen={...} />`. Remove the now-unused `autoOpened` state (and its setter) IF it is no longer referenced anywhere after the inline-hint work below. The modal, `HowToTrigger` (the fixed `?` button), the `open-how-to-guide` listener, and `useDismissable` all remain.

- [ ] **Step 3: Export a `HowToHint` inline component**

In `src/components/onboarding/HowToGuide.tsx`, add and export a new `HowToHint` component. It is a quiet in-flow banner — NOT fixed-position, NOT a modal overlay. It uses the same `useDismissable('how-to-guide')` hook so dismissing it (or the modal's "Don't show again") is shared state. It shows only when not dismissed and after `loaded`. It offers a "Take the tour" action that fires the existing `open-how-to-guide` event, and a close (×) button that calls `dismiss()`:
```tsx
export function HowToHint() {
  const { dismissed, dismiss, loaded } = useDismissable('how-to-guide');

  if (!loaded || dismissed) return null;

  return (
    <div className="glass-card flex items-center gap-3 px-4 py-2.5">
      <span className="text-base" aria-hidden="true">🧭</span>
      <p className="flex-1 text-xs font-sans text-text-secondary">
        New here? This dashboard models what Philippine oil shocks cost everyday families.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-how-to-guide'))}
        className="font-mono text-[10px] uppercase tracking-widest text-petron hover:text-text-primary transition-colors whitespace-nowrap"
      >
        Take the tour →
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="p-1 rounded-md text-text-dim hover:text-text-secondary hover:bg-surface-hover transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
```
(If `useDismissable` returns differently-named fields than `{ dismissed, dismiss, loaded }`, adapt to the actual API — read the hook. The behavior contract: render nothing until loaded; render nothing if dismissed; the × persists dismissal.)

- [ ] **Step 4: Render `HowToHint` in the dashboard flow**

In `src/app/page.tsx`: add `HowToHint` to the import from `@/components/onboarding/HowToGuide` (the file already imports `HowToGuide` from there — extend it to `import { HowToGuide, HowToHint } from ...`, or add a second import line if `HowToGuide` is a `dynamic()` import — in that case add a plain `import { HowToHint } from '@/components/onboarding/HowToGuide';`). Render `<HowToHint />` inside `<main>` immediately after the `<CrisisHero />` `FadeIn` block from Task 2 and before the Act 01 `ActDivider`:
```tsx
        <HowToHint />
```

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed — no unused-variable errors (confirm `autoOpened` was fully removed if unused, or kept if still used).

- [ ] **Step 6: Manual check**

Run `pnpm dev`, open `http://localhost:3007` — confirm NO modal auto-opens; the inline hint shows below the hero; "Take the tour" opens the modal; the × dismisses the hint and it stays gone on reload. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/HowToGuide.tsx src/app/page.tsx
git commit -m "replace onboarding auto-modal with a dismissible inline hint"
```

---

## Task 6: Cross-link the primer and cascade pages

The `/primer` ("how energy reaches you") and `/cascade` ("what it costs a family") pages are two halves of one story but never link to each other. Add a CTA at the end of each.

**Files:**
- Modify: `src/app/primer/PrimerPage.tsx`
- Modify: `src/app/cascade/CascadePage.tsx`

- [ ] **Step 1: Add a cascade CTA at the end of `PrimerPage`**

Read `src/app/primer/PrimerPage.tsx`. Its `<main>` ends with `<CrudeOilTypes />` (inside a `max-w-4xl` wrapper). Immediately after `<CrudeOilTypes />` (still inside the `<main>`), add:
```tsx
        <div className="mt-12 glass-card px-6 py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
            Next
          </p>
          <p className="text-text-body mb-4">
            You&apos;ve seen how oil reaches the Philippines. Now see what a price shock costs a family.
          </p>
          <a
            href="/cascade"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-petron hover:text-text-primary transition-colors"
          >
            See the cost cascade →
          </a>
        </div>
```
(Match the wrapper indentation/structure of the existing `PrimerPage` `<main>` content.)

- [ ] **Step 2: Add a primer CTA at the end of `CascadePage`**

Read `src/app/cascade/CascadePage.tsx`. Its `<main>` ends with a methodology `<footer>` block. Immediately BEFORE that `<footer>` (still inside `<main>`), add:
```tsx
        <div className="mt-12 glass-card px-6 py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
            Start here
          </p>
          <p className="text-text-body mb-4">
            Wondering how the oil gets here in the first place? Trace the supply chain.
          </p>
          <a
            href="/primer"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-petron hover:text-text-primary transition-colors"
          >
            How energy reaches the Philippines →
          </a>
        </div>
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/primer/PrimerPage.tsx src/app/cascade/CascadePage.tsx
git commit -m "cross-link the primer and cascade explainer pages"
```

---

## Task 7: Act 5 — the `WhatToDo` closing section

Add a closing "what you can do" section to the dashboard. It turns a passive read into a next step: model a scenario, explore the explainer pages, and — for franchise operators — the RES/RAP services pitch.

**Files:**
- Create: `src/components/layout/WhatToDo.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `WhatToDo.tsx`**

Create `src/components/layout/WhatToDo.tsx`:
```tsx
'use client';

interface ActionCard {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const ACTIONS: ActionCard[] = [
  {
    eyebrow: 'Understand',
    title: 'Trace where your fuel comes from',
    body: 'The 7-stage journey from a Middle East wellhead to a Philippine pump.',
    href: '/primer',
    cta: 'Read the oil primer →',
  },
  {
    eyebrow: 'See the impact',
    title: 'What a shock costs a family',
    body: 'Follow a crude-price spike down to jeepney fares, rice, and the monthly grocery bill.',
    href: '/cascade',
    cta: 'See the cost cascade →',
  },
  {
    eyebrow: 'Act',
    title: 'Cut a franchise energy bill',
    body: 'Multi-site operators can switch to competitive RES/RAP supply — roughly 20% off distribution-utility rates.',
    href: '/services',
    cta: 'Explore RES/RAP services →',
  },
];

/**
 * Act 5 — the dashboard's closing call to action. After the data, the story
 * ends with what the reader can actually do next.
 */
export function WhatToDo() {
  return (
    <section className="scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACTIONS.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="glass-card card-interactive p-5 flex flex-col"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              {action.eyebrow}
            </p>
            <h3 className="text-text-primary font-bold text-base mb-2">{action.title}</h3>
            <p className="text-text-body text-sm leading-relaxed flex-1">{action.body}</p>
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-petron">
              {action.cta}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
```
(`card-interactive` is an existing utility for hover-lift cards — see `CLAUDE.md`. If it does not exist, drop it and keep just `glass-card p-5`.)

- [ ] **Step 2: Mount Act 5 in `page.tsx`**

In `src/app/page.tsx`: add the import alongside the other layout imports:
```tsx
import { WhatToDo } from '@/components/layout/WhatToDo';
```
Then, find the Event Timeline `<section>` (the last `<section>` inside `<main>`, containing `<EventTimeline />`). Immediately AFTER that section's closing `</section>` and BEFORE the closing `</main>`, add an Act 5 `ActDivider` followed by the `WhatToDo` section:
```tsx
        {/* ━━━ ACT 5: WHAT YOU CAN DO ━━━ */}
        <ActDivider
          number="05"
          question="What can you do about it?"
          hook="The data is the easy part. Here is where you go from reading to doing."
          gradientFrom="#0f172a"
          gradientTo="#060a10"
        />

        <WhatToDo />
```
(`ActDivider` is already imported in `page.tsx`. Match the gradient-prop style of the existing dividers — `gradientFrom`/`gradientTo` are hex strings on `ActDivider`, which is the established pattern for that component; this is the one place hex is the existing API.)

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, open `http://localhost:3007`, scroll to the bottom — confirm the "What can you do about it?" act divider and the 3 action cards render, and each card links to `/primer`, `/cascade`, `/services` respectively. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/WhatToDo.tsx src/app/page.tsx
git commit -m "add Act 5 — a what-you-can-do closing section"
```

---

## Task 8: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all tests pass (the prior suite + the 3 new `CrisisHero` tests).

- [ ] **Step 2: Clean build**

Run: `pnpm build`
Expected: succeeds. Note the homepage `/` First Load JS — it should be within a few kB of the pre-wave figure (~123 kB); `CrisisHero`/`WhatToDo` are small static components.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors; no new warnings.

- [ ] **Step 4: Manual narrative walk-through**

Run `pnpm dev`. Confirm: the dashboard opens with the `CrisisHero` headline (crisis-level-colored) and the inline tour hint — no auto-modal; the act dividers read as consequence hooks; the page closes with the Act 5 "what you can do" cards; `/cascade` shows a clean headline (no `month`/`nth` artifact) and a primer cross-link; `/primer` ends with a cascade cross-link. Stop the dev server.

---

## Self-Review Notes

- **Spec coverage:** Implements WS4 (Narrative & Storytelling) from `docs/superpowers/specs/2026-05-17-100x-platform-upgrade-design.md` — Act 0 crisis hero (T1–T2), human hook (folded into `CrisisHero` via `criticalInsight.headline`, T1), cascade `nth` bug fix (T3), sharpened act-divider copy (T4), onboarding auto-modal → inline hint (T5), primer↔cascade cross-links (T6), Act 5 "what to do" (T7).
- **No placeholders:** Every code step has complete code. Tasks 3 and 5 carry a read-first guard because the exact current `<h1>` markup and `useDismissable` API must be confirmed against the live file.
- **Type consistency:** `composeDieselLine(value, delta)` is defined and tested in T1 and used inside `CrisisHero` in the same file. `CrisisLevel` (`'CALM'|'ELEVATED'|'CRISIS'`) keys `LEVEL_FRAMING`. `HowToHint` is exported from `HowToGuide.tsx` in T5 and imported by `page.tsx` in the same task. `WhatToDo` is exported in T7 and imported in the same task.
- **Sequential page.tsx edits:** Tasks 2, 4, 5, 7 all modify `page.tsx`. They run sequentially (subagent-driven, one task at a time), each reading the current file state — no conflict. Task ordering is 1→8 as written.
