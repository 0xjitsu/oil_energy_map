'use client';

import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PrimerHero } from '@/components/primer/PrimerHero';
import { SupplyChainFlow } from '@/components/primer/SupplyChainFlow';
import { CrudeOilTypes } from '@/components/primer/CrudeOilTypes';

export function PrimerPage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <Header showTicker={false} />

      <main id="main-content" tabIndex={-1} className="px-4 sm:px-6 py-6">
        <PrimerHero />
        <SupplyChainFlow />
        <div className="max-w-4xl mx-auto">
          <CrudeOilTypes />
        </div>
        <div className="mt-12 glass-card px-6 py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
            Next
          </p>
          <p className="text-text-body mb-4">
            You&apos;ve seen how oil reaches the Philippines. Now see what a price shock costs a family.
          </p>
          <a
            href="/cascade"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-petron hover:text-text-primary transition-colors"
          >
            See the cost cascade →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
