# API Routes

## Overview

All routes are Next.js App Router route handlers (`src/app/api/`). No authentication required — all endpoints serve public aggregated data. Upstream failures degrade gracefully to static fallback data rather than returning errors, with one exception: `/api/sentiment` requires `HUGGINGFACE_API_TOKEN` and returns HTTP errors when the token is missing or the upstream model fails.

Base URL: `https://energy-intelligence-map.vercel.app`

---

## GET /api/prices

Returns current oil price benchmarks. Fetches live data from two external APIs in parallel; falls back to static data on failure.

**Response:** `PriceBenchmark[]` (always 8 items)

```json
[
  {
    "id": "brent-crude",
    "name": "Brent Crude",
    "value": 107.90,
    "previousWeek": 105.80,
    "unit": "$/bbl",
    "tooltip": "Live. Global benchmark via Yahoo Finance."
  }
]
```

**Benchmark IDs returned (in order):**

| `id` | Name | Unit | Source |
|------|------|------|--------|
| `dubai-crude` | Dubai Crude | $/bbl | Derived: Brent + $2.50 spread |
| `brent-crude` | Brent Crude | $/bbl | Live: Yahoo Finance (`BZ=F` futures) |
| `mops-gasoline` | MOPS Gasoline (95) | $/bbl | Derived: Brent + $13.50 crack spread |
| `mops-diesel` | MOPS Diesel | $/bbl | Derived: Brent + $17.00 crack spread |
| `php-usd` | PHP/USD | ₱/$ | Live: FloatRates (daily) |
| `pump-gasoline` | Pump Gasoline | ₱/liter | Static: DOE Oil Monitor weekly SRP |
| `pump-diesel` | Pump Diesel | ₱/liter | Static: DOE Oil Monitor weekly SRP |
| `sg-refining-margin` | SG Refining Margin | $/bbl | Static: hardcoded average crack spread |

**Degradation tiers:**

| Condition | Behavior |
|-----------|----------|
| Both Brent + forex succeed | Full live response: live Brent, live forex, derived Dubai/MOPS, static DOE pump prices |
| Only Brent succeeds | Partial enrichment: live Brent + derived Dubai; all other benchmarks from static fallback |
| Both fail or exception thrown | Full static fallback (`src/data/prices.ts`); no `Cache-Control` header on exception path |

**Cache:** `s-maxage=900, stale-while-revalidate=1800` (15 min fresh, 30 min stale-while-revalidate). Header omitted on the exception catch path.

**Client polling:** 5-minute interval (`usePrices` hook per `CLAUDE.md`).

**Note on pump prices:** Pump gasoline and diesel are always sourced from static DOE data, not derived from live Brent/forex. The import parity formula is available in `src/lib/priceSources.ts` (`derivePumpPrices`) but is intentionally not used for pump prices in this route — it underestimates during supply disruptions.

---

## GET /api/events

Returns energy news events aggregated from RSS feeds and Reddit, merged with a static baseline and de-duplicated.

**Response:**

```json
{
  "events": [TimelineEvent, ...],
  "lastChecked": "2026-04-07T06:00:00.000Z"
}
```

Up to 50 events, sorted by date descending. On fallback, `lastChecked` is `null`.

**`TimelineEvent` shape:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Human-readable: `"Apr 7, 2026"` |
| `event` | `string` | Headline text, truncated to 120 characters |
| `severity` | `"red" \| "yellow" \| "green"` | Keyword-derived severity (see table below) |
| `source` | `string` | Source name (e.g. `"PhilStar"`, `"r/Philippines"`) |
| `sourceUrl` | `string` | Link to original article or post |
| `sourceType` | `"news" \| "government" \| "social" \| "ai" \| "market"` | Classification of the source |

**Severity heuristic:**

| Severity | Keywords matched (case-insensitive) |
|----------|-------------------------------------|
| `red` | record, crisis, surge, spike, war, conflict, shortage, emergency, strike |
| `green` | resume, recover, stabiliz, drop, ease, relief |
| `yellow` | (default — no strong signal either way) |

**Live data sources:**

| Source | Feed URL | `sourceType` |
|--------|----------|--------------|
| PhilStar | `philstar.com/rss/business` | `news` |
| Al Jazeera | `aljazeera.com/xml/rss/all.xml` | `news` |
| Google News (PH energy) | Google News RSS, `q=Philippines+oil+energy` | `news` |
| Google News (OPEC) | Google News RSS, `q=OPEC+crude+oil+supply` | `news` |
| DOE Philippines | `doe.gov.ph/news-and-media?format=feed&type=rss` | `government` |
| Reddit r/Philippines | Public JSON search, `q=oil gas fuel price` | `social` |
| Reddit r/energy | Public JSON search, `q=crude oil OPEC supply` | `social` |

All feeds are filtered for energy-relevance using the pattern: `oil|fuel|gasoline|diesel|petrol|crude|energy|hormuz|refinery|opec|lng|petroleum`.

**Deduplication key:** `{source}:{date}:{event[0..40]}`

**Fallback:** On any failure, returns `{ events: timelineEvents, lastChecked: null }` using `src/data/events.ts`.

**Cache:** `s-maxage=300, stale-while-revalidate=600` (5 min fresh, 10 min stale). No cache header on exception path.

**Client polling:** 3-minute interval with exponential backoff (`useEvents` hook per `CLAUDE.md`).

---

## GET /api/sentiment

Runs NLP sentiment analysis on the 5 most recent energy headlines using HuggingFace Inference API.

**Requires:** `HUGGINGFACE_API_TOKEN` environment variable.

**Model:** `distilbert-base-uncased-finetuned-sst-2-english`

**Response:** `SentimentResult[]` (5 items, one per headline analyzed)

```json
[
  {
    "headline": "Dubai crude breaches record highs as Hormuz disruption deepens",
    "sentiment": "negative",
    "score": 0.9987
  }
]
```

**`SentimentResult` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `headline` | `string` | The headline that was analyzed |
| `sentiment` | `"positive" \| "negative" \| "neutral"` | Mapped from model output |
| `score` | `number` | Confidence score 0–1 from HuggingFace |

**Sentiment mapping:** If the top label's confidence score is below `0.6`, the result is coerced to `neutral` regardless of the label.

**Headline source:** Calls `/api/events` internally to get live headlines. Falls back to `src/data/events.ts` if the events route fails or returns empty.

**Error responses (not fallback data):**

| Condition | Status | Body |
|-----------|--------|------|
| `HUGGINGFACE_API_TOKEN` not set | 503 | `{ "error": "HUGGINGFACE_API_TOKEN not configured" }` |
| HuggingFace API returns non-OK | 502 | `{ "error": "HuggingFace API error: <status>", "detail": "<body>" }` |
| Unhandled exception | 500 | `{ "error": "Failed to fetch sentiment analysis" }` |

**Cache:** `s-maxage=3600, stale-while-revalidate=7200` (1 hour fresh, 2 hours stale).

**Client polling:** 15-minute interval (`useSentiment` hook per `CLAUDE.md`).

---

## GET /api/cron

Warms all three data endpoints (`/api/prices`, `/api/events`, `/api/sentiment`) and returns a health summary. Intended for Vercel Cron.

**Authentication:** Optional. If `CRON_SECRET` is set, requests must include `Authorization: Bearer <CRON_SECRET>`. Unauthenticated requests return `401` when the secret is configured.

**Schedule:** Daily at 06:00 UTC (`0 6 * * *` — defined in `vercel.json`).

**Response:**

```json
{
  "ok": true,
  "timestamp": "2026-04-07T06:00:00.000Z",
  "results": {
    "events":    { "ok": true,  "count": 47 },
    "prices":    { "ok": true,  "count": 8 },
    "sentiment": { "ok": false, "error": "HUGGINGFACE_API_TOKEN not configured" }
  }
}
```

**Status codes:**

| Condition | Status |
|-----------|--------|
| All endpoints successful | 200 |
| One or more endpoints failed | 207 |
| `CRON_SECRET` set but header missing/wrong | 401 |

`sentiment` is only called if `HUGGINGFACE_API_TOKEN` is set; otherwise it is reported as `{ ok: false, error: "HUGGINGFACE_API_TOKEN not configured" }` without making an HTTP call.

---

## GET /api/index

Returns a static machine-readable manifest of the API. Useful for agents and integrations.

**Response:** JSON object describing all endpoints

```json
{
  "name": "PH Energy Intelligence Map API",
  "version": "1.0",
  "base_url": "https://energy-intelligence-map.vercel.app",
  "documentation": "https://energy-intelligence-map.vercel.app/references",
  "source_code": "https://github.com/0xjitsu/oil_energy_map",
  "endpoints": [ ... ]
}
```

Each entry in `endpoints` includes: `path`, `method`, `description`, `cache_ttl`, and a `response` descriptor with `type` and `fields`.

**Cache:** `public, s-maxage=86400, stale-while-revalidate=3600` (24 hours).

---

## Error Handling

### General pattern

`/api/prices` and `/api/events` always return HTTP 200 — they degrade to static fallback data rather than propagating upstream errors. The `lastChecked: null` field in the events response signals that live data was unavailable.

`/api/sentiment` is the exception: it returns HTTP 5xx errors when the HuggingFace token is missing or the upstream API fails. There is no static sentiment fallback.

### Cache-Control on errors

The exception `catch` blocks in `/api/prices` and `/api/events` do not set `Cache-Control` headers on the fallback response. This prevents CDN-level caching of stale error states.

---

## Response Types

Full TypeScript definitions are in `src/types/index.ts`. Key interfaces:

### `PriceBenchmark`

```typescript
interface PriceBenchmark {
  id: string;         // unique benchmark identifier
  name: string;       // display name
  value: number;      // current price
  previousWeek: number; // prior period price (for delta display)
  unit: string;       // "$/bbl", "₱/liter", or "₱/$"
  tooltip: string;    // source/methodology description
}
```

### `TimelineEvent`

```typescript
type Severity   = 'red' | 'yellow' | 'green';
type SourceType = 'news' | 'government' | 'social' | 'ai' | 'market';

interface TimelineEvent {
  date: string;           // formatted: "Apr 7, 2026"
  event: string;          // headline, max 120 chars
  severity: Severity;
  source: string;
  sourceUrl: string;
  sourceType: SourceType;
}
```

### `SentimentResult`

Defined inline in `src/app/api/sentiment/route.ts` (not exported from `src/types/`):

```typescript
interface SentimentResult {
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // 0–1 confidence from HuggingFace
}
```

### Cron result shape

Not a named interface — returned inline from `/api/cron`:

```typescript
{
  ok: boolean;
  timestamp: string; // ISO 8601
  results: Record<'events' | 'prices' | 'sentiment', {
    ok: boolean;
    count?: number;
    error?: string;
  }>;
}
```

---

## Environment Variables

| Variable | Required by | Effect if missing |
|----------|-------------|-------------------|
| `HUGGINGFACE_API_TOKEN` | `/api/sentiment`, `/api/cron` | Sentiment returns 503; cron skips sentiment call |
| `CRON_SECRET` | `/api/cron` | Cron endpoint accepts unauthenticated requests |
| `VERCEL_URL` | `/api/sentiment` | Internal fetch uses `http://localhost:3000` instead of the deployment URL |
