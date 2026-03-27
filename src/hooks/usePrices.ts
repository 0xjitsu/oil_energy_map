'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { priceBenchmarks as staticPrices } from '@/data/prices';
import { PriceBenchmark } from '@/types';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_HISTORY = 7; // ~35 min of data at 5-min intervals

export function usePrices() {
  const [prices, setPrices] = useState<PriceBenchmark[]>(staticPrices);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const historyRef = useRef<Record<string, number[]>>({});

  const fetchPrices = useCallback(() => {
    fetch('/api/prices')
      .then((r) => (r.ok ? r.json() : staticPrices))
      .then((data: PriceBenchmark[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrices(data);
          setIsLive(true);
          setLastUpdated(new Date());

          // Accumulate price history
          const updated = { ...historyRef.current };
          for (const b of data) {
            const prev = updated[b.id] ?? [];
            updated[b.id] = [...prev, b.value].slice(-MAX_HISTORY);
          }
          historyRef.current = updated;
          setPriceHistory(updated);
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

  return { prices, isLive, lastUpdated, priceHistory };
}
