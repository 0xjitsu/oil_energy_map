# Repository Documentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create comprehensive repository documentation so future AI and human collaborators can contribute with zero context-gathering overhead — plug and play.

**Architecture:** 5 documentation files covering architecture, components/hooks, API routes, contributing guide, and a CLAUDE.md update to capture new crisis UI + dataviz patterns. Each file is independent and can be written in parallel.

**Tech Stack:** Markdown documentation, no build tooling required

---

## Context

The PH Oil Intelligence Dashboard has strong inline documentation (CLAUDE.md at 184 lines, README.md at 259 lines) but lacks the structured reference docs that let a new contributor — human or AI — understand data flow, component contracts, hook APIs, and contribution workflows without reading source code. The codebase has grown to 13 component directories, 12 hooks, 5 API routes, 8 lib modules, and 3 type files.

**Current state (6.5/10 plug-and-play):**
- CLAUDE.md: Design tokens, code patterns, file organization — solid but missing crisis UI and dataviz additions
- README.md: Hero, quick start, features, deploy — good for first impression

**Missing (target: 9/10):**
- ARCHITECTURE.md — data flow, state management, rendering pipeline
- COMPONENTS.md — component inventory with props, usage, and dependencies
- API.md — route contracts, data sources, polling intervals, fallback behavior
- CONTRIBUTING.md — setup, conventions, PR workflow, testing
- CLAUDE.md updates — crisis UI system, skeleton/FadeIn patterns, HighlightContext

**Constraints:**
- Docs must be accurate to *current* codebase state (post crisis-UI + dataviz commits)
- No opinions or aspirational content — document what exists
- Follow CLAUDE.md's own style: tables over bullet lists, scannable sections

---

## File Manifest

| # | Action | File | Purpose |
|---|--------|------|---------|
| 1 | Create | `docs/ARCHITECTURE.md` | Data flow, state tree, rendering pipeline, crisis system |
| 2 | Create | `docs/COMPONENTS.md` | Component inventory — props, usage patterns, dependencies |
| 3 | Create | `docs/API.md` | API route contracts, data sources, polling, fallbacks |
| 4 | Create | `CONTRIBUTING.md` | Setup, conventions, PR workflow, code quality gates |
| 5 | Modify | `CLAUDE.md` | Add crisis UI, skeleton, FadeIn, HighlightContext patterns |
| 6 | Modify | `README.md` | Add links to new docs in navigation |

---

## Task 1: Architecture Documentation

**Files:**
- Create: `docs/ARCHITECTURE.md`

- [ ] Step 1: Read source files to gather architecture details

Read these files to extract accurate information:
- `src/app/page.tsx` — page structure, section ordering, provider nesting
- `src/lib/CrisisProvider.tsx` — crisis context, CSS token injection
- `src/lib/crisisLevel.ts` — score computation, level thresholds
- `src/lib/HighlightContext.tsx` — cross-component hover linking
- `src/hooks/usePrices.ts` — price polling, history accumulation
- `src/hooks/useEvents.ts` — event polling, retry logic
- `src/hooks/useSentiment.ts` — sentiment polling
- `src/lib/scenario-engine.ts` — scenario computation
- `src/app/layout.tsx` — root layout, font setup

- [ ] Step 2: Write `docs/ARCHITECTURE.md`

Structure the document with these sections:

```markdown
# Architecture

## Overview
[One paragraph: Next.js App Router, client-heavy SPA, no database]

## Page Structure
[Section ordering: Header → SectionNav → Act 1-4 → Footer]
[Provider nesting: CrisisProvider > HighlightProvider]

## Data Flow
[Table: Data Source → API Route → Hook → Component]
| Data | Source | API Route | Hook | Polling | Fallback |
|------|--------|-----------|------|---------|----------|

## State Management
[No global store — React Context + hooks only]
[CrisisContext: crisisLevel, crisisScore]
[HighlightContext: highlightedPlayer]
[Local state: mapMode, scenarioParams, timelinePosition in page.tsx]

## Crisis UI System
[Score formula, level thresholds, CSS token injection]
[data-crisis-level attribute on <html>]
[Token table: CALM → ELEVATED → CRISIS values]

## Rendering Pipeline
[Static imports vs dynamic() imports]
[Skeleton loaders wired to dynamic() loading prop]
[FadeIn with IntersectionObserver]
[SSR safety: 'use client' directive, useEffect gates]

## Map Engine
[deck.gl + MapLibre GL via react-map-gl/maplibre]
[Layer factory pattern: createFacilityLayers, createRouteLayers, createStationLayer]
[Three modes: LIVE, SCENARIO, TIMELINE]

## Scenario Engine
[ScenarioParams shape, computation pipeline]
[How params flow: page.tsx state → CrisisProvider + ScenarioPlanner + map]
```

- [ ] Step 3: Verify accuracy — spot-check 3 claims against source code

- [ ] Step 4: Commit: "add architecture documentation"

---

## Task 2: Component & Hook Reference

**Files:**
- Create: `docs/COMPONENTS.md`

- [ ] Step 1: Inventory all components and hooks

Scan ALL directories under `src/components/` for exports and props:
- `src/components/alerts/` — AlertBell, AlertDrawer, AlertRuleModal
- `src/components/cascade/` — CascadeCard, CascadeFlow, CascadeSection, ImpactMeter
- `src/components/consumer/` — ImpactCalculator
- `src/components/health/` — VitalSigns, SentimentGauge, EventTimeline, StationTrackerSection
- `src/components/layout/` — Header, Footer, AlertBanner, ExecutiveSnapshot, SectionNav, MobileBottomNav
- `src/components/map/` — MapWrapper, LayerControls, TimelineSlider, StationTooltip, FacilityTooltip
- `src/components/onboarding/` — HowToGuide
- `src/components/players/` — MarketShare, PlayerCards
- `src/components/prices/` — PricePanel, PumpPrices, ImpactCards
- `src/components/primer/` — Oil Primer page components
- `src/components/scenarios/` — ScenarioPlanner, StressTest
- `src/components/timeline/` — TimelineScrubber
- `src/components/ui/` — Skeleton, FadeIn, ScrollProgress, SourceAttribution, EmptyState, GaugeBar, Ticker, Tooltip/InfoTip
- `src/hooks/` — list ALL files in the directory by scanning, do not assume the count

- [ ] Step 2: Write `docs/COMPONENTS.md`

Structure with two main sections:

```markdown
# Components & Hooks Reference

## Layout Components
[Table per component: Name, File, Props, Used By, Notes]

## Map Components
[Same table format]

## Price Components
...

## Health & Intelligence Components
...

## Scenario Components
...

## UI Primitives
[Table: Name, File, Props, Usage Pattern]
[Special callout for glass-card, FadeIn, Skeleton patterns]

---

## Hooks Reference

[Table: Hook, File, Returns, Polling, Dependencies, Notes]
| Hook | File | Returns | Polling | Notes |
|------|------|---------|---------|-------|
| usePrices | src/hooks/usePrices.ts | { prices, priceHistory, isLive } | 5min | Accumulates history |
| useEvents | src/hooks/useEvents.ts | { events, loading, error } | 3min | Exponential backoff |
...
```

- [ ] Step 3: Verify 5 component prop signatures against source

- [ ] Step 4: Commit: "add component and hook reference documentation"

---

## Task 3: API Route Documentation

**Files:**
- Create: `docs/API.md`

- [ ] Step 1: Read all API route handlers

Read these files:
- `src/app/api/prices/route.ts`
- `src/app/api/events/route.ts`
- `src/app/api/sentiment/route.ts`
- `src/app/api/cron/route.ts`
- `src/app/api/index/route.ts`

- [ ] Step 2: Write `docs/API.md`

```markdown
# API Routes

## Overview
[All routes are Next.js App Router route handlers (GET only)]
[No authentication required — public data aggregation]

## GET /api/prices
[Response shape: PriceBenchmark[]]
[Data sources: Yahoo Finance (Brent), FloatRates (PHP/USD), DOE (pump)]
[Fallback: static priceBenchmarks from src/data/prices.ts]
[Cache: revalidate interval]

## GET /api/events
[Response shape: TimelineEvent[]]
[Data sources: RSS feeds (PhilStar, Al Jazeera, DOE, Google News), Reddit]
[Fallback: static timelineEvents from src/data/events.ts]
[Deduplication: headline similarity]

## GET /api/sentiment
[Response shape, NLP pipeline description]
[HuggingFace inference API integration]

## GET /api/cron
[Vercel cron schedule, what it refreshes]

## Error Handling
[All routes return 200 with fallback data on upstream failure]
[Cache-Control headers on error responses]
```

- [ ] Step 3: Verify response shapes match TypeScript types in `src/types/index.ts`, `src/types/cascade.ts`, and `src/types/stations.ts`

- [ ] Step 4: Commit: "add API route documentation"

---

## Task 4: Contributing Guide

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] Step 1: Read existing conventions from CLAUDE.md and package.json

Read:
- `CLAUDE.md` — code patterns, build commands, design tokens
- `package.json` — scripts, dependencies, engines
- `.env.example`

- [ ] Step 2: Write `CONTRIBUTING.md`

```markdown
# Contributing to PH Oil Intelligence Dashboard

## Quick Setup

[Prerequisites: Node.js 18+, pnpm]
[Clone → pnpm install → pnpm dev → localhost:3007]
[Environment variables: .env.example reference]

## Project Structure

[Brief directory map — point to ARCHITECTURE.md for details]

## Development Conventions

### Design Tokens
[Point to CLAUDE.md token table — never hardcode rgba values]
[Glass morphism: use .glass-card class]

### Component Patterns
[Dynamic imports with skeleton loaders]
[FadeIn wrapper for scroll animations]
[SourceAttribution on all data cards]
[SSR safety rules: 'use client', useEffect gates]

### CSS Conventions
[CSS-first animations, no JS animation libraries]
[overflow-x-clip not overflow-x-hidden]
[prefers-reduced-motion support required]
[hover: none media query for touch devices]

## Adding a New Component

[Step-by-step: create file → export → add skeleton if dynamic → add to page.tsx]

## Adding a New Data Source

[Step-by-step: create fetcher in lib → add to API route → update hook → add fallback]

## Git Workflow

[Branch from main → commit with present-tense imperative → PR to test branch]
[Stage specific files, never git add -A]
[pnpm build must pass before commit]

## Code Quality

[ESLint: no unused imports]
[TypeScript strict mode]
[pnpm build as gate]

## License

[AGPL v3 — CLA reference]
```

- [ ] Step 3: Commit: "add contributing guide"

---

## Task 5: Update CLAUDE.md with New Patterns

**Files:**
- Modify: `CLAUDE.md`

- [ ] Step 0: Read all lib modules to understand what needs documenting

Read these files:
- `src/lib/crisisLevel.ts` — crisis score computation
- `src/lib/CrisisProvider.tsx` — crisis context provider
- `src/lib/HighlightContext.tsx` — cross-component hover linking
- `src/lib/constants.ts` — shared constants
- `src/lib/consumer-models.ts` — consumer impact models
- `src/lib/monte-carlo.ts` — Monte Carlo simulation
- `src/lib/priceSources.ts` — price API fetchers
- `src/lib/region-analytics.ts` — regional analysis
- `src/lib/scenario-engine.ts` — scenario computation
- `src/lib/station-status.ts` — station status logic

- [ ] Step 1: Read current CLAUDE.md to identify insertion points

- [ ] Step 2: Add Crisis UI System section after "Code Patterns"

Add documentation for:
- Crisis score formula and level thresholds
- CrisisProvider usage and CSS token injection
- `data-crisis-level` attribute and glass-card pseudo-element accents
- Token override table (CALM/ELEVATED/CRISIS values)

- [ ] Step 3: Add UI Primitives section

Add documentation for:
- Skeleton loaders: how to create, how to wire to `dynamic()` loading prop
- FadeIn component: usage, delay prop, SSR safety
- SourceAttribution: three modes (source/updated/derived)
- EmptyState: when to use
- GaugeBar: props and zone configuration
- HighlightContext: cross-component hover linking pattern

- [ ] Step 4: Add Lib Modules reference table

Add a table documenting each `src/lib/` module and its single responsibility:
| Module | File | Purpose |
|--------|------|---------|
| crisisLevel | src/lib/crisisLevel.ts | Pure crisis score computation + level mapping |
| CrisisProvider | src/lib/CrisisProvider.tsx | React context, CSS token injection |
| HighlightContext | src/lib/HighlightContext.tsx | Cross-component hover state |
| constants | src/lib/constants.ts | Shared constants |
| consumer-models | src/lib/consumer-models.ts | Consumer impact calculations |
| monte-carlo | src/lib/monte-carlo.ts | Monte Carlo simulation engine |
| priceSources | src/lib/priceSources.ts | Price API fetcher functions |
| region-analytics | src/lib/region-analytics.ts | Regional analysis utilities |
| scenario-engine | src/lib/scenario-engine.ts | Scenario parameter computation |
| station-status | src/lib/station-status.ts | Station status logic |

- [ ] Step 5: Add Error Handling section

Add documentation for:
- `src/app/error.tsx` error boundary
- API route fallback pattern (always return 200 with static data)
- Hook retry logic (exponential backoff in useEvents)

- [ ] Step 6: Verify no duplicate content with existing CLAUDE.md sections

- [ ] Step 7: Commit: "update CLAUDE.md with crisis UI, skeleton, and dataviz patterns"

---

## Task 6: Update README Navigation

**Files:**
- Modify: `README.md`

- [ ] Step 1: Read current README.md header navigation

- [ ] Step 2: Add documentation links

Add a "Documentation" section or update nav links to include:
- [Architecture](docs/ARCHITECTURE.md)
- [Components & Hooks](docs/COMPONENTS.md)
- [API Reference](docs/API.md)
- [Contributing](CONTRIBUTING.md)

- [ ] Step 3: Commit: "add documentation links to README"

---

## Verification

1. All 4 new docs exist and are well-structured: `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `docs/API.md`, `CONTRIBUTING.md`
2. CLAUDE.md has new sections for crisis UI, UI primitives, error handling
3. README.md links to all docs
4. No hardcoded values or aspirational content — only documents current state
5. `pnpm build` passes (docs don't affect build, but verify no accidental changes)
6. Spot-check: 5 claims in docs verified against source code
