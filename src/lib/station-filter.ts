import type { GasStation, StationStatus } from '@/types/stations';

export interface StationFilterCriteria {
  visibleBrands: Set<string>;
  selectedRegion: string | null;
  statusFilter: StationStatus | 'all';
}

/** Single source of truth for station filtering — used by the map layer and the count display. */
export function filterStations(
  stations: GasStation[],
  { visibleBrands, selectedRegion, statusFilter }: StationFilterCriteria,
): GasStation[] {
  return stations.filter(
    (s) =>
      visibleBrands.has(s.brand) &&
      (!selectedRegion || s.region === selectedRegion) &&
      (statusFilter === 'all' || s.status === statusFilter),
  );
}
