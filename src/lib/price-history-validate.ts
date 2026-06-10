import type { WeeklyPricePoint } from '@/data/price-history';

/** Plausibility bands — a value outside these is a data error, not news. */
const BANDS = {
  pumpDiesel: { min: 40, max: 90 },   // ₱/L
  pumpGasoline: { min: 45, max: 95 }, // ₱/L
  brent: { min: 40, max: 140 },       // $/bbl
} as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Allow up to two consecutive skipped DOE weeks (holiday gaps). */
const MAX_GAP_MS = 3 * WEEK_MS;

/**
 * Pure producer-side sanity validator for the curated weekly price history.
 * Returns a list of human-readable violations — empty means valid. The test
 * suite asserts `[]`, so corrupt or thinned-out data fails the build.
 */
export function validatePriceHistory(
  points: readonly WeeklyPricePoint[],
  minWeeks: number,
): string[] {
  const violations: string[] = [];

  if (points.length < minWeeks) {
    violations.push(`expected >= ${minWeeks} weeks, got ${points.length}`);
  }

  let prevTime = -Infinity;
  points.forEach((p, i) => {
    const at = `entry ${i} (${p.week})`;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.week)) {
      violations.push(`${at}: week is not an ISO date`);
      return;
    }
    const time = Date.parse(`${p.week}T00:00:00Z`);
    if (!Number.isFinite(time)) {
      violations.push(`${at}: unparseable date`);
      return;
    }
    if (new Date(time).getUTCDay() !== 1) {
      violations.push(`${at}: week must be a Monday (ISO week start)`);
    }
    if (time <= prevTime) {
      violations.push(`${at}: weeks must be strictly increasing`);
    } else if (prevTime !== -Infinity && time - prevTime > MAX_GAP_MS) {
      violations.push(`${at}: gap from previous entry exceeds ${MAX_GAP_MS / WEEK_MS} weeks`);
    }
    prevTime = time;

    for (const key of ['brent', 'pumpDiesel', 'pumpGasoline'] as const) {
      const v = p[key];
      const band = BANDS[key];
      if (!Number.isFinite(v)) {
        violations.push(`${at}: ${key} is not finite`);
      } else if (v < band.min || v > band.max) {
        violations.push(`${at}: ${key}=${v} outside band ${band.min}-${band.max}`);
      }
    }

    if (p.event !== undefined && p.event.trim() === '') {
      violations.push(`${at}: event must be omitted, not empty`);
    }
  });

  return violations;
}
