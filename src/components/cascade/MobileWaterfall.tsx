'use client';

import { philippineCascade, CATEGORY_COLORS, SEVERITY_COLORS } from '@/data/cascade';
import type { CascadeCategory, CascadeNode } from '@/types/cascade';

const CATEGORY_ORDER: CascadeCategory[] = ['energy', 'agriculture', 'transport', 'consumer'];

const CATEGORY_LABELS: Record<string, string> = {
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

interface MobileWaterfallProps {
  activeStage?: CascadeCategory | null;
}

export function MobileWaterfall({ activeStage = null }: MobileWaterfallProps) {
  const groups = groupByCategory(philippineCascade.nodes);
  const linksByFrom = new Map<string, typeof philippineCascade.links>();
  for (const link of philippineCascade.links) {
    const existing = linksByFrom.get(link.from) || [];
    existing.push(link);
    linksByFrom.set(link.from, existing);
  }

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const nodes = groups[category];
        if (!nodes) return null;
        const color = CATEGORY_COLORS[category];
        const isDimmed = activeStage !== null && activeStage !== category;

        return (
          <div key={category} className="transition-opacity duration-300" style={{ opacity: isDimmed ? 0.2 : 1 }}>
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

            {/* Node cards */}
            <div className="space-y-3">
              {nodes.map((node) => {
                const severityColor = SEVERITY_COLORS[node.severity];
                const outgoingLinks = linksByFrom.get(node.id) || [];

                return (
                  <div key={node.id}>
                    <div
                      className="glass-card p-4 space-y-2"
                      style={{ borderLeft: `3px solid ${severityColor}` }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg" aria-hidden="true">{node.icon}</span>
                          <span className="font-mono text-xs font-bold text-text-primary">
                            {node.label}
                          </span>
                        </div>
                        <span
                          className="font-mono text-[10px] uppercase tracking-widest"
                          style={{ color: severityColor }}
                        >
                          {node.severity}
                        </span>
                      </div>

                      {/* Values */}
                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-mono text-xl font-bold"
                          style={{ color: severityColor }}
                        >
                          {node.currentValue}
                        </span>
                        <span className="text-xs text-status-red font-mono">
                          {node.changePercent > 0 ? '+' : ''}{node.changePercent}%
                        </span>
                        <span className="text-[10px] text-text-dim font-mono">
                          from {node.baselineValue}
                        </span>
                      </div>

                      {/* Impact */}
                      <p className="text-xs text-text-body leading-relaxed">{node.impact}</p>

                      {/* Source */}
                      <div className="text-[10px] text-text-dim">
                        {node.sourceUrl ? (
                          <a
                            href={node.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-petron hover:underline"
                          >
                            {node.source} ↗
                          </a>
                        ) : (
                          <span>{node.source}</span>
                        )}
                      </div>
                    </div>

                    {/* Outgoing connectors */}
                    {outgoingLinks.length > 0 && (
                      <div className="ml-6 mt-1 mb-1 space-y-0.5">
                        {outgoingLinks.map((link, i) => {
                          const targetNode = philippineCascade.nodes.find((n) => n.id === link.to);
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[10px] text-text-dim font-mono"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                                <path
                                  d="M4 2 L4 12 L12 12"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.15)"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="text-text-muted">{link.mechanism}</span>
                              <span className="text-text-dim">→</span>
                              <span className="text-text-secondary">
                                {targetNode?.icon} {targetNode?.label}
                              </span>
                              <span className="text-text-dim">({link.lag})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
