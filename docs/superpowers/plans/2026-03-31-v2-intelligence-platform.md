# PH Oil Intelligence v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the dashboard from a static visualization tool into a policy-grade intelligence platform with map controls overhaul, price alerts, scenario comparison, regional drill-down, consumer impact calculator, Monte Carlo stress test, and historical playback.

**Architecture:** Client-side only — no new backend APIs, no database. All new state lives in React hooks + localStorage. Monte Carlo runs in a Web Worker. Historical data is static JSON. Map controls rebuilt as hybrid icon strip + expandable panel.

**Tech Stack:** Next.js 14 App Router, deck.gl 9.2, MapLibre GL 5, Tailwind CSS, Recharts 3.8, Web Workers (native), localStorage

**Spec:** `docs/superpowers/specs/2026-03-31-v2-intelligence-platform-design.md`

**No test infrastructure** — verification is `pnpm build` + visual preview after each task.

---

## Parallelization Strategy

Tasks within each phase are independent and SHOULD be dispatched as parallel subagents:

| Phase | Parallel Tasks | Dependencies |
|-------|---------------|-------------|
| **Phase 1** | Tasks 1–4 (all independent) | None |
| **Phase 2** | Tasks 5–8 (all independent) | Phase 1 for map toolbar integration |
| **Phase 3** | Tasks 9–10 (independent) | Phase 2 for scenario params |
| **Integration** | Task 11 (sequential) | All above |

After each phase: one sequential integration task wires everything into `page.tsx` and runs `pnpm build`.

---

## File Structure

### New Files (28)

| File | Responsibility |
|------|---------------|
| `src/components/map/MapToolbar.tsx` | Vertical icon strip with layer toggle buttons |
| `src/components/map/MapToolbarPanel.tsx` | Expandable detail panel per layer |
| `src/components/map/CommandPalette.tsx` | ⌘K search overlay |
| `src/hooks/useKeyboardShortcuts.ts` | Global keyboard shortcut handler |
| `src/hooks/useAlerts.ts` | Alert rule CRUD, threshold checking, browser notifications |
| `src/components/alerts/AlertBell.tsx` | Header bell icon with unread count badge |
| `src/components/alerts/AlertDrawer.tsx` | Notification history drawer |
| `src/components/alerts/AlertRuleModal.tsx` | Create/edit alert rule modal |
| `src/hooks/useScenarios.ts` | Scenario CRUD, localStorage persistence |
| `src/components/scenarios/ScenarioSlots.tsx` | Pill tabs for saved scenarios |
| `src/components/scenarios/ScenarioCompare.tsx` | Side-by-side scenario comparison |
| `src/components/map/RegionLayer.ts` | deck.gl GeoJsonLayer for region polygons |
| `src/components/map/RegionPanel.tsx` | Regional detail sidebar |
| `src/data/regions-geo.json` | GeoJSON polygons for PH regions |
| `src/lib/region-analytics.ts` | Compute station density, nearest infrastructure |
| `src/components/consumer/ImpactCalculator.tsx` | Persona selector + results display |
| `src/components/consumer/PersonaCard.tsx` | Individual persona card |
| `src/components/consumer/ImpactResult.tsx` | Shareable result card |
| `src/lib/consumer-models.ts` | Persona definitions + calculation formulas |
| `src/lib/monte-carlo.worker.ts` | Web Worker for Monte Carlo simulation |
| `src/lib/monte-carlo.ts` | Typed interface for worker communication |
| `src/components/scenarios/StressTest.tsx` | Stress test UI with controls and results |
| `src/components/scenarios/ConfidenceFan.tsx` | Recharts AreaChart with P10–P90 bands |
| `src/components/ui/Disclaimer.tsx` | Reusable disclaimer badge component |
| `src/data/historical-prices.json` | Weekly price snapshots 2022–2026 |
| `src/data/historical-events.json` | Key events with dates, severity, price impact |
| `src/components/timeline/TimelineScrubber.tsx` | Full-width scrubber with event markers |
| `src/hooks/useHistoricalData.ts` | Manages playback state, date interpolation |

### Modified Files (7)

| File | What Changes |
|------|-------------|
| `src/components/map/IntelMap.tsx` | Replace LayerControls with MapToolbar, add RegionLayer, keyboard handling |
| `src/components/map/LayerControls.tsx` | Refactor: extract mode tabs to standalone component, simplify |
| `src/components/layout/Header.tsx` | Add AlertBell component |
| `src/components/scenarios/ScenarioPlanner.tsx` | Add save button, integrate ScenarioSlots |
| `src/components/layout/ExecutiveSnapshot.tsx` | Respond to historical playback date |
| `src/types/index.ts` | Add AlertRule, SavedScenario, MonteCarloResult, ConsumerPersona types |
| `src/app/globals.css` | Add toolbar animations, command palette overlay, disclaimer styles |
| `src/app/page.tsx` | Wire all new sections into layout |

---

## Phase 1: Map Controls Overhaul

### Task 1: Keyboard Shortcuts Hook + CSS Utilities

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1:** Create `src/hooks/useKeyboardShortcuts.ts`

```typescript
'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true,
) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ⌘K / Ctrl+K is special — always handle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts['⌘K']?.();
        return;
      }

      // Single-key shortcuts (only when no modifier)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toUpperCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler, enabled]);
}
```

- [ ] **Step 2:** Add CSS utilities to `src/app/globals.css` — append after the last rule (line 239):

```css
/* Command palette overlay */
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
}

/* Map toolbar slide-in */
.toolbar-panel-enter {
  animation: slideRight 0.2s ease-out;
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Shortcut hint badge */
.shortcut-badge {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.3);
}

/* Disclaimer card */
.disclaimer-card {
  border-left: 3px solid #f59e0b;
}

/* Live pulse indicator */
@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.animate-pulse-live {
  animation: pulse-live 2s ease-in-out infinite;
}

/* Region hover highlight */
.region-highlight {
  transition: opacity 0.2s ease;
}
```

- [ ] **Step 3:** Run `pnpm build` from `/Users/bbmisa/oil_energy_map` — verify clean

- [ ] **Step 4:** Commit: `git add src/hooks/useKeyboardShortcuts.ts src/app/globals.css && git commit -m "add keyboard shortcuts hook and CSS utilities for v2 map controls"`

---

### Task 2: MapToolbar + MapToolbarPanel

**Files:**
- Create: `src/components/map/MapToolbar.tsx`
- Create: `src/components/map/MapToolbarPanel.tsx`

**Context:** The current `LayerControls.tsx` (167 lines) is positioned `absolute top-4 right-4` inside the map container. It contains mode buttons (LIVE/SCENARIO/TIMELINE), layer toggles, brand filter chips, and region dropdown. The new MapToolbar replaces it with a vertical icon strip on the left side. The MapToolbarPanel slides out from the icon strip when a layer is selected.

**Pattern reference:** Follow `.glass-card` class for backgrounds. Use design tokens from `globals.css` — never hardcode `rgba()` values. Interactive buttons use the same pattern as `LayerControls`: `text-text-primary bg-border-hover` for active, `text-text-muted bg-transparent hover:bg-surface-hover` for inactive.

- [ ] **Step 1:** Create `src/components/map/MapToolbar.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { MapMode } from '@/types';
import { BRAND_COLORS } from '@/types/stations';
import { BRAND_LIST } from '@/data/stations';
import { REGION_NAMES } from '@/data/regions';
import MapToolbarPanel from './MapToolbarPanel';

type LayerKey = 'facilities' | 'routes' | 'labels' | 'stations';

interface ToolbarButton {
  key: LayerKey;
  icon: string;
  label: string;
  shortcut: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { key: 'facilities', icon: '🏭', label: 'Infra', shortcut: 'I' },
  { key: 'stations', icon: '⛽', label: 'Stations', shortcut: 'S' },
  { key: 'routes', icon: '🚢', label: 'Routes', shortcut: 'R' },
  { key: 'labels', icon: '🏷️', label: 'Labels', shortcut: 'L' },
];

interface MapToolbarProps {
  layers: { facilities: boolean; routes: boolean; labels: boolean };
  onToggle: (layer: string) => void;
  stationsVisible: boolean;
  onStationsToggle: () => void;
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  onCommandPalette: () => void;
}

export default function MapToolbar({
  layers,
  onToggle,
  stationsVisible,
  onStationsToggle,
  visibleBrands,
  onBrandToggle,
  selectedRegion,
  onRegionChange,
  onCommandPalette,
}: MapToolbarProps) {
  const [expandedLayer, setExpandedLayer] = useState<LayerKey | null>(null);

  const isLayerActive = useCallback(
    (key: LayerKey) => {
      if (key === 'stations') return stationsVisible;
      return layers[key as keyof typeof layers];
    },
    [layers, stationsVisible],
  );

  const handleToggle = useCallback(
    (key: LayerKey) => {
      if (key === 'stations') {
        onStationsToggle();
      } else {
        onToggle(key);
      }
    },
    [onToggle, onStationsToggle],
  );

  const handleExpand = useCallback(
    (key: LayerKey) => {
      // Toggle panel: click same button closes, different opens
      setExpandedLayer((prev) => (prev === key ? null : key));
    },
    [],
  );

  return (
    <>
      {/* Vertical icon strip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 glass-card p-1.5 flex flex-col gap-1">
        {TOOLBAR_BUTTONS.map(({ key, icon, label, shortcut }) => {
          const active = isLayerActive(key);
          const expanded = expandedLayer === key;
          return (
            <div key={key} className="relative group">
              <button
                onClick={() => handleToggle(key)}
                onDoubleClick={() => handleExpand(key)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 text-sm ${
                  active
                    ? 'bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] text-text-primary'
                    : 'bg-surface-hover text-text-muted hover:text-text-secondary'
                } ${expanded ? 'ring-1 ring-blue-500/30' : ''}`}
                title={`${label} (${shortcut})`}
              >
                {icon}
              </button>
              {/* Hover tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-2 py-1 rounded-md glass-card whitespace-nowrap pointer-events-none">
                <span className="text-[10px] font-mono text-text-secondary">{label}</span>
                <span className="shortcut-badge">{shortcut}</span>
              </div>
            </div>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-border-subtle my-0.5" />

        {/* Expand/collapse panel */}
        <button
          onClick={() => setExpandedLayer((prev) => (prev ? null : 'stations'))}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-hover text-text-muted hover:text-text-secondary transition-all duration-200 text-sm"
          title="Toggle panel ([)"
        >
          {expandedLayer ? '◀' : '▶'}
        </button>

        {/* Command palette */}
        <button
          onClick={onCommandPalette}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-hover text-text-muted hover:text-text-secondary transition-all duration-200 text-xs font-mono"
          title="Search (⌘K)"
        >
          ⌘K
        </button>
      </div>

      {/* Expandable panel */}
      {expandedLayer && (
        <MapToolbarPanel
          activeLayer={expandedLayer}
          layers={layers}
          stationsVisible={stationsVisible}
          visibleBrands={visibleBrands}
          onBrandToggle={onBrandToggle}
          selectedRegion={selectedRegion}
          onRegionChange={onRegionChange}
          onClose={() => setExpandedLayer(null)}
        />
      )}

      {/* Keyboard shortcut hint bar */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card">
        <span className="shortcut-badge">⌘K</span>
        <span className="text-[9px] font-mono text-text-dim">search</span>
        <span className="text-text-dim">·</span>
        {['I', 'S', 'R', 'L'].map((k) => (
          <span key={k} className="shortcut-badge">{k}</span>
        ))}
        <span className="text-[9px] font-mono text-text-dim">layers</span>
        <span className="text-text-dim">·</span>
        <span className="shortcut-badge">?</span>
        <span className="text-[9px] font-mono text-text-dim">help</span>
      </div>
    </>
  );
}
```

- [ ] **Step 2:** Create `src/components/map/MapToolbarPanel.tsx`

```typescript
'use client';

import { BRAND_LIST } from '@/data/stations';
import { BRAND_COLORS } from '@/types/stations';
import { REGION_NAMES } from '@/data/regions';

interface MapToolbarPanelProps {
  activeLayer: string;
  layers: { facilities: boolean; routes: boolean; labels: boolean };
  stationsVisible: boolean;
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  onClose: () => void;
}

export default function MapToolbarPanel({
  activeLayer,
  visibleBrands,
  onBrandToggle,
  selectedRegion,
  onRegionChange,
  onClose,
}: MapToolbarPanelProps) {
  return (
    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 glass-card p-3 w-[220px] toolbar-panel-enter">
      {/* Close button */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          {activeLayer === 'stations' ? 'Station Filters' : activeLayer === 'facilities' ? 'Infrastructure' : activeLayer === 'routes' ? 'Shipping Routes' : 'Labels'}
        </span>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-secondary text-xs"
        >
          ✕
        </button>
      </div>

      {/* Station filters */}
      {activeLayer === 'stations' && (
        <div className="space-y-3">
          {/* Brand chips */}
          <div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Brands</p>
            <div className="flex flex-wrap gap-1">
              {BRAND_LIST.map((brand) => {
                const isActive = visibleBrands.has(brand);
                return (
                  <button
                    key={brand}
                    onClick={() => onBrandToggle(brand)}
                    className={`px-1.5 py-0.5 rounded transition-all duration-200 font-mono text-[8px] uppercase tracking-widest ${
                      isActive
                        ? 'text-text-primary bg-border-subtle'
                        : 'text-text-dim bg-transparent'
                    }`}
                    style={{ borderLeft: `2px solid ${BRAND_COLORS[brand] ?? BRAND_COLORS.Other}` }}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region dropdown */}
          <div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Region</p>
            <select
              value={selectedRegion ?? ''}
              onChange={(e) => onRegionChange(e.target.value || null)}
              className="w-full px-2 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-border border border-border-hover text-text-primary outline-none cursor-pointer appearance-none hover:bg-border-subtle focus:border-border-hover"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '24px',
              }}
            >
              <option value="" className="bg-bg-card text-text-primary">All Regions</option>
              {REGION_NAMES.map((region) => (
                <option key={region} value={region} className="bg-bg-card text-text-primary">
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Infrastructure legend */}
      {activeLayer === 'facilities' && (
        <div className="space-y-2">
          {[
            { label: 'Refinery', color: 'bg-blue-500' },
            { label: 'Terminal', color: 'bg-emerald-500' },
            { label: 'Depot', color: 'bg-amber-500' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-[10px] font-mono text-text-secondary">{label}</span>
            </div>
          ))}
          <div className="h-px bg-border-subtle my-1" />
          <p className="text-[9px] font-mono text-text-dim">
            Circle size = capacity (bpd)
          </p>
        </div>
      )}

      {/* Routes info */}
      {activeLayer === 'routes' && (
        <div className="space-y-2">
          {[
            { label: 'Active Route', color: 'bg-emerald-500', style: 'solid' },
            { label: 'Disrupted', color: 'bg-red-500', style: 'dashed' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-4 h-0.5 ${color} rounded`} />
              <span className="text-[10px] font-mono text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Labels info */}
      {activeLayer === 'labels' && (
        <p className="text-[10px] font-mono text-text-dim">
          Geographic labels overlay. Toggle to reduce map clutter.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3:** Run `pnpm build` — verify clean

- [ ] **Step 4:** Commit: `git add src/components/map/MapToolbar.tsx src/components/map/MapToolbarPanel.tsx && git commit -m "add map toolbar icon strip and expandable detail panel"`

---

### Task 3: Command Palette

**Files:**
- Create: `src/components/map/CommandPalette.tsx`

**Context:** The palette is triggered by ⌘K (or Ctrl+K). It searches across stations (10,469 from `src/data/stations/`), facilities (from `src/data/facilities.ts`), regions (from `src/data/regions.ts`), and layer toggle actions. Results are navigable with ↑↓ keys and Enter. Selecting a station could trigger a map fly-to in the future; for now it logs the selection.

- [ ] **Step 1:** Create `src/components/map/CommandPalette.tsx`

```typescript
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ALL_STATIONS } from '@/data/stations';
import { FACILITIES } from '@/data/facilities';
import { REGION_NAMES } from '@/data/regions';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectStation?: (stationId: string) => void;
  onSelectRegion?: (region: string) => void;
  onToggleLayer?: (layer: string) => void;
}

interface SearchResult {
  type: 'station' | 'facility' | 'region' | 'action';
  icon: string;
  label: string;
  detail?: string;
  id: string;
}

const LAYER_ACTIONS: SearchResult[] = [
  { type: 'action', icon: '🏭', label: 'Toggle Infrastructure', id: 'toggle-facilities' },
  { type: 'action', icon: '⛽', label: 'Toggle Stations', id: 'toggle-stations' },
  { type: 'action', icon: '🚢', label: 'Toggle Routes', id: 'toggle-routes' },
  { type: 'action', icon: '🏷️', label: 'Toggle Labels', id: 'toggle-labels' },
];

export default function CommandPalette({
  open,
  onClose,
  onSelectStation,
  onSelectRegion,
  onToggleLayer,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return LAYER_ACTIONS;

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search stations (cap at 8)
    const stationMatches = ALL_STATIONS
      .filter((s) => s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q))
      .slice(0, 8)
      .map((s): SearchResult => ({
        type: 'station',
        icon: '⛽',
        label: s.name,
        detail: `${s.brand} · ${s.region ?? 'Unknown'}`,
        id: s.id,
      }));
    matches.push(...stationMatches);

    // Search facilities
    const facilityMatches = FACILITIES
      .filter((f) => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q))
      .slice(0, 5)
      .map((f): SearchResult => ({
        type: 'facility',
        icon: f.type === 'refinery' ? '🏭' : f.type === 'terminal' ? '🚢' : '📦',
        label: f.name,
        detail: `${f.operator} · ${f.location}`,
        id: f.id,
      }));
    matches.push(...facilityMatches);

    // Search regions
    const regionMatches = REGION_NAMES
      .filter((r) => r.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r): SearchResult => ({
        type: 'region',
        icon: '📍',
        label: r,
        id: `region-${r}`,
      }));
    matches.push(...regionMatches);

    // Search actions
    const actionMatches = LAYER_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
    matches.push(...actionMatches);

    return matches.slice(0, 20);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'station':
        onSelectStation?.(result.id);
        break;
      case 'region':
        onSelectRegion?.(result.label);
        break;
      case 'action':
        onToggleLayer?.(result.id.replace('toggle-', ''));
        break;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="w-full max-w-lg glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <span className="text-text-dim text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search stations, regions, actions..."
            className="flex-1 bg-transparent text-sm font-mono text-text-primary outline-none placeholder:text-text-dim"
          />
          <span className="shortcut-badge">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-3 text-sm font-mono text-text-dim">No results found</p>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? 'bg-border-hover' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="text-sm">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-text-primary truncate">{result.label}</p>
                {result.detail && (
                  <p className="text-[10px] font-mono text-text-dim truncate">{result.detail}</p>
                )}
              </div>
              <span className="text-[9px] font-mono text-text-dim uppercase">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Verify `ALL_STATIONS` is exported from `src/data/stations/index.ts` and `FACILITIES` from `src/data/facilities.ts`. If `ALL_STATIONS` doesn't exist as a named export, check what's available and adjust the import accordingly.

- [ ] **Step 3:** Run `pnpm build` — verify clean

- [ ] **Step 4:** Commit: `git add src/components/map/CommandPalette.tsx && git commit -m "add command palette for station/region/layer search"`

---

### Task 4: Integrate Map Controls into IntelMap

**Files:**
- Modify: `src/components/map/IntelMap.tsx`

**Context:** Replace the `LayerControls` component (line 165) with the new `MapToolbar` and `CommandPalette`. Move the mode tabs (LIVE/SCENARIO/TIMELINE) out of LayerControls into floating pills at the top center of the map. Wire up keyboard shortcuts.

- [ ] **Step 1:** Modify `src/components/map/IntelMap.tsx`:

1. Replace the `import LayerControls from './LayerControls';` with:
```typescript
import MapToolbar from './MapToolbar';
import CommandPalette from './CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
```

2. Add state for command palette inside the `IntelMap` component (after existing state declarations):
```typescript
const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
```

3. Add keyboard shortcuts hook (after the state declarations):
```typescript
useKeyboardShortcuts(
  useMemo(
    () => ({
      'I': () => handleToggle('facilities'),
      'S': () => setStationsVisible((v) => !v),
      'R': () => handleToggle('routes'),
      'L': () => handleToggle('labels'),
      '⌘K': () => setCommandPaletteOpen(true),
    }),
    [handleToggle],
  ),
);
```

4. Replace the `<LayerControls ... />` block (lines 165–183) with:
```tsx
{/* Mode tabs — floating center top */}
<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-card p-0.5 flex gap-0.5 rounded-lg">
  {(['live', 'scenario', 'timeline'] as const).map((mode) => (
    <button
      key={mode}
      onClick={() => onModeChange(mode)}
      className={`px-3 py-1.5 rounded-md transition-all duration-200 font-mono text-[9px] uppercase tracking-widest ${
        mapMode === mode
          ? 'text-text-primary bg-border-hover'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {mode}
    </button>
  ))}
</div>

<MapToolbar
  layers={layers}
  onToggle={handleToggle}
  stationsVisible={stationsVisible}
  onStationsToggle={() => setStationsVisible((v) => !v)}
  visibleBrands={visibleBrands}
  onBrandToggle={(brand: string) => {
    setVisibleBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }}
  selectedRegion={selectedRegion}
  onRegionChange={setSelectedRegion}
  onCommandPalette={() => setCommandPaletteOpen(true)}
/>

<CommandPalette
  open={commandPaletteOpen}
  onClose={() => setCommandPaletteOpen(false)}
  onToggleLayer={(layer) => {
    if (layer === 'stations') setStationsVisible((v) => !v);
    else handleToggle(layer);
  }}
/>
```

- [ ] **Step 2:** Run `pnpm build` — verify clean

- [ ] **Step 3:** Visual verify with `preview_start` — icon strip renders on left, mode tabs centered top, ⌘K opens palette, shortcut keys toggle layers

- [ ] **Step 4:** Commit: `git add src/components/map/IntelMap.tsx && git commit -m "integrate map toolbar, command palette, and keyboard shortcuts into IntelMap"`

---

## Phase 1 Build Gate

- [ ] Run `pnpm build` — entire project must compile clean
- [ ] Commit: `"phase 1 complete: map controls overhaul"`

---

## Phase 2: Intelligence Layer

### Task 5: Price Alert System

**Files:**
- Create: `src/hooks/useAlerts.ts`
- Create: `src/components/alerts/AlertBell.tsx`
- Create: `src/components/alerts/AlertDrawer.tsx`
- Create: `src/components/alerts/AlertRuleModal.tsx`
- Modify: `src/types/index.ts` (add AlertRule, AlertNotification types)
- Modify: `src/components/layout/Header.tsx` (add AlertBell)

**Context:** The `usePrices` hook (48 lines in `src/hooks/usePrices.ts`) polls `/api/prices` every 5 minutes and returns `prices: PriceBenchmark[]`. Each `PriceBenchmark` has `id`, `name`, `value`, `previousWeek`, `unit`, `tooltip`. Alert rules are checked against these values after each poll. The Header component (144 lines) has a right section with LIVE badge + date.

- [ ] **Step 1:** Add types to `src/types/index.ts` — append after line 91:

```typescript

export interface AlertRule {
  id: string;
  benchmarkId: string;
  direction: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  benchmarkId: string;
  benchmarkName: string;
  value: number;
  threshold: number;
  direction: 'above' | 'below';
  timestamp: string;
  read: boolean;
}
```

- [ ] **Step 2:** Create `src/hooks/useAlerts.ts`

```typescript
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PriceBenchmark, AlertRule, AlertNotification } from '@/types';

const RULES_KEY = 'oil-intel-alert-rules';
const HISTORY_KEY = 'oil-intel-alert-history';
const MAX_HISTORY = 50;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function loadRules(): AlertRule[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RULES_KEY) ?? '[]');
  } catch { return []; }
}

function loadHistory(): AlertNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch { return []; }
}

export function useAlerts() {
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [history, setHistory] = useState<AlertNotification[]>(loadHistory);
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const saveRules = useCallback((updated: AlertRule[]) => {
    setRules(updated);
    localStorage.setItem(RULES_KEY, JSON.stringify(updated));
  }, []);

  const saveHistory = useCallback((updated: AlertNotification[]) => {
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, []);

  const addRule = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt' | 'enabled'>) => {
    // Request notification permission on first rule
    if (typeof Notification !== 'undefined' && permissionRef.current === 'default') {
      Notification.requestPermission().then((p) => { permissionRef.current = p; });
    }
    const newRule: AlertRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    saveRules([...rules, newRule]);
  }, [rules, saveRules]);

  const removeRule = useCallback((id: string) => {
    saveRules(rules.filter((r) => r.id !== id));
  }, [rules, saveRules]);

  const toggleRule = useCallback((id: string) => {
    saveRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [rules, saveRules]);

  const checkPrices = useCallback((prices: PriceBenchmark[]) => {
    const now = Date.now();
    const newNotifications: AlertNotification[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Cooldown check
      if (rule.lastTriggeredAt && now - new Date(rule.lastTriggeredAt).getTime() < COOLDOWN_MS) continue;

      const benchmark = prices.find((p) => p.id === rule.benchmarkId);
      if (!benchmark) continue;

      const triggered =
        (rule.direction === 'above' && benchmark.value >= rule.threshold) ||
        (rule.direction === 'below' && benchmark.value <= rule.threshold);

      if (triggered) {
        const notification: AlertNotification = {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          benchmarkId: rule.benchmarkId,
          benchmarkName: benchmark.name,
          value: benchmark.value,
          threshold: rule.threshold,
          direction: rule.direction,
          timestamp: new Date().toISOString(),
          read: false,
        };
        newNotifications.push(notification);

        // Update rule's lastTriggeredAt
        rule.lastTriggeredAt = notification.timestamp;

        // Browser notification
        if (typeof Notification !== 'undefined' && permissionRef.current === 'granted') {
          new Notification('Price Alert', {
            body: `${benchmark.name} is ${rule.direction} ${rule.threshold} ${benchmark.unit} (now: ${benchmark.value})`,
            icon: '/favicon.ico',
          });
        }
      }
    }

    if (newNotifications.length > 0) {
      saveRules([...rules]); // persist lastTriggeredAt updates
      const updated = [...newNotifications, ...history].slice(0, MAX_HISTORY);
      saveHistory(updated);
    }
  }, [rules, history, saveRules, saveHistory]);

  const markRead = useCallback((id: string) => {
    saveHistory(history.map((n) => n.id === id ? { ...n, read: true } : n));
  }, [history, saveHistory]);

  const markAllRead = useCallback(() => {
    saveHistory(history.map((n) => ({ ...n, read: true })));
  }, [history, saveHistory]);

  const unreadCount = history.filter((n) => !n.read).length;

  return { rules, history, unreadCount, addRule, removeRule, toggleRule, checkPrices, markRead, markAllRead };
}
```

- [ ] **Step 3:** Create `src/components/alerts/AlertBell.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import AlertDrawer from './AlertDrawer';
import AlertRuleModal from './AlertRuleModal';

export function AlertBell() {
  const alerts = useAlerts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="relative p-1.5 rounded-md hover:bg-surface-hover transition-colors"
        title="Price alerts"
      >
        <span className="text-sm">🔔</span>
        {alerts.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-mono flex items-center justify-center">
            {alerts.unreadCount > 9 ? '9+' : alerts.unreadCount}
          </span>
        )}
      </button>

      <AlertDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        alerts={alerts}
        onAddRule={() => { setDrawerOpen(false); setModalOpen(true); }}
      />

      <AlertRuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(rule) => {
          alerts.addRule(rule);
          setModalOpen(false);
        }}
      />
    </>
  );
}
```

- [ ] **Step 4:** Create `src/components/alerts/AlertDrawer.tsx`

```typescript
'use client';

import type { useAlerts } from '@/hooks/useAlerts';

interface AlertDrawerProps {
  open: boolean;
  onClose: () => void;
  alerts: ReturnType<typeof useAlerts>;
  onAddRule: () => void;
}

export default function AlertDrawer({ open, onClose, alerts, onAddRule }: AlertDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-[360px] glass-card border-l border-border-subtle overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-card/90 backdrop-blur">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-primary">
            Alerts ({alerts.unreadCount} new)
          </h3>
          <div className="flex items-center gap-2">
            {alerts.unreadCount > 0 && (
              <button
                onClick={alerts.markAllRead}
                className="text-[9px] font-mono text-text-dim hover:text-text-secondary"
              >
                Mark all read
              </button>
            )}
            <button onClick={onAddRule} className="px-2 py-1 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
              + Rule
            </button>
            <button onClick={onClose} className="text-text-dim hover:text-text-secondary">✕</button>
          </div>
        </div>

        {/* Active rules */}
        {alerts.rules.length > 0 && (
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Active Rules</p>
            {alerts.rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between py-1.5">
                <span className="text-[10px] font-mono text-text-secondary">
                  {rule.benchmarkId} {rule.direction} {rule.threshold}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => alerts.toggleRule(rule.id)}
                    className={`text-[9px] font-mono ${rule.enabled ? 'text-emerald-400' : 'text-text-dim'}`}
                  >
                    {rule.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => alerts.removeRule(rule.id)}
                    className="text-[9px] text-text-dim hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notification history */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">History</p>
          {alerts.history.length === 0 ? (
            <p className="text-[10px] font-mono text-text-dim py-4 text-center">No alerts yet</p>
          ) : (
            alerts.history.map((n) => (
              <div
                key={n.id}
                onClick={() => alerts.markRead(n.id)}
                className={`py-2 border-b border-border cursor-pointer transition-colors hover:bg-surface-hover ${
                  n.read ? 'opacity-50' : ''
                }`}
              >
                <p className="text-[10px] font-mono text-text-primary">
                  {n.benchmarkName} {n.direction === 'above' ? '↑' : '↓'} {n.threshold}
                </p>
                <p className="text-[9px] font-mono text-text-dim">
                  Value: {n.value} · {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5:** Create `src/components/alerts/AlertRuleModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { priceBenchmarks } from '@/data/prices';
import type { AlertRule } from '@/types';

interface AlertRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'enabled'>) => void;
}

export default function AlertRuleModal({ open, onClose, onSave }: AlertRuleModalProps) {
  const [benchmarkId, setBenchmarkId] = useState(priceBenchmarks[0]?.id ?? '');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState(100);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-primary mb-4">
          New Alert Rule
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Benchmark
            </label>
            <select
              value={benchmarkId}
              onChange={(e) => setBenchmarkId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-border border border-border-hover text-sm font-mono text-text-primary outline-none"
            >
              {priceBenchmarks.map((b) => (
                <option key={b.id} value={b.id} className="bg-bg-card">{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Direction
            </label>
            <div className="flex gap-2">
              {(['above', 'below'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    direction === d ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-border text-text-muted'
                  }`}
                >
                  {d === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-border border border-border-hover text-sm font-mono text-text-primary outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-border text-text-muted hover:bg-border-subtle">
            Cancel
          </button>
          <button
            onClick={() => onSave({ benchmarkId, direction, threshold })}
            className="flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6:** Add AlertBell to Header. In `src/components/layout/Header.tsx`:
- Add import: `import { AlertBell } from '@/components/alerts/AlertBell';`
- Insert `<AlertBell />` before the LIVE badge span (line 96), inside the right div (line 95):
```tsx
<div className="flex items-center gap-3">
  <AlertBell />
  <span className={`inline-flex ...`}>
```

- [ ] **Step 7:** Run `pnpm build` — verify clean

- [ ] **Step 8:** Commit: `git add src/types/index.ts src/hooks/useAlerts.ts src/components/alerts/ src/components/layout/Header.tsx && git commit -m "add price alert system with browser notifications and localStorage persistence"`

---

### Task 6: Scenario Comparison

**Files:**
- Create: `src/hooks/useScenarios.ts`
- Create: `src/components/scenarios/ScenarioSlots.tsx`
- Create: `src/components/scenarios/ScenarioCompare.tsx`
- Modify: `src/components/scenarios/ScenarioPlanner.tsx`

**Context:** `ScenarioPlanner.tsx` (195 lines) manages `ScenarioParams` via props. It calculates pump prices via `calculatePumpPrice(params)` from `src/lib/scenario-engine.ts`. The `ResultPanel` shows gasoline/diesel prices and risk level. We add save/load functionality with localStorage and a comparison view.

- [ ] **Step 1:** Add `SavedScenario` type to `src/types/index.ts` — append:

```typescript

export interface SavedScenario {
  id: string;
  name: string;
  params: ScenarioParams;
  derived: {
    gasoline: number;
    diesel: number;
    riskLevel: RiskLevel;
  };
  savedAt: string;
}
```

- [ ] **Step 2:** Create `src/hooks/useScenarios.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { SavedScenario, ScenarioParams, RiskLevel } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

const STORAGE_KEY = 'oil-intel-scenarios';
const MAX_SCENARIOS = 5;

function loadScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);

  const save = useCallback((updated: SavedScenario[]) => {
    setScenarios(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const saveScenario = useCallback((name: string, params: ScenarioParams) => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const result = calculatePumpPrice(params);
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      name,
      params,
      derived: { gasoline: result.gasoline, diesel: result.diesel, riskLevel: result.riskLevel },
      savedAt: new Date().toISOString(),
    };
    save([...scenarios, scenario]);
  }, [scenarios, save]);

  const removeScenario = useCallback((id: string) => {
    save(scenarios.filter((s) => s.id !== id));
  }, [scenarios, save]);

  return { scenarios, saveScenario, removeScenario };
}
```

- [ ] **Step 3:** Create `src/components/scenarios/ScenarioSlots.tsx`

```typescript
'use client';

import { useState } from 'react';
import type { ScenarioParams, SavedScenario } from '@/types';

interface ScenarioSlotsProps {
  scenarios: SavedScenario[];
  onLoad: (params: ScenarioParams) => void;
  onRemove: (id: string) => void;
  onSave: (name: string) => void;
  disabled?: boolean;
}

export function ScenarioSlots({ scenarios, onLoad, onRemove, onSave, disabled }: ScenarioSlotsProps) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      setNaming(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {scenarios.map((s) => (
        <button
          key={s.id}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => onLoad(s.params)}
        >
          {s.name}
          <span
            onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
            className="text-text-dim hover:text-red-400 cursor-pointer"
          >
            ✕
          </span>
        </button>
      ))}

      {!disabled && scenarios.length < 5 && !naming && (
        <button
          onClick={() => setNaming(true)}
          className="px-2.5 py-1 rounded-full border border-dashed border-border-hover text-[10px] font-mono text-text-dim hover:text-text-secondary hover:border-border transition-colors"
        >
          + Save Current
        </button>
      )}

      {naming && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Scenario name"
            className="px-2 py-1 rounded-md bg-border text-[10px] font-mono text-text-primary outline-none w-32"
            autoFocus
          />
          <button onClick={handleSave} className="text-[10px] text-emerald-400">✓</button>
          <button onClick={() => setNaming(false)} className="text-[10px] text-text-dim">✕</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4:** Create `src/components/scenarios/ScenarioCompare.tsx`

```typescript
'use client';

import type { SavedScenario } from '@/types';

interface ScenarioCompareProps {
  scenarios: SavedScenario[];
}

function getRiskColor(level: string) {
  if (level === 'red') return 'text-red-400';
  if (level === 'yellow') return 'text-yellow-400';
  return 'text-emerald-400';
}

export function ScenarioCompare({ scenarios }: ScenarioCompareProps) {
  if (scenarios.length < 2) return null;

  return (
    <div className="glass-card p-5 mt-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">
        Scenario Comparison
      </h3>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scenarios.length}, 1fr)` }}>
        {scenarios.map((s) => (
          <div key={s.id} className="space-y-3">
            <p className="font-mono text-xs text-text-primary font-semibold truncate">{s.name}</p>

            <div className="space-y-2">
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Brent</p>
                <p className="text-sm font-mono text-text-primary">${s.params.brentPrice}/bbl</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Hormuz</p>
                <p className="text-sm font-mono text-text-primary">{s.params.hormuzWeeks}w</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">PHP/USD</p>
                <p className="text-sm font-mono text-text-primary">₱{s.params.forexRate.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Refinery</p>
                <p className="text-sm font-mono text-text-primary">{s.params.refineryOffline ? 'Offline' : 'Online'}</p>
              </div>

              <div className="h-px bg-border-subtle" />

              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Gasoline</p>
                <p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.gasoline.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Diesel</p>
                <p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.diesel.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Risk</p>
                <p className={`text-sm font-mono font-bold uppercase ${getRiskColor(s.derived.riskLevel)}`}>
                  {s.derived.riskLevel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5:** Modify `src/components/scenarios/ScenarioPlanner.tsx` — add ScenarioSlots and Compare:

1. Add imports at top:
```typescript
import { useScenarios } from '@/hooks/useScenarios';
import { ScenarioSlots } from './ScenarioSlots';
import { ScenarioCompare } from './ScenarioCompare';
```

2. Inside the component, after `const result = useMemo(...)`:
```typescript
const { scenarios, saveScenario, removeScenario } = useScenarios();
```

3. Add ScenarioSlots below the subtitle `<p>` tag (after line 70):
```tsx
<ScenarioSlots
  scenarios={scenarios}
  onLoad={onParamsChange}
  onRemove={removeScenario}
  onSave={(name) => saveScenario(name, params)}
  disabled={isTimelineDriven}
/>
```

4. Add ScenarioCompare after the closing `</div>` of the grid (after line 191):
```tsx
<ScenarioCompare scenarios={scenarios} />
```

- [ ] **Step 6:** Run `pnpm build` — verify clean

- [ ] **Step 7:** Commit: `git add src/types/index.ts src/hooks/useScenarios.ts src/components/scenarios/ && git commit -m "add scenario save, load, and side-by-side comparison"`

---

### Task 7: Consumer Impact Calculator

**Files:**
- Create: `src/lib/consumer-models.ts`
- Create: `src/components/consumer/ImpactCalculator.tsx`
- Create: `src/components/consumer/PersonaCard.tsx`
- Create: `src/components/consumer/ImpactResult.tsx`

**Context:** The existing `ImpactCards.tsx` (91 lines) does rough impact estimation using `deriveImpacts()` based on `scenarioParams`. The Consumer Impact Calculator is a separate section that provides more detailed, persona-based calculations using actual fuel consumption data.

- [ ] **Step 1:** Create `src/lib/consumer-models.ts`

```typescript
import type { ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

export interface ConsumerPersona {
  id: string;
  icon: string;
  label: string;
  description: string;
  monthlyBaseline: number;
  fuelType: 'gasoline' | 'diesel';
  dailyLiters: number;
  workDaysPerMonth: number;
  incomeEstimate: number;
}

export interface ImpactResultData {
  monthlyCostDelta: number;
  percentOfIncome: number;
  painIndex: number;
  monthlyLiters: number;
  newMonthlyTotal: number;
}

export const PERSONAS: ConsumerPersona[] = [
  {
    id: 'jeepney',
    icon: '🚐',
    label: 'Jeepney Driver',
    description: 'Public utility vehicle, daily operations in Metro Manila',
    monthlyBaseline: 7800,
    fuelType: 'diesel',
    dailyLiters: 15,
    workDaysPerMonth: 26,
    incomeEstimate: 18000,
  },
  {
    id: 'household',
    icon: '🏠',
    label: 'Household',
    description: 'Family of 4, 1 vehicle, monthly LPG for cooking',
    monthlyBaseline: 6400,
    fuelType: 'gasoline',
    dailyLiters: 4,
    workDaysPerMonth: 30,
    incomeEstimate: 45000,
  },
  {
    id: 'sme',
    icon: '🏪',
    label: 'SME Owner',
    description: 'Small business with 3 delivery vehicles + generator',
    monthlyBaseline: 24000,
    fuelType: 'diesel',
    dailyLiters: 30,
    workDaysPerMonth: 26,
    incomeEstimate: 80000,
  },
  {
    id: 'fleet',
    icon: '🚛',
    label: 'Logistics Fleet',
    description: '20-truck fleet, bulk diesel purchasing, nationwide routes',
    monthlyBaseline: 480000,
    fuelType: 'diesel',
    dailyLiters: 600,
    workDaysPerMonth: 26,
    incomeEstimate: 2000000,
  },
];

const BASELINE_PUMP_GASOLINE = 65;
const BASELINE_PUMP_DIESEL = 59;

export function calculateImpact(
  persona: ConsumerPersona,
  scenarioParams: ScenarioParams,
): ImpactResultData {
  const result = calculatePumpPrice(scenarioParams);
  const currentPrice = persona.fuelType === 'gasoline' ? result.gasoline : result.diesel;
  const baselinePrice = persona.fuelType === 'gasoline' ? BASELINE_PUMP_GASOLINE : BASELINE_PUMP_DIESEL;

  const priceDelta = currentPrice - baselinePrice;
  const monthlyLiters = persona.dailyLiters * persona.workDaysPerMonth;
  const monthlyCostDelta = monthlyLiters * priceDelta;
  const percentOfIncome = (monthlyCostDelta / persona.incomeEstimate) * 100;
  const painIndex = Math.min(10, Math.max(1, Math.round(Math.abs(percentOfIncome) * 2)));

  return {
    monthlyCostDelta: Math.round(monthlyCostDelta),
    percentOfIncome: Math.round(percentOfIncome * 10) / 10,
    painIndex,
    monthlyLiters,
    newMonthlyTotal: Math.round(persona.monthlyBaseline + monthlyCostDelta),
  };
}
```

- [ ] **Step 2:** Create `src/components/consumer/PersonaCard.tsx`

```typescript
'use client';

import type { ConsumerPersona } from '@/lib/consumer-models';
import type { ImpactResultData } from '@/lib/consumer-models';

interface PersonaCardProps {
  persona: ConsumerPersona;
  impact: ImpactResultData;
  selected: boolean;
  onClick: () => void;
}

function getPainColor(index: number): string {
  if (index <= 3) return 'bg-emerald-500';
  if (index <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function PersonaCard({ persona, impact, selected, onClick }: PersonaCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left glass-card card-interactive p-4 transition-all ${
        selected ? 'border-blue-500/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{persona.icon}</span>
        <div>
          <p className="text-xs font-mono text-text-primary font-semibold">{persona.label}</p>
          <p className="text-[9px] font-sans text-text-dim">{persona.description}</p>
        </div>
      </div>

      {/* Key metric */}
      <div className="mt-3">
        <p className={`text-xl font-mono font-bold ${impact.monthlyCostDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {impact.monthlyCostDelta > 0 ? '+' : ''}₱{Math.abs(impact.monthlyCostDelta).toLocaleString()}
        </p>
        <p className="text-[9px] font-mono text-text-dim">per month</p>
      </div>

      {/* Pain index */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getPainColor(impact.painIndex)}`}
            style={{ width: `${impact.painIndex * 10}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-text-dim">{impact.painIndex}/10</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3:** Create `src/components/consumer/ImpactResult.tsx`

```typescript
'use client';

import type { ConsumerPersona, ImpactResultData } from '@/lib/consumer-models';

interface ImpactResultProps {
  persona: ConsumerPersona;
  impact: ImpactResultData;
}

export function ImpactResult({ persona, impact }: ImpactResultProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{persona.icon}</span>
        <div>
          <p className="text-sm font-mono text-text-primary font-semibold">{persona.label}</p>
          <p className="text-[10px] font-sans text-text-secondary">{persona.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Monthly Delta</p>
          <p className={`text-2xl font-mono font-bold ${impact.monthlyCostDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {impact.monthlyCostDelta > 0 ? '+' : ''}₱{Math.abs(impact.monthlyCostDelta).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">% of Income</p>
          <p className={`text-2xl font-mono font-bold ${impact.percentOfIncome > 5 ? 'text-red-400' : impact.percentOfIncome > 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {impact.percentOfIncome > 0 ? '+' : ''}{impact.percentOfIncome}%
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">New Monthly Cost</p>
          <p className="text-lg font-mono font-bold text-text-primary">₱{impact.newMonthlyTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Monthly Liters</p>
          <p className="text-lg font-mono font-bold text-text-primary">{impact.monthlyLiters}L</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4:** Create `src/components/consumer/ImpactCalculator.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import type { ScenarioParams } from '@/types';
import { PERSONAS, calculateImpact } from '@/lib/consumer-models';
import { PersonaCard } from './PersonaCard';
import { ImpactResult } from './ImpactResult';

interface ImpactCalculatorProps {
  scenarioParams: ScenarioParams;
}

export function ImpactCalculator({ scenarioParams }: ImpactCalculatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const impacts = useMemo(
    () => PERSONAS.map((p) => ({ persona: p, impact: calculateImpact(p, scenarioParams) })),
    [scenarioParams],
  );

  const selected = impacts.find((i) => i.persona.id === selectedId);

  return (
    <div>
      <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
        How Does This Affect You?
      </h2>
      <p className="text-xs font-sans text-text-label mt-1 mb-4">
        Select a persona to see personalized fuel cost impact
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {impacts.map(({ persona, impact }) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            impact={impact}
            selected={selectedId === persona.id}
            onClick={() => setSelectedId(selectedId === persona.id ? null : persona.id)}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-4">
          <ImpactResult persona={selected.persona} impact={selected.impact} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5:** Run `pnpm build` — verify clean

- [ ] **Step 6:** Commit: `git add src/lib/consumer-models.ts src/components/consumer/ && git commit -m "add consumer impact calculator with 4 persona models"`

---

### Task 8: Regional Drill-Down

**Files:**
- Create: `src/lib/region-analytics.ts`
- Create: `src/components/map/RegionPanel.tsx`

**Context:** Region data exists in `src/data/regions.ts` (59 lines) with 17 regions defined as bounding boxes. Station data (10,469 stations) is loaded via `ALL_STATIONS` from `src/data/stations/index.ts`. Facilities exist in `src/data/facilities.ts`. The RegionPanel shows analytics computed from this static data — no new API calls needed.

**Note:** The deck.gl GeoJsonLayer for clickable region polygons (`RegionLayer.ts`) and the `regions-geo.json` GeoJSON file require significantly more data preparation work. For this implementation phase, we focus on the RegionPanel as a sidebar that is triggered by clicking a region name in the existing dropdown or the command palette. The full map polygon overlay is deferred to a follow-up task.

- [ ] **Step 1:** Create `src/lib/region-analytics.ts`

```typescript
import { ALL_STATIONS } from '@/data/stations';
import { FACILITIES } from '@/data/facilities';
import type { Facility } from '@/types';

export interface RegionAnalytics {
  regionName: string;
  stationCount: number;
  brandBreakdown: { brand: string; count: number; color: string }[];
  nearestTerminal: { name: string; distanceKm: number } | null;
  nearestDepot: { name: string; distanceKm: number } | null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest(
  centerLat: number,
  centerLng: number,
  facilities: Facility[],
  type: string,
): { name: string; distanceKm: number } | null {
  const filtered = facilities.filter((f) => f.type === type);
  if (filtered.length === 0) return null;

  let nearest = filtered[0];
  let minDist = haversineKm(centerLat, centerLng, nearest.coordinates[0], nearest.coordinates[1]);

  for (let i = 1; i < filtered.length; i++) {
    const d = haversineKm(centerLat, centerLng, filtered[i].coordinates[0], filtered[i].coordinates[1]);
    if (d < minDist) {
      minDist = d;
      nearest = filtered[i];
    }
  }

  return { name: nearest.name, distanceKm: Math.round(minDist) };
}

const BRAND_COLORS: Record<string, string> = {
  Petron: '#3b82f6',
  Shell: '#facc15',
  Caltex: '#ef4444',
  Phoenix: '#f97316',
  Seaoil: '#8b5cf6',
  Jetti: '#06b6d4',
  Other: '#6b7280',
};

export function computeRegionAnalytics(regionName: string): RegionAnalytics {
  const stations = ALL_STATIONS.filter((s) => s.region === regionName);

  // Brand breakdown
  const brandCounts = new Map<string, number>();
  for (const s of stations) {
    brandCounts.set(s.brand, (brandCounts.get(s.brand) ?? 0) + 1);
  }
  const brandBreakdown = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count, color: BRAND_COLORS[brand] ?? BRAND_COLORS.Other }))
    .sort((a, b) => b.count - a.count);

  // Region center (average of station coordinates)
  let centerLat = 12, centerLng = 122; // fallback to PH center
  if (stations.length > 0) {
    centerLat = stations.reduce((s, st) => s + st.coordinates[0], 0) / stations.length;
    centerLng = stations.reduce((s, st) => s + st.coordinates[1], 0) / stations.length;
  }

  return {
    regionName,
    stationCount: stations.length,
    brandBreakdown,
    nearestTerminal: findNearest(centerLat, centerLng, FACILITIES, 'terminal'),
    nearestDepot: findNearest(centerLat, centerLng, FACILITIES, 'depot'),
  };
}
```

- [ ] **Step 2:** Create `src/components/map/RegionPanel.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { computeRegionAnalytics } from '@/lib/region-analytics';

interface RegionPanelProps {
  region: string;
  onClose: () => void;
}

export default function RegionPanel({ region, onClose }: RegionPanelProps) {
  const analytics = useMemo(() => computeRegionAnalytics(region), [region]);
  const maxBrandCount = analytics.brandBreakdown[0]?.count ?? 1;

  return (
    <div className="absolute right-4 top-4 bottom-4 z-50 w-[320px] glass-card overflow-y-auto">
      <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-card/90 backdrop-blur">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Regional Intelligence</p>
          <p className="font-mono text-sm text-text-primary font-semibold mt-0.5">{analytics.regionName}</p>
        </div>
        <button onClick={onClose} className="text-text-dim hover:text-text-secondary">✕</button>
      </div>

      <div className="p-4 space-y-5">
        {/* Station count */}
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1">Total Stations</p>
          <p className="text-3xl font-mono font-bold text-text-primary">{analytics.stationCount.toLocaleString()}</p>
        </div>

        {/* Brand breakdown — horizontal stacked bar */}
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Brand Breakdown</p>
          <div className="space-y-1.5">
            {analytics.brandBreakdown.slice(0, 7).map(({ brand, count, color }) => (
              <div key={brand} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-text-secondary w-16 truncate">{brand}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxBrandCount) * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[9px] font-mono text-text-dim w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest infrastructure */}
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Nearest Infrastructure</p>
          <div className="space-y-2">
            {analytics.nearestTerminal && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-text-secondary">{analytics.nearestTerminal.name}</span>
                </div>
                <span className="text-[10px] font-mono text-text-dim">{analytics.nearestTerminal.distanceKm} km</span>
              </div>
            )}
            {analytics.nearestDepot && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-mono text-text-secondary">{analytics.nearestDepot.name}</span>
                </div>
                <span className="text-[10px] font-mono text-text-dim">{analytics.nearestDepot.distanceKm} km</span>
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-border text-[10px] font-mono text-text-secondary hover:bg-border-subtle transition-colors uppercase tracking-widest"
        >
          ← Back to National View
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3:** Run `pnpm build` — verify clean. If `ALL_STATIONS` or `FACILITIES` imports fail, check the actual exports from those files and adjust imports.

- [ ] **Step 4:** Commit: `git add src/lib/region-analytics.ts src/components/map/RegionPanel.tsx && git commit -m "add regional drill-down panel with station analytics and infrastructure proximity"`

---

## Phase 2 Build Gate + Integration

### Task 9: Wire Phase 2 into page.tsx and IntelMap

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/map/IntelMap.tsx`

- [ ] **Step 1:** Add imports to `src/app/page.tsx`:

```typescript
import { ImpactCalculator } from '@/components/consumer/ImpactCalculator';
```

Add after the ScenarioPlanner section (after line 124):

```tsx
{/* Consumer Impact Calculator */}
<section>
  <SectionHeader color="bg-phoenix" label="Consumer Impact" />
  <ImpactCalculator scenarioParams={scenarioParams} />
</section>
```

- [ ] **Step 2:** Add RegionPanel to `src/components/map/IntelMap.tsx`:

Add import:
```typescript
import RegionPanel from './RegionPanel';
```

Add RegionPanel rendering (after the StationTooltip block, before the closing `</div>`):
```tsx
{selectedRegion && (
  <RegionPanel
    region={selectedRegion}
    onClose={() => setSelectedRegion(null)}
  />
)}
```

- [ ] **Step 3:** Run `pnpm build` — verify clean

- [ ] **Step 4:** Commit: `git add src/app/page.tsx src/components/map/IntelMap.tsx && git commit -m "integrate consumer impact calculator and regional drill-down panel"`

---

## Phase 3: Advanced Analysis

### Task 10: Monte Carlo Stress Test

**Files:**
- Create: `src/lib/monte-carlo.ts`
- Create: `src/components/scenarios/StressTest.tsx`
- Create: `src/components/scenarios/ConfidenceFan.tsx`
- Create: `src/components/ui/Disclaimer.tsx`
- Modify: `src/types/index.ts`

**Context:** The Monte Carlo simulation runs client-side. Due to Next.js bundling complexity with Web Workers, we use a synchronous implementation wrapped in `requestIdleCallback`/`setTimeout` rather than a true Web Worker. This avoids webpack worker-loader configuration. The simulation runs 1,000 iterations of the `calculatePumpPrice` model with randomized inputs.

- [ ] **Step 1:** Add Monte Carlo types to `src/types/index.ts`:

```typescript

export interface MonteCarloResult {
  runs: number;
  pumpGasoline: { p10: number; p25: number; p50: number; p75: number; p90: number };
  pumpDiesel: { p10: number; p25: number; p50: number; p75: number; p90: number };
  probabilityAbove: { threshold: number; gasoline: number; diesel: number }[];
  computeTimeMs: number;
}
```

- [ ] **Step 2:** Create `src/lib/monte-carlo.ts`

```typescript
import { calculatePumpPrice } from '@/lib/scenario-engine';
import type { ScenarioParams, MonteCarloResult } from '@/types';

function normalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function bernoulli(p: number): boolean {
  return Math.random() < p;
}

function uniformRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function percentile(sorted: number[], p: number): number {
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function runMonteCarlo(
  baseParams: ScenarioParams,
  runs: number = 1000,
): MonteCarloResult {
  const start = performance.now();
  const gasolineResults: number[] = [];
  const dieselResults: number[] = [];

  // Determine if typhoon season (Jun-Nov)
  const month = new Date().getMonth();
  const isTyphoonSeason = month >= 5 && month <= 10;

  for (let i = 0; i < runs; i++) {
    // Sample input distributions
    const brentPrice = Math.max(40, normalRandom(baseParams.brentPrice, baseParams.brentPrice * 0.15));
    const forexRate = Math.max(50, normalRandom(baseParams.forexRate, baseParams.forexRate * 0.05));
    const hormuzDisrupted = bernoulli(0.15);
    const hormuzWeeks = hormuzDisrupted ? Math.round(uniformRandom(1, 16)) : 0;
    const refineryOffline = bernoulli(isTyphoonSeason ? 0.15 : 0.05);

    const params: ScenarioParams = { brentPrice, hormuzWeeks, forexRate, refineryOffline };
    const result = calculatePumpPrice(params);

    gasolineResults.push(result.gasoline);
    dieselResults.push(result.diesel);
  }

  gasolineResults.sort((a, b) => a - b);
  dieselResults.sort((a, b) => a - b);

  // Probability thresholds
  const thresholds = [70, 75, 80, 85, 90, 95, 100];
  const probabilityAbove = thresholds.map((t) => ({
    threshold: t,
    gasoline: Math.round((gasolineResults.filter((v) => v > t).length / runs) * 100),
    diesel: Math.round((dieselResults.filter((v) => v > t).length / runs) * 100),
  }));

  return {
    runs,
    pumpGasoline: {
      p10: Math.round(percentile(gasolineResults, 10) * 100) / 100,
      p25: Math.round(percentile(gasolineResults, 25) * 100) / 100,
      p50: Math.round(percentile(gasolineResults, 50) * 100) / 100,
      p75: Math.round(percentile(gasolineResults, 75) * 100) / 100,
      p90: Math.round(percentile(gasolineResults, 90) * 100) / 100,
    },
    pumpDiesel: {
      p10: Math.round(percentile(dieselResults, 10) * 100) / 100,
      p25: Math.round(percentile(dieselResults, 25) * 100) / 100,
      p50: Math.round(percentile(dieselResults, 50) * 100) / 100,
      p75: Math.round(percentile(dieselResults, 75) * 100) / 100,
      p90: Math.round(percentile(dieselResults, 90) * 100) / 100,
    },
    probabilityAbove,
    computeTimeMs: Math.round(performance.now() - start),
  };
}
```

- [ ] **Step 3:** Create `src/components/ui/Disclaimer.tsx`

```typescript
'use client';

import { useState } from 'react';

interface DisclaimerProps {
  showRoadmap?: boolean;
}

export function Disclaimer({ showRoadmap = true }: DisclaimerProps) {
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  return (
    <div className="glass-card disclaimer-card p-4">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500 mb-1">
            Simulation Disclaimer
          </p>
          <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
            These projections use simplified Monte Carlo modeling with assumed probability distributions.
            They are for educational and discussion purposes only — not investment, policy, or operational advice.
            Real-world outcomes depend on factors not captured in this model including geopolitical events,
            weather, regulatory changes, and market speculation.
          </p>

          {showRoadmap && (
            <div className="mt-3">
              <button
                onClick={() => setRoadmapOpen(!roadmapOpen)}
                className="text-[10px] font-mono text-text-dim hover:text-text-secondary"
              >
                {roadmapOpen ? '▼' : '▶'} Phase C Roadmap: Backend Simulation Engine
              </button>
              <div className={`accordion-content ${roadmapOpen ? 'open' : ''}`}>
                <div className="accordion-inner">
                  <ul className="mt-2 space-y-1 text-[10px] font-mono text-text-dim list-disc list-inside">
                    <li>Historical correlation matrices (vs assumed distributions)</li>
                    <li>10,000+ server-side runs (vs 1,000 client-side)</li>
                    <li>Back-testing against actual outcomes</li>
                    <li>Time-series database (Supabase)</li>
                    <li>REST API for DOE/NEDA integration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4:** Create `src/components/scenarios/ConfidenceFan.tsx`

```typescript
'use client';

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { MonteCarloResult } from '@/types';

interface ConfidenceFanProps {
  result: MonteCarloResult;
  fuelType: 'gasoline' | 'diesel';
}

export function ConfidenceFan({ result, fuelType }: ConfidenceFanProps) {
  const data = fuelType === 'gasoline' ? result.pumpGasoline : result.pumpDiesel;

  // Create a simple fan chart with 3 bands
  const chartData = [
    { name: 'P10', value: data.p10, p25: data.p25, p50: data.p50, p75: data.p75, p90: data.p90 },
  ];

  // For the fan chart, create percentile labels
  const bands = [
    { label: 'P10', value: data.p10, color: 'text-emerald-400' },
    { label: 'P25', value: data.p25, color: 'text-emerald-300' },
    { label: 'P50', value: data.p50, color: 'text-text-primary' },
    { label: 'P75', value: data.p75, color: 'text-amber-300' },
    { label: 'P90', value: data.p90, color: 'text-red-400' },
  ];

  return (
    <div>
      {/* Percentile display */}
      <div className="flex items-end justify-between gap-1">
        {bands.map(({ label, value, color }) => (
          <div key={label} className="text-center flex-1">
            <p className="text-[8px] font-mono text-text-dim uppercase">{label}</p>
            <p className={`text-sm font-mono font-bold ${color}`}>₱{value.toFixed(1)}</p>
          </div>
        ))}
      </div>

      {/* Visual range bar */}
      <div className="mt-3 relative h-6 rounded-full overflow-hidden bg-border">
        <div
          className="absolute h-full bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/20 rounded-full"
          style={{
            left: `${((data.p10 - data.p10) / (data.p90 - data.p10)) * 100}%`,
            width: '100%',
          }}
        />
        {/* P50 marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-text-primary"
          style={{ left: `${((data.p50 - data.p10) / (data.p90 - data.p10)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-text-dim">₱{data.p10}</span>
        <span className="text-[8px] font-mono text-text-secondary">median ₱{data.p50}</span>
        <span className="text-[8px] font-mono text-text-dim">₱{data.p90}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5:** Create `src/components/scenarios/StressTest.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { ScenarioParams, MonteCarloResult } from '@/types';
import { runMonteCarlo } from '@/lib/monte-carlo';
import { ConfidenceFan } from './ConfidenceFan';
import { Disclaimer } from '@/components/ui/Disclaimer';

interface StressTestProps {
  scenarioParams: ScenarioParams;
}

export function StressTest({ scenarioParams }: StressTestProps) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(80);

  const handleRun = useCallback(() => {
    setRunning(true);
    // Defer to next frame to allow UI update
    setTimeout(() => {
      const r = runMonteCarlo(scenarioParams, 1000);
      setResult(r);
      setRunning(false);
    }, 50);
  }, [scenarioParams]);

  const probEntry = result?.probabilityAbove.find((p) => p.threshold === threshold);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
            Monte Carlo Stress Test
          </h2>
          <p className="text-xs font-sans text-text-label mt-1">
            1,000 simulated scenarios with randomized inputs
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
        >
          {running ? 'Simulating...' : 'Run Stress Test'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Compute info */}
          <p className="text-[9px] font-mono text-text-dim">
            {result.runs} runs completed in {result.computeTimeMs}ms
          </p>

          {/* Confidence fans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
                Gasoline (₱/L)
              </p>
              <ConfidenceFan result={result} fuelType="gasoline" />
            </div>
            <div className="glass-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
                Diesel (₱/L)
              </p>
              <ConfidenceFan result={result} fuelType="diesel" />
            </div>
          </div>

          {/* Probability slider */}
          <div className="glass-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
              Probability gasoline exceeds ₱{threshold}/L
            </p>
            <input
              type="range"
              min={70}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
              <span>₱70</span>
              <span>₱100</span>
            </div>
            {probEntry && (
              <p className="text-lg font-mono font-bold text-text-primary mt-2">
                {probEntry.gasoline}% chance
              </p>
            )}
          </div>

          {/* Disclaimer — MANDATORY, cannot be dismissed */}
          <Disclaimer />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6:** Run `pnpm build` — verify clean

- [ ] **Step 7:** Commit: `git add src/types/index.ts src/lib/monte-carlo.ts src/components/ui/Disclaimer.tsx src/components/scenarios/ConfidenceFan.tsx src/components/scenarios/StressTest.tsx && git commit -m "add Monte Carlo stress test with confidence fan charts and mandatory disclaimer"`

---

### Task 11: Historical Playback Data + Scrubber

**Files:**
- Create: `src/data/historical-prices.json`
- Create: `src/data/historical-events.json`
- Create: `src/hooks/useHistoricalData.ts`
- Create: `src/components/timeline/TimelineScrubber.tsx`

**Context:** The existing `TimelineSlider.tsx` (in `src/components/map/`) is a simple range input that sets `timelinePosition` (0–1000). The new `TimelineScrubber` replaces it with a richer component that maps to actual dates (2022–2026) and shows event markers.

- [ ] **Step 1:** Create `src/data/historical-prices.json` — weekly snapshots. Include ~20 representative data points spanning 2022-2026:

```json
[
  {"date":"2022-01-07","brent":80.0,"phpUsd":51.0,"pumpGasoline":58.5,"pumpDiesel":52.1},
  {"date":"2022-03-11","brent":112.0,"phpUsd":52.3,"pumpGasoline":73.4,"pumpDiesel":67.0},
  {"date":"2022-06-10","brent":123.0,"phpUsd":53.5,"pumpGasoline":81.0,"pumpDiesel":74.5},
  {"date":"2022-09-09","brent":88.0,"phpUsd":57.0,"pumpGasoline":66.2,"pumpDiesel":60.1},
  {"date":"2022-12-09","brent":76.0,"phpUsd":56.0,"pumpGasoline":61.5,"pumpDiesel":55.8},
  {"date":"2023-03-10","brent":82.0,"phpUsd":55.0,"pumpGasoline":63.0,"pumpDiesel":57.2},
  {"date":"2023-06-09","brent":74.0,"phpUsd":56.2,"pumpGasoline":59.8,"pumpDiesel":54.0},
  {"date":"2023-09-08","brent":90.0,"phpUsd":56.8,"pumpGasoline":68.5,"pumpDiesel":62.1},
  {"date":"2023-12-08","brent":77.0,"phpUsd":55.5,"pumpGasoline":62.0,"pumpDiesel":56.0},
  {"date":"2024-03-08","brent":83.0,"phpUsd":56.0,"pumpGasoline":64.5,"pumpDiesel":58.3},
  {"date":"2024-06-07","brent":79.0,"phpUsd":58.5,"pumpGasoline":64.0,"pumpDiesel":57.8},
  {"date":"2024-09-06","brent":72.0,"phpUsd":56.5,"pumpGasoline":60.0,"pumpDiesel":54.5},
  {"date":"2024-12-06","brent":74.0,"phpUsd":58.0,"pumpGasoline":62.0,"pumpDiesel":56.0},
  {"date":"2025-03-07","brent":70.0,"phpUsd":57.5,"pumpGasoline":60.5,"pumpDiesel":55.0},
  {"date":"2025-06-06","brent":68.0,"phpUsd":56.8,"pumpGasoline":59.0,"pumpDiesel":53.5},
  {"date":"2025-09-05","brent":75.0,"phpUsd":57.2,"pumpGasoline":62.5,"pumpDiesel":56.5},
  {"date":"2025-12-05","brent":72.0,"phpUsd":58.0,"pumpGasoline":61.0,"pumpDiesel":55.5},
  {"date":"2026-03-06","brent":78.0,"phpUsd":58.4,"pumpGasoline":63.5,"pumpDiesel":57.5}
]
```

- [ ] **Step 2:** Create `src/data/historical-events.json`:

```json
[
  {"date":"2022-02-24","title":"Russia invades Ukraine — Brent spikes above $100","severity":"red","priceImpact":35},
  {"date":"2022-06-01","title":"PH fuel excise tax suspension takes effect","severity":"green","priceImpact":-3},
  {"date":"2022-07-15","title":"PHP hits record low ₱56.7 vs USD","severity":"yellow","priceImpact":4},
  {"date":"2023-04-02","title":"OPEC+ announces surprise production cut","severity":"red","priceImpact":8},
  {"date":"2023-10-07","title":"Israel-Hamas conflict — Strait of Hormuz fears","severity":"yellow","priceImpact":5},
  {"date":"2024-01-12","title":"Houthi Red Sea attacks disrupt tanker routes","severity":"red","priceImpact":6},
  {"date":"2024-04-14","title":"Iran-Israel direct military exchange","severity":"red","priceImpact":4},
  {"date":"2024-07-01","title":"PH fuel excise tax increase resumes","severity":"yellow","priceImpact":2},
  {"date":"2024-11-05","title":"US election outcome — energy policy shift expected","severity":"yellow","priceImpact":-3},
  {"date":"2025-01-20","title":"New US administration takes office — drill policy","severity":"green","priceImpact":-5},
  {"date":"2025-06-15","title":"Typhoon season disrupts Bataan refinery operations","severity":"yellow","priceImpact":3},
  {"date":"2026-01-15","title":"OPEC+ extends production cuts through 2026","severity":"yellow","priceImpact":4}
]
```

- [ ] **Step 3:** Create `src/hooks/useHistoricalData.ts`

```typescript
'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import historicalPrices from '@/data/historical-prices.json';
import historicalEvents from '@/data/historical-events.json';

export interface HistoricalSnapshot {
  date: string;
  brent: number;
  phpUsd: number;
  pumpGasoline: number;
  pumpDiesel: number;
}

export interface HistoricalEvent {
  date: string;
  title: string;
  severity: 'red' | 'yellow' | 'green';
  priceImpact: number;
}

export function useHistoricalData() {
  const prices = historicalPrices as HistoricalSnapshot[];
  const events = historicalEvents as HistoricalEvent[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<number>(0);

  const currentSnapshot = prices[currentIndex] ?? prices[0];
  const dateRange = { start: prices[0].date, end: prices[prices.length - 1].date };

  // Find events near current date (within 30 days)
  const nearbyEvents = useMemo(() => {
    const current = new Date(currentSnapshot.date).getTime();
    return events.filter((e) => {
      const diff = Math.abs(new Date(e.date).getTime() - current);
      return diff < 30 * 24 * 60 * 60 * 1000;
    });
  }, [currentSnapshot.date, events]);

  // Auto-play
  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= prices.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, prices.length]);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const setIndex = useCallback((i: number) => setCurrentIndex(Math.max(0, Math.min(i, prices.length - 1))), [prices.length]);

  return {
    prices,
    events,
    currentIndex,
    currentSnapshot,
    nearbyEvents,
    dateRange,
    playing,
    speed,
    togglePlay,
    setSpeed,
    setIndex,
    totalSnapshots: prices.length,
  };
}
```

- [ ] **Step 4:** Create `src/components/timeline/TimelineScrubber.tsx`

```typescript
'use client';

import { useHistoricalData } from '@/hooks/useHistoricalData';

interface TimelineScrubberProps {
  visible: boolean;
}

function severityColor(s: string): string {
  if (s === 'red') return 'bg-red-500';
  if (s === 'yellow') return 'bg-yellow-500';
  return 'bg-emerald-500';
}

export function TimelineScrubber({ visible }: TimelineScrubberProps) {
  const {
    prices,
    events,
    currentIndex,
    currentSnapshot,
    nearbyEvents,
    playing,
    speed,
    togglePlay,
    setSpeed,
    setIndex,
    totalSnapshots,
  } = useHistoricalData();

  if (!visible) return null;

  return (
    <div className="glass-card p-4 mt-4">
      {/* Header with date and controls */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Historical Playback</p>
          <p className="font-mono text-lg text-text-primary font-bold">
            {new Date(currentSnapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed control */}
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded font-mono text-[9px] ${
                speed === s ? 'bg-blue-500/20 text-blue-400' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {s}×
            </button>
          ))}

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="px-3 py-1 rounded-lg bg-border-hover text-text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-border-subtle"
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={totalSnapshots - 1}
          value={currentIndex}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full"
        />

        {/* Event markers */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none flex items-center">
          {events.map((event, i) => {
            const eventDate = new Date(event.date).getTime();
            const startDate = new Date(prices[0].date).getTime();
            const endDate = new Date(prices[prices.length - 1].date).getTime();
            const position = ((eventDate - startDate) / (endDate - startDate)) * 100;
            if (position < 0 || position > 100) return null;
            return (
              <div
                key={i}
                className={`absolute w-1.5 h-1.5 rounded-full ${severityColor(event.severity)} -translate-x-1/2`}
                style={{ left: `${position}%`, top: '-8px' }}
                title={event.title}
              />
            );
          })}
        </div>
      </div>

      {/* Date range */}
      <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
        <span>{prices[0].date}</span>
        <span>{prices[prices.length - 1].date}</span>
      </div>

      {/* Snapshot KPIs */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        {[
          { label: 'Brent', value: `$${currentSnapshot.brent}` },
          { label: 'PHP/USD', value: `₱${currentSnapshot.phpUsd}` },
          { label: 'Gasoline', value: `₱${currentSnapshot.pumpGasoline}` },
          { label: 'Diesel', value: `₱${currentSnapshot.pumpDiesel}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[8px] font-mono text-text-dim uppercase">{label}</p>
            <p className="text-sm font-mono font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Nearby events */}
      {nearbyEvents.length > 0 && (
        <div className="mt-3 space-y-1">
          {nearbyEvents.map((event, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono border-l-2 ${
              event.severity === 'red' ? 'border-l-red-500 text-red-400' :
              event.severity === 'yellow' ? 'border-l-yellow-500 text-yellow-400' :
              'border-l-emerald-500 text-emerald-400'
            }`}>
              <span className="text-text-secondary flex-1">{event.title}</span>
              <span className="text-text-dim">{event.priceImpact > 0 ? '+' : ''}{event.priceImpact}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5:** Run `pnpm build` — verify clean

- [ ] **Step 6:** Commit: `git add src/data/historical-prices.json src/data/historical-events.json src/hooks/useHistoricalData.ts src/components/timeline/TimelineScrubber.tsx && git commit -m "add historical playback with price snapshots, event markers, and timeline scrubber"`

---

## Final Integration

### Task 12: Wire Everything into page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1:** Add new imports to `page.tsx`:

```typescript
import { StressTest } from '@/components/scenarios/StressTest';
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
```

Note: `ImpactCalculator` was already added in Task 9.

- [ ] **Step 2:** Add StressTest section after ScenarioPlanner (after the Consumer Impact section):

```tsx
{/* Monte Carlo Stress Test */}
<section>
  <SectionHeader color="bg-amber-500" label="Stress Test" />
  <StressTest scenarioParams={scenarioParams} />
</section>
```

- [ ] **Step 3:** Add TimelineScrubber. Replace the existing `<TimelineSlider>` (lines 89–93) with:

```tsx
<TimelineSlider
  position={timelinePosition}
  onPositionChange={setTimelinePosition}
  visible={mapMode === 'timeline'}
/>
<TimelineScrubber visible={mapMode === 'timeline'} />
```

- [ ] **Step 4:** Run `pnpm build` — verify entire project compiles clean

- [ ] **Step 5:** Visual verify with `preview_start`:
  - Map has icon strip on left, mode tabs centered top
  - ⌘K opens command palette
  - I/S/R/L keyboard shortcuts toggle layers
  - Alert bell visible in header
  - Scenario save/load/compare works
  - Consumer impact calculator shows 4 personas
  - Regional drill-down panel opens when region selected
  - Stress test runs and shows confidence fan + disclaimer
  - Timeline scrubber shows historical data with event markers

- [ ] **Step 6:** Commit: `git add src/app/page.tsx && git commit -m "wire all v2 features into dashboard layout"`

- [ ] **Step 7:** Final commit: `git add -A && git commit -m "PH Oil Intelligence v2: map controls overhaul, price alerts, scenario comparison, regional drill-down, consumer impact calculator, Monte Carlo stress test, historical playback"`

---

## Verification Checklist

### Per-Phase
1. **Phase 1:** Keyboard shortcuts work (I/S/R/L), ⌘K opens palette, icon strip toggles layers, panel expands/collapses
2. **Phase 2:** Alert fires when price crosses threshold, scenarios save/load/compare, region panel shows analytics, persona calculator shows personalized impact
3. **Phase 3:** Monte Carlo completes in <2s, confidence fan renders, disclaimer always visible, timeline scrub updates KPIs

### End-to-End
- [ ] `pnpm build` passes clean
- [ ] All 3 map modes (LIVE/SCENARIO/TIMELINE) still work
- [ ] Dashboard falls back gracefully when APIs unreachable
- [ ] No hardcoded `rgba()` values (design token discipline)
- [ ] Disclaimer badge cannot be dismissed on stress test results
