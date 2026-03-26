import { TimelineEvent } from '@/types';

export const timelineEvents: TimelineEvent[] = [
  {
    date: 'Mar 25, 2026',
    event: 'Dubai crude holds above $166/bbl — 4th consecutive day at record highs',
    severity: 'red',
    source: 'Reuters',
    sourceUrl: 'https://www.reuters.com/business/energy/',
  },
  {
    date: 'Mar 24, 2026',
    event: 'DOE announces ₱5.80/L gasoline increase, ₱8.40/L diesel effective tomorrow',
    severity: 'red',
    source: 'DOE Philippines',
    sourceUrl: 'https://www.doe.gov.ph/',
  },
  {
    date: 'Mar 23, 2026',
    event: 'Chevron Cebu terminal receives first direct shipment from South Korea',
    severity: 'green',
    source: 'BusinessWorld',
    sourceUrl: 'https://www.bworldonline.com/corporate/',
  },
  {
    date: 'Mar 22, 2026',
    event: 'Petron confirms ESPO Blend crude arriving from Russian Far East',
    severity: 'yellow',
    source: 'Inquirer',
    sourceUrl: 'https://business.inquirer.net/category/economy',
  },
  {
    date: 'Mar 20, 2026',
    event: 'Singapore refining margins hit $30/bbl — highest since 2022',
    severity: 'yellow',
    source: 'Bloomberg',
    sourceUrl: 'https://www.bloomberg.com/energy',
  },
  {
    date: 'Mar 18, 2026',
    event: 'BSP flags CPI inflation approaching 4% upper target, oil prices key driver',
    severity: 'yellow',
    source: 'BSP',
    sourceUrl: 'https://www.bsp.gov.ph/',
  },
  {
    date: 'Mar 15, 2026',
    event: 'US-Iran conflict intensifies — Hormuz transit capacity down ~40%',
    severity: 'red',
    source: 'Al Jazeera',
    sourceUrl: 'https://www.aljazeera.com/tag/strait-of-hormuz/',
  },
  {
    date: 'Mar 12, 2026',
    event: 'Phoenix Petroleum resumes gasoline imports after 11-month pause',
    severity: 'green',
    source: 'PhilStar',
    sourceUrl: 'https://www.philstar.com/business',
  },
];
