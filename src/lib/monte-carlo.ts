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
  if (lo === Math.ceil(i)) return sorted[lo];
  return sorted[lo] + (sorted[lo + 1] - sorted[lo]) * (i - lo);
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function percentileBand(sorted: number[]): { p10: number; p25: number; p50: number; p75: number; p90: number } {
  return {
    p10: roundTwo(percentile(sorted, 10)),
    p25: roundTwo(percentile(sorted, 25)),
    p50: roundTwo(percentile(sorted, 50)),
    p75: roundTwo(percentile(sorted, 75)),
    p90: roundTwo(percentile(sorted, 90)),
  };
}

/** Binary search for count of elements > threshold in a sorted array */
function countAbove(sorted: number[], threshold: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] <= threshold) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return sorted.length - lo;
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
    gasoline: Math.round((countAbove(gasolineResults, t) / runs) * 100),
    diesel: Math.round((countAbove(dieselResults, t) / runs) * 100),
  }));

  return {
    runs,
    pumpGasoline: percentileBand(gasolineResults),
    pumpDiesel: percentileBand(dieselResults),
    probabilityAbove,
    computeTimeMs: Math.round(performance.now() - start),
  };
}
