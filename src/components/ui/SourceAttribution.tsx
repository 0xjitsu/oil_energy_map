'use client';

interface SourceAttributionProps {
  source?: string;
  updated?: string;
  derived?: string;
}

export function formatRecency(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function SourceAttribution({ source, updated, derived }: SourceAttributionProps) {
  if (derived) {
    return (
      <p className="text-[10px] font-mono text-text-muted mt-3 pt-2 border-t border-border-subtle">
        {derived}
      </p>
    );
  }

  if (!source) return null;

  return (
    <p className="text-[10px] font-mono text-text-muted mt-3 pt-2 border-t border-border-subtle">
      Source: {source}{updated ? ` \u00B7 ${updated}` : ''}
    </p>
  );
}
