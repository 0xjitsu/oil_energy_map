'use client';

import { useState, useCallback } from 'react';
import type { ScenarioParams, MonteCarloResult } from '@/types';
import { runMonteCarlo } from '@/lib/monte-carlo';
import { ConfidenceFan } from './ConfidenceFan';
import { Disclaimer } from '@/components/ui/Disclaimer';

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
