export type CascadeCategory = 'energy' | 'agriculture' | 'transport' | 'consumer' | 'industry';
export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface CascadeNode {
  id: string;
  label: string;
  category: CascadeCategory;
  icon: string;
  currentValue: string;
  baselineValue: string;
  changePercent: number;
  impact: string;
  source: string;
  sourceUrl?: string;
  severity: SeverityLevel;
}

export interface CascadeLink {
  from: string;
  to: string;
  mechanism: string;
  lag: string;
}

export interface CascadeChain {
  id: string;
  name: string;
  description: string;
  nodes: CascadeNode[];
  links: CascadeLink[];
}
