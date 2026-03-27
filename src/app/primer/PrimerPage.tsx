'use client';

import Link from 'next/link';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { PrimerHero } from '@/components/primer/PrimerHero';
import { SupplyChainFlow } from '@/components/primer/SupplyChainFlow';
import { CrudeOilTypes } from '@/components/primer/CrudeOilTypes';

export function PrimerPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ScrollProgress />

      {/* Simplified header with back link */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(6,10,16,0.85)]">
        {/* Philippine flag accent bars */}
        <div className="flex h-[3px]">
          <div className="flex-1 bg-[#0038a8]" />
          <div className="flex-1 bg-[#ce1126]" />
          <div className="flex-1 bg-[#fcd116]" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="flex-shrink-0"
              >
                <path
                  d="M7.5 9L4.5 6L7.5 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </Link>
            <span className="text-[rgba(255,255,255,0.08)]">|</span>
            <h1 className="text-sm font-mono tracking-widest text-[rgba(255,255,255,0.9)] uppercase">
              Oil Primer
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <PrimerHero />
        <SupplyChainFlow />
        <CrudeOilTypes />
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.04)] py-4 px-4 sm:px-6 relative mt-16">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
            PH Oil Intelligence — Oil Primer
          </p>
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.2)]">
            For educational purposes. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
