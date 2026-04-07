'use client';

import { useMemo } from 'react';
import { IMPACT_ITEMS } from '@/lib/constants';
import { InfoTip } from '@/components/ui/Tooltip';
import type { ScenarioParams, ImpactItem } from '@/types';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

const BASELINE_BRENT = 106;

function deriveImpacts(base: ImpactItem[], params: ScenarioParams): ImpactItem[] {
  const brentDelta = params.brentPrice - BASELINE_BRENT; // positive = more expensive
  const forexPressure = (params.forexRate - 56) / 9; // 0 at ₱56, ~1 at ₱65
  const severity = brentDelta / 74; // normalized: 0 at baseline, ~1 at $180

  return base.map((item) => {
    switch (item.label) {
      case 'Jeepney Fare': {
        const extra = Math.max(0, Math.round(severity * 4 + forexPressure));
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1} per ride`;
        return { ...item, change };
      }
      case 'Grab Ride': {
        const surcharge = Math.max(0, Math.round(8 + severity * 15 + forexPressure * 5));
        const change = surcharge <= 0 ? 'No surcharge' : `+₱${surcharge}–${surcharge + 4} surcharge`;
        return { ...item, change };
      }
      case 'Rice Delivery': {
        const extra = Math.max(0, Math.round(1 + severity * 3 + forexPressure));
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 1}/kg`;
        return { ...item, change };
      }
      case 'LPG Cooking': {
        const extra = Math.max(0, Math.round(200 + severity * 400 + forexPressure * 100));
        const change = extra <= 0 ? 'No change' : `+₱${extra}–${extra + 100}/month`;
        return { ...item, change };
      }
      default:
        return item;
    }
  });
}

function getBorderColor(brentPrice: number): string {
  if (brentPrice < 80) return 'border-l-emerald-500/40';
  if (brentPrice < 120) return 'border-l-yellow-500/40';
  return 'border-l-red-500/40';
}

function getChangeColor(brentPrice: number): string {
  if (brentPrice < 80) return 'text-emerald-400';
  if (brentPrice < 120) return 'text-yellow-400';
  return 'text-red-400';
}

interface ImpactCardsProps {
  scenarioParams: ScenarioParams;
}

export function ImpactCards({ scenarioParams }: ImpactCardsProps) {
  const impacts = useMemo(
    () => deriveImpacts(IMPACT_ITEMS, scenarioParams),
    [scenarioParams],
  );
  const borderColor = getBorderColor(scenarioParams.brentPrice);
  const changeColor = getChangeColor(scenarioParams.brentPrice);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {impacts.map((item) => (
          <div key={item.label} className={`glass-card p-4 cursor-default border-l-2 ${borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="text-xs font-sans text-text-secondary flex items-center gap-1.5">
                {item.label}
                <InfoTip text={item.tooltip} />
              </span>
            </div>
            <p className={`text-sm font-mono font-semibold ${changeColor}`}>{item.change}</p>
            <p className="text-[10px] font-mono text-text-subtle mt-1">
              from {item.current}
            </p>
          </div>
        ))}
      </div>
      <SourceAttribution derived="Derived from Brent + Forex" />
    </div>
  );
}
