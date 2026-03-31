'use client';

import type { ConsumerPersona, ImpactResultData } from '@/lib/consumer-models';

interface ImpactResultProps {
  persona: ConsumerPersona;
  impact: ImpactResultData;
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
          <p className={`text-2xl font-mono font-bold ${impact.monthlyCostDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {impact.monthlyCostDelta > 0 ? '+' : ''}₱{Math.abs(impact.monthlyCostDelta).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">% of Income</p>
          <p className={`text-2xl font-mono font-bold ${impact.percentOfIncome > 5 ? 'text-red-400' : impact.percentOfIncome > 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
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
