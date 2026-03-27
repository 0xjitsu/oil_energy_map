export interface DataReference {
  name: string;
  url: string;
  dataType: string;
  recordCount: string;
  updateFrequency: string;
  status: 'active' | 'baseline' | 'simulated';
  description: string;
  license?: string;
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
  },
  {
    name: 'DOE Weekly Price Monitor',
    url: 'https://www.doe.gov.ph',
    dataType: 'Pump Prices',
    recordCount: 'Weekly',
    updateFrequency: 'Simulated',
    status: 'simulated',
    description:
      'Department of Energy weekly prevailing price monitor for diesel, gasoline, and kerosene across NCR and provincial areas.',
    license: 'Philippine Open Data',
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
  },
];
