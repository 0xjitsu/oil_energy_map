'use client';

import { useState, useEffect, useCallback } from 'react';
import { timelineEvents as staticEvents } from '@/data/events';
import { TimelineEvent } from '@/types';

const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function useEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>(staticEvents);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch('/api/events');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const eventList = Array.isArray(data) ? data : data.events;
        if (Array.isArray(eventList) && eventList.length > 0) {
          setEvents(eventList);
          setIsLive(true);
          setLastUpdated(new Date());
          return;
        }
      } catch {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    // Keep static fallback after all retries
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return { events, isLive, lastUpdated };
}
