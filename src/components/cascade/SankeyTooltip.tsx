'use client';

import { SEVERITY_COLORS } from '@/data/cascade';
import type { CascadeNode, CascadeLink } from '@/types/cascade';

interface NodeTooltipProps {
  node: CascadeNode;
  x: number;
  y: number;
}

export function NodeTooltip({ node, x, y }: NodeTooltipProps) {
  return (
    <div
      className="fixed z-50 glass-card p-3 rounded-lg max-w-xs pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{node.icon}</span>
        <span className="font-mono text-xs font-bold text-text-primary">{node.label}</span>
      </div>
      <div className="text-xl font-bold font-mono" style={{ color: SEVERITY_COLORS[node.severity] }}>
        {node.currentValue}
      </div>
      <div className="text-[10px] text-text-dim font-mono">
        {node.changePercent > 0 ? '+' : ''}{node.changePercent}% from {node.baselineValue}
      </div>
      <p className="text-xs text-text-secondary mt-1">{node.impact}</p>
    </div>
  );
}

interface LinkTooltipProps {
  link: CascadeLink;
  x: number;
  y: number;
}

export function LinkTooltip({ link, x, y }: LinkTooltipProps) {
  return (
    <div
      className="fixed z-50 glass-card p-3 rounded-lg max-w-xs pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="text-xs font-mono text-text-primary font-bold mb-1">{link.mechanism}</div>
      <div className="text-[10px] text-text-dim">Time lag: {link.lag}</div>
    </div>
  );
}
