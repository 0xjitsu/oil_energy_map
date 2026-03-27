/**
 * Philippine region definitions with approximate bounding boxes
 * Based on PSGC (Philippine Standard Geographic Code) regions
 */

export interface RegionBounds {
  name: string;
  shortName: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

/**
 * Region bounding boxes ordered from most specific (smallest area) to least specific.
 * NCR and CAR are checked first since they overlap with Region III / Region I.
 */
export const REGIONS: RegionBounds[] = [
  // Check NCR first — it's a small area inside Region III/IV-A
  { name: 'NCR (Metro Manila)', shortName: 'NCR', latMin: 14.35, latMax: 14.78, lngMin: 120.90, lngMax: 121.15 },
  // CAR overlaps with Region I and II
  { name: 'CAR (Cordillera)', shortName: 'CAR', latMin: 16.5, latMax: 18.5, lngMin: 120.5, lngMax: 121.5 },
  // Luzon regions
  { name: 'Region I (Ilocos)', shortName: 'Region I', latMin: 15.5, latMax: 18.6, lngMin: 119.5, lngMax: 121.0 },
  { name: 'Region II (Cagayan Valley)', shortName: 'Region II', latMin: 15.5, latMax: 18.7, lngMin: 121.0, lngMax: 122.5 },
  { name: 'Region III (Central Luzon)', shortName: 'Region III', latMin: 14.5, latMax: 16.0, lngMin: 119.5, lngMax: 121.5 },
  { name: 'Region IV-A (CALABARZON)', shortName: 'Region IV-A', latMin: 13.5, latMax: 14.8, lngMin: 120.5, lngMax: 122.2 },
  { name: 'Region IV-B (MIMAROPA)', shortName: 'Region IV-B', latMin: 8.5, latMax: 13.5, lngMin: 117.5, lngMax: 122.5 },
  { name: 'Region V (Bicol)', shortName: 'Region V', latMin: 11.5, latMax: 14.5, lngMin: 122.5, lngMax: 124.5 },
  // Visayas
  { name: 'Region VI (Western Visayas)', shortName: 'Region VI', latMin: 9.5, latMax: 12.0, lngMin: 121.5, lngMax: 123.5 },
  { name: 'Region VII (Central Visayas)', shortName: 'Region VII', latMin: 9.0, latMax: 11.5, lngMin: 123.0, lngMax: 124.5 },
  { name: 'Region VIII (Eastern Visayas)', shortName: 'Region VIII', latMin: 9.5, latMax: 12.5, lngMin: 124.0, lngMax: 126.0 },
  // Mindanao
  { name: 'Region IX (Zamboanga Peninsula)', shortName: 'Region IX', latMin: 6.5, latMax: 9.0, lngMin: 121.5, lngMax: 123.5 },
  { name: 'Region X (Northern Mindanao)', shortName: 'Region X', latMin: 7.5, latMax: 9.5, lngMin: 123.0, lngMax: 125.5 },
  { name: 'Region XI (Davao)', shortName: 'Region XI', latMin: 5.5, latMax: 8.0, lngMin: 125.0, lngMax: 127.0 },
  { name: 'Region XII (SOCCSKSARGEN)', shortName: 'Region XII', latMin: 5.5, latMax: 7.5, lngMin: 124.0, lngMax: 126.0 },
  { name: 'Region XIII (Caraga)', shortName: 'Region XIII', latMin: 7.5, latMax: 10.0, lngMin: 125.0, lngMax: 126.5 },
  { name: 'BARMM', shortName: 'BARMM', latMin: 5.5, latMax: 8.5, lngMin: 119.5, lngMax: 124.5 },
];

/** Sorted region names for UI display */
export const REGION_NAMES: string[] = REGIONS.map((r) => r.name).sort();

/**
 * Returns the region name for given coordinates using bounding box lookup.
 * Checks smaller/more-specific regions first (NCR, CAR) before larger overlapping ones.
 */
export function getRegionForCoordinates(lat: number, lng: number): string {
  for (const r of REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
      return r.name;
    }
  }
  return 'Unknown';
}
