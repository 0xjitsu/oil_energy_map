import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildStationsData } from '@/hooks/useStations';
import { BRAND_LIST } from '@/data/stations';
import { filterStations } from '@/lib/station-filter';
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

  it('normalizes non-canonical brands to "Other", keeping canonical brands', () => {
    const { stations } = buildStationsData([
      { ...raw('a', 'NCR'), brand: 'Shell' },
      { ...raw('b', 'NCR'), brand: 'FlyingV' },
      { ...raw('c', 'NCR'), brand: 'PetroGazz' },
    ]);
    expect(stations.map((s) => s.brand)).toEqual(['Shell', 'Other', 'Other']);
  });
});

const BRAND_FILES = ['petron', 'shell', 'caltex', 'phoenix', 'seaoil', 'unioil', 'others'];

/** Mirrors scripts/build-stations-json.mjs — the real source dataset behind useStations. */
function loadRawStations(): GasStation[] {
  const dir = join(process.cwd(), 'src/data/stations');
  return BRAND_FILES.flatMap(
    (f) => JSON.parse(readFileSync(join(dir, `${f}.json`), 'utf8')) as GasStation[],
  );
}

describe('brand filterability (regression)', () => {
  it('folds every brand in the live dataset into BRAND_LIST', () => {
    const { stations } = buildStationsData(loadRawStations());
    const canonical = new Set(BRAND_LIST);
    const unfilterable = [
      ...new Set(stations.filter((s) => !canonical.has(s.brand)).map((s) => s.brand)),
    ];
    expect(unfilterable).toEqual([]);
  });

  it('the default brand filter surfaces every station', () => {
    const { stations } = buildStationsData(loadRawStations());
    const visible = filterStations(stations, {
      visibleBrands: new Set(BRAND_LIST),
      selectedRegion: null,
      statusFilter: 'all',
    });
    expect(visible).toHaveLength(stations.length);
  });
});
