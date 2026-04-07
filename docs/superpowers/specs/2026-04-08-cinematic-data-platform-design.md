# Cinematic Data Platform — Design Spec

**Date:** 2026-04-08
**Approach:** C — "Cinematic Data Platform"
**Philosophy:** Apply the right motion design to each surface instead of forcing one pattern everywhere. Primer = scroll-driven storytelling. Cascade = interactive Sankey hero viz. Dashboard = functional + cinematic landmarks. Mobile = adaptive variants.

---

## 1. Primer — Scroll-Driven Storytelling Overhaul

### Problem

7 stages repeat the exact same 2-column layout with identical fade-in animations (0.6s ease-out) and counter timing (1500ms ease-out cubic). By stage 5, scroll fatigue sets in. The primer feels mechanical and monotonous.

### Solution

Replace the single `StageSection` template with **5 rotating layout templates** and upgrade motion design from intersection-triggered to **scroll-synced**.

### Layout Templates

| Template | Stages | Description |
|----------|--------|-------------|
| **Hero Full-Bleed** | 1 (Extraction), 7 (Consumer) | Full-width background photo (Unsplash), giant centered stat, narrative below. Sets the scene and closes the story |
| **Split Narrative** | 2 (Maritime), 5 (Depots) | 50/50 side-by-side: left narrative scrolls, right data panel is `position: sticky`. Upgraded version of current layout |
| **Stacked Cards** | 3 (Refinery) | Horizontal scrolling card carousel with `scroll-snap-type: x mandatory`. Each card is a mini-step in the process |
| **Big Number + Context** | 4 (Terminals), 6 (Stations) | Giant scroll-synced counter dominates viewport, contextual stat cards orbit below in a grid |
| **Pipeline Connector** | Between all stages | Animated SVG pipe with scroll-synced fill (0% → 100%) and flowing particle dots. Gradient transitions from source to destination stage color |

### Real Photography

Replace all emoji stage icons with Unsplash photography:

| Stage | Image Subject | Usage |
|-------|---------------|-------|
| 1 — Extraction | Oil rig / drilling platform | Full-bleed background (Hero template), `object-cover`, 20% opacity overlay |
| 2 — Maritime | VLCC tanker / Hormuz Strait aerial | Split Narrative header image, optional 30s explainer video embed |
| 3 — Refinery | Refinery at night (industrial) | Card header images in carousel |
| 4 — Terminals | Fuel storage terminal aerial | Big Number background (blurred, 10% opacity) |
| 5 — Depots | Fuel tanker truck loading | Split Narrative header image |
| 6 — Stations | Philippine gas station (branded) | Big Number background |
| 7 — Consumer | Filipino family / market scene | Full-bleed background, humanizes impact |

Image implementation:
- Use `next/image` with `w=1200&q=75` Unsplash params for optimized loading
- `loading="lazy"` on all images except Stage 1 (LCP)
- `placeholder="blur"` with low-res blurDataURL
- Alt text describing the scene for accessibility

Optional video embeds:
- Stage 2: Maritime route animation (lazy `<iframe>`, poster frame)
- Stage 3: Refinery process clip
- `loading="lazy"` with skeleton placeholder until interaction

### Motion Design Vocabulary

| Animation | Trigger | Duration | Easing |
|-----------|---------|----------|--------|
| Scroll-synced counters | Scroll position | Continuous | Linear (tied to scroll %) |
| Parallax depth | Scroll | Continuous | Background 0.3x, content 1x |
| Staggered reveals | IntersectionObserver | 0.5s per item | ease-out, 100ms stagger delay |
| Pipeline flow | Scroll position | Continuous | Pipe fill tracks scroll %, particles auto-animate 3s loop |
| Easing variety | Per stage | 0.6s | Stage 1: ease-out, Stage 3: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like overshoot), Stage 7: ease-in-out |

### What Stays

- 7-stage content structure and all data in `src/data/primer.ts`
- Color-per-stage system (Petron blue, Shell yellow, etc.)
- Timeline sidebar navigation (desktop lg+)
- Glass card styling (`.glass-card`)
- Mobile single-column collapse
- CrudeOilTypes section at the bottom
- `prefers-reduced-motion` media query disabling all animations

### Files Modified

| File | Change |
|------|--------|
| `src/components/primer/StageSection.tsx` | Refactor into 4 template components: `StageHeroBleed.tsx`, `StageSplitNarrative.tsx`, `StageStackedCards.tsx`, `StageBigNumber.tsx` |
| `src/components/primer/PipelineConnector.tsx` | Replace static SVG with scroll-synced animated pipe + particle system |
| `src/components/primer/SupplyChainFlow.tsx` | Template router: select layout based on stage index |
| `src/components/primer/AnimatedCounter.tsx` | Add scroll-sync mode alongside existing intersection-trigger mode |
| `src/data/primer.ts` | Add `layoutTemplate` field to each stage, add `imageUrl` and optional `videoUrl` fields. Extend `SupplyChainStage` interface with: `layoutTemplate: 'hero-bleed' | 'split-narrative' | 'stacked-cards' | 'big-number'`, `imageUrl: string`, `videoUrl?: string` |
| `src/app/primer/PrimerPage.tsx` | No structural change |
| `src/hooks/useScrollProgress.ts` | **Rewrite**: current hook returns global page scroll % (0-100). New API returns per-element 0-1 progress via `IntersectionObserver` + `scroll` event, SSR-safe. Existing consumers (ScrollProgress component) must be updated to use the new API or the old behavior preserved as a separate export |

### New Files

| File | Purpose |
|------|---------|
| `src/components/primer/StageHeroBleed.tsx` | Hero Full-Bleed template component |
| `src/components/primer/StageSplitNarrative.tsx` | Split Narrative template with sticky data panel |
| `src/components/primer/StageStackedCards.tsx` | Horizontal card carousel template |
| `src/components/primer/StageBigNumber.tsx` | Big Number + Context template |

---

## 2. Cascade — Interactive Sankey Diagram

### Problem

The Cascade page is a static card grid with dead SVG arrows. It tells a compelling story (Hormuz disruption → household budget) but the visual execution doesn't match the narrative urgency. No interactivity beyond hover lift.

### Solution

Replace the card grid with an **interactive D3-sankey flow diagram** that visualizes impact magnitude through link widths and lets users explore causal mechanisms.

### Core Visualization

- **Library:** `d3-sankey` (~15KB) + `d3-selection` for SVG rendering
- **Nodes:** 11 existing cascade nodes from `src/data/cascade.ts`
- **Links:** 16 causal connections, width proportional to impact magnitude (% change)
- **Color:** Severity gradient flowing left-to-right (green → yellow → orange → red)
- **Container:** Full viewport width, `min-h-[70vh]`, glass-card wrapper

### Layout

4 category columns, left-to-right:

```
Energy (4 nodes) → Agriculture (3 nodes) → Transport (2 nodes) → Consumer (2 nodes)
```

Each column header: category name + node count + color indicator.

### Interaction Model

| Action | Result | Platform |
|--------|--------|----------|
| Hover node | Highlights all upstream + downstream links. Dims unrelated. Tooltip: name, value, % change, impact statement | Desktop only |
| Hover link | Tooltip: causal mechanism + time lag (e.g., "Import parity pricing • 1–2 weeks") | Desktop only |
| Click node | Expands info card below diagram with full details (reuses current CascadeCard content) | Both |
| Drag node | Repositions vertically within category column | Desktop only |
| Pinch/scroll zoom | Zoom in on dense areas | Both |

### Page Structure

```
┌─────────────────────────────────────────────┐
│ Hero: Crisis indicator + scenario headline  │
│ Stat pills: nodes, critical count, impact   │
├─────────────────────────────────────────────┤
│                                             │
│           D3 Sankey Diagram                 │
│      (full-width, min-h 70vh)               │
│                                             │
├─────────────────────────────────────────────┤
│ Expanded node detail card (on click)        │
├─────────────────────────────────────────────┤
│ Attribution: data sources, methodology      │
└─────────────────────────────────────────────┘
```

### Mobile Adaptation (< 768px)

The Sankey transforms into a **vertical waterfall**:
- Nodes stacked top-to-bottom, grouped by category
- Each node is an **always-expanded card** (no tap needed — zero taps to understand the cascade)
- Animated connecting lines between nodes with severity-colored gradients
- Causal mechanism + time lag labels visible inline between nodes
- Same data and ordering as desktop Sankey

### Performance

- D3-sankey: ~15KB gzipped
- SVG rendering (not canvas) for accessibility — screen readers can traverse nodes
- `dynamic(() => import(...), { ssr: false })` with skeleton placeholder
- Skeleton: category column headers + placeholder rectangles matching node positions

### Files Modified

| File | Change |
|------|--------|
| `src/app/cascade/CascadePage.tsx` | Replace `CascadeSection` with new `SankeySection` + `MobileWaterfall` |
| `src/components/cascade/CascadeSection.tsx` | **Delete** — content migrates to `SankeyNodeDetail.tsx` (click-expanded card) and `SankeyTooltip.tsx` (hover). `CascadeFlow.tsx`, `CascadeCard.tsx`, `ImpactMeter.tsx` also deleted (replaced by Sankey components) |
| `src/data/cascade.ts` | Add `magnitude` field to links for Sankey width calculation |
| `src/types/cascade.ts` | Add `magnitude: number` to `CascadeLink` interface |

### New Files

| File | Purpose |
|------|---------|
| `src/components/cascade/SankeyDiagram.tsx` | Main Sankey component: D3 layout + SVG render + interactions |
| `src/components/cascade/SankeyTooltip.tsx` | Hover tooltip for nodes and links |
| `src/components/cascade/SankeyNodeDetail.tsx` | Expanded card shown on node click (reuses CascadeCard content) |
| `src/components/cascade/MobileWaterfall.tsx` | Vertical waterfall layout for mobile |
| `src/components/cascade/WaterfallNode.tsx` | Individual always-expanded node card for mobile |

### New Dependencies

| Package | Size | Purpose |
|---------|------|---------|
| `d3-sankey` | ~15KB | Sankey layout algorithm |
| `d3-selection` | ~20KB | SVG DOM manipulation |
| `d3-shape` | ~15KB | Link path generation |

---

## 3. Dashboard — Cinematic Act Breaks

### Problem

The 4-act narrative structure is solid but transitions are subtle (~60px `ActDivider` components). Non-expert users landing cold don't see the story arc. The dashboard reads as a long list of sections rather than a guided narrative.

### Solution

Upgrade `ActDivider` to a **full-width cinematic interstitial** with gradient background shifts, large typography, and narrative hooks.

### ActDivider v2 Design

| Property | Value |
|----------|-------|
| Height | `min-h-[30vh]` (mobile: `min-h-[20vh]`) |
| Layout | Centered flex column: act number → question → hook → down-arrow |
| Act number | 72px mono font (mobile: 32px), low opacity (0.15), acts as watermark |
| Question | 28px bold (mobile: 20px), white, the act's guiding question |
| Hook | 14px, `text-secondary`, 2-sentence transition connecting previous act to next |
| Animation | Fade-in on scroll, text at 1x parallax, background gradient at 0.5x |
| Border | Top/bottom hairline with act-colored glow: `box-shadow: 0 0 40px rgba(color, 0.1)` |

### Background Gradient Shifts

| Transition | Gradient |
|------------|----------|
| Act 1 → 2 | Deep navy (`#0a1628`) → warm indigo (`#1e1b4b`) |
| Act 2 → 3 | Warm indigo → amber-tinted (`#1c1408`) |
| Act 3 → 4 | Amber-tinted → cool slate (`#0f172a`) |

### Act Break Content

| Transition | Question | Hook |
|------------|----------|------|
| 1 → 2 | "What does it cost you?" | "The supply chain above sets the stage. Now let's see what it means at the pump — and in your wallet." |
| 2 → 3 | "What could happen next?" | "Prices are one thing. But what if Hormuz closes for 8 weeks? Model the scenarios yourself." |
| 3 → 4 | "Who controls the supply?" | "Behind every price movement are market players, system health indicators, and global events." |

### Additional Dashboard Polish

| Enhancement | Details |
|-------------|---------|
| Rich Recharts tooltips | SparkChart and MarketShare show value + % + context label on hover (custom `<Tooltip>` component) |
| KPI pulse animation | ExecutiveSnapshot cards get subtle border-glow pulse when values update |
| Consistent scroll offset | All section anchors: `scroll-mt-24` (accounting for sticky header) |

### Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Extract inline `ActDivider` function (currently defined at ~line 87) into a standalone component. Rewrite with 30vh cinematic interstitial, gradient backgrounds, large typography, parallax. Update all 3 ActDivider call sites with new props: `question`, `hook`, `gradientFrom`, `gradientTo` (replaces old `title` and `description` props) |

### New Files (Section 3)

| File | Purpose |
|------|---------|
| `src/components/layout/ActDivider.tsx` | Extracted + rewritten cinematic act break component (was inline in page.tsx) |

---

## 4. Mobile Fixes & Adaptive Components

### Tier 1: Bug Fixes

| Component | File | Current | Fix |
|-----------|------|---------|-----|
| AlertDrawer | `src/components/alerts/AlertDrawer.tsx` | `w-[360px]` | `w-full sm:w-[360px]` |
| CommandPalette | `src/components/layout/CommandPalette.tsx` | `max-w-lg` | `max-w-[calc(100vw-2rem)] sm:max-w-lg` |
| RegionPanel | `src/components/map/RegionPanel.tsx` | `w-[320px]` | `w-full sm:w-[320px]` with max-width clamp |
| FacilityDetail | `src/components/map/FacilityDetail.tsx` | `max-w-sm` side panel | Bottom sheet on mobile (`fixed bottom-0 inset-x-0 max-h-[60vh]`), side panel on desktop |
| ScenarioPlanner | `src/app/page.tsx` (grid) | `grid-cols-1 lg:grid-cols-2` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[280px_1fr]` |
| Map height | `src/components/map/MapWrapper.tsx` | `h-[500px]` | `h-[clamp(350px,55vh,600px)]` |

### Tier 2: Adaptive Components

| Component | Desktop | Mobile (< 768px) |
|-----------|---------|-------------------|
| Cascade Sankey | Interactive D3 Sankey | Vertical waterfall, always-expanded nodes, zero taps |
| Map overlays | Side panels | Bottom sheets with drag handle, snap to 30%/60%/90% |
| ActDivider v2 | 30vh, 72px act number | 20vh, 32px act number |
| Primer Stage 3 | Horizontal carousel | Same (swipe-native) |

### New Shared Component

**`<BottomSheet>`** — reusable bottom sheet for mobile map overlays:

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Controls visibility |
| `onClose` | () => void | Close handler (swipe-down or backdrop tap) |
| `snapPoints` | number[] | Height percentages: `[0.3, 0.6, 0.9]` |
| `children` | ReactNode | Content |

Features:
- Drag handle at top (visual affordance)
- `backdrop-blur` background
- Swipe-to-dismiss gesture
- Respects `env(safe-area-inset-bottom)`

### Mobile-Specific Fixes

| Fix | Details |
|-----|---------|
| Touch targets | Header utility buttons: `p-1.5` → `p-2` (ensures 44px minimum) |
| Horizontal scroll indicators | Fade gradients on edges of carousel containers |
| Safe area | Verify `env(safe-area-inset-bottom)` on all `fixed` elements |

### New Files

| File | Purpose |
|------|---------|
| `src/components/ui/BottomSheet.tsx` | Reusable bottom sheet component |

---

## Dependencies Summary

| Package | Size (gzip) | Purpose | Used By |
|---------|-------------|---------|---------|
| `d3-sankey` | ~15KB | Sankey layout algorithm | Cascade |
| `d3-selection` | ~20KB | SVG DOM manipulation | Cascade |
| `d3-shape` | ~15KB | Link path generation | Cascade |

No other new dependencies. All other changes use existing libraries (React, Tailwind, Next.js, Recharts).

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Primer images (7 Unsplash photos) | `next/image` with lazy loading, blur placeholder, `w=1200&q=75` |
| Scroll-synced animations | `requestAnimationFrame` with `will-change: transform`. `prefers-reduced-motion` disables all |
| D3 Sankey SVG | `dynamic()` import with skeleton. SVG is lightweight for 11 nodes / 16 links |
| Act break parallax | CSS `transform: translateY()` only (composited, no layout thrash) |
| Bottom sheet gestures | `touch-action: none` on drag handle, passive touch listeners on body |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Reduced motion | All scroll-synced + parallax animations disabled via `prefers-reduced-motion` |
| Sankey SVG | `role="img"` + `aria-label` describing the cascade. Nodes are focusable with keyboard |
| Act breaks | Semantic `<section>` with `aria-label="Act 2: What does it cost you?"` |
| Bottom sheet | `role="dialog"` + `aria-modal="true"` + focus trap |
| Images | Descriptive `alt` text on all Unsplash photos |
| Video | `<iframe>` with `title` attribute describing content |

---

## Out of Scope

- Light mode / theme switching
- Internationalization (i18n)
- User accounts / saved preferences
- Real-time WebSocket data feeds
- Native mobile app
- Changes to API routes or data fetching logic
