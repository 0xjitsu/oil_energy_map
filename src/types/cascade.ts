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
  magnitude: number; // 0-100 scale, proportional to impact for Sankey link width
}

export interface CascadeChain {
  id: string;
  name: string;
  description: string;
  nodes: CascadeNode[];
  links: CascadeLink[];
}
