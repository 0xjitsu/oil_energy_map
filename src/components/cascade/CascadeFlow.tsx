'use client';

import type { CascadeCategory, CascadeNode } from '@/types/cascade';
import { philippineCascade, CATEGORY_COLORS } from '@/data/cascade';
import { CascadeCard } from './CascadeCard';

const CATEGORY_ORDER: CascadeCategory[] = ['energy', 'agriculture', 'transport', 'consumer'];

const CATEGORY_LABELS: Record<CascadeCategory, string> = {
  energy: 'Energy',
  agriculture: 'Agriculture & Food',
  transport: 'Transport & Logistics',
  consumer: 'Consumer Impact',
  industry: 'Industry',
};

function groupByCategory(nodes: CascadeNode[]): Record<CascadeCategory, CascadeNode[]> {
  const groups = {} as Record<CascadeCategory, CascadeNode[]>;
  for (const node of nodes) {
    if (!groups[node.category]) groups[node.category] = [];
    groups[node.category].push(node);
  }
  return groups;
}

function ArrowConnector() {
  return (
    <div className="flex items-center justify-center py-2" aria-hidden="true">
      <svg width="24" height="32" viewBox="0 0 24 32" className="text-text-dim">
        <path
          d="M12 0 L12 24 M6 18 L12 26 L18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function CascadeFlow() {
  const groups = groupByCategory(philippineCascade.nodes);

  return (
    <div className="space-y-2">
      {CATEGORY_ORDER.map((category, idx) => {
        const nodes = groups[category];
        if (!nodes) return null;
        const color = CATEGORY_COLORS[category];

        return (
          <div key={category}>
            {idx > 0 && <ArrowConnector />}

            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                {CATEGORY_LABELS[category]}
              </span>
              <div className="flex-1 h-px bg-border-subtle ml-2" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <CascadeCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
