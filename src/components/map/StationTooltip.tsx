'use client';

import type { GasStation } from '@/types/stations';
import { BRAND_COLORS } from '@/types/stations';

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
        className="max-w-[280px] rounded-lg overflow-hidden bg-[rgba(10,15,26,0.9)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] shadow-2xl"
        style={{ borderLeft: `3px solid ${brandColor}` }}
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: brandColor }}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
              {station.brand}
            </span>
          </div>

          <h4 className="font-mono font-bold text-xs text-[rgba(255,255,255,0.9)] leading-tight">
            {station.name}
          </h4>

          {station.address && (
            <p className="mt-1 text-[10px] text-[rgba(255,255,255,0.5)] leading-snug">
              {station.address}
            </p>
          )}

          {station.fuelTypes && station.fuelTypes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {station.fuelTypes.map((fuel) => (
                <span
                  key={fuel}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)]"
                >
                  {fuel}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-[8px] text-[rgba(255,255,255,0.25)] font-mono">
            <span>{station.coordinates[0].toFixed(4)}, {station.coordinates[1].toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
