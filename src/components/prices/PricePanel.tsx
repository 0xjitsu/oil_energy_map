'use client';

import { useMemo } from 'react';
import { usePrices } from '@/hooks/usePrices';
import { PriceBenchmark } from '@/types';
import { SparkChart } from './SparkChart';
import { InfoTip } from '@/components/ui/Tooltip';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

function generateSparkData(value: number): number[] {
  const points: number[] = [];
  const variance = value * 0.03;
  for (let i = 0; i < 7; i++) {
    const offset = (Math.sin(i * 1.2) + Math.cos(i * 0.7)) * variance * 0.5;
    points.push(value - variance + offset + variance * (i / 6));
  }
  return points;
}

function BenchmarkCard({
  benchmark,
  history,
}: {
  benchmark: PriceBenchmark;
  history?: number[];
}) {
  const change = benchmark.value - benchmark.previousWeek;
  const changePct = ((change / benchmark.previousWeek) * 100).toFixed(1);
  const isUp = change > 0;
  const animated = useAnimatedNumber(benchmark.value);

  const sparkData = useMemo(
    () => (history && history.length >= 2 ? history : generateSparkData(benchmark.value)),
    [history, benchmark.value],
  );

  const changeColor = isUp ? 'text-red-400' : 'text-emerald-400';
  const sparkColor = isUp ? '#f87171' : '#34d399';
  // Live feeds: brent-crude (Yahoo Finance), php-usd (FloatRates)
  // DOE-sourced: pump-gasoline, pump-diesel (DOE Oil Monitor weekly SRP)
  // Derived from live feeds: dubai-crude, mops-gasoline, mops-diesel, sg-refining-margin
  const isDerived = !['brent-crude', 'php-usd', 'pump-gasoline', 'pump-diesel'].includes(benchmark.id);

  return (
    <div className="glass-card card-interactive p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
          {benchmark.name}
          <InfoTip text={benchmark.tooltip} />
          {isDerived && (
            <span className="bg-status-yellow/10 text-status-yellow/70 text-[8px] px-1 py-0.5 rounded uppercase tracking-wider">
              EST
            </span>
          )}
        </p>
        <span
          className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
            isUp ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
          }`}
        >
          {isUp ? '▲' : '▼'} {changePct}%
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl lg:text-3xl font-mono font-bold text-text-primary tabular-nums">
            {animated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="ml-1 text-[10px] text-text-subtle font-mono">
            {benchmark.unit}
          </span>
        </div>
        <SparkChart data={sparkData} color={sparkColor} width={100} height={28} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className={`text-xs font-mono ${changeColor}`}>
          {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(2)}
        </p>
        <p className="text-[9px] font-mono text-text-dim">
          prev: {benchmark.previousWeek.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function PricePanel() {
  const { prices: priceBenchmarks, priceHistory, isLive } = usePrices();

  return (
    <div>
      {isLive && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/70">
            Live prices
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {priceBenchmarks.map((b) => (
          <BenchmarkCard key={b.id} benchmark={b} history={priceHistory[b.id]} />
        ))}
      </div>
    </div>
  );
}
