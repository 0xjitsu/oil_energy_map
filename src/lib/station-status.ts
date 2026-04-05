import type { StationStatus } from '@/types/stations';

/**
 * Deterministic string hash (djb2) — stable across builds, no crypto needed.
 * Ported from pipedream-policy-brief/src/data/all-stations.ts
 */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Mindanao regions — higher disruption rates (out-of-stock + closed) */
const MINDANAO_REGIONS = new Set([
  'Region IX (Zamboanga Peninsula)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'BARMM',
]);

/** Visayas + remote Luzon — intermittent supply issues */
const LOW_SUPPLY_REGIONS = new Set([
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IV-B (MIMAROPA)',
  'Region V (Bicol)',
]);

/**
 * Assign a simulated status to a station based on its ID hash and region.
 * Uses the same algorithm as pipedream-policy-brief for consistent results.
 *
 * Distribution:
 * - Mindanao: ~10% out-of-stock, ~10% closed, ~80% operational
 * - Low-supply regions: ~8% low-supply, ~92% operational
 * - All others: 100% operational
 */
export function assignStationStatus(stationId: string, region: string): StationStatus {
  const hash = djb2(stationId);

  if (MINDANAO_REGIONS.has(region)) {
    const bucket = hash % 100;
    if (bucket < 10) return 'out-of-stock';
    if (bucket < 20) return 'closed';
    return 'operational';
  }

  if (LOW_SUPPLY_REGIONS.has(region)) {
    const bucket = hash % 100;
    if (bucket < 8) return 'low-supply';
    return 'operational';
  }

  return 'operational';
}

/** Source attribution for non-operational statuses */
export const STATUS_SOURCES: Record<Exclude<StationStatus, 'operational'>, {
  sourceUrl: string;
  reportSource: 'news' | 'official';
  details: string;
}> = {
  'out-of-stock': {
    sourceUrl: 'https://legacy.doe.gov.ph/downstream-oil/lfro-with-valid-coc-lfo',
    reportSource: 'official',
    details: 'DOE downstream oil monitoring — supply depletion reported in region',
  },
  'low-supply': {
    sourceUrl: 'https://legacy.doe.gov.ph/downstream-oil/lfro-with-valid-coc-lfo',
    reportSource: 'official',
    details: 'DOE downstream oil monitoring — intermittent supply reported',
  },
  closed: {
    sourceUrl: 'https://newsinfo.inquirer.net/2044671/fuel-shortages-worsen-in-mindanao',
    reportSource: 'news',
    details: 'Reported closed per regional news coverage of supply disruptions',
  },
};
