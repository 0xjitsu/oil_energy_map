'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { priceBenchmarks as staticPrices } from '@/data/prices';
import { timelineEvents as staticEvents } from '@/data/events';
import type { PriceBenchmark, TimelineEvent } from '@/types';

const PRICE_POLL = 5 * 60 * 1000; // 5 minutes
const EVENT_POLL = 3 * 60 * 1000; // 3 minutes
const MAX_HISTORY = 7; // ~35 min of price points at 5-min intervals

/**
 * Append the latest price values into the per-benchmark history ring buffer,
 * capped at MAX_HISTORY entries each. Pure — returns a new object.
 */
export function accumulatePriceHistory(
  current: Record<string, number[]>,
  data: PriceBenchmark[],
): Record<string, number[]> {
  const updated = { ...current };
  for (const b of data) {
    const prev = updated[b.id] ?? [];
    updated[b.id] = [...prev, b.value].slice(-MAX_HISTORY);
  }
  return updated;
}

/**
 * Normalize an /api/events response into a TimelineEvent[].
 * The endpoint may return either a bare array or a `{ events: [...] }` envelope.
 * Returns null if neither shape yields a non-empty array.
 */
export function normalizeEventsResponse(data: unknown): TimelineEvent[] | null {
  const list = Array.isArray(data)
    ? data
    : (data as { events?: unknown })?.events;
  if (Array.isArray(list) && list.length > 0) {
    return list as TimelineEvent[];
  }
  return null;
}

interface DataContextValue {
  prices: PriceBenchmark[];
  pricesLive: boolean;
  pricesUpdated: Date | null;
  priceHistory: Record<string, number[]>;
  events: TimelineEvent[];
  eventsLive: boolean;
  eventsUpdated: Date | null;
}

const DEFAULT_VALUE: DataContextValue = {
  prices: staticPrices,
  pricesLive: false,
  pricesUpdated: null,
  priceHistory: {},
  events: staticEvents,
  eventsLive: false,
  eventsUpdated: null,
};

const DataContext = createContext<DataContextValue>(DEFAULT_VALUE);

/**
 * Owns the single price + event polling loop for the whole app.
 * Mounted once in the root layout. `usePrices`/`useEvents` read from this context.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<PriceBenchmark[]>(staticPrices);
  const [pricesLive, setPricesLive] = useState(false);
  const [pricesUpdated, setPricesUpdated] = useState<Date | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const historyRef = useRef<Record<string, number[]>>({});

  const [events, setEvents] = useState<TimelineEvent[]>(staticEvents);
  const [eventsLive, setEventsLive] = useState(false);
  const [eventsUpdated, setEventsUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(() => {
    fetch('/api/prices')
      .then((r) => (r.ok ? r.json() : staticPrices))
      .then((data: PriceBenchmark[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrices(data);
          setPricesLive(true);
          setPricesUpdated(new Date());

          const updated = accumulatePriceHistory(historyRef.current, data);
          historyRef.current = updated;
          setPriceHistory(updated);
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks.
      });
  }, []);

  const fetchEvents = useCallback(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch('/api/events');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const list = normalizeEventsResponse(data);
        if (list) {
          setEvents(list);
          setEventsLive(true);
          setEventsUpdated(new Date());
          return;
        }
      } catch {
        if (attempt < 2) await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      }
    }
    // Keep static fallback after all retries.
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, PRICE_POLL);
    return () => clearInterval(id);
  }, [fetchPrices]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, EVENT_POLL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  const value = useMemo<DataContextValue>(
    () => ({
      prices,
      pricesLive,
      pricesUpdated,
      priceHistory,
      events,
      eventsLive,
      eventsUpdated,
    }),
    [prices, pricesLive, pricesUpdated, priceHistory, events, eventsLive, eventsUpdated],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
