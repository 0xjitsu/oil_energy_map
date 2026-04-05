export interface RoadmapItem {
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'planned' | 'future';
  tags: string[];
}

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  subtitle: string;
  items: RoadmapItem[];
}

export interface DataSourceUpgrade {
  name: string;
  current: string;
  planned: string;
  impact: string;
  status: 'done' | 'in-progress' | 'planned' | 'future';
}

export interface ContributorOpportunity {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const roadmapPhases: RoadmapPhase[] = [
  {
    id: 'ph-foundation',
    phase: 'Phase 1',
    title: 'Philippines Foundation',
    subtitle: 'Core infrastructure for PH fuel market intelligence',
    items: [
      {
        title: 'WebGL map with 10,469 gas stations',
        description:
          'Interactive WebGL-powered map rendering all known gas stations across the Philippines sourced from OpenStreetMap. Enables spatial analysis of fuel access, coverage gaps, and brand concentration at a national scale.',
        status: 'done',
        tags: ['mapping', 'data'],
      },
      {
        title: 'Live Brent crude and PHP/USD forex feeds',
        description:
          'Real-time integration of Brent crude oil prices and PHP/USD exchange rates to compute import parity pricing. Gives users an instant read on whether local pump prices reflect current global market conditions.',
        status: 'done',
        tags: ['prices', 'api'],
      },
      {
        title: 'RSS news aggregation with NLP sentiment',
        description:
          'Automated aggregation of energy news from DOE, major publications, and wire services, scored for sentiment using NLP. Surfaces bullish or bearish signals around fuel prices before they hit the pump.',
        status: 'done',
        tags: ['news', 'ai'],
      },
      {
        title: 'Scenario planner and Monte Carlo stress testing',
        description:
          'Interactive simulator letting users model the pump-price impact of crude oil shocks, peso depreciation, and excise tax changes. Monte Carlo engine generates probability distributions so policymakers and consumers can plan for tail risks.',
        status: 'done',
        tags: ['analysis', 'simulation'],
      },
      {
        title: 'AI agent discoverability — llms.txt, ai-manifest.json',
        description:
          'Published llms.txt and ai-manifest.json metadata so AI assistants and autonomous agents can discover, understand, and integrate with this dashboard programmatically. Positions the project as a machine-readable energy data endpoint.',
        status: 'done',
        tags: ['ai', 'developer'],
      },
    ],
  },
  {
    id: 'ph-enrichment',
    phase: 'Phase 2',
    title: 'Philippine Data Enrichment',
    subtitle: 'Richer, more granular PH-specific data feeds',
    items: [
      {
        title: 'DOE actual pump price feeds',
        description:
          'Pump prices now sourced from DOE Oil Monitor weekly SRP instead of derived import-parity estimates. Reflects actual Metro Manila prices including disruption premiums not captured by the Brent + forex model.',
        status: 'done',
        tags: ['prices', 'government'],
      },
      {
        title: 'Google Places station enrichment',
        description:
          'Augment OSM station data with Google Places attributes including operating hours, user ratings, photos, and amenities. Transforms raw coordinate data into actionable consumer information.',
        status: 'planned',
        tags: ['mapping', 'enrichment'],
      },
      {
        title: 'Historical price charts',
        description:
          'Time-series visualization of pump prices, crude benchmarks, and forex going back to 2016, enabling trend analysis and seasonal pattern recognition. Provides context missing from point-in-time snapshots.',
        status: 'planned',
        tags: ['prices', 'visualization'],
      },
      {
        title: 'Station-level price comparison',
        description:
          'Side-by-side price comparison across stations within a configurable radius, letting consumers find the cheapest fuel nearby. Drives accountability among oil companies and empowers consumer decision-making.',
        status: 'planned',
        tags: ['prices', 'consumer'],
      },
      {
        title: 'Weather disruption correlation',
        description:
          'Overlay PAGASA typhoon tracks and historical weather events against fuel supply disruptions and price spikes to identify causal patterns. Feeds into early-warning models ahead of storm season.',
        status: 'planned',
        tags: ['weather', 'risk'],
      },
    ],
  },
  {
    id: 'asean-expansion',
    phase: 'Phase 3',
    title: 'ASEAN Expansion',
    subtitle: 'Scaling the intelligence layer across Southeast Asia',
    items: [
      {
        title: 'Malaysia fuel market integration',
        description:
          'Add Malaysian pump price data (RON 95, RON 97, diesel) from KPDNHEP alongside station mapping for Peninsular Malaysia, Sabah, and Sarawak. Enables cross-border price comparison with the Philippines.',
        status: 'future',
        tags: ['expansion', 'malaysia'],
      },
      {
        title: 'Indonesia fuel subsidy tracking',
        description:
          'Monitor Pertamina subsidized and non-subsidized fuel prices across Indonesian provinces, including subsidy reform events. Indonesia is the region\'s largest fuel consumer and a key benchmark for ASEAN energy policy.',
        status: 'future',
        tags: ['expansion', 'indonesia'],
      },
      {
        title: 'Thailand PTT and regional refinery data',
        description:
          'Integrate PTT retail prices and Thailand\'s refinery throughput data, which serves as a major regional supply node. Adds a critical upstream data point for modeling ASEAN fuel availability.',
        status: 'future',
        tags: ['expansion', 'thailand'],
      },
      {
        title: 'Malacca Strait ship tracking',
        description:
          'Real-time AIS vessel tracking for tankers transiting the Malacca Strait, the chokepoint through which ~80% of ASEAN seaborne oil imports pass. Provides early signals for supply tightness or disruption.',
        status: 'future',
        tags: ['shipping', 'real-time'],
      },
      {
        title: 'Cross-border price arbitrage analysis',
        description:
          'Algorithmic detection of price differentials between neighboring ASEAN markets that create arbitrage opportunities or fuel smuggling incentives. Useful for regulators and traders alike.',
        status: 'future',
        tags: ['analysis', 'prices'],
      },
    ],
  },
  {
    id: 'global-vision',
    phase: 'Phase 4',
    title: 'Global Energy Intelligence',
    subtitle: 'Becoming the pandemic-tracker equivalent for global energy markets',
    items: [
      {
        title: 'Global chokepoint monitoring',
        description:
          'Real-time risk dashboards for the world\'s critical oil transit chokepoints — Strait of Hormuz, Suez Canal, Bab-el-Mandeb, and Malacca — integrating geopolitical alerts, vessel queues, and insurance rates.',
        status: 'future',
        tags: ['geopolitics', 'risk'],
      },
      {
        title: 'OPEC production data feeds',
        description:
          'Automated ingestion of JODI and IEA monthly production statistics for OPEC and OPEC+ members, with quota compliance tracking and output deviation alerts. The supply side of the global oil equation.',
        status: 'future',
        tags: ['supply', 'data'],
      },
      {
        title: 'Refinery utilization dashboard',
        description:
          'Track global refinery capacity utilization, planned maintenance windows, and unplanned outages sourced from operator announcements and satellite imagery. Refinery tightness is a leading indicator for product price spikes.',
        status: 'future',
        tags: ['supply', 'infrastructure'],
      },
      {
        title: 'Sanctions and trade flow mapping',
        description:
          'Visualize the rerouting of oil trade flows caused by sanctions regimes (Russia, Iran, Venezuela) and track dark-fleet tanker movements. Reveals shadow supply dynamics that official statistics miss.',
        status: 'future',
        tags: ['geopolitics', 'trade'],
      },
      {
        title: 'Multi-language support',
        description:
          'Localized UI in Filipino, Bahasa Indonesia, Thai, Vietnamese, and Malay to make the intelligence layer accessible to non-English-speaking users across ASEAN. Accessibility is a prerequisite for regional adoption.',
        status: 'future',
        tags: ['i18n', 'accessibility'],
      },
    ],
  },
];

export const dataSourceUpgrades: DataSourceUpgrade[] = [
  {
    name: 'Pump Prices',
    current: 'Derived via import parity calculation',
    planned: 'DOE weekly CSV direct feed',
    impact:
      'Replaces estimated prices with official per-brand, per-region data — closing the accuracy gap for consumers and analysts.',
    status: 'in-progress',
  },
  {
    name: 'Tanker Movements',
    current: 'Static shipping lane overlays',
    planned: 'AIS real-time vessel tracking',
    impact:
      'Live tanker positions near Philippine ports will serve as a 5–10 day leading indicator for local fuel supply changes.',
    status: 'planned',
  },
  {
    name: 'OPEC Production',
    current: 'Not tracked',
    planned: 'JODI/IEA monthly production data',
    impact:
      'Adds the upstream supply dimension, enabling users to correlate OPEC output decisions with downstream pump price movements.',
    status: 'future',
  },
  {
    name: 'Refinery Status',
    current: 'Static nameplate capacity data',
    planned: 'Maintenance schedules and unplanned outage feeds',
    impact:
      'Refinery disruptions are among the fastest-moving drivers of product price premiums — real-time status data unlocks this signal.',
    status: 'future',
  },
  {
    name: 'Weather Impact',
    current: 'Not tracked',
    planned: 'PAGASA typhoon correlation engine',
    impact:
      'Historical correlation between typhoon tracks and supply disruptions will power predictive alerts ahead of storm season.',
    status: 'planned',
  },
  {
    name: 'Station Details',
    current: 'OpenStreetMap community data',
    planned: 'Google Places enrichment layer',
    impact:
      'Adds operating hours, ratings, photos, and amenity data, transforming raw coordinates into consumer-grade station profiles.',
    status: 'planned',
  },
];

export const contributorOpportunities: ContributorOpportunity[] = [
  {
    title: 'Add a new ASEAN country',
    description:
      'Integrate pump price data, station locations, and a country-level map layer for a new ASEAN nation (Vietnam, Singapore, Cambodia, etc.). Requires sourcing data, mapping the ETL pipeline, and adding UI toggles.',
    difficulty: 'advanced',
    tags: ['expansion', 'data'],
  },
  {
    title: 'Build a price alert system',
    description:
      'Create a notification system that lets users subscribe to price change alerts via email or browser push. Triggers when pump prices, Brent crude, or the PHP/USD rate cross user-defined thresholds.',
    difficulty: 'intermediate',
    tags: ['feature', 'notifications'],
  },
  {
    title: 'Add historical price charts',
    description:
      'Build time-series chart components for pump prices, crude benchmarks, and forex going back to 2016. Requires sourcing or scraping historical DOE data and integrating a charting library.',
    difficulty: 'intermediate',
    tags: ['visualization', 'data'],
  },
  {
    title: 'Weather disruption overlay',
    description:
      'Add a PAGASA typhoon track overlay to the main map and build a correlation view showing how past storms affected fuel supply and prices. Includes fetching PAGASA advisory RSS feeds.',
    difficulty: 'intermediate',
    tags: ['weather', 'mapping'],
  },
  {
    title: 'Improve mobile experience',
    description:
      'Audit and improve the dashboard on small screens (375px–414px). Fix map controls, filter panels, and data tables for touch interaction. Good first issue for frontend contributors.',
    difficulty: 'beginner',
    tags: ['mobile', 'ux'],
  },
  {
    title: 'Write integration tests',
    description:
      'Add Playwright or Cypress integration tests covering the map load, scenario planner inputs, and news feed rendering. Helps prevent regressions as the codebase grows.',
    difficulty: 'beginner',
    tags: ['testing', 'quality'],
  },
];
