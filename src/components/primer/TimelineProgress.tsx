'use client';

import { supplyChainStages } from '@/data/primer';

interface TimelineProgressProps {
  activeStage: number;
}

export function TimelineProgress({ activeStage }: TimelineProgressProps) {
  return (
    <nav
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-0"
      aria-label="Supply chain stages"
    >
      {supplyChainStages.map((stage) => {
        const isActive = stage.number === activeStage;
        const isPast = stage.number < activeStage;

        return (
          <div key={stage.id} className="flex flex-col items-center">
            {/* Connector line (above dot, except first) */}
            {stage.number > 1 && (
              <div
                className="w-px h-6 transition-colors duration-300"
                style={{
                  backgroundColor: isPast || isActive
                    ? 'var(--accent-petron)'
                    : 'var(--border-hover)',
                }}
              />
            )}

            {/* Dot + label */}
            <button
              onClick={() => {
                const el = document.getElementById(`stage-${stage.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center gap-2 group min-h-[44px] min-w-[44px] justify-center"
              aria-label={`Stage ${stage.number}: ${stage.title}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className="w-3 h-3 rounded-full border-2 transition-all duration-300 flex-shrink-0"
                style={{
                  borderColor: isActive ? stage.color : isPast ? 'var(--accent-petron)' : 'var(--border-hover)',
                  backgroundColor: isActive ? stage.color : isPast ? 'var(--accent-petron)' : 'transparent',
                  boxShadow: isActive ? `0 0 8px color-mix(in srgb, ${stage.color} 50%, transparent)` : 'none',
                }}
              />
              <span
                className="text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors duration-300 hidden xl:block"
                style={{
                  color: isActive
                    ? 'var(--text-primary)'
                    : isPast
                      ? 'var(--text-label)'
                      : 'var(--text-muted)',
                }}
              >
                {stage.title}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
