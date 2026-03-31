'use client';

import { useHistoricalData } from '@/hooks/useHistoricalData';

interface TimelineScrubberProps {
  visible: boolean;
}

function severityColor(s: string): string {
  if (s === 'red') return 'bg-red-500';
  if (s === 'yellow') return 'bg-yellow-500';
  return 'bg-emerald-500';
}

export function TimelineScrubber({ visible }: TimelineScrubberProps) {
  const {
    prices,
    events,
    currentIndex,
    currentSnapshot,
    nearbyEvents,
    playing,
    speed,
    togglePlay,
    setSpeed,
    setIndex,
    totalSnapshots,
  } = useHistoricalData();

  if (!visible) return null;

  return (
    <div className="glass-card p-4 mt-4">
      {/* Header with date and controls */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Historical Playback</p>
          <p className="font-mono text-lg text-text-primary font-bold">
            {new Date(currentSnapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                speed === s ? 'bg-blue-500/20 text-blue-400' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={togglePlay}
            className="px-3 py-1 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={totalSnapshots - 1}
          value={currentIndex}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full"
        />

        {/* Event markers on the timeline */}
        <div className="relative h-4 mt-1">
          {events.map((event, i) => {
            const eventDate = new Date(event.date).getTime();
            const startDate = new Date(prices[0].date).getTime();
            const endDate = new Date(prices[prices.length - 1].date).getTime();
            const position = ((eventDate - startDate) / (endDate - startDate)) * 100;
            if (position < 0 || position > 100) return null;
            return (
              <div
                key={i}
                className={`absolute top-0 w-1.5 h-1.5 rounded-full ${severityColor(event.severity)} cursor-pointer`}
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                title={event.title}
              />
            );
          })}
        </div>

        {/* Date range labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-text-dim">
            {new Date(prices[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[8px] font-mono text-text-dim">
            {new Date(prices[prices.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Current snapshot data */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase">Brent</p>
          <p className="text-sm font-mono font-bold text-text-primary">${currentSnapshot.brent}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase">PHP/USD</p>
          <p className="text-sm font-mono font-bold text-text-primary">₱{currentSnapshot.phpUsd}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase">Gasoline</p>
          <p className="text-sm font-mono font-bold text-text-primary">₱{currentSnapshot.pumpGasoline}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase">Diesel</p>
          <p className="text-sm font-mono font-bold text-text-primary">₱{currentSnapshot.pumpDiesel}</p>
        </div>
      </div>

      {/* Nearby events */}
      {nearbyEvents.length > 0 && (
        <div className="mt-3 space-y-1">
          {nearbyEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityColor(e.severity)}`} />
              <span className="text-[10px] font-mono text-text-secondary">{e.title}</span>
              <span className={`text-[9px] font-mono ml-auto ${e.priceImpact > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {e.priceImpact > 0 ? '+' : ''}{e.priceImpact}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
