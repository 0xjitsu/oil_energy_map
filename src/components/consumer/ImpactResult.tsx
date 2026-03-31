'use client';

import type { ConsumerPersona, ImpactResultData } from '@/lib/consumer-models';

interface ImpactResultProps {
  persona: ConsumerPersona;
  impact: ImpactResultData;
}

function getDeltaColor(delta: number): string {
  return delta > 0 ? 'text-red-400' : 'text-emerald-400';
}

function getIncomeImpactColor(percent: number): string {
  if (percent > 5) return 'text-red-400';
  if (percent > 2) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function ImpactResult({ persona, impact }: ImpactResultProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{persona.icon}</span>
        <div>
          <p className="text-sm font-mono text-text-primary font-semibold">{persona.label}</p>
          <p className="text-[10px] font-sans text-text-secondary">{persona.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Monthly Delta</p>
          <p className={`text-2xl font-mono font-bold ${getDeltaColor(impact.monthlyCostDelta)}`}>
            {impact.monthlyCostDelta > 0 ? '+' : ''}₱{Math.abs(impact.monthlyCostDelta).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">% of Income</p>
          <p className={`text-2xl font-mono font-bold ${getIncomeImpactColor(impact.percentOfIncome)}`}>
            {impact.percentOfIncome > 0 ? '+' : ''}{impact.percentOfIncome}%
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">New Monthly Cost</p>
          <p className="text-lg font-mono font-bold text-text-primary">₱{impact.newMonthlyTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Monthly Liters</p>
          <p className="text-lg font-mono font-bold text-text-primary">{impact.monthlyLiters}L</p>
        </div>
      </div>
    </div>
  );
}
