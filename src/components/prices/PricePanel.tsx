'use client';

import { useMemo } from 'react';
import { priceBenchmarks } from '@/data/prices';
import { PriceBenchmark } from '@/types';
import { SparkChart } from './SparkChart';
import { Tooltip } from '@/components/ui/Tooltip';

function generateSparkData(value: number): number[] {
  const points: number[] = [];
  const variance = value * 0.03;
  for (let i = 0; i < 7; i++) {
    const offset = (Math.sin(i * 1.2) + Math.cos(i * 0.7)) * variance * 0.5;
    points.push(value - variance + offset + variance * (i / 6));
  }
  return points;
}

function BenchmarkCard({ benchmark }: { benchmark: PriceBenchmark }) {
  const change = benchmark.value - benchmark.previousWeek;
  const changePct = ((change / benchmark.previousWeek) * 100).toFixed(1);
  const isUp = change > 0;
  const sparkData = useMemo(() => generateSparkData(benchmark.value), [benchmark.value]);

  const changeColor = isUp ? 'text-red-400' : 'text-emerald-400';
  const sparkColor = isUp ? '#f87171' : '#34d399';

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#0a0f1a] p-4">
      <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-1">
        {benchmark.name}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <Tooltip text={benchmark.tooltip}>
            <span className="text-2xl font-mono font-bold text-[rgba(255,255,255,0.9)]">
              {benchmark.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </Tooltip>
          <span className="ml-1 text-[10px] text-[rgba(255,255,255,0.3)] font-mono">
            {benchmark.unit}
          </span>
        </div>
        <SparkChart data={sparkData} color={sparkColor} />
      </div>
      <p className={`mt-2 text-xs font-mono ${changeColor}`}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({changePct}%)
      </p>
    </div>
  );
}

export function PricePanel() {
  const benchmarks = priceBenchmarks.slice(0, 5);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {benchmarks.map((b) => (
        <BenchmarkCard key={b.id} benchmark={b} />
      ))}
    </div>
  );
}
