'use client';

import { usePrices } from '@/hooks/usePrices';
import { useEvents } from '@/hooks/useEvents';
import { Severity } from '@/types';

const SEVERITY_DOT: Record<Severity, string> = {
  red: 'bg-red-400',
  yellow: 'bg-yellow-400',
  green: 'bg-emerald-400',
};

type TickerItem =
  | { kind: 'price'; name: string; value: number; unit: string; pct: string; isUp: boolean }
  | { kind: 'headline'; text: string; severity: Severity; source: string; sourceUrl: string };

export function Ticker() {
  const { prices: priceBenchmarks } = usePrices();
  const { events: timelineEvents } = useEvents();

  const priceItems: TickerItem[] = priceBenchmarks.map((b) => {
    const change = b.value - b.previousWeek;
    const pct = ((change / b.previousWeek) * 100).toFixed(1);
    return { kind: 'price', name: b.name, value: b.value, unit: b.unit, pct, isUp: change > 0 };
  });

  const headlineItems: TickerItem[] = timelineEvents.slice(0, 4).map((e) => ({
    kind: 'headline',
    text: e.event.length > 65 ? e.event.slice(0, 62) + '…' : e.event,
    severity: e.severity,
    source: e.source,
    sourceUrl: e.sourceUrl,
  }));

  // Interleave: 2 prices, 1 headline, 2 prices, 1 headline, ...
  const merged: TickerItem[] = [];
  let pi = 0;
  let hi = 0;
  while (pi < priceItems.length || hi < headlineItems.length) {
    if (pi < priceItems.length) merged.push(priceItems[pi++]);
    if (pi < priceItems.length) merged.push(priceItems[pi++]);
    if (hi < headlineItems.length) merged.push(headlineItems[hi++]);
  }

  // Duplicate for seamless loop
  const tickerContent = [...merged, ...merged];

  return (
    <div className="overflow-hidden border-t border-b border-[rgba(255,255,255,0.04)] bg-[#060a12] ticker-mask">
      <div className="flex ticker-animate whitespace-nowrap py-1.5">
        {tickerContent.map((item, i) => (
          <span key={i} className="mx-3 inline-flex items-center gap-1.5 text-[10px] font-mono">
            {item.kind === 'price' ? (
              <>
                <span className="text-[rgba(255,255,255,0.35)]">{item.name}</span>
                <span className="text-[rgba(255,255,255,0.9)] font-semibold">
                  {item.value} {item.unit}
                </span>
                <span className={item.isUp ? 'text-red-400' : 'text-emerald-400'}>
                  {item.isUp ? '▲' : '▼'} {item.pct}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[rgba(255,255,255,0.15)]">·</span>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[item.severity]}`} />
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.8)] transition-colors"
                >
                  {item.text}
                </a>
                <span className="text-[rgba(255,255,255,0.2)]">{item.source}</span>
                <span className="text-[rgba(255,255,255,0.15)]">·</span>
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
