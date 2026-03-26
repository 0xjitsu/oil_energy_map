import { ScenarioParams, RiskLevel } from '@/types';

interface RiskMatrixProps {
  params: ScenarioParams;
  riskLevel: RiskLevel;
}

interface RiskCategory {
  label: string;
  level: RiskLevel;
}

const DOT_COLORS: Record<RiskLevel, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400 animate-pulse',
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  green: 'LOW',
  yellow: 'MEDIUM',
  red: 'HIGH',
};

function evaluateRisks(
  params: ScenarioParams,
  riskLevel: RiskLevel
): RiskCategory[] {
  const supplyLevel: RiskLevel =
    params.hormuzWeeks > 8 ? 'red' : params.hormuzWeeks > 4 ? 'yellow' : 'green';

  const priceLevel: RiskLevel =
    params.brentPrice > 120 ? 'red' : params.brentPrice > 100 ? 'yellow' : 'green';

  // Only one refinery — infrastructure is never truly green
  const infraLevel: RiskLevel = params.refineryOffline ? 'red' : 'yellow';

  const policyLevel: RiskLevel = riskLevel;

  return [
    { label: 'Supply Risk', level: supplyLevel },
    { label: 'Price Risk', level: priceLevel },
    { label: 'Infrastructure Risk', level: infraLevel },
    { label: 'Policy Risk', level: policyLevel },
  ];
}

export function RiskMatrix({ params, riskLevel }: RiskMatrixProps) {
  const risks = evaluateRisks(params, riskLevel);

  return (
    <div className="glass-card p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-4 font-sans">
        Risk Matrix
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {risks.map((risk) => (
          <div
            key={risk.label}
            className="flex items-center gap-2.5 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5"
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${DOT_COLORS[risk.level]}`}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-sans text-[rgba(255,255,255,0.5)] truncate">
                {risk.label}
              </p>
              <p className="text-[10px] font-mono font-semibold text-[rgba(255,255,255,0.7)]">
                {LEVEL_LABELS[risk.level]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
