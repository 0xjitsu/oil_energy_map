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
  {
    url: 'https://news.google.com/rss/search?q=OPEC+crude+oil+supply&hl=en&gl=US&ceid=US:en',
    source: 'Google News',
    sourceType: 'news',
  },
  {
    url: 'https://www.doe.gov.ph/news-and-media?format=feed&type=rss',
    source: 'DOE Philippines',
    sourceType: 'government',
  },
];

// Reddit public JSON API — no auth needed for search
const REDDIT_SEARCHES = [
  { subreddit: 'Philippines', query: 'oil gas fuel price', source: 'r/Philippines' },
  { subreddit: 'energy', query: 'crude oil OPEC supply', source: 'r/energy' },
];

interface RedditPost {
  data: {
    title: string;
    created_utc: number;
    permalink: string;
    score: number;
  };
}

interface RedditSearchResponse {
  data: {
    children: RedditPost[];
  };
}

async function fetchRedditPosts(
  subreddit: string,
  query: string,
  source: string,
): Promise<TimelineEvent[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&restrict_sr=on&limit=5&t=week`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ph-oil-intel/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const data: RedditSearchResponse = await res.json();
    return (data?.data?.children ?? [])
      .filter((post) => ENERGY_KEYWORDS.test(post.data.title))
      .map((post): TimelineEvent => ({
        date: formatDate(new Date(post.data.created_utc * 1000).toISOString()),
        event: post.data.title.slice(0, 120),
        severity: estimateSeverity(post.data.title),
        source,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        sourceType: 'social',
      }));
  } catch {
    return [];
  }
}

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

    // Fetch Reddit posts in parallel with RSS
    const redditPromises = REDDIT_SEARCHES.map((r) =>
      fetchRedditPosts(r.subreddit, r.query, r.source),
    );

    const [feedResults, redditResults] = await Promise.all([
      Promise.all(feedPromises),
      Promise.all(redditPromises),
    ]);
    const rssEvents = [...feedResults.flat(), ...redditResults.flat()];

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

    // Sort by date descending
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(
      { events: merged.slice(0, 50), lastChecked: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    // Fallback to static data on any error
    return NextResponse.json({ events: timelineEvents, lastChecked: null });
  }
}
