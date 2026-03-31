'use client';

import type { MonteCarloResult } from '@/types';

interface ConfidenceFanProps {
  result: MonteCarloResult;
  fuelType: 'gasoline' | 'diesel';
}

export function ConfidenceFan({ result, fuelType }: ConfidenceFanProps) {
  const data = fuelType === 'gasoline' ? result.pumpGasoline : result.pumpDiesel;

  const bands = [
    { label: 'P10', value: data.p10, color: 'text-emerald-400' },
    { label: 'P25', value: data.p25, color: 'text-emerald-300' },
    { label: 'P50', value: data.p50, color: 'text-text-primary' },
    { label: 'P75', value: data.p75, color: 'text-amber-300' },
    { label: 'P90', value: data.p90, color: 'text-red-400' },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-1">
        {bands.map(({ label, value, color }) => (
          <div key={label} className="text-center flex-1">
            <p className="text-[8px] font-mono text-text-dim uppercase">{label}</p>
            <p className={`text-sm font-mono font-bold ${color}`}>₱{value.toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 relative h-6 rounded-full overflow-hidden bg-border">
        <div
          className="absolute h-full bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/20 rounded-full"
          style={{
            left: '0%',
            width: '100%',
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-text-primary"
          style={{ left: `${((data.p50 - data.p10) / (data.p90 - data.p10)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-text-dim">₱{data.p10}</span>
        <span className="text-[8px] font-mono text-text-secondary">median ₱{data.p50}</span>
        <span className="text-[8px] font-mono text-text-dim">₱{data.p90}</span>
      </div>
    </div>
  );
}
