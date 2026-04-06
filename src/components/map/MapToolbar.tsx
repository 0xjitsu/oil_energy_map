'use client';

import { useState, useCallback, useMemo } from 'react';
import MapToolbarPanel from './MapToolbarPanel';
import type { StationStatus } from '@/types/stations';

type LayerKey = 'facilities' | 'routes' | 'labels' | 'stations';

interface ToolbarButton {
  key: LayerKey;
  icon: string;
  label: string;
  shortcut: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { key: 'facilities', icon: '\u{1F3ED}', label: 'Infra', shortcut: 'I' },
  { key: 'stations', icon: '\u26FD', label: 'Stations', shortcut: 'S' },
  { key: 'routes', icon: '\u{1F6A2}', label: 'Routes', shortcut: 'R' },
  { key: 'labels', icon: '\u{1F3F7}\uFE0F', label: 'Labels', shortcut: 'L' },
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
  statusFilter: StationStatus | 'all';
  onStatusFilterChange: (status: StationStatus | 'all') => void;
  onCommandPalette: () => void;
}

export default function MapToolbar({
  layers,
  onToggle,
  stationsVisible,
  onStationsToggle,
  onCommandPalette,
}: MapToolbarProps) {
  const [expandedLayer, setExpandedLayer] = useState<LayerKey | null>(null);

  const layerActiveMap = useMemo(
    () => ({ ...layers, stations: stationsVisible }),
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
      // Station filters are now in StationFilterBar — don't open panel for stations
      if (key === 'stations') return;
      setExpandedLayer((prev) => (prev === key ? null : key));
    },
    [],
  );

  const handleClosePanel = useCallback(() => setExpandedLayer(null), []);

  return (
    <>
      {/* Vertical icon strip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 glass-card p-1.5 flex flex-col gap-1">
        {TOOLBAR_BUTTONS.map(({ key, icon, label, shortcut }) => {
          const active = layerActiveMap[key];
          const expanded = expandedLayer === key;
          return (
            <div key={key} className="relative group">
              <button
                onClick={() => handleToggle(key)}
                onDoubleClick={() => handleExpand(key)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 text-sm ${
                  active
                    ? 'bg-blue-500/15 border border-blue-500/30 text-text-primary'
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
          onClick={() => setExpandedLayer((prev) => (prev ? null : 'facilities'))}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-hover text-text-muted hover:text-text-secondary transition-colors duration-200 text-sm"
          title="Toggle panel ([)"
        >
          {expandedLayer ? '\u25C0' : '\u25B6'}
        </button>

        {/* Command palette */}
        <button
          onClick={onCommandPalette}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-hover text-text-muted hover:text-text-secondary transition-colors duration-200 text-xs font-mono"
          title="Search (⌘K)"
        >
          {'\u2318'}K
        </button>
      </div>

      {/* Expandable panel — stations filters moved to StationFilterBar */}
      {expandedLayer && expandedLayer !== 'stations' && (
        <MapToolbarPanel
          activeLayer={expandedLayer}
          layers={layers}
          onClose={handleClosePanel}
        />
      )}

      {/* Keyboard shortcut hint bar */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card">
        <span className="shortcut-badge">{'\u2318'}K</span>
        <span className="text-[9px] font-mono text-text-dim">search</span>
        <span className="text-text-dim">{'\u00B7'}</span>
        {['I', 'S', 'R', 'L'].map((k) => (
          <span key={k} className="shortcut-badge">{k}</span>
        ))}
        <span className="text-[9px] font-mono text-text-dim">layers</span>
        <span className="text-text-dim">{'\u00B7'}</span>
        <span className="shortcut-badge">?</span>
        <span className="text-[9px] font-mono text-text-dim">help</span>
      </div>
    </>
  );
}
