import { ScenarioParams, ScenarioResult, RiskLevel } from '@/types';

/**
 * Simplified pump-price model for the Philippine market.
 *
 * Key assumptions:
 * - Base gasoline price at Brent $80, PHP 56, no disruption: ~₱65/L
 * - Each $1 Brent increase ≈ ₱0.18/L at the pump
 * - Each ₱1 peso weakening ≈ ₱0.90/L
 * - Hormuz disruption adds a premium per week of closure
 * - Bataan refinery offline shifts to 100% import (premium ~₱3/L)
 * - Diesel tracks ~₱6/L below gasoline
 */
export function calculatePumpPrice(params: ScenarioParams): ScenarioResult {
  const { brentPrice, hormuzWeeks, forexRate, refineryOffline } = params;

  const baseGasoline = 65;
  const baseDiesel = 59;

  const brentDelta = (brentPrice - 80) * 0.18;
  const forexDelta = (forexRate - 56) * 0.9;

  const hormuzPremium =
    hormuzWeeks <= 0
      ? 0
      : hormuzWeeks <= 4
        ? hormuzWeeks * 1.5
        : hormuzWeeks <= 8
          ? 6 + (hormuzWeeks - 4) * 2.5
          : 16 + (hormuzWeeks - 8) * 4;

  const refineryPremium = refineryOffline ? 3.0 : 0;

  const gasoline =
    Math.round(
      (baseGasoline + brentDelta + forexDelta + hormuzPremium + refineryPremium) * 100
    ) / 100;
  const diesel =
    Math.round(
      (baseDiesel + brentDelta + forexDelta + hormuzPremium + refineryPremium) * 100
    ) / 100;

  let riskLevel: RiskLevel = 'green';
  if (
    gasoline > 95 ||
    hormuzWeeks > 8 ||
    (refineryOffline && hormuzWeeks > 4)
  ) {
    riskLevel = 'red';
  } else if (gasoline > 75 || hormuzWeeks > 4 || brentPrice > 100) {
    riskLevel = 'yellow';
  }

  return { gasoline, diesel, riskLevel };
}
