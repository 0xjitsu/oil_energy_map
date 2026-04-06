'use client';

import { BRAND_LIST } from '@/data/stations';
import { BRAND_COLORS, STATUS_COLORS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';
import { REGION_NAMES } from '@/data/regions';

const STATUS_OPTIONS: { key: StationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'operational', label: 'Operational' },
  { key: 'low-supply', label: 'Low Supply' },
  { key: 'out-of-stock', label: 'Out of Stock' },
  { key: 'closed', label: 'Closed' },
];

interface StationFilterBarProps {
  visibleBrands: Set<string>;
  onBrandToggle: (brand: string) => void;
  statusFilter: StationStatus | 'all';
  onStatusFilterChange: (status: StationStatus | 'all') => void;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  filteredCount: number;
  totalCount: number;
}

export default function StationFilterBar({
  visibleBrands,
  onBrandToggle,
  statusFilter,
  onStatusFilterChange,
  selectedRegion,
  onRegionChange,
  filteredCount,
  totalCount,
}: StationFilterBarProps) {
  return (
    <div className="absolute top-14 left-2 right-2 sm:left-4 sm:right-4 z-40 glass-card px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Brand pills */}
        <div className="flex flex-wrap items-center gap-1">
          {BRAND_LIST.map((brand) => {
            const isActive = visibleBrands.has(brand);
            const color = BRAND_COLORS[brand] ?? BRAND_COLORS.Other;
            return (
              <button
                key={brand}
                onClick={() => onBrandToggle(brand)}
                className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors duration-200 font-mono text-[9px] uppercase tracking-widest ${
                  isActive
                    ? 'text-text-primary bg-border-subtle'
                    : 'text-text-dim bg-transparent opacity-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {brand}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-border-subtle" aria-hidden="true" />

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_OPTIONS.map(({ key, label }) => {
            const isActive = statusFilter === key;
            const color = key !== 'all' ? STATUS_COLORS[key] : undefined;
            return (
              <button
                key={key}
                onClick={() => onStatusFilterChange(key)}
                className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors duration-200 font-mono text-[9px] uppercase tracking-widest ${
                  isActive
                    ? 'text-text-primary bg-border-subtle'
                    : 'text-text-dim bg-transparent'
                }`}
              >
                {color && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-border-subtle" aria-hidden="true" />

        {/* Region dropdown */}
        <select
          value={selectedRegion ?? ''}
          onChange={(e) => onRegionChange(e.target.value || null)}
          aria-label="Filter by region"
          className="min-h-[44px] sm:min-h-[32px] px-2 py-1 rounded-md font-mono text-[9px] uppercase tracking-widest bg-border border border-border-hover text-text-primary outline-none cursor-pointer appearance-none hover:bg-border-subtle focus:border-border-hover"
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

        {/* Station count */}
        <div className="ml-auto shrink-0">
          <span className="font-mono text-[10px] text-text-muted">
            <span className="text-text-secondary">{filteredCount.toLocaleString()}</span>
            {' / '}
            {totalCount.toLocaleString()} stations
          </span>
        </div>
      </div>
    </div>
  );
}
