import { NextResponse } from 'next/server';

const API_MANIFEST = {
  name: 'PH Energy Intelligence Map API',
  version: '1.0',
  base_url: 'https://energy-intelligence-map.vercel.app',
  documentation: 'https://energy-intelligence-map.vercel.app/references',
  source_code: 'https://github.com/0xjitsu/oil_energy_map',
  endpoints: [
    {
      path: '/api/prices',
      method: 'GET',
      description:
        'Live oil price benchmarks including Brent crude (Yahoo Finance), PHP/USD forex (FloatRates), and derived pump prices via import parity formula',
      cache_ttl: '15 minutes',
      response: {
        type: 'PriceBenchmark[]',
        fields: {
          id: 'string — unique benchmark identifier',
          name: 'string — display name',
          value: 'number — current price',
          unit: 'string — $/bbl, PHP/liter, or PHP/$',
          change: 'number — percentage change from previous period',
          direction: '"up" | "down" | "stable"',
          isLive: 'boolean — true if sourced from live API, false if derived',
        },
      },
    },
    {
      path: '/api/events',
      method: 'GET',
      description:
        'Aggregated Philippine energy news from RSS feeds (PhilStar, Al Jazeera, DOE, Google News, Reddit), filtered for energy relevance, with severity ratings',
      cache_ttl: '5 minutes',
      response: {
        type: 'TimelineEvent[]',
        fields: {
          id: 'string — unique event identifier',
          headline: 'string — event headline',
          date: 'string — ISO date',
          source: 'string — source name',
          sourceType: '"news" | "government" | "social" | "analysis"',
          severity: '"red" | "yellow" | "green"',
          url: 'string — link to original article',
        },
      },
    },
    {
      path: '/api/sentiment',
      method: 'GET',
      description:
        'NLP sentiment analysis of recent energy headlines using HuggingFace distilbert-sst-2',
      cache_ttl: 'on-demand',
      response: {
        type: 'SentimentResult[]',
        fields: {
          headline: 'string — analyzed headline',
          sentiment: '"positive" | "negative" | "neutral"',
          score: 'number — confidence score 0-1',
        },
      },
    },
  ],
};

export async function GET() {
  return NextResponse.json(API_MANIFEST, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}