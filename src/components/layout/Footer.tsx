'use client';

import { useEvents } from '@/hooks/useEvents';

export function Footer() {
  const { events } = useEvents();
  const latestDate = events[0]?.date ?? 'N/A';

  return (
    <footer className="border-t border-border py-4 px-4 sm:px-6 relative">
      {/* Gradient top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-hover to-transparent" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-mono text-text-label">
            PH Oil Intelligence Dashboard — Latest event: {latestDate}
          </p>
          <p className="text-[10px] font-mono text-text-label mt-0.5">
            For educational purposes. Not financial advice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/roadmap"
            className="inline-flex items-center text-[10px] font-mono text-text-label hover:text-text-secondary transition-colors duration-150"
          >
            Roadmap
          </a>
        </div>
      </div>
    </footer>
  );
}
