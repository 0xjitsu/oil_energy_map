import type { CascadeNode } from '@/types/cascade';
import { CATEGORY_COLORS } from '@/data/cascade';
import { ImpactMeter } from './ImpactMeter';

interface CascadeCardProps {
  node: CascadeNode;
}

export function CascadeCard({ node }: CascadeCardProps) {
  const borderColor = CATEGORY_COLORS[node.category];

  return (
    <div
      className="glass-card p-4 space-y-3"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Header: icon + label */}
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{node.icon}</span>
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {node.label}
        </h4>
      </div>

      {/* Current value */}
      <div className="font-mono text-xl font-bold text-text-primary">
        {node.currentValue}
        <span className="ml-2 text-xs font-normal text-status-red">
          +{node.changePercent}%
        </span>
      </div>

      {/* Impact text */}
      <p className="text-xs text-text-body leading-relaxed">
        {node.impact}
      </p>

      {/* Severity meter */}
      <ImpactMeter severity={node.severity} />

      {/* Baseline + source */}
      <div className="flex items-center justify-between text-[10px] text-text-dim">
        <span>Baseline: {node.baselineValue}</span>
        {node.sourceUrl ? (
          <a
            href={node.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-petron hover:underline"
          >
            {node.source}
          </a>
        ) : (
          <span>{node.source}</span>
        )}
      </div>
    </div>
  );
}
