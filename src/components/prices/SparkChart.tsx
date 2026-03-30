'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

interface SparkChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  unit?: string;
}

function CustomTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  unit?: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded border border-border-hover bg-bg-card px-2 py-1 shadow-lg">
      <span className="text-[10px] font-mono text-text-primary tabular-nums">
        {payload[0].value.toFixed(2)}
        {unit && <span className="text-text-dim ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export function SparkChart({ data, color, width = 80, height = 24, unit }: SparkChartProps) {
  const chartData = useMemo(
    () => data.map((v, i) => ({ i, v })),
    [data]
  );

  const gradientId = useMemo(
    () => `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`,
    [color]
  );

  return (
    <div style={{ width, height }} className="cursor-crosshair">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            activeDot={{ r: 2.5, fill: color, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
