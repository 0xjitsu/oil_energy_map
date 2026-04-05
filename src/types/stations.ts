export type StationStatus = 'operational' | 'low-supply' | 'out-of-stock' | 'closed';

export interface GasStation {
  id: string;
  brand: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  address: string;
  fuelTypes?: string[];
  region?: string;
  source: {
    url: string;
    scrapedAt: string;
  };
  status?: StationStatus;
}

/** Brand colors matching the existing MarketPlayer palette where possible */
export const BRAND_COLORS: Record<string, string> = {
  Petron: '#3b82f6',   // blue
  Shell: '#facc15',    // yellow
  Caltex: '#ef4444',   // red
  Phoenix: '#f97316',  // orange
  SeaOil: '#8b5cf6',   // purple (matches players.ts)
  Unioil: '#22c55e',   // green
  FlyingV: '#06b6d4',  // cyan
  Total: '#ec4899',    // pink
  Jetti: '#14b8a6',    // teal
  PTT: '#a855f7',      // violet
  Other: '#94a3b8',    // slate
};

export const STATUS_COLORS: Record<StationStatus, string> = {
  operational: '#10B981',
  'low-supply': '#F59E0B',
  'out-of-stock': '#EF4444',
  closed: '#6B7280',
};

export const STATUS_LABELS: Record<StationStatus, string> = {
  operational: 'Operational',
  'low-supply': 'Low Supply',
  'out-of-stock': 'Out of Stock',
  closed: 'Closed',
};
