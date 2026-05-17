import type { Metadata } from 'next';
import { decodeScenario } from '@/lib/scenario-url';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { EmbedScenarioCard } from './EmbedScenarioCard';

export const metadata: Metadata = {
  title: 'PH Oil — Modeled Scenario',
  robots: { index: false, follow: false },
};

interface EmbedScenarioPageProps {
  searchParams: { s?: string };
}

export default function EmbedScenarioPage({ searchParams }: EmbedScenarioPageProps) {
  const params = decodeScenario(searchParams.s ?? null);
  // Touch the engine here too so a malformed `s` is caught server-side before render.
  calculatePumpPrice(params);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmbedScenarioCard params={params} />
    </main>
  );
}
