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

      <main className="px-4 sm:px-6 py-6">
        <PrimerHero />
        <SupplyChainFlow />
        <div className="max-w-4xl mx-auto">
          <CrudeOilTypes />
        </div>
      </main>

      <Footer />
    </div>
  );
}
