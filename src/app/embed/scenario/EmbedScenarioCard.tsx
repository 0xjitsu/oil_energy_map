import type { ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

const RISK_LABEL: Record<'green' | 'yellow' | 'red', { label: string; tone: string }> = {
  green: { label: 'Stable', tone: 'text-status-green' },
  yellow: { label: 'Elevated', tone: 'text-status-yellow' },
  red: { label: 'Crisis', tone: 'text-status-red' },
};

interface EmbedScenarioCardProps {
  params: ScenarioParams;
}

/**
 * Self-contained scenario result card for the `/embed/scenario` iframe widget.
 * Pure render — derives prices from `calculatePumpPrice`, no live data.
 */
export function EmbedScenarioCard({ params }: EmbedScenarioCardProps) {
  const result = calculatePumpPrice(params);
  const risk = RISK_LABEL[result.riskLevel];

  return (
    <div className="glass-card mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label">
          PH Oil — Modeled Scenario
        </p>
        <span className={`font-mono text-[10px] uppercase tracking-widest ${risk.tone}`}>
          {risk.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Est. Gasoline
          </p>
          <p className="font-mono text-3xl font-bold text-text-primary">
            ₱{result.gasoline.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Est. Diesel
          </p>
          <p className="font-mono text-3xl font-bold text-text-primary">
            ₱{result.diesel.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-secondary">
        Brent ${params.brentPrice}/bbl · Hormuz {params.hormuzWeeks}wk · ₱
        {params.forexRate.toFixed(2)}/USD
        {params.refineryOffline ? ' · Bataan refinery offline' : ''}.
      </p>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-petron transition-colors hover:text-text-primary"
      >
        Model your own →
      </a>
    </div>
  );
}
