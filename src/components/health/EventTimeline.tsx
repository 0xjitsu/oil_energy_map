'use client';

import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Severity, SourceType } from '@/types';
import { ExternalLink, Newspaper, Landmark, MessageCircle, Bot, TrendingUp, ChevronDown } from 'lucide-react';
import { SourceAttribution } from '@/components/ui/SourceAttribution';
import { EmptyState } from '@/components/ui/EmptyState';

const SEVERITY_COLORS: Record<Severity, { dot: string; bg: string; text: string; label: string }> = {
  red: {
    dot: 'bg-status-red shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    bg: 'bg-red-500/8 border-red-500/20',
    text: 'text-red-400',
    label: 'CRITICAL',
  },
  yellow: {
    dot: 'bg-status-yellow shadow-[0_0_8px_rgba(234,179,8,0.4)]',
    bg: 'bg-yellow-500/8 border-yellow-500/15',
    text: 'text-yellow-400',
    label: 'WATCH',
  },
  green: {
    dot: 'bg-status-green shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    bg: 'bg-emerald-500/8 border-emerald-500/15',
    text: 'text-emerald-400',
    label: 'POSITIVE',
  },
};

const SOURCE_ICONS: Record<SourceType, { icon: typeof Newspaper; color: string; label: string }> = {
  news: { icon: Newspaper, color: 'text-blue-400', label: 'News' },
  government: { icon: Landmark, color: 'text-emerald-400', label: 'Gov' },
  social: { icon: MessageCircle, color: 'text-purple-400', label: 'Social' },
  ai: { icon: Bot, color: 'text-orange-400', label: 'AI' },
  market: { icon: TrendingUp, color: 'text-yellow-400', label: 'Market' },
};

type SeverityFilter = 'all' | Severity;
type SourceFilter = 'all' | SourceType;

function relativeTime(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function EventTimeline() {
  const { events: timelineEvents, isLive, lastUpdated } = useEvents();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = timelineEvents.filter(e => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (sourceFilter !== 'all' && e.sourceType !== sourceFilter) return false;
    return true;
  });

  // Count by severity for the distribution bar
  const counts: Record<Severity, number> = { red: 0, yellow: 0, green: 0 };
  for (const e of timelineEvents) counts[e.severity]++;
  const total = timelineEvents.length || 1;

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="glass-card p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-sans">
            Intelligence Feed
          </p>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-live" />
              <span className="text-[8px] font-mono text-emerald-400 uppercase">Live</span>
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-[9px] font-mono text-text-dim">
            {relativeTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* Severity distribution bar — visual summary at a glance */}
      <div className="mb-4">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-border-subtle">
          <div
            className="bg-status-red transition-all duration-500"
            style={{ width: `${(counts.red / total) * 100}%` }}
          />
          <div
            className="bg-status-yellow transition-all duration-500"
            style={{ width: `${(counts.yellow / total) * 100}%` }}
          />
          <div
            className="bg-status-green transition-all duration-500"
            style={{ width: `${(counts.green / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-1.5">
          {(['red', 'yellow', 'green'] as Severity[]).map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[s].dot}`} />
              <span className={`text-[9px] font-mono ${SEVERITY_COLORS[s].text}`}>
                {counts[s]} {SEVERITY_COLORS[s].label.toLowerCase()}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Combined filter row — severity + source in one line */}
      <div className="flex flex-wrap items-center gap-1 mb-4">
        {/* Severity chips */}
        {([
          { key: 'all' as SeverityFilter, label: 'All' },
          { key: 'red' as SeverityFilter, label: 'Critical' },
          { key: 'yellow' as SeverityFilter, label: 'Watch' },
          { key: 'green' as SeverityFilter, label: 'Positive' },
        ]).map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSeverityFilter(f.key)}
            aria-pressed={severityFilter === f.key}
            className={`px-2 py-1 text-[10px] font-mono rounded-md transition-colors ${
              severityFilter === f.key
                ? 'bg-border-hover text-text-primary'
                : 'text-text-subtle hover:text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Source chips with icons */}
        {(Object.entries(SOURCE_ICONS) as [SourceType, typeof SOURCE_ICONS['news']][]).map(([key, src]) => {
          const Icon = src.icon;
          const active = sourceFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSourceFilter(active ? 'all' : key)}
              aria-pressed={sourceFilter === key}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-md transition-colors ${
                active
                  ? `bg-border-hover ${src.color}`
                  : 'text-text-subtle hover:text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-3 h-3" />
              {src.label}
            </button>
          );
        })}
      </div>

      {/* Event list */}
      <div className="relative">
        {/* Connecting timeline line */}
        <div className="absolute left-[4.5px] top-2 bottom-2 w-px bg-gradient-to-b from-red-500/30 via-yellow-500/15 to-emerald-500/10" />

        <div className="space-y-1">
          {displayed.map((entry, idx) => {
            const severity = SEVERITY_COLORS[entry.severity];
            const source = SOURCE_ICONS[entry.sourceType];
            const Icon = source.icon;
            const isOpen = expanded === idx;
            const isCritical = entry.severity === 'red';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setExpanded(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className={`relative flex gap-3 w-full text-left rounded-lg px-2 py-2 transition-colors cursor-pointer ${
                  isCritical ? severity.bg : 'hover:bg-surface-hover'
                } ${isCritical ? 'border' : ''}`}
              >
                {/* Severity dot */}
                <div className="relative z-10 mt-1 shrink-0">
                  <span className={`inline-block h-[10px] w-[10px] rounded-full ${severity.dot}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-text-subtle">{entry.date}</span>
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${severity.text}`}>
                      {severity.label}
                    </span>
                  </div>
                  <p className={`text-[11px] font-sans leading-relaxed ${isCritical ? 'text-text-primary font-medium' : 'text-text-body'} ${isOpen ? '' : 'line-clamp-2'}`}>
                    {entry.event}
                  </p>

                  {/* Source + expand indicator */}
                  <div className="flex items-center justify-between mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${source.color}/70`}>
                      <Icon className="w-2.5 h-2.5" />
                      {entry.source}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded: source link */}
                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-2 mt-2 border-t border-border-subtle">
                        <a
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono ${source.color} hover:brightness-125 transition-all`}
                        >
                          Read full article
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
                            {entry.sourceType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <EmptyState
          icon={<Newspaper className="w-6 h-6" />}
          message="No events match the current filters"
          minH="80px"
        />
      )}

      {/* Show more / less */}
      {filtered.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 text-[10px] font-mono text-text-subtle hover:text-text-secondary rounded-md hover:bg-surface-hover transition-colors"
        >
          {showAll ? `Show less` : `Show all ${filtered.length} events`}
        </button>
      )}

      <SourceAttribution
        source={isLive ? 'RSS Intelligence Feeds' : 'Cached events'}
      />
    </div>
  );
}
