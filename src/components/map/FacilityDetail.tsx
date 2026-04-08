'use client';

import type { Facility, FacilityStatus } from '@/types';
import Badge from '@/components/ui/Badge';

interface FacilityDetailProps {
  facility: Facility | null;
  onClose: () => void;
}

const statusToBadge: Record<FacilityStatus, 'green' | 'yellow' | 'red'> = {
  operational: 'green',
  upgraded: 'yellow',
  closed: 'red',
};

const statusLabel: Record<FacilityStatus, string> = {
  operational: 'OPERATIONAL',
  upgraded: 'UPGRADED',
  closed: 'CLOSED',
};

export default function FacilityDetail({ facility, onClose }: FacilityDetailProps) {
  if (!facility) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-xl overflow-hidden bg-[rgba(10,15,26,0.75)] backdrop-blur-xl border border-border-hover shadow-2xl animate-[slideUp_0.25s_ease-out]"
      style={{ borderLeft: `4px solid ${facility.color}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-mono font-bold text-sm text-text-primary leading-tight">
            {facility.name}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-text-subtle hover:text-text-body hover:bg-border-subtle transition-all duration-150 text-lg leading-none"
            aria-label="Close detail panel"
          >
            &times;
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              status={statusToBadge[facility.status]}
              label={statusLabel[facility.status]}
            />
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
            <span className="font-mono text-text-subtle uppercase tracking-wider text-[9px]">
              Location
            </span>
            <span className="text-text-body">{facility.location}</span>

            <span className="font-mono text-text-subtle uppercase tracking-wider text-[9px]">
              Operator
            </span>
            <span className="text-text-body">{facility.operator}</span>

            <span className="font-mono text-text-subtle uppercase tracking-wider text-[9px]">
              Capacity
            </span>
            <span className="text-text-body">{facility.capacity}</span>
          </div>

          {facility.notes && (
            <p className="text-[10px] text-text-label leading-relaxed mt-2 font-sans">
              {facility.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
