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
    <div className="absolute right-4 top-4 bottom-4 z-50 w-full sm:w-[320px] glass-card overflow-y-auto">
      <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-card/90 backdrop-blur">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Regional Intelligence</p>
          <p className="font-mono text-sm text-text-primary font-semibold mt-0.5">{analytics.regionName}</p>
        </div>
        <button onClick={onClose} className="text-text-dim hover:text-text-secondary">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1">Total Stations</p>
          <p className="text-3xl font-mono font-bold text-text-primary">{analytics.stationCount.toLocaleString()}</p>
        </div>

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
