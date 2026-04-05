import type { GasStation, StationStatus } from '@/types/stations';
import { assignStationStatus } from '@/lib/station-status';

import petronStations from './petron.json';
import shellStations from './shell.json';
import caltexStations from './caltex.json';
import phoenixStations from './phoenix.json';
import seaoilStations from './seaoil.json';
import unioilStations from './unioil.json';
import othersStations from './others.json';

export const stationsByBrand: Record<string, GasStation[]> = {
  Petron: petronStations as GasStation[],
  Shell: shellStations as GasStation[],
  Caltex: caltexStations as GasStation[],
  Phoenix: phoenixStations as GasStation[],
  SeaOil: seaoilStations as GasStation[],
  Unioil: unioilStations as GasStation[],
  Other: othersStations as GasStation[],
};

export const BRAND_LIST = Object.keys(stationsByBrand);

// Apply status assignment to all stations
export const allStations: GasStation[] = Object.values(stationsByBrand)
  .flat()
  .map((s) => ({
    ...s,
    status: assignStationStatus(s.id, s.region ?? ''),
  }));

// Pre-computed status counts for stat cards
export const statusCounts: Record<StationStatus, number> = {
  operational: 0,
  'low-supply': 0,
  'out-of-stock': 0,
  closed: 0,
};
for (const s of allStations) {
  if (s.status) statusCounts[s.status]++;
}
