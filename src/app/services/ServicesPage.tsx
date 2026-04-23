// src/app/services/ServicesPage.tsx
'use client';

import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { ServicesHero } from '@/components/services/ServicesHero';
import { SavingsOpportunity } from '@/components/services/SavingsOpportunity';
import { BeforeAfter } from '@/components/services/BeforeAfter';
import { Pipeline } from '@/components/services/Pipeline';
import { PlatformFeatures } from '@/components/services/PlatformFeatures';
import { ServicesCTA } from '@/components/services/ServicesCTA';

export function ServicesPage() {
  return (
    <>
      <ScrollProgress />
      <ServicesHero />
      <SavingsOpportunity />
      <BeforeAfter />
      <Pipeline />
      <PlatformFeatures />
      <ServicesCTA />
    </>
  );
}
