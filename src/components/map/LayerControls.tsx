'use client';

import type { MapMode } from '@/types';
import { BRAND_COLORS } from '@/types/stations';
import { BRAND_LIST } from '@/data/stations';

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
}: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-50 rounded-xl p-3 flex flex-col gap-3 bg-[rgba(10,15,26,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] shadow-lg">
      {/* Mode selector */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-[rgba(255,255,255,0.04)]">
        {modeConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`flex-1 px-2 py-1.5 rounded-md transition-all duration-200 font-mono text-[9px] uppercase tracking-widest ${
              mapMode === key
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
                : 'text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.45)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(255,255,255,0.06)]" />

      {/* Layer toggles */}
      {layerConfig.map(({ key, label }) => {
        const isActive = layers[key as keyof typeof layers];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
              isActive
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
                : 'text-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-[rgba(255,255,255,0.1)]'
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
            ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
            : 'text-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
        }`}
      >
        <span
          className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
            stationsVisible
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
              : 'bg-[rgba(255,255,255,0.1)]'
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
                    ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.06)]'
                    : 'text-[rgba(255,255,255,0.2)] bg-transparent'
                }`}
                style={{ borderLeft: `2px solid ${BRAND_COLORS[brand] ?? BRAND_COLORS.Other}` }}
              >
                {brand}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
