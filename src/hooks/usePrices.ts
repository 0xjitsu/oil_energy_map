'use client';

import { useState, useEffect } from 'react';
import { priceBenchmarks as staticPrices } from '@/data/prices';
import { PriceBenchmark } from '@/types';

export function usePrices() {
  const [prices, setPrices] = useState<PriceBenchmark[]>(staticPrices);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch('/api/prices')
      .then((r) => (r.ok ? r.json() : staticPrices))
      .then((data: PriceBenchmark[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrices(data);
          setIsLive(true);
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks
      });
  }, []);

  return { prices, isLive };
}
