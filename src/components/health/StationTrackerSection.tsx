'use client';

import { statusCounts } from '@/data/stations';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';

const STAT_CARDS: { label: string; status: StationStatus | null }[] = [
  { label: 'Total Tracked', status: null },
  { label: STATUS_LABELS['out-of-stock'], status: 'out-of-stock' },
  { label: STATUS_LABELS['low-supply'], status: 'low-supply' },
  { label: STATUS_LABELS.closed, status: 'closed' },
  { label: STATUS_LABELS.operational, status: 'operational' },
];

const TOTAL_STATIONS = 10_469;

export function StationTrackerSection() {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-petron" />
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Station Status
        </h2>
        <div className="flex-1 h-px bg-border-subtle ml-2" />
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Fuel availability across 10,469 monitored stations
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, status }) => {
          const count = status ? statusCounts[status] : TOTAL_STATIONS;
          const color = status ? STATUS_COLORS[status] : undefined;

          return (
            <div
              key={label}
              className="glass-card p-4"
              style={color ? { borderLeft: `3px solid ${color}` } : undefined}
            >
              <div
                className="font-mono text-2xl font-bold"
                style={color ? { color } : undefined}
              >
                {count.toLocaleString()}
              </div>
              <div className="text-xs text-text-secondary mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Source attribution */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-text-dim">
        <span>Sources:</span>
        <a
          href="https://wiki.openstreetmap.org/wiki/Philippines"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          OpenStreetMap (ODbL)
        </a>
        <span>·</span>
        <a
          href="https://legacy.doe.gov.ph/downstream-oil/lfro-with-valid-coc-lfo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          DOE LFRO Registry
        </a>
        <span>·</span>
        <a
          href="https://doe.gov.ph/articles/group/reports-information-resources"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          DOE Oil Supply Reports
        </a>
      </div>
    </div>
  );
}
