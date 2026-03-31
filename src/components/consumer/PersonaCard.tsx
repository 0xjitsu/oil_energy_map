'use client';

import type { ConsumerPersona, ImpactResultData } from '@/lib/consumer-models';

interface PersonaCardProps {
  persona: ConsumerPersona;
  impact: ImpactResultData;
  selected: boolean;
  onClick: () => void;
}

function getPainColor(index: number): string {
  if (index <= 3) return 'bg-emerald-500';
  if (index <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function PersonaCard({ persona, impact, selected, onClick }: PersonaCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left glass-card card-interactive p-4 transition-all ${
        selected ? 'border-blue-500/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{persona.icon}</span>
        <div>
          <p className="text-xs font-mono text-text-primary font-semibold">{persona.label}</p>
          <p className="text-[9px] font-sans text-text-dim">{persona.description}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className={`text-xl font-mono font-bold ${impact.monthlyCostDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {impact.monthlyCostDelta > 0 ? '+' : ''}₱{Math.abs(impact.monthlyCostDelta).toLocaleString()}
        </p>
        <p className="text-[9px] font-mono text-text-dim">per month</p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getPainColor(impact.painIndex)}`}
            style={{ width: `${impact.painIndex * 10}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-text-dim">{impact.painIndex}/10</span>
      </div>
    </button>
  );
}
