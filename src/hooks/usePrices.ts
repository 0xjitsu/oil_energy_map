'use client';

import { useState, useEffect, useCallback } from 'react';
import { priceBenchmarks as staticPrices } from '@/data/prices';
import { PriceBenchmark } from '@/types';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function usePrices() {
  const [prices, setPrices] = useState<PriceBenchmark[]>(staticPrices);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(() => {
    fetch('/api/prices')
      .then((r) => (r.ok ? r.json() : staticPrices))
      .then((data: PriceBenchmark[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrices(data);
          setIsLive(true);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks
      });
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPrices]);

  return { prices, isLive, lastUpdated };
}
