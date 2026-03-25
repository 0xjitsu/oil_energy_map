import { ImpactItem, VitalSign } from '@/types';

export const IMPACT_ITEMS: ImpactItem[] = [
  {
    label: 'Jeepney Fare',
    icon: '🚐',
    current: '₱13',
    change: '+₱1–2 per ride',
    tooltip:
      'LTFRB-regulated minimum fare. Operators absorb losses until threshold triggers fare hike petition.',
  },
  {
    label: 'Grab Ride',
    icon: '🚗',
    current: 'Base fare',
    change: '+₱8–12 surcharge',
    tooltip:
      'Grab applies a fuel surcharge automatically when diesel rises above ₱70/L threshold.',
  },
  {
    label: 'Rice Delivery',
    icon: '🍚',
    current: '₱45–55/kg',
    change: '+₱1–2/kg',
    tooltip:
      'Diesel-powered trucking from NFA warehouses to wet markets. Higher fuel = higher logistics markup.',
  },
  {
    label: 'LPG Cooking',
    icon: '🔥',
    current: '₱1,100/11kg',
    change: '+₱200–300/month',
    tooltip:
      'LPG prices track crude oil. An 11kg tank refill affects ~70% of Filipino households who cook with gas.',
  },
];

export const VITAL_SIGNS: VitalSign[] = [
  {
    label: 'Days of Supply',
    value: '14 days',
    status: 'yellow',
    tooltip:
      'DOE mandates 15-day minimum reserve. Current stock at 14 days — one disruption away from shortage.',
  },
  {
    label: 'Import Diversity',
    value: '4 sources',
    status: 'yellow',
    tooltip:
      'Middle East (70%), SE Asia (15%), US (10%), Russia (5%). Over-reliance on Hormuz corridor.',
  },
  {
    label: 'Refinery Utilization',
    value: '92%',
    status: 'green',
    tooltip:
      'Petron Bataan running near capacity at 180,000 bpd. Only refinery in the country — single point of failure.',
  },
  {
    label: 'Route Risk',
    value: 'HIGH',
    status: 'red',
    tooltip:
      'Strait of Hormuz transit disrupted ~40%. Alternative routes via Cape of Good Hope add 10–15 days and $2–4/bbl.',
  },
];
