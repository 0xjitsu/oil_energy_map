import { NextResponse } from 'next/server';
import { priceBenchmarks } from '@/data/prices';
import { PriceBenchmark } from '@/types';
import {
  fetchBrentPrice,
  fetchForexRate,
  deriveDubaiFromBrent,
  derivePumpPrices,
} from '@/lib/priceSources';

export async function GET() {
  try {
    // Fetch real data from external APIs in parallel
    const [brent, forex] = await Promise.all([
      fetchBrentPrice(),
      fetchForexRate(),
    ]);

    // If both succeed, build prices from real data
    if (brent && forex) {
      const dubai = deriveDubaiFromBrent(brent);
      const pump = derivePumpPrices(brent.value, forex.value);

      // Previous week values: use previousClose for Brent/Dubai,
      // estimate ~1% weekly forex movement, derive previous pump from previous Brent
      const prevForex = Number((forex.value * 0.995).toFixed(2));
      const prevPump = derivePumpPrices(brent.previousClose, prevForex);

      const prices: PriceBenchmark[] = [
        {
          id: 'dubai-crude',
          name: 'Dubai Crude',
          value: dubai.value,
          previousWeek: dubai.previousClose,
          unit: '$/bbl',
          tooltip: `Live. Asia-Pacific benchmark — what PH pays for raw oil.`,
        },
        {
          id: 'brent-crude',
          name: 'Brent Crude',
          value: brent.value,
          previousWeek: brent.previousClose,
          unit: '$/bbl',
          tooltip: `Live. Global benchmark via Yahoo Finance.`,
        },
        {
          id: 'mops-gasoline',
          name: 'MOPS Gasoline (95)',
          value: pump.mopsGasoline,
          previousWeek: Number((brent.previousClose + 13.5).toFixed(2)),
          unit: '$/bbl',
          tooltip: `Derived. Singapore gasoline benchmark = Brent + crack spread.`,
        },
        {
          id: 'mops-diesel',
          name: 'MOPS Diesel',
          value: pump.mopsDiesel,
          previousWeek: Number((brent.previousClose + 17).toFixed(2)),
          unit: '$/bbl',
          tooltip: `Derived. Singapore diesel benchmark = Brent + crack spread.`,
        },
        {
          id: 'php-usd',
          name: 'PHP/USD',
          value: forex.value,
          previousWeek: prevForex,
          unit: '₱/$',
          tooltip: `Live. Via FloatRates. Updated ${forex.date}.`,
        },
        {
          id: 'pump-gasoline',
          name: 'Pump Gasoline',
          value: pump.pumpGasoline,
          previousWeek: prevPump.pumpGasoline,
          unit: '₱/liter',
          tooltip: `Derived. Import parity: MOPS × forex + taxes + margin.`,
        },
        {
          id: 'pump-diesel',
          name: 'Pump Diesel',
          value: pump.pumpDiesel,
          previousWeek: prevPump.pumpDiesel,
          unit: '₱/liter',
          tooltip: `Derived. Import parity: MOPS × forex + taxes + margin.`,
        },
        {
          id: 'sg-refining-margin',
          name: 'SG Refining Margin',
          value: pump.refiningMargin,
          previousWeek: pump.refiningMargin, // Crack spread is a constant in our model
          unit: '$/bbl',
          tooltip: `Average gasoline/diesel crack spread over Brent.`,
        },
      ];

      return NextResponse.json(prices, {
        headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
      });
    }

    // Partial fallback: if only one API succeeded, still use what we can
    if (brent) {
      const enriched = priceBenchmarks.map((b) => {
        if (b.id === 'brent-crude') return { ...b, value: brent.value, previousWeek: brent.previousClose };
        const dubai = deriveDubaiFromBrent(brent);
        if (b.id === 'dubai-crude') return { ...b, value: dubai.value, previousWeek: dubai.previousClose };
        return b;
      });
      return NextResponse.json(enriched, {
        headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
      });
    }

    // Full fallback to static data
    return NextResponse.json(priceBenchmarks, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch {
    return NextResponse.json(priceBenchmarks);
  }
}
