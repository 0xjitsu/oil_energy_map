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
    value: 65.80,
    previousWeek: 64.50,
    unit: '₱/liter',
    tooltip: 'Estimated pump price for RON 95 unleaded in Metro Manila.',
  },
  {
    id: 'pump-diesel',
    name: 'Pump Diesel',
    value: 60.20,
    previousWeek: 58.90,
    unit: '₱/liter',
    tooltip: 'Estimated pump price for diesel in Metro Manila.',
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
