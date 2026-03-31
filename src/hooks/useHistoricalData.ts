'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import historicalPrices from '@/data/historical-prices.json';
import historicalEvents from '@/data/historical-events.json';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface HistoricalSnapshot {
  date: string;
  brent: number;
  phpUsd: number;
  pumpGasoline: number;
  pumpDiesel: number;
}

export interface HistoricalEvent {
  date: string;
  title: string;
  severity: 'red' | 'yellow' | 'green';
  priceImpact: number;
}

export function useHistoricalData() {
  const prices = historicalPrices as HistoricalSnapshot[];
  const events = historicalEvents as HistoricalEvent[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<number>(0);

  const currentSnapshot = prices[currentIndex] ?? prices[0];
  const dateRange = { start: prices[0].date, end: prices[prices.length - 1].date };

  const nearbyEvents = useMemo(() => {
    const current = new Date(currentSnapshot.date).getTime();
    return events.filter((e) => {
      const diff = Math.abs(new Date(e.date).getTime() - current);
      return diff < THIRTY_DAYS_MS;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- events is a static module import
  }, [currentSnapshot.date]);

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= prices.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, prices.length]);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const setIndex = useCallback((i: number) => setCurrentIndex(Math.max(0, Math.min(i, prices.length - 1))), [prices.length]);

  return {
    prices,
    events,
    currentIndex,
    currentSnapshot,
    nearbyEvents,
    dateRange,
    playing,
    speed,
    togglePlay,
    setSpeed,
    setIndex,
    totalSnapshots: prices.length,
  };
}
