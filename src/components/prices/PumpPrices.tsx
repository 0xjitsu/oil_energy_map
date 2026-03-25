import { priceBenchmarks } from '@/data/prices';

export function PumpPrices() {
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
          <div
            key={benchmark.id}
            className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#0a0f1a] p-6"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-2">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono font-bold text-[rgba(255,255,255,0.9)]">
                ₱{benchmark.value.toFixed(2)}
              </span>
              <span className="text-sm text-[rgba(255,255,255,0.3)] font-mono">/L</span>
            </div>
            <p className="mt-2 text-sm font-mono text-red-400">
              ↑₱{change.toFixed(2)} week-over-week
            </p>
          </div>
        );
      })}
    </div>
  );
}
