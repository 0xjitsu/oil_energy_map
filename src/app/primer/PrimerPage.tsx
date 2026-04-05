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

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <PrimerHero />
        <SupplyChainFlow />
        <CrudeOilTypes />
      </main>

      <Footer />
    </div>
  );
}
