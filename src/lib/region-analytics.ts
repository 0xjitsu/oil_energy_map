import { allStations } from '@/data/stations';
import { facilities } from '@/data/facilities';
import { BRAND_COLORS } from '@/types/stations';
import type { Facility } from '@/types';

export interface RegionAnalytics {
  regionName: string;
  stationCount: number;
  brandBreakdown: { brand: string; count: number; color: string }[];
  nearestTerminal: { name: string; distanceKm: number } | null;
  nearestDepot: { name: string; distanceKm: number } | null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest(
  centerLat: number,
  centerLng: number,
  allFacilities: Facility[],
  type: string,
): { name: string; distanceKm: number } | null {
  const filtered = allFacilities.filter((f) => f.type === type);
  if (filtered.length === 0) return null;

  let nearest = filtered[0];
  let minDist = haversineKm(centerLat, centerLng, nearest.coordinates[0], nearest.coordinates[1]);

  for (let i = 1; i < filtered.length; i++) {
    const d = haversineKm(centerLat, centerLng, filtered[i].coordinates[0], filtered[i].coordinates[1]);
    if (d < minDist) {
      minDist = d;
      nearest = filtered[i];
    }
  }

  return { name: nearest.name, distanceKm: Math.round(minDist) };
}

export function computeRegionAnalytics(regionName: string): RegionAnalytics {
  const stations = allStations.filter((s) => s.region === regionName);

  const brandCounts = new Map<string, number>();
  for (const s of stations) {
    brandCounts.set(s.brand, (brandCounts.get(s.brand) ?? 0) + 1);
  }
  const brandBreakdown = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count, color: BRAND_COLORS[brand] ?? BRAND_COLORS.Other }))
    .sort((a, b) => b.count - a.count);

  let centerLat = 12,
    centerLng = 122;
  if (stations.length > 0) {
    centerLat = stations.reduce((s, st) => s + st.coordinates[0], 0) / stations.length;
    centerLng = stations.reduce((s, st) => s + st.coordinates[1], 0) / stations.length;
  }

  return {
    regionName,
    stationCount: stations.length,
    brandBreakdown,
    nearestTerminal: findNearest(centerLat, centerLng, facilities, 'terminal'),
    nearestDepot: findNearest(centerLat, centerLng, facilities, 'depot'),
  };
}
