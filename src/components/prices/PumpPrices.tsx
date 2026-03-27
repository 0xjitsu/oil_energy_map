'use client';

import { usePrices } from '@/hooks/usePrices';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

function PriceCard({ label, value, change }: { label: string; value: number; change: number }) {
  const animatedValue = useAnimatedNumber(value);
  const isUp = change > 0;

  return (
    <div className="glass-card p-6 border-[rgba(59,130,246,0.12)] shadow-[0_0_20px_rgba(59,130,246,0.06)]">
      <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-mono font-bold text-[rgba(255,255,255,0.9)]">
          ₱{animatedValue.toFixed(2)}
        </span>
        <span className="text-sm text-[rgba(255,255,255,0.3)] font-mono">/L</span>
      </div>
      <p className={`mt-2 text-sm font-mono ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
        {isUp ? '↑' : '↓'}₱{Math.abs(change).toFixed(2)} week-over-week
      </p>
    </div>
  );
}

export function PumpPrices() {
  const { prices: priceBenchmarks } = usePrices();
  const gasoline = priceBenchmarks.find((b) => b.id === 'pump-gasoline');
  const diesel = priceBenchmarks.find((b) => b.id === 'pump-diesel');

  if (!gasoline || !diesel) return null;

  const fuels = [
    { label: 'Gasoline', benchmark: gasoline },
    { label: 'Diesel', benchmark: diesel },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fuels.map(({ label, benchmark }) => {
        const change = benchmark.value - benchmark.previousWeek;
        return (
          <PriceCard
            key={benchmark.id}
            label={label}
            value={benchmark.value}
            change={change}
          />
        );
      })}
    </div>
  );
}
