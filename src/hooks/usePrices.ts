'use client';

import { useData } from '@/lib/DataProvider';

/**
 * Reads price data from the app-wide DataProvider context.
 * Returns the same shape it always has — no consumer changes needed.
 */
export function usePrices() {
  const { prices, pricesLive, pricesUpdated, priceHistory } = useData();
  return { prices, isLive: pricesLive, lastUpdated: pricesUpdated, priceHistory };
}
