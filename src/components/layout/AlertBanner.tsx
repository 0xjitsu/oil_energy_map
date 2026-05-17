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
    <div className={`relative flex items-center gap-3 bg-gradient-to-r from-status-red/15 via-status-red/10 to-status-red/15 border px-4 py-2.5 sm:px-6 alert-glow ${
      crisisLevel === 'CRISIS'
        ? 'border-status-red/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        : 'border-status-red/20'
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0 text-status-red" />
      <p className={`flex-1 font-mono text-status-red/90 leading-relaxed ${
        crisisLevel === 'CRISIS' ? 'text-sm font-semibold' : 'text-xs'
      }`}>
        <span className="font-bold">{critical.source.toUpperCase()}</span> — {critical.event}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-status-red/60 hover:text-status-red hover:bg-status-red/10 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
