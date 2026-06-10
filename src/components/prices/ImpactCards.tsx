'use client';

import { useMemo } from 'react';
import { IMPACT_ITEMS } from '@/lib/constants';
import { usePrices } from '@/hooks/usePrices';
import { getCurrentPumpPrices } from '@/lib/format';
import { deriveImpactsFromPump, pumpDeltaRisk, BASELINE_GASOLINE, BASELINE_DIESEL } from '@/lib/impact-model';
import { InfoTip } from '@/components/ui/Tooltip';
import type { RiskLevel } from '@/types';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

function riskClasses(riskLevel: RiskLevel): { border: string; change: string } {
  if (riskLevel === 'green') return { border: 'border-l-status-green/40', change: 'text-status-green' };
  if (riskLevel === 'red') {
    return { border: 'border-l-status-red/40', change: 'text-status-red' };
  }
  return { border: 'border-l-status-yellow/40', change: 'text-status-yellow' };
}

export function ImpactCards() {
  const { prices } = usePrices();

  const { impacts, border, change } = useMemo(() => {
    const { gasoline, diesel } = getCurrentPumpPrices(prices);
    const risk = pumpDeltaRisk(gasoline - BASELINE_GASOLINE, diesel - BASELINE_DIESEL);
    const classes = riskClasses(risk);
    return {
      impacts: deriveImpactsFromPump(IMPACT_ITEMS, gasoline, diesel),
      border: classes.border,
      change: classes.change,
    };
  }, [prices]);

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
      <SourceAttribution derived="Derived from live DOE pump prices vs calm baseline" />
    </div>
  );
}
