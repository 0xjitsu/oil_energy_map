import { PriceBenchmark } from '@/types';

// Static fallback values — used when live APIs are unreachable.
// These should approximate recent market prices so the dashboard
// looks reasonable even without live data.
export const priceBenchmarks: PriceBenchmark[] = [
  // Dubai/MOPS fallbacks are static literals derived from the Brent fallback
  // below using the SAME spreads the live route applies (priceSources.ts:
  // Dubai = Brent + 2.50, MOPS gasoline = Brent + 13.50, MOPS diesel = Brent + 17.00),
  // so the static snapshot stays internally coherent.
  {
    id: 'dubai-crude',
    name: 'Dubai Crude',
    value: 95.59,
    previousWeek: 94.55,
    unit: '$/bbl',
    tooltip: 'Asia-Pacific benchmark. What PH pays for raw oil.',
  },
  // Brent fallback pinned to the curated weekly history tail
  // (src/data/price-history.ts, Yahoo Finance BZ=F weekly closes — source
  // URL cited in that file's header): week 2026-06-01 close 93.09,
  // week 2026-05-25 close 92.05.
  {
    id: 'brent-crude',
    name: 'Brent Crude',
    value: 93.09,
    previousWeek: 92.05,
    unit: '$/bbl',
    tooltip: 'Global benchmark. Tracks ICE Brent futures.',
  },
  {
    id: 'mops-gasoline',
    name: 'MOPS Gasoline (95)',
    value: 106.59,
    previousWeek: 105.55,
    unit: '$/bbl',
    tooltip: 'Singapore gasoline benchmark. Directly sets PH pump price.',
  },
  {
    id: 'mops-diesel',
    name: 'MOPS Diesel',
    value: 110.09,
    previousWeek: 109.05,
    unit: '$/bbl',
    tooltip: 'Singapore diesel benchmark. Affects jeepney fares, food delivery, agriculture.',
  },
  // USD/PHP weekly closes for the same two weeks as the Brent fallback:
  // week 2026-06-01 closed 61.35 (Fri 2026-06-05), week 2026-05-25 closed
  // 60.72 (Fri 2026-05-29). Yahoo Finance PHP=X daily closes:
  // https://query1.finance.yahoo.com/v8/finance/chart/PHP=X?range=3mo&interval=1d
  // (retrieved 2026-06-11; the 1wk bar for the 05-25 week is corrupted on
  // Yahoo's side — a 16.20 bad tick — so both weeks were verified against
  // the daily series; the 06-01 weekly bar close 61.352 matches.)
  {
    id: 'php-usd',
    name: 'PHP/USD',
    value: 61.35,
    previousWeek: 60.72,
    unit: '₱/$',
    tooltip: 'Peso-dollar exchange rate. Higher = more expensive oil imports.',
  },
  // DOE NCR common prices (RON95 / Diesel), week of June 2-8, 2026;
  // previousWeek from the May 26 - June 1, 2026 issue.
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/ncr-price-monitoring-for-june-2-8-2026-pdf-1 (retrieved 2026-06-10)
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/ncr-price-monitoring-05262026-pdf (retrieved 2026-06-10)
  {
    id: 'pump-gasoline',
    name: 'Pump Gasoline',
    value: 75.90,
    previousWeek: 82.90,
    unit: '₱/liter',
    tooltip: 'RON 95 unleaded in Metro Manila. Source: DOE Oil Monitor weekly SRP.',
  },
  {
    id: 'pump-diesel',
    name: 'Pump Diesel',
    value: 76.20,
    previousWeek: 82.70,
    unit: '₱/liter',
    tooltip: 'Diesel in Metro Manila. Source: DOE Oil Monitor weekly SRP.',
  },
  {
    id: 'sg-refining-margin',
    name: 'SG Refining Margin',
    value: 15.3,
    previousWeek: 15.3,
    unit: '$/bbl',
    tooltip: 'Average gasoline/diesel crack spread over Brent.',
  },
];

// ── Data-integrity guard ────────────────────────────────────────────────────
// Runs at module load (prices.ts is imported by DataProvider). Hard-fails if a
// required benchmark is missing or a pump price drifts outside a sane band —
// prevents silently shipping stale/implausible fallback data.
const REQUIRED_BENCHMARK_IDS = ['brent-crude', 'php-usd', 'pump-gasoline', 'pump-diesel'] as const;
const _benchmarkIds = new Set(priceBenchmarks.map((b) => b.id));
for (const id of REQUIRED_BENCHMARK_IDS) {
  if (!_benchmarkIds.has(id)) {
    throw new Error(`prices.ts: required benchmark "${id}" is missing`);
  }
}
// The ₱110 ceiling guards the *fallback snapshot* values above (normal-market
// levels) — it sits below the verified 2026 crisis peak (₱153.70/L diesel) on
// purpose, and must be raised consciously if fallbacks are ever refreshed mid-crisis.
for (const id of ['pump-gasoline', 'pump-diesel'] as const) {
  const b = priceBenchmarks.find((x) => x.id === id)!;
  for (const field of ['value', 'previousWeek'] as const) {
    if (b[field] < 30 || b[field] > 110) {
      throw new Error(
        `prices.ts: ${id}.${field} ₱${b[field]}/L is outside the sane band ₱30–110/L`,
      );
    }
  }
}
