'use client';

import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Severity, SourceType } from '@/types';
import { ExternalLink } from 'lucide-react';

const SEVERITY_COLORS: Record<Severity, string> = {
  red: 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  yellow: 'bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.4)]',
  green: 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]',
};

const SOURCE_TYPE_STYLES: Record<SourceType, string> = {
  news: 'text-blue-400/70',
  government: 'text-emerald-400/70',
  social: 'text-purple-400/70',
  ai: 'text-orange-400/70',
  market: 'text-yellow-400/70',
};

type SeverityFilter = 'all' | Severity;
type SourceFilter = 'all' | SourceType;

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'red', label: 'Critical' },
  { key: 'yellow', label: 'Watch' },
  { key: 'green', label: 'Positive' },
];

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'news', label: 'News' },
  { key: 'government', label: 'Gov' },
  { key: 'social', label: 'Social' },
  { key: 'ai', label: 'AI' },
  { key: 'market', label: 'Market' },
];

export function EventTimeline() {
  const { events: timelineEvents } = useEvents();
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const filtered = timelineEvents.filter(e => {
    if (filter !== 'all' && e.severity !== filter) return false;
    if (sourceFilter !== 'all' && e.sourceType !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="glass-card p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] mb-3 font-sans">
        Event Timeline
      </h3>

      {/* Severity filter tabs */}
      <div className="flex gap-1 mb-2">
        {SEVERITY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-all ${
              filter === f.key
                ? 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.9)]'
                : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Source type filter tabs */}
      <div className="flex gap-1 mb-4">
        {SOURCE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setSourceFilter(f.key)}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-all ${
              sourceFilter === f.key
                ? 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)]'
                : 'text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {/* Connecting line with gradient */}
        <div className="absolute left-[4.5px] top-1 bottom-1 w-px bg-gradient-to-b from-red-500/40 via-yellow-500/20 to-emerald-500/10" />

        <div className="space-y-3">
          {filtered.map((entry, idx) => (
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
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-[10px] font-mono hover:brightness-125 transition-all ${SOURCE_TYPE_STYLES[entry.sourceType]}`}
                  >
                    {entry.source}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(255,255,255,0.15)]">
                    {entry.sourceType}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
