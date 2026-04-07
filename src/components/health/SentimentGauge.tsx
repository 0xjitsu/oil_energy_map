'use client';

import { useSentiment, SentimentResult } from '@/hooks/useSentiment';

const SENTIMENT_BADGE: Record<SentimentResult['sentiment'], { bg: string; text: string }> = {
  positive: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
  negative: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
  neutral: { bg: 'bg-zinc-500/20 border-zinc-500/30', text: 'text-zinc-400' },
};

function overallLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score > 0.2) return { label: 'BULLISH', color: 'text-emerald-400', bgColor: 'bg-emerald-500' };
  if (score < -0.2) return { label: 'BEARISH', color: 'text-red-400', bgColor: 'bg-red-500' };
  return { label: 'NEUTRAL', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
}

export function SentimentGauge() {
  const { sentiments, overallScore, isLoading, error } = useSentiment();
  const overall = overallLabel(overallScore);

  // Normalize score from [-1, 1] to [0, 100] for the gauge bar
  const gaugePercent = Math.round((overallScore + 1) * 50);

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
        </span>
      </div>

      {/* Sentiment gauge bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-red-400/60">BEARISH</span>
          <span className="text-[9px] font-mono text-emerald-400/60">BULLISH</span>
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

      {/* Sentiment breakdown counts */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-mono text-text-secondary">{counts.positive} pos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-500" />
          <span className="text-[10px] font-mono text-text-secondary">{counts.neutral} neu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
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
    </div>
  );
}
