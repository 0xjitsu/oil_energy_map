'use client';

import type { MapMode } from '@/types';
import { BRAND_COLORS } from '@/types/stations';
import { BRAND_LIST } from '@/data/stations';
import { REGION_NAMES } from '@/data/regions';

interface LayerControlsProps {
  layers: {
    facilities: boolean;
    routes: boolean;
    labels: boolean;
  };
  onToggle: (layer: string) => void;
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  stationsVisible: boolean;
  onStationsToggle: () => void;
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
}

const layerConfig: { key: string; label: string }[] = [
  { key: 'facilities', label: 'Infrastructure' },
  { key: 'routes', label: 'Routes' },
  { key: 'labels', label: 'Labels' },
];

const modeConfig: { key: MapMode; label: string }[] = [
  { key: 'live', label: 'LIVE' },
  { key: 'scenario', label: 'SCENARIO' },
  { key: 'timeline', label: 'TIMELINE' },
];

export default function LayerControls({
  layers,
  onToggle,
  mapMode,
  onModeChange,
  stationsVisible,
  onStationsToggle,
  visibleBrands,
  onBrandToggle,
  selectedRegion,
  onRegionChange,
}: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-50 rounded-xl p-3 flex flex-col gap-3 glass-card">
      {/* Mode selector */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-border">
        {modeConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`flex-1 px-2 py-1.5 rounded-md transition-all duration-200 font-mono text-[9px] uppercase tracking-widest ${
              mapMode === key
                ? 'text-text-primary bg-border-hover'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border-subtle" />

      {/* Layer toggles */}
      {layerConfig.map(({ key, label }) => {
        const isActive = layers[key as keyof typeof layers];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
              isActive
                ? 'text-text-primary bg-border-hover'
                : 'text-text-muted bg-transparent hover:bg-surface-hover'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-border-hover'
              }`}
            />
            {label}
          </button>
        );
      })}

      {/* Stations toggle */}
      <button
        onClick={onStationsToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
          stationsVisible
            ? 'text-text-primary bg-border-hover'
            : 'text-text-muted bg-transparent hover:bg-surface-hover'
        }`}
      >
        <span
          className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
            stationsVisible
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
              : 'bg-border-hover'
          }`}
        />
        Stations
      </button>

      {/* Brand filters */}
      {stationsVisible && (
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
      )}

      {/* Region filter */}
      {stationsVisible && (
        <select
          value={selectedRegion ?? ''}
          onChange={(e) => onRegionChange(e.target.value || null)}
          className="w-full px-2 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all duration-200 bg-border border border-border-hover text-text-primary outline-none cursor-pointer appearance-none hover:bg-border-subtle focus:border-border-hover"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: '24px',
          }}
        >
          <option value="" className="bg-bg-card text-text-primary">
            All Regions
          </option>
          {REGION_NAMES.map((region) => (
            <option
              key={region}
              value={region}
              className="bg-bg-card text-text-primary"
            >
              {region}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
