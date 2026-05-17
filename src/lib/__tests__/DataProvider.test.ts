import { describe, it, expect } from 'vitest';
import { accumulatePriceHistory, normalizeEventsResponse } from '@/lib/DataProvider';
import type { PriceBenchmark, TimelineEvent } from '@/types';

const bench = (id: string, value: number): PriceBenchmark =>
  ({ id, name: id, value, previousWeek: value, unit: '$', tooltip: '' } as PriceBenchmark);

describe('accumulatePriceHistory', () => {
  it('appends new values per benchmark id', () => {
    const r1 = accumulatePriceHistory({}, [bench('brent', 80)]);
    expect(r1.brent).toEqual([80]);
    const r2 = accumulatePriceHistory(r1, [bench('brent', 81)]);
    expect(r2.brent).toEqual([80, 81]);
  });

  it('caps each benchmark history at 7 entries', () => {
    let hist: Record<string, number[]> = {};
    for (let i = 1; i <= 12; i++) {
      hist = accumulatePriceHistory(hist, [bench('brent', i)]);
    }
    expect(hist.brent).toHaveLength(7);
    expect(hist.brent).toEqual([6, 7, 8, 9, 10, 11, 12]);
  });

  it('does not mutate the input object', () => {
    const input = { brent: [80] };
    accumulatePriceHistory(input, [bench('brent', 81)]);
    expect(input.brent).toEqual([80]);
  });
});

describe('normalizeEventsResponse', () => {
  const ev = { date: '2026-01-01', event: 'x', severity: 'green', source: 's', sourceUrl: '', sourceType: 'news' } as TimelineEvent;

  it('accepts a bare array', () => {
    expect(normalizeEventsResponse([ev])).toEqual([ev]);
  });

  it('accepts an { events: [...] } envelope', () => {
    expect(normalizeEventsResponse({ events: [ev] })).toEqual([ev]);
  });

  it('returns null for an empty array', () => {
    expect(normalizeEventsResponse([])).toBeNull();
  });

  it('returns null for a malformed response', () => {
    expect(normalizeEventsResponse({ foo: 'bar' })).toBeNull();
    expect(normalizeEventsResponse(null)).toBeNull();
  });
});
