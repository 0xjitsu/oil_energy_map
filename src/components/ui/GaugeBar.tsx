'use client';

export interface ThresholdZone {
  start: number;
  end: number;
  color: string;
}

interface GaugeBarProps {
  value: number;
  label?: string;
  zones?: ThresholdZone[];
  height?: number;
  showMarkers?: boolean;
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
  className,
}: GaugeBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

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
        {/* Zone backgrounds */}
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

        {/* Active fill — uses the color of whichever zone the value falls in */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor:
              zones.find((z) => clampedValue >= z.start && clampedValue <= z.end)?.color ??
              zones[zones.length - 1].color,
            opacity: 0.85,
          }}
        />

        {/* Zone boundary markers */}
        {showMarkers &&
          zones.slice(0, -1).map((zone, i) => (
            <div
              key={`marker-${i}`}
              className="absolute top-0 h-full"
              style={{
                left: `${zone.end}%`,
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
              }}
            />
          ))}
      </div>
    </div>
  );
}
