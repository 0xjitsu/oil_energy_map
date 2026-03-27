import type { GasStation } from '@/types/stations';

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

export const allStations: GasStation[] = Object.values(stationsByBrand).flat();
