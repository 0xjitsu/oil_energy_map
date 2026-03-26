'use client';

import { useState, useEffect } from 'react';
import { timelineEvents as staticEvents } from '@/data/events';
import { TimelineEvent } from '@/types';

export function useEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>(staticEvents);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : staticEvents))
      .then((data: TimelineEvent[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setIsLive(true);
        }
      })
      .catch(() => {
        // Keep static fallback — dashboard never breaks
      });
  }, []);

  return { events, isLive };
}
