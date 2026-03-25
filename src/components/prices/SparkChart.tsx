'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface SparkChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function SparkChart({ data, color, width = 80, height = 24 }: SparkChartProps) {
  const chartData = useMemo(
    () => data.map((v, i) => ({ i, v })),
    [data]
  );

  const gradientId = useMemo(
    () => `spark-${color.replace('#', '')}`,
    [color]
  );

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
