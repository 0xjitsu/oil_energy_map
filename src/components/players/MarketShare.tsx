'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, type PieLabelRenderProps } from 'recharts';
import { marketPlayers } from '@/data/players';
import { MarketPlayer } from '@/types';

function renderLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, outerRadius, name, value } = props;
  const cxNum = Number(cx);
  const cyNum = Number(cy);
  const RADIAN = Math.PI / 180;
  const radius = Number(outerRadius) + 20;
  const x = cxNum + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = cyNum + radius * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.6)"
      textAnchor={x > cxNum ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
      fontFamily="monospace"
    >
      {`${String(name)} ${String(value)}%`}
    </text>
  );
}

export function MarketShare() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-2 font-sans">
        Market Share
      </h3>
      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={marketPlayers}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="marketShare"
              nameKey="name"
              label={renderLabel}
              labelLine={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
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
    </div>
  );
}
