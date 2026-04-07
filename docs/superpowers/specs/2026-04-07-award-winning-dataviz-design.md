# Award-Winning Data Visualization Upgrade — Design Spec

> **For agentic workers:** This spec defines three parallel workstreams for v1. Each workstream is independent and can be implemented by a separate agent.

**Goal:** Transform the PH Oil Intelligence Dashboard from a functional data dashboard into an award-caliber (IIB / Webby) data visualization platform with an adaptive Evangelion NERV-inspired UI that reacts to crisis severity.

**Architecture:** Three parallel workstreams — (WS-A) Adaptive Crisis UI system, (WS-B) Data Visualization upgrade, (WS-C) Polish & Loading States. All share the existing design token system and extend it.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, CSS custom properties, Recharts, deck.gl 9.2, MapLibre GL 5

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Narrative frame | Hybrid: War Room (dashboard) + Documentary (primer) + Game HUD (accents) | Plays to each page's natural strength |
| Target audience | Progressive disclosure — journalist surface, analyst depth | Wins IIB awards: accessible surface, expert depth |
| NERV intensity | Adaptive — calm state is clean/professional, crisis state shifts to NERV | UI becomes a visualization itself; technically impressive |
| V1 scope | Adaptive Crisis UI + Data Viz Upgrade + Polish | Signature feature + substance + award-readiness |
| V2 deferred | Primer scrollytelling overhaul, sound design, shareable scenarios | Separate workstreams, not blocked by v1 |

---

## WS-A: Adaptive Crisis UI System

**Goal:** Create a CSS custom property system that shifts the entire dashboard aesthetic based on aggregate risk score — from calm/professional to tense/alert to full NERV crisis mode.

### Crisis Levels

| Level | Trigger | Visual Treatment |
|-------|---------|-----------------|
| **CALM** (0–30) | Low risk, stable prices | Current clean glass morphism. Subtle blue accents. Professional. |
| **ELEVATED** (31–60) | Moderate risk, price volatility | Amber/orange accent shift. Subtle pulsing border on risk cards. Typography weight increases on KPIs. |
| **CRISIS** (61–100) | High risk, multiple red events | NERV mode: scan line overlay fades in (CSS `background-image` repeating gradient), card borders shift to angular (`clip-path` or `border-image`), status-red bleeds into background, alert typography scales up, header gets warning chevrons. |

### New Design Tokens

Add to `:root` in `globals.css` and map in `tailwind.config.ts`:

| Token | CALM default | ELEVATED | CRISIS | Purpose |
|-------|-------------|----------|--------|---------|
| `--accent-primary` | `#3b82f6` (matches `--accent-petron`) | `#f59e0b` (amber) | `#ef4444` (red) | Shifts accent color globally |
| `--bg-card-crisis` | `rgba(10, 15, 26, 0.7)` (same as card) | `rgba(20, 15, 10, 0.7)` (warm tint) | `rgba(30, 10, 10, 0.7)` (red tint) | Card background override |
| `--border-crisis` | `rgba(255,255,255,0.06)` | `rgba(245,158,11,0.15)` | `rgba(239,68,68,0.2)` | Border override |
| `--scan-line-opacity` | `0` | `0` | `0.03` | Scan line visibility |

### Crisis Score Formula

**Inputs:**
- `redEventCount`: number of events with `severity === 'red'` (weight: 8 points each, max 40)
- `yellowEventCount`: number of events with `severity === 'yellow'` (weight: 2 points each, max 20)
- `brentDelta`: `(currentBrent - previousWeekBrent) / previousWeekBrent * 100` — clamped to [0, 20], then scaled to [0, 20]
- `hormuzWeeks`: scenario param, maps to [0, 20] (0 weeks = 0, 4+ weeks = 20)

**Formula:** `crisisScore = min(100, redPoints + yellowPoints + brentDelta + hormuzPoints)`

**Default:** 25 (CALM) when no data is loaded. Falls back to CALM if computation errors.

### Implementation Approach

- **Single source of truth:** The `CrisisProvider` React context computes the crisis score and sets **discrete token overrides** on `<html>` style attribute — not a continuous interpolation. It sets `--accent-primary`, `--bg-card-crisis`, `--border-crisis`, and `--scan-line-opacity` based on which threshold band the score falls in (CALM/ELEVATED/CRISIS). CSS `transition: all 1.5s ease` on `:root` handles smooth visual shifts between levels.
- **No `@property` registration needed** — the context sets actual color values, not numeric interpolation targets
- **Token overrides per level:** See table above
- **Scan line effect:** CSS `background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255, var(--scan-line-opacity)) 2px, rgba(255,255,255, var(--scan-line-opacity)) 4px)` applied to `body`
- **Angular border accents:** Use `::before`/`::after` pseudo-elements positioned at card corners to create NERV-style angular marks — NOT `clip-path` (which clips `backdrop-filter` and `box-shadow`). Pseudo-elements use `border-left` + `border-top` with `border-color: var(--border-crisis)` and are rotated/positioned at corners. Opacity driven by crisis level.

### Files

- Create: `src/lib/crisisLevel.ts` — compute aggregate crisis score from events + scenario params using formula above
- Create: `src/lib/CrisisProvider.tsx` — React context provider in `src/lib/` (follows existing project pattern, no new `contexts/` directory), sets token overrides on `<html>`
- Modify: `src/app/globals.css` — add crisis-level CSS custom property overrides, scan line utility, angular clip-paths
- Modify: `src/app/layout.tsx` — wrap with CrisisProvider
- Modify: `src/components/layout/Header.tsx` — warning chevrons at CRISIS level
- Modify: `src/components/layout/AlertBanner.tsx` — enhanced glow + NERV typography at CRISIS

### Constraints

- Must respect `prefers-reduced-motion` — use a **global blanket rule**: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }` This ensures all new animations (scan lines, pulsing, stagger, counters) are disabled without needing per-class overrides.
- WCAG AA contrast must be maintained at all crisis levels (4.5:1 minimum)
- Performance: CSS-only transitions, no per-frame JS. The crisis level updates at most every 30 seconds (on data refresh), not continuously
- Touch devices: `@media (hover: none)` guard on hover-dependent crisis effects

---

## WS-B: Data Visualization Upgrade

**Goal:** Replace flat text cards with proper data visualizations where data exists. Bigger numbers, animated counters everywhere, linked interactions between related panels.

### Upgrades by Component

| Component | Current | Upgrade |
|-----------|---------|---------|
| **ExecutiveSnapshot** | 6 KPI cards with sparklines | Add animated delta arrows that scale with magnitude. Sparklines get crisis-colored gradients. Add "vs. last week" comparison row. |
| **PricePanel** | 6 benchmark cards | Add historical context line on sparklines (30-day average as dashed line). Prices that exceed historical range get a glow effect. |
| **VitalSigns** | 4 bar charts | Replace with horizontal gauge bars (like PlayerCards risk bars). Add threshold markers (green/yellow/red zones). |
| **MarketShare** | Recharts PieChart donut | Add animated segment hover — hovering a donut segment highlights the corresponding PlayerCard. Add % label inside donut center. |
| **StressTest** | 4 risk category cards | Add mini radar/spider chart showing all 4 risk dimensions at once. Keep cards as detail view below. |
| **SentimentGauge** | Horizontal bar + headline list | Add sentiment trend sparkline (last N readings). Show sentiment shift direction arrow. |

### Linked Interactions

- Hovering a MarketShare donut segment → highlights corresponding PlayerCard (border glow)
- Hovering a price benchmark → shows the same metric highlighted in Executive Snapshot
- Clicking a severity filter in EventTimeline → filters the distribution bar in real-time (already works)

**Cross-component communication:** Use a lightweight React context (`src/lib/HighlightContext.tsx`) with `{ highlightedPlayer: string | null }` state. Both `MarketShare` and `PlayerCards` consume it. No new dependencies needed — React context is sufficient since both components are in the same render tree on `page.tsx`.

### Progressive Disclosure Pattern

Every card gets a consistent drill-down pattern:
1. **Surface:** Hero number + delta + sparkline (visible at a glance)
2. **Hover:** Tooltip with context (what this means, historical comparison)
3. **Click/Expand:** Full detail view with methodology, data source attribution, and deeper charts

### Files

- Modify: `src/components/layout/ExecutiveSnapshot.tsx` — animated deltas, crisis-colored sparklines
- Modify: `src/components/prices/PricePanel.tsx` — historical context line, range glow
- Modify: `src/components/health/VitalSigns.tsx` — horizontal gauges with threshold markers
- Modify: `src/components/players/MarketShare.tsx` — hover linking, center label
- Modify: `src/components/scenarios/StressTest.tsx` — mini radar chart
- Modify: `src/components/health/SentimentGauge.tsx` — trend sparkline
- Create: `src/components/ui/GaugeBar.tsx` — reusable horizontal gauge with threshold zones

### Constraints

- No new dependencies — use Recharts (already installed) for any new charts
- Radar chart: For only 4 data points, use a **pure SVG radar** (4 axes drawn with `<line>` + `<polygon>` for the data shape) rather than Recharts `RadarChart`. Simpler to style for dark/NERV theme (transparent bg, custom stroke colors via design tokens, glowing data polygon). ~50 lines of SVG vs fighting Recharts theming.
- All animations CSS-first (`transition`, `@keyframes`), not framer-motion
- Sparkline crisis coloring reads from `--accent-primary` CSS variable so it auto-adapts with WS-A

---

## WS-C: Polish & Loading States

**Goal:** Add the finishing touches that separate "cool project" from "award submission" — loading skeletons, error boundaries, staggered animations, and empty states.

### Loading Skeletons

Every `dynamic()` import gets a matching skeleton loader:
- `PricePanel` → 6 skeleton cards with `animate-pulse` bars
- `ScenarioPlanner` → 4 skeleton slider rows
- `MarketShare` → skeleton circle + 3 skeleton cards
- `PlayerCards` → 3 skeleton cards
- `ImpactCalculator` → skeleton form + result cards
- `StressTest` → 4 skeleton category cards
- `TimelineScrubber` → skeleton slider bar
- `HowToGuide` → skeleton overlay (low priority)

Each skeleton must have a fixed `min-h` matching the loaded component to prevent CLS.

### Error Boundary

- Create: `src/app/error.tsx` — themed error UI with retry button, glass-card styling, NERV-aesthetic error message ("SYSTEM ERROR — PATTERN BLUE" style at CRISIS level)
- Each section should degrade gracefully — if one API fails, the rest still renders

### Staggered Animation Sequence

On initial page load, sections animate in with staggered delays:
- Executive Snapshot: 0ms (immediate — LCP)
- Map: 100ms
- Act dividers: fade in as they enter viewport (IntersectionObserver)
- Below-fold sections: animate only when scrolled into view

### Empty States

When data is unavailable:
- Events: "No intelligence feeds available — monitoring offline sources" with muted icon
- Prices: "Price feeds offline — showing last known values" with timestamp
- Stations: "Station data loading..." with skeleton map markers

### Data Source Attribution

Add a subtle footer to each data card:
- "Source: Yahoo Finance · Updated 3m ago" for live data
- "Source: DOE Oil Monitor · Week of Mar 24" for weekly data
- "Derived from Brent + Forex" for calculated values
- Style: `text-[10px] font-mono text-text-muted` — matches existing label pattern, maintains WCAG AA contrast

### Files

- Create: `src/app/error.tsx` — themed error boundary
- Create: `src/components/ui/Skeleton.tsx` — reusable skeleton primitives (bar, circle, card)
- Modify: `src/app/page.tsx` — add skeleton loading props to all `dynamic()` imports
- Modify: all data-displaying components — add source attribution footer
- Modify: `src/app/globals.css` — stagger animation utilities

### Constraints

- Skeletons must match exact dimensions of loaded components (measure current heights)
- `prefers-reduced-motion`: skip stagger, show all immediately
- Error boundary must not break the glass morphism aesthetic
- Source attribution uses `text-[10px] font-mono text-text-muted` — consistent with project label pattern

---

## Workstream Dependencies

```
WS-A (Crisis UI) ──────────────────────────► Done
                                              ↓
WS-B (Data Viz) ───────────────────────────► Reads --accent-primary from WS-A
                                              ↓
WS-C (Polish) ─────────────────────────────► Done

All three can start in parallel.
WS-B benefits from WS-A's CSS variables but can use fallback values initially.
WS-C is fully independent.
```

---

## Acceptance Criteria

1. **Crisis adaptation:** Manually setting risk score to 80+ visually transforms the dashboard (scan lines, amber→red shift, angular borders)
2. **Progressive disclosure:** Every KPI card has surface → hover → expand depth
3. **Loading states:** Navigating to dashboard shows skeletons before dynamic components load
4. **Error resilience:** Killing the `/api/prices` endpoint doesn't break the rest of the dashboard
5. **Accessibility:** `prefers-reduced-motion` disables all animations and scan lines
6. **Performance:** No new JS animation libraries. All visual transitions via CSS.
7. **Design tokens:** No hardcoded `rgba()` values — everything through CSS custom properties
8. **WCAG AA:** All text maintains 4.5:1 contrast ratio at every crisis level

---

## Award Submission Framing

For IIB / Webby submission, the narrative is:

> "PH Energy Intelligence Map — a real-time supply chain dashboard that adapts its visual language to match the severity of the crisis it's monitoring. During normal operations, it presents clean, professional data visualization. As supply chain risks escalate, the interface itself transforms — borders sharpen, colors shift to alert tones, and scan line patterns emerge — making the UI a data visualization in its own right. The dashboard doesn't just show you the crisis. It makes you feel it."

This framing hits all four IIB criteria:
- **Interesting:** The adaptive UI is a novel concept
- **Accurate:** Real data feeds (Brent, forex, DOE prices, RSS intelligence)
- **Useful:** Progressive disclosure serves both casual and expert audiences
- **Beautiful:** The calm→crisis transition is visually dramatic
