# Energy Intelligence Map — Wave 3: Full Intelligence Platform

> **Framework**: RISE (Role-Input-Steps-Expectation)
> **Date**: 2026-03-27
> **Status**: Approved by user

---

## Role

Senior data visualization architect and energy sector analyst building a Webby-caliber intelligence platform for the Philippine oil and energy supply chain. Specializes in geospatial data pipelines, interactive storytelling dashboards, and autonomous research systems (Karpathy autoresearch pattern).

## Input

**Existing system:**
- Next.js App Router + deck.gl + Tailwind CSS dark glass-morphism dashboard
- 15 facilities (refineries, terminals, depots) on a WebGL map with 4-layer rendering (glow + column + dot + labels)
- Scenario planner with Hormuz disruption, Brent price, forex sliders
- Live RSS event ingestion, HuggingFace NLP sentiment analysis
- Firecrawl CLI installed (browser, crawl, scrape, search, map skills)
- Mem0 AI memory for persistent agent context across sessions
- Price API with ±1.5% variance, sparkline history accumulation

**Architecture inspiration:**
- Karpathy's [autoresearch](https://github.com/karpathy/autoresearch): humans write the WHAT (program.md), agents handle the HOW (code modifications), with time-boxed iteration cycles and keep/discard evaluation

**Design inspiration:**
- [Information is Beautiful](https://informationisbeautiful.net/) — data storytelling
- [Our World in Data](https://ourworldindata.org/) — interactive charts + educational depth
- [The Game Awards](https://thegameawards.com/) — dramatic presentation

---

## Steps

### Phase 1: Executive Snapshot (Narrative Storytelling)

**Goal**: First thing a visitor sees after the ticker is a dramatic row of headline KPIs — the "Bloomberg terminal at a glance" moment.

**Layout**: Separate section below header, above map. Full-width, 4-6 cards in a row.

| KPI Card | Data Source | Visual |
|----------|-------------|--------|
| Brent Crude | `/api/prices` live | Large number + 24h delta arrow (↑↓) + mini sparkline |
| PHP/USD Forex | `scenarioParams.forexRate` | Large number + delta + sparkline |
| Gasoline (National Avg) | `/api/prices` | ₱XX.XX/L + week-over-week delta |
| Diesel (National Avg) | `/api/prices` | ₱XX.XX/L + week-over-week delta |
| Supply Risk Level | Derived from scenario | Color-coded badge: LOW/MODERATE/HIGH/CRITICAL |
| Active Disruptions | Event count from `/api/events` | Count badge with severity breakdown |

**Design requirements:**
- Monospace numbers, large (24-32px)
- Green/red delta arrows with percentage change
- Mini sparkline (last 7 data points) inside or below each number
- Glass-card styling, subtle glow on hover
- Responsive: 3-col on mobile, 6-col on desktop

### Phase 2: Commercial Gas Station Layer (~7,000+ stations)

**Goal**: Map every gas station in the Philippines by brand with full national coverage.

**Data acquisition** (one-time scrape, stored as seed data):

| Brand | Source Strategy | Expected Count |
|-------|----------------|----------------|
| Petron | petron.com station locator + Firecrawl | ~2,400 |
| Shell | shell.com.ph station finder | ~1,100 |
| Phoenix | phoenixfuels.ph | ~700 |
| Caltex/Chevron | caltex.com/ph | ~600 |
| SeaOil | seaoil.com.ph | ~500 |
| Unioil | unioil.com | ~400 |
| Total/Flying V/Jetti/PTT | Individual sites + DOE registry | ~1,300+ |

**Data schema per station:**
```typescript
interface GasStation {
  id: string;
  brand: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  address: string;
  fuelTypes?: string[]; // ['gasoline', 'diesel', 'premium']
  operatingHours?: string;
  source: {
    url: string;
    scrapedAt: string; // ISO date
  };
}
```

**Rendering:**
- ScatterplotLayer with brand colors (same palette as PlayerCards)
- Cluster at zoom < 8 (IconClusterLayer or custom aggregation)
- Individual dots at zoom ≥ 8 with brand icon
- Toggle per brand in LayerControls
- Click shows station detail (name, address, fuel types)

**Storage:** `/data/stations/` — one JSON file per brand, importable as static data.

### Phase 3: Oil & Energy Primer (Interactive Educational Page)

**Goal**: A dedicated `/primer` route that explains how oil works end-to-end, with Philippine-specific context. Interactive, not just a wall of text.

**Structure:**
1. **Hero**: "How Energy Reaches You" — animated supply chain flow
2. **Interactive Flow Diagram**: Horizontal pipeline with clickable stages:
   - Crude Extraction (global fields → tankers)
   - Maritime Transport (Hormuz, Malacca, shipping lanes)
   - Refinery Processing (Petron Bataan — the only one)
   - Distribution Terminals (import terminals around PH)
   - Local Depots (regional distribution)
   - Gas Stations (retail — links to commercial layer)
   - Consumer Impact (links to ImpactCards)
3. **Each stage expands** to reveal:
   - What happens here (2-3 sentences)
   - PH-specific context ("Philippines imports 95% of crude oil")
   - Key players at this stage
   - "See on map" deep-link back to main map with relevant facilities highlighted
4. **Sidebar/Section: Crude Oil Types**
   - WTI vs Brent vs Dubai crude
   - Light vs heavy, sweet vs sour
   - Why PH imports Dubai crude specifically
   - How crude type affects refinery output and pump prices
5. **Content storage**: `/data/primer/` as structured JSON — agent-updatable

**Design:**
- Glass-card sections with scroll-driven fade-in animations
- Interactive elements use CSS transitions (accordion expand, not conditional render)
- Dark theme consistent with main dashboard
- IntersectionObserver for number counters and stage reveal animations

### Phase 4: Autoresearch Architecture

**Goal**: Enable AI agents to autonomously improve data quality and coverage over time, using Karpathy's program.md pattern.

**Directory structure:**
```
/research/
├── programs/
│   ├── station-discovery.md    — goals for finding new/closed stations
│   ├── price-monitoring.md     — goals for tracking price changes
│   ├── supply-risk.md          — goals for geopolitical risk assessment
│   └── primer-enrichment.md    — goals for keeping educational content current
├── outputs/                    — agent research results (JSON + markdown)
└── logs/                       — iteration history (kept/discarded decisions)
```

**Separation principle:**
- **Fixed (immutable):** Data ingestion pipelines, API routes, storage schemas, UI components
- **Agent-editable:** Analysis logic, alert thresholds, enrichment rules, research program files
- **Dual-format output:** Every research result in both JSON (agent-consumable) and markdown (human-readable)

### Phase 5: Data References & Provenance

**Goal**: A `/references` route showing every data source used in the platform — the "bibliography."

**Table columns:**
| Source Name | URL | Data Type | Record Count | Last Updated | Freshness |
|-------------|-----|-----------|-------------|-------------|-----------|
| DOE Price Monitor | doe.gov.ph | Pump prices | Weekly | Auto | 🟢 |
| Petron Station Locator | petron.com | Stations | 2,400 | Seed scrape | 🟡 |
| Reuters RSS | reuters.com | Events | Live | Continuous | 🟢 |
| etc. | | | | | |

**Auto-generated** from metadata files in `/data/` — each data file includes a `_meta` section with source info.

---

## Expectation (Success Criteria)

1. **Narrative flow**: Alert → Ticker → Executive KPIs (dramatic numbers with sparklines) → Map → Details. A first-time visitor understands the current energy situation in 5 seconds.
2. **Gas station layer**: 7,000+ points render smoothly, cluster at low zoom, individual at high zoom, toggle per brand.
3. **Primer page**: Explains oil supply chain end-to-end interactively, with PH-specific context and deep-links to map.
4. **References page**: Complete data provenance — every number traces to a source URL.
5. **Autoresearch**: `/research/programs/` directory enables agents to autonomously improve data over time.
6. **Dual-format**: All data is JSON (agents) + visual (humans).
7. **Performance**: 7,000 point ScatterplotLayer maintains 60fps with clustering.
8. **No push until visual verification passes**.

---

## Future Work (Parked)

- **Regional filtering**: Filter stations by Metro Manila, province, or region. Requires enriching station data with region/province tags (from reverse geocoding or OSM admin boundaries).
- **Live price data per station**: Pull real-time pump prices from DOE weekly price monitor and display per-station in the tooltip.
- **Google Maps photos**: Enrich station tooltips with storefront photos via Google Places API (requires API key + budget ~$73 for full coverage).
- **Station clustering**: IconClusterLayer at zoom < 8 to aggregate dense station clusters into count badges.

## Implementation Order

1. ~~Executive Snapshot KPI cards~~ ✅ (immediate visual impact, uses existing data)
2. ~~Gas station data scraping~~ ✅ (OpenStreetMap Overpass API, 10,469 stations)
3. ~~Gas station map layer~~ ✅ (render with brand colors + per-brand toggles + hover tooltip)
4. ~~Oil primer page~~ ✅ (content + interactivity)
5. References page (auto-generated from data metadata)
6. Autoresearch directory structure (program.md files)

Phases 1 and 2 can run in parallel (UI work + data scraping are independent).
