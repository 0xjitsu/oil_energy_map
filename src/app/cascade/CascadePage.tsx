'use client';

import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CascadeSection } from '@/components/cascade/CascadeSection';

export function CascadePage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <Header showTicker={false} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Hero */}
        <section className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-status-red/20 bg-status-red/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-red" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-red">
              Live Cascade Tracker
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">
            Second-Order Effects
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-secondary leading-relaxed">
            Energy disruptions don&apos;t stop at the pump. Track how oil price shocks
            ripple through fertilizer, food, transport, and household budgets
            across the Philippine economy.
          </p>
        </section>

        {/* Cascade content */}
        <CascadeSection />
      </main>

      <Footer />
    </div>
  );
}
