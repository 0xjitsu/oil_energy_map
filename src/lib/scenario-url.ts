import type { ScenarioParams } from '@/types';

/**
 * The dashboard's default scenario — mirrors the `useState` initializer in
 * `src/app/page.tsx`. Used as the safe fallback when a shared URL is missing
 * or malformed.
 */
export const DEFAULT_SCENARIO: ScenarioParams = {
  brentPrice: 106,
  hormuzWeeks: 2,
  forexRate: 58.42,
  refineryOffline: false,
};

/** Slider bounds, kept in sync with the inputs in `ScenarioPlanner.tsx`. */
const BOUNDS = {
  brentPrice: { min: 60, max: 180 },
  hormuzWeeks: { min: 0, max: 16 },
  forexRate: { min: 54, max: 65 },
} as const;

/** The query-param key a shared scenario is stored under. */
export const SCENARIO_PARAM = 's';

/**
 * Field separator for the encoded scenario. Underscore is URL-safe (an
 * unreserved character per RFC 3986) and — unlike a dot — can never appear
 * inside a decimal number, so the four fields always split unambiguously
 * even when forex (or a hand-edited brent/hormuz) carries a decimal point.
 */
const FIELD_SEP = '_';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pure: encode a scenario as a compact underscore-delimited string —
 * `brent_hormuz_forex_refinery` — e.g. `120_8_60.5_1`.
 */
export function encodeScenario(params: ScenarioParams): string {
  return [
    params.brentPrice,
    params.hormuzWeeks,
    params.forexRate,
    params.refineryOffline ? 1 : 0,
  ].join(FIELD_SEP);
}

/**
 * Pure: decode an underscore-delimited scenario string back into
 * `ScenarioParams`. Defensive — any missing, non-numeric, or out-of-range
 * field falls back to the clamped default, so a hand-edited or stale URL can
 * never crash the UI.
 */
export function decodeScenario(raw: string | null | undefined): ScenarioParams {
  if (!raw) return { ...DEFAULT_SCENARIO };

  const parts = raw.split(FIELD_SEP).map((p) => p.trim());
  // Expect exactly 4 fields: brent, hormuz, forex, refinery.
  if (parts.length !== 4) return { ...DEFAULT_SCENARIO };

  const brent = Number(parts[0]);
  const hormuz = Number(parts[1]);
  const forex = Number(parts[2]);
  const refinery = parts[3];

  if (
    !Number.isFinite(brent) ||
    !Number.isFinite(hormuz) ||
    !Number.isFinite(forex) ||
    (refinery !== '0' && refinery !== '1')
  ) {
    return { ...DEFAULT_SCENARIO };
  }

  return {
    brentPrice: clamp(Math.round(brent), BOUNDS.brentPrice.min, BOUNDS.brentPrice.max),
    hormuzWeeks: clamp(Math.round(hormuz), BOUNDS.hormuzWeeks.min, BOUNDS.hormuzWeeks.max),
    forexRate: clamp(
      Math.round(forex * 10) / 10,
      BOUNDS.forexRate.min,
      BOUNDS.forexRate.max,
    ),
    refineryOffline: refinery === '1',
  };
}

/**
 * Pure: build the full shareable scenario URL given an origin
 * (e.g. `window.location.origin`) and a target path (default `/`).
 */
export function buildScenarioUrl(
  params: ScenarioParams,
  origin: string,
  path = '/',
): string {
  return `${origin}${path}?${SCENARIO_PARAM}=${encodeScenario(params)}`;
}
