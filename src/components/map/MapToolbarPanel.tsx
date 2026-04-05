'use client';

import { BRAND_LIST } from '@/data/stations';
import { BRAND_COLORS, STATUS_COLORS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';
import { REGION_NAMES } from '@/data/regions';

interface MapToolbarPanelProps {
  activeLayer: string;
  layers: { facilities: boolean; routes: boolean; labels: boolean };
  stationsVisible: boolean;
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  statusFilter: StationStatus | 'all';
  onStatusFilterChange: (status: StationStatus | 'all') => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { key: StationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Status' },
  { key: 'operational', label: 'Operational' },
  { key: 'low-supply', label: 'Low Supply' },
  { key: 'out-of-stock', label: 'Out of Stock' },
  { key: 'closed', label: 'Closed' },
];

export default function MapToolbarPanel({
  activeLayer,
  visibleBrands,
  onBrandToggle,
  selectedRegion,
  onRegionChange,
  statusFilter,
  onStatusFilterChange,
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
          \u2715
        </button>
      </div>

      {/* Station filters */}
      {activeLayer === 'stations' && (
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Brands</p>
            <div className="flex flex-wrap gap-1">
              {BRAND_LIST.map((brand) => {
                const isActive = visibleBrands.has(brand);
                return (
                  <button
                    key={brand}
                    onClick={() => onBrandToggle(brand)}
                    className={`px-1.5 py-0.5 rounded transition-colors duration-200 font-mono text-[8px] uppercase tracking-widest ${
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

          <div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Status</p>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map(({ key, label }) => {
                const isActive = statusFilter === key;
                const color = key !== 'all' ? STATUS_COLORS[key] : undefined;
                return (
                  <button
                    key={key}
                    onClick={() => onStatusFilterChange(key)}
                    className={`px-1.5 py-0.5 rounded transition-colors duration-200 font-mono text-[8px] uppercase tracking-widest ${
                      isActive
                        ? 'text-text-primary bg-border-subtle'
                        : 'text-text-dim bg-transparent'
                    }`}
                    style={color ? { borderLeft: `2px solid ${color}` } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

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
            { label: 'Active Route', color: 'bg-emerald-500' },
            { label: 'Disrupted', color: 'bg-red-500' },
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
