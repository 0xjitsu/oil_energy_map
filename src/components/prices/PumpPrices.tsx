'use client';

import { usePrices } from '@/hooks/usePrices';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { SparkChart } from './SparkChart';

function PriceCard({
  label,
  value,
  change,
  sparkData,
  sparkColor,
  accentColor,
}: {
  label: string;
  value: number;
  change: number;
  sparkData: number[];
  sparkColor: string;
  accentColor: string;
}) {
  const animatedValue = useAnimatedNumber(value);
  const isUp = change > 0;
  const pctChange = value - change !== 0 ? (change / Math.abs(value - change)) * 100 : 0;

  return (
    <div
      className="glass-card p-5 relative overflow-hidden"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-label font-mono">
          {label}
        </p>
        <span
          className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
            isUp ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
          }`}
        >
          {isUp ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="text-3xl sm:text-4xl font-mono font-bold text-text-primary tabular-nums">
            ₱{animatedValue.toFixed(2)}
          </span>
          <span className="text-sm text-text-dim font-mono ml-1">/L</span>
        </div>
        {sparkData.length >= 2 && (
          <SparkChart data={sparkData} color={sparkColor} width={100} height={28} />
        )}
      </div>
      <p className={`mt-2 text-xs font-mono ${isUp ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
        {isUp ? '↑' : '↓'} ₱{Math.abs(change).toFixed(2)} vs prev week
      </p>
      <p className="mt-1 text-[9px] font-mono text-text-dim">
        Source: DOE Oil Monitor (SRP)
      </p>
    </div>
  );
}

export function PumpPrices() {
  const { prices: priceBenchmarks, priceHistory } = usePrices();
  const gasoline = priceBenchmarks.find((b) => b.id === 'pump-gasoline');
  const diesel = priceBenchmarks.find((b) => b.id === 'pump-diesel');

  if (!gasoline || !diesel) return null;

  const fuels = [
    { label: 'Gasoline', benchmark: gasoline, sparkColor: '#ef4444', accentColor: '#ef4444' },
    { label: 'Diesel', benchmark: diesel, sparkColor: '#f59e0b', accentColor: '#f59e0b' },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fuels.map(({ label, benchmark, sparkColor, accentColor }) => {
        const change = benchmark.value - benchmark.previousWeek;
        return (
          <PriceCard
            key={benchmark.id}
            label={label}
            value={benchmark.value}
            change={change}
            sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
            sparkColor={sparkColor}
            accentColor={accentColor}
          />
        );
      })}
    </div>
  );
}
