import { NextResponse } from 'next/server';

const HF_MODEL = 'distilbert-base-uncased-finetuned-sst-2-english';
const HF_API = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

interface HFResult {
  label: string;
  score: number;
}

export interface SentimentResult {
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

function mapLabel(label: string, score: number): SentimentResult['sentiment'] {
  if (score < 0.6) return 'neutral';
  return label === 'POSITIVE' ? 'positive' : 'negative';
}

async function getHeadlines(): Promise<string[]> {
  // Try live headlines first
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const res = await fetch(new URL('/api/events', base).toString());
    if (res.ok) {
      const events = await res.json();
      if (Array.isArray(events) && events.length > 0) {
        return events.slice(0, 5).map((e: { event: string }) => e.event);
      }
    }
  } catch {
    // Fall through to static
  }

  // Lazy-load static fallback only when needed
  const { timelineEvents } = await import('@/data/events');
  return timelineEvents.slice(0, 5).map((e) => e.event);
}

export async function GET() {
  const token = process.env.HUGGINGFACE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'HUGGINGFACE_API_TOKEN not configured' },
      { status: 503 }
    );
  }

  try {
    const headlines = await getHeadlines();

    const response = await fetch(HF_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: headlines }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `HuggingFace API error: ${response.status}`, detail: error },
        { status: 502 }
      );
    }

    const results: HFResult[][] = await response.json();

    const sentiments: SentimentResult[] = headlines.map((headline, i) => {
      const topResult = results[i]?.[0];
      if (!topResult) return { headline, sentiment: 'neutral' as const, score: 0 };
      return {
        headline,
        sentiment: mapLabel(topResult.label, topResult.score),
        score: topResult.score,
      };
    });

    return NextResponse.json(sentiments, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sentiment analysis' },
      { status: 500 }
    );
  }
}
