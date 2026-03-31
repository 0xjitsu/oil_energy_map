import { calculatePumpPrice } from '@/lib/scenario-engine';
import type { ScenarioParams, MonteCarloResult } from '@/types';

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function bernoulli(p: number): boolean {
  return Math.random() < p;
}

function uniformRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function percentile(sorted: number[], p: number): number {
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function runMonteCarlo(
  baseParams: ScenarioParams,
  runs: number = 1000,
): MonteCarloResult {
  const start = performance.now();
  const gasolineResults: number[] = [];
  const dieselResults: number[] = [];

  const month = new Date().getMonth();
  const isTyphoonSeason = month >= 5 && month <= 10;

  for (let i = 0; i < runs; i++) {
    const brentPrice = Math.max(40, normalRandom(baseParams.brentPrice, baseParams.brentPrice * 0.15));
    const forexRate = Math.max(50, normalRandom(baseParams.forexRate, baseParams.forexRate * 0.05));
    const hormuzDisrupted = bernoulli(0.15);
    const hormuzWeeks = hormuzDisrupted ? Math.round(uniformRandom(1, 16)) : 0;
    const refineryOffline = bernoulli(isTyphoonSeason ? 0.15 : 0.05);

    const params: ScenarioParams = { brentPrice, hormuzWeeks, forexRate, refineryOffline };
    const result = calculatePumpPrice(params);

    gasolineResults.push(result.gasoline);
    dieselResults.push(result.diesel);
  }

  gasolineResults.sort((a, b) => a - b);
  dieselResults.sort((a, b) => a - b);

  const thresholds = [70, 75, 80, 85, 90, 95, 100];
  const probabilityAbove = thresholds.map((t) => ({
    threshold: t,
    gasoline: Math.round((gasolineResults.filter((v) => v > t).length / runs) * 100),
    diesel: Math.round((dieselResults.filter((v) => v > t).length / runs) * 100),
  }));

  return {
    runs,
    pumpGasoline: {
      p10: Math.round(percentile(gasolineResults, 10) * 100) / 100,
      p25: Math.round(percentile(gasolineResults, 25) * 100) / 100,
      p50: Math.round(percentile(gasolineResults, 50) * 100) / 100,
      p75: Math.round(percentile(gasolineResults, 75) * 100) / 100,
      p90: Math.round(percentile(gasolineResults, 90) * 100) / 100,
    },
    pumpDiesel: {
      p10: Math.round(percentile(dieselResults, 10) * 100) / 100,
      p25: Math.round(percentile(dieselResults, 25) * 100) / 100,
      p50: Math.round(percentile(dieselResults, 50) * 100) / 100,
      p75: Math.round(percentile(dieselResults, 75) * 100) / 100,
      p90: Math.round(percentile(dieselResults, 90) * 100) / 100,
    },
    probabilityAbove,
    computeTimeMs: Math.round(performance.now() - start),
  };
}
