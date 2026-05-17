import { PriceBenchmark } from '@/types';

// Static fallback values — used when live APIs are unreachable.
// These should approximate recent market prices so the dashboard
// looks reasonable even without live data.
export const priceBenchmarks: PriceBenchmark[] = [
  {
    id: 'dubai-crude',
    name: 'Dubai Crude',
    value: 110.50,
    previousWeek: 108.20,
    unit: '$/bbl',
    tooltip: 'Asia-Pacific benchmark. What PH pays for raw oil.',
  },
  {
    id: 'brent-crude',
    name: 'Brent Crude',
    value: 107.90,
    previousWeek: 105.80,
    unit: '$/bbl',
    tooltip: 'Global benchmark. Tracks ICE Brent futures.',
  },
  {
    id: 'mops-gasoline',
    name: 'MOPS Gasoline (95)',
    value: 121.40,
    previousWeek: 119.30,
    unit: '$/bbl',
    tooltip: 'Singapore gasoline benchmark. Directly sets PH pump price.',
  },
  {
    id: 'mops-diesel',
    name: 'MOPS Diesel',
    value: 124.90,
    previousWeek: 122.80,
    unit: '$/bbl',
    tooltip: 'Singapore diesel benchmark. Affects jeepney fares, food delivery, agriculture.',
  },
  {
    id: 'php-usd',
    name: 'PHP/USD',
    value: 60.56,
    previousWeek: 60.25,
    unit: '₱/$',
    tooltip: 'Peso-dollar exchange rate. Higher = more expensive oil imports.',
  },
  {
    id: 'pump-gasoline',
    name: 'Pump Gasoline',
    value: 63.20,
    previousWeek: 62.05,
    unit: '₱/liter',
    tooltip: 'RON 95 unleaded in Metro Manila. Source: DOE Oil Monitor weekly SRP.',
  },
  {
    id: 'pump-diesel',
    name: 'Pump Diesel',
    value: 59.40,
    previousWeek: 60.10,
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
for (const id of ['pump-gasoline', 'pump-diesel'] as const) {
  const b = priceBenchmarks.find((x) => x.id === id)!;
  if (b.value < 30 || b.value > 110) {
    throw new Error(
      `prices.ts: ${id} fallback value ₱${b.value}/L is outside the sane band ₱30–110/L`,
    );
  }
}
