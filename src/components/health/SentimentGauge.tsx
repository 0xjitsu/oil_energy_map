'use client';

import { useSentiment, SentimentResult } from '@/hooks/useSentiment';

const SENTIMENT_BADGE: Record<SentimentResult['sentiment'], { bg: string; text: string }> = {
  positive: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
  negative: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
  neutral: { bg: 'bg-zinc-500/20 border-zinc-500/30', text: 'text-zinc-400' },
};

function overallLabel(score: number): { label: string; color: string } {
  if (score > 0.2) return { label: 'BULLISH', color: 'text-emerald-400' };
  if (score < -0.2) return { label: 'BEARISH', color: 'text-red-400' };
  return { label: 'NEUTRAL', color: 'text-yellow-400' };
}

export function SentimentGauge() {
  const { sentiments, overallScore, isLoading, error } = useSentiment();
  const overall = overallLabel(overallScore);

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
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
          Market Sentiment
        </p>
        <p className="text-xs text-text-subtle font-mono">
          {error ?? 'No sentiment data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-sans">
          Market Sentiment
        </p>
        <span className={`text-sm font-mono font-bold ${overall.color}`}>
          {overall.label}
        </span>
      </div>

      <div className="space-y-2">
        {sentiments.map((s, i) => {
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
    </div>
  );
}
