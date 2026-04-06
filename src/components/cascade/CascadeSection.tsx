'use client';

import { philippineCascade, cascadeStats, SEVERITY_COLORS } from '@/data/cascade';
import { CascadeFlow } from './CascadeFlow';

const STAT_PILLS = [
  {
    label: 'Nodes tracked',
    value: cascadeStats.totalNodes.toString(),
    color: SEVERITY_COLORS.moderate,
  },
  {
    label: 'Causal links',
    value: cascadeStats.totalLinks.toString(),
    color: SEVERITY_COLORS.moderate,
  },
  {
    label: 'Critical',
    value: cascadeStats.criticalCount.toString(),
    color: SEVERITY_COLORS.critical,
  },
  {
    label: 'High',
    value: cascadeStats.highCount.toString(),
    color: SEVERITY_COLORS.high,
  },
];

export function CascadeSection() {
  return (
    <div className="space-y-6">
      {/* Title + description */}
      <div className="max-w-3xl">
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
          {philippineCascade.name}
        </h3>
        <p className="text-sm text-text-body leading-relaxed">
          {philippineCascade.description}
        </p>
      </div>

      {/* Overview stat pills */}
      <div className="flex flex-wrap gap-2">
        {STAT_PILLS.map((pill) => (
          <div
            key={pill.label}
            className="glass-card px-3 py-1.5 flex items-center gap-2"
          >
            <span
              className="font-mono text-sm font-bold"
              style={{ color: pill.color }}
            >
              {pill.value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              {pill.label}
            </span>
          </div>
        ))}
      </div>

      {/* Cascade flow */}
      <CascadeFlow />

      {/* Attribution footer */}
      <div className="text-[10px] text-text-dim text-center pt-4 border-t border-border-subtle">
        Data from DOE Oil Monitor, PSA, DA Price Watch, LTFRB, and industry reports.
        Cascade links are modeled, not predictive.
      </div>
    </div>
  );
}
