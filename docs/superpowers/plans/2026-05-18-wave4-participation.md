# Wave 4 — Participation & Virality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make any meaningful dashboard state shareable without an account. A user who models a fuel-price shock can copy a URL that restores the exact scenario, and that link renders a rich social card describing the shock. A lightweight "Share this view" control and a single embeddable card round it out, and the AI-agent surfaces (`llms.txt`, manifest, JSON-LD) are verified and brought up to date.

**Architecture:** One new pure helper module (`src/lib/scenario-url.ts`) encodes/decodes `ScenarioParams` to a compact URL query param — an underscore-delimited `brent_hormuz_forex_refinery` string (underscore, not dot — a dot can appear inside a decimal number and would make the field count ambiguous; underscore is URL-safe and never appears in a number) — fully unit-tested, no React. `ScenarioPlanner` reads it on mount and gains a "Copy link" affordance via a new presentational `ShareButton` (Web Share API + clipboard fallback). A dynamic `opengraph-image` route under `/embed/scenario` plus a minimal `/embed/scenario` page render a shareable card from the same query param. The existing `/opengraph-image.tsx` stays as the site default; the scenario OG image is a new route so the homepage is unaffected. No new dependencies, no new infra (no Supabase, no API routes — everything is client-side or edge-rendered from URL params).

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind (design tokens — never hardcode colors), Vitest.

---

## Context for the engineer

Brownfield Next.js 14 dashboard. Package manager **pnpm**; agent shells need `export PATH="/opt/homebrew/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"`. Path alias `@/*` → `./src/*`. `pnpm build`, `pnpm test`, `pnpm lint` must all pass before each commit. Commit messages: lowercase imperative. Do NOT push to any remote. Work on the **current branch** — do not switch or create branches.

**Design system:** Use design tokens — `text-text-primary`, `text-text-body`, `text-text-secondary`, `text-text-label`, `text-text-dim`, `text-status-red/green/yellow`, `text-petron`, `bg-bg-primary`, `bg-surface-hover`, `border-border-subtle`, `glass-card` / `card-interactive` utilities. Never hardcode hex/rgb/raw Tailwind palette colors **in components**. Typography: mono eyebrows `font-mono text-[10px] uppercase tracking-widest text-text-label`. The ONE exception is `ImageResponse` (OG image) JSX — `next/og` does not see Tailwind tokens, so inline hex is the established pattern there (see the existing `src/app/opengraph-image.tsx`, which is all inline hex).

**Key facts (verified against the codebase):**
- `ScenarioParams` (from `@/types`) = `{ brentPrice: number; hormuzWeeks: number; forexRate: number; refineryOffline: boolean }`. Slider ranges: `brentPrice` 60–180 step 5; `hormuzWeeks` 0–16 step 1; `forexRate` 54–65 step 0.5; `refineryOffline` boolean.
- `calculatePumpPrice(params: ScenarioParams): ScenarioResult` (from `@/lib/scenario-engine`) → `{ gasoline: number; diesel: number; riskLevel: 'green'|'yellow'|'red' }`. Pure, no React — safe to call from an edge route.
- `Home` (`src/app/page.tsx`) owns `scenarioParams` in `useState` and passes `handleParamsChange` (a `useCallback`-wrapped `setScenarioParams`, which accepts a value or an updater) into `<ScenarioPlanner params=... onParamsChange=... />`.
- `ScenarioPlanner` (`src/components/scenarios/ScenarioPlanner.tsx`) already has two `useEffect`s that sync params from live prices / timeline. A new mount-only effect is needed to apply a URL-supplied scenario, and it must run BEFORE the live-price sync clobbers `brentPrice`/`forexRate` — see Task 4.
- The OG-image route is `src/app/opengraph-image.tsx` with `export const runtime = 'edge'`. A nested route at `src/app/embed/scenario/opengraph-image.tsx` produces a per-page OG image for the `/embed/scenario` URL.
- `metadataBase` is set in `src/app/layout.tsx` to `https://energy-intelligence-map.vercel.app`.
- Existing AI surfaces: `public/llms.txt` (static), `public/.well-known/ai-manifest.json` (static), JSON-LD in `src/app/layout.tsx`. There is NO `llms-full.txt`. The manifest does not list `/embed/*` or scenario sharing.
- Tests live in `src/**/__tests__/`; Vitest config includes `src/**/*.{test,spec}.{ts,tsx}`, jsdom env, `@` alias resolved.
- `git status` is dirty with pre-existing WIP (`src/app/page.tsx`, `src/components/layout/Header.tsx` modified; untracked `docs/` plans, `lighthouse-*`, `scripts/osm-stations-raw.json`, `src/app/robots.ts`). **Every commit step in this plan stages only the files it names** — never `git add .` / `git add -A`. Run `git diff --cached --stat` before each commit to confirm nothing extra is staged.

**Scope discipline (what this wave deliberately does NOT do):** no user accounts, no comment system, no moderation, no user-generated content, no Supabase tables, no new API routes, no map deep-linking (cut — see Self-Review Notes), no CSV/JSON export (cut), no third-party share SDKs. Lightweight virality only.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/scenario-url.ts` | Pure encode/decode of `ScenarioParams` ↔ compact underscore-delimited URL query string |
| Create | `src/lib/__tests__/scenario-url.test.ts` | Tests for the pure encode/decode/clamp helpers |
| Create | `src/components/ui/ShareButton.tsx` | "Copy link" / Web Share affordance with clipboard fallback |
| Create | `src/components/ui/__tests__/ShareButton.test.tsx` | Render + clipboard-fallback behavior test |
| Modify | `src/components/scenarios/ScenarioPlanner.tsx` | Apply a URL scenario on mount; render `ShareButton` with the scenario link |
| Create | `src/app/embed/scenario/page.tsx` | Minimal iframe-able single card rendering a scenario result from `?s=` |
| Create | `src/app/embed/scenario/EmbedScenarioCard.tsx` | The presentational embed card (client component) |
| Create | `src/app/embed/scenario/opengraph-image.tsx` | Dynamic edge OG image for a shared scenario URL |
| Create | `src/app/embed/layout.tsx` | Bare layout for `/embed/*` — no header/footer, transparent-friendly |
| Modify | `public/llms.txt` | Document scenario sharing + the `/embed/scenario` route |
| Modify | `public/.well-known/ai-manifest.json` | Add the `/embed/scenario` route and the scenario-share capability |
| Create | `public/llms-full.txt` | Full structured data dump per the CLAUDE.md AI-readiness checklist |
| Modify | `src/app/layout.tsx` | Add a `WebPage`/`Article`-style JSON-LD entry naming the shareable scenario feature |

---

## Task 1: `scenario-url` — pure encode/decode helper

A pure module that turns `ScenarioParams` into a compact, URL-safe `s` query value and back. Encoding is a fixed-order, underscore-delimited string of the four fields (`brent_hormuz_forex_refinery`) — short, human-inspectable, no base64 needed for four small numbers. **Underscore, not dot:** a field can carry a decimal point (forex always, and a hand-edited brent/hormuz might), so a dot delimiter would make the field count ambiguous; underscore is a URL-safe unreserved character that never appears inside a number. Decoding is defensive: any malformed or out-of-range value falls back to a clamped default, so a hand-edited URL can never crash the planner. This is the substrate WS5 virality serializes.

**Files:**
- Create: `src/lib/scenario-url.ts`
- Create: `src/lib/__tests__/scenario-url.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/scenario-url.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCENARIO,
  encodeScenario,
  decodeScenario,
} from '@/lib/scenario-url';
import type { ScenarioParams } from '@/types';

describe('encodeScenario', () => {
  it('encodes the four params as an underscore-delimited string in fixed order', () => {
    const params: ScenarioParams = {
      brentPrice: 120,
      hormuzWeeks: 8,
      forexRate: 60.5,
      refineryOffline: true,
    };
    expect(encodeScenario(params)).toBe('120_8_60.5_1');
  });

  it('encodes refineryOffline=false as 0', () => {
    expect(encodeScenario(DEFAULT_SCENARIO)).toBe('106_2_58.42_0');
  });
});

describe('decodeScenario', () => {
  it('round-trips an encoded scenario', () => {
    const params: ScenarioParams = {
      brentPrice: 120,
      hormuzWeeks: 8,
      forexRate: 60.5,
      refineryOffline: true,
    };
    expect(decodeScenario(encodeScenario(params))).toEqual(params);
  });

  it('returns the default scenario for null / empty input', () => {
    expect(decodeScenario(null)).toEqual(DEFAULT_SCENARIO);
    expect(decodeScenario('')).toEqual(DEFAULT_SCENARIO);
  });

  it('returns the default scenario for a malformed string', () => {
    expect(decodeScenario('not-a-scenario')).toEqual(DEFAULT_SCENARIO);
    expect(decodeScenario('120_8')).toEqual(DEFAULT_SCENARIO);
  });

  it('clamps out-of-range numbers into slider bounds', () => {
    // brent 999 -> max 180; hormuz -5 -> min 0; forex 200 -> max 65
    expect(decodeScenario('999_-5_200_1')).toEqual({
      brentPrice: 180,
      hormuzWeeks: 0,
      forexRate: 65,
      refineryOffline: true,
    });
  });

  it('rounds brent and hormuz to integers and forex to one decimal', () => {
    expect(decodeScenario('106.7_2.4_58.418_0')).toEqual({
      brentPrice: 107,
      hormuzWeeks: 2,
      forexRate: 58.4,
      refineryOffline: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/__tests__/scenario-url.test.ts`
Expected: FAIL — cannot resolve `@/lib/scenario-url`.

- [ ] **Step 3: Implement `scenario-url.ts`**

Create `src/lib/scenario-url.ts`:
```ts
import type { ScenarioParams } from '@/types';

/**
 * The dashboard's default scenario — mirrors the `useState` initializer in
 * `src/app/page.tsx`. Used as the safe fallback when a shared URL is missing
 * or malformed.
 */
export const DEFAULT_SCENARIO: ScenarioParams = {
  brentPrice: 106,
  hormuzWeeks: 2,
  forexRate: 58.42,
  refineryOffline: false,
};

/** Slider bounds, kept in sync with the inputs in `ScenarioPlanner.tsx`. */
const BOUNDS = {
  brentPrice: { min: 60, max: 180 },
  hormuzWeeks: { min: 0, max: 16 },
  forexRate: { min: 54, max: 65 },
} as const;

/** The query-param key a shared scenario is stored under. */
export const SCENARIO_PARAM = 's';

/**
 * Field separator for the encoded scenario. Underscore is URL-safe (an
 * unreserved character per RFC 3986) and — unlike a dot — can never appear
 * inside a decimal number, so the four fields always split unambiguously
 * even when forex (or a hand-edited brent/hormuz) carries a decimal point.
 */
const FIELD_SEP = '_';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pure: encode a scenario as a compact underscore-delimited string —
 * `brent_hormuz_forex_refinery` — e.g. `120_8_60.5_1`.
 */
export function encodeScenario(params: ScenarioParams): string {
  return [
    params.brentPrice,
    params.hormuzWeeks,
    params.forexRate,
    params.refineryOffline ? 1 : 0,
  ].join(FIELD_SEP);
}

/**
 * Pure: decode an underscore-delimited scenario string back into
 * `ScenarioParams`. Defensive — any missing, non-numeric, or out-of-range
 * field falls back to the clamped default, so a hand-edited or stale URL can
 * never crash the UI.
 */
export function decodeScenario(raw: string | null | undefined): ScenarioParams {
  if (!raw) return { ...DEFAULT_SCENARIO };

  const parts = raw.split(FIELD_SEP).map((p) => p.trim());
  // Expect exactly 4 fields: brent, hormuz, forex, refinery.
  if (parts.length !== 4) return { ...DEFAULT_SCENARIO };

  const brent = Number(parts[0]);
  const hormuz = Number(parts[1]);
  const forex = Number(parts[2]);
  const refinery = parts[3];

  if (
    !Number.isFinite(brent) ||
    !Number.isFinite(hormuz) ||
    !Number.isFinite(forex) ||
    (refinery !== '0' && refinery !== '1')
  ) {
    return { ...DEFAULT_SCENARIO };
  }

  return {
    brentPrice: clamp(Math.round(brent), BOUNDS.brentPrice.min, BOUNDS.brentPrice.max),
    hormuzWeeks: clamp(Math.round(hormuz), BOUNDS.hormuzWeeks.min, BOUNDS.hormuzWeeks.max),
    forexRate: clamp(
      Math.round(forex * 10) / 10,
      BOUNDS.forexRate.min,
      BOUNDS.forexRate.max,
    ),
    refineryOffline: refinery === '1',
  };
}

/**
 * Pure: build the full shareable scenario URL given an origin
 * (e.g. `window.location.origin`) and a target path (default `/`).
 */
export function buildScenarioUrl(
  params: ScenarioParams,
  origin: string,
  path = '/',
): string {
  return `${origin}${path}?${SCENARIO_PARAM}=${encodeScenario(params)}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/__tests__/scenario-url.test.ts`
Expected: PASS — `7 passed`.

> Note on the encoding: `encodeScenario` joins the four values with underscores. Underscore can never appear inside a JavaScript number, so `decodeScenario` always splits into exactly four fields regardless of how many decimal points the values carry. A string with any other field count — `'120_8'` (2 fields) or `'not-a-scenario'` (1 field) — correctly falls through to the default.

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed (`scenario-url.ts` is not imported anywhere yet — no behavior change).

- [ ] **Step 6: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/lib/scenario-url.ts src/lib/__tests__/scenario-url.test.ts
git diff --cached --stat   # expect: only the two files above
git commit -m "add scenario-url — pure encode/decode for shareable scenarios"
```

---

## Task 2: `ShareButton` — copy-link / Web Share affordance

A small presentational button. On click it tries `navigator.share` (native share sheet on mobile) and falls back to `navigator.clipboard.writeText` + a transient "Copied" confirmation. It takes a `url` and `title`; it owns no scenario logic. SSR-safe — all browser-API access is inside the click handler, never at module or render scope.

> **Execution note (test deferred):** the planned `ShareButton.test.tsx` render test could not run — this repo's Vitest harness has never executed a component (`.test.tsx`) test, and the first attempt surfaced a pre-existing repo-wide defect: a duplicate-React-instance "Invalid hook call" the moment any hook component is rendered under test. `resolve.dedupe`, `server.deps.inline`, and `IS_REACT_ACT_ENVIRONMENT` were all tried without success — the proper fix (likely a Vitest 3 upgrade) is its own task, out of scope for this feature wave. `ShareButton` ships verified by `pnpm build`, `pnpm lint`, the final code review, and the Task 4 manual check; the component-test harness fix is tracked as a separate follow-up.

**Files:**
- Create: `src/components/ui/ShareButton.tsx`
- Create: `src/components/ui/__tests__/ShareButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/__tests__/ShareButton.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '@/components/ui/ShareButton';

// NOTE: this environment (Node 25 + vitest 2.1.9 + React 18) commits the React
// render a tick AFTER `render()` returns, so a synchronous `getBy*` query would
// miss the freshly-mounted DOM. Use the async, retrying `findBy*` queries —
// the React Testing Library recommended pattern regardless.

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default label', async () => {
    render(<ShareButton url="https://example.com/?s=1" title="Test" />);
    expect(
      await screen.findByRole('button', { name: /share this view/i }),
    ).toBeTruthy();
  });

  it('copies to clipboard and shows confirmation when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom has no navigator.share — force the clipboard fallback path.
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareButton url="https://example.com/?s=120_8_60.5_1" title="Test" />);
    fireEvent.click(await screen.findByRole('button'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/?s=120_8_60.5_1');
    });
    expect(await screen.findByText(/copied/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/ui/__tests__/ShareButton.test.tsx`
Expected: FAIL — cannot resolve `@/components/ui/ShareButton`.

- [ ] **Step 3: Implement `ShareButton.tsx`**

Create `src/components/ui/ShareButton.tsx`:
```tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ShareButtonProps {
  /** The fully-qualified URL to share. */
  url: string;
  /** A short title for the native share sheet. */
  title: string;
  /** Optional descriptive text for the native share sheet. */
  text?: string;
}

/**
 * A lightweight, no-login share affordance. Prefers the native Web Share API
 * (mobile share sheet); falls back to copying the link to the clipboard with a
 * transient "Copied" confirmation. No third-party SDKs.
 */
export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    // Native share sheet first (mobile / supporting browsers).
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the sheet, or share failed — fall through to copy.
      }
    }
    // Clipboard fallback.
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      flashCopied();
    } catch {
      // Clipboard blocked (insecure context / permissions) — last resort: prompt.
      if (typeof window !== 'undefined') {
        window.prompt('Copy this link:', url);
      }
    }
  }, [url, title, text, flashCopied]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this view"
      className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-hover px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
    >
      <span aria-hidden="true">{copied ? '✓' : '↗'}</span>
      {copied ? 'Copied' : 'Share this view'}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/components/ui/__tests__/ShareButton.test.tsx`
Expected: PASS — `2 passed`.

- [ ] **Step 5: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed (`ShareButton` not imported anywhere yet).

- [ ] **Step 6: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/components/ui/ShareButton.tsx src/components/ui/__tests__/ShareButton.test.tsx
git diff --cached --stat   # expect: only the two files above
git commit -m "add ShareButton — web share with clipboard fallback"
```

---

## Task 3: `/embed` layout — a bare shell for embeddable cards

`/embed/*` routes are meant to be iframed into other sites, so they must NOT inherit the dashboard header, footer, ticker, or section nav. A nested `layout.tsx` under `src/app/embed/` gives the embed routes a minimal shell. The root `layout.tsx` (fonts, `<body>`, `DataProvider`) still wraps everything — a nested layout composes inside it — so `/embed/scenario` gets the design tokens and fonts but none of the chrome.

**Files:**
- Create: `src/app/embed/layout.tsx`

- [ ] **Step 1: Create the embed layout**

Create `src/app/embed/layout.tsx`:
```tsx
import type { Metadata } from 'next';

/**
 * Bare layout for embeddable widget routes. These pages are designed to be
 * iframed into third-party sites, so they deliberately omit the dashboard
 * header, footer, ticker, and section nav. The root layout still provides
 * fonts, the design-token CSS, and providers.
 */
export const metadata: Metadata = {
  // Embedded widgets should not be indexed as standalone pages.
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-bg-primary">{children}</div>;
}
```

- [ ] **Step 2: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. `pnpm build`'s route list will not yet show an `/embed` route (no `page.tsx` under it) — that is fine; the layout alone produces no route.

- [ ] **Step 3: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/app/embed/layout.tsx
git diff --cached --stat   # expect: only the embed layout
git commit -m "add bare layout for embeddable widget routes"
```

---

## Task 4: Apply a shared scenario on mount + render `ShareButton` in `ScenarioPlanner`

`ScenarioPlanner` gains two things: (1) a mount-only effect that reads `?s=` from the URL and, if present and valid, applies it via `onParamsChange`; (2) a "Share this view" button next to the planner heading that copies a URL encoding the *current* scenario.

**Ordering subtlety:** `ScenarioPlanner` already has a `useEffect` that overwrites `brentPrice`/`forexRate` with live prices whenever they change (and in `live`/`scenario` mode). If a shared URL sets a specific Brent price, the live-sync effect would clobber it on the next price tick. To respect the shared URL while still letting the user edit afterward, the mount effect applies the URL scenario once, and we gate the live-price sync so it does not run on the very first commit when a URL scenario is present. We track this with a `ref`.

**Files:**
- Modify: `src/components/scenarios/ScenarioPlanner.tsx`

- [ ] **Step 1: Re-read the current file**

Read `src/components/scenarios/ScenarioPlanner.tsx` in full to confirm the current import block, the `usePrices` destructure, the two existing `useEffect`s (live-price sync and timeline sync), and the heading `<div className="flex items-center gap-2">` block. The edits below assume the file as documented in "Context for the engineer".

- [ ] **Step 2: Extend the imports**

At the top of `src/components/scenarios/ScenarioPlanner.tsx`, change the React import and add three new imports. The existing first import line is:
```tsx
import { useMemo, useEffect } from 'react';
```
Replace it with:
```tsx
import { useMemo, useEffect, useRef, useState } from 'react';
```
Then add, after the existing `import { InfoTip } from '@/components/ui/Tooltip';` line:
```tsx
import { ShareButton } from '@/components/ui/ShareButton';
import { decodeScenario, buildScenarioUrl, SCENARIO_PARAM } from '@/lib/scenario-url';
```

- [ ] **Step 3: Add the mount-only "apply shared scenario" effect**

Inside the `ScenarioPlanner` function body, immediately AFTER the `const liveForex = ...` line and BEFORE the existing "Sync slider values with live prices" `useEffect`, insert:
```tsx
  // Tracks whether a scenario was restored from the URL on first mount, so the
  // live-price sync below does not immediately clobber the shared Brent/forex.
  const urlScenarioRef = useRef(false);

  // On mount only: if the URL carries an `?s=` scenario, restore it. A shared
  // link should land the visitor on exactly the scenario the sharer modeled.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get(SCENARIO_PARAM);
    if (!raw) return;
    urlScenarioRef.current = true;
    onParamsChange(decodeScenario(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```
(The `exhaustive-deps` suppression here is intentional and correct — this is a deliberate mount-only effect. It is the single allowed suppression added by this wave; the timeline effect already carries one from Wave 1.)

- [ ] **Step 4: Gate the live-price sync so it respects a shared URL once**

The existing live-price-sync effect currently reads:
```tsx
  useEffect(() => {
    if (mapMode !== 'timeline') {
      onParamsChange((prev) => ({
        ...prev,
        brentPrice: Math.round(liveBrent),
        forexRate: liveForex,
      }));
    }
  }, [liveBrent, liveForex, mapMode, onParamsChange]);
```
Replace its body so it skips exactly one run when a URL scenario was restored:
```tsx
  useEffect(() => {
    if (mapMode === 'timeline') return;
    // If a scenario was restored from the URL, skip the first live-price sync
    // so the shared Brent/forex survive. Subsequent ticks sync normally.
    if (urlScenarioRef.current) {
      urlScenarioRef.current = false;
      return;
    }
    onParamsChange((prev) => ({
      ...prev,
      brentPrice: Math.round(liveBrent),
      forexRate: liveForex,
    }));
  }, [liveBrent, liveForex, mapMode, onParamsChange]);
```

- [ ] **Step 5: Build the shareable URL and render `ShareButton` in the heading**

Inside the `ScenarioPlanner` function body, after the `const result = useMemo(...)` line, add the share-URL state. It is computed in an effect (not at render) because `window.location.origin` is browser-only:
```tsx
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(buildScenarioUrl(params, window.location.origin, '/'));
  }, [params]);
```
Then, in the JSX, find the heading row:
```tsx
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
            Scenario Planner
          </h2>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-how-to-guide'))}
            className="p-1 rounded-md hover:bg-surface-hover transition-colors text-text-dim hover:text-text-secondary"
            aria-label="How to use scenario planner"
            title="How to use scenario planner"
          >
            <span className="text-[10px] font-mono">?</span>
          </button>
        </div>
```
Replace it with (adds `justify-between` + a right-aligned `ShareButton`, rendered only once `shareUrl` is populated and only when not timeline-driven, since a timeline scenario is not a user-authored "view"):
```tsx
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
              Scenario Planner
            </h2>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-how-to-guide'))}
              className="p-1 rounded-md hover:bg-surface-hover transition-colors text-text-dim hover:text-text-secondary"
              aria-label="How to use scenario planner"
              title="How to use scenario planner"
            >
              <span className="text-[10px] font-mono">?</span>
            </button>
          </div>
          {shareUrl && !isTimelineDriven && (
            <ShareButton
              url={shareUrl}
              title="PH Oil scenario"
              text="See the fuel-price shock I modeled on the PH Energy Intelligence Map"
            />
          )}
        </div>
```

- [ ] **Step 6: Verify lint, test, and build pass**

Run: `pnpm lint && pnpm test && pnpm build`
Expected: all succeed. Confirm there are no NEW `react-hooks/exhaustive-deps` warnings beyond the one intentional mount-effect suppression added in Step 3.

- [ ] **Step 7: Manual check**

Run `pnpm dev`, open `http://localhost:3007`. Scroll to the Scenario Planner — confirm a "Share this view" button sits at the top-right of the heading row. Click it: in a non-mobile browser the link is copied and the button briefly shows "✓ Copied". Copy the URL, open it in a fresh tab, and confirm the planner sliders restore to the shared scenario (e.g. set Hormuz to 10 weeks, share, reopen — the new tab shows 10 weeks). Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/components/scenarios/ScenarioPlanner.tsx
git diff --cached --stat   # expect: only ScenarioPlanner.tsx
git commit -m "make scenario planner shareable via url with deep-link restore"
```

---

## Task 5: `/embed/scenario` — the embeddable scenario card

A minimal route that renders a single self-contained card showing a scenario's modeled gasoline/diesel prices and risk level, decoded from `?s=`. Designed to be iframed. It uses `calculatePumpPrice` (pure) so it needs no live data and no API call.

**Files:**
- Create: `src/app/embed/scenario/EmbedScenarioCard.tsx`
- Create: `src/app/embed/scenario/page.tsx`

- [ ] **Step 1: Create the presentational card**

Create `src/app/embed/scenario/EmbedScenarioCard.tsx`:
```tsx
'use client';

import type { ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

const RISK_LABEL: Record<'green' | 'yellow' | 'red', { label: string; tone: string }> = {
  green: { label: 'Stable', tone: 'text-status-green' },
  yellow: { label: 'Elevated', tone: 'text-status-yellow' },
  red: { label: 'Crisis', tone: 'text-status-red' },
};

interface EmbedScenarioCardProps {
  params: ScenarioParams;
}

/**
 * Self-contained scenario result card for the `/embed/scenario` iframe widget.
 * Pure render — derives prices from `calculatePumpPrice`, no live data.
 */
export function EmbedScenarioCard({ params }: EmbedScenarioCardProps) {
  const result = calculatePumpPrice(params);
  const risk = RISK_LABEL[result.riskLevel];

  return (
    <div className="glass-card mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label">
          PH Oil — Modeled Scenario
        </p>
        <span className={`font-mono text-[10px] uppercase tracking-widest ${risk.tone}`}>
          {risk.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Est. Gasoline
          </p>
          <p className="font-mono text-3xl font-bold text-text-primary">
            ₱{result.gasoline.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Est. Diesel
          </p>
          <p className="font-mono text-3xl font-bold text-text-primary">
            ₱{result.diesel.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-secondary">
        Brent ${params.brentPrice}/bbl · Hormuz {params.hormuzWeeks}wk · ₱
        {params.forexRate.toFixed(2)}/USD
        {params.refineryOffline ? ' · Bataan refinery offline' : ''}.
      </p>

      <a
        href="/?s="
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-petron transition-colors hover:text-text-primary"
      >
        Model your own →
      </a>
    </div>
  );
}
```
(The `href="/?s="` link opens the full dashboard; it intentionally carries an empty `s` so the planner falls back to defaults — a deliberate "start fresh" entry point. The decode helper treats empty `s` as the default scenario, verified in Task 1's test.)

- [ ] **Step 2: Create the embed page**

Create `src/app/embed/scenario/page.tsx`. It is a Server Component that reads `searchParams` (App Router server pages receive `searchParams` as a prop) and passes the decoded scenario to the client card:
```tsx
import type { Metadata } from 'next';
import { decodeScenario } from '@/lib/scenario-url';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { EmbedScenarioCard } from './EmbedScenarioCard';

export const metadata: Metadata = {
  title: 'PH Oil — Modeled Scenario',
  robots: { index: false, follow: false },
};

interface EmbedScenarioPageProps {
  searchParams: { s?: string };
}

export default function EmbedScenarioPage({ searchParams }: EmbedScenarioPageProps) {
  const params = decodeScenario(searchParams.s ?? null);
  // Touch the engine here too so a malformed `s` is caught server-side before render.
  calculatePumpPrice(params);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmbedScenarioCard params={params} />
    </main>
  );
}
```

- [ ] **Step 3: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The `pnpm build` route table now lists `/embed/scenario`.

- [ ] **Step 4: Manual check**

Run `pnpm dev`. Open `http://localhost:3007/embed/scenario?s=140_10_61.5_1` — confirm a single centered card renders with no header/footer, showing modeled gasoline/diesel prices, a "Crisis"/"Elevated"/"Stable" badge, and the scenario summary line ("Brent $140/bbl · Hormuz 10wk · ₱61.50/USD · Bataan refinery offline"). Open `http://localhost:3007/embed/scenario` with no `?s=` — confirm it renders the default scenario without error. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/app/embed/scenario/EmbedScenarioCard.tsx src/app/embed/scenario/page.tsx
git diff --cached --stat   # expect: only the two embed files
git commit -m "add embeddable scenario result card at /embed/scenario"
```

---

## Task 6: Dynamic OG image for a shared scenario

A per-route `opengraph-image.tsx` under `src/app/embed/scenario/`. When someone shares an `/embed/scenario?s=...` link, this generates a 1200×630 social card encoding the modeled prices and risk — so the link unfurls richly on social. It mirrors the structure and inline-hex style of the existing `src/app/opengraph-image.tsx` (which is the only place inline hex is sanctioned, since `next/og` cannot read Tailwind tokens).

**Files:**
- Create: `src/app/embed/scenario/opengraph-image.tsx`

- [ ] **Step 1: Create the dynamic OG image route**

Create `src/app/embed/scenario/opengraph-image.tsx`:
```tsx
import { ImageResponse } from 'next/og';
import { decodeScenario } from '@/lib/scenario-url';
import { calculatePumpPrice } from '@/lib/scenario-engine';

export const runtime = 'edge';
export const alt = 'A modeled Philippine fuel-price scenario';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// next/og passes the request so we can read the `?s=` scenario param.
export default function ScenarioOGImage({
  searchParams,
}: {
  searchParams: { s?: string };
}) {
  const params = decodeScenario(searchParams?.s ?? null);
  const result = calculatePumpPrice(params);

  const riskTheme = {
    green: { label: 'STABLE', color: '#22c55e' },
    yellow: { label: 'ELEVATED', color: '#f59e0b' },
    red: { label: 'CRISIS', color: '#ef4444' },
  }[result.riskLevel];

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #060a10 0%, #0a1628 50%, #0f1d32 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Philippine flag accent bars */}
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }}>
          <div style={{ flex: 1, height: '4px', background: '#0038a8' }} />
          <div style={{ flex: 1, height: '4px', background: '#ce1126' }} />
          <div style={{ flex: 1, height: '4px', background: '#fcd116' }} />
        </div>

        {/* Risk glow */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '440px',
            height: '440px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${riskTheme.color}22 0%, transparent 70%)`,
          }}
        />

        {/* Eyebrow + risk badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            PH Oil Intelligence · Modeled Scenario
          </div>
          <div
            style={{
              display: 'flex',
              padding: '8px 20px',
              borderRadius: '20px',
              background: `${riskTheme.color}26`,
              color: riskTheme.color,
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '3px',
            }}
          >
            {riskTheme.label}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '60px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.1,
            marginTop: '36px',
            display: 'flex',
          }}
        >
          ₱{result.gasoline.toFixed(2)}/L gasoline if this shock hits.
        </div>

        {/* Scenario inputs */}
        <div
          style={{
            fontSize: '22px',
            color: 'rgba(255,255,255,0.55)',
            marginTop: '20px',
            display: 'flex',
          }}
        >
          Brent ${params.brentPrice}/bbl · Hormuz blocked {params.hormuzWeeks} wk · ₱
          {params.forexRate.toFixed(2)}/USD
          {params.refineryOffline ? ' · Bataan refinery offline' : ''}
        </div>

        {/* Price cards */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
          {[
            { label: 'EST. GASOLINE', value: `₱${result.gasoline.toFixed(2)}/L`, color: '#ef4444' },
            { label: 'EST. DIESEL', value: `₱${result.diesel.toFixed(2)}/L`, color: '#f97316' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '24px',
                borderRadius: '12px',
                background: 'rgba(10, 15, 26, 0.7)',
                border: `1px solid ${kpi.color}33`,
                borderTop: `2px solid ${kpi.color}`,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {kpi.label}
              </div>
              <div style={{ fontSize: '40px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
          }}
        >
          <span>energy-intelligence-map.vercel.app</span>
          <span>Model your own scenario →</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The build route table lists `/embed/scenario/opengraph-image` as an edge route.

- [ ] **Step 3: Manual check**

Run `pnpm dev`. Open `http://localhost:3007/embed/scenario/opengraph-image?s=150_12_62_1` directly in the browser — confirm a 1200×630 PNG renders with the "CRISIS" badge, a "₱.../L gasoline if this shock hits." headline, two price cards, and the scenario-inputs line. Open it again with no `?s=` — confirm it renders the default scenario without error. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add src/app/embed/scenario/opengraph-image.tsx
git diff --cached --stat   # expect: only the OG image route
git commit -m "add dynamic og image for shared scenario links"
```

---

## Task 7: AI-agent readiness — `llms.txt`, `llms-full.txt`, manifest, JSON-LD

Per the CLAUDE.md "AI Agent Readiness" checklist: `llms.txt` exists but predates the share/embed features; `.well-known/ai-manifest.json` does not mention them; there is no `llms-full.txt`. This task brings all three current and adds the missing one. JSON-LD already covers `WebApplication` + `Dataset`; we add one `WebPage`-typed entry naming the shareable-scenario capability so agents can discover it.

**Files:**
- Modify: `public/llms.txt`
- Modify: `public/.well-known/ai-manifest.json`
- Create: `public/llms-full.txt`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add a sharing section to `llms.txt`**

In `public/llms.txt`, locate the `## Pages` section. Insert a new section immediately AFTER the `## Pages` block and BEFORE `## Source Code`:
```
## Sharing & Embedding

The dashboard's scenario planner is fully shareable without an account:

- Scenario links — the homepage accepts an `?s=` query parameter encoding a modeled fuel-price scenario (`brent_hormuz_forex_refinery`, e.g. `/?s=140_10_61.5_1`). Opening such a link restores the exact sliders the sharer set.
- GET /embed/scenario?s=... — a minimal, iframe-ready card rendering the modeled gasoline/diesel prices and risk level for a scenario. Embed it in other sites.
- Each shared scenario link generates a dynamic Open Graph image, so links unfurl as rich cards on social platforms.
```

- [ ] **Step 2: Update `llms.txt` page list and stack notes**

In the same `## Pages` section of `public/llms.txt`, add this line after the `/references` entry:
```
- /embed/scenario — embeddable single-card widget for a modeled scenario (iframe-ready, accepts ?s=)
```
And in the `## For AI Agents` numbered list, append a new final item:
```
6. To embed a scenario card elsewhere, iframe /embed/scenario?s=<encoded-scenario>
```

- [ ] **Step 3: Add the embed route + share capability to `ai-manifest.json`**

In `public/.well-known/ai-manifest.json`, append a new object to the `apis` array (after the `/api/index` entry — mind the trailing comma on the existing last element):
```json
    {
      "path": "/embed/scenario",
      "method": "GET",
      "description": "Embeddable single-card widget rendering a modeled fuel-price scenario. Accepts an `s` query parameter (encoded scenario: brent_hormuz_forex_refinery). Iframe-ready, no chrome.",
      "cache": "static",
      "response_type": "text/html",
      "query_params": { "s": "Encoded scenario string, e.g. 140_10_61.5_1" }
    }
```
Then add a new top-level `"capabilities"` key after the `"apis"` array (and before `"datasets"`):
```json
  "capabilities": {
    "shareable_scenarios": {
      "description": "Modeled fuel-price scenarios are shareable via an `?s=` URL parameter on the homepage and the /embed/scenario route. No account required.",
      "param_format": "brent_hormuz_forex_refinery — e.g. /?s=140_10_61.5_1",
      "open_graph": "Shared scenario links generate dynamic Open Graph images for rich social unfurling."
    }
  },
```

- [ ] **Step 4: Create `llms-full.txt`**

Create `public/llms-full.txt`:
```
# PH Energy Intelligence Map — Full Reference for AI Agents

> Complete structured reference. For the concise overview see /llms.txt.

## Site

- Name: PH Energy Intelligence Map
- URL: https://energy-intelligence-map.vercel.app
- Purpose: Real-time intelligence dashboard for the Philippine oil supply chain.
- Repository: https://github.com/0xjitsu/oil_energy_map
- Stack: Next.js 14 (App Router), TypeScript, deck.gl, MapLibre GL, Tailwind CSS
- License: MIT

## Routes

- /                 — Main dashboard: WebGL supply-chain map, price panels, scenario planner, stress test, market players. Accepts ?s= to restore a shared scenario.
- /primer           — Educational guide to how oil supply chains work.
- /cascade          — Second-order cascade tracker: how an oil shock ripples through the economy.
- /references       — Data provenance catalog for every data source.
- /roadmap          — Phased expansion plan (PH -> ASEAN -> Global).
- /services         — RES/RAP energy-supply services for multi-site franchise operators.
- /embed/scenario   — Embeddable single-card widget for a modeled scenario (iframe-ready, accepts ?s=).

## Data APIs

All return JSON, no authentication, edge-cached.

- GET /api/prices    — Oil benchmarks: Brent crude, Dubai, MOPS, pump gasoline/diesel, PHP/USD forex. Shape: PriceBenchmark[].
- GET /api/events    — Aggregated Philippine energy news with severity ratings. Shape: TimelineEvent[].
- GET /api/sentiment — NLP sentiment of energy headlines. Shape: SentimentResult[].
- GET /api/index     — Machine-readable manifest of all API endpoints.

## Shareable Scenarios

The scenario planner serializes its state into a URL query parameter:

- Parameter: s
- Format: brent_hormuz_forex_refinery (underscore-delimited; underscore is used as the field separator because a dot can appear inside a decimal number and would make the field count ambiguous).
- Fields:
  - brent    — Brent crude price, USD/barrel. Range 60-180.
  - hormuz   — Weeks the Strait of Hormuz is disrupted. Range 0-16.
  - forex    — PHP/USD exchange rate. Range 54-65.
  - refinery — Bataan refinery offline flag. 0 = online, 1 = offline.
- Example: /?s=140_10_61.5_1  -> Brent $140, Hormuz 10 weeks, forex 61.5, refinery offline.
- Out-of-range or malformed values clamp to bounds or fall back to the default scenario (106_2_58.42_0).

## Scenario Model

calculatePumpPrice(brent, hormuz, forex, refinery) returns estimated gasoline and diesel
pump prices (PHP/L) and a risk level (green/yellow/red). Assumptions: base gasoline ~P65/L
at Brent $80 / PHP 56; each $1 Brent ~= P0.18/L; each P1 peso weakening ~= P0.90/L; Hormuz
disruption adds a rising per-week premium; Bataan offline adds ~P3/L import premium.

## Datasets

- Philippine Gas Stations — 10,469 stations from OpenStreetMap (ODbL). Brand, coordinates, fuel types, region, modeled operational status.
- Oil Supply Chain Infrastructure — refineries, import terminals, fuel depots (DOE Philippines + manual research).

## For AI Agents

1. Start with GET /api/index to discover data endpoints.
2. Use GET /api/prices and GET /api/events for live data.
3. To share or embed a scenario, build an `?s=` URL as documented above.
4. Iframe /embed/scenario?s=<encoded-scenario> to embed a scenario card.
5. See /.well-known/ai-manifest.json for the structured capability manifest.
```

- [ ] **Step 5: Add a scenario-sharing JSON-LD entry to `layout.tsx`**

In `src/app/layout.tsx`, locate the `jsonLdData` array. Append a third object to it (after the `Dataset` object, mind the comma):
```tsx
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PH Oil Scenario Planner",
    url: "https://energy-intelligence-map.vercel.app/?s=106_2_58.42_0",
    description:
      "Model a Philippine fuel-price shock — Brent crude, Strait of Hormuz disruption, PHP/USD forex, and refinery status — and share the result via a no-login URL.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isPartOf: {
      "@type": "WebApplication",
      name: "PH Energy Intelligence Map",
      url: "https://energy-intelligence-map.vercel.app",
    },
    potentialAction: {
      "@type": "ShareAction",
      target: "https://energy-intelligence-map.vercel.app/?s={scenario}",
    },
  },
```

- [ ] **Step 6: Verify lint and build pass**

Run: `pnpm lint && pnpm build`
Expected: both succeed. Confirm `public/llms-full.txt` is served — after build, `http://localhost:3007/llms-full.txt` (via `pnpm dev`) returns the file.

- [ ] **Step 7: Validate the JSON manifest parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/.well-known/ai-manifest.json','utf8')); console.log('manifest valid json')"`
Expected output: `manifest valid json`

- [ ] **Step 8: Commit**

```bash
git diff --cached --stat   # expect: nothing staged yet
git add public/llms.txt public/.well-known/ai-manifest.json public/llms-full.txt src/app/layout.tsx
git diff --cached --stat   # expect: only the four files above
git commit -m "document scenario sharing for ai agents — llms.txt, manifest, json-ld"
```

---

## Task 8: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all tests pass — the prior suite plus the 7 new `scenario-url` tests. (The `ShareButton` render test was deferred — see the Task 2 execution note — so no `ShareButton` tests are in the suite.)

- [ ] **Step 2: Clean build**

Run: `pnpm build`
Expected: succeeds. The route table includes `/embed/scenario` and `/embed/scenario/opengraph-image` (edge). Note the homepage `/` First Load JS — it should be within a few kB of the pre-wave figure; `ShareButton` and `scenario-url` are tiny, and the embed routes are separate entry points that do not load on `/`.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors; the only `react-hooks/exhaustive-deps` suppressions are the pre-existing timeline one and the one intentional mount-effect one added in Task 4.

- [ ] **Step 4: Manual virality walk-through**

Run `pnpm dev`. Confirm end-to-end:
1. On `/`, the Scenario Planner shows a "Share this view" button; set Hormuz to 12 weeks and click it — the link copies and the button flashes "✓ Copied".
2. Paste the copied URL into a fresh tab — the planner restores to 12 weeks.
3. Open `/embed/scenario?s=150_14_63_1` — a chrome-free card renders the modeled prices and a "Crisis" badge.
4. Open `/embed/scenario/opengraph-image?s=150_14_63_1` — a 1200×630 social card PNG renders.
5. Open `/llms-full.txt` — the full agent reference is served.
Stop the dev server.

---

## Self-Review Notes

- **Spec coverage:** Implements WS5a · Virality (no accounts) from `docs/superpowers/specs/2026-05-17-100x-platform-upgrade-design.md` — shareable scenario URLs with deep-link restore (T1, T4), a dynamic social OG card per scenario (T6), a lightweight Web-Share/copy-link affordance (T2, T4), an embeddable widget at `/embed/scenario` (T3, T5), and AI-agent readiness — `llms.txt`/`llms-full.txt`/manifest/JSON-LD (T7).
- **Deliberate cuts (YAGNI):** (1) **Map deep-linking** — the spec lists syncing `mapMode`/`selectedRegion`/`visibleBrands`/viewport to the URL. Cut: it touches the `IntelMap` viewport-state machine (a Wave 1 hotspot for RAF/cache bugs), adds far more surface area than the scenario URL, and the scenario is the share-worthy artifact a user actually *authors* — a map pan is not. Highest code cost, lowest virality. (2) **CSV/JSON data export** — listed under WS5a but it is a utility feature, not virality; it adds download UI to two more components for no shareability gain. (3) **WS5b Community scaffold entirely** — station reports, `corrections.json`, the commute tracker, email alert subscriptions — all explicitly the *later* heavyweight phase per the "phased" decision; Wave 4 is the lightweight-virality phase only. Result: 5 features delivered, 3 cut, every shipped feature is public, no-login, and uses zero new infra (no Supabase, no API routes).
- **No placeholders:** Every code step contains complete, runnable code — no TBD, no "add error handling" hand-waves. `decodeScenario` is fully defensive (clamping + malformed-input fallback) and that behavior is locked by tests. `ShareButton` handles the native-share, clipboard, and blocked-clipboard paths explicitly. Tasks 4 and 7 carry a "re-read the file" / "mind the trailing comma" guard because they edit existing multi-line structures.
- **Type consistency:** `ScenarioParams` (`{ brentPrice, hormuzWeeks, forexRate, refineryOffline }`) is the single shared shape across `scenario-url.ts`, `ScenarioPlanner`, `EmbedScenarioCard`, and both OG routes — all import it from `@/types`. `decodeScenario` returns `ScenarioParams`; `onParamsChange` accepts `ScenarioParams | (prev => ScenarioParams)`, so `onParamsChange(decodeScenario(raw))` typechecks. `calculatePumpPrice` returns `ScenarioResult` (`{ gasoline, diesel, riskLevel: 'green'|'yellow'|'red' }`); the `RISK_LABEL`/`riskTheme` maps in T5/T6 are keyed by exactly those three literals. `SCENARIO_PARAM` is exported from `scenario-url.ts` and reused by `ScenarioPlanner` so the read key and write key never drift.
- **Sequential / no-conflict ordering:** Tasks 1→8 run in order. `scenario-url.ts` (T1) and `ShareButton.tsx` (T2) are created before T4 imports them. The `/embed/layout.tsx` (T3) exists before T5 adds `/embed/scenario/page.tsx` under it. `ScenarioPlanner.tsx` is touched only by T4. `layout.tsx` is touched only by T7. `public/*` files are touched only by T7. No file is modified by two tasks, so subagent-driven execution has no merge conflicts.
- **Commit hygiene:** Every commit step stages only its named files and runs `git diff --cached --stat` before committing, because the working tree carries pre-existing unrelated WIP (`page.tsx`, `Header.tsx`, untracked `docs/`/`lighthouse-*`). No `git add .` / `git add -A`. No push.
