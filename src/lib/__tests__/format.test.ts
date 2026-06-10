import { describe, it, expect } from 'vitest';
import {
  formatPHP,
  formatUSD,
  getBenchmarkValue,
  getCurrentPumpPrices,
} from '@/lib/format';
import type { PriceBenchmark } from '@/types';

describe('formatPHP', () => {
  it('formats with the peso sign and two decimals by default', () => {
    expect(formatPHP(63.2)).toBe('₱63.20');
  });
  it('groups thousands', () => {
    expect(formatPHP(1234.5)).toBe('₱1,234.50');
  });
  it('respects a custom decimal count', () => {
    expect(formatPHP(59.456, { decimals: 1 })).toBe('₱59.5');
  });
  it('handles zero and negatives honestly', () => {
    expect(formatPHP(0)).toBe('₱0.00');
    expect(formatPHP(-2.5)).toBe('₱-2.50');
  });
});

describe('formatUSD', () => {
  it('formats with the dollar sign and two decimals by default', () => {
    expect(formatUSD(107.9)).toBe('$107.90');
  });
  it('respects a custom decimal count', () => {
    expect(formatUSD(107.94, { decimals: 1 })).toBe('$107.9');
  });
});

const bench = (id: string, value: number): PriceBenchmark =>
  ({ id, name: id, value, previousWeek: value, unit: '₱/liter', tooltip: '' }) as PriceBenchmark;

describe('getBenchmarkValue', () => {
  it('returns the live value when the benchmark is present', () => {
    expect(getBenchmarkValue([bench('pump-diesel', 61.1)], 'pump-diesel')).toBe(61.1);
  });
  it('falls back to the static fallback benchmark when missing', () => {
    // src/data/prices.ts static fallback: pump-diesel = 59.40
    expect(getBenchmarkValue([], 'pump-diesel')).toBe(59.4);
  });
  it('throws on an unknown id — never invents a number', () => {
    expect(() => getBenchmarkValue([], 'no-such-benchmark')).toThrow();
  });
});

describe('getCurrentPumpPrices', () => {
  it('selects gasoline and diesel in one call', () => {
    const prices = [bench('pump-gasoline', 64.0), bench('pump-diesel', 60.0)];
    expect(getCurrentPumpPrices(prices)).toEqual({ gasoline: 64.0, diesel: 60.0 });
  });
});
