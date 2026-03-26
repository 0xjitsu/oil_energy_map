import { timelineEvents } from '@/data/events';
import { Severity } from '@/types';

const SEVERITY_COLORS: Record<Severity, string> = {
  red: 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  yellow: 'bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.4)]',
  green: 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]',
};

export function EventTimeline() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-4 font-sans">
        Event Timeline
      </h3>
      <div className="relative">
        {/* Connecting line with gradient */}
        <div className="absolute left-[4.5px] top-1 bottom-1 w-px bg-gradient-to-b from-red-500/40 via-yellow-500/20 to-emerald-500/10" />

        <div className="space-y-4">
          {timelineEvents.map((entry, idx) => (
            <div key={idx} className="relative flex gap-3 pl-0">
              {/* Severity dot with glow */}
              <div className="relative z-10 mt-0.5 shrink-0">
                <span
                  className={`inline-block h-[10px] w-[10px] rounded-full ${SEVERITY_COLORS[entry.severity]}`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
                  {entry.date}
                </p>
                <p className="text-xs font-sans text-[rgba(255,255,255,0.65)] leading-relaxed mt-0.5">
                  {entry.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
