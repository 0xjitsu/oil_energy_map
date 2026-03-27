import { NextResponse } from 'next/server';
import { timelineEvents } from '@/data/events';

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

export async function GET() {
  const token = process.env.HUGGINGFACE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'HUGGINGFACE_API_TOKEN not configured' },
      { status: 503 }
    );
  }

  try {
    // Try to get live headlines from events API, fall back to static
    let headlines: string[];
    try {
      const eventsRes = await fetch(new URL('/api/events', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000').toString());
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        headlines = (Array.isArray(events) ? events : timelineEvents).slice(0, 5).map((e: { event: string }) => e.event);
      } else {
        headlines = timelineEvents.slice(0, 5).map((e) => e.event);
      }
    } catch {
      headlines = timelineEvents.slice(0, 5).map((e) => e.event);
    }

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
