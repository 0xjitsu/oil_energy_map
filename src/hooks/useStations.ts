'use client';

import { useState, useEffect } from 'react';
import type { GasStation, StationStatus } from '@/types/stations';
import { assignStationStatus } from '@/lib/station-status';

export interface StationsData {
  stations: GasStation[];
  statusCounts: Record<StationStatus, number>;
}

const EMPTY_COUNTS: Record<StationStatus, number> = {
  operational: 0,
  'low-supply': 0,
  'out-of-stock': 0,
  closed: 0,
};

/** Pure: assign a deterministic status to each station and tally the counts. */
export function buildStationsData(raw: GasStation[]): StationsData {
  const stations = raw.map((s) => ({
    ...s,
    status: assignStationStatus(s.id, s.region ?? ''),
  }));
  const statusCounts: Record<StationStatus, number> = { ...EMPTY_COUNTS };
  for (const s of stations) {
    if (s.status) statusCounts[s.status]++;
  }
  return { stations, statusCounts };
}

/** Module-level singleton — the fetch runs once and every caller shares the result. */
let stationsPromise: Promise<StationsData> | null = null;

function loadStations(): Promise<StationsData> {
  if (stationsPromise) return stationsPromise;
  stationsPromise = fetch('/data/stations.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((raw: GasStation[]) => buildStationsData(raw))
    .catch((err) => {
      // Reset so a later mount can retry.
      stationsPromise = null;
      throw err;
    });
  return stationsPromise;
}

/** Fetch the station dataset once on mount. Returns empty data while loading or on error. */
export function useStations() {
  const [data, setData] = useState<StationsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadStations()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    stations: data?.stations ?? [],
    statusCounts: data?.statusCounts ?? EMPTY_COUNTS,
    loading: data === null && !error,
    error,
  };
}
