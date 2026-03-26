import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = request.nextUrl.origin;
  const results: Record<string, { ok: boolean; count?: number; error?: string }> = {};

  // Fetch events
  try {
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const events = await eventsRes.json();
    results.events = { ok: eventsRes.ok, count: Array.isArray(events) ? events.length : 0 };
  } catch (e) {
    results.events = { ok: false, error: String(e) };
  }

  // Fetch prices
  try {
    const pricesRes = await fetch(`${baseUrl}/api/prices`);
    const prices = await pricesRes.json();
    results.prices = { ok: pricesRes.ok, count: Array.isArray(prices) ? prices.length : 0 };
  } catch (e) {
    results.prices = { ok: false, error: String(e) };
  }

  // Fetch sentiment (only if HF token is configured)
  if (process.env.HUGGINGFACE_API_TOKEN) {
    try {
      const sentRes = await fetch(`${baseUrl}/api/sentiment`);
      const sentiment = await sentRes.json();
      results.sentiment = { ok: sentRes.ok, count: Array.isArray(sentiment) ? sentiment.length : 0 };
    } catch (e) {
      results.sentiment = { ok: false, error: String(e) };
    }
  } else {
    results.sentiment = { ok: false, error: 'HUGGINGFACE_API_TOKEN not configured' };
  }

  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json(
    { ok: allOk, timestamp: new Date().toISOString(), results },
    { status: allOk ? 200 : 207 }
  );
}
