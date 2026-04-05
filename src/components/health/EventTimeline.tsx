'use client';

import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Severity, SourceType } from '@/types';
import { ExternalLink, Newspaper, Landmark, MessageCircle, Bot, TrendingUp } from 'lucide-react';

const SEVERITY_COLORS: Record<Severity, string> = {
  red: 'bg-status-red shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  yellow: 'bg-status-yellow shadow-[0_0_8px_rgba(234,179,8,0.4)]',
  green: 'bg-status-green shadow-[0_0_8px_rgba(16,185,129,0.4)]',
};

const SEVERITY_LEGEND: { key: Severity; label: string; color: string }[] = [
  { key: 'red', label: 'Critical', color: 'bg-status-red' },
  { key: 'yellow', label: 'Watch', color: 'bg-status-yellow' },
  { key: 'green', label: 'Positive', color: 'bg-status-green' },
];

const SOURCE_TYPE_STYLES: Record<SourceType, { color: string; icon: typeof Newspaper }> = {
  news: { color: 'text-blue-400/70', icon: Newspaper },
  government: { color: 'text-emerald-400/70', icon: Landmark },
  social: { color: 'text-purple-400/70', icon: MessageCircle },
  ai: { color: 'text-orange-400/70', icon: Bot },
  market: { color: 'text-yellow-400/70', icon: TrendingUp },
};

const SOURCE_LEGEND: { key: SourceType; label: string; color: string }[] = [
  { key: 'news', label: 'News', color: 'text-blue-400' },
  { key: 'government', label: 'Gov', color: 'text-emerald-400' },
  { key: 'social', label: 'Social', color: 'text-purple-400' },
  { key: 'ai', label: 'AI', color: 'text-orange-400' },
  { key: 'market', label: 'Market', color: 'text-yellow-400' },
];

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

function relativeTime(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function EventTimeline() {
  const { events: timelineEvents, lastUpdated } = useEvents();
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const filtered = timelineEvents.filter(e => {
    if (filter !== 'all' && e.severity !== filter) return false;
    if (sourceFilter !== 'all' && e.sourceType !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="glass-card p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-3 font-sans">
        Event Timeline
      </h3>

      {lastUpdated && (
        <p className="text-[9px] font-mono text-text-dim mb-2">
          Updated {relativeTime(lastUpdated)}
        </p>
      )}

      {/* Legends */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Severity:</span>
        {SEVERITY_LEGEND.map(l => (
          <span key={l.key} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${l.color}`} />
            <span className="text-[9px] font-mono text-text-subtle">{l.label}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Source:</span>
        {SOURCE_LEGEND.map(l => {
          const Icon = SOURCE_TYPE_STYLES[l.key].icon;
          return (
            <span key={l.key} className={`inline-flex items-center gap-1 ${l.color}`}>
              <Icon className="w-2.5 h-2.5" />
              <span className="text-[9px] font-mono">{l.label}</span>
            </span>
          );
        })}
      </div>

      {/* Severity filter tabs */}
      <div className="flex gap-1 mb-2">
        {SEVERITY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-all ${
              filter === f.key
                ? 'bg-border-hover text-text-primary'
                : 'text-text-subtle hover:text-text-secondary hover:bg-surface-hover'
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
                ? 'bg-border-subtle text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
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
          {filtered.map((entry, idx) => {
            const sourceStyle = SOURCE_TYPE_STYLES[entry.sourceType];
            const Icon = sourceStyle.icon;
            return (
              <div key={idx} className="relative flex gap-3 pl-0">
                {/* Severity dot with glow */}
                <div className="relative z-10 mt-0.5 shrink-0">
                  <span
                    className={`inline-block h-[10px] w-[10px] rounded-full ${SEVERITY_COLORS[entry.severity]}`}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-text-subtle">
                    {entry.date}
                  </p>
                  <p className="text-xs font-sans text-text-body leading-relaxed mt-0.5">
                    {entry.event}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-[10px] font-mono hover:brightness-125 transition-all ${sourceStyle.color}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {entry.source}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-text-dim">
                      {entry.sourceType}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
