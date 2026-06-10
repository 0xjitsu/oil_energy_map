'use client';

import { useId } from 'react';

interface SparkChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  unit?: string;
  /** Rendered inside the fixed-size box when data has < 2 points. */
  emptyLabel?: string;
}

/**
 * Lightweight SVG sparkline — area fill + line + last-point dot.
 * Replaces the Recharts AreaChart to keep Recharts out of the initial bundle.
 */
export function SparkChart({ data, color, width = 80, height = 24, unit, emptyLabel }: SparkChartProps) {
  // useId() is SSR-safe; strip colons so the value is a valid SVG fragment id.
  const gradientId = `spark${useId().replace(/:/g, '')}`;

  if (data.length < 2) {
    // Not enough points for a trend. Same fixed-size box (no CLS) — but never
    // a silent hide: when the caller passes emptyLabel, say so out loud.
    // Missing ≠ zero ≠ fabricated (CLAUDE.md aggregate-honesty rule).
    if (emptyLabel) {
      return (
        <div
          style={{ width, height }}
          className="flex items-center justify-end overflow-hidden font-mono text-[10px] text-text-dim whitespace-nowrap"
        >
          {emptyLabel}
        </div>
      );
    }
    return <div style={{ width, height }} aria-hidden="true" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const lastValue = data[data.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend sparkline, latest value ${lastValue.toFixed(2)}${unit ?? ''}`}
    >
      <title>
        {lastValue.toFixed(2)}
        {unit ?? ''}
      </title>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}
