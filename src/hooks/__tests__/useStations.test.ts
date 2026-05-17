import { describe, it, expect } from 'vitest';
import { buildStationsData } from '@/hooks/useStations';
import type { GasStation } from '@/types/stations';

const raw = (id: string, region: string): GasStation => ({
  id,
  brand: 'Petron',
  name: 'Test',
  coordinates: [12, 122],
  address: '',
  fuelTypes: [],
  region,
  source: { url: '', scrapedAt: '' },
});

describe('buildStationsData', () => {
  it('assigns a status to every station', () => {
    const { stations } = buildStationsData([raw('a', 'NCR'), raw('b', 'Region V (Bicol)')]);
    expect(stations).toHaveLength(2);
    expect(stations.every((s) => typeof s.status === 'string')).toBe(true);
  });

  it('status counts sum to the input length', () => {
    const input = Array.from({ length: 50 }, (_, i) => raw(`s${i}`, 'NCR'));
    const { statusCounts } = buildStationsData(input);
    const total =
      statusCounts.operational +
      statusCounts['low-supply'] +
      statusCounts['out-of-stock'] +
      statusCounts.closed;
    expect(total).toBe(50);
  });

  it('is deterministic — same input yields same counts', () => {
    const input = Array.from({ length: 30 }, (_, i) => raw(`s${i}`, 'NCR'));
    expect(buildStationsData(input).statusCounts).toEqual(
      buildStationsData(input).statusCounts,
    );
  });
});
