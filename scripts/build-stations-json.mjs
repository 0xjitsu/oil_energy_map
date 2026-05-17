import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STATIONS_DIR = join(here, '../src/data/stations');
const OUT = join(here, '../public/data/stations.json');

const BRAND_FILES = ['petron', 'shell', 'caltex', 'phoenix', 'seaoil', 'unioil', 'others'];

const all = [];
for (const brand of BRAND_FILES) {
  const raw = readFileSync(join(STATIONS_DIR, `${brand}.json`), 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) {
    throw new Error(`[build-stations] ${brand}.json is not a JSON array`);
  }
  all.push(...arr);
}

if (all.length < 10000) {
  throw new Error(`[build-stations] expected >=10000 stations, got ${all.length}`);
}

// The filter UI (BRAND_LIST in src/data/stations/index.ts) only exposes 6 named
// brands plus an "Other" bucket. Remap any other raw OSM brand to "Other" so the
// station-filter `visibleBrands.has(s.brand)` check can reach every station.
const NAMED_BRANDS = new Set(['Petron', 'Shell', 'Caltex', 'Phoenix', 'SeaOil', 'Unioil']);
let remapped = 0;
for (const s of all) {
  if (!NAMED_BRANDS.has(s.brand)) {
    if (s.brand !== 'Other') remapped += 1;
    s.brand = 'Other';
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(all));
console.log(
  `[build-stations] wrote ${all.length} stations to public/data/stations.json ` +
    `(${remapped} non-canonical brands remapped to "Other")`,
);
