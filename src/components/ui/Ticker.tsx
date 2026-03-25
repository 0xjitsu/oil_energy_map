'use client';

import { priceBenchmarks } from '@/data/prices';

export function Ticker() {
  const items = priceBenchmarks.map((b) => {
    const change = b.value - b.previousWeek;
    const pct = ((change / b.previousWeek) * 100).toFixed(1);
    const isUp = change > 0;
    return { name: b.name, value: b.value, unit: b.unit, pct, isUp };
  });

  const tickerContent = [...items, ...items];

  return (
    <div className="overflow-hidden border-t border-b border-[rgba(255,255,255,0.04)] bg-[#060a12]">
      <div className="flex animate-ticker whitespace-nowrap py-1.5">
        {tickerContent.map((item, i) => (
          <span
            key={i}
            className="mx-4 inline-flex items-center gap-1.5 text-[10px] font-mono"
          >
            <span className="text-[rgba(255,255,255,0.35)]">{item.name}</span>
            <span className="text-[rgba(255,255,255,0.9)] font-semibold">
              {item.value} {item.unit}
            </span>
            <span className={item.isUp ? 'text-red-400' : 'text-emerald-400'}>
              {item.isUp ? '▲' : '▼'} {item.pct}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
