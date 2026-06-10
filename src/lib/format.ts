import { priceBenchmarks as staticPrices } from '@/data/prices';
import type { PriceBenchmark } from '@/types';

interface FormatOpts {
  /** Fraction digits (min = max). Default 2. */
  decimals?: number;
}

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Pure: `63.2` → `"₱63.20"`. The ONE way to render a peso amount. */
export function formatPHP(value: number, opts: FormatOpts = {}): string {
  return `₱${formatNumber(value, opts.decimals ?? 2)}`;
}

/** Pure: `107.9` → `"$107.90"`. The ONE way to render a dollar amount. */
export function formatUSD(value: number, opts: FormatOpts = {}): string {
  return `$${formatNumber(value, opts.decimals ?? 2)}`;
}

/**
 * Canonical current-value selector. Reads the live benchmark when present,
 * else the static DOE/market fallback from `src/data/prices.ts` (which is
 * itself guarded by a module-load sanity check). Throws on an unknown id —
 * a component must never invent a "current price" constant again.
 */
export function getBenchmarkValue(prices: PriceBenchmark[], id: string): number {
  const live = prices.find((b) => b.id === id);
  if (live) return live.value;
  const fallback = staticPrices.find((b) => b.id === id);
  if (!fallback) throw new Error(`format/getBenchmarkValue: unknown benchmark id "${id}"`);
  return fallback.value;
}

/** Canonical "current pump prices" — the only sanctioned source for ₱/L now-values. */
export function getCurrentPumpPrices(prices: PriceBenchmark[]): {
  gasoline: number;
  diesel: number;
} {
  return {
    gasoline: getBenchmarkValue(prices, 'pump-gasoline'),
    diesel: getBenchmarkValue(prices, 'pump-diesel'),
  };
}
