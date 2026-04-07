# WS-B: Data Visualization Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat text cards with proper data visualizations — bigger numbers, animated counters, linked interactions, and progressive disclosure across all dashboard components.

**Architecture:** Upgrade 6 existing components with enhanced visualizations using Recharts (already installed) and pure SVG. Add cross-component highlight context for linked hover interactions. All animations CSS-first.

**Tech Stack:** Next.js 14, Recharts, Tailwind CSS, CSS custom properties, React Context

---

## Task 1: Create GaugeBar.tsx — Reusable Horizontal Gauge with Threshold Zones

**File:** `src/components/ui/GaugeBar.tsx` (NEW)

**Purpose:** A reusable horizontal gauge bar with green/yellow/red threshold zones and an animated value indicator. Used by VitalSigns to replace plain text values with visual gauges.

- [ ] Create `src/components/ui/GaugeBar.tsx` with the full implementation below
- [ ] Verify it renders correctly in isolation (no side effects on import)

**Full file content:**

```tsx
'use client';

import { useMemo } from 'react';

interface ThresholdZone {
  /** Start of zone as percentage 0-100 */
  start: number;
  /** End of zone as percentage 0-100 */
  end: number;
  /** Color token — use status colors */
  color: string;
}

interface GaugeBarProps {
  /** Current value as percentage 0-100 */
  value: number;
  /** Label for the gauge */
  label?: string;
  /** Threshold zones defining colored regions */
  zones?: ThresholdZone[];
  /** Height of the gauge bar in pixels */
  height?: number;
  /** Whether to show threshold markers as vertical lines */
  showMarkers?: boolean;
  /** Optional className for the container */
  className?: string;
}

const DEFAULT_ZONES: ThresholdZone[] = [
  { start: 0, end: 33, color: 'var(--status-red, #ef4444)' },
  { start: 33, end: 66, color: 'var(--status-yellow, #eab308)' },
  { start: 66, end: 100, color: 'var(--status-green, #10b981)' },
];

export function GaugeBar({
  value,
  label,
  zones = DEFAULT_ZONES,
  height = 8,
  showMarkers = true,
  className = '',
}: GaugeBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  // Determine which zone the current value falls in
  const activeZone = useMemo(() => {
    for (const zone of zones) {
      if (clampedValue >= zone.start && clampedValue <= zone.end) {
        return zone;
      }
    }
    return zones[zones.length - 1];
  }, [clampedValue, zones]);

  // Collect unique boundary markers (exclude 0 and 100)
  const markers = useMemo(() => {
    const boundaries = new Set<number>();
    for (const zone of zones) {
      if (zone.start > 0 && zone.start < 100) boundaries.add(zone.start);
      if (zone.end > 0 && zone.end < 100) boundaries.add(zone.end);
    }
    return Array.from(boundaries).sort((a, b) => a - b);
  }, [zones]);

  return (
    <div className={className}>
      {label && (
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-dim mb-1">
          {label}
        </p>
      )}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height }}
      >
        {/* Zone background segments */}
        {zones.map((zone, i) => (
          <div
            key={i}
            className="absolute top-0 h-full"
            style={{
              left: `${zone.start}%`,
              width: `${zone.end - zone.start}%`,
              backgroundColor: zone.color,
              opacity: 0.15,
            }}
          />
        ))}

        {/* Active fill up to current value */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: activeZone.color,
            opacity: 0.85,
          }}
        />

        {/* Threshold markers */}
        {showMarkers &&
          markers.map((pos) => (
            <div
              key={pos}
              className="absolute top-0 h-full"
              style={{
                left: `${pos}%`,
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
          ))}
      </div>
    </div>
  );
}
```

---

## Task 2: Create HighlightContext.tsx — Cross-Component Hover Linking

**File:** `src/lib/HighlightContext.tsx` (NEW)

**Purpose:** Lightweight React context that tracks which market player is currently highlighted (via donut hover). Both MarketShare and PlayerCards consume this context to create linked hover interactions.

- [ ] Create `src/lib/HighlightContext.tsx` with the full implementation below
- [ ] Verify the context provider and hook export correctly

**Full file content:**

```tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HighlightState {
  /** Name of the currently highlighted player, or null */
  highlightedPlayer: string | null;
  /** Set the highlighted player (called on mouseenter) */
  setHighlightedPlayer: (name: string | null) => void;
}

const HighlightContext = createContext<HighlightState>({
  highlightedPlayer: null,
  setHighlightedPlayer: () => {},
});

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPlayer, setHighlightedPlayerRaw] = useState<string | null>(null);

  const setHighlightedPlayer = useCallback((name: string | null) => {
    setHighlightedPlayerRaw(name);
  }, []);

  return (
    <HighlightContext.Provider value={{ highlightedPlayer, setHighlightedPlayer }}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  return useContext(HighlightContext);
}
```

---

## Task 3: Upgrade VitalSigns.tsx — Horizontal Gauges with Threshold Markers

**File:** `src/components/health/VitalSigns.tsx` (MODIFY)

**Purpose:** Replace the plain text value display with GaugeBar horizontal gauges. Each vital sign gets a gauge with green/yellow/red zones that match the existing threshold logic.

- [ ] Add `GaugeBar` import
- [ ] Add helper function `getGaugeConfig` to map each vital sign to gauge value + zone config
- [ ] Add the GaugeBar below the existing value text in each card

### Edit 1: Add GaugeBar import

**old_string:**
```
import { VITAL_SIGNS } from '@/lib/constants';
import { InfoTip } from '@/components/ui/Tooltip';
import type { RiskLevel, ScenarioParams, MapMode, VitalSign } from '@/types';
```

**new_string:**
```
import { VITAL_SIGNS } from '@/lib/constants';
import { InfoTip } from '@/components/ui/Tooltip';
import { GaugeBar } from '@/components/ui/GaugeBar';
import type { RiskLevel, ScenarioParams, MapMode, VitalSign } from '@/types';
```

### Edit 2: Add gauge config helper after STATUS_STYLES

**old_string:**
```
function deriveVitalSigns(base: VitalSign[], params: ScenarioParams): VitalSign[] {
```

**new_string:**
```
/** Maps vital sign values to gauge percentages and zone configs */
function getGaugeConfig(sign: VitalSign): {
  value: number;
  zones: { start: number; end: number; color: string }[];
} {
  switch (sign.label) {
    case 'Days of Supply': {
      // 0-21 days scale; <8 red, 8-12 yellow, 12+ green
      const days = parseInt(sign.value) || 0;
      const pct = Math.min(100, (days / 21) * 100);
      return {
        value: pct,
        zones: [
          { start: 0, end: 38, color: 'var(--status-red, #ef4444)' },
          { start: 38, end: 57, color: 'var(--status-yellow, #eab308)' },
          { start: 57, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Import Diversity': {
      // 1-6 sources; <3 red, 3 yellow, 4+ green
      const sources = parseInt(sign.value) || 0;
      const pct = Math.min(100, (sources / 6) * 100);
      return {
        value: pct,
        zones: [
          { start: 0, end: 50, color: 'var(--status-red, #ef4444)' },
          { start: 50, end: 67, color: 'var(--status-yellow, #eab308)' },
          { start: 67, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Refinery Utilization': {
      // 0-100%; <60 red, 60-80 yellow, 80+ green
      const util = parseInt(sign.value) || 0;
      return {
        value: util,
        zones: [
          { start: 0, end: 60, color: 'var(--status-red, #ef4444)' },
          { start: 60, end: 80, color: 'var(--status-yellow, #eab308)' },
          { start: 80, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Route Risk': {
      // Map labels to gauge values (inverted — higher value = more risk)
      const riskMap: Record<string, number> = { MODERATE: 25, HIGH: 60, CRITICAL: 90 };
      const pct = riskMap[sign.value] ?? 25;
      return {
        value: pct,
        zones: [
          { start: 0, end: 40, color: 'var(--status-green, #10b981)' },
          { start: 40, end: 70, color: 'var(--status-yellow, #eab308)' },
          { start: 70, end: 100, color: 'var(--status-red, #ef4444)' },
        ],
      };
    }
    default:
      return { value: 50, zones: [] };
  }
}

function deriveVitalSigns(base: VitalSign[], params: ScenarioParams): VitalSign[] {
```

### Edit 3: Add GaugeBar below the value text in the card

**old_string:**
```
            <span className="text-2xl font-mono font-bold text-text-primary">
              {sign.value}
            </span>
          </div>
```

**new_string:**
```
            <span className="text-2xl font-mono font-bold text-text-primary">
              {sign.value}
            </span>
            <GaugeBar
              value={getGaugeConfig(sign).value}
              zones={getGaugeConfig(sign).zones}
              height={6}
              showMarkers
              className="mt-3"
            />
          </div>
```

---

## Task 4: Upgrade MarketShare.tsx — Hover Linking + Center Label

**File:** `src/components/players/MarketShare.tsx` (MODIFY)

**Purpose:** Add hover interactions on donut segments that update HighlightContext, and make the center label dynamic — showing the hovered player's name and percentage.

- [ ] Add `useState` and `useHighlight` imports
- [ ] Add `onMouseEnter`/`onMouseLeave` handlers to Pie via `activeIndex` state
- [ ] Make center `<text>` dynamic — show hovered player name + share, or "Market Share" default
- [ ] Add hover cursor styling to donut segments

### Full replacement of MarketShare.tsx

**old_string:**
```
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { marketPlayers } from '@/data/players';
import { MarketPlayer } from '@/types';

export function MarketShare() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-sans">
        Market Share
      </h3>
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={marketPlayers}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="marketShare"
              nameKey="name"
              labelLine={false}
              isAnimationActive={false}
            >
              {marketPlayers.map((player: MarketPlayer) => (
                <Cell key={player.name} fill={player.color} strokeWidth={0} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.3)"
              fontSize={10}
              fontFamily="monospace"
            >
              Market Share
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Logo legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {marketPlayers.map((player) => (
          <div key={player.name} className="flex items-center gap-1.5">
            <img
              src={player.logo}
              alt={player.name}
              width={16}
              height={16}
              className="rounded-sm"
            />
            <span className="text-[10px] font-mono text-text-secondary">
              {player.name}
            </span>
            <span className="text-[10px] font-mono text-text-subtle ml-auto">
              {player.marketShare}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**new_string:**
```
'use client';

import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { marketPlayers } from '@/data/players';
import { MarketPlayer } from '@/types';
import { useHighlight } from '@/lib/HighlightContext';

/* eslint-disable @typescript-eslint/no-explicit-any */
function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 6px ${fill})`,
          transition: 'all 0.2s ease-out',
        }}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function MarketShare() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { setHighlightedPlayer } = useHighlight();

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      setActiveIndex(index);
      setHighlightedPlayer(marketPlayers[index].name);
    },
    [setHighlightedPlayer],
  );

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
    setHighlightedPlayer(null);
  }, [setHighlightedPlayer]);

  const hoveredPlayer = activeIndex !== null ? marketPlayers[activeIndex] : null;

  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-sans">
        Market Share
      </h3>
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={marketPlayers}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="marketShare"
              nameKey="name"
              labelLine={false}
              isAnimationActive={false}
              activeIndex={activeIndex ?? undefined}
              activeShape={ActiveShape}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {marketPlayers.map((player: MarketPlayer, i: number) => (
                <Cell
                  key={player.name}
                  fill={player.color}
                  strokeWidth={0}
                  opacity={activeIndex !== null && activeIndex !== i ? 0.4 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                />
              ))}
            </Pie>
            {/* Dynamic center label */}
            {hoveredPlayer ? (
              <>
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={hoveredPlayer.color}
                  fontSize={20}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {hoveredPlayer.marketShare}%
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {hoveredPlayer.name}
                </text>
              </>
            ) : (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.3)"
                fontSize={10}
                fontFamily="monospace"
              >
                Market Share
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Logo legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {marketPlayers.map((player) => (
          <div
            key={player.name}
            className="flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors duration-200"
            style={{
              backgroundColor:
                hoveredPlayer?.name === player.name
                  ? `${player.color}15`
                  : 'transparent',
            }}
            onMouseEnter={() => {
              const idx = marketPlayers.findIndex((p) => p.name === player.name);
              setActiveIndex(idx);
              setHighlightedPlayer(player.name);
            }}
            onMouseLeave={() => {
              setActiveIndex(null);
              setHighlightedPlayer(null);
            }}
          >
            <img
              src={player.logo}
              alt={player.name}
              width={16}
              height={16}
              className="rounded-sm"
            />
            <span className="text-[10px] font-mono text-text-secondary">
              {player.name}
            </span>
            <span className="text-[10px] font-mono text-text-subtle ml-auto">
              {player.marketShare}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 5: Upgrade PlayerCards.tsx — Consume Highlight Context for Border Glow

**File:** `src/components/players/PlayerCards.tsx` (MODIFY)

**Purpose:** When a player is highlighted via MarketShare donut hover, the corresponding PlayerCard receives a glowing border effect using the player's brand color.

- [ ] Add `useHighlight` import
- [ ] Apply conditional glow styling when `highlightedPlayer` matches the card's player name
- [ ] Ensure glow uses CSS transitions (not JS animation)

### Edit 1: Add useHighlight import

**old_string:**
```
'use client';

import { useState } from 'react';
import { marketPlayers } from '@/data/players';
import { RiskLevel } from '@/types';
```

**new_string:**
```
'use client';

import { useState } from 'react';
import { marketPlayers } from '@/data/players';
import { RiskLevel } from '@/types';
import { useHighlight } from '@/lib/HighlightContext';
```

### Edit 2: Add highlight consumption inside the component

**old_string:**
```
export function PlayerCards() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {marketPlayers.map((player) => {
        const level = vulnerabilityLevel(player.vulnerabilityScore);
        const risk = RISK_COLORS[level];
        const isExpanded = expanded === player.name;
```

**new_string:**
```
export function PlayerCards() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { highlightedPlayer } = useHighlight();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {marketPlayers.map((player) => {
        const level = vulnerabilityLevel(player.vulnerabilityScore);
        const risk = RISK_COLORS[level];
        const isExpanded = expanded === player.name;
        const isHighlighted = highlightedPlayer === player.name;
```

### Edit 3: Apply glow styling to the card button

**old_string:**
```
          <button
            key={player.name}
            type="button"
            onClick={() => setExpanded(isExpanded ? null : player.name)}
            className="glass-card card-interactive p-4 text-left w-full transition-all duration-200"
            style={{ borderLeftColor: player.color, borderLeftWidth: 3 }}
          >
```

**new_string:**
```
          <button
            key={player.name}
            type="button"
            onClick={() => setExpanded(isExpanded ? null : player.name)}
            className="glass-card card-interactive p-4 text-left w-full transition-all duration-200"
            style={{
              borderLeftColor: player.color,
              borderLeftWidth: 3,
              boxShadow: isHighlighted
                ? `0 0 12px ${player.color}40, inset 0 0 8px ${player.color}15`
                : 'none',
              borderColor: isHighlighted ? `${player.color}50` : undefined,
            }}
          >
```

---

## Task 6: Upgrade StressTest.tsx — Add Pure SVG Radar Chart

**File:** `src/components/scenarios/StressTest.tsx` (MODIFY)

**Purpose:** Add a mini SVG radar chart showing 4 risk dimensions (Supply, Price, Infrastructure, Policy) derived from the scenario params. Placed above the Monte Carlo results for an at-a-glance risk profile.

- [ ] Add `useMemo` import
- [ ] Create inline `RiskRadar` component with pure SVG (~50 lines)
- [ ] Derive 4 risk dimension values from `scenarioParams`
- [ ] Render the radar chart between the header and the Run button area

### Edit 1: Add useMemo to imports

**old_string:**
```
import { useState, useCallback } from 'react';
```

**new_string:**
```
import { useState, useCallback, useMemo } from 'react';
```

### Edit 2: Add RiskRadar component before StressTest

**old_string:**
```
interface StressTestProps {
  scenarioParams: ScenarioParams;
}

export function StressTest({ scenarioParams }: StressTestProps) {
```

**new_string:**
```
/** Pure SVG radar chart for 4 risk dimensions */
function RiskRadar({
  dimensions,
}: {
  dimensions: { label: string; value: number }[];
}) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 52;

  // 4 axes at 0, 90, 180, 270 degrees (top, right, bottom, left)
  const angles = dimensions.map((_, i) => (i * 360) / dimensions.length - 90);

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  // Background rings at 33%, 66%, 100%
  const rings = [0.33, 0.66, 1.0];

  // Data polygon points
  const dataPoints = dimensions.map((d, i) => {
    const r = (d.value / 100) * maxR;
    return toXY(angles[i], r);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Background rings */}
      {rings.map((scale) => {
        const ringPoints = angles.map((a) => toXY(a, maxR * scale));
        const path = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return (
          <polygon
            key={scale}
            points=""
            d={path}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Use <path> for ring polygons */}
      {rings.map((scale) => {
        const ringPoints = angles.map((a) => toXY(a, maxR * scale));
        const d = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return <path key={`ring-${scale}`} d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />;
      })}
      {/* Axis lines */}
      {angles.map((a, i) => {
        const end = toXY(a, maxR);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Data polygon with glow */}
      <path
        d={dataPath}
        fill="var(--accent-primary, #3b82f6)"
        fillOpacity={0.15}
        stroke="var(--accent-primary, #3b82f6)"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-primary, #3b82f6))' }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={2.5}
          fill="var(--accent-primary, #3b82f6)"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={0.5}
        />
      ))}
      {/* Axis labels */}
      {dimensions.map((d, i) => {
        const labelR = maxR + 14;
        const pos = toXY(angles[i], labelR);
        return (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.4)"
            fontSize={8}
            fontFamily="monospace"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

interface StressTestProps {
  scenarioParams: ScenarioParams;
}

export function StressTest({ scenarioParams }: StressTestProps) {
```

### Edit 3: Add radar chart rendering and risk dimension derivation inside StressTest

**old_string:**
```
  const probEntry = result?.probabilityAbove.find((p) => p.threshold === threshold);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
```

**new_string:**
```
  const probEntry = result?.probabilityAbove.find((p) => p.threshold === threshold);

  // Derive 4 risk dimensions from scenario params (0-100 scale)
  const riskDimensions = useMemo(() => {
    const supply = Math.min(100, (scenarioParams.hormuzWeeks / 16) * 100);
    const price = Math.min(100, Math.max(0, ((scenarioParams.brentPrice - 60) / 100) * 100));
    const infrastructure = scenarioParams.refineryOffline ? 85 : Math.min(100, (scenarioParams.hormuzWeeks / 16) * 50);
    const policy = Math.min(100, ((scenarioParams.forexRate - 50) / 15) * 100);
    return [
      { label: 'Supply', value: supply },
      { label: 'Price', value: price },
      { label: 'Infra', value: infrastructure },
      { label: 'Policy', value: policy },
    ];
  }, [scenarioParams]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
```

### Edit 4: Add the radar chart rendering between the header and Run button

**old_string:**
```
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
        >
          {running ? 'Simulating...' : 'Run Stress Test'}
        </button>
      </div>

      {result && (
```

**new_string:**
```
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
        >
          {running ? 'Simulating...' : 'Run Stress Test'}
        </button>
      </div>

      {/* Risk Radar — at-a-glance 4-axis risk profile */}
      <div className="glass-card p-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2 text-center">
          Risk Profile
        </p>
        <RiskRadar dimensions={riskDimensions} />
      </div>

      {result && (
```

---

## Task 7: Upgrade SentimentGauge.tsx — Trend Sparkline + Shift Arrow

**File:** `src/components/health/SentimentGauge.tsx` (MODIFY)

**Purpose:** Add a sentiment trend sparkline showing the last N readings and a directional shift arrow indicating whether sentiment is improving or deteriorating.

- [ ] Add `useRef` and `useEffect` imports for tracking sentiment history
- [ ] Add `SparkChart` import
- [ ] Track sentiment history in a ref (last 10 readings)
- [ ] Add sparkline and shift arrow between the gauge bar and breakdown counts

### Edit 1: Add imports

**old_string:**
```
'use client';

import { useSentiment, SentimentResult } from '@/hooks/useSentiment';
```

**new_string:**
```
'use client';

import { useRef, useEffect } from 'react';
import { useSentiment, SentimentResult } from '@/hooks/useSentiment';
import { SparkChart } from '@/components/prices/SparkChart';
```

### Edit 2: Add sentiment history tracking inside the SentimentGauge component, after the overallLabel call

**old_string:**
```
export function SentimentGauge() {
  const { sentiments, overallScore, isLoading, error } = useSentiment();
  const overall = overallLabel(overallScore);

  // Normalize score from [-1, 1] to [0, 100] for the gauge bar
  const gaugePercent = Math.round((overallScore + 1) * 50);
```

**new_string:**
```
export function SentimentGauge() {
  const { sentiments, overallScore, isLoading, error } = useSentiment();
  const overall = overallLabel(overallScore);

  // Track sentiment history for trend sparkline (last 10 readings)
  const historyRef = useRef<number[]>([]);
  useEffect(() => {
    if (overallScore !== 0 || sentiments.length > 0) {
      const history = historyRef.current;
      // Avoid duplicate consecutive values from re-renders
      if (history.length === 0 || history[history.length - 1] !== overallScore) {
        history.push(overallScore);
        if (history.length > 10) history.shift();
      }
    }
  }, [overallScore, sentiments.length]);

  const trendData = historyRef.current.map((s) => (s + 1) * 50); // normalize to 0-100
  const trendDirection =
    trendData.length >= 2
      ? trendData[trendData.length - 1] > trendData[trendData.length - 2]
        ? 'improving'
        : trendData[trendData.length - 1] < trendData[trendData.length - 2]
          ? 'deteriorating'
          : 'stable'
      : 'stable';

  // Normalize score from [-1, 1] to [0, 100] for the gauge bar
  const gaugePercent = Math.round((overallScore + 1) * 50);
```

### Edit 3: Add sparkline and shift arrow between gauge bar and breakdown counts

**old_string:**
```
      {/* Sentiment breakdown counts */}
      <div className="flex items-center gap-4 mb-3">
```

**new_string:**
```
      {/* Sentiment trend sparkline + shift arrow */}
      {trendData.length >= 2 && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SparkChart
              data={trendData}
              color={overall.color === 'text-emerald-400' ? '#34d399' : overall.color === 'text-red-400' ? '#f87171' : '#fbbf24'}
              width={80}
              height={20}
            />
            <span
              className={`text-xs font-mono font-bold ${
                trendDirection === 'improving'
                  ? 'text-emerald-400'
                  : trendDirection === 'deteriorating'
                    ? 'text-red-400'
                    : 'text-text-subtle'
              }`}
            >
              {trendDirection === 'improving' && '↑'}
              {trendDirection === 'deteriorating' && '↓'}
              {trendDirection === 'stable' && '→'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-text-dim">
            {trendData.length} readings
          </span>
        </div>
      )}

      {/* Sentiment breakdown counts */}
      <div className="flex items-center gap-4 mb-3">
```

---

## Task 8: Wire HighlightProvider into page.tsx

**File:** `src/app/page.tsx` (MODIFY)

**Purpose:** Wrap the section containing both MarketShare and PlayerCards with the HighlightProvider so they can communicate via context.

- [ ] Add `HighlightProvider` import
- [ ] Wrap the players section content with `<HighlightProvider>`

### Edit 1: Add import at top of page.tsx

Find the existing dynamic imports block and add the HighlightProvider import nearby. The exact old_string depends on the surrounding imports — look for the MarketShare dynamic import:

**old_string:**
```
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false },
);
```

**new_string:**
```
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false },
);
import { HighlightProvider } from '@/lib/HighlightContext';
```

### Edit 2: Wrap the players section with HighlightProvider

**old_string:**
```
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <MarketShare />
            <PlayerCards />
          </div>
```

**new_string:**
```
          <HighlightProvider>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <MarketShare />
              <PlayerCards />
            </div>
          </HighlightProvider>
```

---

## Task 9 (Lower Priority): Upgrade ExecutiveSnapshot.tsx — Animated Delta Arrows + Comparison Row

**File:** `src/components/layout/ExecutiveSnapshot.tsx` (MODIFY)

**Purpose:** Enhance the HeroKPI cards with animated delta arrows that scale with magnitude and a "vs. last week" comparison row. This is lower priority and more coupled to WS-A's crisis coloring.

- [ ] Add animated arrow that scales with magnitude (CSS transform)
- [ ] Add "vs. last week" absolute value row below the delta

### Edit 1: Upgrade the delta arrow in HeroKPI to scale with magnitude

**old_string:**
```
      {/* Delta detail */}
      <p className={`mt-3 text-xs font-mono ${isUp ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
        {isUp ? '↑' : '↓'} {deltaLabel} vs prev week
      </p>
```

**new_string:**
```
      {/* Delta detail with magnitude-scaled arrow */}
      <div className="mt-3 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-mono ${isUp ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
          <span
            className="inline-block transition-transform duration-500"
            style={{
              transform: `scale(${1 + Math.min(Math.abs(pctChange) / 10, 1.5)})`,
            }}
          >
            {isUp ? '▲' : '▼'}
          </span>
          <span>{deltaLabel} vs prev week</span>
        </div>
        <span className="text-[9px] font-mono text-text-dim tabular-nums">
          prev: {formatValue(value - delta, unit)}
        </span>
      </div>
```

---

## Task 10 (Lower Priority): Upgrade PricePanel.tsx — Historical Context Line + Range Glow

**File:** `src/components/prices/PricePanel.tsx` (MODIFY)

**Purpose:** Add a visual glow effect when a price exceeds its historical range, making anomalous prices immediately noticeable. This is lower priority and more coupled to WS-A's crisis coloring.

- [ ] Add conditional glow border when price change exceeds 5%
- [ ] Enhance the card styling with crisis-aware border

### Edit 1: Add glow effect to BenchmarkCard when price exceeds range

**old_string:**
```
  return (
    <div className="glass-card card-interactive p-4">
      <div className="flex items-center justify-between mb-2">
```

**new_string:**
```
  const exceedsRange = Math.abs(parseFloat(changePct)) > 5;

  return (
    <div
      className="glass-card card-interactive p-4 transition-shadow duration-500"
      style={{
        boxShadow: exceedsRange
          ? `0 0 12px ${isUp ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          : undefined,
        borderColor: exceedsRange
          ? isUp ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
          : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-2">
```

---

## File Summary

| File | Action | Task |
|------|--------|------|
| `src/components/ui/GaugeBar.tsx` | CREATE | Task 1 |
| `src/lib/HighlightContext.tsx` | CREATE | Task 2 |
| `src/components/health/VitalSigns.tsx` | MODIFY (3 edits) | Task 3 |
| `src/components/players/MarketShare.tsx` | MODIFY (full replace) | Task 4 |
| `src/components/players/PlayerCards.tsx` | MODIFY (3 edits) | Task 5 |
| `src/components/scenarios/StressTest.tsx` | MODIFY (4 edits) | Task 6 |
| `src/components/health/SentimentGauge.tsx` | MODIFY (3 edits) | Task 7 |
| `src/app/page.tsx` | MODIFY (2 edits) | Task 8 |
| `src/components/layout/ExecutiveSnapshot.tsx` | MODIFY (1 edit) | Task 9 |
| `src/components/prices/PricePanel.tsx` | MODIFY (1 edit) | Task 10 |

## Execution Order

Tasks 1-2 (new files) can run in parallel — they have no dependencies.

Tasks 3-7 depend on their respective new files:
- Task 3 depends on Task 1 (GaugeBar)
- Tasks 4-5 depend on Task 2 (HighlightContext)
- Task 6 is independent (pure SVG, no new deps)
- Task 7 is independent (uses existing SparkChart)

Task 8 depends on Tasks 2, 4, 5 (wiring the context provider).

Tasks 9-10 are independent lower-priority upgrades.

**Recommended parallel batches:**
1. Batch 1: Task 1 + Task 2 (create new files)
2. Batch 2: Task 3 + Task 4 + Task 6 + Task 7 (independent component upgrades)
3. Batch 3: Task 5 + Task 8 (context consumers + wiring)
4. Batch 4: Task 9 + Task 10 (lower priority upgrades)

## Verification Checklist

- [ ] `pnpm build` passes clean with no unused import warnings
- [ ] GaugeBar renders green/yellow/red zones correctly at various values
- [ ] Hovering MarketShare donut highlights corresponding PlayerCard
- [ ] Radar chart in StressTest shows 4 axes and updates with scenario changes
- [ ] SentimentGauge sparkline appears after 2+ poll cycles
- [ ] `prefers-reduced-motion` disables all CSS transitions (existing global rule covers this)
- [ ] No hardcoded `rgba()` values — all through design tokens or component props
- [ ] Touch devices: hover effects degrade gracefully (`@media (hover: none)`)
