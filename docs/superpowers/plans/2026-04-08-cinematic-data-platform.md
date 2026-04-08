# Cinematic Data Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the PH Oil Intelligence Dashboard into an award-winning data visualization platform with scroll-driven storytelling (Primer), interactive Sankey diagram (Cascade), cinematic act breaks (Dashboard), and adaptive mobile components.

**Architecture:** 4 independent workstreams touching different file sets — can run fully in parallel. WS-A (Primer) rewrites stage templates + scroll hooks. WS-B (Cascade) adds D3-sankey visualization. WS-C (Dashboard) extracts + upgrades ActDivider. WS-D (Mobile) fixes overflow bugs + adds BottomSheet component.

**Tech Stack:** Next.js App Router, D3-sankey + d3-shape + d3-selection, Tailwind CSS, React hooks, Unsplash photography via next/image

**Spec:** `docs/superpowers/specs/2026-04-08-cinematic-data-platform-design.md`

---

## Parallelism Map

```
WS-A (Primer)     ─────────────────────────────────►  independent
WS-B (Cascade)    ─────────────────────────────────►  independent
WS-C (Dashboard)  ─────────────────────────────────►  independent
WS-D (Mobile)     ─────────────────────────────────►  independent (except Task 11 waits for WS-C commit)
```

**File ownership (zero overlap):**
- WS-A: `src/components/primer/*`, `src/data/primer.ts`, `src/hooks/useElementScrollProgress.ts`
- WS-B: `src/components/cascade/*`, `src/data/cascade.ts`, `src/types/cascade.ts`, `src/app/cascade/CascadePage.tsx`, `package.json` (d3 deps)
- WS-C: `src/app/page.tsx`, `src/components/layout/ActDivider.tsx` (new)
- WS-D: `src/components/alerts/AlertDrawer.tsx`, `src/components/map/RegionPanel.tsx`, `src/components/map/FacilityDetail.tsx`, `src/components/map/MapWrapper.tsx`, `src/components/ui/BottomSheet.tsx` (new)

---

## WS-A: Primer Overhaul

### Task 1: Extend Primer Data Schema

**Files:**
- Modify: `src/data/primer.ts`

- [ ] **Step 1: Add new fields to `SupplyChainStage` interface**

In `src/data/primer.ts`, add three fields to the `SupplyChainStage` interface (after the existing `pipelineLabel` field at line 26):

```typescript
export interface SupplyChainStage {
  id: string;
  number: number;
  title: string;
  icon: string;
  color: string;
  what: string;
  phContext: string;
  keyPlayers: string[];
  headline: string;
  dataPoints: StageDataPoint[];
  visualType: 'animation' | 'diagram' | 'map-preview';
  bars?: StageBar[];
  pipelineLabel?: string;
  layoutTemplate: 'hero-bleed' | 'split-narrative' | 'stacked-cards' | 'big-number';
  imageUrl: string;
  imageAlt: string;
  videoUrl?: string;
}
```

- [ ] **Step 2: Add `layoutTemplate`, `imageUrl`, `imageAlt` to each stage**

Update each stage object in the `supplyChainStages` array. Add these fields to each stage (insert after the `pipelineLabel` field):

```typescript
// Stage 1 (extraction) — add after pipelineLabel
layoutTemplate: 'hero-bleed',
imageUrl: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=1200&q=75',
imageAlt: 'Offshore oil drilling platform at sunset',

// Stage 2 (maritime) — add after pipelineLabel
layoutTemplate: 'split-narrative',
imageUrl: 'https://images.unsplash.com/photo-1524522173746-f628baad3644?w=1200&q=75',
imageAlt: 'VLCC oil tanker sailing through open ocean',

// Stage 3 (refinery) — add after pipelineLabel
layoutTemplate: 'stacked-cards',
imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&q=75',
imageAlt: 'Oil refinery illuminated at night with industrial towers',

// Stage 4 (terminals) — add after pipelineLabel
layoutTemplate: 'big-number',
imageUrl: 'https://images.unsplash.com/photo-1590846083693-f23fdede3a7e?w=1200&q=75',
imageAlt: 'Aerial view of fuel storage terminal with cylindrical tanks',

// Stage 5 (depots) — add after pipelineLabel
layoutTemplate: 'split-narrative',
imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=75',
imageAlt: 'Fuel tanker truck at a loading depot',

// Stage 6 (stations) — add after pipelineLabel
layoutTemplate: 'big-number',
imageUrl: 'https://images.unsplash.com/photo-1565620731-02cfdd6e9a36?w=1200&q=75',
imageAlt: 'Gas station with illuminated price sign at dusk',

// Stage 7 (consumer) — no pipelineLabel, add at end of object
layoutTemplate: 'hero-bleed',
imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=75',
imageAlt: 'Filipino family at a busy local market',
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/bbmisa/oil_energy_map && pnpm build`
Expected: Clean build with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/primer.ts
git commit -m "extend primer data schema with layout templates and Unsplash imagery"
```

---

### Task 2: Create `useElementScrollProgress` Hook

**Files:**
- Create: `src/hooks/useElementScrollProgress.ts`

The existing `useScrollProgress` hook returns global page scroll (0-100). We need a **per-element** hook that returns 0-1 progress for a specific element's scroll range. Do NOT modify the existing hook — other components depend on it.

- [ ] **Step 1: Create the new hook**

```typescript
'use client';

import { useEffect, useState, useRef, type RefObject } from 'react';

/**
 * Returns 0-1 scroll progress for a specific element.
 * 0 = element top just entered viewport bottom.
 * 1 = element bottom just exited viewport top.
 * SSR-safe: returns 0 on server.
 */
export function useElementScrollProgress<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>;
  progress: number;
  isInView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Element is above viewport
      if (rect.bottom < 0) {
        setProgress(1);
        setIsInView(false);
        return;
      }
      // Element is below viewport
      if (rect.top > windowHeight) {
        setProgress(0);
        setIsInView(false);
        return;
      }

      // Element is in view — compute progress
      const totalTravel = windowHeight + rect.height;
      const traveled = windowHeight - rect.top;
      setProgress(Math.max(0, Math.min(1, traveled / totalTravel)));
      setIsInView(true);
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }

    // Initial check
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, progress, isInView };
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/bbmisa/oil_energy_map && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useElementScrollProgress.ts
git commit -m "add per-element scroll progress hook for scroll-synced animations"
```

---

### Task 3: Create Hero Full-Bleed Template

**Files:**
- Create: `src/components/primer/StageHeroBleed.tsx`

Used for Stage 1 (Extraction) and Stage 7 (Consumer). Full-width background photo with giant centered stat.

- [ ] **Step 1: Create the component**

```tsx
'use client';

import Image from 'next/image';
import type { SupplyChainStage } from '@/data/primer';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface StageHeroBleedProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

export function StageHeroBleed({ stage, onInView }: StageHeroBleedProps) {
  const { ref, progress, isInView } = useElementScrollProgress<HTMLElement>();

  // Notify timeline progress
  if (isInView) onInView(stage.number);

  // Lead data point for the hero number
  const leadDP = stage.dataPoints[0];
  const remainingDPs = stage.dataPoints.slice(1);

  // Parse numeric value from lead data point
  const numericMatch = leadDP.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
  const hasNumeric = numericMatch && !isNaN(parseFloat(numericMatch[2].replace(/,/g, '')));

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage relative min-h-[90vh] flex items-center justify-center scroll-mt-20 overflow-hidden"
    >
      {/* Background image */}
      <Image
        src={stage.imageUrl}
        alt={stage.imageAlt}
        fill
        className="object-cover"
        style={{
          opacity: 0.15,
          transform: `translateY(${(progress - 0.5) * -60}px)`, // parallax
        }}
        sizes="100vw"
        priority={stage.number === 1}
        loading={stage.number === 1 ? 'eager' : 'lazy'}
        placeholder="empty"
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 40%, color-mix(in srgb, ${stage.color} 8%, transparent) 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 text-center px-4 max-w-2xl mx-auto"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        {/* Stage badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest mb-6"
          style={{
            background: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${stage.color} 30%, transparent)`,
            color: stage.color,
          }}
        >
          Stage {stage.number}
        </div>

        {/* Giant animated number */}
        {hasNumeric ? (
          <div className="mb-2">
            <AnimatedCounter
              end={parseFloat(numericMatch![2].replace(/,/g, ''))}
              prefix={numericMatch![1]}
              suffix={numericMatch![3]}
              decimals={numericMatch![2].includes('.') ? numericMatch![2].split('.')[1].length : 0}
              color={stage.color}
              label={leadDP.label}
              source={leadDP.source}
              className="text-6xl sm:text-7xl md:text-8xl"
            />
          </div>
        ) : (
          <DataCallout
            value={leadDP.value}
            label={leadDP.label}
            source={leadDP.source}
            color={stage.color}
            delay={0}
            className="text-6xl sm:text-7xl md:text-8xl"
          />
        )}

        {/* Title + headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mt-6 mb-2">
          {stage.title}
        </h2>
        <p className="text-lg sm:text-xl font-semibold mb-4" style={{ color: stage.color }}>
          {stage.headline}
        </p>

        {/* Description */}
        <p className="text-sm text-text-secondary max-w-lg mx-auto mb-8">
          {stage.what}
        </p>

        {/* Stat pills */}
        <div className="flex justify-center gap-3 flex-wrap">
          {remainingDPs.map((dp) => (
            <div
              key={dp.label}
              className="px-4 py-2 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${stage.color} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${stage.color} 20%, transparent)`,
              }}
            >
              <div className="text-lg font-bold font-mono" style={{ color: stage.color }}>
                {dp.value}
              </div>
              <div className="text-[10px] text-text-dim uppercase tracking-wide">
                {dp.label}
              </div>
            </div>
          ))}
        </div>

        {/* PH Context */}
        <div
          className="mt-8 mx-auto max-w-lg rounded-xl p-5 text-left"
          style={{
            background: 'color-mix(in srgb, var(--ph-blue) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--ph-blue) 15%, transparent)',
          }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--ph-blue)' }}>
            Philippine Context
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {stage.phContext}
          </p>
        </div>

        {/* Bars */}
        {stage.bars && stage.bars.length > 0 && (
          <div className="mt-6 mx-auto max-w-lg space-y-3">
            {stage.bars.map((bar) => (
              <ProportionalBar
                key={bar.label}
                value={bar.value}
                label={bar.label}
                color={bar.color ?? stage.color}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/bbmisa/oil_energy_map && pnpm build`

Note: `AnimatedCounter` and `DataCallout` may not accept a `className` prop yet. If build fails on this, remove the `className` prop from both calls — the default sizing from those components will work. The hero effect comes from the full-bleed layout, not oversized text.

- [ ] **Step 3: Commit**

```bash
git add src/components/primer/StageHeroBleed.tsx
git commit -m "add Hero Full-Bleed primer template with parallax background imagery"
```

---

### Task 4: Create Split Narrative Template

**Files:**
- Create: `src/components/primer/StageSplitNarrative.tsx`

Used for Stage 2 (Maritime) and Stage 5 (Depots). Left narrative scrolls, right data panel is sticky.

- [ ] **Step 1: Create the component**

```tsx
'use client';

import Image from 'next/image';
import type { SupplyChainStage } from '@/data/primer';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface StageSplitNarrativeProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

export function StageSplitNarrative({ stage, onInView }: StageSplitNarrativeProps) {
  const { ref, isInView } = useElementScrollProgress<HTMLElement>();

  if (isInView) onInView(stage.number);

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex items-center scroll-mt-20"
    >
      <div
        className="relative w-full max-w-5xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Header image */}
        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6">
          <Image
            src={stage.imageUrl}
            alt={stage.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            loading="lazy"
            placeholder="empty"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent" />
          {/* Badge overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
              style={{
                background: `color-mix(in srgb, ${stage.color} 20%, transparent)`,
                border: `1px solid color-mix(in srgb, ${stage.color} 40%, transparent)`,
                color: stage.color,
              }}
            >
              Stage {stage.number}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{stage.title}</h2>
          </div>
        </div>

        <p className="text-lg sm:text-xl font-semibold mb-6" style={{ color: stage.color }}>
          {stage.headline}
        </p>

        {/* Two-column: narrative left, sticky data right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Left: narrative */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">What happens here</p>
              <p className="text-sm text-text-secondary leading-relaxed">{stage.what}</p>
            </div>

            <div
              className="rounded-xl p-5"
              style={{
                background: 'color-mix(in srgb, var(--ph-blue) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--ph-blue) 15%, transparent)',
              }}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--ph-blue)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ph-blue)' }} />
                Philippine Context
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{stage.phContext}</p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Key Players</p>
              <div className="flex flex-wrap gap-2">
                {stage.keyPlayers.map((player) => (
                  <span key={player} className="inline-block text-xs font-mono px-2.5 py-1 rounded-md bg-border border border-border-subtle text-text-secondary">
                    {player}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sticky data panel */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="glass-card p-4 space-y-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim">Key Data Points</span>
              {stage.dataPoints.map((dp, i) => {
                const numericMatch = dp.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
                if (numericMatch) {
                  const num = parseFloat(numericMatch[2].replace(/,/g, ''));
                  if (!isNaN(num)) {
                    return (
                      <AnimatedCounter
                        key={dp.label}
                        end={num}
                        prefix={numericMatch[1]}
                        suffix={numericMatch[3]}
                        decimals={numericMatch[2].includes('.') ? numericMatch[2].split('.')[1].length : 0}
                        color={stage.color}
                        label={dp.label}
                        source={dp.source}
                      />
                    );
                  }
                }
                return <DataCallout key={dp.label} value={dp.value} label={dp.label} source={dp.source} color={stage.color} delay={i * 150} />;
              })}
            </div>

            {stage.bars && stage.bars.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim">By the numbers</span>
                {stage.bars.map((bar) => (
                  <ProportionalBar key={bar.label} value={bar.value} label={bar.label} color={bar.color ?? stage.color} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/primer/StageSplitNarrative.tsx
git commit -m "add Split Narrative primer template with sticky data panel and header imagery"
```

---

### Task 5: Create Stacked Cards Template

**Files:**
- Create: `src/components/primer/StageStackedCards.tsx`

Used for Stage 3 (Refinery). Horizontal swipeable card carousel.

- [ ] **Step 1: Create the component**

```tsx
'use client';

import Image from 'next/image';
import type { SupplyChainStage } from '@/data/primer';
import { AnimatedCounter } from './AnimatedCounter';
import { ProportionalBar } from './ProportionalBar';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface StageStackedCardsProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

// Break the stage "what" into process steps for the carousel
const REFINERY_STEPS = [
  { emoji: '🛢️', step: 'Step 1', title: 'Crude Intake', description: 'VLCCs dock and crude is pumped to storage tanks for fractionation.' },
  { emoji: '🔥', step: 'Step 2', title: 'Distillation', description: 'Crude heated to 400°C+ in fractionating column. Separates into gasoline, diesel, kerosene, LPG.' },
  { emoji: '⚗️', step: 'Step 3', title: 'Cracking', description: 'Heavy residuals broken into lighter, more valuable products through catalytic cracking.' },
  { emoji: '✅', step: 'Step 4', title: 'Blending & QC', description: 'Products blended to DOE specs. Euro 4 compliance testing before distribution clearance.' },
];

export function StageStackedCards({ stage, onInView }: StageStackedCardsProps) {
  const { ref, isInView } = useElementScrollProgress<HTMLElement>();

  if (isInView) onInView(stage.number);

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex items-center scroll-mt-20"
    >
      <div
        className="w-full max-w-5xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest mb-4"
            style={{
              background: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${stage.color} 30%, transparent)`,
              color: stage.color,
            }}
          >
            Stage {stage.number}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">{stage.title}</h2>
          <p className="text-lg sm:text-xl font-semibold" style={{ color: stage.color }}>{stage.headline}</p>
        </div>

        {/* Horizontal card carousel */}
        <div className="relative">
          {/* Fade edge indicators */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-primary to-transparent z-10 hidden sm:block" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-primary to-transparent z-10 hidden sm:block" />

          <div
            className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-hover"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-hover) transparent' }}
          >
            {REFINERY_STEPS.map((rs, i) => (
              <div
                key={rs.title}
                className="min-w-[240px] sm:min-w-[280px] flex-shrink-0 snap-start rounded-xl p-5"
                style={{
                  background: `color-mix(in srgb, ${stage.color} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stage.color} 15%, transparent)`,
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <div className="text-2xl mb-2">{rs.emoji}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: stage.color }}>{rs.step}</div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{rs.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{rs.description}</p>

                {/* Pair with data point if available */}
                {stage.dataPoints[i] && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <div className="text-xl font-bold font-mono" style={{ color: stage.color }}>
                      {stage.dataPoints[i].value}
                    </div>
                    <div className="text-[10px] text-text-dim">{stage.dataPoints[i].label}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-text-dim font-mono mt-2">
            ← Swipe to explore steps →
          </div>
        </div>

        {/* Narrative cards below carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-3xl mx-auto">
          <div className="glass-card p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">What happens here</p>
            <p className="text-sm text-text-secondary leading-relaxed">{stage.what}</p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: 'color-mix(in srgb, var(--ph-blue) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ph-blue) 15%, transparent)',
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--ph-blue)' }}>Philippine Context</p>
            <p className="text-sm text-text-secondary leading-relaxed">{stage.phContext}</p>
          </div>
        </div>

        {/* Bars */}
        {stage.bars && stage.bars.length > 0 && (
          <div className="mt-6 max-w-md mx-auto space-y-3">
            {stage.bars.map((bar) => (
              <ProportionalBar key={bar.label} value={bar.value} label={bar.label} color={bar.color ?? stage.color} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/primer/StageStackedCards.tsx
git commit -m "add Stacked Cards primer template with horizontal swipeable carousel"
```

---

### Task 6: Create Big Number Template

**Files:**
- Create: `src/components/primer/StageBigNumber.tsx`

Used for Stage 4 (Terminals) and Stage 6 (Stations). Giant scroll-synced counter with context grid.

- [ ] **Step 1: Create the component**

```tsx
'use client';

import type { SupplyChainStage } from '@/data/primer';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface StageBigNumberProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

export function StageBigNumber({ stage, onInView }: StageBigNumberProps) {
  const { ref, isInView } = useElementScrollProgress<HTMLElement>();

  if (isInView) onInView(stage.number);

  const leadDP = stage.dataPoints[0];
  const contextDPs = stage.dataPoints.slice(1);

  const numericMatch = leadDP.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
  const hasNumeric = numericMatch && !isNaN(parseFloat(numericMatch[2].replace(/,/g, '')));

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex items-center scroll-mt-20"
    >
      <div
        className="w-full max-w-4xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Stage badge centered */}
        <div className="text-center mb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
            style={{
              background: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${stage.color} 30%, transparent)`,
              color: stage.color,
            }}
          >
            Stage {stage.number}
          </div>
        </div>

        {/* Giant number */}
        <div className="text-center py-6">
          {hasNumeric ? (
            <AnimatedCounter
              end={parseFloat(numericMatch![2].replace(/,/g, ''))}
              prefix={numericMatch![1]}
              suffix={numericMatch![3]}
              decimals={numericMatch![2].includes('.') ? numericMatch![2].split('.')[1].length : 0}
              color={stage.color}
              label={leadDP.label}
              source={leadDP.source}
            />
          ) : (
            <DataCallout value={leadDP.value} label={leadDP.label} source={leadDP.source} color={stage.color} delay={0} />
          )}
          <p className="text-sm text-text-dim mt-2 max-w-md mx-auto">{stage.headline}</p>
        </div>

        {/* Context stats grid */}
        {contextDPs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {contextDPs.map((dp) => (
              <div
                key={dp.label}
                className="text-center p-4 rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${stage.color} 5%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stage.color} 10%, transparent)`,
                }}
              >
                <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">{dp.value}</div>
                <div className="text-[10px] text-text-dim mt-1">{dp.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Narrative cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">What happens here</p>
            <p className="text-sm text-text-secondary leading-relaxed">{stage.what}</p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: 'color-mix(in srgb, var(--ph-blue) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ph-blue) 15%, transparent)',
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--ph-blue)' }}>Philippine Context</p>
            <p className="text-sm text-text-secondary leading-relaxed">{stage.phContext}</p>
          </div>
        </div>

        {/* Key players + bars */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {stage.keyPlayers.map((p) => (
              <span key={p} className="text-xs font-mono px-2.5 py-1 rounded-md bg-border border border-border-subtle text-text-secondary">{p}</span>
            ))}
          </div>
          {stage.bars && stage.bars.length > 0 && (
            <div className="space-y-3 max-w-md">
              {stage.bars.map((bar) => (
                <ProportionalBar key={bar.label} value={bar.value} label={bar.label} color={bar.color ?? stage.color} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/primer/StageBigNumber.tsx
git commit -m "add Big Number primer template with giant counter and context grid"
```

---

### Task 7: Upgrade PipelineConnector to Scroll-Synced

**Files:**
- Modify: `src/components/primer/PipelineConnector.tsx`

Replace the current intersection-triggered clip-path animation with scroll-synced pipe fill + animated particles.

- [ ] **Step 1: Rewrite PipelineConnector**

Replace the entire contents of `src/components/primer/PipelineConnector.tsx` with:

```tsx
'use client';

import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface PipelineConnectorProps {
  fromColor: string;
  toColor: string;
  label?: string;
}

export function PipelineConnector({ fromColor, toColor, label }: PipelineConnectorProps) {
  const { ref, progress, isInView } = useElementScrollProgress<HTMLDivElement>();

  // Pipe fill width follows scroll progress (0-100%)
  const fillPercent = Math.min(100, Math.max(0, progress * 200 - 30)); // start filling at ~15% progress

  // Unique gradient ID to avoid SVG ID collisions
  const gradId = `pipe-${fromColor.replace(/[^a-z0-9]/gi, '')}-${toColor.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div ref={ref} className="primer-stage flex flex-col items-center py-8 sm:py-12">
      <svg
        width="48"
        height="120"
        viewBox="0 0 48 120"
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Pipe body */}
        <rect x="18" y="0" width="12" height="120" rx="6" fill="var(--bg-elevated)" stroke="var(--border-hover)" strokeWidth="1" />

        {/* Scroll-synced fill */}
        <rect
          x="20"
          y="0"
          width="8"
          height="120"
          rx="4"
          style={{
            fill: `url(#${gradId})`,
            clipPath: `inset(0 0 ${100 - fillPercent}% 0)`,
            transition: 'clip-path 0.1s linear',
          }}
        />

        {/* Animated flow particles */}
        {isInView && (
          <>
            <circle r="3" fill={fromColor} opacity="0.6">
              <animate attributeName="cy" from="10" to="110" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.7;0.7;0" dur="2.5s" repeatCount="indefinite" />
              <set attributeName="cx" to="24" />
            </circle>
            <circle r="2.5" fill={toColor} opacity="0.5">
              <animate attributeName="cy" from="10" to="110" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.6;0.6;0" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
              <set attributeName="cx" to="24" />
            </circle>
          </>
        )}

        {/* Arrow */}
        <path
          d="M24 115 L18 105 L30 105 Z"
          fill={toColor}
          style={{ opacity: fillPercent > 80 ? 0.8 : 0, transition: 'opacity 0.3s ease' }}
        />

        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {label && (
        <span
          className="text-[9px] font-mono uppercase tracking-widest mt-2"
          style={{
            color: 'var(--text-dim)',
            opacity: fillPercent > 50 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/primer/PipelineConnector.tsx
git commit -m "upgrade PipelineConnector to scroll-synced fill with animated particles"
```

---

### Task 8: Wire Up Template Router in SupplyChainFlow

**Files:**
- Modify: `src/components/primer/SupplyChainFlow.tsx`

Replace the single `<StageSection>` render with a template router that selects the layout based on `stage.layoutTemplate`.

- [ ] **Step 1: Update SupplyChainFlow**

Replace the entire contents of `src/components/primer/SupplyChainFlow.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { supplyChainStages } from '@/data/primer';
import { TimelineProgress } from './TimelineProgress';
import { StageHeroBleed } from './StageHeroBleed';
import { StageSplitNarrative } from './StageSplitNarrative';
import { StageStackedCards } from './StageStackedCards';
import { StageBigNumber } from './StageBigNumber';
import { PipelineConnector } from './PipelineConnector';

function StageRouter({ stage, onInView }: { stage: (typeof supplyChainStages)[number]; onInView: (n: number) => void }) {
  switch (stage.layoutTemplate) {
    case 'hero-bleed':
      return <StageHeroBleed stage={stage} onInView={onInView} />;
    case 'split-narrative':
      return <StageSplitNarrative stage={stage} onInView={onInView} />;
    case 'stacked-cards':
      return <StageStackedCards stage={stage} onInView={onInView} />;
    case 'big-number':
      return <StageBigNumber stage={stage} onInView={onInView} />;
  }
}

export function SupplyChainFlow() {
  const [activeStage, setActiveStage] = useState(1);

  const handleInView = useCallback((stageNumber: number) => {
    setActiveStage(stageNumber);
  }, []);

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 max-w-4xl mx-auto">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Supply Chain Flow
        </h2>
      </div>

      <TimelineProgress activeStage={activeStage} />

      <div className="lg:pl-16 xl:pl-48">
        {supplyChainStages.map((stage, idx) => (
          <div key={stage.id}>
            <StageRouter stage={stage} onInView={handleInView} />
            {idx < supplyChainStages.length - 1 && (
              <PipelineConnector
                fromColor={stage.color}
                toColor={supplyChainStages[idx + 1].color}
                label={stage.pipelineLabel}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/primer/SupplyChainFlow.tsx
git commit -m "wire up template router — each primer stage now uses its designated layout"
```

- [ ] **Step 3: Delete the old StageSection (no longer imported)**

Verify `StageSection` is not imported anywhere else:

```bash
cd /Users/bbmisa/oil_energy_map && grep -r "StageSection" src/ --include="*.tsx" --include="*.ts"
```

If only the old import in SupplyChainFlow (now removed), delete the file:

```bash
rm src/components/primer/StageSection.tsx
git add -u src/components/primer/StageSection.tsx
git commit -m "remove deprecated StageSection — replaced by 4 layout templates"
```

---

## WS-B: Cascade Sankey Diagram

### Task 9: Install D3 Dependencies + Update Types

**Files:**
- Modify: `package.json` (add d3 deps)
- Modify: `src/types/cascade.ts` (add `magnitude`)
- Modify: `src/data/cascade.ts` (add `magnitude` to links)

- [ ] **Step 1: Install D3 packages**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm add d3-sankey d3-selection d3-shape && pnpm add -D @types/d3-sankey @types/d3-selection @types/d3-shape
```

- [ ] **Step 2: Add `magnitude` to CascadeLink interface**

In `src/types/cascade.ts`, update the `CascadeLink` interface:

```typescript
export interface CascadeLink {
  from: string;
  to: string;
  mechanism: string;
  lag: string;
  magnitude: number; // 0-100 scale, proportional to impact for Sankey link width
}
```

- [ ] **Step 3: Add `magnitude` values to each link in `src/data/cascade.ts`**

Update each link object — add the `magnitude` field based on the downstream node's `changePercent`:

```typescript
links: [
  { from: 'crude-oil', to: 'diesel', mechanism: 'Import parity pricing + forex', lag: '1–2 weeks', magnitude: 95 },
  { from: 'crude-oil', to: 'gasoline', mechanism: 'Import parity pricing + forex', lag: '1–2 weeks', magnitude: 80 },
  { from: 'crude-oil', to: 'lpg', mechanism: 'Refinery co-product pricing', lag: '2–3 weeks', magnitude: 60 },
  { from: 'diesel', to: 'fertilizer', mechanism: 'Energy-intensive manufacturing', lag: '1–2 months', magnitude: 40 },
  { from: 'diesel', to: 'rice', mechanism: 'Farm mechanization + transport', lag: '1–3 months', magnitude: 70 },
  { from: 'diesel', to: 'fish', mechanism: 'Fishing fleet fuel costs', lag: '1–2 weeks', magnitude: 50 },
  { from: 'diesel', to: 'jeepney', mechanism: 'Operator fuel cost pass-through', lag: '2–4 weeks', magnitude: 55 },
  { from: 'diesel', to: 'delivery', mechanism: 'Fleet fuel cost pass-through', lag: '1–2 weeks', magnitude: 45 },
  { from: 'fertilizer', to: 'rice', mechanism: 'Input cost pass-through', lag: '1 season', magnitude: 30 },
  { from: 'gasoline', to: 'jeepney', mechanism: 'Motorcycle-taxi fuel costs', lag: '1–2 weeks', magnitude: 25 },
  { from: 'gasoline', to: 'delivery', mechanism: 'Rider fuel costs', lag: '1–2 weeks', magnitude: 20 },
  { from: 'rice', to: 'food-inflation', mechanism: 'Staple food weight in CPI basket', lag: '1 month', magnitude: 65 },
  { from: 'fish', to: 'food-inflation', mechanism: 'Protein price component', lag: '1 month', magnitude: 35 },
  { from: 'food-inflation', to: 'household', mechanism: 'Grocery + dining costs', lag: 'Immediate', magnitude: 75 },
  { from: 'jeepney', to: 'household', mechanism: 'Daily commute costs', lag: 'Immediate', magnitude: 50 },
  { from: 'lpg', to: 'household', mechanism: 'Cooking fuel costs', lag: 'Immediate', magnitude: 40 },
],
```

- [ ] **Step 4: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add package.json pnpm-lock.yaml src/types/cascade.ts src/data/cascade.ts
git commit -m "add D3 sankey dependencies and magnitude field to cascade links"
```

---

### Task 10: Create SankeyDiagram Component

**Files:**
- Create: `src/components/cascade/SankeyDiagram.tsx`
- Create: `src/components/cascade/SankeyTooltip.tsx`
- Create: `src/components/cascade/SankeyNodeDetail.tsx`

This is the largest task. The Sankey component renders the D3 layout as SVG with hover highlighting and click-to-expand.

- [ ] **Step 1: Create SankeyTooltip**

Create `src/components/cascade/SankeyTooltip.tsx`:

```tsx
'use client';

import { SEVERITY_COLORS } from '@/data/cascade';
import type { CascadeNode, CascadeLink } from '@/types/cascade';

interface NodeTooltipProps {
  node: CascadeNode;
  x: number;
  y: number;
}

export function NodeTooltip({ node, x, y }: NodeTooltipProps) {
  return (
    <div
      className="fixed z-50 glass-card p-3 rounded-lg max-w-xs pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{node.icon}</span>
        <span className="font-mono text-xs font-bold text-text-primary">{node.label}</span>
      </div>
      <div className="text-xl font-bold font-mono" style={{ color: SEVERITY_COLORS[node.severity] }}>
        {node.currentValue}
      </div>
      <div className="text-[10px] text-text-dim font-mono">
        {node.changePercent > 0 ? '+' : ''}{node.changePercent}% from {node.baselineValue}
      </div>
      <p className="text-xs text-text-secondary mt-1">{node.impact}</p>
    </div>
  );
}

interface LinkTooltipProps {
  link: CascadeLink;
  x: number;
  y: number;
}

export function LinkTooltip({ link, x, y }: LinkTooltipProps) {
  return (
    <div
      className="fixed z-50 glass-card p-3 rounded-lg max-w-xs pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="text-xs font-mono text-text-primary font-bold mb-1">{link.mechanism}</div>
      <div className="text-[10px] text-text-dim">Time lag: {link.lag}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create SankeyNodeDetail**

Create `src/components/cascade/SankeyNodeDetail.tsx`:

```tsx
'use client';

import { SEVERITY_COLORS, CATEGORY_COLORS } from '@/data/cascade';
import type { CascadeNode } from '@/types/cascade';

interface SankeyNodeDetailProps {
  node: CascadeNode;
  onClose: () => void;
}

export function SankeyNodeDetail({ node, onClose }: SankeyNodeDetailProps) {
  return (
    <div className="glass-card p-5 rounded-xl mt-4 max-w-2xl mx-auto animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{node.icon}</span>
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">{node.label}</h3>
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: CATEGORY_COLORS[node.category] }}
            >
              {node.category}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-secondary text-xs font-mono p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close detail card"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Current</div>
          <div className="text-lg font-bold font-mono" style={{ color: SEVERITY_COLORS[node.severity] }}>
            {node.currentValue}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Baseline</div>
          <div className="text-lg font-bold font-mono text-text-secondary">{node.baselineValue}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Change</div>
          <div className="text-lg font-bold font-mono text-status-red">
            +{node.changePercent}%
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary">{node.impact}</p>

      {node.sourceUrl ? (
        <a
          href={node.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-text-dim hover:text-petron mt-2 inline-block"
        >
          Source: {node.source} ↗
        </a>
      ) : (
        <span className="text-[10px] font-mono text-text-dim mt-2 inline-block">Source: {node.source}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create SankeyDiagram**

Create `src/components/cascade/SankeyDiagram.tsx`:

```tsx
'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { sankey, sankeyLinkHorizontal, type SankeyNode, type SankeyLink } from 'd3-sankey';
import { philippineCascade, CATEGORY_COLORS, SEVERITY_COLORS } from '@/data/cascade';
import type { CascadeNode, CascadeLink, CascadeCategory } from '@/types/cascade';
import { NodeTooltip, LinkTooltip } from './SankeyTooltip';
import { SankeyNodeDetail } from './SankeyNodeDetail';

type SNode = SankeyNode<CascadeNode, CascadeLink>;
type SLink = SankeyLink<CascadeNode, CascadeLink>;

const CATEGORIES: CascadeCategory[] = ['energy', 'agriculture', 'transport', 'consumer'];
const WIDTH = 900;
const HEIGHT = 500;
const MARGIN = { top: 30, right: 20, bottom: 20, left: 20 };

export function SankeyDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CascadeNode | null>(null);
  const [tooltip, setTooltip] = useState<{ type: 'node' | 'link'; data: CascadeNode | CascadeLink; x: number; y: number } | null>(null);

  // Build the sankey layout
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map(philippineCascade.nodes.map((n, i) => [n.id, i]));

    const sankeyGen = sankey<CascadeNode, CascadeLink>()
      .nodeId((d) => (d as CascadeNode).id)
      .nodeWidth(20)
      .nodePadding(16)
      .nodeSort(null)
      .extent([
        [MARGIN.left, MARGIN.top],
        [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom],
      ]);

    const graph = sankeyGen({
      nodes: philippineCascade.nodes.map((n) => ({ ...n })),
      links: philippineCascade.links.map((l) => ({
        source: l.from,
        target: l.to,
        value: l.magnitude,
        ...l,
      })),
    });

    return { nodes: graph.nodes as SNode[], links: graph.links as SLink[] };
  }, []);

  // Find connected node IDs for highlighting
  const connectedIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>([hoveredNodeId]);
    // Traverse upstream and downstream
    function addUpstream(id: string) {
      for (const l of links) {
        const sourceId = typeof l.source === 'object' ? (l.source as SNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as SNode).id : l.target;
        if (targetId === id && sourceId && !ids.has(sourceId)) {
          ids.add(sourceId);
          addUpstream(sourceId);
        }
      }
    }
    function addDownstream(id: string) {
      for (const l of links) {
        const sourceId = typeof l.source === 'object' ? (l.source as SNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as SNode).id : l.target;
        if (sourceId === id && targetId && !ids.has(targetId)) {
          ids.add(targetId);
          addDownstream(targetId);
        }
      }
    }
    addUpstream(hoveredNodeId);
    addDownstream(hoveredNodeId);
    return ids;
  }, [hoveredNodeId, links]);

  const linkPath = sankeyLinkHorizontal();

  const isLinkConnected = useCallback(
    (l: SLink) => {
      if (!hoveredNodeId) return true;
      const sId = typeof l.source === 'object' ? (l.source as SNode).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as SNode).id : l.target;
      return connectedIds.has(sId!) && connectedIds.has(tId!);
    },
    [hoveredNodeId, connectedIds],
  );

  return (
    <div ref={containerRef}>
      {/* Category headers */}
      <div className="flex justify-between mb-2 px-5">
        {CATEGORIES.map((cat) => {
          const count = nodes.filter((n) => n.category === cat).length;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim">
                {cat} ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* SVG Sankey */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ minHeight: '400px' }}
        role="img"
        aria-label={`Sankey diagram showing how a crude oil price shock cascades through ${nodes.length} nodes across energy, agriculture, transport, and consumer sectors`}
      >
        {/* Links */}
        {links.map((l, i) => {
          const path = linkPath(l as Parameters<typeof linkPath>[0]);
          const connected = isLinkConnected(l);
          const sourceNode = l.source as SNode;
          const targetNode = l.target as SNode;
          return (
            <path
              key={i}
              d={path ?? ''}
              fill="none"
              stroke={connected ? SEVERITY_COLORS[sourceNode.severity] : 'var(--border-subtle)'}
              strokeWidth={Math.max(2, (l as { width?: number }).width ?? 2)}
              strokeOpacity={connected ? 0.4 : 0.08}
              style={{ transition: 'stroke-opacity 0.3s, stroke 0.3s' }}
              onMouseEnter={(e) => setTooltip({ type: 'link', data: l as unknown as CascadeLink, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              onMouseMove={(e) => tooltip?.type === 'link' && setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const connected = !hoveredNodeId || connectedIds.has(n.id);
          return (
            <g key={n.id}>
              <rect
                x={n.x0}
                y={n.y0}
                width={(n.x1 ?? 0) - (n.x0 ?? 0)}
                height={(n.y1 ?? 0) - (n.y0 ?? 0)}
                rx={4}
                fill={SEVERITY_COLORS[n.severity]}
                opacity={connected ? 0.9 : 0.15}
                style={{ transition: 'opacity 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredNodeId(n.id);
                  setTooltip({ type: 'node', data: n, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null);
                  setTooltip(null);
                }}
                onMouseMove={(e) => tooltip?.type === 'node' && setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n as CascadeNode)}
              />
              {/* Node label */}
              <text
                x={(n.x1 ?? 0) + 6}
                y={((n.y0 ?? 0) + (n.y1 ?? 0)) / 2}
                dy="0.35em"
                className="text-[10px] font-mono fill-current"
                style={{
                  fill: connected ? 'var(--text-secondary)' : 'var(--text-dim)',
                  transition: 'fill 0.3s',
                  pointerEvents: 'none',
                }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip?.type === 'node' && <NodeTooltip node={tooltip.data as CascadeNode} x={tooltip.x} y={tooltip.y} />}
      {tooltip?.type === 'link' && <LinkTooltip link={tooltip.data as CascadeLink} x={tooltip.x} y={tooltip.y} />}

      {/* Detail card */}
      {selectedNode && (
        <SankeyNodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/cascade/SankeyDiagram.tsx src/components/cascade/SankeyTooltip.tsx src/components/cascade/SankeyNodeDetail.tsx
git commit -m "add interactive D3 Sankey diagram with hover highlighting and click-to-expand"
```

---

### Task 11: Create Mobile Waterfall + Wire to CascadePage

**Files:**
- Create: `src/components/cascade/MobileWaterfall.tsx`
- Modify: `src/app/cascade/CascadePage.tsx`

- [ ] **Step 1: Create MobileWaterfall**

Create `src/components/cascade/MobileWaterfall.tsx`:

```tsx
'use client';

import { philippineCascade, SEVERITY_COLORS, CATEGORY_COLORS } from '@/data/cascade';
import type { CascadeNode, CascadeLink } from '@/types/cascade';

export function MobileWaterfall() {
  const { nodes, links } = philippineCascade;

  // Group by category in display order
  const categories = ['energy', 'agriculture', 'transport', 'consumer'] as const;

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const catNodes = nodes.filter((n) => n.category === cat);
        return (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim">{cat}</span>
            </div>

            {catNodes.map((node, i) => {
              // Find outgoing links from this node
              const outLinks = links.filter((l) => l.from === node.id);
              return (
                <div key={node.id}>
                  {/* Always-expanded node card */}
                  <div
                    className="glass-card p-4 rounded-xl mb-2"
                    style={{ borderLeftWidth: 3, borderLeftColor: SEVERITY_COLORS[node.severity] }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{node.icon}</span>
                      <span className="font-mono text-xs font-bold text-text-primary">{node.label}</span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-xl font-bold font-mono" style={{ color: SEVERITY_COLORS[node.severity] }}>
                        {node.currentValue}
                      </span>
                      <span className="text-[10px] font-mono text-text-dim">
                        +{node.changePercent}% from {node.baselineValue}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{node.impact}</p>
                    {node.sourceUrl ? (
                      <a href={node.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-text-dim hover:text-petron mt-1 inline-block">
                        {node.source} ↗
                      </a>
                    ) : (
                      <span className="text-[10px] font-mono text-text-dim mt-1 inline-block">{node.source}</span>
                    )}
                  </div>

                  {/* Connector lines to next nodes */}
                  {outLinks.length > 0 && (
                    <div className="ml-6 pl-3 border-l-2 border-border-subtle space-y-1 mb-2">
                      {outLinks.map((link) => (
                        <div key={`${link.from}-${link.to}`} className="text-[10px] font-mono text-text-dim">
                          → {link.mechanism} • {link.lag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update CascadePage**

Replace the contents of `src/app/cascade/CascadePage.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { cascadeStats } from '@/data/cascade';
import { MobileWaterfall } from '@/components/cascade/MobileWaterfall';

const SankeyDiagram = dynamic(
  () => import('@/components/cascade/SankeyDiagram').then((m) => m.SankeyDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[400px] glass-card rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-text-dim font-mono text-xs">Loading cascade diagram...</span>
      </div>
    ),
  },
);

export default function CascadePage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <Header showTicker={false} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-red/10 border border-status-red/20 text-status-red text-[10px] font-mono uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-status-red animate-ping" />
            Live Cascade Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
            Second-Order Effects
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            How energy disruptions ripple through fertilizer, food, transport, and household budgets across the Philippines.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <div className="glass-card px-4 py-2 rounded-lg text-center">
            <div className="text-lg font-bold font-mono text-text-primary">{cascadeStats.totalNodes}</div>
            <div className="text-[10px] font-mono text-text-dim uppercase">Impact Nodes</div>
          </div>
          <div className="glass-card px-4 py-2 rounded-lg text-center">
            <div className="text-lg font-bold font-mono text-status-red">{cascadeStats.criticalCount}</div>
            <div className="text-[10px] font-mono text-text-dim uppercase">Critical</div>
          </div>
          <div className="glass-card px-4 py-2 rounded-lg text-center">
            <div className="text-lg font-bold font-mono text-text-primary">{cascadeStats.totalLinks}</div>
            <div className="text-[10px] font-mono text-text-dim uppercase">Causal Links</div>
          </div>
          <div className="glass-card px-4 py-2 rounded-lg text-center">
            <div className="text-lg font-bold font-mono text-text-primary">{cascadeStats.categories}</div>
            <div className="text-[10px] font-mono text-text-dim uppercase">Sectors</div>
          </div>
        </div>

        {/* Desktop: Sankey, Mobile: Waterfall */}
        <div className="hidden md:block glass-card p-4 sm:p-6 rounded-xl">
          <SankeyDiagram />
        </div>
        <div className="md:hidden">
          <MobileWaterfall />
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-mono text-text-dim">
            Data from DOE Oil Monitor, PSA, DA Price Watch, LTFRB, and industry reports. Cascade links are modeled, not predictive.
          </p>
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Delete old cascade components no longer needed**

```bash
cd /Users/bbmisa/oil_energy_map
rm src/components/cascade/CascadeSection.tsx src/components/cascade/CascadeFlow.tsx src/components/cascade/CascadeCard.tsx src/components/cascade/ImpactMeter.tsx
```

Verify nothing else imports these files:

```bash
grep -r "CascadeSection\|CascadeFlow\|CascadeCard\|ImpactMeter" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 4: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/cascade/ src/app/cascade/CascadePage.tsx
git add -u src/components/cascade/
git commit -m "replace static cascade cards with interactive D3 Sankey + mobile waterfall"
```

---

## WS-C: Dashboard Cinematic Act Breaks

### Task 12: Extract + Rewrite ActDivider

**Files:**
- Create: `src/components/layout/ActDivider.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the cinematic ActDivider component**

Create `src/components/layout/ActDivider.tsx`:

```tsx
'use client';

import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface ActDividerProps {
  number: string;
  question: string;
  hook: string;
  gradientFrom: string;
  gradientTo: string;
}

export function ActDivider({ number, question, hook, gradientFrom, gradientTo }: ActDividerProps) {
  const { ref, progress, isInView } = useElementScrollProgress<HTMLDivElement>();

  // Parallax: background moves at 0.5x speed
  const bgOffset = (progress - 0.5) * -30;

  return (
    <div
      ref={ref}
      className="relative min-h-[30vh] sm:min-h-[30vh] flex items-center justify-center overflow-hidden my-4"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        transform: `translateY(${bgOffset}px)`,
      }}
    >
      {/* Top/bottom glow lines */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradientTo}, transparent)`, opacity: 0.3 }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradientTo}, transparent)`, opacity: 0.3 }} />

      <section
        className="text-center px-6 max-w-xl mx-auto"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
        aria-label={`Act ${number}: ${question}`}
      >
        {/* Large act number watermark */}
        <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-black text-text-primary/[0.06] leading-none select-none mb-2">
          {number}
        </div>

        {/* Question */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary -mt-8 sm:-mt-12 md:-mt-16 mb-3">
          {question}
        </h2>

        {/* Hook */}
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          {hook}
        </p>

        {/* Down arrow CTA */}
        <div className="mt-4 text-text-dim animate-bounce" style={{ animationDuration: '2s' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto" aria-hidden="true">
            <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Remove the inline `ActDivider` function (lines 87-111) and replace all usages with the new imported component. Changes to `src/app/page.tsx`:

**a)** Add import at top:
```typescript
import { ActDivider } from '@/components/layout/ActDivider';
```

**b)** Delete the inline `ActDivider` function (lines 87-111).

**c)** Replace Act 1 divider (around line 136):
```tsx
<ActDivider
  number="01"
  question="What's Happening Now"
  hook="Live supply chain status — crude benchmarks, forex, pump prices, and the infrastructure that moves oil across the Philippines."
  gradientFrom="#060a10"
  gradientTo="#0a1628"
/>
```

**d)** Replace Act 2 divider (around line 170):
```tsx
<ActDivider
  number="02"
  question="What does it cost you?"
  hook="The supply chain above sets the stage. Now let's see what it means at the pump — and in your wallet."
  gradientFrom="#0a1628"
  gradientTo="#1e1b4b"
/>
```

**e)** Replace Act 3 divider (around line 202):
```tsx
<ActDivider
  number="03"
  question="What could happen next?"
  hook="Prices are one thing. But what if Hormuz closes for 8 weeks? Model the scenarios yourself."
  gradientFrom="#1e1b4b"
  gradientTo="#1c1408"
/>
```

**f)** Replace Act 4 divider (around line 233):
```tsx
<ActDivider
  number="04"
  question="Who controls the supply?"
  hook="Behind every price movement are market players, system health indicators, and global events."
  gradientFrom="#1c1408"
  gradientTo="#0f172a"
/>
```

**g)** Remove the `<FadeIn>` wrappers around each ActDivider (the component handles its own scroll animation now).

**h)** While in page.tsx, also fix the ScenarioPlanner grid (mobile fix from WS-D spec — doing it here since we're already editing the file). Find the section with `id="stress-test"` around line 222:

Change:
```tsx
<section id="stress-test" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
```
To:
```tsx
<section id="stress-test" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
```

Also update all other `scroll-mt-20` to `scroll-mt-24` throughout page.tsx for consistent offset with the new taller act breaks.

- [ ] **Step 3: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/layout/ActDivider.tsx src/app/page.tsx
git commit -m "extract and upgrade ActDivider to cinematic 30vh interstitials with gradient shifts"
```

---

## WS-D: Mobile Fixes

### Task 13: Fix Overflow Bugs

**Files:**
- Modify: `src/components/alerts/AlertDrawer.tsx`
- Modify: `src/components/map/MapWrapper.tsx`

- [ ] **Step 1: Fix AlertDrawer width**

In `src/components/alerts/AlertDrawer.tsx`, line 18, change:
```tsx
className="absolute right-0 top-0 bottom-0 w-[360px] glass-card border-l border-border-subtle overflow-y-auto"
```
to:
```tsx
className="absolute right-0 top-0 bottom-0 w-full sm:w-[360px] glass-card border-l border-border-subtle overflow-y-auto"
```

- [ ] **Step 2: Fix MapWrapper height**

In `src/components/map/MapWrapper.tsx`, find the container div with `h-[500px]` and change it to:
```tsx
h-[clamp(350px,55vh,600px)] sm:h-[600px] lg:h-[75vh] lg:max-h-[900px]
```

- [ ] **Step 3: Fix RegionPanel and FacilityDetail widths**

In `src/components/map/RegionPanel.tsx`, find the root container with `w-[320px]` and change to `w-full sm:w-[320px]`.

In `src/components/map/FacilityDetail.tsx`, find the root container with `max-w-sm` and change to `max-w-[calc(100vw-2rem)] sm:max-w-sm`.

- [ ] **Step 4: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/alerts/AlertDrawer.tsx src/components/map/MapWrapper.tsx src/components/map/RegionPanel.tsx src/components/map/FacilityDetail.tsx
git commit -m "fix mobile overflow bugs — responsive widths for AlertDrawer, map overlays, and map height"
```

---

### Task 14: Create BottomSheet Component

**Files:**
- Create: `src/components/ui/BottomSheet.tsx`

Reusable bottom sheet for mobile map overlays with drag handle and swipe-to-dismiss.

- [ ] **Step 1: Create BottomSheet**

```tsx
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, snapPoints = [0.6], children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(snapPoints[0] * 100);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setHeight(snapPoints[0] * 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, snapPoints]);

  if (!isOpen) return null;

  function handleDragStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = height;
  }

  function handleDrag(e: React.TouchEvent) {
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(10, Math.min(90, dragStartHeight.current + deltaPercent));
    setHeight(newHeight);
  }

  function handleDragEnd() {
    // Snap to nearest point or dismiss
    if (height < 15) {
      onClose();
      return;
    }
    const snapPercents = snapPoints.map((s) => s * 100);
    const nearest = snapPercents.reduce((a, b) => (Math.abs(b - height) < Math.abs(a - height) ? b : a));
    setHeight(nearest);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 inset-x-0 z-[91] glass-card rounded-t-2xl overflow-y-auto"
        style={{
          height: `${height}vh`,
          maxHeight: '90vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transition: 'height 0.2s ease-out',
        }}
      >
        {/* Drag handle */}
        <div
          className="sticky top-0 flex justify-center py-3 cursor-grab active:cursor-grabbing bg-bg-card/90 backdrop-blur rounded-t-2xl z-10"
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1 rounded-full bg-border-hover" />
        </div>

        <div className="px-4 pb-4">{children}</div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
git add src/components/ui/BottomSheet.tsx
git commit -m "add reusable BottomSheet component for mobile map overlays"
```

---

### Task 15: Final Build Verification + Push + Deploy

**Files:** None (verification only)

- [ ] **Step 1: Full build check**

```bash
cd /Users/bbmisa/oil_energy_map && pnpm build
```

Expected: Clean build with no errors.

- [ ] **Step 2: Push all commits**

```bash
cd /Users/bbmisa/oil_energy_map && /opt/homebrew/bin/git push origin main
```

- [ ] **Step 3: Deploy to Vercel production**

```bash
cd /Users/bbmisa/oil_energy_map && npx vercel --prod --yes
```

- [ ] **Step 4: Verify deployment is READY**

Check the deployment URL shows "READY" status.
