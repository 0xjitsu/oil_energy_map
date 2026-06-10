import { describe, it, expect } from 'vitest';
import { validatePriceHistory } from '@/lib/price-history-validate';
import { PRICE_HISTORY, MIN_WEEKS, type WeeklyPricePoint } from '@/data/price-history';

const good = (week: string, over: Partial<WeeklyPricePoint> = {}): WeeklyPricePoint => ({
  week,
  brent: 70,
  pumpDiesel: 58,
  pumpGasoline: 64,
  ...over,
});

describe('validatePriceHistory (unit)', () => {
  // minWeeks=2 keeps fixtures small while testing every other rule.
  it('accepts a clean Monday-weekly series', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-01-12')], 2)).toEqual([]);
  });
  it('rejects too few entries', () => {
    expect(validatePriceHistory([good('2026-01-05')], 2)).not.toEqual([]);
  });
  it('rejects non-Monday weeks', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-01-13')], 2)).not.toEqual([]);
  });
  it('rejects non-increasing dates', () => {
    expect(validatePriceHistory([good('2026-01-12'), good('2026-01-05')], 2)).not.toEqual([]);
  });
  it('rejects gaps longer than two skipped weeks', () => {
    expect(validatePriceHistory([good('2026-01-05'), good('2026-02-09')], 2)).not.toEqual([]);
  });
  it('rejects out-of-band values', () => {
    expect(validatePriceHistory([good('2026-01-05', { pumpDiesel: 200 }), good('2026-01-12')], 2)).not.toEqual([]);
    expect(validatePriceHistory([good('2026-01-05', { pumpGasoline: 30 }), good('2026-01-12')], 2)).not.toEqual([]);
    expect(validatePriceHistory([good('2026-01-05', { brent: 250 }), good('2026-01-12')], 2)).not.toEqual([]);
  });
  it('rejects non-finite values', () => {
    expect(validatePriceHistory([good('2026-01-05', { brent: NaN }), good('2026-01-12')], 2)).not.toEqual([]);
  });
  it('rejects an empty event string (omit the field instead)', () => {
    expect(validatePriceHistory([good('2026-01-05', { event: '' }), good('2026-01-12')], 2)).not.toEqual([]);
  });
});

describe('PRICE_HISTORY (integration gate — the producer-side sanity check)', () => {
  it('is non-empty, ordered, in-band real data', () => {
    expect(validatePriceHistory(PRICE_HISTORY, MIN_WEEKS)).toEqual([]);
  });
  it(`carries at least ${26} weeks`, () => {
    expect(MIN_WEEKS).toBeGreaterThanOrEqual(26);
    expect(PRICE_HISTORY.length).toBeGreaterThanOrEqual(MIN_WEEKS);
  });
});
