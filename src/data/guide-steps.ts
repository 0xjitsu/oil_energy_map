export interface GuideStepData {
  id: string;
  icon: string;
  title: string;
  description: string;
  targetSection?: string;
}

export const GUIDE_STEPS: GuideStepData[] = [
  {
    id: 'overview',
    icon: '📊',
    title: 'Executive Overview',
    description: 'The top KPI cards show real-time production, reserves, and retail price index. These update every 5 minutes from live APIs.',
    targetSection: 'snapshot',
  },
  {
    id: 'map',
    icon: '🗺️',
    title: 'Intelligence Map',
    description: 'Zoom in/out with +/- buttons or pinch gestures. Toggle layers (Infrastructure, Stations, Routes, Labels) with the left toolbar or keyboard shortcuts I, S, R, L. Press \u2318K to search 10,000+ stations.',
    targetSection: 'map',
  },
  {
    id: 'map-modes',
    icon: '🔄',
    title: 'Map Modes',
    description: 'LIVE shows real-time activity. SCENARIO syncs with the planner sliders below. TIMELINE lets you scrub through historical data from 2022\u20132026.',
    targetSection: 'map',
  },
  {
    id: 'scenario',
    icon: '🎛️',
    title: 'Scenario Planner',
    description: 'Drag the sliders to model what-if scenarios: crude oil price changes, Strait of Hormuz disruptions, peso fluctuations, and refinery outages. Save up to 5 scenarios and compare them side-by-side.',
    targetSection: 'scenario',
  },
  {
    id: 'stress-test',
    icon: '🎲',
    title: 'Monte Carlo Stress Test',
    description: 'Run 1,000 randomized simulations to see the probability distribution of pump prices. The confidence fan shows P10\u2013P90 ranges \u2014 the range where prices are most likely to fall.',
    targetSection: 'stress-test',
  },
  {
    id: 'impact',
    icon: '👤',
    title: 'Consumer Impact',
    description: 'Select a persona (jeepney driver, household, SME, logistics fleet) to see how a scenario affects monthly fuel costs, as a percentage of income.',
    targetSection: 'impact',
  },
  {
    id: 'events',
    icon: '📰',
    title: 'Event Timeline',
    description: 'Live news from RSS feeds, Reddit, and government sources. Filter by severity (Critical, Watch, Positive) and source type (News, Gov, Social). Updates every 3 minutes.',
    targetSection: 'health',
  },
  {
    id: 'nav',
    icon: '🧭',
    title: 'Navigation',
    description: 'On desktop, use the right-side pill nav to jump between sections. On mobile, use the bottom nav bar. Press \u2318K anywhere for the command palette.',
  },
];
