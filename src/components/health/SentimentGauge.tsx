'use client';

import { useRef, useEffect } from 'react';
import { useSentiment, SentimentResult } from '@/hooks/useSentiment';
import { SparkChart } from '@/components/prices/SparkChart';
import { SourceAttribution } from '@/components/ui/SourceAttribution';

const SENTIMENT_BADGE: Record<SentimentResult['sentiment'], { bg: string; text: string }> = {
  positive: { bg: 'bg-status-green/20 border-status-green/30', text: 'text-status-green' },
  negative: { bg: 'bg-status-red/20 border-status-red/30', text: 'text-status-red' },
  neutral: { bg: 'bg-zinc-500/20 border-zinc-500/30', text: 'text-zinc-400' },
};

function overallLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score > 0.2) return { label: 'BULLISH', color: 'text-status-green', bgColor: 'bg-status-green' };
  if (score < -0.2) return { label: 'BEARISH', color: 'text-status-red', bgColor: 'bg-status-red' };
  return { label: 'NEUTRAL', color: 'text-status-yellow', bgColor: 'bg-status-yellow' };
}

export function SentimentGauge() {
  const { sentiments, overallScore, isLoading, error } = useSentiment();
  const overall = overallLabel(overallScore);
  const historyRef = useRef<number[]>([]);

  // Track sentiment history (last 10 readings)
  useEffect(() => {
    if (!isLoading && !error && sentiments.length > 0) {
      const history = historyRef.current;
      history.push(overallScore);
      if (history.length > 10) history.shift();
    }
  }, [overallScore, isLoading, error, sentiments.length]);

  // Normalize score from [-1, 1] to [0, 100] for the gauge bar
  const gaugePercent = Math.round((overallScore + 1) * 50);

  // Determine trend
  const history = historyRef.current;
  const trend = (() => {
    if (history.length < 2) return 'stable' as const;
    const recent = history[history.length - 1];
    const prev = history[history.length - 2];
    const diff = recent - prev;
    if (diff > 0.05) return 'improving' as const;
    if (diff < -0.05) return 'deteriorating' as const;
    return 'stable' as const;
  })();

  const trendConfig = {
    improving: { arrow: '▲', color: 'text-status-green', sparkColor: 'var(--status-green)' },
    deteriorating: { arrow: '▼', color: 'text-status-red', sparkColor: 'var(--status-red)' },
    stable: { arrow: '–', color: 'text-text-subtle', sparkColor: '#71717a' },
  }[trend];

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-border-subtle rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-border rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || sentiments.length === 0) {
    return (
      <div className="glass-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3 font-sans">
          Market Sentiment
        </p>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-mono font-bold text-text-subtle">UNAVAILABLE</span>
          <span className="text-[9px] font-mono text-text-dim">
            Sentiment API offline — retrying
          </span>
        </div>
        {/* Neutral gauge bar as placeholder */}
        <div className="h-1.5 rounded-full bg-border-subtle overflow-hidden">
          <div className="h-full rounded-full bg-zinc-600 w-1/2 opacity-40" />
        </div>
      </div>
    );
  }

  // Count sentiment breakdown
  const counts = { positive: 0, negative: 0, neutral: 0 };
  for (const s of sentiments) counts[s.sentiment]++;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-sans">
          Market Sentiment
        </p>
        <span className={`text-sm font-mono font-bold ${overall.color}`}>
          {overall.label}
          <span className="text-xs font-mono text-text-subtle ml-2">
            ({overallScore > 0 ? '+' : ''}{overallScore.toFixed(2)})
          </span>
        </span>
      </div>

      {/* Sentiment gauge bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-status-red/60">BEARISH</span>
          <span className="text-[9px] font-mono text-status-green/60">BULLISH</span>
        </div>
        <div className="relative h-2 rounded-full bg-border-subtle overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${overall.bgColor} transition-all duration-700 ease-out`}
            style={{ width: `${gaugePercent}%`, opacity: 0.7 }}
          />
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 -translate-x-px w-0.5 h-full bg-text-dim" />
        </div>
      </div>

      {/* Trend sparkline + shift arrow */}
      {history.length >= 2 && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-mono font-bold ${trendConfig.color}`}>
            {trendConfig.arrow}
          </span>
          <SparkChart
            data={history.map((v) => (v + 1) * 50)}
            color={trendConfig.sparkColor}
            width={80}
            height={20}
          />
          <span className="text-[9px] font-mono text-text-dim">
            {trend === 'improving' ? 'Improving' : trend === 'deteriorating' ? 'Deteriorating' : 'Stable'}
          </span>
        </div>
      )}

      {/* Sentiment breakdown counts */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-status-green" />
          <span className="text-[10px] font-mono text-text-secondary">{counts.positive} pos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-500" />
          <span className="text-[10px] font-mono text-text-secondary">{counts.neutral} neu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-status-red" />
          <span className="text-[10px] font-mono text-text-secondary">{counts.negative} neg</span>
        </div>
      </div>

      {/* Headline list */}
      <div className="space-y-2">
        {sentiments.slice(0, 5).map((s, i) => {
          const badge = SENTIMENT_BADGE[s.sentiment];
          return (
            <div key={i} className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 inline-flex rounded border px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${badge.bg} ${badge.text}`}
              >
                {s.sentiment === 'positive' ? 'POS' : s.sentiment === 'negative' ? 'NEG' : 'NEU'}
              </span>
              <p className="text-[11px] text-text-secondary font-sans leading-tight line-clamp-2">
                {s.headline}
              </p>
            </div>
          );
        })}
      </div>

      <SourceAttribution source="NLP Sentiment Analysis" updated="Polled every 15m" />
    </div>
  );
}
