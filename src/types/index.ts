export type FacilityType = 'refinery' | 'terminal' | 'depot';
export type FacilityStatus = 'operational' | 'closed' | 'upgraded';
export type Severity = 'red' | 'yellow' | 'green';
export type RiskLevel = 'green' | 'yellow' | 'red';
export type RouteStatus = 'active' | 'disrupted' | 'new';

export interface Facility {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  operator: string;
  capacity: string;
  status: FacilityStatus;
  type: FacilityType;
  notes: string;
  color: string;
  isPrimary?: boolean; // true for Petron Bataan
}

export interface ShippingRoute {
  id: string;
  origin: string;
  destination: string;
  status: RouteStatus;
  color: string;
  label: string;
  notes: string;
  coordinates: [number, number][]; // array of [lat, lng] points forming the route
}

export interface PriceBenchmark {
  id: string;
  name: string;
  value: number;
  previousWeek: number;
  unit: string;
  tooltip: string;
}

export interface MarketPlayer {
  name: string;
  marketShare: number;
  stations: number;
  strategy: string;
  vulnerabilityScore: number;
  color: string;
  logo: string;
}

export type SourceType = 'news' | 'government' | 'social' | 'ai' | 'market';

export interface TimelineEvent {
  date: string;
  event: string;
  severity: Severity;
  source: string;
  sourceUrl: string;
  sourceType: SourceType;
}

export interface ScenarioParams {
  brentPrice: number;
  hormuzWeeks: number;
  forexRate: number;
  refineryOffline: boolean;
}

export interface ScenarioResult {
  gasoline: number;
  diesel: number;
  riskLevel: RiskLevel;
}

export interface ImpactItem {
  label: string;
  icon: string;
  current: string;
  change: string;
  tooltip: string;
}

export interface VitalSign {
  label: string;
  value: string;
  status: RiskLevel;
  tooltip: string;
}
