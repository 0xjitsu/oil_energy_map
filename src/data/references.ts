export interface DataReference {
  name: string;
  url: string;
  dataType: string;
  recordCount: string;
  updateFrequency: string;
  status: 'active' | 'baseline' | 'simulated';
  description: string;
  license?: string;
  lastVerified: string;
}

export const dataReferences: DataReference[] = [
  {
    name: 'OpenStreetMap Overpass API',
    url: 'https://overpass-api.de',
    dataType: 'Gas Stations',
    recordCount: '10,469',
    updateFrequency: 'Seed (one-time)',
    status: 'active',
    description:
      'Complete fuel station dataset for the Philippines extracted via Overpass QL. Includes brand, coordinates, and amenity tags for every mapped station.',
    license: 'ODbL',
    lastVerified: '2026-04-05',
  },
  {
    name: 'DOE Oil Monitor (Weekly SRP)',
    url: 'https://doe.gov.ph/articles/group/liquid-fuels?category=Oil+Monitor&display_type=Card',
    dataType: 'Pump Prices',
    recordCount: 'Weekly',
    updateFrequency: 'Every Tuesday',
    status: 'active',
    description:
      'Department of Energy suggested retail prices (SRP) for gasoline and diesel. Published weekly by OIMB. Metro Manila baseline.',
    license: 'Philippine Open Data',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Reuters Energy RSS',
    url: 'https://www.reuters.com/business/energy',
    dataType: 'News Events',
    recordCount: 'Live',
    updateFrequency: 'Every 15 min',
    status: 'active',
    description:
      'Real-time energy news feed powering the event timeline and NLP sentiment analysis pipeline.',
    license: 'Fair Use',
    lastVerified: '2026-04-05',
  },
  {
    name: 'HuggingFace Inference API',
    url: 'https://huggingface.co',
    dataType: 'NLP Sentiment',
    recordCount: 'Live',
    updateFrequency: 'On demand',
    status: 'active',
    description:
      'Serverless transformer models for headline sentiment classification. Powers the real-time sentiment gauge.',
    license: 'Apache 2.0',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Philippine Statistics Authority',
    url: 'https://psa.gov.ph',
    dataType: 'Forex Rates',
    recordCount: 'Daily',
    updateFrequency: 'Simulated',
    status: 'simulated',
    description:
      'Official Philippine peso exchange rate data used for crude import cost calculations and scenario modeling.',
    license: 'Philippine Open Data',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Petron Corporation',
    url: 'https://www.petron.com',
    dataType: 'Refinery Data',
    recordCount: '1 facility',
    updateFrequency: 'Static',
    status: 'baseline',
    description:
      'Bataan refinery capacity and operational data. Petron operates the only refinery in the Philippines (180,000 bpd).',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Shell Philippines',
    url: 'https://www.shell.com.ph',
    dataType: 'Terminal Data',
    recordCount: '3 facilities',
    updateFrequency: 'Static',
    status: 'baseline',
    description:
      'Import terminal and depot locations across Luzon, Visayas, and Mindanao for Shell/Pilipinas Shell.',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Phoenix Petroleum',
    url: 'https://www.phoenixfuels.ph',
    dataType: 'Terminal Data',
    recordCount: '2 facilities',
    updateFrequency: 'Static',
    status: 'baseline',
    description:
      'Depot and terminal infrastructure for Phoenix Petroleum, the largest independent oil company in the Philippines.',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Chevron Philippines',
    url: 'https://www.caltex.com/ph',
    dataType: 'Terminal Data',
    recordCount: '2 facilities',
    updateFrequency: 'Static',
    status: 'baseline',
    description:
      'Caltex-branded import terminal and distribution depot locations across the Philippine archipelago.',
    lastVerified: '2026-04-05',
  },
  {
    name: 'CARTO Dark Matter',
    url: 'https://carto.com',
    dataType: 'Map Tiles',
    recordCount: 'Continuous',
    updateFrequency: 'Live',
    status: 'active',
    description:
      'Dark-themed vector basemap tiles used as the WebGL map background. Served via CartoCDN with global edge caching.',
    license: 'CC BY 3.0',
    lastVerified: '2026-04-05',
  },
  {
    name: 'EIA (US Energy Information)',
    url: 'https://www.eia.gov',
    dataType: 'Brent/WTI Benchmark',
    recordCount: 'Daily',
    updateFrequency: 'Simulated',
    status: 'simulated',
    description:
      'International crude oil benchmark prices (Brent and WTI) used as inputs for the scenario planner and price intelligence panels.',
    license: 'Public Domain',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Bangko Sentral ng Pilipinas',
    url: 'https://www.bsp.gov.ph',
    dataType: 'PHP/USD Exchange',
    recordCount: 'Daily',
    updateFrequency: 'Simulated',
    status: 'simulated',
    description:
      'Official central bank exchange rate data for PHP/USD conversion in crude import cost modeling.',
    license: 'Philippine Open Data',
    lastVerified: '2026-04-05',
  },
  {
    name: 'PhilStar Business RSS',
    url: 'https://www.philstar.com/rss/business',
    dataType: 'News Events',
    recordCount: 'Live',
    updateFrequency: 'Every 5 min',
    status: 'active',
    description: 'Philippine business news RSS feed. Primary domestic energy news source for the event timeline.',
    license: 'Fair Use',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Google News RSS',
    url: 'https://news.google.com/rss/search?q=Philippines+oil+energy',
    dataType: 'News Events',
    recordCount: 'Live',
    updateFrequency: 'Every 5 min',
    status: 'active',
    description: 'Aggregated news search for Philippines oil and OPEC topics. Feeds the event timeline with global coverage.',
    license: 'Fair Use',
    lastVerified: '2026-04-05',
  },
  {
    name: 'Reddit Public API',
    url: 'https://www.reddit.com',
    dataType: 'Social Sentiment',
    recordCount: 'Live',
    updateFrequency: 'Every 5 min',
    status: 'active',
    description: 'Public search API for r/Philippines and r/energy subreddits. Provides crowd-sourced energy discussion signals.',
    license: 'Reddit API Terms',
    lastVerified: '2026-04-05',
  },
  {
    name: 'DOE Licensed Fuel Retail Outlets (LFRO)',
    url: 'https://legacy.doe.gov.ph/downstream-oil/lfro-with-valid-coc-lfo',
    dataType: 'Station Classification',
    recordCount: '10,469',
    updateFrequency: 'Weekly',
    status: 'active',
    description:
      'Licensed fuel retail outlets with valid Certificate of Compliance. Used for brand classification and operational status baseline.',
    license: 'Philippine Open Data',
    lastVerified: '2026-04-05',
  },
  {
    name: 'DOE Oil Supply/Demand Reports',
    url: 'https://doe.gov.ph/articles/group/reports-information-resources',
    dataType: 'Supply Monitoring',
    recordCount: 'Reports',
    updateFrequency: 'Weekly',
    status: 'active',
    description:
      'Weekly supply inventory and days-of-supply data by region. Powers station status assignment for low-supply and out-of-stock classifications.',
    license: 'Philippine Open Data',
    lastVerified: '2026-04-05',
  },
];
