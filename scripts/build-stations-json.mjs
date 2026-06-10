import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STATIONS_DIR = join(here, '../src/data/stations');
const OUT_DIR = join(here, '../public/data/stations');
const LEGACY_OUT = join(here, '../public/data/stations.json');
const MANIFEST = join(here, '../src/data/stations-manifest.json');

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

// ── Slim the runtime payload ────────────────────────────────────────────────
// - drop `source` (provenance object — nothing in src/ reads station.source;
//   provenance stays in the committed src/data/stations/*.json originals)
// - drop empty `address` strings (StationTooltip renders address only when truthy)
// - truncate coordinates to 5 decimals (~1.1 m — far below marker precision)
const round5 = (n) => Math.round(n * 1e5) / 1e5;
for (const s of all) {
  delete s.source;
  if (!s.address) delete s.address;
  s.coordinates = [round5(s.coordinates[0]), round5(s.coordinates[1])];
}

// ── Content-hashed output + committed manifest ─────────────────────────────
// The hash is over the final payload, so the URL changes iff the data changes;
// vercel.json serves /data/stations/* with a 1-year immutable Cache-Control.
const json = JSON.stringify(all);
const hash = createHash('sha1').update(json).digest('hex').slice(0, 10);

rmSync(OUT_DIR, { recursive: true, force: true }); // clear stale hashed files
rmSync(LEGACY_OUT, { force: true });               // remove the old un-hashed output
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `${hash}.json`), json);
writeFileSync(
  MANIFEST,
  JSON.stringify({ file: `/data/stations/${hash}.json`, count: all.length, hash }, null, 2) + '\n',
);

console.log(
  `[build-stations] wrote ${all.length} stations to public/data/stations/${hash}.json ` +
    `(${remapped} non-canonical brands remapped to "Other"); manifest → src/data/stations-manifest.json`,
);
