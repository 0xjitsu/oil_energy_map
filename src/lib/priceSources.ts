/**
 * Real price data fetchers for oil benchmarks and forex.
 *
 * Sources:
 *   - Brent Crude: Yahoo Finance chart API (BZ=F futures, unauthenticated)
 *   - PHP/USD Forex: FloatRates (free, no key, daily updates)
 *   - Pump prices: Derived from Brent + forex using PH import parity formula
 *
 * Each fetcher returns null on failure so callers can fall back to static data.
 */

const FETCH_TIMEOUT = 5_000; // 5 seconds

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ── Brent Crude (Yahoo Finance) ─────────────────────────────────────────────

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        currency: string;
      };
    }>;
  };
}

export interface BrentPrice {
  value: number;
  previousClose: number;
}

export async function fetchBrentPrice(): Promise<BrentPrice | null> {
  try {
    const url =
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d';
    const res = await fetch(url, {
      signal: withTimeout(FETCH_TIMEOUT),
      headers: { 'User-Agent': 'ph-oil-intel/1.0' },
    });
    if (!res.ok) return null;

    const data: YahooChartResult = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    return {
      value: Number(meta.regularMarketPrice.toFixed(2)),
      previousClose: Number(meta.chartPreviousClose.toFixed(2)),
    };
  } catch {
    return null;
  }
}

// ── Dubai Crude (derived from Brent with typical spread) ────────────────────

// Dubai trades at a premium/discount to Brent depending on market conditions.
// Historically the spread is ±$2-5/bbl. We use Brent as base and apply
// the current approximate spread.
const DUBAI_BRENT_SPREAD = 2.5; // Dubai typically $2-3 above Brent in Asian markets

export interface DubaiPrice {
  value: number;
  previousClose: number;
}

export function deriveDubaiFromBrent(brent: BrentPrice): DubaiPrice {
  return {
    value: Number((brent.value + DUBAI_BRENT_SPREAD).toFixed(2)),
    previousClose: Number((brent.previousClose + DUBAI_BRENT_SPREAD).toFixed(2)),
  };
}

// ── PHP/USD Forex (FloatRates) ──────────────────────────────────────────────

interface FloatRateEntry {
  code: string;
  rate: number;
  date: string;
  inverseRate: number;
}

export interface ForexRate {
  value: number; // PHP per 1 USD
  date: string;
}

export async function fetchForexRate(): Promise<ForexRate | null> {
  try {
    const url = 'https://www.floatrates.com/daily/usd.json';
    const res = await fetch(url, { signal: withTimeout(FETCH_TIMEOUT) });
    if (!res.ok) return null;

    const data: Record<string, FloatRateEntry> = await res.json();
    const php = data?.php;
    if (!php?.rate) return null;

    return {
      value: Number(php.rate.toFixed(2)),
      date: php.date,
    };
  } catch {
    return null;
  }
}

// ── MOPS & Pump Prices (derived from Brent + Forex) ────────────────────────

// Philippine pump prices follow import parity pricing:
//   Pump Price = (MOPS benchmark × forex rate / 159) + taxes + margins
//
// MOPS benchmarks track Brent with a crack spread:
//   MOPS Gasoline ≈ Brent + $12-15/bbl (gasoline crack spread)
//   MOPS Diesel ≈ Brent + $15-20/bbl (diesel crack spread)
//
// Pump price formula (per liter):
//   Base = MOPS × forex / 159 (barrels to liters)
//   + Excise tax: ₱10/L gasoline, ₱6/L diesel
//   + VAT: 12%
//   + Dealer margin: ₱2-3/L

const GASOLINE_CRACK_SPREAD = 13.5; // $/bbl above Brent
const DIESEL_CRACK_SPREAD = 17.0;   // $/bbl above Brent
const LITERS_PER_BARREL = 159;
const GASOLINE_EXCISE = 10;  // ₱/L
const DIESEL_EXCISE = 6;     // ₱/L
const VAT_RATE = 0.12;
const DEALER_MARGIN = 2.5;   // ₱/L

export interface DerivedPumpPrices {
  mopsGasoline: number;    // $/bbl
  mopsDiesel: number;      // $/bbl
  pumpGasoline: number;    // ₱/L
  pumpDiesel: number;      // ₱/L
  refiningMargin: number;  // $/bbl (average of gas + diesel crack)
}

export function derivePumpPrices(
  brentUsd: number,
  phpPerUsd: number,
): DerivedPumpPrices {
  const mopsGasoline = brentUsd + GASOLINE_CRACK_SPREAD;
  const mopsDiesel = brentUsd + DIESEL_CRACK_SPREAD;

  // Convert from $/bbl to ₱/L, then add taxes and margins
  const gasBase = (mopsGasoline * phpPerUsd) / LITERS_PER_BARREL;
  const dieselBase = (mopsDiesel * phpPerUsd) / LITERS_PER_BARREL;

  const pumpGasoline =
    (gasBase + GASOLINE_EXCISE + DEALER_MARGIN) * (1 + VAT_RATE);
  const pumpDiesel =
    (dieselBase + DIESEL_EXCISE + DEALER_MARGIN) * (1 + VAT_RATE);

  return {
    mopsGasoline: Number(mopsGasoline.toFixed(2)),
    mopsDiesel: Number(mopsDiesel.toFixed(2)),
    pumpGasoline: Number(pumpGasoline.toFixed(2)),
    pumpDiesel: Number(pumpDiesel.toFixed(2)),
    refiningMargin: Number(((GASOLINE_CRACK_SPREAD + DIESEL_CRACK_SPREAD) / 2).toFixed(1)),
  };
}
