/**
 * Station brand registry.
 *
 * The full 10,469-station dataset is NOT imported here to keep it out of the
 * client bundle. `scripts/build-stations-json.mjs` (prebuild/predev) bundles the
 * per-brand JSON files into a slimmed, content-hashed payload at
 * `public/data/stations/<hash>.json` and writes the committed pointer
 * `src/data/stations-manifest.json`, which the `useStations` hook
 * (`src/hooks/useStations.ts`) imports to fetch the data at runtime.
 */

/** Canonical brand list — used for filter UIs. Order matches the brand JSON files. */
export const BRAND_LIST: string[] = [
  'Petron',
  'Shell',
  'Caltex',
  'Phoenix',
  'SeaOil',
  'Unioil',
  'Other',
];
