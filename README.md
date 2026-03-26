<div align="center">

# PH Oil Intelligence Dashboard

**Real-time Philippine oil supply chain intelligence — WebGL mapping, price analytics, scenario planning, and market monitoring.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-WebGL-396CB2?style=flat-square)](https://maplibre.org)
[![deck.gl](https://img.shields.io/badge/deck.gl-9.2-E25A1C?style=flat-square)](https://deck.gl)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/0xjitsu/oil_energy_map)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[Quick Start](#quick-start) | [Features](#features) | [Architecture](#architecture) | [Deploy](#deploy)

</div>

---

## Why This Exists

The Philippines imports ~100% of its crude oil. When geopolitical events like the Strait of Hormuz crisis hit, pump prices spike within days. This dashboard provides Palantir-grade intelligence on the PH oil supply chain — making complex market dynamics accessible to analysts, journalists, policymakers, and the general public.

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
| **Pump Price Monitor** | Animated real-time gasoline/diesel prices with week-over-week deltas |
| **Impact Calculator** | What oil prices mean for jeepney fares, Grab rides, rice delivery, LPG cooking |
| **Price Intelligence** | Dubai Crude, Brent, MOPS Gasoline/Diesel, PHP/USD benchmarks with sparkline charts |
| **Scenario Planner** | Interactive sliders — model crude price, peso rate, and tariff impacts on pump prices |
| **Risk Matrix** | Supply, price, infrastructure, and policy risk assessment |
| **Market Players** | Petron, Shell, Caltex, Phoenix, Seaoil, PTT market share + vulnerability analysis |
| **System Health** | Days of supply, import diversity, refinery utilization, route risk status |
| **Event Timeline** | Chronological geopolitical and market events with severity indicators |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Single-page dashboard layout
│   ├── layout.tsx         # Root layout (IBM Plex fonts)
│   └── globals.css        # Glass morphism, animations, dark theme
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
│   ├── health/            # System vitals + event timeline
│   ├── layout/            # Header, footer, alert banner
│   └── ui/                # Scroll progress, fade sections
├── data/                  # Static data (facilities, routes, prices)
├── hooks/                 # useAnimatedNumber, useScrollProgress
└── lib/                   # Scenario engine, constants
```

### Design Principles

- **Static-first** — all data hardcoded, pages fully static (189kB first-load JS)
- **WebGL rendering** — MapLibre GL vector tiles + deck.gl layers for 60fps map interaction
- **Glass morphism** — `backdrop-blur` + translucent borders + subtle gradients
- **Dark terminal aesthetic** — IBM Plex Mono headings, dark backgrounds, accent-coded data
- **Layer architecture** — deck.gl layers are modular; add crowdsourced/API data sources without touching the map

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
| Fonts | IBM Plex Mono + IBM Plex Sans |
| Tiles | CARTO Dark Matter (free, no API key) |
| Hosting | ![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel) |

<details>
<summary><strong>Developer Setup</strong></summary>

### Prerequisites

- Node.js 18+
- pnpm 8+

### Environment

No environment variables required — all data is static and map tiles are free (CARTO).

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

**PH Oil Intelligence Dashboard** — Making oil supply chain data accessible.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xjitsu/oil_energy_map)

[Quick Start](#quick-start) | [Report a Bug](https://github.com/0xjitsu/oil_energy_map/issues) | [Request a Feature](https://github.com/0xjitsu/oil_energy_map/issues)

</div>
