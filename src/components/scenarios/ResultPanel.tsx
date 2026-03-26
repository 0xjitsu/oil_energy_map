import { RiskLevel } from '@/types';

interface ResultPanelProps {
  gasoline: number;
  diesel: number;
  riskLevel: RiskLevel;
}

const CURRENT_GASOLINE = 78.5;
const CURRENT_DIESEL = 72.3;

const RISK_BADGE: Record<RiskLevel, { label: string; className: string }> = {
  green: {
    label: 'STABLE',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  yellow: {
    label: 'ELEVATED',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  red: {
    label: 'CRISIS',
    className: 'bg-red-500/20 text-red-400 border-red-500/30 alert-glow',
  },
};

const RISK_SUMMARY: Record<RiskLevel, string> = {
  green:
    'Fuel supply is stable. Prices are within normal range for most Filipinos.',
  yellow:
    'Fuel prices are elevated. Jeepney operators and delivery services may raise fares. Budget households will feel the impact on cooking gas.',
  red:
    'CRISIS LEVEL. Expect transport strikes, food price spikes, and potential fuel rationing. Government intervention likely needed.',
};

export function ResultPanel({ gasoline, diesel, riskLevel }: ResultPanelProps) {
  const badge = RISK_BADGE[riskLevel];
  const gasDiff = gasoline - CURRENT_GASOLINE;
  const dieselDiff = diesel - CURRENT_DIESEL;

  return (
    <div className="glass-card p-5">
      {/* Risk badge */}
      <div className="mb-4">
        <span
          className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-mono tracking-widest ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Price estimates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-1 font-sans">
            Est. Gasoline
          </p>
          <p className="text-3xl font-mono font-bold text-[rgba(255,255,255,0.9)]">
            ₱{gasoline.toFixed(2)}
          </p>
          <p
            className={`text-xs font-mono mt-1 ${
              gasDiff >= 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {gasDiff >= 0 ? '+' : ''}₱{gasDiff.toFixed(2)} vs current
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-1 font-sans">
            Est. Diesel
          </p>
          <p className="text-3xl font-mono font-bold text-[rgba(255,255,255,0.9)]">
            ₱{diesel.toFixed(2)}
          </p>
          <p
            className={`text-xs font-mono mt-1 ${
              dieselDiff >= 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {dieselDiff >= 0 ? '+' : ''}₱{dieselDiff.toFixed(2)} vs current
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs font-sans leading-relaxed text-[rgba(255,255,255,0.5)]">
        {RISK_SUMMARY[riskLevel]}
      </p>
    </div>
  );
}
