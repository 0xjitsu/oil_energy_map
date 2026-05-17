'use client';

import { useData } from '@/lib/DataProvider';

/**
 * Reads event data from the app-wide DataProvider context.
 * Returns the same shape it always has — no consumer changes needed.
 */
export function useEvents() {
  const { events, eventsLive, eventsUpdated } = useData();
  return { events, isLive: eventsLive, lastUpdated: eventsUpdated };
}
