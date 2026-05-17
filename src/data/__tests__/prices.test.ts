import { describe, it, expect } from 'vitest';
import { priceBenchmarks } from '@/data/prices';

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
});
