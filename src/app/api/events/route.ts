import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { timelineEvents } from '@/data/events';
import { TimelineEvent, Severity, SourceType } from '@/types';

const parser = new Parser({ timeout: 5000 });

const ENERGY_KEYWORDS =
  /oil|fuel|gasoline|diesel|petrol|crude|energy|hormuz|refinery|opec|lng|petroleum/i;

const RSS_FEEDS: { url: string; source: string; sourceType: SourceType }[] = [
  {
    url: 'https://www.philstar.com/rss/business',
    source: 'PhilStar',
    sourceType: 'news',
  },
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    source: 'Al Jazeera',
    sourceType: 'news',
  },
  {
    url: 'https://news.google.com/rss/search?q=Philippines+oil+energy&hl=en-PH&gl=PH&ceid=PH:en',
    source: 'Google News',
    sourceType: 'news',
  },
];

function estimateSeverity(title: string): Severity {
  const critical = /record|crisis|surge|spike|war|conflict|shortage|emergency|strike/i;
  const positive = /resume|recover|stabiliz|drop|ease|relief/i;
  if (critical.test(title)) return 'red';
  if (positive.test(title)) return 'green';
  return 'yellow';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export async function GET() {
  try {
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items
          .filter((item) => ENERGY_KEYWORDS.test(item.title || '') || ENERGY_KEYWORDS.test(item.contentSnippet || ''))
          .slice(0, 5)
          .map((item): TimelineEvent => ({
            date: formatDate(item.pubDate),
            event: (item.title || '').slice(0, 120),
            severity: estimateSeverity(item.title || ''),
            source: feed.source,
            sourceUrl: item.link || '',
            sourceType: feed.sourceType,
          }));
      } catch {
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    const rssEvents = feedResults.flat();

    // Merge RSS events with static events, deduplicate by source+date
    const seen = new Set<string>();
    const merged: TimelineEvent[] = [];

    for (const event of [...rssEvents, ...timelineEvents]) {
      const key = `${event.source}:${event.date}:${event.event.slice(0, 40)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(event);
      }
    }

    // Sort by date descending, limit to 25
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(merged.slice(0, 25), {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch {
    // Fallback to static data on any error
    return NextResponse.json(timelineEvents);
  }
}
