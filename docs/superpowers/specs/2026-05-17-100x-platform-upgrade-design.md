# PH Oil Intelligence — "100x" Platform Upgrade Design

**Date:** 2026-05-17
**Status:** Approved design — ready for implementation planning
**Topic:** Comprehensive audit-driven upgrade across performance, data honesty, design, narrative, and participation

---

## Goal

Transform the PH Oil Intelligence Dashboard from a read-only data visualization into a fast, honest, accessible, story-driven, and shareable intelligence platform — worthy of a world-class / Webby-caliber standard, and built to encourage broad participation.

## Context

A 4-agent parallel audit of the codebase (82 components, 6 routes, 6 API routes) surfaced ~40 findings across five dimensions:

- **Efficiency** — Homepage ships 447 kB / 552 kB First Load JS. Root causes: 3.7 MB of station JSON statically imported into the bundle; `usePrices`/`useEvents` spawn 11 independent polling loops; a module-global cache bug; a stale-closure bug; dead code in the bundle.
- **Design** — 351 hardcoded color values across 71 files violate the token system, silently breaking the crisis-adaptive color engine. Focus rings exist in only 2 files (WCAG-failing keyboard nav). Hero KPI cards are `<div onClick>` — inaccessible.
- **Functionality** — Several "live" features are simulations labeled as real (VitalSigns static "HIGH" risk; hash-derived station statuses under a "monitored" header; stale pump-price fallback). No deep-linking, export, or sharing.
- **Narrative** — Homepage opens with a chart, not a story. No emotional hook. Cascade page renders a literal bug: `"₱3,200/monthnth"`.
- **Participation** — 100% read-only today.

## Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Scope | Plan all 5 workstreams together as one phased program |
| Audience | All three (public / journalists+researchers / policy+industry), **public-first** — narrative leads emotional, credibility layers underneath |
| Participation | **Phased** — lightweight virality first, community contributions as a later phase |
| Data honesty | **Label honestly + wire real data where feasible** — "Estimated/Modeled" badges now, build real DOE pump-price scraping |
| Program structure | **Approach B — foundation-gated parallel waves** |

## Constraints

- Next.js 14 App Router, deck.gl + MapLibre, Recharts, Tailwind, dark theme — preserve the stack.
- Vercel Hobby plan: serverless timeout limits, daily-only cron (additional weekly cron added in WS2).
- No database for core dashboard state — state lives in API responses + client hooks. Supabase is used only for participation features (station reports, alert subscriptions) and the existing contact form.
- Must preserve existing static fallbacks — the dashboard never breaks on API failure.
- Design token discipline — no hardcoded `rgba()`/hex/semantic Tailwind colors.
- Honor the CLAUDE.md "no silent fallbacks on aggregates" rule for every new metric.

---

## Architecture — the spine

Two structural shifts that the later waves depend on:

### 1. Station data leaves the JS bundle

Today `src/data/stations/index.ts` statically imports 7 brand JSON files (~3.7 MB; `others.json` alone is 2.1 MB) and runs `assignStationStatus()` over 10,469 rows at module-import time. Seven modules import it, so it lands in the homepage bundle.

**Change:** Serve station data via fetch — either the existing `/api/index` route or a static `public/data/stations.json`. Load it inside `IntelMap` after mount, behind the existing fixed-height skeleton (no CLS). Status assignment moves to post-fetch.

### 2. A single `DataProvider` context

Today `usePrices` and `useEvents` are each called 5–6 times across the component tree, each spawning its own `setInterval`. That is 11 concurrent polling loops per browser.

**Change:** A `DataProvider` (new, or an extension of `CrisisProvider`) calls `usePrices` and `useEvents` exactly once and distributes results via React context. All consumers (`ExecutiveSnapshot`, `ScenarioPlanner`, `Ticker`, `Header`, `AlertBanner`, `PumpPrices`, `PricePanel`, `EventTimeline`, `Footer`) read from context. 11 loops collapse to 2.

This consolidated context is the substrate WS4's crisis-driven hero headline reads from, and the consolidated scenario state WS5's shareable URLs serialize.

---

## Wave 1 — Foundation & Performance (hard gate)

**Goal:** First Load JS for `/` from 447 kB to ≤200 kB; one source of truth for live data; zero known render bugs.

| Change | File(s) | Rationale |
|--------|---------|-----------|
| Station JSON → fetch after mount | `src/data/stations/index.ts`, `src/components/map/IntelMap.tsx`, `src/app/api/index/route.ts` | Removes ~3.7 MB from the bundle |
| Centralize polling (11 → 2 loops) | new `src/lib/DataProvider.tsx` (or extend `CrisisProvider`), 9 consumer components | Single source of truth |
| Collapse double `dynamic()` | `src/app/page.tsx`, `src/components/map/MapWrapper.tsx` | `MapWrapper` adds nothing; two dynamic hops delay LCP |
| `recharts` → `optimizePackageImports`; replace `SparkChart` with hand-rolled SVG | `next.config.mjs`, `src/components/ui/SparkChart.tsx` | ~100 kB saved; cascade page already hand-rolls SVG |
| Fix module-global cache bug | `src/components/map/StationLayer.tsx` | Module-level `let` cache → `useRef` in `IntelMap` |
| Fix stale-closure bug | `src/components/scenarios/ScenarioPlanner.tsx` | Use functional updater; remove `exhaustive-deps` suppressions |
| Fix 60 fps RAF state commits | `src/components/map/IntelMap.tsx` | Accumulate animation time in a ref; commit at layer cadence |
| De-duplicate `filteredStationCount` | `src/components/map/IntelMap.tsx`, `StationLayer.tsx` | Filter 10,469 rows once, not twice |
| `Cache-Control` on API error/catch branches | `src/app/api/prices/route.ts`, `src/app/api/events/route.ts` | Thundering-herd guard on upstream outage |
| Delete dead code | `src/components/map/LayerControls.tsx`, `src/pages/_error.tsx` | Superseded / unused router artifact |

**Gate:** `pnpm build` green · First Load JS for `/` measured and documented (target ≤200 kB) · exactly 2 polling loops · no `react-hooks/exhaustive-deps` suppressions · all 3 map modes render.

---

## Wave 2 — runs as two parallel tracks

### Track A — WS2 · Data Honesty

**Goal:** Every number on screen has honest provenance.

- `VitalSigns.tsx` — in `live` mode, add `SourceAttribution` with `derived="Estimated from DOE baseline + editorial"`; the bare "HIGH" risk badge no longer implies live monitoring.
- `StationTrackerSection.tsx` — change "10,469 monitored stations" to "Estimated supply-stress distribution"; add a visible disclaimer that per-station status is modeled (deterministic `djb2` hash), not telemetry.
- `src/data/prices.ts` — audit and correct stale fallback values (diesel ₱130.75 is implausible vs. gasoline); add a build-time assertion that the four benchmark IDs exist.
- Surface a live-vs-cached indicator on `PricePanel` and `ExecutiveSnapshot` using the existing `isLive` pattern.
- `src/app/api/sentiment/route.ts` — return HTTP 200 with a static fallback `SentimentResult[]` (currently returns 503), matching the events/prices fallback pattern.
- `ImpactCards` — wire values to `calculatePumpPrice(scenarioParams)` instead of hardcoded `IMPACT_ITEMS` strings.
- `src/lib/monte-carlo.ts` — use the user's `hormuzWeeks` as the simulation mean instead of discarding it.
- **New real data** — add a weekly Vercel cron that scrapes DOE Oil Monitor SRP and writes pump-price values to a Supabase `pump_prices` table read by `/api/prices`. `src/data/prices.ts` remains the last-resort static fallback if both the scrape and the table read fail.

**Gate:** every displayed metric has a source or "Estimated" badge or is genuinely live · DOE scraper runs weekly · build-time data assertions pass.

### Track B — WS3 · Design System & Accessibility

**Goal:** Token discipline restored (crisis color system works end-to-end); WCAG AA.

- Token pass — replace 351 hardcoded colors with design tokens. Add `status-success` / `status-danger` / `status-warning` token aliases mapped to CSS variables in `tailwind.config.ts` and `globals.css`. Priority files: `ExecutiveSnapshot.tsx`, `VitalSigns.tsx`, `EventTimeline.tsx`, `Header.tsx`, `src/components/services/*`.
- Add a global `:focus-visible` ring in `globals.css`.
- `ExecutiveSnapshot.tsx` — convert HeroKPI `<div onClick>` cards to `<button>` with `aria-label`.
- `Header.tsx` — redesign mobile nav (fix 6-links-at-9px cramping; hamburger or scrollable).
- `globals.css` — remove the duplicate `.fade-in-section` definition; reconcile token opacity values with the CLAUDE.md spec (current values diverge — e.g. `--text-dim` is 0.5, spec says 0.2).
- `MobileBottomNav.tsx`, `SectionNav.tsx` — replace emoji nav icons with inline SVG; `aria-hidden` on decorative glyphs.
- `ActDivider.tsx` — move the parallax `transform` to an inner absolutely-positioned background layer (currently janks the container).
- `src/app/layout.tsx` — make the skip link per-page (currently hardcoded `#snapshot`, breaks on 5 sub-pages).
- Add dark-theme `::selection` styling.

**Gate:** 0 hardcoded colors in the audit grep · visible focus ring on every interactive element · Lighthouse accessibility ≥95 · crisis color shift visibly cascades blue→amber→red.

---

## Wave 3 — WS4 · Narrative & Storytelling

**Goal:** A first-time visitor understands the "so what" in 10 seconds; the dashboard tells a story.

- **Act 0 — crisis hero.** A new full-width hero above `ExecutiveSnapshot`: one large sentence driven by the live crisis score (e.g. *"Philippine energy is at ELEVATED risk. Diesel is up X% — here's why, and what it costs your family."*). Reads from the WS1 `DataProvider` context + `crisisLevel`.
- **Human hook in Act 1** — pull a human-impact statement up from the buried `ImpactCards`; use the `criticalInsight` voice from `src/data/cascade.ts`.
- **Fix the cascade bug** — `src/app/cascade/CascadePage.tsx:61` renders `{cascadeHeadline.householdImpact}nth`, producing `"₱3,200/monthnth"`. Replace with a clean human sentence.
- **Onboarding** — replace the 2 s auto-opening modal in `HowToGuide.tsx` with a dismissible inline hint; reframe step 1 around the "so what," not the controls.
- Sharpen `ActDivider` hook copy to consequence-driven one-liners.
- Cross-link `/primer` ↔ `/cascade` ("see the human impact →").
- Add **Act 5 — "what to do"**: a closing section with actions (the `/services` RES/RAP bid, conservation, the commute tracker).

**Gate:** the hero headline changes with the crisis score · a 10-second comprehension check passes · the cascade page renders clean copy.

---

## Wave 4 — WS5 · Participation (two parallel tracks)

### Track A — WS5a · Virality (no accounts)

- **Shareable scenario URLs** — encode `ScenarioParams` as a compact base64 query param (`?s=...`); read and apply on mount; add a "Copy link" button in `ScenarioPlanner.tsx`.
- **Map deep-linking** — sync `mapMode`, `selectedRegion`, `visibleBrands`, and viewport bounds to the URL via `useSearchParams`.
- **Social OG cards** — a dynamic `opengraph-image` route using Next.js `ImageResponse` (edge runtime), encoding scenario params (e.g. *"₱95/L gasoline in 8 weeks — 73% probability"*).
- **Data export** — client-side CSV/JSON download on `StationTrackerSection` and `PricePanel` (no API needed).
- **Embeddable widgets** — `/embed/[panel]` routes for the price ticker, crisis badge, and scenario result card; iframe-ready.

### Track B — WS5b · Community scaffold

(Foundation for community contributions; the full moderated feature is a later phase per the "phased" decision. Uses the Supabase + Resend integrations already configured.)

- "Report incorrect info" button on station tooltips → a new `/api/report` route → Supabase `station_reports` table.
- A `corrections.json` overlay mechanism so flagged stations can be overridden over the OSM source data.
- Personalized **"my commute" tracker** — a `localStorage` widget: vehicle type, daily km, fuel type → a persistent "you're paying ₱X more/month" banner.
- **Email alert subscriptions** — extend `useAlerts` with an optional email field → Supabase `alert_subscriptions` table; a daily cron checks prices against subscribed rules and sends via Resend.

**Gate:** a scenario URL round-trips correctly · the OG card renders · `export` produces valid CSV/JSON files · the embed route renders in an iframe · a station report inserts to Supabase · the commute tracker persists across reload.

---

## Cross-cutting concerns (all waves)

### Error handling

- Preserve the established pattern: every API route returns HTTP 200 with static fallback data on upstream failure — the dashboard never shows an empty state from an API error. Extend this to `/api/sentiment` in WS2.
- Per the CLAUDE.md "no silent fallbacks on aggregates" rule: every new aggregate (scalar or list) gets a producer-side sanity-range validator that hard-fails the build/write on a missing or out-of-band field, and a consumer-side visible "insufficient data" state — never a silent `0` / `0%` / hidden section.

### Testing

- A regression test per new KPI card, chart, or table asserting the headline field stays inside a sane range (the CLAUDE.md rule).
- Build-time data assertions for the four price benchmark IDs and the station dataset shape.
- Visual spot-checks of the 3 map modes and the new narrative sections after Waves 3–4.

### Execution model

- Each wave becomes its own implementation plan via the `writing-plans` skill.
- Each plan is executed subagent-driven, with parallel agents inside a wave where tasks are independent (notably the two parallel tracks in Waves 2 and 4).
- Wave gates are hard: the next wave does not start until the current wave's gate criteria pass.

## Out of scope

- Full moderated community-contributions UI (review queue, voting, contributor reputation) — a later phase after WS5b lays the scaffold.
- Real per-station live status telemetry — not obtainable; station status stays modeled-but-clearly-labeled.
- Replacing deck.gl / MapLibre / Recharts — the stack stays; Recharts usage is reduced, not removed wholesale.
- Authentication / user accounts — the participation features are deliberately account-free (virality) or single-table-keyed (email subscriptions).

## Success criteria (program-level)

1. Homepage First Load JS ≤ 200 kB (from 447 kB).
2. Exactly 2 client polling loops (from 11).
3. 0 hardcoded color values; the crisis color system visibly cascades.
4. Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO 100.
5. Every on-screen metric has honest provenance (live, DOE-sourced, or "Estimated/Modeled").
6. A first-time visitor understands the "so what" within 10 seconds.
7. Any meaningful dashboard state (scenario, map view) is shareable via URL.
8. The dashboard never breaks on API failure — static fallbacks hold.
