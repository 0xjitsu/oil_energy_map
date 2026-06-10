import { PRICE_HISTORY } from '@/data/price-history';

// PRICE_HISTORY is build-static, so each series is computed once and cached.
// Returning the SAME array instance per id keeps consumers referentially
// stable (memo/useMemo deps don't churn on every render).
const seriesCache = new Map<string, number[]>();

function computeSeries(benchmarkId: string): number[] | null {
  switch (benchmarkId) {
    case 'brent-crude':
      return PRICE_HISTORY.map((p) => p.brent);
    case 'pump-diesel':
      return PRICE_HISTORY.map((p) => p.pumpDiesel);
    case 'pump-gasoline':
      return PRICE_HISTORY.map((p) => p.pumpGasoline);
    default:
      return null;
  }
}

/**
 * Pure: map a price-benchmark id to its real weekly series (chronological),
 * or null when no curated weekly history exists for that metric. Consumers
 * must render an honest "history building…" state for null — never a
 * synthetic curve (Wave A integrity rule).
 */
export function weeklySeriesFor(benchmarkId: string): number[] | null {
  const cached = seriesCache.get(benchmarkId);
  if (cached) return cached;
  const series = computeSeries(benchmarkId);
  if (series) seriesCache.set(benchmarkId, series);
  return series;
}
