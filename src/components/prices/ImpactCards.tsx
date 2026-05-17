'use client';

import { useMemo } from 'react';
import { IMPACT_ITEMS } from '@/lib/constants';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { InfoTip } from '@/components/ui/Tooltip';
import type { ScenarioParams, ImpactItem } from '@/types';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

// Baseline Metro Manila pump prices (₱/L) — the "no extra cost" reference point.
const BASELINE_GASOLINE = 63;
const BASELINE_DIESEL = 59;

/**
 * Derive everyday cost impacts from the MODELED pump-price change.
 * `calculatePumpPrice` is the same engine the Scenario Planner and Impact
 * Calculator use — so these numbers are consistent across the dashboard.
 */
function deriveImpacts(base: ImpactItem[], params: ScenarioParams): ImpactItem[] {
  const { gasoline, diesel } = calculatePumpPrice(params);
  const gasDelta = Math.max(0, gasoline - BASELINE_GASOLINE); // ₱/L over baseline
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
        return item;
    }
  });
}

function riskClasses(riskLevel: string): { border: string; change: string } {
  if (riskLevel === 'green') return { border: 'border-l-status-green/40', change: 'text-status-green' };
  if (riskLevel === 'red') {
    return { border: 'border-l-status-red/40', change: 'text-status-red' };
  }
  return { border: 'border-l-status-yellow/40', change: 'text-status-yellow' };
}

interface ImpactCardsProps {
  scenarioParams: ScenarioParams;
}

export function ImpactCards({ scenarioParams }: ImpactCardsProps) {
  const { impacts, border, change } = useMemo(() => {
    const result = calculatePumpPrice(scenarioParams);
    const classes = riskClasses(String(result.riskLevel));
    return {
      impacts: deriveImpacts(IMPACT_ITEMS, scenarioParams),
      border: classes.border,
      change: classes.change,
    };
  }, [scenarioParams]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {impacts.map((item) => (
          <div key={item.label} className={`glass-card p-4 cursor-default border-l-2 ${border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="text-xs font-sans text-text-secondary flex items-center gap-1.5">
                {item.label}
                <InfoTip text={item.tooltip} />
              </span>
            </div>
            <p className={`text-sm font-mono font-semibold ${change}`}>{item.change}</p>
            <p className="text-[10px] font-mono text-text-subtle mt-1">
              from {item.current}
            </p>
          </div>
        ))}
      </div>
      <SourceAttribution derived="Modeled from scenario pump prices (scenario-engine)" />
    </div>
  );
}
