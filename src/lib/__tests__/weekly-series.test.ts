import { describe, it, expect } from 'vitest';
import { weeklySeriesFor } from '@/lib/weekly-series';
import { PRICE_HISTORY, MIN_WEEKS } from '@/data/price-history';

describe('weeklySeriesFor', () => {
  it.each(['brent-crude', 'pump-diesel', 'pump-gasoline'] as const)(
    'maps %s to a full-length weekly series',
    (id) => {
      const series = weeklySeriesFor(id);
      expect(series).not.toBeNull();
      expect(series!.length).toBe(PRICE_HISTORY.length);
      expect(series!.length).toBeGreaterThanOrEqual(MIN_WEEKS);
      expect(series!.every(Number.isFinite)).toBe(true);
    },
  );

  it('returns null for benchmarks without a weekly series', () => {
    expect(weeklySeriesFor('php-usd')).toBeNull();
    expect(weeklySeriesFor('dubai-crude')).toBeNull();
    expect(weeklySeriesFor('anything-else')).toBeNull();
  });

  it('preserves chronological order (last point is the latest week)', () => {
    const series = weeklySeriesFor('pump-diesel')!;
    expect(series[series.length - 1]).toBe(PRICE_HISTORY[PRICE_HISTORY.length - 1].pumpDiesel);
  });
});
