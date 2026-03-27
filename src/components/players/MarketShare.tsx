'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { marketPlayers } from '@/data/players';
import { MarketPlayer } from '@/types';

export function MarketShare() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-sans">
        Market Share
      </h3>
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={marketPlayers}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="marketShare"
              nameKey="name"
              labelLine={false}
              isAnimationActive={false}
            >
              {marketPlayers.map((player: MarketPlayer) => (
                <Cell key={player.name} fill={player.color} strokeWidth={0} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.3)"
              fontSize={10}
              fontFamily="monospace"
            >
              Market Share
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Logo legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {marketPlayers.map((player) => (
          <div key={player.name} className="flex items-center gap-1.5">
            <img
              src={player.logo}
              alt={player.name}
              width={16}
              height={16}
              className="rounded-sm"
            />
            <span className="text-[10px] font-mono text-text-secondary">
              {player.name}
            </span>
            <span className="text-[10px] font-mono text-text-subtle ml-auto">
              {player.marketShare}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
