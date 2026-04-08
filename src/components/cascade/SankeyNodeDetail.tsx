'use client';

import { SEVERITY_COLORS, CATEGORY_COLORS } from '@/data/cascade';
import type { CascadeNode } from '@/types/cascade';

interface SankeyNodeDetailProps {
  node: CascadeNode;
  onClose: () => void;
}

export function SankeyNodeDetail({ node, onClose }: SankeyNodeDetailProps) {
  return (
    <div
      className="glass-card p-5 rounded-xl mt-4 max-w-2xl mx-auto"
      style={{ animation: 'slideUp 0.2s ease-out' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{node.icon}</span>
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">{node.label}</h3>
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: CATEGORY_COLORS[node.category] }}
            >
              {node.category}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-secondary text-xs font-mono p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close detail card"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Current</div>
          <div className="text-lg font-bold font-mono" style={{ color: SEVERITY_COLORS[node.severity] }}>
            {node.currentValue}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Baseline</div>
          <div className="text-lg font-bold font-mono text-text-secondary">{node.baselineValue}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Change</div>
          <div className="text-lg font-bold font-mono text-status-red">
            +{node.changePercent}%
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary">{node.impact}</p>

      {node.sourceUrl ? (
        <a
          href={node.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-text-dim hover:text-petron mt-2 inline-block"
        >
          Source: {node.source} ↗
        </a>
      ) : (
        <span className="text-[10px] font-mono text-text-dim mt-2 inline-block">Source: {node.source}</span>
      )}
    </div>
  );
}
