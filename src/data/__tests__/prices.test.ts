import { describe, it, expect } from 'vitest';
import { priceBenchmarks } from '@/data/prices';
import { PRICE_HISTORY } from '@/data/price-history';

describe('priceBenchmarks fallback data', () => {
  it('contains the four required benchmarks', () => {
    const ids = new Set(priceBenchmarks.map((b) => b.id));
    for (const id of ['brent-crude', 'php-usd', 'pump-gasoline', 'pump-diesel']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('pump prices are within the sane PH band (₱30–110/L)', () => {
    for (const id of ['pump-gasoline', 'pump-diesel']) {
      const b = priceBenchmarks.find((x) => x.id === id)!;
      expect(b.value).toBeGreaterThanOrEqual(30);
      expect(b.value).toBeLessThanOrEqual(110);
      expect(b.previousWeek).toBeGreaterThanOrEqual(30);
      expect(b.previousWeek).toBeLessThanOrEqual(110);
    }
  });

  it('week-over-week pump deltas are plausible (under ₱15/L)', () => {
    for (const id of ['pump-gasoline', 'pump-diesel']) {
      const b = priceBenchmarks.find((x) => x.id === id)!;
      expect(Math.abs(b.value - b.previousWeek)).toBeLessThan(15);
    }
  });

  it('static pump/brent fallbacks match the latest curated history week', () => {
    const last = PRICE_HISTORY[PRICE_HISTORY.length - 1];
    const prev = PRICE_HISTORY[PRICE_HISTORY.length - 2];
    const byId = Object.fromEntries(priceBenchmarks.map((b) => [b.id, b]));
    expect(byId['pump-gasoline'].value).toBe(last.pumpGasoline);
    expect(byId['pump-diesel'].value).toBe(last.pumpDiesel);
    expect(byId['brent-crude'].value).toBe(last.brent);
    expect(byId['pump-gasoline'].previousWeek).toBe(prev.pumpGasoline);
    expect(byId['pump-diesel'].previousWeek).toBe(prev.pumpDiesel);
    expect(byId['brent-crude'].previousWeek).toBe(prev.brent);
  });

  it('php-usd fallback is pinned to the verified weekly closes for the same weeks', () => {
    // Yahoo Finance PHP=X daily closes (retrieved 2026-06-11) — see the
    // source comment on the php-usd entry in src/data/prices.ts.
    const phpUsd = priceBenchmarks.find((b) => b.id === 'php-usd')!;
    expect(phpUsd.value).toBe(61.35); // week 2026-06-01 close (Fri 2026-06-05)
    expect(phpUsd.previousWeek).toBe(60.72); // week 2026-05-25 close (Fri 2026-05-29)
  });

  it('derived Dubai/MOPS fallbacks stay coherent with the Brent fallback spreads', () => {
    // Same spreads the live route applies (src/lib/priceSources.ts):
    // Dubai = Brent + 2.50, MOPS gasoline = Brent + 13.50, MOPS diesel = Brent + 17.00.
    const byId = Object.fromEntries(priceBenchmarks.map((b) => [b.id, b]));
    const brent = byId['brent-crude'];
    for (const [id, spread] of [
      ['dubai-crude', 2.5],
      ['mops-gasoline', 13.5],
      ['mops-diesel', 17.0],
    ] as const) {
      expect(byId[id].value).toBeCloseTo(brent.value + spread, 2);
      expect(byId[id].previousWeek).toBeCloseTo(brent.previousWeek + spread, 2);
    }
  });
});
