<div align="center">

# PH Oil Intelligence Dashboard

**Real-time Philippine oil supply chain intelligence — WebGL mapping, multi-channel event feeds, price analytics, scenario planning, and market monitoring.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-WebGL-396CB2?style=flat-square)](https://maplibre.org)
[![deck.gl](https://img.shields.io/badge/deck.gl-9.2-E25A1C?style=flat-square)](https://deck.gl)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-NLP-FFD21E?style=flat-square&logo=huggingface)](https://huggingface.co)
[![Live Demo](https://img.shields.io/badge/Live-energy--intelligence--map.vercel.app-00C853?style=flat-square&logo=vercel)](https://energy-intelligence-map.vercel.app)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/0xjitsu/oil_energy_map)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[Live Demo](https://energy-intelligence-map.vercel.app) | [Quick Start](#quick-start) | [Features](#features) | [Intelligence Sources](#intelligence-sources) | [Architecture](#architecture) | [Deploy](#deploy)

</div>

---

## Why This Exists

The Philippines imports ~100% of its crude oil. When geopolitical events like the Strait of Hormuz crisis hit, pump prices spike within days. This dashboard provides Palantir-grade intelligence on the PH oil supply chain — making complex market dynamics accessible to analysts, journalists, policymakers, and the general public.

Think **Pandemic (the board game), but for energy** — tracking supply chain disruptions as they spread across trade routes.

## Quick Start

```bash
# Clone and install
git clone https://github.com/0xjitsu/oil_energy_map.git
cd oil_energy_map
pnpm install

# Start dev server
pnpm dev
# Open http://localhost:3000
```

## Features

| Feature | Description |
|---------|-------------|
| **WebGL Supply Chain Map** | 3D facility markers + shipping route arcs on MapLibre GL vector tiles (CARTO dark-matter) |
| **Multi-Channel Event Feed** | Hyperlinked timeline with severity filters — aggregates news, government, social media, AI/NLP, and market sources |
| **Pump Price Monitor** | Animated real-time gasoline/diesel prices with week-over-week deltas |
| **Impact Calculator** | What oil prices mean for jeepney fares, Grab rides, rice delivery, LPG cooking |
| **Price Intelligence** | Dubai Crude, Brent, MOPS Gasoline/Diesel, PHP/USD benchmarks with sparkline charts |
| **Scenario Planner** | Interactive sliders — model crude price, peso rate, and tariff impacts on pump prices |
| **Risk Matrix** | Supply, price, infrastructure, and policy risk assessment |
| **Market Players** | Petron, Shell, Caltex, Phoenix, Seaoil, PTT market share + vulnerability analysis |
| **System Health** | Days of supply, import diversity, refinery utilization, route risk status |

## Intelligence Sources

The event timeline aggregates intelligence from 5 source types, each color-coded:

| Type | Sources | Color | Use Case |
|------|---------|-------|----------|
| **News** | Reuters, Bloomberg, Al Jazeera, PhilStar, Inquirer, BusinessWorld | Blue | Breaking market and geopolitical events |
| **Government** | DOE Philippines, BSP (Bangko Sentral) | Green | Policy announcements, price advisories, inflation data |
| **Social** | X (Twitter), Reddit r/Philippines, Facebook PH groups | Purple | Public sentiment, panic indicators, trending hashtags |
| **AI/NLP** | HuggingFace sentiment analysis, NER pipelines | Orange | Automated signal detection across 120+ energy feeds |
| **Market** | Bloomberg Terminal, Singapore Exchange | Yellow | Refining margins, benchmark prices, forex |

### HuggingFace Integration

The `/api/sentiment` route calls HuggingFace Inference API for real-time headline analysis:

- **Sentiment analysis** — classifies oil news tone using `distilbert-base-uncased-finetuned-sst-2-english` (positive/negative with confidence scores)
- **Named Entity Recognition** — detect supply disruption mentions, facility names, trade route references across energy feeds (roadmap)
- **Zero-shot classification** — categorize unstructured social media posts into risk categories (roadmap)

> HuggingFace models referenced: [text-classification](https://huggingface.co/models?pipeline_tag=text-classification&sort=trending) | [token-classification](https://huggingface.co/models?pipeline_tag=token-classification&sort=trending) | [zero-shot](https://huggingface.co/models?pipeline_tag=zero-shot-classification&sort=trending)

### Social Intelligence (Roadmap)

| Platform | Signal | Endpoint |
|----------|--------|----------|
| X (Twitter) | Trending hashtags (#OilCrisis, #OilPriceHike), volume spikes | X API v2 (free tier: 10k reads/mo) |
| Reddit | r/Philippines megathreads, r/energy sentiment | Reddit API (free, OAuth) |
| Facebook | PH energy group posts, panic buying reports | CrowdTangle / Graph API |

## Architecture

### Agent-First Data Engine

The dashboard uses an **agent-first, human-second** architecture inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch). The system fetches, analyzes, and presents data autonomously — humans curate and validate.

```
┌─────────────────────────────────────────────────────┐
│                  Vercel Cron (4h)                    │
│                    /api/cron                         │
├──────────┬──────────────┬───────────────────────────┤
│          │              │                           │
▼          ▼              ▼                           │
/api/events    /api/prices    /api/sentiment          │
RSS feeds      Variance       HuggingFace NLP         │
(PhilStar,     engine on      (distilbert SST-2)      │
Al Jazeera,    static base                            │
Google News)   prices                                 │
│          │              │                           │
└──────────┴──────┬───────┘                           │
                  ▼                                   │
           useEvents() / usePrices()                  │
           (static fallback on failure)               │
                  ▼                                   │
           ┌──────────────────┐                       │
           │   Dashboard UI   │ ← LIVE/STATIC badge   │
           │  Ticker, Events, │                       │
           │  Prices, Alerts  │                       │
           └──────────────────┘                       │
```

**Key principle**: Every data consumer tries the API first, falls back to static data. The dashboard never breaks — worst case shows stale data with an amber "STATIC" badge.

### Project Structure

```
src/
├── app/
│   ├── page.tsx           # Single-page dashboard (dynamic imports)
│   ├── layout.tsx         # Root layout (IBM Plex fonts, preconnect)
│   ├── globals.css        # Glass morphism, animations, dark theme
│   └── api/               # Agent data engine
│       ├── events/        # RSS aggregation (PhilStar, Al Jazeera, Google News)
│       ├── prices/        # Price variance engine
│       ├── sentiment/     # HuggingFace NLP (text classification)
│       └── cron/          # 4-hourly orchestrator (Vercel Cron)
├── components/
│   ├── map/               # MapLibre GL + deck.gl (WebGL)
│   │   ├── IntelMap.tsx   # Map component with DeckGL overlay
│   │   ├── FacilityLayer  # ScatterplotLayer for oil facilities
│   │   ├── ShippingLayer  # PathLayer + ArcLayer for routes
│   │   ├── LayerControls  # Glass morphism toggle panel
│   │   └── FacilityDetail # Slide-up detail panel
│   ├── prices/            # Price intelligence cards
│   ├── scenarios/         # Scenario planner + risk matrix
│   ├── players/           # Market share + player cards
│   ├── health/            # System vitals + event timeline (filterable)
│   ├── layout/            # Header (LIVE badge), footer, alert banner, ticker
│   └── ui/                # Scroll progress, fade sections, Bloomberg ticker
├── data/                  # Static fallback data (facilities, routes, prices, events)
├── hooks/                 # useEvents, usePrices, useAnimatedNumber
├── types/                 # TypeScript types (SourceType, Severity, etc.)
└── lib/                   # Scenario engine, constants
```

### Design Principles

- **Agent-first** — autonomous data pipeline fetches, analyzes, and presents data on a 4-hour cycle
- **Graceful degradation** — every component falls back to static data on API failure (192kB first-load JS)
- **Multi-channel intelligence** — events sourced from news, government, social, AI/NLP, and market feeds
- **WebGL rendering** — MapLibre GL vector tiles + deck.gl layers for 60fps map interaction
- **Glass morphism** — `backdrop-blur` + translucent borders + subtle gradients
- **Dark terminal aesthetic** — IBM Plex Mono headings, dark backgrounds, accent-coded data
- **Bloomberg-style ticker** — interleaved prices + breaking headlines in a continuous scroll
- **Layer architecture** — deck.gl layers are modular; add API data sources without touching the map

### Performance

| Optimization | Impact |
|-------------|--------|
| Dynamic imports (PricePanel, ScenarioPlanner, MarketShare, PlayerCards) | Chart JS loads on scroll, not on initial paint |
| Preconnect to CARTO tile server | Eliminates DNS/TLS latency for first tile |
| CSS `contain: layout style` on glass-card | Browser skips layout recalc for off-screen cards |
| Static generation | Full page pre-rendered at build time |

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **PH Deep Dive** | Philippine refineries, depots, shipping routes, domestic prices | ✅ Live |
| **Agent Data Engine** | RSS aggregation, HuggingFace NLP sentiment, Vercel Cron (4h), LIVE/STATIC badge | ✅ Live |
| **Bloomberg Ticker** | Interleaved prices + breaking headlines in continuous scroll | ✅ Live |
| **Social Intelligence** | X API, Reddit API, Facebook sentiment feeds | 🔜 Next |
| **Real Price Feeds** | Live crude/forex APIs replacing variance engine | 🔜 Next |
| **ASEAN Expansion** | Singapore refining hub, Malaysia, Indonesia, Thailand | 📋 Planned |
| **Asia Network** | Middle East supply routes, China demand, India refining | 📋 Planned |
| **Global Trade Map** | Full chokepoint monitoring, geopolitical risk overlay | 📋 Planned |

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xjitsu/oil_energy_map)

Or manually:

```bash
pnpm build
npx vercel --prod
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | ![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) |
| Styling | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| Map | ![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-396CB2?style=flat-square) ![deck.gl](https://img.shields.io/badge/deck.gl-E25A1C?style=flat-square) |
| Charts | ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square) |
| AI/NLP | ![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=flat-square&logo=huggingface) |
| Fonts | IBM Plex Mono + IBM Plex Sans |
| Tiles | CARTO Dark Matter (free, no API key) |
| Hosting | ![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel) |

<details>
<summary><strong>Developer Setup</strong></summary>

### Prerequisites

- Node.js 18+
- pnpm 8+

### Environment

The dashboard works without env vars (static fallback). For the agent data engine:

```bash
# .env.local
HUGGINGFACE_API_TOKEN=hf_...    # HuggingFace Inference API (required for /api/sentiment)
CRON_SECRET=...                  # Vercel Cron auth (required for /api/cron)

# Roadmap
TWITTER_BEARER_TOKEN=...         # X API v2
REDDIT_CLIENT_ID=...             # Reddit API
REDDIT_CLIENT_SECRET=...         # Reddit API
```

### Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

</details>

## License

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)](LICENSE)

This project is licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE) for details.

Commercial licensing available — contact [@0xjitsu](https://github.com/0xjitsu).

---

<div align="center">

**PH Oil Intelligence Dashboard** — Pandemic-grade threat mapping for global energy supply chains.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xjitsu/oil_energy_map)

[Live Demo](https://energy-intelligence-map.vercel.app) | [Quick Start](#quick-start) | [Report a Bug](https://github.com/0xjitsu/oil_energy_map/issues) | [Request a Feature](https://github.com/0xjitsu/oil_energy_map/issues)

</div>
