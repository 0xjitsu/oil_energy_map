import { marketPlayers } from '@/data/players';
import { RiskLevel } from '@/types';

function vulnerabilityLevel(score: number): RiskLevel {
  if (score > 75) return 'red';
  if (score >= 60) return 'yellow';
  return 'green';
}

const BAR_GRADIENTS: Record<RiskLevel, string> = {
  green: 'from-emerald-600 to-emerald-400',
  yellow: 'from-yellow-600 to-yellow-400',
  red: 'from-red-600 to-red-400',
};

export function PlayerCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {marketPlayers.map((player) => {
        const level = vulnerabilityLevel(player.vulnerabilityScore);
        return (
          <div
            key={player.name}
            className="glass-card card-interactive p-4"
            style={{ borderLeftColor: player.color, borderLeftWidth: 3 }}
          >
            <h4 className="text-sm font-sans font-semibold text-[rgba(255,255,255,0.9)] mb-2">
              {player.name}
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.4)] font-sans">Market Share</span>
                <span className="font-mono text-[rgba(255,255,255,0.8)]">{player.marketShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.4)] font-sans">Stations</span>
                <span className="font-mono text-[rgba(255,255,255,0.8)]">
                  {player.stations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.4)] font-sans">Strategy</span>
                <span className="font-mono text-[rgba(255,255,255,0.8)]">{player.strategy}</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[rgba(255,255,255,0.4)] font-sans">Vulnerability</span>
                  <span className="font-mono text-[rgba(255,255,255,0.8)]">
                    {player.vulnerabilityScore}/100
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${BAR_GRADIENTS[level]}`}
                    style={{ width: `${player.vulnerabilityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
