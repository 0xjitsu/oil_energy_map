import type { ImpactItem, RiskLevel } from '@/types';

// Baselines mirror the scenario-engine's calm base case (Brent $80, PHP 56,
// no disruption) — moved verbatim from ImpactCards.tsx.
export const BASELINE_GASOLINE = 65;
export const BASELINE_DIESEL = 59;

/** Pure: traffic-light for live pump deltas over the calm baseline (₱/L). */
export function pumpDeltaRisk(gasDelta: number, dieselDelta: number): RiskLevel {
  const worst = Math.max(gasDelta, dieselDelta);
  if (worst >= 15) return 'red';
  if (worst >= 5) return 'yellow';
  return 'green';
}

/**
 * Pure: everyday cost impacts from LIVE pump prices (₱/L), not a scenario.
 * Same per-item arithmetic the scenario version used — only the input source
 * changes (live DOE values instead of calculatePumpPrice(scenarioParams)).
 */
export function deriveImpactsFromPump(
  base: ImpactItem[],
  gasoline: number,
  diesel: number,
): ImpactItem[] {
  const gasDelta = Math.max(0, gasoline - BASELINE_GASOLINE);
  const dieselDelta = Math.max(0, diesel - BASELINE_DIESEL);

  return base.map((item) => {
    switch (item.label) {
      case 'Jeepney Fare': {
        const extra = Math.round(dieselDelta * 0.35);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1} per ride`;
        return { ...item, change };
      }
      case 'Grab Ride': {
        const extra = Math.round(gasDelta * 2.2);
        const change = extra <= 0 ? 'No surcharge' : `+₱${extra}–${extra + 4} surcharge`;
        return { ...item, change };
      }
      case 'Rice Delivery': {
        const extra = Math.round(dieselDelta * 0.25);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1}/kg`;
        return { ...item, change };
      }
      case 'LPG Cooking': {
        const extra = Math.round((gasDelta + dieselDelta) * 18);
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 100}/month`;
        return { ...item, change };
      }
      default:
        throw new Error(
          `impact-model: unhandled impact label "${item.label}" — every IMPACT_ITEMS entry needs a live derivation`,
        );
    }
  });
}
