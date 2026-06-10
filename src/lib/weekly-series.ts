import { PRICE_HISTORY } from '@/data/price-history';

/**
 * Pure: map a price-benchmark id to its real weekly series (chronological),
 * or null when no curated weekly history exists for that metric. Consumers
 * must render an honest "history building…" state for null — never a
 * synthetic curve (Wave A integrity rule).
 */
export function weeklySeriesFor(benchmarkId: string): number[] | null {
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
