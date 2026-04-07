'use client';

import { useState } from 'react';
import { marketPlayers } from '@/data/players';
import { RiskLevel } from '@/types';

function vulnerabilityLevel(score: number): RiskLevel {
  if (score > 75) return 'red';
  if (score >= 60) return 'yellow';
  return 'green';
}

const RISK_COLORS: Record<RiskLevel, { bar: string; text: string; label: string }> = {
  green: { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'LOW' },
  yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'MED' },
  red: { bar: 'bg-red-500', text: 'text-red-400', label: 'HIGH' },
};

const STRATEGY_ICON: Record<string, string> = {
  'Refine + Import': '🏭',
  'Import Only': '🚢',
};

export function PlayerCards() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {marketPlayers.map((player) => {
        const level = vulnerabilityLevel(player.vulnerabilityScore);
        const risk = RISK_COLORS[level];
        const isExpanded = expanded === player.name;

        return (
          <button
            key={player.name}
            type="button"
            onClick={() => setExpanded(isExpanded ? null : player.name)}
            className="glass-card card-interactive p-4 text-left w-full transition-all duration-200"
            style={{ borderLeftColor: player.color, borderLeftWidth: 3 }}
          >
            {/* Header: logo + name + share */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={player.logo}
                  alt={`${player.name} logo`}
                  width={24}
                  height={24}
                  className="rounded"
                />
                <h4 className="text-sm font-sans font-semibold text-text-primary">
                  {player.name}
                </h4>
              </div>
              <span
                className="text-lg font-mono font-bold tabular-nums"
                style={{ color: player.color }}
              >
                {player.marketShare}%
              </span>
            </div>

            {/* Key metrics row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="text-base font-mono font-bold text-text-primary tabular-nums">
                  {player.stations.toLocaleString()}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-text-dim">
                  Stations
                </div>
              </div>
              <div className="w-px h-8 bg-border-subtle" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">
                    {STRATEGY_ICON[player.strategy] ?? '📦'}
                  </span>
                  <span className="text-[10px] font-mono text-text-secondary">
                    {player.strategy}
                  </span>
                </div>
              </div>
            </div>

            {/* Vulnerability bar — full width, dramatic */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-text-dim">
                  Supply Risk
                </span>
                <span className={`text-[10px] font-mono font-bold ${risk.text}`}>
                  {risk.label} · {player.vulnerabilityScore}
                </span>
              </div>
              <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full ${risk.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${player.vulnerabilityScore}%`, opacity: 0.85 }}
                />
              </div>
            </div>

            {/* Expanded detail */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="pt-3 mt-3 border-t border-border-subtle space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-label">Supply Strategy</span>
                    <span className="text-text-primary font-mono">{player.strategy}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-label">Vulnerability Score</span>
                    <span className={`font-mono font-bold ${risk.text}`}>
                      {player.vulnerabilityScore}/100
                    </span>
                  </div>
                  <p className="text-[10px] text-text-subtle leading-relaxed">
                    {player.strategy === 'Refine + Import'
                      ? 'Operates domestic refining capacity, reducing import dependency but concentrating risk at Bataan.'
                      : 'Fully dependent on imported finished product — vulnerable to shipping disruptions and forex swings.'}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
