'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useCrisis } from '@/lib/CrisisProvider';

export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { events } = useEvents();
  const { crisisLevel } = useCrisis();

  const critical = events.find((e) => e.severity === 'red');

  if (dismissed || !critical) return null;

  return (
    <div className={`relative flex items-center gap-3 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15 border px-4 py-2.5 sm:px-6 alert-glow ${
      crisisLevel === 'CRISIS'
        ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        : 'border-red-500/20'
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
      <p className={`flex-1 font-mono text-red-300/90 leading-relaxed ${
        crisisLevel === 'CRISIS' ? 'text-sm font-semibold' : 'text-xs'
      }`}>
        <span className="font-bold">{critical.source.toUpperCase()}</span> — {critical.event}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-red-400/60 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
