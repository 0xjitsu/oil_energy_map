'use client';

import type { GasStation } from '@/types/stations';
import { BRAND_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/types/stations';

interface StationTooltipProps {
  station: GasStation | null;
  x: number;
  y: number;
}

export default function StationTooltip({ station, x, y }: StationTooltipProps) {
  if (!station) return null;

  const brandColor = BRAND_COLORS[station.brand] ?? BRAND_COLORS.Other;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: x + 12,
        top: y - 12,
        transform: 'translateY(-100%)',
      }}
    >
      <div
        className="max-w-[280px] rounded-lg overflow-hidden bg-[rgba(10,15,26,0.9)] backdrop-blur-xl border border-border-hover shadow-2xl"
        style={{ borderLeft: `3px solid ${brandColor}` }}
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: brandColor }}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-label">
              {station.brand}
            </span>
          </div>

          {station.status && station.status !== 'operational' && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[station.status] }}
              />
              <span
                className="font-mono text-[8px] uppercase tracking-widest"
                style={{ color: STATUS_COLORS[station.status] }}
              >
                {STATUS_LABELS[station.status]}
              </span>
            </div>
          )}

          <h4 className="font-mono font-bold text-xs text-text-primary leading-tight">
            {station.name}
          </h4>

          {station.address && (
            <p className="mt-1 text-[10px] text-text-secondary leading-snug">
              {station.address}
            </p>
          )}

          {station.fuelTypes && station.fuelTypes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {station.fuelTypes.map((fuel) => (
                <span
                  key={fuel}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-border-subtle text-text-secondary"
                >
                  {fuel}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-[8px] text-text-muted font-mono">
            <span>{station.coordinates[0].toFixed(4)}, {station.coordinates[1].toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
