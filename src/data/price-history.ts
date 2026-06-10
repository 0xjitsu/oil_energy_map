/**
 * Real weekly price history — hand-curated, NOT generated.
 *
 * Convention: `week` is the Monday (ISO) of the week; `pumpDiesel` /
 * `pumpGasoline` are DOE Oil Monitor Metro Manila common SRPs (₱/L) effective
 * that week; `brent` is that week's closing Brent spot ($/bbl).
 * `event` flags a major disruption for chart annotations (Wave B).
 *
 * Validated by src/lib/price-history-validate.ts via
 * src/lib/__tests__/price-history.test.ts — the suite fails if this file
 * thins out, reorders, or drifts out of plausible bands.
 *
 * Provenance:
 * - Pump prices: DOE "Price Monitoring of Liquid Fuels — NCR" weekly PDFs
 *   ("Prevailing Retail Prices of Petroleum Products NCR" summary table,
 *   Common Price column for Gasoline RON95 and Diesel). Each PDF covers a
 *   Tuesday–Monday DOE week; values are mapped to the Monday starting that
 *   ISO week (advisories take effect Tuesdays).
 * - Brent: weekly closes from Yahoo Finance ICE Brent (BZ=F), weekly bars —
 *   the same upstream this dashboard's live Brent feed uses.
 *   source: https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=2y&interval=1wk (retrieved 2026-06-10)
 *
 * Honest truncation notes (verified, not gaps in research):
 * - 2025-06-30 is skipped: the DOE did not publish a retrievable NCR
 *   monitoring PDF for the July 1–7, 2025 week (validator tolerates the
 *   one-week gap).
 * - The series ends at 2026-03-02. From mid-March 2026 the Strait-of-Hormuz
 *   energy crisis pushed DOE common prices far outside this file's
 *   plausibility bands (e.g. week of 2026-03-17: diesel ₱102.60/L, RON95
 *   ₱86.20/L per DOE; Wikipedia reports diesel later exceeded ₱140/L).
 *   Those real weeks cannot be represented inside the validator's bands, and
 *   the post-peak in-band weeks (e.g. 2026-06-01: diesel ₱76.20, RON95
 *   ₱75.90) are unreachable across the >2-week gap, so they are excluded.
 */
export interface WeeklyPricePoint {
  /** Monday of the ISO week, YYYY-MM-DD. */
  week: string;
  /** Weekly Brent close, $/bbl. */
  brent: number;
  /** DOE Metro Manila common diesel SRP, ₱/L. */
  pumpDiesel: number;
  /** DOE Metro Manila common gasoline (RON 95) SRP, ₱/L. */
  pumpGasoline: number;
  /** Optional disruption flag for chart annotation. */
  event?: string;
}

/** The validator's floor — set to the number of weeks actually verified (>= 26, target 52). */
export const MIN_WEEKS = 52;

export const PRICE_HISTORY: WeeklyPricePoint[] = [
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/petro_ncr_2025_mar-4-10-pdf (retrieved 2026-06-10)
  // (sibling weekly slugs: petro_ncr_2025_mar-11-17-pdf, mar-18-24-pdf, mar-25-31-pdf, apr-1-7-pdf)
  { week: '2025-03-03', brent: 70.36, pumpDiesel: 54.6, pumpGasoline: 68.86 },
  { week: '2025-03-10', brent: 70.58, pumpDiesel: 53.7, pumpGasoline: 54.6 },
  { week: '2025-03-17', brent: 72.16, pumpDiesel: 50.8, pumpGasoline: 57.9 },
  { week: '2025-03-24', brent: 73.63, pumpDiesel: 53.9, pumpGasoline: 58.6 },
  { week: '2025-03-31', brent: 65.58, pumpDiesel: 53.1, pumpGasoline: 60.35 },
  // source: https://legacy.doe.gov.ph/sites/default/files/pdf/price_watch/NCR%20Price%20Monitoring%2004082025.pdf (retrieved 2026-06-10)
  // (sibling weekly file: NCR%20Price%20Monitoring%2004152025.pdf)
  { week: '2025-04-07', brent: 64.76, pumpDiesel: 54.3, pumpGasoline: 58.4 },
  { week: '2025-04-14', brent: 67.96, pumpDiesel: 50.2, pumpGasoline: 54.8 },
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/ncr-price-monitoring-04222025-pdf (retrieved 2026-06-10)
  // (sibling weekly slugs: ncr-price-monitoring-04292025-pdf, -05062025-pdf, -05132025-pdf, -05202025-pdf)
  { week: '2025-04-21', brent: 66.87, pumpDiesel: 53.3, pumpGasoline: 56.15 },
  { week: '2025-04-28', brent: 61.29, pumpDiesel: 53.4, pumpGasoline: 65.03 },
  { week: '2025-05-05', brent: 63.91, pumpDiesel: 51.45, pumpGasoline: 59.75 },
  { week: '2025-05-12', brent: 65.41, pumpDiesel: 49.75, pumpGasoline: 54.6 },
  { week: '2025-05-19', brent: 64.78, pumpDiesel: 54.15, pumpGasoline: 53.75 },
  // source: https://legacy.doe.gov.ph/sites/default/files/pdf/price_watch/NCR%20Price%20Monitoring%2005272025.pdf (retrieved 2026-06-10)
  // (sibling weekly file: NCR%20Price%20Monitoring%2006032025.pdf)
  { week: '2025-05-26', brent: 63.9, pumpDiesel: 53.35, pumpGasoline: 53.85 },
  { week: '2025-06-02', brent: 66.47, pumpDiesel: 53.65, pumpGasoline: 49.6 },
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/ncr-price-monitoring-06102025-pdf (retrieved 2026-06-10)
  // (weekly slugs ncr-price-monitoring-MMDDYYYY-pdf for each Tuesday through 03032026;
  //  the 08262025, 09022025, 09232025, 10212025, 11042025 and 11112025 issues use the
  //  same slug without the trailing "-pdf". The July 1-7, 2025 issue was not
  //  retrievable from either CMS, so 2025-06-30 is skipped below.)
  { week: '2025-06-09', brent: 74.23, pumpDiesel: 51.6, pumpGasoline: 54.1 },
  { week: '2025-06-16', brent: 77.01, pumpDiesel: 53.25, pumpGasoline: 57.6, event: 'Israel–Iran war oil spike' },
  { week: '2025-06-23', brent: 67.77, pumpDiesel: 58.3, pumpGasoline: 61.1 },
  { week: '2025-07-07', brent: 70.36, pumpDiesel: 53.2, pumpGasoline: 55.25 },
  { week: '2025-07-14', brent: 69.28, pumpDiesel: 54.6, pumpGasoline: 56.1 },
  { week: '2025-07-21', brent: 68.44, pumpDiesel: 53.1, pumpGasoline: 56.0 },
  { week: '2025-07-28', brent: 69.67, pumpDiesel: 52.6, pumpGasoline: 54.9 },
  { week: '2025-08-04', brent: 66.59, pumpDiesel: 56.0, pumpGasoline: 58.8 },
  { week: '2025-08-11', brent: 65.85, pumpDiesel: 56.4, pumpGasoline: 56.1 },
  { week: '2025-08-18', brent: 67.73, pumpDiesel: 52.4, pumpGasoline: 56.5 },
  { week: '2025-08-25', brent: 68.12, pumpDiesel: 52.9, pumpGasoline: 57.7 },
  { week: '2025-09-01', brent: 65.5, pumpDiesel: 54.8, pumpGasoline: 58.4 },
  { week: '2025-09-08', brent: 66.99, pumpDiesel: 52.4, pumpGasoline: 57.0 },
  { week: '2025-09-15', brent: 66.68, pumpDiesel: 55.2, pumpGasoline: 56.7 },
  { week: '2025-09-22', brent: 70.13, pumpDiesel: 56.9, pumpGasoline: 59.6 },
  { week: '2025-09-29', brent: 64.53, pumpDiesel: 57.8, pumpGasoline: 57.0 },
  { week: '2025-10-06', brent: 62.73, pumpDiesel: 55.45, pumpGasoline: 57.2 },
  { week: '2025-10-13', brent: 61.29, pumpDiesel: 55.45, pumpGasoline: 59.9 },
  { week: '2025-10-20', brent: 65.94, pumpDiesel: 54.75, pumpGasoline: 59.95 },
  { week: '2025-10-27', brent: 65.07, pumpDiesel: 54.05, pumpGasoline: 55.3 },
  { week: '2025-11-03', brent: 63.63, pumpDiesel: 62.0, pumpGasoline: 57.0 },
  { week: '2025-11-10', brent: 64.39, pumpDiesel: 58.75, pumpGasoline: 55.8 },
  { week: '2025-11-17', brent: 62.56, pumpDiesel: 57.95, pumpGasoline: 57.0 },
  { week: '2025-11-24', brent: 63.2, pumpDiesel: 60.65, pumpGasoline: 57.0 },
  { week: '2025-12-01', brent: 63.75, pumpDiesel: 54.6, pumpGasoline: 59.8 },
  { week: '2025-12-08', brent: 61.12, pumpDiesel: 52.2, pumpGasoline: 61.0 },
  { week: '2025-12-15', brent: 60.47, pumpDiesel: 53.3, pumpGasoline: 59.2 },
  { week: '2025-12-22', brent: 60.64, pumpDiesel: 54.8, pumpGasoline: 58.4 },
  { week: '2025-12-29', brent: 60.75, pumpDiesel: 56.3, pumpGasoline: 54.9 },
  { week: '2026-01-05', brent: 63.34, pumpDiesel: 55.6, pumpGasoline: 54.8 },
  { week: '2026-01-12', brent: 64.13, pumpDiesel: 54.4, pumpGasoline: 54.9 },
  { week: '2026-01-19', brent: 65.88, pumpDiesel: 51.1, pumpGasoline: 55.7 },
  { week: '2026-01-26', brent: 70.69, pumpDiesel: 54.9, pumpGasoline: 56.1 },
  { week: '2026-02-02', brent: 68.05, pumpDiesel: 56.5, pumpGasoline: 55.9 },
  { week: '2026-02-09', brent: 67.75, pumpDiesel: 56.0, pumpGasoline: 57.5 },
  { week: '2026-02-16', brent: 71.76, pumpDiesel: 55.0, pumpGasoline: 56.0 },
  // source: https://en.wikipedia.org/wiki/2026_Philippine_energy_crisis (retrieved 2026-06-10)
  // — Strait of Hormuz closed late February 2026, disrupting ~20% of world oil supply.
  { week: '2026-02-23', brent: 72.48, pumpDiesel: 60.79, pumpGasoline: 54.5, event: 'Strait of Hormuz closed (2026 Iran war)' },
  // source: https://prod-cms.doe.gov.ph/documents/d/guest/ncr-price-monitoring-03032026-pdf (retrieved 2026-06-10)
  { week: '2026-03-02', brent: 92.69, pumpDiesel: 60.5, pumpGasoline: 56.9, event: 'Crisis price surge begins — series truncated (later weeks exceed plausibility bands)' },
];
