'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ScenarioParams, MonteCarloResult } from '@/types';
import { runMonteCarlo } from '@/lib/monte-carlo';
import { ConfidenceFan } from './ConfidenceFan';
import { Disclaimer } from '@/components/ui/Disclaimer';

function RiskRadar({ dimensions }: { dimensions: { label: string; value: number }[] }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 60;
  const axes = dimensions.length;

  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / axes - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  };

  const ringRadii = [0.33, 0.66, 1.0];

  const ringPaths = ringRadii.map((r) => {
    const radius = maxR * r;
    const points = Array.from({ length: axes }, (_, i) => {
      const p = getPoint(i, radius);
      return `${p.x},${p.y}`;
    });
    return points.join(' ');
  });

  const dataPoints = dimensions.map((d, i) => {
    const p = getPoint(i, (d.value / 100) * maxR);
    return `${p.x},${p.y}`;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto" role="img" aria-label={`Risk radar: ${dimensions.map(d => `${d.label} ${d.value}%`).join(', ')}`}>
      {/* Background rings */}
      {ringPaths.map((points, i) => (
        <polygon
          key={`ring-${i}`}
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {Array.from({ length: axes }, (_, i) => {
        const p = getPoint(i, maxR);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.join(' ')}
        fill="var(--accent-primary, #3b82f6)"
        fillOpacity={0.15}
        stroke="var(--accent-primary, #3b82f6)"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-primary, #3b82f6))' }}
      />

      {/* Data points */}
      {dimensions.map((d, i) => {
        const p = getPoint(i, (d.value / 100) * maxR);
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="var(--accent-primary, #3b82f6)"
          />
        );
      })}

      {/* Labels */}
      {dimensions.map((d, i) => {
        const p = getPoint(i, maxR + 16);
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.4)"
            fontSize={8}
            fontFamily="monospace"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

interface StressTestProps {
  scenarioParams: ScenarioParams;
}

export function StressTest({ scenarioParams }: StressTestProps) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(80);

  const handleRun = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const r = runMonteCarlo(scenarioParams, 1000);
      setResult(r);
      setRunning(false);
    }, 50);
  }, [scenarioParams]);

  const probEntry = result?.probabilityAbove.find((p) => p.threshold === threshold);

  const riskDimensions = useMemo(() => {
    const disruption = scenarioParams.hormuzWeeks / 16;
    const priceRisk = Math.min(((scenarioParams.brentPrice - 60) / 90) * 100, 100);
    const supplyRisk = disruption * 100;
    const forexRisk = Math.min(((scenarioParams.forexRate - 50) / 15) * 100, 100);
    const infraRisk = scenarioParams.refineryOffline ? 90 : Math.max(disruption * 40, 10);
    return [
      { label: 'Price', value: Math.max(0, priceRisk) },
      { label: 'Supply', value: Math.max(0, supplyRisk) },
      { label: 'Forex', value: Math.max(0, forexRisk) },
      { label: 'Infra', value: Math.max(0, infraRisk) },
    ];
  }, [scenarioParams]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
            Monte Carlo Stress Test
          </h2>
          <p className="text-xs font-sans text-text-label mt-1">
            1,000 simulated scenarios with randomized inputs
          </p>
        </div>
      </div>

      {/* Risk Radar */}
      <div className="glass-card p-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2 text-center">
          Risk Profile
        </p>
        <RiskRadar dimensions={riskDimensions} />
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
        >
          {running ? 'Simulating...' : 'Run Stress Test'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <p className="text-[9px] font-mono text-text-dim">
            {result.runs} runs completed in {result.computeTimeMs}ms
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
                Gasoline (₱/L)
              </p>
              <ConfidenceFan result={result} fuelType="gasoline" />
            </div>
            <div className="glass-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
                Diesel (₱/L)
              </p>
              <ConfidenceFan result={result} fuelType="diesel" />
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">
              Probability gasoline exceeds ₱{threshold}/L
            </p>
            <input
              type="range"
              min={70}
              max={100}
              step={5}
              aria-label="Gasoline price threshold"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
              <span>₱70</span>
              <span>₱100</span>
            </div>
            {probEntry && (
              <p className="text-lg font-mono font-bold text-text-primary mt-2">
                {probEntry.gasoline}% chance
              </p>
            )}
          </div>

          <Disclaimer />
        </div>
      )}
    </div>
  );
}
