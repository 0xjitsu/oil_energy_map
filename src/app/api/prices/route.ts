import { NextResponse } from 'next/server';
import { priceBenchmarks } from '@/data/prices';
import { PriceBenchmark } from '@/types';

// Apply small realistic variance to static prices to simulate live movement
// This will be replaced with real API feeds when available
function applyVariance(benchmarks: PriceBenchmark[]): PriceBenchmark[] {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  // Deterministic-ish seed from time so values don't flicker on every request
  const seed = hour * 60 + Math.floor(minute / 15) * 15;

  return benchmarks.map((b, i) => {
    // Small variance: ±0.3% based on seed
    const variance = Math.sin(seed + i * 7) * 0.003;
    const newValue = Number((b.value * (1 + variance)).toFixed(2));
    return { ...b, value: newValue };
  });
}

export async function GET() {
  try {
    // Future: fetch real prices from free APIs here
    // For now, apply deterministic variance to static data
    const prices = applyVariance(priceBenchmarks);

    return NextResponse.json(prices, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch {
    return NextResponse.json(priceBenchmarks);
  }
}
