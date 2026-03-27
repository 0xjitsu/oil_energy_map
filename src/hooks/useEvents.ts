'use client';

import { useState, useEffect, useCallback } from 'react';
import { timelineEvents as staticEvents } from '@/data/events';
import { TimelineEvent } from '@/types';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>(staticEvents);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEvents = useCallback(() => {
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : staticEvents))
      .then((data: TimelineEvent[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setIsLive(true);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks
      });
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return { events, isLive, lastUpdated };
}
