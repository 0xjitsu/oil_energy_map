'use client';

import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import { marketPlayers } from '@/data/players';
import { MarketPlayer } from '@/types';
import { useHighlight } from '@/lib/HighlightContext';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderActiveShape(props: any, activeIdx: number | null) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index,
  } = props;

  if (index === activeIdx) {
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0 0 6px ' + fill + ')' }}
        />
      </g>
    );
  }

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      opacity={activeIdx !== null ? 0.4 : 1}
      style={{ transition: 'opacity 200ms ease' }}
    />
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function MarketShare() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { setHighlightedPlayer } = useHighlight();

  const onMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
    setHighlightedPlayer(marketPlayers[index].name);
  }, [setHighlightedPlayer]);

  const onMouseLeave = useCallback(() => {
    setActiveIndex(null);
    setHighlightedPlayer(null);
  }, [setHighlightedPlayer]);

  const activePlayer = activeIndex !== null ? marketPlayers[activeIndex] : null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const shapeRenderer = useCallback((props: any) => renderActiveShape(props, activeIndex), [activeIndex]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

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
              activeShape={shapeRenderer}
              inactiveShape={shapeRenderer}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              {marketPlayers.map((player: MarketPlayer) => (
                <Cell
                  key={player.name}
                  fill={player.color}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            {/* Dynamic center label */}
            <text
              x="50%"
              y={activePlayer ? '46%' : '50%'}
              textAnchor="middle"
              dominantBaseline="central"
              fill={activePlayer ? activePlayer.color : 'rgba(255,255,255,0.3)'}
              fontSize={activePlayer ? 12 : 10}
              fontFamily="monospace"
              fontWeight={activePlayer ? 'bold' : 'normal'}
            >
              {activePlayer ? activePlayer.name : 'Market Share'}
            </text>
            {activePlayer && (
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.5)"
                fontSize={10}
                fontFamily="monospace"
              >
                {activePlayer.marketShare}%
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Logo legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {marketPlayers.map((player, i) => (
          <div
            key={player.name}
            className="flex items-center gap-1.5 cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-surface-hover"
            onMouseEnter={() => {
              setActiveIndex(i);
              setHighlightedPlayer(player.name);
            }}
            onMouseLeave={() => {
              setActiveIndex(null);
              setHighlightedPlayer(null);
            }}
          >
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
      <SourceAttribution source="Industry estimates" updated="Annual market data" />
    </div>
  );
}
