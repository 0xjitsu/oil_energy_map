'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15 border border-red-500/20 px-4 py-2.5 sm:px-6 alert-glow">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
      <p className="flex-1 text-xs font-mono text-red-300/90 leading-relaxed">
        <span className="font-bold">STRAIT OF HORMUZ</span> — Transit capacity
        reduced ~40% due to US-Iran conflict. Dubai crude at record $166+/bbl.
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
