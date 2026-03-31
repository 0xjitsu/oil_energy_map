'use client';

import type { SavedScenario } from '@/types';

interface ScenarioCompareProps {
  scenarios: SavedScenario[];
}

function getRiskColor(level: string) {
  if (level === 'red') return 'text-red-400';
  if (level === 'yellow') return 'text-yellow-400';
  return 'text-emerald-400';
}

export function ScenarioCompare({ scenarios }: ScenarioCompareProps) {
  if (scenarios.length < 2) return null;

  return (
    <div className="glass-card p-5 mt-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">
        Scenario Comparison
      </h3>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scenarios.length}, 1fr)` }}>
        {scenarios.map((s) => (
          <div key={s.id} className="space-y-3">
            <p className="font-mono text-xs text-text-primary font-semibold truncate">{s.name}</p>

            <div className="space-y-2">
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Brent</p>
                <p className="text-sm font-mono text-text-primary">${s.params.brentPrice}/bbl</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Hormuz</p>
                <p className="text-sm font-mono text-text-primary">{s.params.hormuzWeeks}w</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">PHP/USD</p>
                <p className="text-sm font-mono text-text-primary">₱{s.params.forexRate.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Refinery</p>
                <p className="text-sm font-mono text-text-primary">{s.params.refineryOffline ? 'Offline' : 'Online'}</p>
              </div>

              <div className="h-px bg-border-subtle" />

              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Gasoline</p>
                <p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.gasoline.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Diesel</p>
                <p className="text-lg font-mono font-bold text-text-primary">₱{s.derived.diesel.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-dim uppercase">Risk</p>
                <p className={`text-sm font-mono font-bold uppercase ${getRiskColor(s.derived.riskLevel)}`}>
                  {s.derived.riskLevel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
