import { describe, it, expect } from 'vitest';
import { filterStations } from '@/lib/station-filter';
import type { GasStation } from '@/types/stations';

const station = (over: Partial<GasStation>): GasStation => ({
  id: 'x',
  brand: 'Petron',
  name: 'Test',
  coordinates: [12, 122],
  address: '',
  fuelTypes: [],
  region: 'Region V (Bicol)',
  source: { url: '', scrapedAt: '' },
  status: 'operational',
  ...over,
});

const ALL = [
  station({ id: 'a', brand: 'Petron', region: 'Region V (Bicol)', status: 'operational' }),
  station({ id: 'b', brand: 'Shell', region: 'Region V (Bicol)', status: 'low-supply' }),
  station({ id: 'c', brand: 'Petron', region: 'NCR', status: 'closed' }),
];

describe('filterStations', () => {
  it('filters by visible brand', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron']),
      selectedRegion: null,
      statusFilter: 'all',
    });
    expect(result.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('filters by selected region', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: 'NCR',
      statusFilter: 'all',
    });
    expect(result.map((s) => s.id)).toEqual(['c']);
  });

  it('filters by status when not "all"', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: null,
      statusFilter: 'low-supply',
    });
    expect(result.map((s) => s.id)).toEqual(['b']);
  });

  it('returns everything when brands cover all and filters are open', () => {
    const result = filterStations(ALL, {
      visibleBrands: new Set(['Petron', 'Shell']),
      selectedRegion: null,
      statusFilter: 'all',
    });
    expect(result).toHaveLength(3);
  });
});
