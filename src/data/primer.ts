export interface SupplyChainStage {
  id: string;
  number: number;
  title: string;
  icon: string;
  color: string;
  what: string;
  phContext: string;
  keyPlayers: string[];
}

export interface CrudeOilType {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  highlight?: boolean;
}

export interface OilProperty {
  id: string;
  title: string;
  description: string;
}

export const supplyChainStages: SupplyChainStage[] = [
  {
    id: 'extraction',
    number: 1,
    title: 'Crude Extraction',
    icon: '\u26CF', // pick
    color: 'var(--accent-petron)',
    what: 'Crude oil is pumped from underground reservoirs in oil-producing countries. The Middle East (Saudi Arabia, UAE, Iraq) accounts for ~31% of global production.',
    phContext: 'Philippines produces virtually zero crude oil domestically. The country imports 95% of its petroleum needs, primarily Dubai crude from the Middle East.',
    keyPlayers: ['Saudi Aramco', 'ADNOC (UAE)', 'Iraq National Oil Company'],
  },
  {
    id: 'maritime',
    number: 2,
    title: 'Maritime Transport',
    icon: '\u26F5', // sailboat
    color: 'var(--accent-shell)',
    what: 'Crude oil travels via supertankers (VLCCs carrying 2M barrels each) through critical chokepoints. A single disruption can spike global prices within hours.',
    phContext: 'Philippine-bound crude passes through the Strait of Hormuz (35% of seaborne oil) and the Strait of Malacca before entering the South China Sea.',
    keyPlayers: ['International shipping companies', 'Philippine Navy (SCS patrols)'],
  },
  {
    id: 'refinery',
    number: 3,
    title: 'Refinery Processing',
    icon: '\u2699', // gear
    color: 'var(--accent-chevron)',
    what: 'Refineries heat crude oil to 400\u00B0C+ in distillation columns, separating it into gasoline, diesel, jet fuel, LPG, and other products. Each crude type yields different product ratios.',
    phContext: 'Petron Bataan Refinery is the ONLY operating refinery in the Philippines (180,000 bpd capacity). All other fuel is imported as finished product from Singapore and South Korea.',
    keyPlayers: ['Petron Corporation (San Miguel Group)'],
  },
  {
    id: 'terminals',
    number: 4,
    title: 'Distribution Terminals',
    icon: '\u2693', // anchor
    color: 'var(--accent-phoenix)',
    what: 'Import terminals receive both crude oil (for Bataan) and finished petroleum products. Tank farms store fuel before distribution to regional depots.',
    phContext: 'Major import terminals in Batangas, Subic, Limay, and Rosario handle the bulk of Philippine fuel imports. Terminal capacity determines how many days of supply the country holds.',
    keyPlayers: ['Petron', 'Shell', 'Phoenix', 'Chevron Philippines'],
  },
  {
    id: 'depots',
    number: 5,
    title: 'Local Depots',
    icon: '\u2302', // house
    color: 'var(--accent-seaoil)',
    what: 'Regional depots receive fuel from terminals via pipeline, barge, or tanker truck. They serve as last-mile distribution hubs for gas stations in their area.',
    phContext: 'The Philippines has ~50 depots nationwide. Island geography means many areas rely on inter-island barges, adding cost and vulnerability to weather disruptions.',
    keyPlayers: ['All major oil companies operate depot networks'],
  },
  {
    id: 'stations',
    number: 6,
    title: 'Gas Stations',
    icon: '\u26FD', // fuel pump
    color: 'var(--status-green)',
    what: 'Retail outlets sell fuel to consumers. Station count and geographic coverage determine market accessibility. Prices vary by location due to transport costs.',
    phContext: 'Over 10,000 gas stations nationwide across 7+ brands. Petron leads with ~2,400 stations, followed by Shell (~1,100) and Caltex (~600).',
    keyPlayers: ['Petron', 'Shell', 'Caltex', 'Phoenix', 'SeaOil', 'Unioil'],
  },
  {
    id: 'consumer',
    number: 7,
    title: 'Consumer Impact',
    icon: '\u20B1', // peso sign
    color: 'var(--status-yellow)',
    what: 'Every \u20B11 increase in pump price ripples through the entire economy \u2014 from jeepney fares to food delivery costs to cooking gas prices.',
    phContext: 'Transport accounts for ~10% of household spending in the Philippines. A \u20B15/liter diesel increase can raise jeepney minimum fare by \u20B11\u20132 and food prices by 2\u20133%.',
    keyPlayers: ['LTFRB (fare regulation)', 'DTI (price monitoring)', 'DOE (weekly price updates)'],
  },
];

export const crudeOilTypes: CrudeOilType[] = [
  {
    id: 'brent',
    name: 'Brent Crude',
    subtitle: 'North Sea Benchmark',
    description: 'Used globally as the primary price reference. Light, sweet crude (low sulfur content). Produced from North Sea oil fields. Brent sets the tone for roughly two-thirds of globally traded crude.',
  },
  {
    id: 'wti',
    name: 'WTI',
    subtitle: 'West Texas Intermediate',
    description: 'The US benchmark crude. Slightly lighter than Brent. Trades at a discount to Brent due to the US shale production surplus. Delivered at Cushing, Oklahoma.',
  },
  {
    id: 'dubai',
    name: 'Dubai/Oman Crude',
    subtitle: 'Asia-Pacific Benchmark',
    description: 'The Middle East benchmark that matters most for Asia-Pacific. Medium, sour (higher sulfur). THIS is what Philippines prices are based on. When Dubai crude moves, Philippine pump prices follow within 2\u20133 weeks.',
    highlight: true,
  },
];

export const oilProperties: OilProperty[] = [
  {
    id: 'light-heavy',
    title: 'Light vs Heavy',
    description: 'Light crude yields more gasoline and diesel per barrel (more valuable). Heavy crude yields more fuel oil and asphalt (less valuable but cheaper to buy). API gravity above 31.1\u00B0 is classified as light.',
  },
  {
    id: 'sweet-sour',
    title: 'Sweet vs Sour',
    description: 'Sweet crude has low sulfur (<0.5%), making it easier and cheaper to refine. Sour crude has high sulfur, needing more processing. Dubai crude is sour, which is why Petron Bataan needs a special hydrodesulfurization unit.',
  },
];
